"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API, { getImageUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Product, Category, Pagination } from "@/types";
import { createProductSchema, CreateProductInput } from "@/schemas/product.schema";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/currency";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUpload,
  FiPackage,
  FiTag,
  FiZap,
  FiAward,
  FiTarget,
  FiStar,
} from "react-icons/fi";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema) as any,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts(pagination.page, categoryFilter, appliedSearch);
  }, [pagination.page, categoryFilter, appliedSearch]);

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(res.data.categories || res.data || []);
    } catch {
      toast.error("Failed to load categories");
    }
  };

  const fetchProducts = async (page: number, category: string, searchTerm: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (category) params.category = category;
      if (searchTerm) params.search = searchTerm;
      const res = await API.get("/products", { params });
      setProducts(res.data.products || res.data.data || []);
      if (res.data.pagination) {
        setPagination((prev) => ({ ...prev, ...res.data.pagination }));
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Apply search - if page is already 1, just update appliedSearch (effect will re-run)
    // If on another page, reset to 1 first (effect depends on page change too)
    setAppliedSearch(search);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearch("");
    setAppliedSearch("");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openAddModal = () => {
    setEditingProduct(null);
    reset({
      name: "",
      description: "",
      price: 0,
      category: "",
      isVeg: false,
      isAvailable: true,
      isFeatured: false,
      isHotDeal: false,
      isDailySpecial: false,
      isChefSpecial: false,
      discountType: "none",
      discountValue: 0,
      offerLabel: "",
      offerValidUntil: "",
      bogoQuantity: 0,
      bogoFreeQuantity: 0,
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const catId = typeof product.category === "string" ? product.category : product.category._id;
    reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: catId,
      isVeg: product.isVeg,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      isHotDeal: product.isHotDeal,
      isDailySpecial: product.isDailySpecial,
      isChefSpecial: product.isChefSpecial,
      discountType: product.discountType || "none",
      discountValue: product.discountValue || 0,
      offerLabel: product.offerLabel || "",
      offerValidUntil: product.offerValidUntil ? product.offerValidUntil.split("T")[0] : "",
      bogoQuantity: 0,
      bogoFreeQuantity: 0,
    });
    setImageFile(null);
    setImagePreview(product.image ? getImageUrl(product.image) : null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: CreateProductInput) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      formData.append("price", String(data.price));
      formData.append("category", data.category);
      formData.append("isVeg", String(data.isVeg ?? false));
      formData.append("isAvailable", String(data.isAvailable ?? true));

      // Promotional fields
      formData.append("isFeatured", String(data.isFeatured ?? false));
      formData.append("isHotDeal", String(data.isHotDeal ?? false));
      formData.append("isDailySpecial", String(data.isDailySpecial ?? false));
      formData.append("isChefSpecial", String(data.isChefSpecial ?? false));

      // Discount fields
      formData.append("discountType", data.discountType || "none");
      formData.append("discountValue", String(data.discountValue || 0));
      if (data.offerLabel) formData.append("offerLabel", data.offerLabel);
      if (data.offerValidUntil) formData.append("offerValidUntil", data.offerValidUntil);

      if (imageFile) formData.append("image", imageFile);

      if (editingProduct) {
        await API.put(`/products/${editingProduct._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product updated successfully");
      } else {
        await API.post("/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product created successfully");
      }
      closeModal();
      fetchProducts(pagination.page, categoryFilter, appliedSearch);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      const formData = new FormData();
      formData.append("isAvailable", String(!product.isAvailable));
      await API.put(`/products/${product._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isAvailable: !p.isAvailable } : p))
      );
      toast.success(`Product ${!product.isAvailable ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await API.delete(`/products/${id}`);
      toast.success("Product deleted");
      fetchProducts(pagination.page, categoryFilter, appliedSearch);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryName = (cat: Category | string) =>
    typeof cat === "string" ? cat : cat.name;

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#c47a5a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="mt-1 text-gray-500">Manage your menu products</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#c47a5a] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b36a4a]"
        >
          <FiPlus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-9 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          Search
        </button>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 font-medium text-gray-500">Product</th>
              <th className="px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 font-medium text-gray-500">Price</th>
              <th className="px-4 py-3 font-medium text-gray-500">Promotions</th>
              <th className="px-4 py-3 font-medium text-gray-500">Discount</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Available</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  <FiPackage className="mx-auto mb-2 h-10 w-10" />
                  <p>No products found.</p>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={getImageUrl(product.image)}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{product.name}</p>
                        {product.description && (
                          <p className="max-w-[200px] truncate text-xs text-gray-400">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {getCategoryName(product.category)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.isHotDeal && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          <FiZap className="h-3 w-3" /> Hot Deal
                        </span>
                      )}
                      {product.isFeatured && !product.isHotDeal && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                          <FiAward className="h-3 w-3" /> Featured
                        </span>
                      )}
                      {product.isDailySpecial && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          <FiTarget className="h-3 w-3" /> Daily
                        </span>
                      )}
                      {product.isChefSpecial && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                          <FiStar className="h-3 w-3" /> Chef
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {product.discountType && product.discountType !== "none" ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          <FiTag className="h-3 w-3" /> {product.discountType === "percentage" ? `${product.discountValue || 0}%` : product.discountType === "fixed" ? formatCurrency(product.discountValue || 0) : product.discountType.toUpperCase()}
                        </span>
                        {product.offerLabel && (
                          <span className="text-xs text-gray-500">{product.offerLabel}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No offer</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.isVeg
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.isVeg ? "Veg" : "Non-Veg"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAvailability(product)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        product.isAvailable ? "bg-[#c47a5a]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          product.isAvailable ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#c47a5a]/10 hover:text-[#c47a5a]"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this product?")) {
                            handleDelete(product._id);
                          }
                        }}
                        disabled={deletingId === product._id}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
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
            Page {pagination.page} of {pagination.pages} &mdash; {pagination.total} products
            {appliedSearch && <span className="text-[#c47a5a]"> for &ldquo;{appliedSearch}&rdquo;</span>}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page <= 1 || loading}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            {/* Page number buttons */}
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
              .reduce((acc: (number | string)[], p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPagination((prev) => ({ ...prev, page: p as number }))}
                    disabled={loading}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                      pagination.page === p
                        ? "bg-[#c47a5a] text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.pages, p.page + 1) }))}
              disabled={pagination.page >= pagination.pages || loading}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1 text-gray-400 hover:text-gray-600">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Basic Info */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiPackage className="h-4 w-4" /> Basic Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                    <input
                      {...register("name")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      {...register("description")}
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("price")}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                      />
                      {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                      <select
                        {...register("category")}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register("isVeg")}
                        className="h-4 w-4 rounded border-gray-300 text-[#c47a5a] focus:ring-[#c47a5a]"
                      />
                      <span className="text-sm text-gray-700">Vegetarian</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register("isAvailable")}
                        className="h-4 w-4 rounded border-gray-300 text-[#c47a5a] focus:ring-[#c47a5a]"
                      />
                      <span className="text-sm text-gray-700">Available</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiUpload className="h-4 w-4" /> Product Image
                </h3>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-4 transition-colors hover:border-[#c47a5a]/50"
                >
                  {imagePreview ? (
                    <div className="relative h-32 w-32 overflow-hidden rounded-lg">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <>
                      <FiUpload className="mb-2 h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload image</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Promotional Flags */}
              <div className="border-t pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiAward className="h-4 w-4" /> Promotional Flags
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      {...register("isHotDeal")}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                    <span className="text-sm text-gray-700">
                      <div className="font-medium">Hot Deal</div>
                      <div className="text-xs text-gray-500">Limited time offer</div>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      {...register("isFeatured")}
                      className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-600"
                    />
                    <span className="text-sm text-gray-700">
                      <div className="font-medium">Featured</div>
                      <div className="text-xs text-gray-500">Highlight item</div>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      {...register("isDailySpecial")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      <div className="font-medium">Daily Special</div>
                      <div className="text-xs text-gray-500">Today's special</div>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      {...register("isChefSpecial")}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                    />
                    <span className="text-sm text-gray-700">
                      <div className="font-medium">Chef Special</div>
                      <div className="text-xs text-gray-500">Chef recommendation</div>
                    </span>
                  </label>
                </div>
              </div>

              {/* Discount Settings */}
              <div className="border-t pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiTag className="h-4 w-4" /> Discount & Offers
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Discount Type</label>
                    <select
                      {...register("discountType")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage Off</option>
                      <option value="fixed">Fixed Amount Off</option>
                      <option value="bogo">Buy One Get One</option>
                      <option value="combo">Combo Deal</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Discount Value</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("discountValue")}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Offer Label (Optional)</label>
                      <input
                        type="text"
                        {...register("offerLabel")}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                        placeholder="e.g., 50% Off, Buy 2 Get 1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Valid Until (Optional)</label>
                    <input
                      type="date"
                      {...register("offerValidUntil")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#c47a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#b36a4a] disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
