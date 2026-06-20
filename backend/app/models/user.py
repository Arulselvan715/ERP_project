import enum
from datetime import datetime
from sqlalchemy import String, Enum, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    sales_user = "sales_user"
    purchase_user = "purchase_user"
    manufacturing_user = "manufacturing_user"
    inventory_manager = "inventory_manager"
    business_owner = "business_owner"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.sales_user)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
