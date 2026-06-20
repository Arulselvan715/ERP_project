from pydantic import BaseModel, ConfigDict


class BomComponentCreate(BaseModel):
    component_product_id: int
    quantity: float


class BomComponentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    component_product_id: int
    quantity: float
    component_name: str | None = None
    component_sku: str | None = None


class BomOperationCreate(BaseModel):
    operation_name: str
    duration_minutes: int = 0
    work_center: str | None = None
    sequence: int = 1


class BomOperationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    operation_name: str
    duration_minutes: int
    work_center: str | None
    sequence: int


class BomCreate(BaseModel):
    product_id: int
    components: list[BomComponentCreate] = []
    operations: list[BomOperationCreate] = []


class BomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    product_name: str | None = None
    components: list[BomComponentResponse] = []
    operations: list[BomOperationResponse] = []
