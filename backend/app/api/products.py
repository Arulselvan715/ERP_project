from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.auth.dependencies import get_current_user
from app.services import product_service
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=dict)
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    products, total = await product_service.get_products(db, skip, limit, search, category)
    return {"data": [ProductResponse.model_validate(p) for p in products], "total": total}


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = await product_service.get_product(db, product_id)
    return ProductResponse.model_validate(product)


@router.post("/", response_model=ProductResponse)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = await product_service.create_product(db, data)
    await create_audit_log(db, current_user.id, "products", "create", f"Created product {product.sku}", product.id)
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = await product_service.update_product(db, product_id, data)
    await create_audit_log(db, current_user.id, "products", "update", f"Updated product {product.sku}", product.id)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await product_service.delete_product(db, product_id)
    await create_audit_log(db, current_user.id, "products", "delete", f"Deleted product {product_id}", product_id)
    return {"message": "Product deleted"}
