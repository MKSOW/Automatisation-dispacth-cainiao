"""Sorting station routes: barcode scanning for bag assignment."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.core.security import get_current_user, require_role
from app.models.orm import User, Parcel
from app.models.schemas import ScanRequest, ScanResponse, SortingStats
from app.services.sorting_service import (
    scan_parcel,
    get_sorter_stats,
    get_driver_bag_summary,
    unscan_parcel,
)

router = APIRouter(prefix="/sorting", tags=["sorting"])


@router.post("/scan", response_model=ScanResponse)
def scan_barcode(
    payload: ScanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """
    Scan a parcel barcode at the sorting station.
    
    Returns driver name and bag position so the sorter knows where to place it.
    Only trieurs and admins can use this endpoint.
    """
    if current_user.role not in ("trieur", "admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux trieurs")
    
    return scan_parcel(db, payload.tracking_no, current_user.id)


@router.post("/unscan", response_model=ScanResponse)
def unscan_barcode(
    payload: ScanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """
    Undo a parcel scan - revert from 'sorted' back to 'assigned'.
    Only the sorter who scanned it can undo.
    """
    if current_user.role not in ("trieur", "admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux trieurs")
    
    return unscan_parcel(db, payload.tracking_no, current_user.id)


@router.get("/stats", response_model=SortingStats)
def my_sorting_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Get current sorter's statistics for today."""
    if current_user.role not in ("trieur", "admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux trieurs")
    
    return get_sorter_stats(db, current_user.id)


@router.get("/driver/{driver_id}/bag")
def driver_bag_status(
    driver_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """
    Get sorting progress for a specific driver's bag.
    Shows how many parcels are sorted vs pending.
    """
    if current_user.role not in ("trieur", "admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux trieurs")
    
    driver = db.query(User).filter(User.id == driver_id, User.role == "chauffeur").first()
    if not driver:
        raise HTTPException(status_code=404, detail="Chauffeur introuvable")
    
    summary = get_driver_bag_summary(db, driver_id)
    summary["driver_name"] = driver.username
    return summary


@router.get("/drivers/progress")
def all_drivers_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """
    Get sorting progress for all drivers (admin/trieur dashboard).
    """
    if current_user.role not in ("trieur", "admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux trieurs")
    
    drivers = db.query(User).filter(User.role == "chauffeur").all()
    
    result = []
    for driver in drivers:
        summary = get_driver_bag_summary(db, driver.id)
        if summary["total_parcels"] > 0:  # Only show drivers with parcels
            summary["driver_name"] = driver.username
            result.append(summary)
    
    # Sort by progress (least sorted first = needs attention)
    result.sort(key=lambda x: x["progress_percent"])
    return result


@router.get("/pending")
def pending_parcels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """
    List parcels that are assigned but not yet sorted.
    Useful for the sorting station to see what's coming.
    """
    if current_user.role not in ("trieur", "admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux trieurs")
    
    parcels = db.query(Parcel).filter(
        Parcel.status == "assigned",
        Parcel.driver_id.isnot(None),
    ).order_by(Parcel.timestamp_dispatch.desc()).limit(100).all()
    
    return [
        {
            "id": p.id,
            "tracking_no": p.tracking_no,
            "driver_id": p.driver_id,
            "zone_id": p.zone_id,
            "sequence_order": p.sequence_order,
        }
        for p in parcels
    ]
