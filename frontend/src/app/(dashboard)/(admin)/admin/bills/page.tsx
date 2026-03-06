"use client";

import { useState, useEffect } from "react";
import API, { BACKEND_URL } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Bill, Order, User, Pagination } from "@/types";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiDollarSign,
  FiFileText,
  FiCheck,
  FiX,
} from "react-icons/fi";

const PAYMENT_METHODS = ["cash", "esewa", "khalti", "bank"] as const;

export default function AdminBillsPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [paidFilter, setPaidFilter] = useState<string>("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Record<string, string>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBills();
  }, [pagination.page, paidFilter]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (paidFilter === "paid") params.isPaid = "true";
      if (paidFilter === "unpaid") params.isPaid = "false";
      const res = await API.get("/bills", { params });
      setBills(res.data.bills || res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (billId: string) => {
    const method = selectedMethod[billId] || "cash";
    setPayingId(billId);
    try {
      await API.put(`/bills/${billId}/pay`, { paymentMethod: method });
      setBills((prev) =>
        prev.map((b) =>
          b._id === billId
            ? { ...b, isPaid: true, paymentMethod: method as Bill["paymentMethod"], paidAt: new Date().toISOString() }
            : b
        )
      );
      toast.success("Bill marked as paid");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark bill as paid");
    } finally {
      setPayingId(null);
    }
  };

  const downloadPDF = async (billId: string) => {
    setDownloadingId(billId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API.defaults.baseURL}/bills/${billId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill-${billId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err: any) {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const getOrderId = (bill: Bill) => {
    if (typeof bill.order === "object" && bill.order !== null) {
      return (bill.order as Order)._id.slice(-6).toUpperCase();
    }
    return String(bill.order).slice(-6).toUpperCase();
  };

  const getCustomerName = (bill: Bill) => {
    if (typeof bill.user === "object" && bill.user !== null) {
      return (bill.user as User).name;
    }
    return "Customer";
  };

  const methodLabel = (method: string) => {
    switch (method) {
      case "esewa": return "eSewa";
      case "khalti": return "Khalti";
      case "bank": return "Bank Transfer";
      case "cash": return "Cash";
      default: return method;
    }
  };

  if (loading && bills.length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-800">Bills</h1>
        <p className="mt-1 text-gray-500">View and manage billing records</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { label: "All", value: "" },
          { label: "Paid", value: "paid" },
          { label: "Unpaid", value: "unpaid" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setPaidFilter(tab.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              paidFilter === tab.value
                ? "bg-[#c47a5a] text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bills Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 font-medium text-gray-500">Bill #</th>
              <th className="px-4 py-3 font-medium text-gray-500">Order</th>
              <th className="px-4 py-3 font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 font-medium text-gray-500">Total</th>
              <th className="px-4 py-3 font-medium text-gray-500">Payment</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  <FiFileText className="mx-auto mb-2 h-10 w-10" />
                  <p>No bills found.</p>
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-800">
                    {bill.billNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-600">#{getOrderId(bill)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{getCustomerName(bill)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">${bill.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {bill.isPaid ? (
                      <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {methodLabel(bill.paymentMethod)}
                      </span>
                    ) : (
                      <select
                        value={selectedMethod[bill._id] || "cash"}
                        onChange={(e) =>
                          setSelectedMethod((prev) => ({ ...prev, [bill._id]: e.target.value }))
                        }
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {methodLabel(m)}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        bill.isPaid
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {bill.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!bill.isPaid && (
                        <button
                          onClick={() => markPaid(bill._id)}
                          disabled={payingId === bill._id}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                        >
                          <FiCheck className="h-3.5 w-3.5" />
                          {payingId === bill._id ? "Paying..." : "Mark Paid"}
                        </button>
                      )}
                      <button
                        onClick={() => downloadPDF(bill._id)}
                        disabled={downloadingId === bill._id}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#c47a5a]/10 px-3 py-1.5 text-xs font-medium text-[#c47a5a] transition-colors hover:bg-[#c47a5a]/20 disabled:opacity-50"
                      >
                        <FiDownload className="h-3.5 w-3.5" />
                        {downloadingId === bill._id ? "..." : "PDF"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} bills)
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
