from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


async def get_customers(db: AsyncSession, skip: int = 0, limit: int = 50, search: str | None = None):
    query = select(Customer)
    if search:
        query = query.where(
            (Customer.name.ilike(f"%{search}%")) | (Customer.email.ilike(f"%{search}%"))
        )
    query = query.order_by(Customer.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    customers = result.scalars().all()
    count_q = select(func.count(Customer.id))
    if search:
        count_q = count_q.where(
            (Customer.name.ilike(f"%{search}%")) | (Customer.email.ilike(f"%{search}%"))
        )
    total = (await db.execute(count_q)).scalar()
    return customers, total


async def get_customer(db: AsyncSession, customer_id: int) -> Customer:
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


async def create_customer(db: AsyncSession, data: CustomerCreate) -> Customer:
    customer = Customer(**data.model_dump())
    db.add(customer)
    await db.flush()
    await db.refresh(customer)
    return customer


async def update_customer(db: AsyncSession, customer_id: int, data: CustomerUpdate) -> Customer:
    customer = await get_customer(db, customer_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)
    await db.flush()
    await db.refresh(customer)
    return customer


async def delete_customer(db: AsyncSession, customer_id: int):
    customer = await get_customer(db, customer_id)
    await db.delete(customer)
    await db.flush()
