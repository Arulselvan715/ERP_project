from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.auth.dependencies import get_current_user
from app.services import customer_service
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("/", response_model=dict)
async def list_customers(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
    search: str | None = None,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    customers, total = await customer_service.get_customers(db, skip, limit, search)
    return {"data": [CustomerResponse.model_validate(c) for c in customers], "total": total}


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return CustomerResponse.model_validate(await customer_service.get_customer(db, customer_id))


@router.post("/", response_model=CustomerResponse)
async def create_customer(data: CustomerCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = await customer_service.create_customer(db, data)
    await create_audit_log(db, current_user.id, "customers", "create", f"Created customer {customer.name}", customer.id)
    return CustomerResponse.model_validate(customer)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: int, data: CustomerUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = await customer_service.update_customer(db, customer_id, data)
    await create_audit_log(db, current_user.id, "customers", "update", f"Updated customer {customer.name}", customer.id)
    return CustomerResponse.model_validate(customer)


@router.delete("/{customer_id}")
async def delete_customer(customer_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await customer_service.delete_customer(db, customer_id)
    await create_audit_log(db, current_user.id, "customers", "delete", f"Deleted customer {customer_id}", customer_id)
    return {"message": "Customer deleted"}
