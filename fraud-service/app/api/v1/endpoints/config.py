from fastapi import APIRouter, HTTPException
from app.services.fraud.store import get_all, get
from app.services.fraud.cfg import ENGINE_CONFIG

router = APIRouter(prefix="/config", tags=["config"])


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
    if key not in ENGINE_CONFIG:
        raise HTTPException(status_code=404, detail=f"Unknown config key: {key}")
    try:
        value = get(key)
        return {"key": key, "value": value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
