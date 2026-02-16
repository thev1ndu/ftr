"""
Middleware endpoints for integrating the fraud service into existing systems.
Call these from your existing payment/transfer pipeline to get allow/review/block decisions.
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

from app.models.transaction import TransactionScanRequest
from app.services.fraud.service import evaluate_transaction
from app.services.transaction_middleware.middleware import run_transaction_middleware

router = APIRouter(prefix="/middleware", tags=["middleware"])
logger = logging.getLogger(__name__)


# --- Request: same shape for both endpoints; existing systems send transaction payload ---
class MiddlewareTransactionRequest(BaseModel):
    """Transaction payload for middleware. Use ISO8601 for timestamp (e.g. 2025-02-16T12:00:00Z)."""
    transaction_id: str = Field(..., description="Unique id for this transaction")
    from_account: str = Field(..., description="Debit / payer account id")
    to_account: str = Field(..., description="Credit / beneficiary account id")
    amount: float = Field(..., gt=0, description="Transfer amount")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Transaction time (default: now)")
    ip_address: str = Field("", description="Client IP (optional)")
    device_id: str = Field("", description="Device or user-agent (optional)")
    otp: Optional[str] = Field(None, description="Required for /check when amount exceeds threshold")


# --- Response schemas for integration docs and consistency ---
class MiddlewareDecisionResponse(BaseModel):
    """Standard decision response returned to existing systems."""
    transaction_id: str
    decision: str = Field(..., description="ALLOW | REVIEW | BLOCK | PENDING_REVIEW")
    score: int = Field(..., ge=0, le=100, description="Risk score 0-100")
    reason: str = Field("", description="Human-readable reason")
    account_type: Optional[str] = Field(None, description="Set for /check when limits applied")
    anomalies: Optional[List[str]] = None
    patterns: Optional[List[str]] = None
    anti_patterns: Optional[List[str]] = None


class MiddlewareLimitError(BaseModel):
    """Returned when limits or OTP fail (400)."""
    error_code: str
    message: str
    account_type: Optional[str] = None
    single_tx_limit: Optional[float] = None
    daily_limit: Optional[float] = None
    daily_used: Optional[float] = None


def _to_scan_request(body: MiddlewareTransactionRequest) -> TransactionScanRequest:
    return TransactionScanRequest(
        transaction_id=body.transaction_id,
        from_account=body.from_account,
        to_account=body.to_account,
        amount=body.amount,
        timestamp=body.timestamp,
        ip_address=body.ip_address or "0.0.0.0",
        device_id=body.device_id or "unknown",
        otp=body.otp,
    )


def _to_decision_response(transaction_id: str, ai_result: dict, account_type: Optional[str] = None) -> MiddlewareDecisionResponse:
    return MiddlewareDecisionResponse(
        transaction_id=transaction_id,
        decision=ai_result.get("decision", "REVIEW"),
        score=int(ai_result.get("score", 50)),
        reason=ai_result.get("reason", ""),
        account_type=account_type,
        anomalies=ai_result.get("anomalies"),
        patterns=ai_result.get("patterns"),
        anti_patterns=ai_result.get("anti_patterns"),
    )


@router.post(
    "/check",
    response_model=MiddlewareDecisionResponse,
    summary="Full pipeline (limits + OTP + fraud)",
    description="Run limits, OTP (if required), then fraud engine. Use when the fraud service owns limits and OTP.",
)
async def middleware_check(body: MiddlewareTransactionRequest):
    """
    Single entry point for existing systems: send a transaction, get allow/review/block.
    Enforces account limits and OTP before fraud evaluation. Returns 400 with
    structured error if limits exceeded or OTP missing/invalid.
    """
    req = _to_scan_request(body)
    transaction = req.to_transaction()
    logger.info(f"Middleware check: {transaction.transaction_id}")

    mw_result = run_transaction_middleware(transaction, otp=body.otp)
    if not mw_result.allowed:
        raise HTTPException(
            status_code=400,
            detail=MiddlewareLimitError(
                error_code=mw_result.error_code,
                message=mw_result.message,
                account_type=mw_result.account_type,
                single_tx_limit=mw_result.single_tx_limit,
                daily_limit=mw_result.daily_limit,
                daily_used=mw_result.daily_used,
            ).model_dump(exclude_none=True),
        )

    result = await evaluate_transaction(transaction)
    return _to_decision_response(transaction.transaction_id, result, account_type=mw_result.account_type)


@router.post(
    "/evaluate",
    response_model=MiddlewareDecisionResponse,
    summary="Fraud-only evaluation",
    description="Run only the fraud engine. Use when your system already enforces limits and auth.",
)
async def middleware_evaluate(body: MiddlewareTransactionRequest):
    """
    Fraud evaluation only: no limits, no OTP. For existing systems that already
    enforce limits and authentication; they call this to get a fraud decision.
    """
    req = _to_scan_request(body)
    transaction = req.to_transaction()
    logger.info(f"Middleware evaluate: {transaction.transaction_id}")

    result = await evaluate_transaction(transaction)
    return _to_decision_response(transaction.transaction_id, result)
