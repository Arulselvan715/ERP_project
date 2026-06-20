from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.user import User
from app.schemas.inventory import StockLedgerResponse, StockAdjustment, InventoryOverview
from app.auth.dependencies import get_current_user
from app.services import inventory_service
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/", response_model=list[InventoryOverview])
async def get_inventory(
    search: str | None = None, low_stock_only: bool = False,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return await inventory_service.get_inventory_overview(db, search, low_stock_only)


@router.get("/movements", response_model=dict)
async def get_movements(
    product_id: int | None = None,
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    movements, total = await inventory_service.get_stock_movements(db, product_id, skip, limit)
    data = []
    for m in movements:
        resp = StockLedgerResponse.model_validate(m)
        resp.product_name = m.product.name if m.product else None
        data.append(resp)
    return {"data": data, "total": total}


@router.post("/adjust")
async def adjust_stock(
    data: StockAdjustment,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    product = await inventory_service.adjust_stock(db, data.product_id, data.quantity, data.reason)
    await create_audit_log(db, current_user.id, "inventory", "adjust", f"Adjusted stock for product {data.product_id} by {data.quantity}", data.product_id)
    return {"message": "Stock adjusted", "on_hand_qty": product.on_hand_qty}


@router.get("/low-stock")
async def get_low_stock(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    products = await inventory_service.get_low_stock_products(db)
    return [{"id": p.id, "sku": p.sku, "name": p.name, "on_hand_qty": p.on_hand_qty} for p in products]
