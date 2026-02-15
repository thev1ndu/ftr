from fastapi import APIRouter
from app.api.v1.endpoints import scan, review, lookup, config

api_router = APIRouter()
api_router.include_router(scan.router, tags=["fraud"])
api_router.include_router(review.router, tags=["review"])
api_router.include_router(lookup.router, tags=["lookup"])
api_router.include_router(config.router)
