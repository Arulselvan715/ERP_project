from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services.dashboard_service import get_dashboard_data

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
async def dashboard(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await get_dashboard_data(db)
