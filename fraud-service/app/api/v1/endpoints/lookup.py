from fastapi import APIRouter, HTTPException
from typing import List, Any, Dict
from pydantic import BaseModel
from app.services.fraud.history import history_service
from app.services.fraud.indicators_agent import get_account_indicators

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
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lookup/{account_id}/indicators")
async def lookup_account_indicators(account_id: str) -> Dict[str, Any]:
    """
    Run the LangChain indicators agent for this account. Returns limits, how triggers
    work, current indicators (vs thresholds), safe patterns, anti-patterns, and whether
    the account is at risk.
    """
    try:
        return await get_account_indicators(account_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
