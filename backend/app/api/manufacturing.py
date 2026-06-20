from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.user import User
from app.models.manufacturing_order import WorkOrderStatus
from app.schemas.manufacturing_order import ManufacturingOrderCreate, ManufacturingOrderResponse
from app.auth.dependencies import get_current_user
from app.services import manufacturing_service
from app.services.audit_service import create_audit_log
from pydantic import BaseModel

router = APIRouter(prefix="/manufacturing", tags=["Manufacturing"])


class WorkOrderUpdate(BaseModel):
    status: WorkOrderStatus
    assigned_to: int | None = None


@router.get("/", response_model=dict)
async def list_manufacturing_orders(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
    status: str | None = None,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    orders, total = await manufacturing_service.get_manufacturing_orders(db, skip, limit, status)
    data = []
    for o in orders:
        resp = ManufacturingOrderResponse.model_validate(o)
        resp.product_name = o.product.name if o.product else None
        data.append(resp)
    return {"data": data, "total": total}


@router.get("/{order_id}", response_model=ManufacturingOrderResponse)
async def get_manufacturing_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await manufacturing_service.get_manufacturing_order(db, order_id)
    resp = ManufacturingOrderResponse.model_validate(order)
    resp.product_name = order.product.name if order.product else None
    return resp


@router.post("/", response_model=ManufacturingOrderResponse)
async def create_manufacturing_order(data: ManufacturingOrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await manufacturing_service.create_manufacturing_order(db, data)
    await create_audit_log(db, current_user.id, "manufacturing", "create", f"Created MO #{order.id}", order.id)
    resp = ManufacturingOrderResponse.model_validate(order)
    resp.product_name = order.product.name if order.product else None
    return resp


@router.post("/{order_id}/start", response_model=ManufacturingOrderResponse)
async def start_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await manufacturing_service.start_manufacturing_order(db, order_id)
    await create_audit_log(db, current_user.id, "manufacturing", "start", f"Started MO #{order.id}", order.id)
    return ManufacturingOrderResponse.model_validate(order)


@router.put("/work-orders/{wo_id}")
async def update_work_order(wo_id: int, data: WorkOrderUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    wo = await manufacturing_service.update_work_order_status(db, wo_id, data.status, data.assigned_to)
    await create_audit_log(db, current_user.id, "manufacturing", "update_wo", f"Updated WO #{wo.id} to {data.status.value}", wo.id)
    return {"message": "Work order updated", "status": wo.status.value}


@router.post("/{order_id}/complete", response_model=ManufacturingOrderResponse)
async def complete_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await manufacturing_service.complete_manufacturing_order(db, order_id)
    await create_audit_log(db, current_user.id, "manufacturing", "complete", f"Completed MO #{order.id}", order.id)
    return ManufacturingOrderResponse.model_validate(order)
