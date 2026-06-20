from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from app.models.product import Product
from app.models.customer import Customer
from app.models.vendor import Vendor
from app.models.sales_order import SalesOrder, SalesOrderStatus
from app.models.purchase_order import PurchaseOrder, PurchaseOrderStatus
from app.models.manufacturing_order import ManufacturingOrder, ManufacturingOrderStatus
from app.models.stock_ledger import StockLedger
from app.models.audit_log import AuditLog
from app.config import get_settings

settings = get_settings()


async def get_dashboard_data(db: AsyncSession):
    # Summary cards
    products_count = (await db.execute(select(func.count(Product.id)))).scalar() or 0
    customers_count = (await db.execute(select(func.count(Customer.id)))).scalar() or 0
    vendors_count = (await db.execute(select(func.count(Vendor.id)))).scalar() or 0
    sales_count = (await db.execute(select(func.count(SalesOrder.id)))).scalar() or 0
    purchase_count = (await db.execute(select(func.count(PurchaseOrder.id)))).scalar() or 0
    manufacturing_count = (await db.execute(select(func.count(ManufacturingOrder.id)))).scalar() or 0

    # Revenue (from fully delivered orders)
    revenue = (await db.execute(
        select(func.coalesce(func.sum(SalesOrder.total_amount), 0)).where(
            SalesOrder.status == SalesOrderStatus.fully_delivered
        )
    )).scalar() or 0

    # Pending deliveries
    pending_deliveries = (await db.execute(
        select(func.count(SalesOrder.id)).where(
            SalesOrder.status.in_([SalesOrderStatus.confirmed, SalesOrderStatus.partially_delivered])
        )
    )).scalar() or 0

    # Low stock count
    low_stock = (await db.execute(
        select(func.count(Product.id)).where(Product.on_hand_qty <= settings.LOW_STOCK_THRESHOLD)
    )).scalar() or 0

    # Monthly sales data (last 6 months)
    monthly_sales = []
    for i in range(5, -1, -1):
        from datetime import datetime, timedelta
        now = datetime.now()
        month_start = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        if i > 0:
            month_end = (now.replace(day=1) - timedelta(days=30 * (i - 1))).replace(day=1)
        else:
            month_end = now

        total = (await db.execute(
            select(func.coalesce(func.sum(SalesOrder.total_amount), 0)).where(
                SalesOrder.created_at >= month_start,
                SalesOrder.created_at < month_end,
            )
        )).scalar() or 0
        monthly_sales.append({
            "month": month_start.strftime("%b %Y"),
            "revenue": float(total),
        })

    # Manufacturing status breakdown
    mfg_planned = (await db.execute(
        select(func.count(ManufacturingOrder.id)).where(ManufacturingOrder.status == ManufacturingOrderStatus.planned)
    )).scalar() or 0
    mfg_in_progress = (await db.execute(
        select(func.count(ManufacturingOrder.id)).where(ManufacturingOrder.status == ManufacturingOrderStatus.in_progress)
    )).scalar() or 0
    mfg_completed = (await db.execute(
        select(func.count(ManufacturingOrder.id)).where(ManufacturingOrder.status == ManufacturingOrderStatus.completed)
    )).scalar() or 0

    # Recent activities
    recent_logs = await db.execute(
        select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(10)
    )
    activities = []
    for log in recent_logs.scalars().all():
        activities.append({
            "id": log.id,
            "module": log.module,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "user_id": log.user_id,
        })

    return {
        "cards": {
            "products": products_count,
            "customers": customers_count,
            "vendors": vendors_count,
            "sales_orders": sales_count,
            "purchase_orders": purchase_count,
            "manufacturing_orders": manufacturing_count,
            "revenue": float(revenue),
            "pending_deliveries": pending_deliveries,
            "low_stock": low_stock,
        },
        "monthly_sales": monthly_sales,
        "manufacturing_status": {
            "planned": mfg_planned,
            "in_progress": mfg_in_progress,
            "completed": mfg_completed,
        },
        "recent_activities": activities,
    }
