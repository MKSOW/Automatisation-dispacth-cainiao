"""Dispatch routes: parcel management and route optimization."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.core.security import require_admin, require_role, get_current_user
from app.models.orm import Parcel, User
from app.models.schemas import (
    ParcelCreate,
    ParcelRead,
    ParcelBulkUpload,
    DispatchAssign,
    OptimizeRequest,
    OptimizedRoute,
)
from app.services.dispatch_service import (
    create_parcel,
    bulk_create_parcels,
    assign_parcels_to_driver,
    get_driver_parcels,
    geocode_parcels,
    optimize_driver_route,
)

router = APIRouter(prefix="/dispatch", tags=["dispatch"])


# ───────────────────────────────────────
# Parcel endpoints
# ───────────────────────────────────────
@router.get("/parcels", response_model=List[ParcelRead], dependencies=[Depends(require_admin)])
def list_all_parcels(
    status: str | None = None,
    driver_id: int | None = None,
    db: Session = Depends(get_db_session),
):
    """List all parcels (admin only). Optional filters."""
    query = db.query(Parcel)
    if status:
        query = query.filter(Parcel.status == status)
    if driver_id:
        query = query.filter(Parcel.driver_id == driver_id)
    return query.order_by(Parcel.id.desc()).limit(500).all()


@router.post("/parcels", response_model=ParcelRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_single_parcel(payload: ParcelCreate, db: Session = Depends(get_db_session)):
    """Create a single parcel (admin only)."""
    existing = db.query(Parcel).filter(Parcel.tracking_no == payload.tracking_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tracking number already exists")
    return create_parcel(db, payload)


@router.post("/upload", response_model=List[ParcelRead], status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def bulk_upload_parcels(payload: ParcelBulkUpload, db: Session = Depends(get_db_session)):
    """Bulk import parcels (admin only)."""
    # Check for duplicates
    tracking_nos = [p.tracking_no for p in payload.parcels]
    existing = db.query(Parcel.tracking_no).filter(Parcel.tracking_no.in_(tracking_nos)).all()
    existing_set = {e[0] for e in existing}
    
    new_parcels = [p for p in payload.parcels if p.tracking_no not in existing_set]
    if not new_parcels:
        raise HTTPException(status_code=400, detail="All tracking numbers already exist")
    
    return bulk_create_parcels(db, new_parcels, payload.zone_id, payload.driver_id)


@router.post("/assign", response_model=List[ParcelRead], dependencies=[Depends(require_admin)])
def assign_to_driver(payload: DispatchAssign, db: Session = Depends(get_db_session)):
    """Assign parcels to a driver (admin only)."""
    driver = db.query(User).filter(User.id == payload.driver_id, User.role == "chauffeur").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    parcels = assign_parcels_to_driver(db, payload.parcel_ids, payload.driver_id)
    if not parcels:
        raise HTTPException(status_code=404, detail="No parcels found with given IDs")
    return parcels


# ───────────────────────────────────────
# Geocoding
# ───────────────────────────────────────
@router.post("/geocode", dependencies=[Depends(require_admin)])
def geocode_parcel_addresses(parcel_ids: List[int], db: Session = Depends(get_db_session)):
    """Geocode parcels that don't have coordinates yet (admin only)."""
    updated = geocode_parcels(db, parcel_ids)
    return {"geocoded_count": updated}


# ───────────────────────────────────────
# Route optimization
# ───────────────────────────────────────
@router.post("/optimize", response_model=OptimizedRoute, dependencies=[Depends(require_admin)])
def optimize_route(payload: OptimizeRequest, db: Session = Depends(get_db_session)):
    """Optimize delivery route for a driver using TSP (admin only)."""
    driver = db.query(User).filter(User.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # First geocode any parcels without coordinates
    parcel_ids = [p.id for p in db.query(Parcel.id).filter(Parcel.driver_id == payload.driver_id).all()]
    geocode_parcels(db, parcel_ids)
    
    return optimize_driver_route(db, payload.driver_id, payload.depot_address)


# ───────────────────────────────────────
# Driver-facing endpoints
# ───────────────────────────────────────
@router.get("/my-route", response_model=List[ParcelRead])
def get_my_route(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Get current driver's assigned parcels in optimized order."""
    if current_user.role != "chauffeur":
        raise HTTPException(status_code=403, detail="Only drivers can access this endpoint")
    
    parcels = get_driver_parcels(db, current_user.id)
    return parcels


@router.patch("/parcels/{parcel_id}/status")
def update_parcel_status(
    parcel_id: int,
    new_status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Update parcel status (driver marks as delivered, etc.)."""
    parcel = db.query(Parcel).filter(Parcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    
    # Drivers can only update their own parcels
    if current_user.role == "chauffeur" and parcel.driver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your parcel")
    
    if new_status not in ["pending", "assigned", "sorted", "delivered"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    parcel.status = new_status
    db.commit()
    return {"message": f"Parcel {parcel_id} status updated to {new_status}"}
