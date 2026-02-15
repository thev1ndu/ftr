"""
Transaction middleware: runs before the fraud engine. Ensures:
1. Account-type limits (single-tx and daily) are enforced — no bypass by sending lower amount.
2. OTP is required and valid when policy says so (e.g. above amount threshold).

All checks happen before evaluate_transaction is called.
"""
import logging
from dataclasses import dataclass
from typing import Optional

from app.models.transaction import Transaction
from app.services.fraud.history import history_service
from app.services.transaction_middleware.account_limits import (
    get_limits_for_account,
    OTP_REQUIRED_AMOUNT_THRESHOLD,
)
from app.services.transaction_middleware.otp_store import verify_otp, otp_required_for_amount

logger = logging.getLogger(__name__)


@dataclass
class MiddlewareResult:
    """Result of running transaction middleware."""
    allowed: bool
    error_code: str  # e.g. "LIMIT_EXCEEDED", "OTP_REQUIRED", "OTP_INVALID"
    message: str
    account_type: Optional[str] = None
    single_tx_limit: Optional[float] = None
    daily_limit: Optional[float] = None
    daily_used: Optional[float] = None


def run_transaction_middleware(
    transaction: Transaction,
    otp: Optional[str] = None,
) -> MiddlewareResult:
    """
    Run limit and OTP checks. Call this before evaluate_transaction.
    Returns MiddlewareResult; if allowed is False, do not proceed to fraud scan.
    """
    from_account = transaction.from_account
    amount = transaction.amount
    limits = get_limits_for_account(from_account)
    single_tx_limit = limits["single_tx_limit"]
    daily_limit = limits["daily_limit"]
    account_type = limits["account_type"]

    # 1) Enforce single-transaction limit (cannot bypass by lowering amount — we check actual amount)
    if amount > single_tx_limit:
        logger.warning(
            f"Transaction {transaction.transaction_id} rejected: amount {amount} exceeds "
            f"single_tx_limit {single_tx_limit} for account type {account_type}"
        )
        return MiddlewareResult(
            allowed=False,
            error_code="LIMIT_EXCEEDED",
            message=f"Amount ${amount:,.2f} exceeds your single-transaction limit of ${single_tx_limit:,.2f} ({account_type} account).",
            account_type=account_type,
            single_tx_limit=single_tx_limit,
            daily_limit=daily_limit,
        )

    # 2) Enforce daily limit (use actual history so you cannot bypass by splitting)
    daily_used = history_service.get_daily_outbound_total(from_account)
    if daily_used + amount > daily_limit:
        logger.warning(
            f"Transaction {transaction.transaction_id} rejected: daily total would be "
            f"{daily_used + amount} (limit {daily_limit}) for {from_account}"
        )
        return MiddlewareResult(
            allowed=False,
            error_code="DAILY_LIMIT_EXCEEDED",
            message=f"Daily limit would be exceeded. Used: ${daily_used:,.2f}, limit: ${daily_limit:,.2f}. This transfer: ${amount:,.2f}.",
            account_type=account_type,
            single_tx_limit=single_tx_limit,
            daily_limit=daily_limit,
            daily_used=daily_used,
        )

    # 3) OTP required for amounts >= threshold
    if otp_required_for_amount(amount):
        if not otp or not otp.strip():
            return MiddlewareResult(
                allowed=False,
                error_code="OTP_REQUIRED",
                message=f"OTP is required for transactions of ${OTP_REQUIRED_AMOUNT_THRESHOLD:,.2f} or more. Please request and enter OTP.",
                account_type=account_type,
                single_tx_limit=single_tx_limit,
                daily_limit=daily_limit,
                daily_used=daily_used,
            )
        if not verify_otp(transaction.transaction_id, otp.strip(), from_account):
            return MiddlewareResult(
                allowed=False,
                error_code="OTP_INVALID",
                message="Invalid or expired OTP. Please request a new code and try again.",
                account_type=account_type,
                single_tx_limit=single_tx_limit,
                daily_limit=daily_limit,
                daily_used=daily_used,
            )

    return MiddlewareResult(
        allowed=True,
        error_code="",
        message="",
        account_type=account_type,
        single_tx_limit=single_tx_limit,
        daily_limit=daily_limit,
        daily_used=daily_used,
    )
