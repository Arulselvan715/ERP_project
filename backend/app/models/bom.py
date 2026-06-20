from sqlalchemy import String, Integer, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class BillOfMaterials(Base):
    __tablename__ = "bill_of_materials"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), unique=True)

    product = relationship("Product", foreign_keys=[product_id], lazy="selectin")
    components = relationship("BomComponent", back_populates="bom", lazy="selectin", cascade="all, delete-orphan")
    operations = relationship("BomOperation", back_populates="bom", lazy="selectin", cascade="all, delete-orphan")


class BomComponent(Base):
    __tablename__ = "bom_components"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bom_id: Mapped[int] = mapped_column(ForeignKey("bill_of_materials.id", ondelete="CASCADE"))
    component_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[float] = mapped_column(Numeric(10, 2))

    bom = relationship("BillOfMaterials", back_populates="components")
    component_product = relationship("Product", foreign_keys=[component_product_id], lazy="selectin")


class BomOperation(Base):
    __tablename__ = "bom_operations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bom_id: Mapped[int] = mapped_column(ForeignKey("bill_of_materials.id", ondelete="CASCADE"))
    operation_name: Mapped[str] = mapped_column(String(200))
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    work_center: Mapped[str | None] = mapped_column(String(200), nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, default=1)

    bom = relationship("BillOfMaterials", back_populates="operations")
