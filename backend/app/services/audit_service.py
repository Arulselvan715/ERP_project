from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog


async def create_audit_log(
    db: AsyncSession,
    user_id: int | None,
    module: str,
    action: str,
    details: str | None = None,
    entity_id: int | None = None,
):
    log = AuditLog(
        user_id=user_id,
        module=module,
        action=action,
        details=details,
        entity_id=entity_id,
    )
    db.add(log)
    await db.flush()
    return log
