from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.product import Product
from app.models.stock_ledger import StockLedger, MovementType
from app.schemas.purchase_order import PurchaseOrderCreate, ReceiveItemRequest


async def get_purchase_orders(db: AsyncSession, skip: int = 0, limit: int = 50, status: str | None = None):
    query = select(PurchaseOrder)
    if status:
        query = query.where(PurchaseOrder.status == status)
    query = query.order_by(PurchaseOrder.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()
    count_q = select(func.count(PurchaseOrder.id))
    if status:
        count_q = count_q.where(PurchaseOrder.status == status)
    total = (await db.execute(count_q)).scalar()
    return orders, total


async def get_purchase_order(db: AsyncSession, order_id: int) -> PurchaseOrder:
    result = await db.execute(select(PurchaseOrder).where(PurchaseOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return order


async def create_purchase_order(db: AsyncSession, data: PurchaseOrderCreate) -> PurchaseOrder:
    total = sum(item.quantity * item.price for item in data.items)
    order = PurchaseOrder(
        vendor_id=data.vendor_id,
        status=PurchaseOrderStatus.draft,
        total_amount=total,
    )
    db.add(order)
    await db.flush()
    for item_data in data.items:
        item = PurchaseOrderItem(
            purchase_order_id=order.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            price=item_data.price,
        )
        db.add(item)
    await db.flush()
    await db.refresh(order)
    return order


async def confirm_purchase_order(db: AsyncSession, order_id: int) -> PurchaseOrder:
    order = await get_purchase_order(db, order_id)
    if order.status != PurchaseOrderStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft orders can be confirmed")
    order.status = PurchaseOrderStatus.confirmed
    await db.flush()
    await db.refresh(order)
    return order


async def receive_goods(db: AsyncSession, order_id: int, receipts: list[ReceiveItemRequest]) -> PurchaseOrder:
    order = await get_purchase_order(db, order_id)
    if order.status not in [PurchaseOrderStatus.confirmed, PurchaseOrderStatus.partially_received]:
        raise HTTPException(status_code=400, detail="Only confirmed/partially received orders can receive goods")

    for receipt in receipts:
        item_result = await db.execute(
            select(PurchaseOrderItem).where(
                PurchaseOrderItem.id == receipt.item_id,
                PurchaseOrderItem.purchase_order_id == order_id,
            )
        )
        item = item_result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail=f"Order item {receipt.item_id} not found")

        remaining = item.quantity - item.received_qty
        if receipt.quantity > remaining:
            raise HTTPException(status_code=400, detail=f"Cannot receive {receipt.quantity}. Remaining: {remaining}")
        if receipt.quantity <= 0:
            raise HTTPException(status_code=400, detail="Receive quantity must be positive")

        product = await db.get(Product, item.product_id)
        product.on_hand_qty += receipt.quantity
        item.received_qty += receipt.quantity

        ledger = StockLedger(
            product_id=item.product_id,
            movement_type=MovementType.purchase,
            quantity=receipt.quantity,
            reference_type="purchase_order",
            reference_id=order_id,
        )
        db.add(ledger)

    all_received = all(i.received_qty >= i.quantity for i in order.items)
    any_received = any(i.received_qty > 0 for i in order.items)

    if all_received:
        order.status = PurchaseOrderStatus.fully_received
    elif any_received:
        order.status = PurchaseOrderStatus.partially_received

    await db.flush()
    await db.refresh(order)
    return order


async def cancel_purchase_order(db: AsyncSession, order_id: int) -> PurchaseOrder:
    order = await get_purchase_order(db, order_id)
    if order.status in [PurchaseOrderStatus.fully_received, PurchaseOrderStatus.cancelled]:
        raise HTTPException(status_code=400, detail="Cannot cancel this order")
    order.status = PurchaseOrderStatus.cancelled
    await db.flush()
    await db.refresh(order)
    return order
