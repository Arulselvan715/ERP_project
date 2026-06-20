import enum
from datetime import datetime, date
from sqlalchemy import String, Numeric, Integer, Enum, ForeignKey, DateTime, Date, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class SalesOrderStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    partially_delivered = "partially_delivered"
    fully_delivered = "fully_delivered"
    cancelled = "cancelled"


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    status: Mapped[SalesOrderStatus] = mapped_column(
        Enum(SalesOrderStatus), default=SalesOrderStatus.draft
    )
    order_date: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    customer = relationship("Customer", lazy="selectin")
    items = relationship("SalesOrderItem", back_populates="sales_order", lazy="selectin", cascade="all, delete-orphan")


class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sales_order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    delivered_qty: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[float] = mapped_column(Numeric(12, 2))

    sales_order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product", lazy="selectin")
