# Import all models so they are registered with Base.metadata
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.vendor import Vendor
from app.models.product import Product, ProcurementStrategy, ProcurementType
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.bom import BillOfMaterials, BomComponent, BomOperation
from app.models.manufacturing_order import ManufacturingOrder, WorkOrder, ManufacturingOrderStatus, WorkOrderStatus
from app.models.stock_ledger import StockLedger, MovementType
from app.models.audit_log import AuditLog

__all__ = [
    "User", "UserRole",
    "Customer",
    "Vendor",
    "Product", "ProcurementStrategy", "ProcurementType",
    "SalesOrder", "SalesOrderItem", "SalesOrderStatus",
    "PurchaseOrder", "PurchaseOrderItem", "PurchaseOrderStatus",
    "BillOfMaterials", "BomComponent", "BomOperation",
    "ManufacturingOrder", "WorkOrder", "ManufacturingOrderStatus", "WorkOrderStatus",
    "StockLedger", "MovementType",
    "AuditLog",
]
