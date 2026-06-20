from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.models.product import Product
from app.models.sales_order import SalesOrderItem
from app.models.purchase_order import PurchaseOrderItem
from app.schemas.product import ProductCreate, ProductUpdate


async def get_products(
    db: AsyncSession, skip: int = 0, limit: int = 50,
    search: str | None = None, category: str | None = None,
):
    query = select(Product)
    if search:
        query = query.where(
            (Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
        )
    if category:
        query = query.where(Product.category == category)
    query = query.order_by(Product.id.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    products = result.scalars().all()

    # Get total count
    count_query = select(func.count(Product.id))
    if search:
        count_query = count_query.where(
            (Product.name.ilike(f"%{search}%")) | (Product.sku.ilike(f"%{search}%"))
        )
    if category:
        count_query = count_query.where(Product.category == category)
    total = (await db.execute(count_query)).scalar()

    return products, total


async def get_product(db: AsyncSession, product_id: int) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    # Check SKU uniqueness
    existing = await db.execute(select(Product).where(Product.sku == data.sku))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"SKU '{data.sku}' already exists")

    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


async def update_product(db: AsyncSession, product_id: int, data: ProductUpdate) -> Product:
    product = await get_product(db, product_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    await db.flush()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product_id: int):
    product = await get_product(db, product_id)

    # Check if used in sales orders
    so_check = await db.execute(
        select(SalesOrderItem).where(SalesOrderItem.product_id == product_id).limit(1)
    )
    if so_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cannot delete product: used in sales orders")

    # Check if used in purchase orders
    po_check = await db.execute(
        select(PurchaseOrderItem).where(PurchaseOrderItem.product_id == product_id).limit(1)
    )
    if po_check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cannot delete product: used in purchase orders")

    await db.delete(product)
    await db.flush()
