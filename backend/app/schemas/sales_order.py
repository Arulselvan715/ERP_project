from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from app.models.sales_order import SalesOrderStatus


class SalesOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    price: float


class SalesOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    delivered_qty: int
    price: float
    product_name: str | None = None


class SalesOrderCreate(BaseModel):
    customer_id: int
    items: list[SalesOrderItemCreate]


class SalesOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    customer_name: str | None = None
    status: SalesOrderStatus
    order_date: date
    total_amount: float
    created_at: datetime
    items: list[SalesOrderItemResponse] = []


class DeliverItemRequest(BaseModel):
    item_id: int
    quantity: int
