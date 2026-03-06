"use client";

import { useState, useEffect, useRef } from "react";
import API, { getImageUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Category } from "@/types";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUpload,
  FiGrid,
} from "react-icons/fi";

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await API.get("/categories");
      setCategories(res.data.categories || res.data || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIsActive(category.isActive);
    setImageFile(null);
    setImagePreview(category.image ? getImageUrl(category.image) : null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("isActive", String(isActive));
      if (imageFile) formData.append("image", imageFile);

      if (editingCategory) {
        await API.put(`/categories/${editingCategory._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Category updated successfully");
      } else {
        await API.post("/categories", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Category created successfully");
      }
      closeModal();
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await API.delete(`/categories/${id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="mt-1 text-gray-500">Manage your menu categories</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#c47a5a] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b36a4a]"
        >
          <FiPlus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <FiGrid className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No categories yet. Add your first category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category._id}
              className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                <Image
                  src={getImageUrl(category.image)}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                {/* Status Badge */}
                <div className="absolute left-3 top-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      category.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {/* Actions Overlay */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => openEditModal(category)}
                    className="rounded-lg bg-white/90 p-2 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:text-[#c47a5a]"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this category?")) {
                        handleDelete(category._id);
                      }
                    }}
                    disabled={deletingId === category._id}
                    className="rounded-lg bg-white/90 p-2 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:text-red-500 disabled:opacity-50"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{category.name}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1 text-gray-400 hover:text-gray-600">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#c47a5a] focus:outline-none focus:ring-1 focus:ring-[#c47a5a]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isActive ? "bg-[#c47a5a]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">{isActive ? "Active" : "Inactive"}</span>
              </div>

              {/* Image Upload */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-4 transition-colors hover:border-[#c47a5a]/50"
                >
                  {imagePreview ? (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg">
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

              <div className="flex justify-end gap-3 pt-2">
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
                  {submitting ? "Saving..." : editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
