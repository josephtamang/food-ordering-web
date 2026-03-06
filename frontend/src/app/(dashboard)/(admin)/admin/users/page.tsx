"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  FiSearch,
  FiTrash2,
  FiUsers,
  FiShield,
  FiUser,
  FiPlus,
  FiX,
} from "react-icons/fi";

const ROLES = ["customer", "staff", "admin"] as const;

const roleColor = (role: string) => {
  switch (role) {
    case "admin": return "bg-red-100 text-red-700";
    case "staff": return "bg-blue-100 text-blue-700";
    case "customer": return "bg-gray-100 text-gray-600";
    default: return "bg-gray-100 text-gray-600";
  }
};

const roleIcon = (role: string) => {
  switch (role) {
    case "admin": return FiShield;
    case "staff": return FiUser;
    default: return FiUser;
  }
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/users");
      setUsers(res.data.users || res.data || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId: string, role: string) => {
    if (userId === currentUser?._id) {
      toast.error("You cannot change your own role");
      return;
    }
    setUpdatingId(userId);
    try {
      await API.put(`/users/${userId}/role`, { role });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: role as User["role"] } : u))
      );
      toast.success(`Role updated to ${role}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?._id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (deletingId) return;
    setDeletingId(userId);
    try {
      await API.delete(`/users/${userId}`);
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('All fields are required');
      return;
    }
    setCreating(true);
    try {
      await API.post('/users', newUser);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'customer' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c47a5a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="mt-1 text-gray-500">Manage user accounts and roles</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#c47a5a] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#b06a4a]"
        >
          <FiPlus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 font-medium text-gray-500">User</th>
              <th className="px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 font-medium text-gray-500">Joined</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  <FiUsers className="mx-auto mb-2 h-10 w-10" />
                  <p>No users found.</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = u._id === currentUser?._id;
                const RoleIcon = roleIcon(u.role);
                return (
                  <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => window.location.href = `/admin/users/${u._id}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u._id}`} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c47a5a]/10">
                          <RoleIcon className="h-4 w-4 text-[#c47a5a]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 text-xs text-gray-400">(you)</span>
                            )}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isSelf ? (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleColor(u.role)}`}
                        >
                          {u.role}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u._id, e.target.value)}
                          disabled={updatingId === u._id}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleColor(u.role)} cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-[#c47a5a]`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {!isSelf && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${u.name}?`)) {
                              handleDelete(u._id);
                            }
                          }}
                          disabled={deletingId === u._id}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">
        {filteredUsers.length} user{filteredUsers.length !== 1 && "s"} total
      </p>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Create User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Password"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg bg-[#c47a5a] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#b06a4a] disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
