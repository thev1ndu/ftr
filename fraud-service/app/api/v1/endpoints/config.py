from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.fraud.config_store import get_all, get, update, DEFAULTS

router = APIRouter(prefix="/config", tags=["config"])


class ConfigUpdate(BaseModel):
    round_amount_tolerance: Optional[float] = None
    unusual_hour_min_tx: Optional[int] = None
    structuring_min_tx: Optional[int] = None
    structuring_new_beneficiary_bonus: Optional[int] = None
    off_hours_score: Optional[int] = None
    round_amount_score: Optional[int] = None
    recurring_beneficiary_min: Optional[int] = None
    velocity_block_threshold: Optional[int] = None
    velocity_review_threshold: Optional[int] = None
    velocity_warn_threshold: Optional[int] = None
    new_beneficiary_high_amount: Optional[float] = None
    new_beneficiary_med_amount: Optional[float] = None
    new_beneficiary_low_amount: Optional[float] = None
    amount_spike_multiplier_avg: Optional[float] = None
    amount_spike_multiplier_max: Optional[float] = None
    min_transactions_for_avg: Optional[int] = None


@router.get("")
async def get_config():
    """
    Fetch the single config row: all columns for engine thresholds.
    """
    try:
        return get_all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{key}")
async def get_config_key(key: str):
    """
    Fetch a single column value by key.
    """
    if key not in DEFAULTS:
        raise HTTPException(status_code=404, detail=f"Unknown config key: {key}")
    try:
        value = get(key)
        return {"key": key, "value": value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("")
async def put_config(body: ConfigUpdate):
    """
    Update one or more config columns. Returns the full config row after update.
    """
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        return get_all()
    try:
        return update(updates)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
