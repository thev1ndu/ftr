import logging
import json
from app.models.transaction import Transaction
from app.services.fraud.engine import basic_rule_check
from app.services.fraud.ai.tools import _check_beneficiary_history_logic
from app.services.fraud.ai.agent import workflow, get_system_message
from app.services.fraud.ai.memory import SQLiteMemory
from app.utils.helpers import format_transaction
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from app.services.fraud.history import history_service

logger = logging.getLogger(__name__)

async def evaluate_transaction(transaction: Transaction):
    """
    Hybrid Logic with HITL
    """
    session_id = transaction.transaction_id
    logger.info(f"Evaluating transaction {transaction.transaction_id} for account: {transaction.from_account}")

    try:
        # --- STEP 1: STATIC RULES (Zero Cost) ---
        rule_decision, rule_score = basic_rule_check(transaction)
        
        if rule_decision == "BLOCK":
            logger.info(f"Fast Track BLOCK flagged (Score {rule_score}). Escalating to AI for HITL management.")

        # --- STEP 2: HISTORY CHECK (Low Cost) ---
        history_result = _check_beneficiary_history_logic(transaction.from_account, transaction.to_account)
        has_history = "History Found" in history_result
        
        is_low_amount = transaction.amount < 100
        is_micro_amount = transaction.amount < 25
        
        if rule_decision == "ALLOW":
            if has_history and is_low_amount:
                logger.info("Fast Track ALLOW: Trusted History + Low Amount")
                result = {
                    "decision": "ALLOW",
                    "score": 5,
                    "reason": "Trusted beneficiary with significant history. Fast-tracked."
                }
                history_service.log_transaction(transaction, result)
                return result
            
            if is_micro_amount:
                logger.info("Fast Track ALLOW: Micro Transaction")
                result = {
                    "decision": "ALLOW",
                    "score": 1,
                    "reason": "Micro-transaction within safe limits. Fast-tracked."
                }
                history_service.log_transaction(transaction, result)
                return result

        # --- STEP 3: AI AGENT (High Cost - Escalate) ---
        logger.info("Escalating to AI Agent...")
        transaction_summary = format_transaction(transaction)
        
        config = {"configurable": {"thread_id": session_id}}
        
        context = ""
        if not has_history:
            context += "[Note: New Beneficiary] "
        if rule_score > 0:
            context += f"[Note: Rule Score {rule_score}] "
        if rule_decision == "BLOCK":
            context += "[URGENT: STATIC RULES FLAGGED AS BLOCK] "
            
        user_message_content = f"Analyze this transaction: {transaction_summary}. Context: {context}"
        
        initial_state = {
            "messages": [get_system_message(), HumanMessage(content=user_message_content)],
            "transaction_id": transaction.transaction_id,
            "risk_score": 0,
            "decision": "UNKNOWN",
            "feedback": ""
        }
        
        # Use AsyncSqliteSaver
        async with AsyncSqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
            agent = workflow.compile(checkpointer=checkpointer, interrupt_before=["human_review"])
            
            final_state = await agent.ainvoke(initial_state, config=config)
            
            # Check for interruption
            state_snapshot = await agent.aget_state(config)
            next_steps = state_snapshot.next
            
            if next_steps and "human_review" in next_steps:
                 logger.info(f"Transaction {transaction.transaction_id} paused for Human Review.")
                 
                 last_message_content = state_snapshot.values["messages"][-1].content
                 parsed_result = _parse_json_response(last_message_content)
                 
                 return {
                     "decision": "PENDING_REVIEW",
                     "score": parsed_result.get("score", 85),
                     "reason": parsed_result.get("reason", "High Risk transaction flagged for Manual Review.")
                 }
            
            output_text = final_state["messages"][-1].content
            logger.info(f"Agent raw response: {output_text}")
        
        # --- PERSISTENCE LAYER ---
        db = SQLiteMemory()
        db.add_message(session_id, "user", user_message_content)
        db.add_message(session_id, "assistant", output_text)
        # -------------------------

        result = _parse_json_response(output_text)
        history_service.log_transaction(transaction, result)
        return result

    except Exception as e:
        logger.error(f"Error during AI evaluation: {e}", exc_info=True)
        return {
            "decision": "REVIEW",
            "score": 50,
            "reason": f"System Error: {str(e)}"
        }

def _parse_json_response(output_text):
    try:
        if "```json" in output_text:
            output_text = output_text.split("```json")[1].split("```")[0].strip()
        elif "```" in output_text:
            output_text = output_text.split("```")[1].strip()
            
        data = json.loads(output_text)
        
        if 'score' not in data:
            if data.get('decision') == 'BLOCK':
                data['score'] = 90
            elif data.get('decision') == 'ALLOW':
                data['score'] = 10
            else:
                data['score'] = 50

        return data
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse agent JSON response: {e}")
        return {
            "decision": "REVIEW",
            "score": 60,
            "reason": "AI parsing fallback - Invalid JSON"
        }
