"""
Simple OTP store for transaction verification. In production this would trigger
SMS/email; for demo we generate a 6-digit code and allow verification by code.
TTL so old OTPs expire (e.g. 5 minutes).
"""
import random
import time
from typing import Optional

# transaction_id -> { "code": str, "expires_at": float }
_otp_store: dict[str, dict] = {}
OTP_TTL_SECONDS = 300  # 5 minutes


def request_otp(transaction_id: str, from_account: str) -> str:
    """Generate and store OTP for this transaction. Returns the code (for demo only)."""
    code = "".join(str(random.randint(0, 9)) for _ in range(6))
    _otp_store[transaction_id] = {
        "code": code,
        "from_account": from_account,
        "expires_at": time.time() + OTP_TTL_SECONDS,
    }
    return code


def verify_otp(transaction_id: str, code: str, from_account: str) -> bool:
    """Verify OTP for this transaction. Returns True if valid and matches account."""
    entry = _otp_store.get(transaction_id)
    if not entry:
        return False
    if time.time() > entry["expires_at"]:
        del _otp_store[transaction_id]
        return False
    if entry["from_account"] != from_account:
        return False
    if entry["code"] != code:
        return False
    # One-time use: consume OTP
    del _otp_store[transaction_id]
    return True


def otp_required_for_amount(amount: float) -> bool:
    """Whether OTP is required for this amount (e.g. above threshold)."""
    from app.services.transaction_middleware.account_limits import OTP_REQUIRED_AMOUNT_THRESHOLD
    return amount >= OTP_REQUIRED_AMOUNT_THRESHOLD
