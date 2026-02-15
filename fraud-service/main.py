import os
import logging
from fastapi import FastAPI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
from engine import basic_rule_check
# Import from the new services module
from services.ai_service import ai_review

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logger.info("Fraud Detection Service Starting up...")

@app.post("/scan")
async def scan_transaction(transaction: Transaction):
    logger.info(f"Received transaction scan request: {transaction.transaction_id}")
    
    
    # Import locally to avoid circular dependency if any, or just use the global import
    from services.ai_service import record_transaction
    
    # Record every transaction for behavioral analysis
    record_transaction(transaction)

    decision, score = basic_rule_check(transaction)
    logger.info(f"Basic rule check result: {decision}, Score: {score}")

    if decision == "ALLOW":
        logger.info(f"Transaction {transaction.transaction_id} allowed by basic rules.")
        return {
            "transaction_id": transaction.transaction_id,
            "decision": "ALLOW",
            "score": score,
            "reason": "Passed basic rules"
        }
    
    logger.info(f"Transaction {transaction.transaction_id} flagged for AI review.")
    ai_result = ai_review(transaction, score)
    
    logger.info(f"AI Review result for {transaction.transaction_id}: {ai_result}")

    return {
        "transaction_id": transaction.transaction_id,
        "ai_decision": ai_result
    }