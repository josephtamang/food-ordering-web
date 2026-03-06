"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import API from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiDollarSign,
  FiBox,
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiArrowRight,
  FiStar,
  FiCalendar,
  FiBarChart2,
  FiPieChart,
  FiActivity,
} from "react-icons/fi";
import { formatCurrency } from "@/lib/currency";

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/stats/dashboard");
      setStats(res.data.stats || res.data);
    } catch (error: any) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c47a5a] border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <FiTrendingUp className="mb-3 h-12 w-12" />
        <p className="text-lg font-medium">Unable to load dashboard data</p>
        <button onClick={fetchStats} className="mt-4 rounded-lg bg-[#c47a5a] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Retry
        </button>
      </div>
    );
  }

  const dailyOrders = stats.dailyOrders || [];
  const ordersByStatus = stats.ordersByStatus || {};
  const topProducts = stats.topProducts || [];
  const categoryBreakdown = stats.categoryBreakdown || [];
  const paymentMethodBreakdown = stats.paymentMethodBreakdown || [];
  const hourlyOrders = stats.hourlyOrders || [];

  const statCards = [
    {
      label: "Total Orders",
      value: stats.totalOrders ?? 0,
      sub: stats.orderGrowth != null ? `${stats.orderGrowth > 0 ? "+" : ""}${stats.orderGrowth}% vs last 30d` : null,
      trend: stats.orderGrowth,
      icon: FiShoppingBag,
      iconBg: "bg-[#c47a5a]/10",
      iconColor: "text-[#c47a5a]",
      show: true,
    },
    {
      label: "Today's Orders",
      value: stats.todayOrders ?? 0,
      sub: stats.todayRevenue ? formatCurrency(stats.todayRevenue) + " revenue" : null,
      icon: FiCalendar,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      show: true,
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders ?? 0,
      sub: "Needs attention",
      icon: FiClock,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      show: true,
    },
    {
      label: "Total Products",
      value: stats.totalProducts ?? 0,
      icon: FiBox,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      show: true,
    },
    {
      label: "Total Users",
      value: stats.totalUsers ?? 0,
      icon: FiUsers,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      show: isAdmin,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue ?? 0),
      sub: stats.revenueGrowth != null ? `${stats.revenueGrowth > 0 ? "+" : ""}${stats.revenueGrowth}% vs last 30d` : null,
      trend: stats.revenueGrowth,
      icon: FiDollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      show: isAdmin,
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(stats.avgOrderValue ?? 0),
      icon: FiBarChart2,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      show: isAdmin,
    },
    {
      label: "Total Bills",
      value: stats.totalBills ?? 0,
      icon: FiFileText,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      show: isAdmin,
    },
  ];

  const quickLinks = [
    { label: "Manage Orders", href: "/admin/orders", icon: FiShoppingBag, show: true },
    { label: "Manage Products", href: "/admin/products", icon: FiPackage, show: true },
    { label: "Manage Categories", href: "/admin/categories", icon: FiBox, show: true },
    { label: "Manage Users", href: "/admin/users", icon: FiUsers, show: isAdmin },
    { label: "Manage Bills", href: "/admin/bills", icon: FiFileText, show: isAdmin },
    { label: "Manage Reviews", href: "/admin/reviews", icon: FiStar, show: isAdmin },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{isStaff ? "Staff" : "Admin"} Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Welcome back, {user?.name?.split(" ")[0] || "Admin"}. Here&apos;s your overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {statCards.filter((c) => c.show).map((card) => (
          <div key={card.label} className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800 leading-tight">{card.value}</p>
              {(card as any).sub && (
                <p className={`mt-0.5 flex items-center gap-0.5 text-xs font-medium ${
                  (card as any).trend != null
                    ? (card as any).trend >= 0 ? "text-green-600" : "text-red-500"
                    : "text-gray-400"
                }`}>
                  {(card as any).trend != null && (
                    (card as any).trend >= 0
                      ? <FiTrendingUp className="h-3 w-3" />
                      : <FiTrendingDown className="h-3 w-3" />
                  )}
                  {(card as any).sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Orders */}
        {dailyOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Orders This Week</h3>
              <FiBarChart2 className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-48 flex items-end gap-2">
              {dailyOrders.map((day: any) => {
                const maxCount = Math.max(...dailyOrders.map((d: any) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={day._id} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-xs font-semibold text-gray-600">{day.count}</span>
                    <div
                      className="w-full bg-[#c47a5a] rounded-t-md transition-all min-h-[4px] group-hover:bg-[#b56a4a]"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-400">{day._id.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Status */}
        {Object.keys(ordersByStatus).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Order Status Breakdown</h3>
              <FiActivity className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-3">
              {Object.entries(ordersByStatus).map(([status, count]: [string, any]) => {
                const total = stats.totalOrders || 1;
                const percentage = Math.round((count / total) * 100);
                const colors: Record<string, string> = {
                  pending: "#f59e0b", confirmed: "#3b82f6", preparing: "#f97316",
                  served: "#8b5cf6", completed: "#22c55e", cancelled: "#ef4444",
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-600">{status}</span>
                      <span className="font-medium text-gray-700">
                        {count} <span className="text-gray-400 text-xs">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: colors[status] || "#c47a5a" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Revenue This Week - Admin only */}
        {isAdmin && dailyOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Revenue This Week</h3>
              <FiTrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="h-48 flex items-end gap-2">
              {dailyOrders.map((day: any) => {
                const maxRevenue = Math.max(...dailyOrders.map((d: any) => d.revenue || 0), 1);
                const revenue = day.revenue || 0;
                const height = (revenue / maxRevenue) * 100;
                return (
                  <div key={day._id} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-xs font-semibold text-gray-600">
                      {revenue > 0 ? formatCurrency(revenue) : "–"}
                    </span>
                    <div
                      className="w-full bg-emerald-500 rounded-t-md transition-all min-h-[4px] group-hover:bg-emerald-600"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-400">{day._id.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hourly Orders Today */}
        {hourlyOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Today&apos;s Hourly Activity</h3>
              <FiClock className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-48 flex items-end gap-0.5">
              {Array.from({ length: 24 }, (_, h) => {
                const entry = hourlyOrders.find((e: any) => e._id === h);
                const count = entry?.count || 0;
                const maxCount = Math.max(...hourlyOrders.map((e: any) => e.count), 1);
                const height = count > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
                    {count > 0 && <span className="text-[9px] font-medium text-gray-500">{count}</span>}
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: count > 0 ? `${Math.max(height, 5)}%` : "2px",
                        backgroundColor: count > 0 ? "#c47a5a" : "#e5e7eb",
                      }}
                    />
                    {h % 6 === 0 && <span className="text-[9px] text-gray-400">{h}h</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 2 - Admin only */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Selling Items */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Top Selling Items</h3>
                <FiPackage className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {topProducts.map((p: any, i: number) => {
                  const max = topProducts[0]?.totalQuantity || 1;
                  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 truncate mr-2 flex items-center gap-1.5">
                          <span className={`text-xs font-bold w-4 ${medalColors[i] || "text-gray-400"}`}>#{i + 1}</span>
                          {p._id}
                        </span>
                        <span className="font-medium text-[#c47a5a] whitespace-nowrap">{p.totalQuantity} sold</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#c47a5a] rounded-full" style={{ width: `${(p.totalQuantity / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Revenue */}
          {categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Revenue by Category</h3>
                <FiPieChart className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {categoryBreakdown.map((cat: any, i: number) => {
                  const max = categoryBreakdown[0]?.totalRevenue || 1;
                  const catColors = ["#c47a5a", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444"];
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 truncate mr-2 flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: catColors[i] || "#c47a5a" }} />
                          {cat._id}
                        </span>
                        <span className="font-medium text-gray-700 whitespace-nowrap">{formatCurrency(cat.totalRevenue)}</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(cat.totalRevenue / max) * 100}%`, backgroundColor: catColors[i] || "#c47a5a" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {paymentMethodBreakdown.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Payment Methods</h3>
                <FiDollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                {paymentMethodBreakdown.map((pm: any, i: number) => {
                  const total = paymentMethodBreakdown.reduce((s: number, p: any) => s + p.count, 0) || 1;
                  const pct = Math.round((pm.count / total) * 100);
                  const pmColors = ["#c47a5a", "#3b82f6", "#8b5cf6", "#22c55e"];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pmColors[i] || "#c47a5a" }} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="capitalize text-gray-600">{pm._id || "Unknown"}</span>
                          <span className="font-medium text-gray-700">{pm.count} <span className="text-gray-400 text-xs">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pmColors[i] || "#c47a5a" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Today's Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Today&apos;s Summary</h3>
              <FiCalendar className="h-4 w-4 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-indigo-50 p-4 text-center">
                <p className="text-3xl font-bold text-indigo-700">{stats.todayOrders ?? 0}</p>
                <p className="mt-1 text-xs text-indigo-600">Orders Today</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-xl font-bold text-green-700">{formatCurrency(stats.todayRevenue ?? 0)}</p>
                <p className="mt-1 text-xs text-green-600">Revenue Today</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-4 text-center">
                <p className="text-3xl font-bold text-yellow-700">{stats.pendingOrders ?? 0}</p>
                <p className="mt-1 text-xs text-yellow-600">Pending</p>
              </div>
              <div className="rounded-lg bg-[#c47a5a]/10 p-4 text-center">
                <p className="text-xl font-bold text-[#c47a5a]">{formatCurrency(stats.avgOrderValue ?? 0)}</p>
                <p className="mt-1 text-xs text-[#c47a5a]">Avg Order</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Today's Overview */}
      {isStaff && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Today&apos;s Overview</h3>
            <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-medium text-[#c47a5a] hover:underline">
              View All <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-indigo-50 p-4 text-center">
              <p className="text-3xl font-bold text-indigo-700">{stats.todayOrders ?? 0}</p>
              <p className="mt-1 text-xs text-indigo-600">Orders Today</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 text-center">
              <p className="text-3xl font-bold text-yellow-700">{stats.pendingOrders ?? 0}</p>
              <p className="mt-1 text-xs text-yellow-600">Pending</p>
            </div>
            <div className="rounded-lg bg-[#c47a5a]/10 p-4 text-center">
              <p className="text-3xl font-bold text-[#c47a5a]">{stats.totalOrders ?? 0}</p>
              <p className="mt-1 text-xs text-[#c47a5a]">Total Orders</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Quick Links</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.filter((link) => link.show).map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-[#c47a5a]/5 hover:border-[#c47a5a]/20"
            >
              <div className="flex items-center gap-3">
                <link.icon className="h-5 w-5 text-[#c47a5a]" />
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </div>
              <FiArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
