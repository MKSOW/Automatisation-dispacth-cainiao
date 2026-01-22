"""Pydantic schemas used by the API."""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id: int
    username: EmailStr
    role: str
    access_token: str
    token_type: str = "bearer"
    message: str = "Authenticated"


# ───────────────────────────────────────
# User management schemas
# ───────────────────────────────────────
class UserCreate(BaseModel):
    username: EmailStr
    password: str
    role: str = "chauffeur"  # admin | trieur | chauffeur


class UserRead(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    password: str | None = None
    role: str | None = None


# ───────────────────────────────────────
# Parcel / Dispatch schemas
# ───────────────────────────────────────
class ParcelCreate(BaseModel):
    tracking_no: str
    source: str | None = None
    address: str  # Adresse de livraison (pour géocodage)
    zone_id: int | None = None
    driver_id: int | None = None


class ParcelRead(BaseModel):
    id: int
    tracking_no: str
    source: str | None
    status: str
    driver_id: int | None
    sorter_id: int | None
    zone_id: int | None
    sequence_order: int | None
    address: str | None = None

    class Config:
        from_attributes = True


class ParcelBulkUpload(BaseModel):
    """Liste de colis pour import en masse."""
    parcels: list[ParcelCreate]
    zone_id: int | None = None
    driver_id: int | None = None


class DispatchAssign(BaseModel):
    """Assigner un lot de colis à un chauffeur."""
    parcel_ids: list[int]
    driver_id: int


class OptimizeRequest(BaseModel):
    """Demande d'optimisation d'itinéraire pour un chauffeur."""
    driver_id: int
    depot_address: str = "Casablanca, Maroc"  # Point de départ


class OptimizedStop(BaseModel):
    """Un arrêt dans l'itinéraire optimisé."""
    parcel_id: int
    tracking_no: str
    address: str
    sequence: int
    distance_km: float | None = None
    google_maps_url: str
    waze_url: str


class OptimizedRoute(BaseModel):
    """Résultat de l'optimisation TSP."""
    driver_id: int
    total_distance_km: float
    stops: list[OptimizedStop]


# ───────────────────────────────────────
# Sorting / Scan schemas
# ───────────────────────────────────────
class ScanRequest(BaseModel):
    """Requête de scan d'un colis par le trieur."""
    tracking_no: str


class ScanResponse(BaseModel):
    """Réponse après scan : info chauffeur + position dans le sac."""
    success: bool
    message: str
    tracking_no: str
    parcel_id: int | None = None
    driver_name: str | None = None
    driver_id: int | None = None
    bag_position: int | None = None  # sequence_order = position dans le sac
    zone_name: str | None = None
    already_sorted: bool = False


class SortingStats(BaseModel):
    """Statistiques de tri pour un trieur."""
    sorter_id: int
    total_scanned_today: int
    last_scan_time: str | None = None



