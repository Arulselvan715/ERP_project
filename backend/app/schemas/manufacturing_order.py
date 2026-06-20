from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.manufacturing_order import ManufacturingOrderStatus, WorkOrderStatus


class ManufacturingOrderCreate(BaseModel):
    product_id: int
    quantity: int
    assigned_to: int | None = None


class WorkOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    operation_name: str
    duration_minutes: int
    work_center: str | None
    status: WorkOrderStatus
    assigned_to: int | None
    sequence: int


class ManufacturingOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    product_name: str | None = None
    quantity: int
    status: ManufacturingOrderStatus
    assigned_to: int | None
    created_at: datetime
    work_orders: list[WorkOrderResponse] = []
