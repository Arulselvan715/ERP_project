from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.user import User
from app.schemas.sales_order import SalesOrderCreate, SalesOrderResponse, DeliverItemRequest
from app.auth.dependencies import get_current_user
from app.services import sales_service
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/sales", tags=["Sales Orders"])


@router.get("/", response_model=dict)
async def list_sales_orders(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
    status: str | None = None,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    orders, total = await sales_service.get_sales_orders(db, skip, limit, status)
    data = []
    for o in orders:
        resp = SalesOrderResponse.model_validate(o)
        resp.customer_name = o.customer.name if o.customer else None
        for item_resp in resp.items:
            so_item = next((i for i in o.items if i.id == item_resp.id), None)
            if so_item and so_item.product:
                item_resp.product_name = so_item.product.name
        data.append(resp)
    return {"data": data, "total": total}


@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await sales_service.get_sales_order(db, order_id)
    resp = SalesOrderResponse.model_validate(order)
    resp.customer_name = order.customer.name if order.customer else None
    for item_resp in resp.items:
        so_item = next((i for i in order.items if i.id == item_resp.id), None)
        if so_item and so_item.product:
            item_resp.product_name = so_item.product.name
    return resp


@router.post("/", response_model=SalesOrderResponse)
async def create_sales_order(data: SalesOrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await sales_service.create_sales_order(db, data)
    await create_audit_log(db, current_user.id, "sales", "create", f"Created sales order #{order.id}", order.id)
    return SalesOrderResponse.model_validate(order)


@router.post("/{order_id}/confirm", response_model=SalesOrderResponse)
async def confirm_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await sales_service.confirm_sales_order(db, order_id)
    await create_audit_log(db, current_user.id, "sales", "confirm", f"Confirmed sales order #{order.id}", order.id)
    return SalesOrderResponse.model_validate(order)


@router.post("/{order_id}/deliver", response_model=SalesOrderResponse)
async def deliver_order(order_id: int, deliveries: list[DeliverItemRequest], db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await sales_service.deliver_sales_order(db, order_id, deliveries)
    await create_audit_log(db, current_user.id, "sales", "deliver", f"Delivered items for order #{order.id}", order.id)
    return SalesOrderResponse.model_validate(order)


@router.post("/{order_id}/cancel", response_model=SalesOrderResponse)
async def cancel_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await sales_service.cancel_sales_order(db, order_id)
    await create_audit_log(db, current_user.id, "sales", "cancel", f"Cancelled sales order #{order.id}", order.id)
    return SalesOrderResponse.model_validate(order)
