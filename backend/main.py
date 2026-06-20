import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database.connection import engine
from app.database.base import Base
import app.models  # Ensure all models are imported so Base.metadata knows about them
from app.api import (
    auth, users, products, customers, vendors, sales, purchase,
    bom, manufacturing, inventory, dashboard, reports, audit
)
from app.database.connection import async_session
from app.models.user import User, UserRole
from app.auth.password import hash_password
from sqlalchemy import select

settings = get_settings()

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default admin user
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session() as session:
        async with session.begin():
            # Check if default admin exists
            result = await session.execute(
                select(User).where(User.email == settings.DEFAULT_ADMIN_EMAIL)
            )
            admin = result.scalar_one_or_none()
            if not admin:
                new_admin = User(
                    name="Default Admin",
                    email=settings.DEFAULT_ADMIN_EMAIL,
                    password_hash=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                    role=UserRole.admin,
                )
                session.add(new_admin)
                await session.flush()
                print("Default admin user created.")
    yield

app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(vendors.router)
app.include_router(sales.router)
app.include_router(purchase.router)
app.include_router(bom.router)
app.include_router(manufacturing.router)
app.include_router(inventory.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(audit.router)

@app.get("/")
async def root():
    return {"message": "Shiv Furniture Works - Mini ERP API is running"}
