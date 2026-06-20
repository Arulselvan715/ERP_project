from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.stock_ledger import MovementType


class StockLedgerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    product_name: str | None = None
    movement_type: MovementType
    quantity: int
    reference_type: str | None
    reference_id: int | None
    timestamp: datetime


class InventoryOverview(BaseModel):
    product_id: int
    sku: str
    name: str
    category: str | None
    on_hand_qty: int
    reserved_qty: int
    free_qty: int
    is_low_stock: bool


class StockAdjustment(BaseModel):
    product_id: int
    quantity: int  # positive = add, negative = reduce
    reason: str | None = None
