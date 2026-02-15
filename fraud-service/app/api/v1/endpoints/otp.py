from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.transaction_middleware import otp_store as otp_store_module
from app.services.transaction_middleware.account_limits import OTP_REQUIRED_AMOUNT_THRESHOLD

router = APIRouter()


class RequestOtpBody(BaseModel):
    transaction_id: str
    from_account: str
    amount: float = 0  # optional, for UX message


@router.post("/otp/request")
async def request_otp_code(body: RequestOtpBody):
    """
    Request OTP for a transaction. In production would send via SMS/email.
    For demo we return the code in the response so the app can show it (e.g. "Your code: 123456").
    """
    code = otp_store_module.request_otp(body.transaction_id, body.from_account)
    return {
        "transaction_id": body.transaction_id,
        "message": "OTP generated. For demo it is returned here; in production it would be sent to your registered device.",
        "otp_demo": code,
        "expires_in_seconds": 300,
        "otp_required_threshold": OTP_REQUIRED_AMOUNT_THRESHOLD,
    }
