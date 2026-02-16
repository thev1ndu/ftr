from fastapi import APIRouter
from app.api.v1.endpoints import scan, review, lookup, config, otp, limits, middleware, health

api_router = APIRouter()
api_router.include_router(scan.router, tags=["fraud"])
api_router.include_router(review.router, tags=["review"])
api_router.include_router(lookup.router, tags=["lookup"])
api_router.include_router(config.router)
api_router.include_router(otp.router, tags=["otp"])
api_router.include_router(limits.router, tags=["limits"])
api_router.include_router(middleware.router)
api_router.include_router(health.router)
