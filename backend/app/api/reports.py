from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.connection import get_db
from app.models.user import User
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.product import Product
from app.models.manufacturing_order import ManufacturingOrder, ManufacturingOrderStatus
from app.auth.dependencies import get_current_user
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/sales")
async def sales_report(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(SalesOrder).order_by(SalesOrder.created_at.desc()).limit(100))
    orders = result.scalars().all()
    return [{"id": o.id, "customer": o.customer.name if o.customer else "N/A", "status": o.status.value, "total": float(o.total_amount), "date": o.order_date.isoformat()} for o in orders]


@router.get("/purchase")
async def purchase_report(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).limit(100))
    orders = result.scalars().all()
    return [{"id": o.id, "vendor": o.vendor.name if o.vendor else "N/A", "status": o.status.value, "total": float(o.total_amount), "date": o.order_date.isoformat()} for o in orders]


@router.get("/inventory")
async def inventory_report(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Product).order_by(Product.name))
    products = result.scalars().all()
    return [{"id": p.id, "sku": p.sku, "name": p.name, "category": p.category, "on_hand": p.on_hand_qty, "reserved": p.reserved_qty, "free": p.on_hand_qty - p.reserved_qty, "value": float(p.cost_price) * p.on_hand_qty} for p in products]


@router.get("/manufacturing")
async def manufacturing_report(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(ManufacturingOrder).order_by(ManufacturingOrder.created_at.desc()).limit(100))
    orders = result.scalars().all()
    return [{"id": o.id, "product": o.product.name if o.product else "N/A", "quantity": o.quantity, "status": o.status.value, "date": o.created_at.isoformat() if o.created_at else None} for o in orders]


@router.get("/revenue")
async def revenue_report(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_revenue = (await db.execute(select(func.coalesce(func.sum(SalesOrder.total_amount), 0)).where(SalesOrder.status == SalesOrderStatus.fully_delivered))).scalar()
    total_cost = (await db.execute(select(func.coalesce(func.sum(PurchaseOrder.total_amount), 0)).where(PurchaseOrder.status == PurchaseOrderStatus.fully_received))).scalar()
    return {"total_revenue": float(total_revenue), "total_cost": float(total_cost), "gross_profit": float(total_revenue) - float(total_cost)}


@router.get("/low-stock")
async def low_stock_report(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Product).where(Product.on_hand_qty <= settings.LOW_STOCK_THRESHOLD).order_by(Product.on_hand_qty))
    products = result.scalars().all()
    return [{"id": p.id, "sku": p.sku, "name": p.name, "on_hand": p.on_hand_qty, "reserved": p.reserved_qty, "free": p.on_hand_qty - p.reserved_qty} for p in products]
