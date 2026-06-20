from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.user import User
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderResponse, ReceiveItemRequest
from app.auth.dependencies import get_current_user
from app.services import purchase_service
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/purchase", tags=["Purchase Orders"])


@router.get("/", response_model=dict)
async def list_purchase_orders(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
    status: str | None = None,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    orders, total = await purchase_service.get_purchase_orders(db, skip, limit, status)
    data = []
    for o in orders:
        resp = PurchaseOrderResponse.model_validate(o)
        resp.vendor_name = o.vendor.name if o.vendor else None
        for item_resp in resp.items:
            po_item = next((i for i in o.items if i.id == item_resp.id), None)
            if po_item and po_item.product:
                item_resp.product_name = po_item.product.name
        data.append(resp)
    return {"data": data, "total": total}


@router.get("/{order_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await purchase_service.get_purchase_order(db, order_id)
    resp = PurchaseOrderResponse.model_validate(order)
    resp.vendor_name = order.vendor.name if order.vendor else None
    return resp


@router.post("/", response_model=PurchaseOrderResponse)
async def create_purchase_order(data: PurchaseOrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await purchase_service.create_purchase_order(db, data)
    await create_audit_log(db, current_user.id, "purchase", "create", f"Created PO #{order.id}", order.id)
    return PurchaseOrderResponse.model_validate(order)


@router.post("/{order_id}/confirm", response_model=PurchaseOrderResponse)
async def confirm_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await purchase_service.confirm_purchase_order(db, order_id)
    await create_audit_log(db, current_user.id, "purchase", "confirm", f"Confirmed PO #{order.id}", order.id)
    return PurchaseOrderResponse.model_validate(order)


@router.post("/{order_id}/receive", response_model=PurchaseOrderResponse)
async def receive_goods(order_id: int, receipts: list[ReceiveItemRequest], db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await purchase_service.receive_goods(db, order_id, receipts)
    await create_audit_log(db, current_user.id, "purchase", "receive", f"Received goods for PO #{order.id}", order.id)
    return PurchaseOrderResponse.model_validate(order)


@router.post("/{order_id}/cancel", response_model=PurchaseOrderResponse)
async def cancel_order(order_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = await purchase_service.cancel_purchase_order(db, order_id)
    await create_audit_log(db, current_user.id, "purchase", "cancel", f"Cancelled PO #{order.id}", order.id)
    return PurchaseOrderResponse.model_validate(order)
