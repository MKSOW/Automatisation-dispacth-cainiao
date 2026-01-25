"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Badge from "@/components/ui/badge";
import { fetchUsers, fetchParcels, getDriverRoute, User as ApiUser, Parcel as ApiParcel, OptimizedRoute } from "@/lib/api";

// Types
interface DashboardStats {
  totalParcels: number;
  pending: number;
  assigned: number;
  delivered: number;
}

interface Driver {
  id: number;
  name: string;
  status: "online" | "delivering" | "offline";
}

interface Parcel {
  id: number;
  tracking_no: string;
  address: string | null;
  status: string;
  driver_id: number | null;
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ totalParcels: 0, pending: 0, assigned: 0, delivered: 0 });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [recentParcels, setRecentParcels] = useState<Parcel[]>([]);
  const [parcels, setParcels] = useState<(ApiParcel & { driver_name?: string | null })[]>([]);
  const [driverRoutes, setDriverRoutes] = useState<Record<number, OptimizedRoute>>({});
  const [routeTotals, setRouteTotals] = useState<{ distance: number; duration: number | null }>({ distance: 0, duration: null });
  const [satellite, setSatellite] = useState(false);
  const [loading, setLoading] = useState(true);

  const LiveFleetMap = dynamic(() => import("@/components/live-fleet-map"), { ssr: false });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, parcelsData] = await Promise.all([
        fetchUsers(),
        fetchParcels(),
      ]);

      // Calculate stats from parcels
      const pending = parcelsData.filter(p => p.status === "pending").length;
      const assigned = parcelsData.filter(p => p.status === "assigned" || p.status === "in_transit").length;
      const delivered = parcelsData.filter(p => p.status === "delivered").length;

      setStats({
        totalParcels: parcelsData.length,
        pending,
        assigned,
        delivered,
      });

      // Get recent parcels (last 5)
      setRecentParcels(parcelsData.slice(0, 5).map(p => ({
        id: p.id,
        tracking_no: p.tracking_no,
        address: p.address,
        status: p.status,
        driver_id: p.driver_id,
      })));

      // Get drivers (users with role chauffeur)
      const chauffeurs = usersData.filter(u => u.role === "chauffeur");
      setDrivers(chauffeurs.map(u => ({
        id: u.id,
        name: u.username,
        status: "online" as const, // Default status
      })));

      // Fetch per-driver routes to compute KPI distance/ETA
      const routes = await Promise.all(chauffeurs.map(async (d) => {
        try {
          return await getDriverRoute(d.id);
        } catch {
          return null;
        }
      }));
      const routeMap: Record<number, OptimizedRoute> = {};
      let totalDist = 0;
      let totalDur: number | null = null;
      routes.forEach((r, idx) => {
        if (!r) return;
        const driverId = chauffeurs[idx].id;
        routeMap[driverId] = r;
        totalDist += r.total_distance_km || 0;
        if (r.total_duration_min !== null) {
          totalDur = (totalDur ?? 0) + r.total_duration_min;
        }
      });
      setDriverRoutes(routeMap);
      setRouteTotals({ distance: totalDist, duration: totalDur });

      // Prepare parcels with coordinates and driver names for the map
      const driverById = new Map(chauffeurs.map(u => [u.id, u.username]));
      setParcels(parcelsData.map(p => ({
        ...p,
        driver_name: p.driver_id ? driverById.get(p.driver_id) ?? null : null,
      })));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    } else if (!isLoading && user) {
      loadDashboardData();
    }
  }, [user, isLoading, router, loadDashboardData]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Parcels"
          value={stats.totalParcels}
          change={+12}
          icon="package"
        />
        <KPICard
          title="Pending"
          value={stats.pending}
          change={-2}
          icon="clock"
          variant="warning"
        />
        <KPICard
          title="Assigned"
          value={stats.assigned}
          change={+8}
          icon="user-check"
          variant="info"
          highlighted
        />
        <KPICard
          title="Delivered"
          value={stats.delivered}
          change={+15}
          icon="check-circle"
          variant="success"
        />
        <KPICard
          title="Distance tournées"
          value={`${routeTotals.distance.toFixed(1)} km`}
          change={0}
          icon="map"
          variant="info"
        />
        {routeTotals.duration !== null && (
          <KPICard
            title="Durée estimée"
            value={`${routeTotals.duration.toFixed(0)} min`}
            change={0}
            icon="clock"
            variant="info"
          />
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Live Fleet Map</h2>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter Zones
              </button>
              <button
                onClick={() => setSatellite((s) => !s)}
                className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {satellite ? "Standard" : "Satellite"}
              </button>
            </div>
          </div>

          <LiveFleetMap parcels={parcels} satellite={satellite} />
        </div>

        {/* Active Drivers */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Active Drivers</h2>
            <a href="/admin/users" className="text-sm text-accent-500 hover:text-accent-600">View All</a>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <button className="px-3 py-1 text-xs font-medium bg-accent-500 text-white rounded-full">ALL ({drivers.length})</button>
            <button className="px-3 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 rounded-full">ONLINE ({drivers.filter(d => d.status === "online").length})</button>
            <button className="px-3 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 rounded-full">AWAY ({drivers.filter(d => d.status === "offline").length})</button>
          </div>

          {/* Driver List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent-500 border-t-transparent"></div>
              </div>
            ) : drivers.length === 0 ? (
              <p className="text-center text-neutral-500 py-4">No drivers found</p>
            ) : (
            drivers.map((driver) => {
              const route = driverRoutes[driver.id];
              return (
                <div key={driver.id} className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 font-medium">
                        {driver.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        driver.status === "online" ? "bg-brand-500" :
                        driver.status === "delivering" ? "bg-accent-500" : "bg-neutral-400"
                      }`}></span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{driver.name}</p>
                      <p className="text-xs text-neutral-500">
                        ID #{driver.id} • {driver.status === "online" ? "Online" : driver.status === "delivering" ? "Delivering" : "Offline"}
                      </p>
                      {route && (
                        <p className="text-xs text-neutral-500">
                          {route.total_distance_km.toFixed(1)} km • {route.total_duration_min !== null ? `${route.total_duration_min.toFixed(0)} min` : "ETA n/a"}
                        </p>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })
            )}
          </div>

          <button className="w-full mt-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 border-t border-neutral-100">
            LOAD MORE
          </button>
        </div>
      </div>

      {/* Dispatch Log */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">Dispatch Log</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print List
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              <th className="px-4 py-3">Parcel ID</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Driver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {recentParcels.map((parcel) => (
              <tr key={parcel.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 text-sm font-medium text-accent-500">{parcel.tracking_no}</td>
                <td className="px-4 py-3 text-sm text-neutral-700">{parcel.address || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={
                    parcel.status === "in_transit" ? "info" :
                    parcel.status === "pending" ? "warning" : "success"
                  }>
                    {parcel.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-700">{parcel.driver_id ? `Driver #${parcel.driver_id}` : "Unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Dispatch Button */}
      <div className="fixed bottom-6 left-6">
        <button className="px-5 py-3 bg-accent-500 text-white rounded-xl shadow-lg hover:bg-accent-600 transition-colors flex items-center gap-2 font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Quick Dispatch
        </button>
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  change, 
  icon, 
  variant = "default",
  highlighted = false 
}: { 
  title: string; 
  value: number; 
  change: number;
  icon: string;
  variant?: "default" | "success" | "warning" | "info";
  highlighted?: boolean;
}) {
  const iconMap: Record<string, JSX.Element> = {
    package: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    "user-check": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    "check-circle": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  };

  const variantColors = {
    default: "text-neutral-500",
    success: "text-brand-500",
    warning: "text-amber-500",
    info: "text-accent-500",
  };

  return (
    <div className={`bg-white rounded-xl p-5 border ${highlighted ? "border-accent-300 ring-2 ring-accent-100" : "border-neutral-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{title}</span>
        <svg className={`w-5 h-5 ${variantColors[variant]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {iconMap[icon]}
        </svg>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-neutral-900">{value.toLocaleString()}</span>
        <span className={`text-sm font-medium ${change >= 0 ? "text-brand-500" : "text-danger-500"}`}>
          {change >= 0 ? "+" : ""}{change}%
          <svg className={`w-3 h-3 inline ml-0.5 ${change >= 0 ? "" : "rotate-180"}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </div>
  );
}
