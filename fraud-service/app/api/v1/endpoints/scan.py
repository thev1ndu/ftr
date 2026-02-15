from fastapi import APIRouter
from app.models.transaction import Transaction
from app.services.fraud.service import evaluate_transaction
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/scan")
async def scan_transaction(transaction: Transaction):
    logger.info(f"Received transaction scan request: {transaction.transaction_id}")
    
    # Unified AI evaluation (Analysis + Recording + Decision)
    result = await evaluate_transaction(transaction)
    
    logger.info(f"AI Evaluation Result for {transaction.transaction_id}: {result}")

    return {
        "transaction_id": transaction.transaction_id,
        "ai_decision": result
    }
