from fastapi import APIRouter, HTTPException
from app.models.transaction import TransactionScanRequest
from app.services.fraud.service import evaluate_transaction
from app.services.transaction_middleware.middleware import run_transaction_middleware
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/scan")
async def scan_transaction(body: TransactionScanRequest):
    """
    Process transaction through middleware (limits + OTP) then fraud engine.
    Limits and OTP are enforced first; no way to bypass by sending lower amount.
    """
    transaction = body.to_transaction()
    logger.info(f"Received transaction scan request: {transaction.transaction_id}")

    # --- Transaction middleware: limits + OTP (before fraud scan) ---
    mw_result = run_transaction_middleware(transaction, otp=body.otp)
    if not mw_result.allowed:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": mw_result.error_code,
                "message": mw_result.message,
                "account_type": mw_result.account_type,
                "single_tx_limit": mw_result.single_tx_limit,
                "daily_limit": mw_result.daily_limit,
                "daily_used": mw_result.daily_used,
            },
        )

    # --- Fraud evaluation (only after middleware allows) ---
    result = await evaluate_transaction(transaction)
    logger.info(f"AI Evaluation Result for {transaction.transaction_id}: {result}")

    return {
        "transaction_id": transaction.transaction_id,
        "ai_decision": result,
        "account_type": mw_result.account_type,
    }
