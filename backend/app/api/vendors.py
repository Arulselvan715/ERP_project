from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.models.user import User
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.auth.dependencies import get_current_user
from app.services import vendor_service
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get("/", response_model=dict)
async def list_vendors(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
    search: str | None = None,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    vendors, total = await vendor_service.get_vendors(db, skip, limit, search)
    return {"data": [VendorResponse.model_validate(v) for v in vendors], "total": total}


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return VendorResponse.model_validate(await vendor_service.get_vendor(db, vendor_id))


@router.post("/", response_model=VendorResponse)
async def create_vendor(data: VendorCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = await vendor_service.create_vendor(db, data)
    await create_audit_log(db, current_user.id, "vendors", "create", f"Created vendor {vendor.name}", vendor.id)
    return VendorResponse.model_validate(vendor)


@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: int, data: VendorUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    vendor = await vendor_service.update_vendor(db, vendor_id, data)
    await create_audit_log(db, current_user.id, "vendors", "update", f"Updated vendor {vendor.name}", vendor.id)
    return VendorResponse.model_validate(vendor)


@router.delete("/{vendor_id}")
async def delete_vendor(vendor_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await vendor_service.delete_vendor(db, vendor_id)
    await create_audit_log(db, current_user.id, "vendors", "delete", f"Deleted vendor {vendor_id}", vendor_id)
    return {"message": "Vendor deleted"}
