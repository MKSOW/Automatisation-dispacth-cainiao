"""Dispatch service: parcel management and route optimization."""
from datetime import datetime, timezone
from typing import Sequence
from urllib.parse import quote_plus

from sqlalchemy.orm import Session

from app.models.orm import Parcel, User
from app.models.schemas import (
    ParcelCreate,
    OptimizedStop,
    OptimizedRoute,
)


# ───────────────────────────────────────
# Parcel CRUD
# ───────────────────────────────────────
def create_parcel(db: Session, data: ParcelCreate) -> Parcel:
    """Create a single parcel."""
    parcel = Parcel(
        tracking_no=data.tracking_no,
        source=data.source,
        address=data.address,
        zone_id=data.zone_id,
        driver_id=data.driver_id,
        status="pending",
    )
    db.add(parcel)
    db.commit()
    db.refresh(parcel)
    return parcel


def bulk_create_parcels(db: Session, parcels_data: list[ParcelCreate], zone_id: int | None = None, driver_id: int | None = None) -> list[Parcel]:
    """Bulk import parcels."""
    created = []
    for p in parcels_data:
        parcel = Parcel(
            tracking_no=p.tracking_no,
            source=p.source,
            address=p.address,
            zone_id=zone_id or p.zone_id,
            driver_id=driver_id or p.driver_id,
            status="assigned" if (driver_id or p.driver_id) else "pending",
            timestamp_dispatch=datetime.now(timezone.utc) if (driver_id or p.driver_id) else None,
        )
        db.add(parcel)
        created.append(parcel)
    db.commit()
    for p in created:
        db.refresh(p)
    return created


def assign_parcels_to_driver(db: Session, parcel_ids: list[int], driver_id: int) -> list[Parcel]:
    """Assign a batch of parcels to a driver."""
    parcels = db.query(Parcel).filter(Parcel.id.in_(parcel_ids)).all()
    now = datetime.now(timezone.utc)
    for p in parcels:
        p.driver_id = driver_id
        p.status = "assigned"
        p.timestamp_dispatch = now
    db.commit()
    return parcels


def get_driver_parcels(db: Session, driver_id: int, status: str | None = None) -> Sequence[Parcel]:
    """Get all parcels assigned to a driver, optionally filtered by status."""
    query = db.query(Parcel).filter(Parcel.driver_id == driver_id)
    if status:
        query = query.filter(Parcel.status == status)
    return query.order_by(Parcel.sequence_order.asc().nullslast(), Parcel.id).all()


# ───────────────────────────────────────
# Geocoding (via geopy Nominatim)
# ───────────────────────────────────────
def geocode_address(address: str) -> tuple[float, float] | None:
    """Geocode an address to (lat, lon). Returns None if failed."""
    try:
        from geopy.geocoders import Nominatim
        geolocator = Nominatim(user_agent="cainiao-dispatch")
        location = geolocator.geocode(address, timeout=10)
        if location:
            return (location.latitude, location.longitude)
    except Exception:
        pass
    return None


def geocode_parcels(db: Session, parcel_ids: list[int]) -> int:
    """Geocode parcels that don't have coordinates yet. Returns count updated."""
    parcels = db.query(Parcel).filter(
        Parcel.id.in_(parcel_ids),
        Parcel.latitude.is_(None),
        Parcel.address.isnot(None),
    ).all()
    
    updated = 0
    for p in parcels:
        coords = geocode_address(p.address)
        if coords:
            p.latitude = str(coords[0])
            p.longitude = str(coords[1])
            updated += 1
    db.commit()
    return updated


# ───────────────────────────────────────
# Distance calculation
# ───────────────────────────────────────
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two points using Haversine formula."""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c


def build_distance_matrix(coords: list[tuple[float, float]]) -> list[list[float]]:
    """Build a distance matrix from a list of coordinates."""
    n = len(coords)
    matrix = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                matrix[i][j] = haversine_distance(
                    coords[i][0], coords[i][1],
                    coords[j][0], coords[j][1]
                )
    return matrix


# ───────────────────────────────────────
# TSP Optimization (OR-Tools)
# ───────────────────────────────────────
def solve_tsp(distance_matrix: list[list[float]]) -> list[int]:
    """Solve TSP using OR-Tools. Returns ordered indices (starting from depot=0)."""
    try:
        from ortools.constraint_solver import routing_enums_pb2
        from ortools.constraint_solver import pywrapcp
    except ImportError:
        # Fallback: return indices as-is (no optimization)
        return list(range(len(distance_matrix)))
    
    n = len(distance_matrix)
    if n <= 1:
        return list(range(n))
    
    # Scale to integers (OR-Tools requires int)
    scale = 1000
    int_matrix = [[int(d * scale) for d in row] for row in distance_matrix]
    
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)  # 1 vehicle, depot at 0
    routing = pywrapcp.RoutingModel(manager)
    
    def distance_callback(from_idx, to_idx):
        from_node = manager.IndexToNode(from_idx)
        to_node = manager.IndexToNode(to_idx)
        return int_matrix[from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    
    solution = routing.SolveWithParameters(search_params)
    
    if solution:
        route = []
        index = routing.Start(0)
        while not routing.IsEnd(index):
            route.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        return route
    
    return list(range(n))


def optimize_driver_route(db: Session, driver_id: int, depot_address: str = "Casablanca, Maroc") -> OptimizedRoute:
    """Optimize the delivery route for a driver using TSP."""
    # Get assigned/sorted parcels
    parcels = db.query(Parcel).filter(
        Parcel.driver_id == driver_id,
        Parcel.status.in_(["assigned", "sorted"]),
        Parcel.latitude.isnot(None),
        Parcel.longitude.isnot(None),
    ).all()
    
    if not parcels:
        return OptimizedRoute(driver_id=driver_id, total_distance_km=0, stops=[])
    
    # Geocode depot
    depot_coords = geocode_address(depot_address)
    if not depot_coords:
        depot_coords = (33.5731, -7.5898)  # Default: Casablanca
    
    # Build coordinates list (depot first)
    coords = [depot_coords]
    for p in parcels:
        coords.append((float(p.latitude), float(p.longitude)))
    
    # Solve TSP
    distance_matrix = build_distance_matrix(coords)
    route_indices = solve_tsp(distance_matrix)
    
    # Build result
    total_distance = 0.0
    stops = []
    prev_idx = 0  # Start at depot
    
    for seq, idx in enumerate(route_indices):
        if idx == 0:  # Skip depot
            continue
        
        parcel = parcels[idx - 1]  # -1 because depot is index 0
        dist = distance_matrix[prev_idx][idx]
        total_distance += dist
        
        # Update sequence in DB
        parcel.sequence_order = seq
        
        # Build navigation URLs
        addr_encoded = quote_plus(parcel.address or "")
        lat, lon = parcel.latitude, parcel.longitude
        
        stops.append(OptimizedStop(
            parcel_id=parcel.id,
            tracking_no=parcel.tracking_no,
            address=parcel.address or "",
            sequence=seq,
            distance_km=round(dist, 2),
            google_maps_url=f"https://www.google.com/maps/dir/?api=1&destination={lat},{lon}",
            waze_url=f"https://waze.com/ul?ll={lat},{lon}&navigate=yes",
        ))
        
        prev_idx = idx
    
    db.commit()
    
    return OptimizedRoute(
        driver_id=driver_id,
        total_distance_km=round(total_distance, 2),
        stops=stops,
    )
