from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models.manufacturing_order import ManufacturingOrder, WorkOrder, ManufacturingOrderStatus, WorkOrderStatus
from app.models.bom import BillOfMaterials, BomComponent, BomOperation
from app.models.product import Product
from app.models.stock_ledger import StockLedger, MovementType
from app.schemas.manufacturing_order import ManufacturingOrderCreate


async def get_manufacturing_orders(db: AsyncSession, skip: int = 0, limit: int = 50, status: str | None = None):
    query = select(ManufacturingOrder)
    if status:
        query = query.where(ManufacturingOrder.status == status)
    query = query.order_by(ManufacturingOrder.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()
    count_q = select(func.count(ManufacturingOrder.id))
    if status:
        count_q = count_q.where(ManufacturingOrder.status == status)
    total = (await db.execute(count_q)).scalar()
    return orders, total


async def get_manufacturing_order(db: AsyncSession, order_id: int) -> ManufacturingOrder:
    result = await db.execute(select(ManufacturingOrder).where(ManufacturingOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Manufacturing order not found")
    return order


async def create_manufacturing_order(db: AsyncSession, data: ManufacturingOrderCreate) -> ManufacturingOrder:
    # Verify product exists
    product = await db.get(Product, data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    order = ManufacturingOrder(
        product_id=data.product_id,
        quantity=data.quantity,
        status=ManufacturingOrderStatus.planned,
        assigned_to=data.assigned_to,
    )
    db.add(order)
    await db.flush()

    # Auto-generate work orders from BoM operations
    bom_result = await db.execute(
        select(BillOfMaterials).where(BillOfMaterials.product_id == data.product_id)
    )
    bom = bom_result.scalar_one_or_none()
    if bom and bom.operations:
        for op in sorted(bom.operations, key=lambda x: x.sequence):
            wo = WorkOrder(
                manufacturing_order_id=order.id,
                operation_name=op.operation_name,
                duration_minutes=op.duration_minutes,
                work_center=op.work_center,
                status=WorkOrderStatus.pending,
                sequence=op.sequence,
            )
            db.add(wo)
    else:
        # Create a default work order if no BoM operations
        wo = WorkOrder(
            manufacturing_order_id=order.id,
            operation_name="Manufacturing",
            duration_minutes=60,
            work_center="Main Floor",
            status=WorkOrderStatus.pending,
            sequence=1,
        )
        db.add(wo)

    await db.flush()
    await db.refresh(order)
    return order


async def start_manufacturing_order(db: AsyncSession, order_id: int) -> ManufacturingOrder:
    order = await get_manufacturing_order(db, order_id)
    if order.status != ManufacturingOrderStatus.planned:
        raise HTTPException(status_code=400, detail="Only planned orders can be started")

    # Reserve raw materials from BoM
    bom_result = await db.execute(
        select(BillOfMaterials).where(BillOfMaterials.product_id == order.product_id)
    )
    bom = bom_result.scalar_one_or_none()
    if bom and bom.components:
        for comp in bom.components:
            product = await db.get(Product, comp.component_product_id)
            required = int(comp.quantity * order.quantity)
            free = product.on_hand_qty - product.reserved_qty
            if free < required:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient raw material '{product.name}'. Available: {free}, Required: {required}",
                )
            product.reserved_qty += required

    order.status = ManufacturingOrderStatus.in_progress
    await db.flush()
    await db.refresh(order)
    return order


async def update_work_order_status(db: AsyncSession, work_order_id: int, status: WorkOrderStatus, assigned_to: int | None = None) -> WorkOrder:
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == work_order_id))
    wo = result.scalar_one_or_none()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    wo.status = status
    if assigned_to is not None:
        wo.assigned_to = assigned_to
    await db.flush()
    await db.refresh(wo)
    return wo


async def complete_manufacturing_order(db: AsyncSession, order_id: int) -> ManufacturingOrder:
    order = await get_manufacturing_order(db, order_id)
    if order.status != ManufacturingOrderStatus.in_progress:
        raise HTTPException(status_code=400, detail="Only in-progress orders can be completed")

    # Check all work orders completed
    for wo in order.work_orders:
        if wo.status != WorkOrderStatus.completed:
            raise HTTPException(status_code=400, detail=f"Work order '{wo.operation_name}' is not completed")

    # Consume raw materials
    bom_result = await db.execute(
        select(BillOfMaterials).where(BillOfMaterials.product_id == order.product_id)
    )
    bom = bom_result.scalar_one_or_none()
    if bom and bom.components:
        for comp in bom.components:
            product = await db.get(Product, comp.component_product_id)
            consumed = int(comp.quantity * order.quantity)
            product.on_hand_qty -= consumed
            product.reserved_qty -= consumed

            ledger = StockLedger(
                product_id=comp.component_product_id,
                movement_type=MovementType.manufacturing_consumption,
                quantity=-consumed,
                reference_type="manufacturing_order",
                reference_id=order_id,
            )
            db.add(ledger)

    # Produce finished goods
    finished_product = await db.get(Product, order.product_id)
    finished_product.on_hand_qty += order.quantity

    production_ledger = StockLedger(
        product_id=order.product_id,
        movement_type=MovementType.manufacturing_production,
        quantity=order.quantity,
        reference_type="manufacturing_order",
        reference_id=order_id,
    )
    db.add(production_ledger)

    order.status = ManufacturingOrderStatus.completed
    await db.flush()
    await db.refresh(order)
    return order
