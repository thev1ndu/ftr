from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.transaction_middleware.account_limits import (
    get_limits_for_account,
    set_account_type,
    ACCOUNT_TYPE_LIMITS,
    OTP_REQUIRED_AMOUNT_THRESHOLD,
)
from app.services.fraud.history import history_service

router = APIRouter()


class SetAccountTypeBody(BaseModel):
    account_type: str  # SAVINGS | CHECKING | PREMIUM


@router.get("/limits/{account_id}")
async def get_account_limits(account_id: str):
    """
    Return account type and limits for display (e.g. "Your limit: $5,000 per transaction").
    Used by frontend to show limits and daily used.
    """
    limits = get_limits_for_account(account_id)
    daily_used = history_service.get_daily_outbound_total(account_id)
    return {
        "account_id": account_id,
        "account_type": limits["account_type"],
        "single_tx_limit": limits["single_tx_limit"],
        "daily_limit": limits["daily_limit"],
        "daily_used": daily_used,
        "daily_remaining": max(0, limits["daily_limit"] - daily_used),
        "otp_required_above": OTP_REQUIRED_AMOUNT_THRESHOLD,
        "account_types_info": ACCOUNT_TYPE_LIMITS,
    }


@router.put("/limits/{account_id}/type")
async def set_account_type_endpoint(account_id: str, body: SetAccountTypeBody):
    """Set account type for an account (e.g. SAVINGS, CHECKING, PREMIUM). Used in settings."""
    try:
        set_account_type(account_id, body.account_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"message": str(e)})
    return get_limits_for_account(account_id)
