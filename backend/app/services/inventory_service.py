from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models.product import Product
from app.models.stock_ledger import StockLedger, MovementType
from app.config import get_settings

settings = get_settings()


async def get_inventory_overview(db: AsyncSession, search: str | None = None, low_stock_only: bool = False):
    query = select(Product)
    if search:
        query = query.where(
            (Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
        )
    result = await db.execute(query.order_by(Product.name))
    products = result.scalars().all()

    inventory = []
    for p in products:
        free_qty = p.on_hand_qty - p.reserved_qty
        is_low = p.on_hand_qty <= settings.LOW_STOCK_THRESHOLD
        if low_stock_only and not is_low:
            continue
        inventory.append({
            "product_id": p.id,
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "on_hand_qty": p.on_hand_qty,
            "reserved_qty": p.reserved_qty,
            "free_qty": free_qty,
            "is_low_stock": is_low,
        })
    return inventory


async def get_stock_movements(db: AsyncSession, product_id: int | None = None, skip: int = 0, limit: int = 50):
    query = select(StockLedger)
    if product_id:
        query = query.where(StockLedger.product_id == product_id)
    query = query.order_by(StockLedger.timestamp.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    movements = result.scalars().all()
    count_q = select(func.count(StockLedger.id))
    if product_id:
        count_q = count_q.where(StockLedger.product_id == product_id)
    total = (await db.execute(count_q)).scalar()
    return movements, total


async def adjust_stock(db: AsyncSession, product_id: int, quantity: int, reason: str | None = None):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.on_hand_qty + quantity < 0:
        raise HTTPException(status_code=400, detail="Adjustment would result in negative stock")

    product.on_hand_qty += quantity

    ledger = StockLedger(
        product_id=product_id,
        movement_type=MovementType.adjustment,
        quantity=quantity,
        reference_type="adjustment",
        reference_id=None,
    )
    db.add(ledger)
    await db.flush()
    return product


async def get_low_stock_products(db: AsyncSession):
    result = await db.execute(
        select(Product).where(Product.on_hand_qty <= settings.LOW_STOCK_THRESHOLD).order_by(Product.on_hand_qty)
    )
    return result.scalars().all()
