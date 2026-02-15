from ai.agent import get_agent, get_system_message
import json
import logging

logger = logging.getLogger(__name__)

def ai_review(transaction, base_score):
    """
    Orchestrates the AI review process for a suspicious transaction.
    Interacts with the stateful agent to get a decision.
    """
    logger.info(f"Starting AI review for transaction {transaction.transaction_id}")

    # Optimization: specific low score check moved here or kept in engine?
    # User's snippet had it here.
    if base_score < 40:
        logger.info(f"Score {base_score} below threshold, auto-approving.")
        return {
            "decision": "ALLOW",
            "confidence": 85,
            "reason": "Low risk score"
        }

    session_id = transaction.from_account
    logger.info(f"Initializing agent for session (account): {session_id}")

    try:
        transaction_summary = _format_transaction(transaction)
        
        logger.debug(f"Invoking agent with summary: {transaction_summary}")
        
        agent = get_agent()
        config = {"configurable": {"thread_id": session_id}}
        
        # Invoke the graph
        # We need to pass the system prompt if it's a new thread, or just the user message
        # create_react_agent can take a 'messages' key
        
        result = agent.invoke(
            {"messages": [get_system_message(), ("user", transaction_summary)]}, 
            config=config
        )
        
        # Extract the last message content (Agent's final response)
        output_text = result["messages"][-1].content
        logger.info(f"Agent raw response: {output_text}")

        # Clean validation of JSON
        try:
            # Sometimes agents wrap JSON in markdown blocks ```json ... ```
            if "```json" in output_text:
                output_text = output_text.split("```json")[1].split("```")[0].strip()
            elif "```" in output_text:
                output_text = output_text.split("```")[1].strip()
                
            parsed = json.loads(output_text)
            return parsed
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse agent JSON response: {e}")
            return {
                "decision": "REVIEW",
                "confidence": 60,
                "reason": "AI parsing fallback - Invalid JSON"
            }
            
    except Exception as e:
        logger.error(f"Error during AI review execution: {e}", exc_info=True)
        return {
            "decision": "REVIEW",
            "confidence": 50,
            "reason": f"AI System Error: {str(e)}"
        }

def record_transaction(transaction):
    """
    Records a transaction to the agent's memory without triggering a full review.
    Essential for behavioral analysis (e.g. smurfing detection).
    """
    try:
        session_id = transaction.from_account
        
        # In LangGraph with MemorySaver, we can just 'invoke' with a user message 
        # but stop before executing? Or just execute and ignore output?
        # Ideally, we just add to state. 
        # But 'update_state' API is cleaner.
        
        agent = get_agent()
        config = {"configurable": {"thread_id": session_id}}
        
        summary = _format_transaction(transaction)
        message = f"Recorded Transaction: {summary}"
        
        # We can use update_state to inject a message pretending to be user
        # without triggering the LLM runs, OR just run it. 
        # Running it costs tokens. 
        # Let's use update_state if possible, or just invoke for now to be safe on API consistency.
        # Actually, let's just use invoke. It keeps the agent "aware" immediately.
        
        # Optimization: We can just use update_state to fetch config and update 'messages'
        # But for this demo, let's invoke and ignore response to ensure memory is updated nicely via standard path.
        
        agent.invoke(
            {"messages": [("user", message)]},
            config=config
        )
        
        logger.info(f"Recorded transaction {transaction.transaction_id} to memory for account {session_id}")
    except Exception as e:
        logger.error(f"Failed to record transaction to memory: {e}")

def _format_transaction(transaction):
    return f"""
    Transaction:
    ID: {transaction.transaction_id}
    From: {transaction.from_account}
    To: {transaction.to_account}
    Amount: {transaction.amount}
    Timestamp: {transaction.timestamp}
    IP: {transaction.ip_address}
    Device: {transaction.device_id}
    """
