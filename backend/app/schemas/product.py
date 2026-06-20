from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.product import ProcurementStrategy, ProcurementType


class ProductCreate(BaseModel):
    sku: str
    name: str
    description: str | None = None
    category: str | None = None
    sales_price: float = 0
    cost_price: float = 0
    procurement_strategy: ProcurementStrategy = ProcurementStrategy.make_to_stock
    procurement_type: ProcurementType = ProcurementType.purchase
    vendor_id: int | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    sales_price: float | None = None
    cost_price: float | None = None
    procurement_strategy: ProcurementStrategy | None = None
    procurement_type: ProcurementType | None = None
    vendor_id: int | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sku: str
    name: str
    description: str | None
    category: str | None
    sales_price: float
    cost_price: float
    on_hand_qty: int
    reserved_qty: int
    free_qty: int
    procurement_strategy: ProcurementStrategy
    procurement_type: ProcurementType
    vendor_id: int | None
    bom_id: int | None
    created_at: datetime
