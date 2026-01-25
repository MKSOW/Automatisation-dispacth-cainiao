"""Sorting service: barcode scanning and bag assignment."""
from datetime import datetime, timezone, date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.orm import Parcel, User, Zone
from app.models.schemas import ScanResponse, SortingStats


def scan_parcel(db: Session, tracking_no: str, sorter_id: int) -> ScanResponse:
    """
    Process a barcode scan from the sorting station.
    
    Returns driver name + bag position so the sorter knows where to place the parcel.
    """
    # Find the parcel
    parcel = db.query(Parcel).filter(Parcel.tracking_no == tracking_no.strip()).first()
    
    if not parcel:
        return ScanResponse(
            success=False,
            message="Colis introuvable",
            tracking_no=tracking_no,
        )
    
    # Check if already sorted
    if parcel.status == "sorted":
        # Get driver info anyway for display
        driver = db.query(User).filter(User.id == parcel.driver_id).first() if parcel.driver_id else None
        zone = db.query(Zone).filter(Zone.id == parcel.zone_id).first() if parcel.zone_id else None
        bag_position = parcel.sequence_order
        if bag_position is None and parcel.driver_id:
            # Fallback: count how many sorted parcels for this driver to give a position
            count_sorted = db.query(func.count(Parcel.id)).filter(Parcel.driver_id == parcel.driver_id, Parcel.status == "sorted").scalar() or 0
            bag_position = count_sorted
        
        return ScanResponse(
            success=True,
            message="Colis déjà trié",
            tracking_no=tracking_no,
            parcel_id=parcel.id,
            driver_name=driver.username if driver else None,
            driver_id=parcel.driver_id,
            bag_position=bag_position,
            zone_name=zone.zone_name if zone else None,
            already_sorted=True,
        )
    
    # Check if parcel has a driver assigned
    if not parcel.driver_id:
        return ScanResponse(
            success=False,
            message="Colis non assigné à un chauffeur",
            tracking_no=tracking_no,
            parcel_id=parcel.id,
        )
    
    # Get driver and zone info
    driver = db.query(User).filter(User.id == parcel.driver_id).first()
    zone = db.query(Zone).filter(Zone.id == parcel.zone_id).first() if parcel.zone_id else None
    
    # Determine bag position: keep existing route order if set, otherwise append
    if parcel.sequence_order is None:
        max_pos = db.query(func.max(Parcel.sequence_order)).filter(Parcel.driver_id == parcel.driver_id).scalar()
        parcel.sequence_order = (max_pos or 0) + 1

    # Update parcel status
    parcel.status = "sorted"
    parcel.sorter_id = sorter_id
    parcel.timestamp_sort = datetime.now(timezone.utc)
    db.commit()
    
    return ScanResponse(
        success=True,
    message=f"OK → {driver.username if driver else 'Chauffeur inconnu'} | Position {parcel.sequence_order or '?'}",
        tracking_no=tracking_no,
        parcel_id=parcel.id,
        driver_name=driver.username if driver else None,
        driver_id=parcel.driver_id,
        bag_position=parcel.sequence_order,
        zone_name=zone.zone_name if zone else None,
        already_sorted=False,
    )


def get_sorter_stats(db: Session, sorter_id: int) -> SortingStats:
    """Get today's sorting statistics for a sorter."""
    today = date.today()
    
    # Count parcels sorted today by this sorter
    count = db.query(func.count(Parcel.id)).filter(
        Parcel.sorter_id == sorter_id,
        func.date(Parcel.timestamp_sort) == today,
    ).scalar() or 0
    
    # Get last scan time
    last_parcel = db.query(Parcel).filter(
        Parcel.sorter_id == sorter_id,
    ).order_by(Parcel.timestamp_sort.desc()).first()
    
    last_time = None
    if last_parcel and last_parcel.timestamp_sort:
        last_time = last_parcel.timestamp_sort.isoformat()
    
    return SortingStats(
        sorter_id=sorter_id,
        total_scanned_today=count,
        last_scan_time=last_time,
    )


def unscan_parcel(db: Session, tracking_no: str, sorter_id: int) -> ScanResponse:
    """
    Undo a scan: revert parcel from 'sorted' back to 'assigned'.
    Only the sorter who scanned it (or an admin) can undo.
    """
    parcel = db.query(Parcel).filter(Parcel.tracking_no == tracking_no.strip()).first()
    
    if not parcel:
        return ScanResponse(
            success=False,
            message="Colis introuvable",
            tracking_no=tracking_no,
        )
    
    if parcel.status != "sorted":
        return ScanResponse(
            success=False,
            message="Colis non trié - rien à annuler",
            tracking_no=tracking_no,
            parcel_id=parcel.id,
        )
    
    # Check if this sorter scanned it (or let it through for now)
    if parcel.sorter_id and parcel.sorter_id != sorter_id:
        return ScanResponse(
            success=False,
            message="Vous n'avez pas scanné ce colis",
            tracking_no=tracking_no,
            parcel_id=parcel.id,
        )
    
    # Revert to assigned status
    parcel.status = "assigned"
    parcel.sorter_id = None
    parcel.timestamp_sort = None
    db.commit()
    
    return ScanResponse(
        success=True,
        message="Scan annulé - colis remis en attente de tri",
        tracking_no=tracking_no,
        parcel_id=parcel.id,
        already_sorted=False,
    )


def get_driver_bag_summary(db: Session, driver_id: int) -> dict:
    """Get summary of parcels in a driver's bag."""
    parcels = db.query(Parcel).filter(
        Parcel.driver_id == driver_id,
        Parcel.status.in_(["assigned", "sorted"]),
    ).order_by(Parcel.sequence_order.asc().nullslast()).all()
    
    total = len(parcels)
    sorted_count = sum(1 for p in parcels if p.status == "sorted")
    pending_count = total - sorted_count
    
    return {
        "driver_id": driver_id,
        "total_parcels": total,
        "sorted": sorted_count,
        "pending_sort": pending_count,
        "progress_percent": round(sorted_count / total * 100, 1) if total > 0 else 0,
    }
