import logging
import json
from app.models.transaction import Transaction
from app.services.fraud.engine import basic_rule_check
from app.services.fraud.ai.tools import _check_beneficiary_history_logic
from app.services.fraud.ai.agent import get_agent, get_system_message
from app.services.fraud.ai.memory import SQLiteMemory
from app.utils.helpers import format_transaction

logger = logging.getLogger(__name__)

async def evaluate_transaction(transaction: Transaction):
    """
    Hybrid Logic:
    1. Static Rules (engine.py) - Zero Cost
    2. History Check (DB) - Low Cost
    3. AI Agent - High Cost (Only if needed)
    """
    session_id = transaction.from_account
    logger.info(f"Evaluating transaction {transaction.transaction_id} for account: {session_id}")

    try:
        # --- STEP 1: STATIC RULES (Zero Cost) ---
        rule_decision, rule_score = basic_rule_check(transaction)
        
        # Fast Track: If it's a clear block, stop here.
        if rule_decision == "BLOCK":
            logger.info(f"Fast Track BLOCK: Score {rule_score}")
            return {
                "decision": "BLOCK",
                "score": 100, # High Risk
                "reason": "Flagged by static security rules (High Risk Pattern)."
            }

        # --- STEP 2: HISTORY CHECK (Low Cost) ---
        # Check if beneficiary is trusted (allow low amounts if trusted)
        history_result = _check_beneficiary_history_logic(transaction.from_account, transaction.to_account)
        has_history = "History Found" in history_result
        
        # PASS Condition: Low Amount + (Trusted Beneficiary OR Very Low Amount) + No Rule Flags
        is_low_amount = transaction.amount < 100
        is_micro_amount = transaction.amount < 25
        
        if rule_decision == "ALLOW":
            if has_history and is_low_amount:
                logger.info("Fast Track ALLOW: Trusted History + Low Amount")
                return {
                    "decision": "ALLOW",
                    "score": 5, # Low Risk
                    "reason": "Trusted beneficiary with significant history. Fast-tracked."
                }
            
            if is_micro_amount:
                logger.info("Fast Track ALLOW: Micro Transaction")
                return {
                    "decision": "ALLOW",
                    "score": 1, # Very Low Risk
                    "reason": "Micro-transaction within safe limits. Fast-tracked."
                }

        # --- STEP 3: AI AGENT (High Cost - Escalate) ---
        logger.info("Escalating to AI Agent...")
        transaction_summary = format_transaction(transaction)
        
        agent = get_agent()
        config = {"configurable": {"thread_id": session_id}}
        
        # Add context about why it was escalated
        context = ""
        if not has_history:
            context += "[Note: New Beneficiary] "
        if rule_score > 0:
            context += f"[Note: Rule Score {rule_score}] "
            
        user_message_content = f"Analyze this transaction: {transaction_summary}. Context: {context}"
        messages = [get_system_message(), ("user", user_message_content)]
        
        # Invoke the graph
        result = await agent.ainvoke(
            {"messages": messages}, 
            config=config
        )
        
        # Extract the last message content (Agent's final response)
        output_text = result["messages"][-1].content
        logger.info(f"Agent raw response: {output_text}")
        
        # --- PERSISTENCE LAYER ---
        db = SQLiteMemory()
        # Save the transaction (User message)
        db.add_message(session_id, "user", user_message_content)
        # Save the AI response
        db.add_message(session_id, "assistant", output_text)
        # -------------------------

        return _parse_json_response(output_text)

    except Exception as e:
        logger.error(f"Error during AI evaluation: {e}", exc_info=True)
        return {
            "decision": "REVIEW",
            "score": 50, # Medium Risk Error
            "reason": f"System Error: {str(e)}"
        }

def _parse_json_response(output_text):
    try:
        # Clean markdown code blocks if present
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
