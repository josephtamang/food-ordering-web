"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import API, { getImageUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { Cart, CartItem } from "@/types";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  orderCheckoutSchema,
  OrderCheckoutInput,
} from "@/schemas/product.schema";
import {
  FiShoppingCart,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiArrowLeft,
  FiShoppingBag,
} from "react-icons/fi";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderCheckoutInput>({
    resolver: zodResolver(orderCheckoutSchema),
    defaultValues: {
      tableNumber: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await API.get("/cart");
      setCart(res.data.cart || res.data || null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setUpdatingItem(productId);
    try {
      const res = await API.put(`/cart/${productId}`, { quantity });
      setCart(res.data.cart || res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (productId: string) => {
    setRemovingItem(productId);
    try {
      const res = await API.delete(`/cart/${productId}`);
      setCart(res.data.cart || res.data);
      toast.success("Item removed from cart");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove item");
    } finally {
      setRemovingItem(null);
    }
  };

  const clearCart = async () => {
    setClearing(true);
    try {
      await API.delete("/cart");
      setCart(null);
      toast.success("Cart cleared");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to clear cart");
    } finally {
      setClearing(false);
    }
  };

  const onCheckout = async (data: OrderCheckoutInput) => {
    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await API.post("/orders", {
        tableNumber: data.tableNumber || undefined,
        notes: data.notes || undefined,
      });
      const order = res.data.order || res.data;
      toast.success("Order placed successfully!");
      setCart(null);
      router.push(`/orders/${order._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl bg-white p-4 shadow-sm animate-pulse"
              >
                <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-8 w-32 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Cart</h1>
        <div className="rounded-xl bg-white py-20 text-center shadow-sm">
          <FiShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">
            Your cart is empty
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Browse our menu and add some delicious items!
          </p>
          <Link
            href="/menu"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c47a5a] px-6 py-3 font-medium text-white transition-colors hover:bg-[#b56a4a]"
          >
            <FiShoppingBag className="h-5 w-5" />
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Your Cart</h1>
          <p className="mt-1 text-sm text-gray-500">
            {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          disabled={clearing}
          className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {clearing ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          ) : (
            <FiTrash2 className="h-4 w-4" />
          )}
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map((item: CartItem) => (
            <div
              key={item._id}
              className="flex gap-4 rounded-xl bg-white p-4 shadow-sm"
            >
              {/* Item Image */}
              <Link
                href={`/menu/${item.product._id}`}
                className="shrink-0"
              >
                <Image
                  src={getImageUrl(item.product.image)}
                  alt={item.product.name}
                  width={80}
                  height={80}
                  unoptimized
                  className="h-20 w-20 rounded-lg object-cover"
                />
              </Link>

              {/* Item Details */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/menu/${item.product._id}`}
                        className="text-sm font-semibold text-gray-800 hover:text-[#c47a5a] transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${
                            item.product.isVeg
                              ? "border-green-500"
                              : "border-red-500"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.product.isVeg
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatCurrency(item.product.price)} each
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-gray-200">
                    <button
                      onClick={() =>
                        updateQuantity(item.product._id, item.quantity - 1)
                      }
                      disabled={
                        item.quantity <= 1 ||
                        updatingItem === item.product._id
                      }
                      className="flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiMinus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex h-8 w-10 items-center justify-center border-x border-gray-200 text-xs font-semibold text-gray-800">
                      {updatingItem === item.product._id ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#c47a5a] border-t-transparent" />
                      ) : (
                        item.quantity
                      )}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.product._id, item.quantity + 1)
                      }
                      disabled={
                        item.quantity >= 20 ||
                        updatingItem === item.product._id
                      }
                      className="flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.product._id)}
                    disabled={removingItem === item.product._id}
                    className="flex items-center gap-1 text-xs font-medium text-red-400 transition-colors hover:text-red-600 disabled:opacity-50"
                  >
                    {removingItem === item.product._id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                    ) : (
                      <FiTrash2 className="h-3.5 w-3.5" />
                    )}
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Continue Shopping */}
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#c47a5a] transition-colors hover:underline"
          >
            <FiArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Cart Summary & Checkout */}
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tax (5%)</span>
                <span className="font-medium text-gray-700">
                  {formatCurrency(tax)}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-800">
                    Total
                  </span>
                  <span className="text-xl font-bold text-gray-800">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <form
            onSubmit={handleSubmit(onCheckout)}
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Checkout
            </h2>
            <div className="space-y-4">
              {/* Table Number */}
              <div>
                <label
                  htmlFor="tableNumber"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Table Number{" "}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="tableNumber"
                  type="text"
                  placeholder="e.g. 5"
                  {...register("tableNumber")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-[#c47a5a] focus:ring-1 focus:ring-[#c47a5a]"
                />
                {errors.tableNumber && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.tableNumber.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Any special instructions..."
                  {...register("notes")}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-[#c47a5a] focus:ring-1 focus:ring-[#c47a5a]"
                />
                {errors.notes && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={placingOrder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c47a5a] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#b56a4a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {placingOrder ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <FiShoppingBag className="h-5 w-5" />
                )}
                {placingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
