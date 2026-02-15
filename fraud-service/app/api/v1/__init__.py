from fastapi import APIRouter
from app.api.v1.endpoints import scan, review

api_router = APIRouter()
api_router.include_router(scan.router, tags=["fraud"])
api_router.include_router(review.router, tags=["review"])
