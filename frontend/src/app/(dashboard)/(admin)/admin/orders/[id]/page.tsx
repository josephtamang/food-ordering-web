"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import API, { getImageUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { Order, Bill } from "@/types";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import {
  FiArrowLeft, FiDownload, FiCheck, FiClock, FiPackage,
  FiDollarSign, FiUser, FiMapPin, FiFileText, FiAlertCircle,
} from "react-icons/fi";

const STATUS_FLOW: Record<string, string> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "served",
  served: "completed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  served: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [payingBill, setPayingBill] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("cash");

  useEffect(() => {
    if (!orderId) return;
    const fetchData = async () => {
      try {
        const [orderRes, billRes] = await Promise.allSettled([
          API.get(`/orders/${orderId}`),
          API.get(`/bills?order=${orderId}`),
        ]);
        if (orderRes.status === "fulfilled") {
          setOrder(orderRes.value.data.order);
        }
        if (billRes.status === "fulfilled") {
          const bills = billRes.value.data.bills || [];
          if (bills.length > 0) setBill(bills[0]);
        }
      } catch {
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await API.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrder(res.data.order);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const generateBill = async () => {
    setGeneratingBill(true);
    try {
      const res = await API.post(`/bills/${orderId}`);
      setBill(res.data.bill);
      toast.success("Bill generated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate bill");
    } finally {
      setGeneratingBill(false);
    }
  };

  const payBill = async () => {
    if (!bill) return;
    setPayingBill(true);
    try {
      const res = await API.put(`/bills/${bill._id}/pay`, { paymentMethod: selectedPayment });
      setBill(res.data.bill);
      toast.success("Bill marked as paid");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark as paid");
    } finally {
      setPayingBill(false);
    }
  };

  const downloadPDF = async () => {
    if (!bill) return;
    setDownloadingPDF(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API.defaults.baseURL}/bills/${bill._id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill-${bill.billNumber || bill._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <FiAlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">Order not found</p>
        <Link href="/admin/orders" className="text-[var(--primary)] hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const nextStatus = STATUS_FLOW[order.status];
  const customerName = typeof order.user === "object" && order.user !== null
    ? (order.user as any).name
    : "Customer";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600">
          <FiArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Order #{order._id.slice(-6).toUpperCase()}</h1>
          <p className="text-sm text-gray-400">
            {new Date(order.createdAt).toLocaleString()} &bull; {customerName}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || ""}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex flex-wrap gap-4 text-sm">
              {order.tableNumber && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FiMapPin size={14} className="text-gray-400" />
                  Table {order.tableNumber}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <FiPackage size={14} className="text-gray-400" />
                {order.items.reduce((a, b) => a + b.quantity, 0)} items
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FiDollarSign size={14} className="text-gray-400" />
                {order.isPaid ? (
                  <span className="text-green-600 font-medium">Paid</span>
                ) : (
                  <span className="text-yellow-600 font-medium">Unpaid</span>
                )}
              </div>
            </div>
            {order.notes && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                <strong>Notes:</strong> {order.notes}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Actions & Summary */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold mb-3">Status Management</h3>
            <select
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={updatingStatus || order.status === "cancelled" || order.status === "completed"}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 disabled:opacity-50 mb-3"
            >
              {["pending", "confirmed", "preparing", "served", "completed", "cancelled"].map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
            {nextStatus && order.status !== "cancelled" && (
              <button
                onClick={() => updateStatus(nextStatus)}
                disabled={updatingStatus}
                className="w-full py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {updatingStatus ? "Updating..." : `Advance to ${nextStatus}`}
              </button>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (5%)</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-[var(--primary)]">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Bill Section */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FiFileText size={16} />
              Billing
            </h3>
            {!bill ? (
              <button
                onClick={generateBill}
                disabled={generatingBill}
                className="w-full py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {generatingBill ? "Generating..." : "Generate Bill"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bill #</span>
                    <span className="font-medium">{bill.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium capitalize ${
                      bill.isPaid ? "text-green-600" : bill.status === "requested" ? "text-yellow-600" : "text-gray-600"
                    }`}>
                      {bill.isPaid ? "Paid" : bill.status || "Generated"}
                    </span>
                  </div>
                  {bill.isPaid && bill.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment</span>
                      <span className="font-medium uppercase">{bill.paymentMethod}</span>
                    </div>
                  )}
                  {bill.callWaiter && (
                    <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                      Customer requested waiter assistance
                    </div>
                  )}
                </div>

                <button
                  onClick={downloadPDF}
                  disabled={downloadingPDF}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-[var(--primary)] text-[var(--primary)] rounded-lg text-sm font-medium hover:bg-[var(--primary)]/5 disabled:opacity-50"
                >
                  <FiDownload size={14} />
                  {downloadingPDF ? "Downloading..." : "Download PDF"}
                </button>

                {!bill.isPaid && (
                  <div className="space-y-2">
                    <select
                      value={selectedPayment}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                    >
                      <option value="cash">Cash</option>
                      <option value="esewa">eSewa</option>
                      <option value="khalti">Khalti</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                    <button
                      onClick={payBill}
                      disabled={payingBill}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <FiCheck size={14} />
                      {payingBill ? "Processing..." : "Mark as Paid"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
