from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.api.v1 import api_router
import logging

# Load Settings
settings = get_settings()

# Configure Logging
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Fraud Detection Service Starting up...")


@app.get("/health")
async def root_health():
    """Health at root for load balancers and existing systems."""
    return {"status": "ok", "service": "fraud-middleware"}


app.include_router(api_router, prefix="/api/v1")
# Backward compatibility or root alias helper
app.include_router(api_router) 
