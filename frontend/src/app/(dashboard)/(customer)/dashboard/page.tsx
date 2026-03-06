"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import API from "@/lib/api";
import { Order, Announcement } from "@/types";
import toast from "react-hot-toast";
import {
  FiShoppingBag,
  FiClock,
  FiDollarSign,
  FiArrowRight,
  FiShoppingCart,
  FiList,
  FiPackage,
  FiTrendingUp,
  FiStar,
  FiCheckCircle,
  FiXCircle,
  FiBarChart2,
  FiBell,
  FiX,
} from "react-icons/fi";
import { formatCurrency } from "@/lib/currency";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => { fetchOrders(); fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await API.get("/announcements");
      setAnnouncements(res.data.announcements || []);
    } catch {}
  };

  const dismissAnnouncement = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders/my-orders");
      setOrders(res.data.orders || res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Derived stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed" || o.status === "preparing"
  ).length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const totalSpent = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = completedOrders > 0
    ? orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total, 0) / completedOrders
    : 0;

  // Weekly spending (last 7 days)
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weeklyOrders = orders.filter((o) => new Date(o.createdAt).getTime() > weekAgo && o.status !== "cancelled");
  const weeklySpent = weeklyOrders.reduce((s, o) => s + o.total, 0);

  // Daily spending data for the week
  const dailySpending: { day: string; amount: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayOrders = orders.filter((o) => {
      const od = new Date(o.createdAt);
      return (
        od.getDate() === d.getDate() &&
        od.getMonth() === d.getMonth() &&
        od.getFullYear() === d.getFullYear() &&
        o.status !== "cancelled"
      );
    });
    dailySpending.push({ day: label, amount: dayOrders.reduce((s, o) => s + o.total, 0), count: dayOrders.length });
  }

  // Most ordered items
  const itemFrequency: { [key: string]: { name: string; count: number } } = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (itemFrequency[item.product]) {
        itemFrequency[item.product].count += item.quantity;
      } else {
        itemFrequency[item.product] = { name: item.name, count: item.quantity };
      }
    });
  });
  const mostOrderedItems = Object.values(itemFrequency).sort((a, b) => b.count - a.count).slice(0, 4);

  const recentOrders = orders.slice(0, 5);

  const statusColor = (status: Order["status"]) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      served: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c47a5a] border-t-transparent" />
      </div>
    );
  }

  const maxDailyAmount = Math.max(...dailySpending.map((d) => d.amount), 1);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.name?.split(" ")[0] || "Guest"}!
        </h1>
        <p className="mt-1 text-gray-500">Here&apos;s a summary of your orders and activity.</p>
      </div>

      {/* Announcements Banner */}
      {announcements.filter((a) => !dismissedIds.includes(a._id)).length > 0 && (
        <div className="space-y-2">
          {announcements
            .filter((a) => !dismissedIds.includes(a._id))
            .map((ann) => {
              const colorMap: Record<string, string> = {
                offer:   "bg-green-50 border-green-200 text-green-800",
                event:   "bg-blue-50 border-blue-200 text-blue-800",
                notice:  "bg-yellow-50 border-yellow-200 text-yellow-800",
                closure: "bg-red-50 border-red-200 text-red-800",
                update:  "bg-purple-50 border-purple-200 text-purple-800",
              };
              const iconColorMap: Record<string, string> = {
                offer:   "text-green-600",
                event:   "text-blue-600",
                notice:  "text-yellow-600",
                closure: "text-red-600",
                update:  "text-purple-600",
              };
              const cls = colorMap[ann.type] || colorMap.notice;
              const iconCls = iconColorMap[ann.type] || iconColorMap.notice;
              return (
                <div
                  key={ann._id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${cls}`}
                >
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <FiBell size={15} className={iconCls} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{ann.title}</p>
                    <p className="text-sm mt-0.5 opacity-80 leading-relaxed">{ann.body}</p>
                    {ann.expiresAt && (
                      <p className="text-xs mt-1 opacity-60">
                        Expires {new Date(ann.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => dismissAnnouncement(ann._id)}
                    className="shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors mt-0.5"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c47a5a]/10">
            <FiShoppingBag className="h-5 w-5 text-[#c47a5a]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-xl font-bold text-gray-800">{totalOrders}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
            <FiClock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-xl font-bold text-gray-800">{pendingOrders}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <FiCheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-xl font-bold text-gray-800">{completedOrders}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <FiDollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Spending Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Spending This Week</h2>
            <span className="text-sm font-medium text-[#c47a5a]">{formatCurrency(weeklySpent)}</span>
          </div>
          <div className="h-40 flex items-end gap-2">
            {dailySpending.map((d, i) => {
              const height = d.amount > 0 ? (d.amount / maxDailyAmount) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  {d.count > 0 && <span className="text-[10px] text-gray-500">{d.count}</span>}
                  <div
                    className="w-full rounded-t-md transition-all min-h-[2px]"
                    style={{
                      height: d.amount > 0 ? `${Math.max(height, 4)}%` : "2px",
                      backgroundColor: d.amount > 0 ? "#c47a5a" : "#e5e7eb",
                    }}
                  />
                  <span className="text-[10px] text-gray-400">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Order Breakdown</h2>
            <FiBarChart2 className="h-4 w-4 text-gray-400" />
          </div>
          {totalOrders === 0 ? (
            <div className="flex h-40 items-center justify-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Completed", count: completedOrders, color: "#22c55e" },
                { label: "In Progress", count: pendingOrders, color: "#f59e0b" },
                { label: "Cancelled", count: cancelledOrders, color: "#ef4444" },
              ].map((item) => {
                const pct = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <span className="font-medium text-gray-700">{item.count} <span className="text-gray-400 text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                );
              })}

              {/* Additional stats */}
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500">Avg Order Value</p>
                  <p className="text-base font-bold text-gray-800">{formatCurrency(avgOrderValue)}</p>
                </div>
                <div className="rounded-lg bg-[#c47a5a]/5 p-3 text-center">
                  <p className="text-xs text-gray-500">Weekly Orders</p>
                  <p className="text-base font-bold text-[#c47a5a]">{weeklyOrders.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Favorite Items */}
      {mostOrderedItems.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-800">
            <FiTrendingUp className="h-5 w-5 text-[#c47a5a]" />
            Your Favorite Items
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {mostOrderedItems.map((item, idx) => {
              const max = mostOrderedItems[0]?.count || 1;
              return (
                <div key={idx} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-gray-100 text-gray-600" : "bg-[#c47a5a]/10 text-[#c47a5a]"
                    }`}>
                      #{idx + 1}
                    </div>
                    <span className="text-xs text-gray-500">{item.count}x ordered</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#c47a5a] rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={() => router.push("/menu")}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#c47a5a] px-5 py-3 font-medium text-white transition-colors hover:bg-[#b56a4a]"
        >
          <FiPackage className="h-5 w-5" />
          Browse Menu
        </button>
        <button
          onClick={() => router.push("/cart")}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#c47a5a] px-5 py-3 font-medium text-[#c47a5a] transition-colors hover:bg-[#c47a5a]/5"
        >
          <FiShoppingCart className="h-5 w-5" />
          View Cart
        </button>
        <button
          onClick={() => router.push("/orders")}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#c47a5a] px-5 py-3 font-medium text-[#c47a5a] transition-colors hover:bg-[#c47a5a]/5"
        >
          <FiList className="h-5 w-5" />
          View Orders
        </button>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Recent Orders</h2>
          {orders.length > 5 && (
            <button
              onClick={() => router.push("/orders")}
              className="flex items-center gap-1 text-sm font-medium text-[#c47a5a] hover:underline"
            >
              View All <FiArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <FiShoppingBag className="mx-auto mb-2 h-10 w-10" />
            <p>No orders yet. Start by browsing the menu!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/orders/${order._id}`)}
                  >
                    <td className="py-3 font-mono text-xs text-gray-600">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 text-gray-700">
                      {order.items.length} item{order.items.length !== 1 && "s"}
                    </td>
                    <td className="py-3 font-medium text-gray-800">{formatCurrency(order.total)}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
