"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import API from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { Product, Category, Pagination } from "@/types";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiStar,
  FiShoppingCart,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";
import OfferBadge from "@/components/product/OfferBadge";
import PriceDisplay from "@/components/product/PriceDisplay";

const SORT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Price: Low to High", value: "price" },
  { label: "Price: High to Low", value: "-price" },
  { label: "Rating", value: "-rating" },
  { label: "Newest", value: "-createdAt" },
];

const FILTER_OPTIONS = [
  { label: "All Items", value: "" },
  { label: "Hot Deals", value: "isHotDeal" },
  { label: "Featured", value: "isFeatured" },
  { label: "Today's Special", value: "isDailySpecial" },
  { label: "Chef's Special", value: "isChefSpecial" },
  { label: "On Offer", value: "onOffer" },
];

export default function MenuPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isVeg, setIsVeg] = useState(false);
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [promotionalFilter, setPromotionalFilter] = useState("");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, selectedCategory, isVeg, sort, page, promotionalFilter]);

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(res.data.categories || res.data || []);
    } catch {
      // silently fail - categories are optional filter
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedCategory) params.set("category", selectedCategory);
      if (isVeg) params.set("isVeg", "true");
      if (sort) params.set("sort", sort);
      if (promotionalFilter) params.set(promotionalFilter, "true");

      const res = await API.get(`/products?${params.toString()}`);
      setProducts(res.data.products || []);
      setPagination(
        res.data.pagination || { page: 1, limit: 12, total: 0, pages: 0 }
      );
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.message || "Failed to load menu";
      toast.error(msg);
      setErrorMsg(msg);
      // not resolving for some reason
      setProducts([]);
      setPagination({ page: 1, limit: 12, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      await API.post("/cart/add", { productId, quantity: 1 });
      toast.success("Added to cart!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleVegToggle = () => {
    setIsVeg((prev) => !prev);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  const getCategoryName = (product: Product): string => {
    if (typeof product.category === "object" && product.category !== null) {
      return product.category.name;
    }
    return "";
  };

  // Skeleton loader
  const ProductSkeleton = () => (
    <div className="animate-pulse rounded-xl bg-white shadow-sm">
      <div className="h-48 rounded-t-xl bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="h-8 w-24 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Menu</h1>
        <p className="mt-1 text-gray-500">
          Explore our delicious offerings and add your favorites to the cart.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 shadow-sm outline-none transition-colors focus:border-[#c47a5a] focus:ring-1 focus:ring-[#c47a5a]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => handleCategoryChange("")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === ""
                ? "bg-[#c47a5a] text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {categories.filter((cat) => cat.name.trim().toLowerCase() !== "all").map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategoryChange(cat._id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat._id
                  ? "bg-[#c47a5a] text-white"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Promotional Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setPromotionalFilter(filter.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                promotionalFilter === filter.value
                  ? "bg-[#c47a5a] text-white"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Veg Toggle & Sort */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Veg Toggle */}
          <button
            onClick={handleVegToggle}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isVeg
                ? "bg-green-500 text-white"
                : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 rounded-sm border-2 ${
                isVeg ? "border-white bg-white" : "border-green-500 bg-green-500"
              }`}
            />
            Veg Only
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <FiFilter className="h-4 w-4 text-gray-400" />
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#c47a5a] focus:ring-1 focus:ring-[#c47a5a]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : errorMsg ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-red-500">{errorMsg}</p>
          <p className="mt-1 text-sm text-gray-400">
            Please make sure the backend server is running and refresh the page.
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center">
          <FiSearch className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">No dishes found</p>
          <p className="mt-1 text-sm text-gray-400">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Image */}
              <Link href={`/menu/${product._id}`} className="block relative">
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    width={400}
                    height={300}
                    unoptimized
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Veg/Non-veg Badge */}
                  <span
                    className={`absolute left-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-sm border-2 ${
                      product.isVeg
                        ? "border-green-500"
                        : "border-red-500"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        product.isVeg ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </span>

                  {!product.isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-700">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="p-4">
                <Link href={`/menu/${product._id}`}>
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 hover:text-[#c47a5a] transition-colors">
                    {product.name}
                  </h3>
                </Link>

                {getCategoryName(product) && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {getCategoryName(product)}
                  </p>
                )}

                {/* Promotional Badges */}
                <div className="mt-2">
                  <OfferBadge product={product} className="text-xs" />
                </div>

                {/* Rating */}
                <div className="mt-1.5 flex items-center gap-1">
                  <FiStar className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium text-gray-600">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({product.numReviews})
                  </span>
                </div>

                {/* Price & Add to Cart */}
                <div className="mt-3 flex items-center justify-between">
                  <PriceDisplay product={product} size="sm" showSavings={false} />
                  <button
                    onClick={() => handleAddToCart(product._id)}
                    disabled={!product.isAvailable || addingToCart === product._id}
                    className="flex items-center gap-1.5 rounded-lg bg-[#c47a5a] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#b56a4a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingToCart === product._id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <FiShoppingCart className="h-3.5 w-3.5" />
                    )}
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter((p) => {
              if (pagination.pages <= 5) return true;
              if (p === 1 || p === pagination.pages) return true;
              if (Math.abs(p - page) <= 1) return true;
              return false;
            })
            .reduce<(number | string)[]>((acc, p, i, arr) => {
              if (i > 0 && typeof arr[i - 1] === "number" && p - (arr[i - 1] as number) > 1) {
                acc.push("...");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              typeof p === "string" ? (
                <span key={`dots-${i}`} className="px-1 text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-[#c47a5a] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
