from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus
from app.models.product import Product, ProcurementStrategy, ProcurementType
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.manufacturing_order import ManufacturingOrder, ManufacturingOrderStatus
from app.models.stock_ledger import StockLedger, MovementType
from app.schemas.sales_order import SalesOrderCreate, DeliverItemRequest


async def get_sales_orders(db: AsyncSession, skip: int = 0, limit: int = 50, status: str | None = None):
    query = select(SalesOrder)
    if status:
        query = query.where(SalesOrder.status == status)
    query = query.order_by(SalesOrder.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()
    count_q = select(func.count(SalesOrder.id))
    if status:
        count_q = count_q.where(SalesOrder.status == status)
    total = (await db.execute(count_q)).scalar()
    return orders, total


async def get_sales_order(db: AsyncSession, order_id: int) -> SalesOrder:
    result = await db.execute(select(SalesOrder).where(SalesOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return order


async def create_sales_order(db: AsyncSession, data: SalesOrderCreate) -> SalesOrder:
    total = sum(item.quantity * item.price for item in data.items)
    order = SalesOrder(
        customer_id=data.customer_id,
        status=SalesOrderStatus.draft,
        total_amount=total,
    )
    db.add(order)
    await db.flush()

    for item_data in data.items:
        item = SalesOrderItem(
            sales_order_id=order.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            price=item_data.price,
        )
        db.add(item)
    await db.flush()
    await db.refresh(order)
    return order


async def confirm_sales_order(db: AsyncSession, order_id: int) -> SalesOrder:
    order = await get_sales_order(db, order_id)
    if order.status != SalesOrderStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft orders can be confirmed")

    # Check stock availability for each item
    for item in order.items:
        product = await db.get(Product, item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        free_qty = product.on_hand_qty - product.reserved_qty
        if free_qty >= item.quantity:
            # Reserve stock
            product.reserved_qty += item.quantity
        else:
            # Insufficient stock - check procurement strategy
            if product.procurement_strategy == ProcurementStrategy.make_to_stock:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{product.name}' (SKU: {product.sku}). Available: {free_qty}, Required: {item.quantity}",
                )
            elif product.procurement_strategy == ProcurementStrategy.make_to_order:
                # Reserve what we have
                qty_to_procure = item.quantity - free_qty
                if free_qty > 0:
                    product.reserved_qty += free_qty

                # Auto-create procurement order
                if product.procurement_type == ProcurementType.purchase:
                    po = PurchaseOrder(
                        vendor_id=product.vendor_id or 1,
                        status=PurchaseOrderStatus.draft,
                        total_amount=qty_to_procure * float(product.cost_price),
                    )
                    db.add(po)
                    await db.flush()
                    po_item = PurchaseOrderItem(
                        purchase_order_id=po.id,
                        product_id=product.id,
                        quantity=qty_to_procure,
                        price=float(product.cost_price),
                    )
                    db.add(po_item)
                elif product.procurement_type == ProcurementType.manufacturing:
                    mo = ManufacturingOrder(
                        product_id=product.id,
                        quantity=qty_to_procure,
                        status=ManufacturingOrderStatus.planned,
                    )
                    db.add(mo)

    order.status = SalesOrderStatus.confirmed
    await db.flush()
    await db.refresh(order)
    return order


async def deliver_sales_order(db: AsyncSession, order_id: int, deliveries: list[DeliverItemRequest]) -> SalesOrder:
    order = await get_sales_order(db, order_id)
    if order.status not in [SalesOrderStatus.confirmed, SalesOrderStatus.partially_delivered]:
        raise HTTPException(status_code=400, detail="Only confirmed/partially delivered orders can be delivered")

    for delivery in deliveries:
        # Find item
        item_result = await db.execute(
            select(SalesOrderItem).where(
                SalesOrderItem.id == delivery.item_id,
                SalesOrderItem.sales_order_id == order_id,
            )
        )
        item = item_result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail=f"Order item {delivery.item_id} not found")

        remaining = item.quantity - item.delivered_qty
        if delivery.quantity > remaining:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot deliver {delivery.quantity} units. Remaining: {remaining}",
            )
        if delivery.quantity <= 0:
            raise HTTPException(status_code=400, detail="Delivery quantity must be positive")

        product = await db.get(Product, item.product_id)
        if product.on_hand_qty < delivery.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient on-hand stock for '{product.name}'")

        # Update quantities
        product.on_hand_qty -= delivery.quantity
        product.reserved_qty -= delivery.quantity
        item.delivered_qty += delivery.quantity

        # Create stock ledger entry
        ledger = StockLedger(
            product_id=item.product_id,
            movement_type=MovementType.sale,
            quantity=-delivery.quantity,
            reference_type="sales_order",
            reference_id=order_id,
        )
        db.add(ledger)

    # Update order status
    all_delivered = all(i.delivered_qty >= i.quantity for i in order.items)
    any_delivered = any(i.delivered_qty > 0 for i in order.items)

    if all_delivered:
        order.status = SalesOrderStatus.fully_delivered
    elif any_delivered:
        order.status = SalesOrderStatus.partially_delivered

    await db.flush()
    await db.refresh(order)
    return order


async def cancel_sales_order(db: AsyncSession, order_id: int) -> SalesOrder:
    order = await get_sales_order(db, order_id)
    if order.status in [SalesOrderStatus.fully_delivered, SalesOrderStatus.cancelled]:
        raise HTTPException(status_code=400, detail="Cannot cancel this order")

    # Release reserved quantities
    for item in order.items:
        reserved_to_release = item.quantity - item.delivered_qty
        if reserved_to_release > 0:
            product = await db.get(Product, item.product_id)
            product.reserved_qty -= reserved_to_release

    order.status = SalesOrderStatus.cancelled
    await db.flush()
    await db.refresh(order)
    return order
