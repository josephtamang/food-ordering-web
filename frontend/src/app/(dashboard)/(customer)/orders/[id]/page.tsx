"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import API, { getImageUrl } from "@/lib/api";
import { Order, Bill } from "@/types";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiClock,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiDownload,
  FiCreditCard,
  FiPrinter,
  FiShoppingCart,
  FiStar,
  FiEdit3,
} from "react-icons/fi";
import { formatCurrency } from "@/lib/currency";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  preparing: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  served: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  completed: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

const STATUS_STEPS = ["pending", "confirmed", "preparing", "served", "completed"];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "esewa", label: "eSewa" },
  { value: "khalti", label: "Khalti" },
  { value: "bank", label: "Bank Transfer" },
] as const;

interface ReviewState {
  [productId: string]: { rating: number; comment: string; submitted: boolean };
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [payingBill, setPayingBill] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<"cash" | "esewa" | "khalti" | "bank">("cash");
  const [reordering, setReordering] = useState(false);
  const [reviews, setReviews] = useState<ReviewState>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);
  const [existingReviews, setExistingReviews] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/orders/${orderId}`);
      const fetchedOrder = res.data.order || res.data;
      setOrder(fetchedOrder);
      await Promise.all([checkBill(), checkExistingReviews(fetchedOrder)]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const checkBill = async () => {
    try {
      const res = await API.get(`/bills?order=${orderId}`);
      const bills = res.data.bills || res.data || [];
      if (Array.isArray(bills) && bills.length > 0) {
        setBill(bills[0]);
      } else if (res.data.bill) {
        setBill(res.data.bill);
      }
    } catch {
      // No bill exists yet
    }
  };

  const checkExistingReviews = async (fetchedOrder: Order) => {
    if (fetchedOrder.status !== "completed") return;
    try {
      const productIds = fetchedOrder.items.map((item) => item.product);
      const existing: Record<string, boolean> = {};
      await Promise.all(
        productIds.map(async (productId) => {
          try {
            const res = await API.get(`/reviews/product/${productId}?limit=100`);
            // We'll mark as submitted if user already reviewed - backend should handle this
            existing[productId] = false;
          } catch {
            existing[productId] = false;
          }
        })
      );
      setExistingReviews(existing);
    } catch {
      // Ignore
    }
  };

  const requestBillWithOptions = async (options: { callWaiter?: boolean } = {}) => {
    setGeneratingBill(true);
    try {
      const res = await API.post(`/bills/${orderId}/request`, {
        callWaiter: options.callWaiter || false,
      });
      setBill(res.data.bill || res.data);
      toast.success(
        options.callWaiter ? "Waiter has been called for your bill!" : "Bill requested successfully!"
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to request bill");
    } finally {
      setGeneratingBill(false);
    }
  };

  const downloadPdf = () => {
    if (!bill) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    window.open(`${baseUrl}/bills/${bill._id}/pdf?token=${token}`, "_blank");
  };

  const printReceipt = () => {
    window.print();
  };

  const payBill = async () => {
    if (!bill) return;
    setPayingBill(true);
    try {
      const res = await API.put(`/bills/${bill._id}/pay`, { paymentMethod: selectedPayment });
      setBill(res.data.bill || res.data);
      const orderRes = await API.get(`/orders/${orderId}`);
      setOrder(orderRes.data.order || orderRes.data);
      toast.success("Payment successful!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setPayingBill(false);
    }
  };

  const reorder = async () => {
    if (!order) return;
    setReordering(true);
    try {
      await Promise.all(
        order.items.map((item) =>
          API.post("/cart/add", { productId: item.product, quantity: item.quantity })
        )
      );
      toast.success("Items added to cart!");
      router.push("/cart");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reorder");
    } finally {
      setReordering(false);
    }
  };

  const setItemRating = (productId: string, rating: number) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], rating, comment: prev[productId]?.comment || "" },
    }));
  };

  const setItemComment = (productId: string, comment: string) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], comment, rating: prev[productId]?.rating || 0 },
    }));
  };

  const submitReview = async (productId: string, itemName: string) => {
    const review = reviews[productId];
    if (!review?.rating) {
      toast.error("Please select a rating");
      return;
    }
    setSubmittingReview(productId);
    try {
      await API.post("/reviews", {
        product: productId,
        order: orderId,
        rating: review.rating,
        comment: review.comment,
      });
      setReviews((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], submitted: true },
      }));
      toast.success(`Review for ${itemName} submitted!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-NP", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStepStatus = (step: string, currentStatus: string) => {
    if (currentStatus === "cancelled") return "cancelled";
    const stepIdx = STATUS_STEPS.indexOf(step);
    const currentIdx = STATUS_STEPS.indexOf(currentStatus);
    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "active";
    return "upcoming";
  };

  const isServed = order?.status === "served";
  const isCompleted = order?.status === "completed";
  const isCancelled = order?.status === "cancelled";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
        <div className="rounded-xl bg-white p-6 shadow-sm animate-pulse space-y-3">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-200" />
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
              <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/4 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-[#c47a5a] hover:underline">
          <FiArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
        <div className="rounded-xl bg-white py-20 text-center shadow-sm">
          <FiPackage className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Order not found</p>
        </div>
      </div>
    );
  }

  const colors = STATUS_COLORS[order.status];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-[#c47a5a] hover:underline">
        <FiArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {/* Order Header */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-gray-800">
              Order #{order._id.slice(-6).toUpperCase()}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <FiClock className="h-4 w-4" />
                {formatDate(order.createdAt)}
              </span>
              {order.tableNumber && (
                <span className="flex items-center gap-1.5">
                  <FiPackage className="h-4 w-4" />
                  Table {order.tableNumber}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${colors.bg} ${colors.text}`}>
              <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${order.isPaid ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {order.isPaid ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiXCircle className="h-3.5 w-3.5" />}
              {order.isPaid ? "Paid" : "Unpaid"}
            </span>
          </div>
        </div>
      </div>

      {/* Order Status Tracker */}
      {!isCancelled && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-gray-800">Order Progress</h2>
          <div className="relative flex items-center justify-between">
            {/* Progress Line */}
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 z-0" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-[#c47a5a] z-0 transition-all duration-500"
              style={{
                width: `${(STATUS_STEPS.indexOf(order.status) / (STATUS_STEPS.length - 1)) * 100}%`,
              }}
            />

            {STATUS_STEPS.map((step) => {
              const stepStatus = getStepStatus(step, order.status);
              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                      stepStatus === "done"
                        ? "border-[#c47a5a] bg-[#c47a5a]"
                        : stepStatus === "active"
                        ? "border-[#c47a5a] bg-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {stepStatus === "done" ? (
                      <FiCheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          stepStatus === "active" ? "bg-[#c47a5a]" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium capitalize ${
                      stepStatus === "active" ? "text-[#c47a5a]" : stepStatus === "done" ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <FiXCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">This order has been cancelled.</p>
        </div>
      )}

      {/* Order Items */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Items ({order.items.length})</h2>
          {/* Reorder Button */}
          <button
            onClick={reorder}
            disabled={reordering}
            className="flex items-center gap-1.5 rounded-lg border border-[#c47a5a] px-3 py-1.5 text-sm font-medium text-[#c47a5a] transition-colors hover:bg-[#c47a5a]/5 disabled:opacity-50"
          >
            {reordering ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c47a5a] border-t-transparent" />
            ) : (
              <FiShoppingCart className="h-4 w-4" />
            )}
            {reordering ? "Adding..." : "Reorder"}
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <Image
                src={getImageUrl(item.image)}
                alt={item.name}
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatCurrency(item.price)} x {item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-gray-800">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">Notes</h2>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}

      {/* Order Summary */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Order Summary</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-700">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span className="font-medium text-gray-700">{formatCurrency(order.tax)}</span>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-800">Total</span>
              <span className="text-xl font-bold text-gray-800">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BILLING SECTION */}

      {/* Served: Show Request Bill / Call Waiter */}
      {isServed && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Billing</h2>

          {!bill ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => requestBillWithOptions()}
                disabled={generatingBill}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c47a5a] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#b56a4a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingBill ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <FiFileText className="h-5 w-5" />
                )}
                {generatingBill ? "Requesting..." : "Request Bill"}
              </button>
              <button
                onClick={() => requestBillWithOptions({ callWaiter: true })}
                disabled={generatingBill}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#c47a5a] px-6 py-3 font-semibold text-[#c47a5a] transition-colors hover:bg-[#c47a5a]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiClock className="h-5 w-5" />
                Call Waiter for Bill
              </button>
            </div>
          ) : (bill as any).status === "requested" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                <FiClock className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-700">Waiting for staff confirmation...</span>
              </div>
              <BillDetails bill={bill} formatDate={formatDate} />
              <button onClick={downloadPdf} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#c47a5a] px-6 py-3 font-semibold text-[#c47a5a] hover:bg-[#c47a5a]/5">
                <FiDownload className="h-5 w-5" /> Download PDF
              </button>
              {!bill.isPaid && (
                <PaymentSection
                  selectedPayment={selectedPayment}
                  setSelectedPayment={setSelectedPayment}
                  payBill={payBill}
                  payingBill={payingBill}
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {bill.isPaid && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                  <FiCheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700">Paid</span>
                  {bill.paymentMethod && (
                    <span className="text-sm text-green-600">via <span className="capitalize">{bill.paymentMethod}</span></span>
                  )}
                </div>
              )}
              <BillDetails bill={bill} formatDate={formatDate} />
              <button onClick={downloadPdf} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#c47a5a] px-6 py-3 font-semibold text-[#c47a5a] hover:bg-[#c47a5a]/5">
                <FiDownload className="h-5 w-5" /> Download PDF
              </button>
              {!bill.isPaid && (
                <PaymentSection
                  selectedPayment={selectedPayment}
                  setSelectedPayment={setSelectedPayment}
                  payBill={payBill}
                  payingBill={payingBill}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Completed: Show Receipt / Print Statement */}
      {isCompleted && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Receipt</h2>
            {bill && (
              <div className="flex gap-2">
                <button
                  onClick={downloadPdf}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <FiDownload className="h-4 w-4" /> PDF
                </button>
                <button
                  onClick={printReceipt}
                  className="flex items-center gap-1.5 rounded-lg border border-[#c47a5a] px-3 py-1.5 text-sm font-medium text-[#c47a5a] transition-colors hover:bg-[#c47a5a]/5"
                >
                  <FiPrinter className="h-4 w-4" /> Print
                </button>
              </div>
            )}
          </div>

          {/* Receipt body */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 space-y-4">
            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-gray-300 pb-4">
              <p className="text-lg font-bold text-gray-800">Foody Restaurant</p>
              <p className="text-xs text-gray-500">Thank you for dining with us!</p>
              <p className="text-xs text-gray-400 mt-1">Order #{order._id.slice(-6).toUpperCase()}</p>
              <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              {order.tableNumber && <p className="text-xs text-gray-400">Table {order.tableNumber}</p>}
            </div>

            {/* Items */}
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} <span className="text-gray-400">x{item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-800">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium">{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-800 pt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            {bill && (
              <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5">
                {bill.billNumber && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Bill No.</span>
                    <span className="font-medium">{bill.billNumber}</span>
                  </div>
                )}
                {bill.paymentMethod && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Payment</span>
                    <span className="font-medium capitalize">{bill.paymentMethod}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-semibold ${bill.isPaid ? "text-green-600" : "text-red-500"}`}>
                    {bill.isPaid ? "PAID" : "UNPAID"}
                  </span>
                </div>
                {bill.isPaid && bill.paidAt && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Paid at</span>
                    <span className="font-medium">{formatDate(bill.paidAt)}</span>
                  </div>
                )}
              </div>
            )}

            {/* No bill yet */}
            {!bill && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
                <p className="text-sm text-yellow-700">Bill not yet generated. Please contact staff.</p>
              </div>
            )}

            {/* Pay if unpaid */}
            {bill && !bill.isPaid && (
              <PaymentSection
                selectedPayment={selectedPayment}
                setSelectedPayment={setSelectedPayment}
                payBill={payBill}
                payingBill={payingBill}
              />
            )}
          </div>
        </div>
      )}

      {/* Review Section - Only for completed orders */}
      {isCompleted && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FiEdit3 className="h-5 w-5 text-[#c47a5a]" />
            <h2 className="text-lg font-semibold text-gray-800">Rate Your Experience</h2>
          </div>

          <div className="space-y-5">
            {order.items.map((item, idx) => {
              const productId = item.product;
              const review = reviews[productId] || { rating: 0, comment: "", submitted: false };

              return (
                <div key={idx} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Image
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                    </div>
                  </div>

                  {review.submitted ? (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                      <FiCheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Review submitted!</span>
                      <div className="flex ml-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className="h-3.5 w-3.5"
                            style={{ fill: star <= review.rating ? "#f59e0b" : "none", color: star <= review.rating ? "#f59e0b" : "#d1d5db" }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Star Rating */}
                      <div>
                        <p className="mb-2 text-xs font-medium text-gray-500">Your Rating</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setItemRating(productId, star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <FiStar
                                className="h-7 w-7 transition-colors"
                                style={{
                                  fill: star <= review.rating ? "#f59e0b" : "none",
                                  color: star <= review.rating ? "#f59e0b" : "#d1d5db",
                                }}
                              />
                            </button>
                          ))}
                          {review.rating > 0 && (
                            <span className="ml-2 self-center text-sm text-gray-500">
                              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][review.rating]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comment */}
                      <textarea
                        value={review.comment}
                        onChange={(e) => setItemComment(productId, e.target.value)}
                        placeholder="Share your experience (optional)..."
                        rows={2}
                        className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-[#c47a5a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                      />

                      {/* Submit Button */}
                      <button
                        onClick={() => submitReview(productId, item.name)}
                        disabled={!review.rating || submittingReview === productId}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c47a5a] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#b56a4a] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submittingReview === productId ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <FiStar className="h-4 w-4" />
                        )}
                        {submittingReview === productId ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function BillDetails({ bill, formatDate }: { bill: Bill; formatDate: (d: string) => string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 space-y-2">
      {bill.billNumber && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Bill Number</span>
          <span className="font-medium text-gray-700">{bill.billNumber}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Amount</span>
        <span className="font-semibold text-gray-800">{formatCurrency(bill.total)}</span>
      </div>
      {bill.paymentMethod && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Payment Method</span>
          <span className="font-medium capitalize text-gray-700">{bill.paymentMethod}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Status</span>
        <span className={`inline-flex items-center gap-1 text-sm font-medium ${bill.isPaid ? "text-green-600" : "text-gray-500"}`}>
          {bill.isPaid ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiXCircle className="h-3.5 w-3.5" />}
          {bill.isPaid ? "Paid" : "Unpaid"}
        </span>
      </div>
      {bill.isPaid && bill.paidAt && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Paid At</span>
          <span className="font-medium text-gray-700">{formatDate(bill.paidAt)}</span>
        </div>
      )}
    </div>
  );
}

function PaymentSection({
  selectedPayment,
  setSelectedPayment,
  payBill,
  payingBill,
}: {
  selectedPayment: "cash" | "esewa" | "khalti" | "bank";
  setSelectedPayment: (v: "cash" | "esewa" | "khalti" | "bank") => void;
  payBill: () => void;
  payingBill: boolean;
}) {
  const PAYMENT_METHODS = [
    { value: "cash" as const, label: "Cash" },
    { value: "esewa" as const, label: "eSewa" },
    { value: "khalti" as const, label: "Khalti" },
    { value: "bank" as const, label: "Bank" },
  ];

  return (
    <div className="space-y-3 border-t border-gray-100 pt-4">
      <h3 className="text-sm font-semibold text-gray-800">Pay Bill</h3>
      <div className="grid grid-cols-4 gap-2">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method.value}
            onClick={() => setSelectedPayment(method.value)}
            className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
              selectedPayment === method.value
                ? "border-[#c47a5a] bg-[#c47a5a]/5 text-[#c47a5a]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {method.label}
          </button>
        ))}
      </div>
      <button
        onClick={payBill}
        disabled={payingBill}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c47a5a] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#b56a4a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {payingBill ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <FiCreditCard className="h-5 w-5" />
        )}
        {payingBill ? "Processing..." : "Pay Bill"}
      </button>
    </div>
  );
}
