import enum
from datetime import datetime, date
from sqlalchemy import String, Numeric, Integer, Enum, ForeignKey, DateTime, Date, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class PurchaseOrderStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    partially_received = "partially_received"
    fully_received = "fully_received"
    cancelled = "cancelled"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id"))
    status: Mapped[PurchaseOrderStatus] = mapped_column(
        Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.draft
    )
    order_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    vendor = relationship("Vendor", lazy="selectin")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", lazy="selectin", cascade="all, delete-orphan")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    purchase_order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    received_qty: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[float] = mapped_column(Numeric(12, 2))

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product", lazy="selectin")
