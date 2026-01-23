"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge";

interface Parcel {
  id: string;
  trackingNo: string;
  recipient: string;
  address: string;
  zone: string;
  addedDate: string;
  weight: string;
  status: "pending" | "assigned" | "sorted" | "delivered";
  driver: string | null;
}

// Mock data
const mockParcels: Parcel[] = [
  { id: "1", trackingNo: "#PL-882104", recipient: "Sarah Jenkins", address: "422 Oak St, Suite 400", zone: "North", addedDate: "Oct 24, 08:30 AM", weight: "1.2 kg", status: "pending", driver: null },
  { id: "2", trackingNo: "#PL-882105", recipient: "TechSolutions Inc.", address: "101 Innovation Way", zone: "East", addedDate: "Oct 24, 09:15 AM", weight: "15.5 kg", status: "assigned", driver: "Marcus K." },
  { id: "3", trackingNo: "#PL-882106", recipient: "Benjamin Walters", address: "99 Harbour Quay", zone: "South", addedDate: "Oct 23, 04:45 PM", weight: "0.4 kg", status: "sorted", driver: null },
  { id: "4", trackingNo: "#PL-882107", recipient: "Diana Prince", address: "700 Skyline Drive", zone: "West", addedDate: "Oct 23, 11:20 AM", weight: "4.8 kg", status: "delivered", driver: "Elena R." },
  { id: "5", trackingNo: "#PL-882108", recipient: "Wayne Industries", address: "1007 Mountain Drive", zone: "North", addedDate: "Oct 24, 10:00 AM", weight: "22.1 kg", status: "pending", driver: null },
];

export default function ParcelsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [parcels, setParcels] = useState<Parcel[]>(mockParcels);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const filteredParcels = parcels.filter(p => {
    const matchesSearch = p.trackingNo.toLowerCase().includes(search.toLowerCase()) ||
                         p.recipient.toLowerCase().includes(search.toLowerCase()) ||
                         (p.driver?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
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

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-500 border-t-transparent"></div>
      </div>
    );
  }

  const statusColors: Record<Parcel["status"], "warning" | "info" | "default" | "success"> = {
    pending: "warning",
    assigned: "info",
    sorted: "default",
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
          <button className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-2 font-medium">
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
            {(["all", "pending", "assigned", "delivered"] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  statusFilter === status
                    ? "bg-accent-500 text-white"
                    : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
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
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Added Date</th>
              <th className="px-4 py-3">Weight</th>
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
                <td className="px-4 py-3 text-sm font-medium text-accent-500">{parcel.trackingNo}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{parcel.recipient}</p>
                    <p className="text-xs text-neutral-500">{parcel.address}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded">
                    {parcel.zone}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">{parcel.addedDate}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{parcel.weight}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusColors[parcel.status]}>
                    {parcel.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {parcel.driver ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center text-xs">
                        {parcel.driver.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm text-neutral-700">{parcel.driver}</span>
                    </div>
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

      {/* New Parcel Button */}
      <div className="fixed bottom-6 left-6">
        <button className="px-5 py-3 bg-accent-500 text-white rounded-xl shadow-lg hover:bg-accent-600 transition-colors flex items-center gap-2 font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Parcel
        </button>
      </div>
    </div>
  );
}
