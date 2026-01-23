"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge";

interface User {
  id: number;
  name: string;
  email: string;
  role: "chauffeur" | "trieur" | "admin";
  status: "active" | "on_leave" | "inactive";
  lastActive: string;
}

// Mock data
const mockUsers: User[] = [
  { id: 1, name: "Jean Dupont", email: "j.dupont@logisticshub.com", role: "chauffeur", status: "active", lastActive: "2 mins ago" },
  { id: 2, name: "Marie Lavoie", email: "m.lavoie@logisticshub.com", role: "trieur", status: "on_leave", lastActive: "1 day ago" },
  { id: 3, name: "Marc Bernard", email: "m.bernard@logisticshub.com", role: "chauffeur", status: "active", lastActive: "Just now" },
  { id: 4, name: "Sophie Martin", email: "s.martin@logisticshub.com", role: "admin", status: "active", lastActive: "5 mins ago" },
  { id: 5, name: "Lucas Petit", email: "l.petit@logisticshub.com", role: "trieur", status: "active", lastActive: "10 mins ago" },
];

export default function UsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "chauffeur", password: "" });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    chauffeurs: users.filter(u => u.role === "chauffeur" && u.status === "active").length,
    trieurs: users.filter(u => u.role === "trieur" && u.status === "active").length,
  };

  const handleAddUser = () => {
    const id = Math.max(...users.map(u => u.id)) + 1;
    setUsers([...users, {
      id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as User["role"],
      status: "active",
      lastActive: "Just now"
    }]);
    setShowModal(false);
    setNewUser({ name: "", email: "", role: "chauffeur", password: "" });
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">User Management</h1>
          <p className="text-neutral-500">Configure credentials and operational roles for your hub staff.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">TOTAL HUB STAFF</span>
            <span className="text-sm font-medium text-brand-500">+5%</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">ACTIVE CHAUFFEURS</span>
            <span className="text-sm font-medium text-brand-500">+2%</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.chauffeurs}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">ACTIVE TRIEURS</span>
            <span className="text-sm font-medium text-danger-500">-1%</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.trieurs}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-4 border-b border-neutral-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>
          <button className="px-3 py-2 border border-neutral-200 rounded-lg text-sm flex items-center gap-2 hover:bg-neutral-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Role
          </button>
          <button className="px-3 py-2 border border-neutral-200 rounded-lg text-sm flex items-center gap-2 hover:bg-neutral-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Status
          </button>
        </div>

        {/* Users Table */}
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 font-medium">
                      {u.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{u.name}</p>
                      <p className="text-xs text-neutral-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-md capitalize">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      u.status === "active" ? "bg-brand-500" :
                      u.status === "on_leave" ? "bg-danger-500" : "bg-neutral-400"
                    }`}></span>
                    <span className={`text-sm ${
                      u.status === "active" ? "text-brand-600" :
                      u.status === "on_leave" ? "text-danger-600" : "text-neutral-500"
                    }`}>
                      {u.status === "active" ? "Active" : u.status === "on_leave" ? "On Leave" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">{u.lastActive}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between">
          <p className="text-sm text-neutral-500">Showing {filteredUsers.length} of {users.length} users</p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-neutral-900 text-white text-sm font-medium">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-600 text-sm">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-600 text-sm">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-neutral-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="john@logisticshub.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="chauffeur">Chauffeur</option>
                  <option value="trieur">Trieur</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
