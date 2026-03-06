"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { User, Order } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import {
  FiArrowLeft,
  FiMail,
  FiCalendar,
  FiShield,
  FiPackage,
  FiUser,
} from "react-icons/fi";

const ROLES = ["customer", "staff", "admin"] as const;

const roleColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-700";
    case "staff":
      return "bg-blue-100 text-blue-700";
    case "customer":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    case "preparing":
      return "bg-orange-100 text-orange-700";
    case "served":
      return "bg-purple-100 text-purple-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    setError("");
    try {
      const [userRes, ordersRes] = await Promise.all([
        API.get(`/users/${userId}`),
        API.get(`/users/${userId}/orders`).catch(() => ({ data: { orders: [] } })),
      ]);
      setUser(userRes.data.user || userRes.data);
      setOrders(ordersRes.data.orders || ordersRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load user details");
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!user) return;
    if (user._id === currentUser?._id) {
      toast.error("You cannot change your own role");
      return;
    }
    setUpdatingRole(true);
    try {
      await API.put(`/users/${userId}/role`, { role: newRole });
      setUser((prev) => (prev ? { ...prev, role: newRole as User["role"] } : prev));
      toast.success(`Role updated to ${newRole}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingRole(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c47a5a] border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-gray-500">{error || "User not found"}</p>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-[#c47a5a] hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>
    );
  }

  const isSelf = user._id === currentUser?._id;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#c47a5a] transition-colors"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* User Info Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatar ? (
              <Image
                src={getImageUrl(user.avatar)}
                alt={user.name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#c47a5a]/10 text-2xl font-bold text-[#c47a5a]">
                {initials}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {user.name}
                {isSelf && (
                  <span className="ml-2 text-sm font-normal text-gray-400">(you)</span>
                )}
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <FiMail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-1.5">
                <FiCalendar className="h-4 w-4" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Role Management */}
            <div className="flex items-center gap-3">
              <FiShield className="h-4 w-4 text-gray-400" />
              {isSelf ? (
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${roleColor(user.role)}`}
                >
                  {user.role}
                </span>
              ) : (
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  disabled={updatingRole}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${roleColor(user.role)} cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-[#c47a5a] disabled:opacity-50`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              )}
              {updatingRole && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c47a5a] border-t-transparent" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <FiPackage className="h-5 w-5 text-[#c47a5a]" />
            Order History
            <span className="ml-1 text-sm font-normal text-gray-400">
              ({orders.length})
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 font-medium text-gray-500">Order ID</th>
                <th className="px-6 py-3 font-medium text-gray-500">Items</th>
                <th className="px-6 py-3 font-medium text-gray-500">Total</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <FiPackage className="mx-auto mb-2 h-10 w-10" />
                    <p>No orders found for this user.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">
                      {order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {order.items.length} item{order.items.length !== 1 && "s"}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
