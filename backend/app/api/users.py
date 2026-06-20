from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate
from app.auth.dependencies import get_current_user, require_roles
from app.services.audit_service import create_audit_log
from sqlalchemy import select, func

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=dict)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.business_owner])),
):
    result = await db.execute(select(User).order_by(User.id.desc()).offset(skip).limit(limit))
    users = result.scalars().all()
    total = (await db.execute(select(func.count(User.id)))).scalar()
    return {"data": [UserResponse.model_validate(u) for u in users], "total": total}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = await db.get(User, user_id)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin])),
):
    user = await db.get(User, user_id)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    await db.flush()
    await db.refresh(user)
    await create_audit_log(db, current_user.id, "users", "update", f"Updated user {user.email}", user.id)
    return UserResponse.model_validate(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin])),
):
    user = await db.get(User, user_id)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    await create_audit_log(db, current_user.id, "users", "delete", f"Deleted user {user.email}", user.id)
    await db.delete(user)
    await db.flush()
    return {"message": "User deleted"}
