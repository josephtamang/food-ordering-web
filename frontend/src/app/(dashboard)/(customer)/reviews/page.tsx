"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import API, { getImageUrl } from "@/lib/api";
import { Review } from "@/types";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, ReviewInput } from "@/schemas/review.schema";
import {
  FiStar,
  FiEdit2,
  FiTrash2,
  FiMessageSquare,
  FiExternalLink,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

type ReviewWithProduct = Review & {
  product: { _id: string; name: string; image: string; price: number } | string;
};

function StarSelector({
  value,
  hover,
  onChange,
  onHover,
  size = 22,
}: {
  value: number;
  hover: number;
  onChange: (v: number) => void;
  onHover: (v: number) => void;
  size?: number;
}) {
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
            size={size}
            className={`transition-colors ${
              s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 4 ? "bg-green-100 text-green-700" :
    rating === 3 ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      <FiStar size={10} className={rating >= 4 ? "fill-green-600 text-green-600" : rating === 3 ? "fill-yellow-600 text-yellow-600" : "fill-red-600 text-red-600"} />
      {rating}.0
    </span>
  );
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHover, setEditHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
  });

  const fetchMyReviews = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await API.get("/reviews/my-reviews", { params: { page, limit: 8 } });
      setReviews(res.data.reviews || []);
      if (res.data.pagination) {
        setPagination({
          page: res.data.pagination.page,
          pages: res.data.pagination.pages,
          total: res.data.pagination.total,
        });
      }
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReviews(pagination.page);
  }, [pagination.page]);

  const startEdit = (review: ReviewWithProduct) => {
    setEditingId(review._id);
    setEditRating(review.rating);
    setValue("comment", review.comment || "");
    setEditHover(0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset();
    setEditRating(0);
    setEditHover(0);
  };

  const onEditSubmit = async (data: ReviewInput) => {
    if (!editingId) return;
    if (editRating === 0) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    try {
      const res = await API.put(`/reviews/${editingId}`, {
        rating: editRating,
        comment: data.comment || "",
      });
      const updated = res.data.review;
      setReviews((prev) =>
        prev.map((r) =>
          r._id === editingId ? { ...r, rating: updated.rating, comment: updated.comment } : r
        )
      );
      setEditingId(null);
      reset();
      toast.success("Review updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (review: ReviewWithProduct) => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setDeletingId(review._id);
    try {
      await API.delete(`/reviews/${review._id}`);
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast.success("Review deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  const getProductInfo = (review: ReviewWithProduct) => {
    if (typeof review.product === "object" && review.product !== null) {
      return review.product;
    }
    return null;
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and edit the reviews you&apos;ve written
          </p>
        </div>
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#c47a5a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b56a4a] transition-colors"
        >
          <FiExternalLink size={14} />
          Browse Menu
        </Link>
      </div>

      {/* Stats Bar */}
      {!loading && pagination.total > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Reviews</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{pagination.total}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Average Rating</p>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-2xl font-bold text-gray-800">{avgRating}</p>
              <FiStar size={16} className="fill-yellow-400 text-yellow-400" />
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm sm:block hidden">
            <p className="text-xs text-gray-500">5-Star Reviews</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">
              {reviews.filter((r) => r.rating === 5).length}
            </p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white p-5 shadow-sm animate-pulse">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-lg bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl bg-white p-16 shadow-sm text-center">
          <FiMessageSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <h3 className="text-base font-semibold text-gray-700">No Reviews Yet</h3>
          <p className="mt-1 text-sm text-gray-400">
            Order and try our dishes, then share your experience!
          </p>
          <Link
            href="/menu"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#c47a5a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#b56a4a] transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const prod = getProductInfo(review);
            const isEditing = editingId === review._id;

            return (
              <div
                key={review._id}
                className={`rounded-xl bg-white shadow-sm overflow-hidden transition-all ${
                  isEditing ? "ring-2 ring-[#c47a5a]/30" : ""
                }`}
              >
                <div className="p-5">
                  {/* Product Info Row */}
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {prod?.image ? (
                        <Image
                          src={getImageUrl(prod.image)}
                          alt={prod.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <FiStar size={20} className="text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Product Name + Review Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {prod ? (
                            <Link
                              href={`/menu/${prod._id}`}
                              className="text-sm font-semibold text-gray-800 hover:text-[#c47a5a] transition-colors inline-flex items-center gap-1 truncate"
                            >
                              {prod.name}
                              <FiExternalLink size={11} className="shrink-0" />
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-gray-800">Product</span>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <FiStar
                                  key={s}
                                  size={13}
                                  className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                />
                              ))}
                            </div>
                            <RatingBadge rating={review.rating} />
                            <span className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {!isEditing && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => startEdit(review)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                            >
                              <FiEdit2 size={11} /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(review)}
                              disabled={deletingId === review._id}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
                            >
                              <FiTrash2 size={11} />
                              {deletingId === review._id ? "..." : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>

                      {!isEditing && review.comment && (
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                      )}
                      {!isEditing && !review.comment && (
                        <p className="mt-2 text-xs text-gray-400 italic">No comment written</p>
                      )}
                    </div>
                  </div>

                  {/* Edit Form */}
                  {isEditing && (
                    <form onSubmit={handleSubmit(onEditSubmit)} className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Edit Your Review</p>
                      <StarSelector
                        value={editRating}
                        hover={editHover}
                        onChange={setEditRating}
                        onHover={setEditHover}
                      />
                      <textarea
                        {...register("comment")}
                        rows={3}
                        placeholder="Update your comment... (optional)"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c47a5a]/20 focus:border-[#c47a5a] resize-none text-sm"
                      />
                      {errors.comment && (
                        <p className="text-red-500 text-xs">{errors.comment.message}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#c47a5a] text-white rounded-lg text-sm font-medium hover:bg-[#b56a4a] disabled:opacity-50 transition-colors"
                        >
                          {submitting ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <FiX size={14} /> Cancel
                        </button>
                      </div>
                    </form>
                  )}
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
            Page {pagination.page} of {pagination.pages} &bull; {pagination.total} reviews
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
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
