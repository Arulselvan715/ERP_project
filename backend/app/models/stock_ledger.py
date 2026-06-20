import enum
from datetime import datetime
from sqlalchemy import String, Integer, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class MovementType(str, enum.Enum):
    purchase = "purchase"
    sale = "sale"
    manufacturing_consumption = "manufacturing_consumption"
    manufacturing_production = "manufacturing_production"
    adjustment = "adjustment"


class StockLedger(Base):
    __tablename__ = "stock_ledger"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    movement_type: Mapped[MovementType] = mapped_column(Enum(MovementType))
    quantity: Mapped[int] = mapped_column(Integer)
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reference_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    product = relationship("Product", lazy="selectin")
