"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import API, { getImageUrl } from "@/lib/api";
import { Review, Pagination } from "@/types";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiTrash2,
  FiMessageSquare,
  FiFilter,
  FiUser,
} from "react-icons/fi";

type ReviewFull = Review & {
  product: { _id: string; name: string; image: string } | string;
};

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";

function RatingStars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FiStar
          key={s}
          size={size}
          className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const cfg =
    rating >= 4 ? { cls: "bg-green-100 text-green-700", fill: "fill-green-600 text-green-600" } :
    rating === 3 ? { cls: "bg-yellow-100 text-yellow-700", fill: "fill-yellow-600 text-yellow-600" } :
    { cls: "bg-red-100 text-red-700", fill: "fill-red-500 text-red-500" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      <FiStar size={9} className={cfg.fill} />
      {rating}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewFull[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");

  const fetchReviews = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await API.get("/reviews", {
        params: { page, limit: 12 },
      });
      setReviews(res.data.reviews || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(pagination.page);
  }, [pagination.page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await API.delete(`/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast.success("Review deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  const getUserName = (review: ReviewFull) =>
    typeof review.user === "object" && review.user !== null ? review.user.name : "User";

  const getUserAvatar = (review: ReviewFull) =>
    typeof review.user === "object" && review.user !== null ? review.user.avatar : undefined;

  const getProduct = (review: ReviewFull) =>
    typeof review.product === "object" && review.product !== null ? review.product : null;

  // Client-side rating filter
  const filteredReviews = ratingFilter === "all"
    ? reviews
    : reviews.filter((r) => r.rating === Number(ratingFilter));

  // Stats from current page
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating]++; });

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c47a5a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and moderate customer feedback
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Reviews</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{pagination.total}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Avg Rating (this page)</p>
          <div className="mt-1 flex items-center gap-1">
            <p className="text-2xl font-bold text-gray-800">{avgRating}</p>
            {reviews.length > 0 && <FiStar size={16} className="fill-yellow-400 text-yellow-400" />}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">5-Star (this page)</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{ratingDist[5]}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">1-Star (this page)</p>
          <p className="mt-1 text-2xl font-bold text-red-500">{ratingDist[1]}</p>
        </div>
      </div>

      {/* Rating Distribution Bar */}
      {reviews.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Rating Distribution (this page)</h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = reviews.length > 0 ? Math.round((ratingDist[star] / reviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <span className="text-gray-600 font-medium">{star}</span>
                    <FiStar size={10} className="fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: star >= 4 ? "#22c55e" : star === 3 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-500">{ratingDist[star]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter + Count */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""}
          {ratingFilter !== "all" ? ` with ${ratingFilter}-star rating` : ""}
        </p>
        <div className="flex items-center gap-2">
          <FiFilter size={14} className="text-gray-400" />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#c47a5a]/20 text-gray-600 bg-white"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-xl bg-white p-14 shadow-sm text-center">
          <FiMessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No reviews found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReviews.map((review) => {
            const prod = getProduct(review);
            const avatar = getUserAvatar(review);
            return (
              <div
                key={review._id}
                className="rounded-xl bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product Header */}
                {prod && (
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-50">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {prod.image ? (
                        <Image
                          src={getImageUrl(prod.image)}
                          alt={prod.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <FiStar size={16} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-700 truncate">{prod.name}</p>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* User + Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {avatar ? (
                          <Image
                            src={getImageUrl(avatar)}
                            alt=""
                            width={32}
                            height={32}
                            className="h-full w-full rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <FiUser size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{getUserName(review)}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <RatingBadge rating={review.rating} />
                  </div>

                  {/* Stars */}
                  <RatingStars rating={review.rating} />

                  {/* Comment */}
                  {review.comment ? (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No comment written</p>
                  )}

                  {/* Delete Action */}
                  <div className="pt-2 border-t border-gray-50">
                    <button
                      onClick={() => handleDelete(review._id)}
                      disabled={deletingId === review._id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                      {deletingId === review._id ? "Deleting..." : "Delete Review"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages} &bull; {pagination.total} total reviews
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1 || loading}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages || loading}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
