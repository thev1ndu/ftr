import os
import logging
from fastapi import FastAPI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import json
from ai.agent import get_agent, get_system_message

# Configure Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("fraud_service.log")
    ]
)

logger = logging.getLogger(__name__)

from models import Transaction
# from engine import basic_rule_check <--- DEPRECATED



app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logger.info("Fraud Detection Service Starting up...")

@app.post("/scan")
async def scan_transaction(transaction: Transaction):
    logger.info(f"Received transaction scan request: {transaction.transaction_id}")
    
    # Unified AI evaluation (Analysis + Recording + Decision)
    result = await evaluate_transaction(transaction)
    
    logger.info(f"AI Evaluation Result for {transaction.transaction_id}: {result}")

    return {
        "transaction_id": transaction.transaction_id,
        "ai_decision": result
    }

async def evaluate_transaction(transaction):
    """
    Unified entry point for AI transaction analysis.
    Interacts with the stateful agent to get a decision based on:
    1. Frequency (Velocity)
    2. Patterns (Rules/Heuristics)
    3. History (Memory)
    """
    session_id = transaction.from_account
    logger.info(f"Evaluating transaction {transaction.transaction_id} for account: {session_id}")

    try:
        transaction_summary = _format_transaction(transaction)
        
        agent = get_agent()
        config = {"configurable": {"thread_id": session_id}}
        
        # We invoke the agent with the user's transaction details.
        # The agent instructions (System Message) now handle everything.
        
        # We need to make sure the system message is set for new threads.
        # But 'react' agents usually manage their own prompt?
        # create_react_agent uses the 'messages' correctly.
        
        messages = [get_system_message(), ("user", f"Analyze this transaction: {transaction_summary}")]
        
        # Invoke the graph
        result = agent.invoke(
            {"messages": messages}, 
            config=config
        )
        
        # Extract the last message content (Agent's final response)
        output_text = result["messages"][-1].content
        logger.info(f"Agent raw response: {output_text}")

        return _parse_json_response(output_text)

    except Exception as e:
        logger.error(f"Error during AI evaluation: {e}", exc_info=True)
        return {
            "decision": "REVIEW",
            "confidence": 50,
            "reason": f"AI System Error: {str(e)}"
        }

def _parse_json_response(output_text):
    try:
        # Clean markdown code blocks if present
        if "```json" in output_text:
            output_text = output_text.split("```json")[1].split("```")[0].strip()
        elif "```" in output_text:
            output_text = output_text.split("```")[1].strip()
            
        return json.loads(output_text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse agent JSON response: {e}")
        return {
            "decision": "REVIEW",
            "confidence": 60,
            "reason": "AI parsing fallback - Invalid JSON"
        }




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