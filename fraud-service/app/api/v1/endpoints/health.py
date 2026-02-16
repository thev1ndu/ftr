"""
Health and readiness endpoints for load balancers and existing systems.
"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """
    Liveness/readiness for existing systems and load balancers.
    Returns 200 when the service is up and can accept middleware requests.
    """
    return {"status": "ok", "service": "fraud-middleware"}
