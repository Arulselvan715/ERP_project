import enum
from datetime import datetime
from sqlalchemy import String, Integer, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class ManufacturingOrderStatus(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class WorkOrderStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class ManufacturingOrder(Base):
    __tablename__ = "manufacturing_orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    status: Mapped[ManufacturingOrderStatus] = mapped_column(
        Enum(ManufacturingOrderStatus), default=ManufacturingOrderStatus.planned
    )
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    product = relationship("Product", lazy="selectin")
    assigned_user = relationship("User", lazy="selectin")
    work_orders = relationship("WorkOrder", back_populates="manufacturing_order", lazy="selectin", cascade="all, delete-orphan")


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    manufacturing_order_id: Mapped[int] = mapped_column(ForeignKey("manufacturing_orders.id", ondelete="CASCADE"))
    operation_name: Mapped[str] = mapped_column(String(200))
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    work_center: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[WorkOrderStatus] = mapped_column(
        Enum(WorkOrderStatus), default=WorkOrderStatus.pending
    )
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, default=1)

    manufacturing_order = relationship("ManufacturingOrder", back_populates="work_orders")
    assigned_user = relationship("User", foreign_keys=[assigned_to], lazy="selectin")
