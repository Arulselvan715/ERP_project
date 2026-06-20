import enum
from datetime import datetime
from sqlalchemy import String, Text, Numeric, Integer, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app.database.base import Base


class ProcurementStrategy(str, enum.Enum):
    make_to_stock = "make_to_stock"
    make_to_order = "make_to_order"


class ProcurementType(str, enum.Enum):
    purchase = "purchase"
    manufacturing = "manufacturing"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sku: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sales_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    cost_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    on_hand_qty: Mapped[int] = mapped_column(Integer, default=0)
    reserved_qty: Mapped[int] = mapped_column(Integer, default=0)
    procurement_strategy: Mapped[ProcurementStrategy] = mapped_column(
        Enum(ProcurementStrategy), default=ProcurementStrategy.make_to_stock
    )
    procurement_type: Mapped[ProcurementType] = mapped_column(
        Enum(ProcurementType), default=ProcurementType.purchase
    )
    vendor_id: Mapped[int | None] = mapped_column(ForeignKey("vendors.id"), nullable=True)
    bom_id: Mapped[int | None] = mapped_column(ForeignKey("bill_of_materials.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    vendor = relationship("Vendor", lazy="selectin")

    @hybrid_property
    def free_qty(self) -> int:
        return self.on_hand_qty - self.reserved_qty
