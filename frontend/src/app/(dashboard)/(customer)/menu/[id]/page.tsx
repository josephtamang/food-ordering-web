"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import API, { getImageUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import { Product } from "@/types";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiStar,
  FiShoppingCart,
  FiMinus,
  FiPlus,
  FiSend,
  FiUser,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiChevronDown,
} from "react-icons/fi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, ReviewInput } from "@/schemas/review.schema";
import { Review } from "@/types";
import { useAuth } from "@/hooks/useAuth";

type SortOption = "newest" | "highest" | "lowest";

function StarRow({ count, total, star }: { count: number; total: number; star: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-gray-500">{star}</span>
      <FiStar size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-gray-400">{count}</span>
    </div>
  );
}

function StarSelector({
  value,
  hover,
  onChange,
  onHover,
}: {
  value: number;
  hover: number;
  onChange: (v: number) => void;
  onHover: (v: number) => void;
}) {
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  const active = hover || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => onHover(s)}
          onMouseLeave={() => onHover(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <FiStar
            size={26}
            className={`transition-colors ${
              s <= active ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
      {active > 0 && (
        <span className="ml-1 text-sm font-medium text-gray-600">{labels[active]}</span>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [editingReview, setEditingReview] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editHover, setEditHover] = useState(0);
  const [deletingReview, setDeletingReview] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({ total: 0, pages: 1 });

  const { register: regReview, handleSubmit: handleReview, formState: { errors: reviewErrors }, reset: resetReview } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
  });
  const { register: regEdit, handleSubmit: handleEdit, formState: { errors: editErrors }, reset: resetEdit, setValue: setEditValue } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
  });

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/products/${id}`);
      const prod = res.data.product || res.data;
      setProduct(prod);
      setSelectedImage(prod.image || "");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load product");
      router.push("/menu");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = useCallback(async (page = 1) => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await API.get(`/reviews/product/${id}`, { params: { page, limit: 5 } });
      const data = res.data.reviews || [];
      setReviews(data);
      if (res.data.pagination) {
        setReviewPagination({ total: res.data.pagination.total, pages: res.data.pagination.pages });
      }
      if (user) {
        const existing = data.find((r: Review) => {
          const ru = typeof r.user === "object" ? r.user._id : r.user;
          return ru === user._id;
        });
        if (existing) setMyReview(existing);
      }
    } catch {}
    setReviewsLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetchReviews(reviewPage);
  }, [reviewPage, fetchReviews]);

  useEffect(() => {
    if (user && id) {
      API.get("/orders/my-orders").then((res) => {
        const orders = res.data.orders || [];
        const hasCompleted = orders.some((o: any) =>
          ["completed", "served"].includes(o.status) &&
          o.items.some((i: any) => i.product === id)
        );
        setCanReview(hasCompleted);
      }).catch(() => {});
    }
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await API.post("/cart/add", { productId: product._id, quantity });
      toast.success(`${product.name} added to cart!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const onReviewSubmit = async (data: ReviewInput) => {
    if (selectedRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    try {
      setSubmittingReview(true);
      const res = await API.post(`/reviews/product/${id}`, {
        rating: selectedRating,
        comment: data.comment || "",
      });
      setMyReview(res.data.review);
      resetReview();
      setSelectedRating(0);
      toast.success("Review submitted!");
      setReviewPage(1);
      await fetchReviews(1);
      const prodRes = await API.get(`/products/${id}`);
      setProduct(prodRes.data.product);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const startEditReview = () => {
    if (!myReview) return;
    setEditRating(myReview.rating);
    setEditValue("comment", myReview.comment || "");
    setEditingReview(true);
  };

  const onEditSubmit = async (data: ReviewInput) => {
    if (!myReview) return;
    if (editRating === 0) { toast.error("Please select a rating"); return; }
    try {
      setSubmittingReview(true);
      const res = await API.put(`/reviews/${myReview._id}`, {
        rating: editRating,
        comment: data.comment || "",
      });
      const updated = res.data.review;
      setMyReview(updated);
      setReviews((prev) => prev.map((r) => r._id === updated._id ? updated : r));
      setEditingReview(false);
      resetEdit();
      toast.success("Review updated!");
      const prodRes = await API.get(`/products/${id}`);
      setProduct(prodRes.data.product);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    if (!confirm("Delete your review?")) return;
    setDeletingReview(true);
    try {
      await API.delete(`/reviews/${myReview._id}`);
      setMyReview(null);
      setReviews((prev) => prev.filter((r) => r._id !== myReview._id));
      setCanReview(true);
      toast.success("Review deleted");
      const prodRes = await API.get(`/products/${id}`);
      setProduct(prodRes.data.product);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    } finally {
      setDeletingReview(false);
    }
  };

  const getCategoryName = (): string => {
    if (!product) return "";
    if (typeof product.category === "object" && product.category !== null) {
      return product.category.name;
    }
    return "";
  };

  const allImages = product
    ? [product.image, ...(product.images || [])].filter(Boolean)
    : [];

  // Rating distribution
  const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating]++; });

  // Sorted reviews (client-side within current page)
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "lowest") return a.rating - b.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 rounded bg-gray-200 animate-pulse" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="h-96 rounded-xl bg-gray-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-1/4 rounded bg-gray-200 animate-pulse" />
            <div className="h-20 w-full rounded bg-gray-200 animate-pulse" />
            <div className="h-10 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-12 w-48 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-gray-500">Product not found.</p>
        <Link
          href="/menu"
          className="mt-4 inline-flex items-center gap-2 text-[#c47a5a] hover:underline"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Menu
        </Link>
      </div>
    );
  }

  const displayPrice = product.finalPrice ?? product.price;
  const hasDiscount = product.discountType && product.discountType !== "none";

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/menu"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#c47a5a]"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to Menu
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="relative h-80 w-full overflow-hidden rounded-xl bg-gray-100 sm:h-96">
            <Image
              src={getImageUrl(selectedImage)}
              alt={product.name}
              width={800}
              height={600}
              unoptimized
              className="h-full w-full object-cover"
            />
            {/* Veg/Non-veg Badge */}
            <span
              className={`absolute left-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-sm border-2 bg-white ${
                product.isVeg ? "border-green-500" : "border-red-500"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  product.isVeg ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </span>

            {/* Promotional badges */}
            <div className="absolute right-3 top-3 flex flex-col gap-1 items-end">
              {product.isHotDeal && (
                <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">Hot Deal</span>
              )}
              {product.isFeatured && (
                <span className="rounded-full bg-yellow-500 px-2.5 py-0.5 text-xs font-bold text-white">Featured</span>
              )}
              {product.isChefSpecial && (
                <span className="rounded-full bg-purple-500 px-2.5 py-0.5 text-xs font-bold text-white">Chef's Special</span>
              )}
              {product.isDailySpecial && (
                <span className="rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-bold text-white">Today's Special</span>
              )}
            </div>

            {!product.isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700">
                  Currently Unavailable
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`shrink-0 h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                    selectedImage === img
                      ? "border-[#c47a5a]"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={getImageUrl(img)}
                    alt={`${product.name} ${i + 1}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          {/* Name & Category */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
              {product.name}
            </h1>
            {getCategoryName() && (
              <p className="mt-1 text-sm text-gray-400">{getCategoryName()}</p>
            )}
          </div>

          {/* Rating Summary */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <FiStar
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">
              ({product.numReviews} review{product.numReviews !== 1 ? "s" : ""})
            </span>
          </div>

          {/* Veg/Non-veg */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-sm border-2 ${
                product.isVeg ? "border-green-500" : "border-red-500"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${product.isVeg ? "bg-green-500" : "bg-red-500"}`} />
            </span>
            <span className={`text-sm font-medium ${product.isVeg ? "text-green-600" : "text-red-600"}`}>
              {product.isVeg ? "Vegetarian" : "Non-Vegetarian"}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-gray-800">
              {formatCurrency(displayPrice)}
            </p>
            {hasDiscount && product.price !== displayPrice && (
              <p className="text-lg text-gray-400 line-through">{formatCurrency(product.price)}</p>
            )}
            {hasDiscount && product.offerLabel && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                {product.offerLabel}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Description</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center rounded-lg border border-gray-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiMinus className="h-4 w-4" />
              </button>
              <span className="flex h-10 w-12 items-center justify-center border-x border-gray-200 text-sm font-semibold text-gray-800">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                disabled={quantity >= 20}
                className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiPlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || addingToCart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c47a5a] px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#b56a4a] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {addingToCart ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <FiShoppingCart className="h-5 w-5" />
            )}
            {addingToCart
              ? "Adding..."
              : !product.isAvailable
              ? "Unavailable"
              : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* ───── Reviews Section ───── */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Reviews & Ratings</h2>
        </div>

        {/* Rating Overview */}
        {product.numReviews > 0 && (
          <div className="px-6 py-5 flex flex-col sm:flex-row gap-6 border-b border-gray-100 bg-gray-50">
            {/* Big Score */}
            <div className="flex flex-col items-center justify-center min-w-[100px]">
              <span className="text-5xl font-extrabold text-gray-800">{product.rating.toFixed(1)}</span>
              <div className="flex mt-1">
                {[1,2,3,4,5].map((s) => (
                  <FiStar key={s} size={16} className={s <= Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                ))}
              </div>
              <span className="mt-1 text-xs text-gray-400">{product.numReviews} review{product.numReviews !== 1 ? "s" : ""}</span>
            </div>
            {/* Distribution bars */}
            <div className="flex-1 flex flex-col justify-center gap-1.5">
              {[5,4,3,2,1].map((star) => (
                <StarRow key={star} star={star} count={ratingDist[star]} total={reviews.length} />
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-5 space-y-6">
          {/* Write Review Form */}
          {user && canReview && !myReview && (
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Share Your Experience</h3>
              <form onSubmit={handleReview(onReviewSubmit)} className="space-y-4">
                <StarSelector
                  value={selectedRating}
                  hover={hoverRating}
                  onChange={setSelectedRating}
                  onHover={setHoverRating}
                />
                <textarea
                  {...regReview("comment")}
                  placeholder="Tell others what you think about this dish... (optional)"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c47a5a]/20 focus:border-[#c47a5a] resize-none text-sm"
                />
                {reviewErrors.comment && (
                  <p className="text-red-500 text-xs">{reviewErrors.comment.message}</p>
                )}
                <button
                  type="submit"
                  disabled={submittingReview || selectedRating === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-[#c47a5a] text-white rounded-lg text-sm font-medium hover:bg-[#b56a4a] disabled:opacity-50 transition-colors"
                >
                  <FiSend size={14} />
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          )}

          {/* My Review Card */}
          {myReview && (
            <div className="border border-[#c47a5a]/25 rounded-xl p-5 bg-[#c47a5a]/5">
              {editingReview ? (
                <form onSubmit={handleEdit(onEditSubmit)} className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Edit Your Review</p>
                  <StarSelector
                    value={editRating}
                    hover={editHover}
                    onChange={setEditRating}
                    onHover={setEditHover}
                  />
                  <textarea
                    {...regEdit("comment")}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c47a5a]/20 focus:border-[#c47a5a] resize-none text-sm"
                  />
                  {editErrors.comment && (
                    <p className="text-red-500 text-xs">{editErrors.comment.message}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#c47a5a] text-white rounded-lg text-sm font-medium hover:bg-[#b56a4a] disabled:opacity-50"
                    >
                      {submittingReview ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReview(false)}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#c47a5a]">
                          <FiCheckCircle size={12} /> Your Review
                        </span>
                        <div className="flex">
                          {[1,2,3,4,5].map((s) => (
                            <FiStar key={s} size={13} className={s <= myReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(myReview.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {myReview.comment && (
                        <p className="text-sm text-gray-700">{myReview.comment}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={startEditReview}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-white border border-gray-200 transition-colors"
                      >
                        <FiEdit2 size={11} /> Edit
                      </button>
                      <button
                        onClick={handleDeleteReview}
                        disabled={deletingReview}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
                      >
                        <FiTrash2 size={11} /> {deletingReview ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Reviews List Header */}
          {reviewPagination.total > 0 && (
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                All Reviews
                <span className="ml-1.5 text-gray-400 font-normal">({reviewPagination.total})</span>
              </h3>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c47a5a]/20 text-gray-600 bg-white cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
                <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedReviews.length === 0 ? (
            <div className="py-10 text-center">
              <FiStar className="mx-auto mb-2 h-10 w-10 text-gray-300" />
              <p className="text-gray-400 text-sm">No reviews yet.</p>
              {user && canReview && !myReview && (
                <p className="text-xs text-gray-400 mt-1">Be the first to share your experience!</p>
              )}
            </div>
          ) : (
            <div className="space-y-1 divide-y divide-gray-100">
              {sortedReviews
                .filter((r) => r._id !== myReview?._id) // avoid duplicate if myReview is in list
                .map((review) => {
                  const reviewUser = typeof review.user === "object" ? review.user : null;
                  return (
                    <div key={review._id} className="flex gap-3 py-4 first:pt-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {reviewUser?.avatar ? (
                          <Image
                            src={getImageUrl(reviewUser.avatar)}
                            alt=""
                            width={40}
                            height={40}
                            className="w-full h-full rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <FiUser size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-gray-800">
                            {reviewUser?.name || "User"}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <FiStar
                                key={s}
                                size={12}
                                className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Pagination */}
          {reviewPagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                disabled={reviewPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {reviewPage} of {reviewPagination.pages}
              </span>
              <button
                onClick={() => setReviewPage((p) => Math.min(reviewPagination.pages, p + 1))}
                disabled={reviewPage >= reviewPagination.pages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
