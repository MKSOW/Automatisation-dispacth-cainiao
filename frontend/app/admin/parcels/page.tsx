"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge";
import {
  fetchParcels,
  fetchUsers,
  createParcel,
  assignParcelsToDriver,
  Parcel as ApiParcel,
  User as ApiUser,
  ParcelCreate,
} from "@/lib/api";

interface Parcel {
  id: number;
  tracking_no: string;
  source: string | null;
  address: string | null;
  status: "pending" | "assigned" | "in_transit" | "delivered";
  driver_id: number | null;
}

export default function ParcelsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [drivers, setDrivers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedParcels, setSelectedParcels] = useState<number[]>([]);

  // Modal states
  const [showNewParcelModal, setShowNewParcelModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newParcel, setNewParcel] = useState<ParcelCreate>({ tracking_no: "", address: "" });
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadParcels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [parcelData, usersData] = await Promise.all([fetchParcels(), fetchUsers()]);
      setParcels(parcelData.map(p => ({
        id: p.id,
        tracking_no: p.tracking_no,
        source: p.source,
        address: p.address,
        status: (p.status || "pending") as Parcel["status"],
        driver_id: p.driver_id,
      })));
      setDrivers(usersData.filter(u => u.role === "chauffeur"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    } else if (!isLoading && user) {
      loadParcels();
    }
  }, [user, isLoading, router, loadParcels]);

  const filteredParcels = parcels.filter(p => {
    const matchesSearch = p.tracking_no.toLowerCase().includes(search.toLowerCase()) ||
                         (p.address?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: number) => {
    setSelectedParcels(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedParcels.length === filteredParcels.length) {
      setSelectedParcels([]);
    } else {
      setSelectedParcels(filteredParcels.map(p => p.id));
    }
  };

  // Create a new parcel
  const handleCreateParcel = async () => {
    if (!newParcel.tracking_no.trim() || !newParcel.address?.trim()) {
      setError("Tracking ID et adresse requis");
      return;
    }
    try {
      setSubmitting(true);
      await createParcel(newParcel);
      setShowNewParcelModal(false);
      setNewParcel({ tracking_no: "", address: "" });
      await loadParcels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur création");
    } finally {
      setSubmitting(false);
    }
  };

  // Assign selected parcels to a driver
  const handleAssign = async () => {
    if (!selectedDriver || selectedParcels.length === 0) return;
    try {
      setSubmitting(true);
      await assignParcelsToDriver(selectedParcels, selectedDriver);
      setShowAssignModal(false);
      setSelectedDriver(null);
      setSelectedParcels([]);
      await loadParcels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur assignation");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-500 border-t-transparent"></div>
      </div>
    );
  }

  const statusColors: Record<string, "warning" | "info" | "success"> = {
    pending: "warning",
    assigned: "info",
    in_transit: "info",
    delivered: "success",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Parcel Management</h1>
          <p className="text-neutral-500">Monitoring {parcels.length} active shipments across all regions</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button
          onClick={() => setShowAssignModal(true)}
          disabled={selectedParcels.length === 0}
          className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Assign to Driver
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">DATE RANGE</label>
            <button className="px-3 py-2 border border-neutral-200 rounded-lg text-sm flex items-center gap-2 hover:bg-neutral-50">
              Last 7 Days
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">ZONE</label>
            <select className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500">
              <option>All Zones</option>
              <option>North</option>
              <option>South</option>
              <option>East</option>
              <option>West</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            {(["all", "pending", "assigned", "in_transit", "delivered"] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  statusFilter === status
                    ? "bg-accent-500 text-white"
                    : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {status === "all" ? "All" : status === "in_transit" ? "In Transit" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <button className="text-sm text-accent-500 hover:text-accent-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-accent-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-danger-600">{error}</div>
        ) : (
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedParcels.length === filteredParcels.length && filteredParcels.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-neutral-300"
                />
              </th>
              <th className="px-4 py-3">Tracking ID</th>
              <th className="px-4 py-3">Address / Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredParcels.map((parcel) => (
              <tr key={parcel.id} className={`hover:bg-neutral-50 ${selectedParcels.includes(parcel.id) ? "bg-accent-50" : ""}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedParcels.includes(parcel.id)}
                    onChange={() => toggleSelect(parcel.id)}
                    className="w-4 h-4 rounded border-neutral-300"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-accent-500">{parcel.tracking_no}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{parcel.address || "—"}</p>
                    <p className="text-xs text-neutral-500">{parcel.source || "N/A"}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusColors[parcel.status] || "warning"}>
                    {parcel.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {parcel.driver_id ? (
                    <span className="text-sm text-neutral-700">Driver #{parcel.driver_id}</span>
                  ) : (
                    <span className="text-sm text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Rows per page:</span>
            <select className="text-sm border border-neutral-200 rounded px-2 py-1">
              <option>25</option>
              <option>50</option>
              <option>100</option>
            </select>
            <span className="text-sm text-neutral-500 ml-4">1-25 of 1,240 parcels</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400">|&lt;</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400">&lt;</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400">&gt;</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400">&gt;|</button>
          </div>
        </div>
      </div>

      {/* Selection Action Bar */}
      {selectedParcels.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-800 text-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-4">
          <span className="bg-accent-500 px-2 py-1 rounded text-sm font-medium">{selectedParcels.length} Selected</span>
          <span className="text-neutral-400">Action for selected parcel</span>
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Label
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Change Zone
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-accent-500 hover:bg-accent-600 rounded font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            Assign Now
          </button>
        </div>
      )}

      {/* New Parcel Modal */}
      {showNewParcelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">New Parcel</h2>
              <button onClick={() => setShowNewParcelModal(false)} className="p-1 hover:bg-neutral-100 rounded">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tracking ID</label>
                <input
                  type="text"
                  value={newParcel.tracking_no}
                  onChange={(e) => setNewParcel({ ...newParcel, tracking_no: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="PKG-123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newParcel.address || ""}
                  onChange={(e) => setNewParcel({ ...newParcel, address: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="123 Rue Example, Casablanca"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Source (optionnel)</label>
                <input
                  type="text"
                  value={newParcel.source || ""}
                  onChange={(e) => setNewParcel({ ...newParcel, source: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="Cainiao"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewParcelModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateParcel}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Assign {selectedParcels.length} parcel(s)</h2>
              <button onClick={() => setShowAssignModal(false)} className="p-1 hover:bg-neutral-100 rounded">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Select Driver</label>
              <select
                value={selectedDriver ?? ""}
                onChange={(e) => setSelectedDriver(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="">-- Choose --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.username} (#{d.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={submitting || !selectedDriver}
                className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50"
              >
                {submitting ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Parcel Button */}
      <div className="fixed bottom-6 left-6">
        <button
          onClick={() => setShowNewParcelModal(true)}
          className="px-5 py-3 bg-accent-500 text-white rounded-xl shadow-lg hover:bg-accent-600 transition-colors flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Parcel
        </button>
      </div>
    </div>
  );
}
