from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db
from app.models.user import User
from app.models.bom import BillOfMaterials, BomComponent, BomOperation
from app.schemas.bom import BomCreate, BomResponse, BomComponentCreate, BomOperationCreate, BomComponentResponse, BomOperationResponse
from app.auth.dependencies import get_current_user
from app.services.audit_service import create_audit_log

router = APIRouter(prefix="/bom", tags=["Bill of Materials"])


@router.get("/", response_model=dict)
async def list_boms(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    result = await db.execute(select(BillOfMaterials).offset(skip).limit(limit))
    boms = result.scalars().all()
    total = (await db.execute(select(func.count(BillOfMaterials.id)))).scalar()
    data = []
    for b in boms:
        resp = BomResponse.model_validate(b)
        resp.product_name = b.product.name if b.product else None
        for comp_resp in resp.components:
            comp = next((c for c in b.components if c.id == comp_resp.id), None)
            if comp and comp.component_product:
                comp_resp.component_name = comp.component_product.name
                comp_resp.component_sku = comp.component_product.sku
        data.append(resp)
    return {"data": data, "total": total}


@router.get("/{bom_id}", response_model=BomResponse)
async def get_bom(bom_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(BillOfMaterials).where(BillOfMaterials.id == bom_id))
    bom = result.scalar_one_or_none()
    if not bom:
        raise HTTPException(status_code=404, detail="BoM not found")
    resp = BomResponse.model_validate(bom)
    resp.product_name = bom.product.name if bom.product else None
    for comp_resp in resp.components:
        comp = next((c for c in bom.components if c.id == comp_resp.id), None)
        if comp and comp.component_product:
            comp_resp.component_name = comp.component_product.name
            comp_resp.component_sku = comp.component_product.sku
    return resp


@router.post("/", response_model=BomResponse)
async def create_bom(data: BomCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if BoM already exists for product
    existing = await db.execute(select(BillOfMaterials).where(BillOfMaterials.product_id == data.product_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="BoM already exists for this product")

    bom = BillOfMaterials(product_id=data.product_id)
    db.add(bom)
    await db.flush()

    for comp_data in data.components:
        comp = BomComponent(bom_id=bom.id, component_product_id=comp_data.component_product_id, quantity=comp_data.quantity)
        db.add(comp)
    for op_data in data.operations:
        op = BomOperation(bom_id=bom.id, operation_name=op_data.operation_name, duration_minutes=op_data.duration_minutes, work_center=op_data.work_center, sequence=op_data.sequence)
        db.add(op)

    await db.flush()
    await db.refresh(bom)
    await create_audit_log(db, current_user.id, "bom", "create", f"Created BoM for product {data.product_id}", bom.id)
    return BomResponse.model_validate(bom)


@router.delete("/{bom_id}")
async def delete_bom(bom_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(BillOfMaterials).where(BillOfMaterials.id == bom_id))
    bom = result.scalar_one_or_none()
    if not bom:
        raise HTTPException(status_code=404, detail="BoM not found")
    await create_audit_log(db, current_user.id, "bom", "delete", f"Deleted BoM {bom_id}", bom_id)
    await db.delete(bom)
    await db.flush()
    return {"message": "BoM deleted"}
