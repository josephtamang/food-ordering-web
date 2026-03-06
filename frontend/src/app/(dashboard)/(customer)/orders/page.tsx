"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import API from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { Order } from "@/types";
import toast from "react-hot-toast";
import {
  FiClock,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiChevronRight,
  FiShoppingBag,
} from "react-icons/fi";

const STATUS_TABS = [
  "all",
  "pending",
  "confirmed",
  "preparing",
  "served",
  "completed",
  "cancelled",
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  preparing: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  served: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  completed: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get("/orders/my-orders");
      setOrders(res.data.orders || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) => order.status === activeTab);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getItemsCount = (order: Order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 shrink-0 rounded-lg bg-gray-200 animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-5 shadow-sm animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-48 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
                <div className="space-y-2 text-right">
                  <div className="ml-auto h-6 w-20 rounded-full bg-gray-200" />
                  <div className="ml-auto h-4 w-16 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage your orders
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-[#c47a5a] text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-xl bg-white py-20 text-center shadow-sm">
          <FiShoppingBag className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">
            {activeTab === "all"
              ? "No orders yet"
              : `No ${activeTab} orders`}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {activeTab === "all"
              ? "Place your first order from the menu!"
              : "Try checking a different status filter."}
          </p>
          {activeTab === "all" && (
            <Link
              href="/menu"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c47a5a] px-6 py-3 font-medium text-white transition-colors hover:bg-[#b56a4a]"
            >
              <FiShoppingBag className="h-5 w-5" />
              Browse Menu
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const colors = STATUS_COLORS[order.status];
            return (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="block rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Order ID & Date */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    {/* Details Row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {order.tableNumber && (
                        <span className="flex items-center gap-1">
                          <FiPackage className="h-3.5 w-3.5" />
                          Table {order.tableNumber}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FiClock className="h-3.5 w-3.5" />
                        {getItemsCount(order)} item{getItemsCount(order) !== 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.isPaid
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {order.isPaid ? (
                          <FiCheckCircle className="h-3 w-3" />
                        ) : (
                          <FiXCircle className="h-3 w-3" />
                        )}
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>

                  <FiChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
