from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.connection import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get("/", response_model=dict)
async def list_audit_logs(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
    module: str | None = None,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    query = select(AuditLog)
    if module:
        query = query.where(AuditLog.module == module)
    query = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    count_q = select(func.count(AuditLog.id))
    if module:
        count_q = count_q.where(AuditLog.module == module)
    total = (await db.execute(count_q)).scalar()

    data = []
    for log in logs:
        data.append({
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user.name if log.user else "System",
            "module": log.module,
            "action": log.action,
            "details": log.details,
            "entity_id": log.entity_id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        })
    return {"data": data, "total": total}
