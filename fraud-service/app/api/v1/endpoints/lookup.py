from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from datetime import datetime
from app.services.fraud.history import history_service

router = APIRouter()

class TransactionHistoryItem(BaseModel):
    transaction_id: str
    from_account: str
    to_account: str
    amount: float
    timestamp: str
    decision: str
    risk_score: float
    reason: str

@router.get("/lookup/{account_id}", response_model=List[TransactionHistoryItem])
async def lookup_history(account_id: str):
    """
    Get transaction history for a specific account.
    """
    try:
        history = history_service.get_account_history(account_id)
        # Convert datetime objects to string if necessary, though Pydantic usually handles it
        # history_service returns dicts, ensuring compatibility
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
