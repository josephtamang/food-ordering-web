"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Order, Pagination } from "@/types";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "served", "completed", "cancelled"] as const;

const STATUS_FLOW: Record<string, string | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "served",
  served: "completed",
  completed: null,
  cancelled: null,
};

const statusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "confirmed": return "bg-blue-100 text-blue-800";
    case "preparing": return "bg-orange-100 text-orange-800";
    case "served": return "bg-purple-100 text-purple-800";
    case "completed": return "bg-green-100 text-green-800";
    case "cancelled": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter) params.status = statusFilter;
      const res = await API.get("/orders/all", { params });
      setOrders(res.data.orders || res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await API.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: status as Order["status"] } : o))
      );
      toast.success(`Order status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const advanceStatus = (order: Order) => {
    const next = STATUS_FLOW[order.status];
    if (next) updateStatus(order._id, next);
  };

  const getCustomerName = (order: Order) => {
    if (typeof order.user === "object" && order.user !== null) return order.user.name;
    return "Customer";
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c47a5a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <p className="mt-1 text-gray-500">Manage and track all orders</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setStatusFilter(""); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === ""
              ? "bg-[#c47a5a] text-white"
              : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
          }`}
        >
          All
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
              statusFilter === status
                ? "bg-[#c47a5a] text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 font-medium text-gray-500">Order ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 font-medium text-gray-500">Items</th>
              <th className="px-4 py-3 font-medium text-gray-500">Table</th>
              <th className="px-4 py-3 font-medium text-gray-500">Total</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Paid</th>
              <th className="px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  <FiShoppingBag className="mx-auto mb-2 h-10 w-10" />
                  <p>No orders found.</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <>
                  <tr
                    key={order._id}
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                    className="cursor-pointer border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {expandedId === order._id ? (
                          <FiChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <FiChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-mono text-xs font-medium text-gray-800">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{getCustomerName(order)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.items.length} item{order.items.length !== 1 && "s"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.tableNumber || "-"}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateStatus(order._id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={updatingId === order._id}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(order.status)} cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-[#c47a5a]`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {STATUS_FLOW[order.status] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            advanceStatus(order);
                          }}
                          disabled={updatingId === order._id}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#c47a5a]/10 px-3 py-1.5 text-xs font-medium text-[#c47a5a] transition-colors hover:bg-[#c47a5a]/20 disabled:opacity-50"
                        >
                          <FiCheckCircle className="h-3.5 w-3.5" />
                          {STATUS_FLOW[order.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                  {/* Expanded Details */}
                  {expandedId === order._id && (
                    <tr key={`${order._id}-details`} className="border-b border-gray-100">
                      <td colSpan={9} className="bg-gray-50/50 px-4 py-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-700">Order Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg bg-white px-4 py-2 shadow-sm"
                              >
                                <div>
                                  <span className="font-medium text-gray-800">{item.name}</span>
                                  <span className="ml-2 text-sm text-gray-500">x{item.quantity}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-800">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-6 rounded-lg bg-white px-4 py-3 text-sm shadow-sm">
                            <div>
                              <span className="text-gray-500">Subtotal: </span>
                              <span className="font-medium text-gray-800">${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Tax: </span>
                              <span className="font-medium text-gray-800">${order.tax.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total: </span>
                              <span className="font-semibold text-gray-800">${order.total.toFixed(2)}</span>
                            </div>
                            {order.notes && (
                              <div>
                                <span className="text-gray-500">Notes: </span>
                                <span className="text-gray-700">{order.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} orders)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
