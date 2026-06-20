from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate


async def get_vendors(db: AsyncSession, skip: int = 0, limit: int = 50, search: str | None = None):
    query = select(Vendor)
    if search:
        query = query.where(
            (Vendor.name.ilike(f"%{search}%")) | (Vendor.email.ilike(f"%{search}%"))
        )
    query = query.order_by(Vendor.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    vendors = result.scalars().all()
    count_q = select(func.count(Vendor.id))
    if search:
        count_q = count_q.where(
            (Vendor.name.ilike(f"%{search}%")) | (Vendor.email.ilike(f"%{search}%"))
        )
    total = (await db.execute(count_q)).scalar()
    return vendors, total


async def get_vendor(db: AsyncSession, vendor_id: int) -> Vendor:
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


async def create_vendor(db: AsyncSession, data: VendorCreate) -> Vendor:
    vendor = Vendor(**data.model_dump())
    db.add(vendor)
    await db.flush()
    await db.refresh(vendor)
    return vendor


async def update_vendor(db: AsyncSession, vendor_id: int, data: VendorUpdate) -> Vendor:
    vendor = await get_vendor(db, vendor_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(vendor, key, value)
    await db.flush()
    await db.refresh(vendor)
    return vendor


async def delete_vendor(db: AsyncSession, vendor_id: int):
    vendor = await get_vendor(db, vendor_id)
    await db.delete(vendor)
    await db.flush()
