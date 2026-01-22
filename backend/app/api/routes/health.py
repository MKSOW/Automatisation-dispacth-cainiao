"""Health-check endpoints."""
from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", summary="Simple liveness probe")
def get_health():
    return {"status": "ok"}


@router.get("/db", summary="Database connectivity probe")
def get_db_health():
    with get_db() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok", "database": True}
