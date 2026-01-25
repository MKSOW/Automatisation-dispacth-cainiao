"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { fetchUsers, createUser, deleteUser, updateUser, User as ApiUser } from "@/lib/api";

interface User {
  id: number;
  username: string;
  role: "chauffeur" | "trieur" | "admin";
  status: "active" | "inactive";
}

interface EditingUser {
  id: number;
  username: string;
  role: string;
  password: string;
}

export default function UsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [newUser, setNewUser] = useState({ username: "", role: "chauffeur", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      setUsers(data.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role as User["role"],
        status: "active" as const,
      })));
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
      loadUsers();
    }
  }, [user, isLoading, router, loadUsers]);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    chauffeurs: users.filter(u => u.role === "chauffeur").length,
    trieurs: users.filter(u => u.role === "trieur").length,
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError("Username et mot de passe requis");
      return;
    }
    
    try {
      setSubmitting(true);
      await createUser({
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
      });
      setShowModal(false);
      setNewUser({ username: "", role: "chauffeur", password: "" });
      await loadUsers(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    try {
      await deleteUser(id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const handleEditUser = (u: User) => {
    setEditingUser({
      id: u.id,
      username: u.username,
      role: u.role,
      password: "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      setSubmitting(true);
      const updates: { role?: string; password?: string } = {
        role: editingUser.role,
      };
      if (editingUser.password) {
        updates.password = editingUser.password;
      }
      await updateUser(editingUser.id, updates);
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification");
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

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-danger-500 hover:text-danger-700">✕</button>
        </div>
      )}

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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-accent-500 border-t-transparent"></div>
          </div>
        ) : (
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600 font-medium">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{u.username}</p>
                      <p className="text-xs text-neutral-500">ID: {u.id}</p>
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
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                    <span className="text-sm text-brand-600">Active</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditUser(u)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm(`Delete user ${u.username}?`)) {
                          try {
                            await deleteUser(u.id);
                            loadUsers();
                          } catch {
                            alert('Failed to delete user');
                          }
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded"
                    >
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
        )}

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
                <label className="block text-sm font-medium text-neutral-700 mb-1">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  placeholder="johndoe"
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
