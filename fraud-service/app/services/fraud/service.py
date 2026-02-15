import logging
import json
from app.models.transaction import Transaction
from app.services.fraud.engine import basic_rule_check, pattern_check, detect_anomalies_and_patterns
from app.services.fraud.ai.tools import _check_beneficiary_history_logic
from app.services.fraud.ai.agent import workflow, get_system_message
from app.services.fraud.ai.memory import SQLiteMemory
from app.core.config import get_settings
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

        # --- STEP 2: PATTERN ANALYSIS (past transactions, velocity, new beneficiary, amount spike) ---
        pattern_stats = history_service.get_pattern_stats(
            transaction.from_account, transaction.to_account
        )
        pattern_decision, pattern_score, pattern_reasons = pattern_check(transaction, pattern_stats)

        # --- STEP 2b: ANOMALY DETECTION & PATTERNS / ANTI-PATTERNS ---
        anomaly_stats = history_service.get_anomaly_stats(
            transaction.from_account, transaction.to_account
        )
        anomaly_score_delta, anomalies, patterns, anti_patterns = detect_anomalies_and_patterns(
            transaction, anomaly_stats
        )
        pattern_score_with_anomaly = pattern_score + anomaly_score_delta
        if pattern_decision == "ALLOW" and anomaly_score_delta >= 50:
            pattern_decision = "REVIEW"
        if pattern_decision == "ALLOW" and anomaly_score_delta >= 80:
            pattern_decision = "BLOCK"

        combined_score = max(rule_score, pattern_score_with_anomaly)
        combined_decision = rule_decision
        if pattern_decision == "BLOCK" or (pattern_decision == "REVIEW" and combined_decision == "ALLOW"):
            combined_decision = pattern_decision
        if rule_decision == "BLOCK":
            combined_decision = "BLOCK"
        if pattern_decision == "BLOCK":
            combined_decision = "BLOCK"

        if combined_decision == "BLOCK":
            logger.info(
                f"BLOCK flagged (Rule score {rule_score}, Pattern score {pattern_score_with_anomaly}). "
                f"Pattern reasons: {pattern_reasons}; Anomalies: {anomalies}; Anti-patterns: {anti_patterns}"
            )

        # --- STEP 3: HISTORY CHECK (Low Cost) ---
        history_result = _check_beneficiary_history_logic(transaction.from_account, transaction.to_account)
        has_history = "History Found" in history_result

        is_low_amount = transaction.amount < 100
        is_micro_amount = transaction.amount < 25
        high_velocity = pattern_stats.get("recent_count_10m", 0) >= 5

        def _enrich_result(r):
            out = dict(r)
            if anomalies:
                out["anomalies"] = anomalies
            if patterns:
                out["patterns"] = patterns
            if anti_patterns:
                out["anti_patterns"] = anti_patterns
            return out

        # Fast-track ALLOW only when rules and patterns allow and no high velocity
        if combined_decision == "ALLOW" and not high_velocity:
            if has_history and is_low_amount:
                logger.info("Fast Track ALLOW: Trusted History + Low Amount")
                result = _enrich_result({
                    "decision": "ALLOW",
                    "score": 5,
                    "reason": "Trusted beneficiary with significant history. Fast-tracked."
                })
                history_service.log_transaction(transaction, result)
                return result

            if is_micro_amount:
                logger.info("Fast Track ALLOW: Micro Transaction")
                result = _enrich_result({
                    "decision": "ALLOW",
                    "score": 1,
                    "reason": "Micro-transaction within safe limits. Fast-tracked."
                })
                history_service.log_transaction(transaction, result)
                return result

        # If rules or patterns say BLOCK with high confidence, return immediately (no AI needed)
        if combined_decision == "BLOCK" and (rule_score >= 80 or pattern_score_with_anomaly >= 80):
            reason_parts = [r for r in pattern_reasons if r]
            if rule_score >= 80:
                reason_parts.append("Static rules: high risk (amount/device/self-transfer).")
            if anti_patterns:
                reason_parts.extend(anti_patterns)
            if anomalies:
                reason_parts.extend(anomalies)
            result = _enrich_result({
                "decision": "BLOCK",
                "score": min(combined_score, 100),
                "reason": " ".join(reason_parts) if reason_parts else "Pattern and rule analysis: high risk."
            })
            history_service.log_transaction(transaction, result)
            return result

        # --- STEP 4: AI AGENT (High Cost - Escalate) ---
        logger.info("Escalating to AI Agent...")
        transaction_summary = format_transaction(transaction)

        config = {"configurable": {"thread_id": session_id}}

        context = ""
        if not has_history:
            context += "[Note: New Beneficiary] "
        if pattern_stats.get("recent_count_10m", 0) >= 3:
            context += f"[Note: Velocity: {pattern_stats['recent_count_10m']} tx in last 10 min] "
        if pattern_reasons:
            context += f"[Pattern flags: {'; '.join(pattern_reasons)}] "
        if anomalies:
            context += f"[Anomalies: {'; '.join(anomalies)}] "
        if anti_patterns:
            context += f"[Anti-patterns: {'; '.join(anti_patterns)}] "
        if patterns:
            context += f"[Patterns: {'; '.join(patterns)}] "
        if rule_score > 0:
            context += f"[Rule Score {rule_score}] "
        if combined_decision == "BLOCK":
            context += "[URGENT: RULES/PATTERNS FLAGGED AS BLOCK] "

        user_message_content = f"Analyze this transaction: {transaction_summary}. Context: {context}"
        
        initial_state = {
            "messages": [get_system_message(), HumanMessage(content=user_message_content)],
            "transaction_id": transaction.transaction_id,
            "risk_score": 0,
            "decision": "UNKNOWN",
            "feedback": ""
        }
        
        # Use AsyncSqliteSaver (path from config so one DB regardless of cwd)
        settings = get_settings()
        async with AsyncSqliteSaver.from_conn_string(settings.CHECKPOINTS_DB_PATH) as checkpointer:
            agent = workflow.compile(checkpointer=checkpointer, interrupt_before=["human_review"])
            
            final_state = await agent.ainvoke(initial_state, config=config)
            
            # Check for interruption
            state_snapshot = await agent.aget_state(config)
            next_steps = state_snapshot.next
            
            if next_steps and "human_review" in next_steps:
                 logger.info(f"Transaction {transaction.transaction_id} paused for Human Review.")
                 last_message_content = state_snapshot.values["messages"][-1].content
                 parsed_result = _parse_json_response(last_message_content)
                 pending_result = _enrich_result({
                     "decision": "PENDING_REVIEW",
                     "score": parsed_result.get("score", 85),
                     "reason": parsed_result.get("reason", "High Risk transaction flagged for Manual Review.")
                 })
                 history_service.log_transaction(transaction, pending_result)
                 return pending_result
            
            output_text = final_state["messages"][-1].content
            logger.info(f"Agent raw response: {output_text}")
        
        # --- PERSISTENCE LAYER ---
        db = SQLiteMemory()
        db.add_message(session_id, "user", user_message_content)
        db.add_message(session_id, "assistant", output_text)
        # -------------------------

        result = _parse_json_response(output_text)
        result = _enrich_result(result)
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
