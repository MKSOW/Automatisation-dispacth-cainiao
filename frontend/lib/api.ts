export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// ─────────────────────────────────────────────────────────────
// Types correspondant aux schemas backend
// ─────────────────────────────────────────────────────────────

export interface LoginResponse {
  id: number;
  username: string;
  role: string;
  access_token: string;
  token_type: string;
  message: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface UserCreate {
  username: string;
  password: string;
  role: string;
}

export interface Parcel {
  id: number;
  tracking_no: string;
  source: string | null;
  status: string;
  driver_id: number | null;
  sorter_id: number | null;
  zone_id: number | null;
  sequence_order: number | null;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ParcelCreate {
  tracking_no: string;
  source?: string;
  address: string;
  zone_id?: number;
  driver_id?: number;
}

export interface OptimizedStop {
  parcel_id: number;
  tracking_no: string;
  address: string;
  sequence: number;
  distance_km: number | null;
  duration_min: number | null;
  google_maps_url: string;
  waze_url: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OptimizedRoute {
  driver_id: number;
  total_distance_km: number;
  total_duration_min: number | null;
  stops: OptimizedStop[];
}

export interface ScanResponse {
  success: boolean;
  message: string;
  tracking_no: string;
  parcel_id: number | null;
  driver_name: string | null;
  driver_id: number | null;
  bag_position: number | null;
  zone_name: string | null;
  already_sorted: boolean;
}

export interface SortingStats {
  sorter_id: number;
  total_scanned_today: number;
  last_scan_time: string | null;
}

export interface DriverBagSummary {
  driver_id: number;
  driver_name: string;
  total_parcels: number;
  sorted_count: number;
}

// ─────────────────────────────────────────────────────────────
// Token Management
// ─────────────────────────────────────────────────────────────

export function storeToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("lh_access_token", token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("lh_access_token");
  }
  return null;
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("lh_access_token");
  }
}

// ─────────────────────────────────────────────────────────────
// API Helper avec gestion du token
// ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail?.detail || `Erreur ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail?.detail || "Échec de l'authentification");
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────
// Users API
// ─────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  return apiFetch<User[]>("/users");
}

export async function createUser(data: UserCreate): Promise<User> {
  return apiFetch<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: number, data: { password?: string; role?: string }): Promise<User> {
  return apiFetch<User>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<void> {
  return apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────
// Parcels / Dispatch API
// ─────────────────────────────────────────────────────────────

export async function fetchParcels(params?: { status?: string; driver_id?: number }): Promise<Parcel[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.driver_id) query.append("driver_id", String(params.driver_id));
  const queryStr = query.toString();
  return apiFetch<Parcel[]>(`/dispatch/parcels${queryStr ? `?${queryStr}` : ""}`);
}

export async function createParcel(data: ParcelCreate): Promise<Parcel> {
  return apiFetch<Parcel>("/dispatch/parcels", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function bulkUploadParcels(parcels: ParcelCreate[], zoneId?: number, driverId?: number): Promise<{ created: number }> {
  return apiFetch<{ created: number }>("/dispatch/upload", {
    method: "POST",
    body: JSON.stringify({ parcels, zone_id: zoneId, driver_id: driverId }),
  });
}

export async function assignParcelsToDriver(parcelIds: number[], driverId: number): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>("/dispatch/assign", {
    method: "POST",
    body: JSON.stringify({ parcel_ids: parcelIds, driver_id: driverId }),
  });
}

export async function geocodeParcels(): Promise<{ geocoded: number; failed: number }> {
  return apiFetch<{ geocoded: number; failed: number }>("/dispatch/geocode", { method: "POST" });
}

export async function optimizeRoute(driverId: number, depotAddress?: string): Promise<OptimizedRoute> {
  return apiFetch<OptimizedRoute>("/dispatch/optimize", {
    method: "POST",
    body: JSON.stringify({ driver_id: driverId, depot_address: depotAddress || "Casablanca, Maroc" }),
  });
}

export async function getDriverRoute(driverId: number): Promise<OptimizedRoute> {
  return apiFetch<OptimizedRoute>(`/dispatch/route/${driverId}`);
}

export async function reorderDriverRoute(driverId: number, parcelIds: number[]): Promise<OptimizedRoute> {
  return apiFetch<OptimizedRoute>(`/dispatch/route/${driverId}/reorder`, {
    method: "POST",
    body: JSON.stringify({ parcel_ids: parcelIds }),
  });
}

// ─────────────────────────────────────────────────────────────
// Sorting API
// ─────────────────────────────────────────────────────────────

export async function scanParcel(trackingNo: string): Promise<ScanResponse> {
  return apiFetch<ScanResponse>("/sorting/scan", {
    method: "POST",
    body: JSON.stringify({ tracking_no: trackingNo }),
  });
}

export async function unscanParcel(trackingNo: string): Promise<ScanResponse> {
  return apiFetch<ScanResponse>("/sorting/unscan", {
    method: "POST",
    body: JSON.stringify({ tracking_no: trackingNo }),
  });
}

export async function getSorterStats(sorterId: number): Promise<SortingStats> {
  return apiFetch<SortingStats>(`/sorting/stats/${sorterId}`);
}

export async function getDriverBagSummary(): Promise<DriverBagSummary[]> {
  return apiFetch<DriverBagSummary[]>("/sorting/bags");
}

// ─────────────────────────────────────────────────────────────
// Upload API (GOFO / CAINIAO Excel files)
// ─────────────────────────────────────────────────────────────

export interface UploadResult {
  message: string;
  file_type: string;
  filename: string;
  total_rows: number;
  inserted: number;
  duplicates: number;
  errors: string[] | null;
}

export interface UploadStats {
  total_parcels: number;
  gofo_count: number;
  cainiao_count: number;
  pending: number;
  assigned: number;
}

export async function uploadParcelFile(
  file: File,
  fileType: "gofo" | "cainiao"
): Promise<UploadResult> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/upload/parcels?file_type=${fileType}`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail?.detail?.message || detail?.detail || `Erreur ${response.status}`);
  }

  return response.json();
}

export async function getUploadStats(): Promise<UploadStats> {
  return apiFetch<UploadStats>("/upload/stats");
}

export async function clearAllParcels(): Promise<{ message: string; deleted_count: number }> {
  return apiFetch<{ message: string; deleted_count: number }>(
    "/upload/parcels?confirm=true",
    { method: "DELETE" }
  );
}

