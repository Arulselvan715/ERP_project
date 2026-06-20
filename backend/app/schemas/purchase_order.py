from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from app.models.purchase_order import PurchaseOrderStatus


class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    price: float


class PurchaseOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    received_qty: int
    price: float
    product_name: str | None = None


class PurchaseOrderCreate(BaseModel):
    vendor_id: int
    items: list[PurchaseOrderItemCreate]


class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vendor_id: int
    vendor_name: str | None = None
    status: PurchaseOrderStatus
    order_date: date
    total_amount: float
    created_at: datetime
    items: list[PurchaseOrderItemResponse] = []


class ReceiveItemRequest(BaseModel):
    item_id: int
    quantity: int
