"use client";

import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";
import { Announcement } from "@/types";
import toast from "react-hot-toast";
import {
  FiBell,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiBookmark,
  FiEye,
  FiEyeOff,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiCalendar,
  FiTag,
  FiCheckCircle,
} from "react-icons/fi";

type AnnouncementType = Announcement["type"];

const TYPE_CONFIG: Record<
  AnnouncementType,
  { label: string; color: string; bg: string; border: string }
> = {
  offer:   { label: "Offer",   color: "text-green-700",  bg: "bg-green-100",  border: "border-green-200" },
  event:   { label: "Event",   color: "text-blue-700",   bg: "bg-blue-100",   border: "border-blue-200" },
  notice:  { label: "Notice",  color: "text-gray-700",   bg: "bg-gray-100",   border: "border-gray-200" },
  closure: { label: "Closure", color: "text-red-700",    bg: "bg-red-100",    border: "border-red-200" },
  update:  { label: "Update",  color: "text-purple-700", bg: "bg-purple-100", border: "border-purple-200" },
};

const EMPTY_FORM = {
  title: "",
  body: "",
  type: "notice" as AnnouncementType,
  isPinned: false,
  isActive: true,
  expiresAt: "",
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await API.get("/announcements/all", { params: { page, limit: 10 } });
      setAnnouncements(res.data.announcements || []);
      if (res.data.pagination) {
        setPagination({
          page: res.data.pagination.page,
          pages: res.data.pagination.pages,
          total: res.data.pagination.total,
        });
      }
    } catch {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements(pagination.page);
  }, [pagination.page]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (ann: Announcement) => {
    setEditingId(ann._id);
    setForm({
      title: ann.title,
      body: ann.body,
      type: ann.type,
      isPinned: ann.isPinned,
      isActive: ann.isActive,
      expiresAt: ann.expiresAt
        ? new Date(ann.expiresAt).toISOString().slice(0, 16)
        : "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.body.trim()) { toast.error("Body is required"); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      if (editingId) {
        const res = await API.put(`/announcements/${editingId}`, payload);
        const updated = res.data.announcement;
        setAnnouncements((prev) =>
          prev.map((a) => (a._id === editingId ? updated : a))
        );
        toast.success("Announcement updated!");
      } else {
        const res = await API.post("/announcements", payload);
        setAnnouncements((prev) => [res.data.announcement, ...prev]);
        setPagination((p) => ({ ...p, total: p.total + 1 }));
        toast.success("Announcement created!");
      }
      closeForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setDeletingId(id);
    try {
      await API.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast.success("Announcement deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (ann: Announcement) => {
    try {
      const res = await API.put(`/announcements/${ann._id}`, { isActive: !ann.isActive });
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === ann._id ? res.data.announcement : a))
      );
      toast.success(ann.isActive ? "Announcement hidden" : "Announcement activated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleTogglePin = async (ann: Announcement) => {
    try {
      const res = await API.put(`/announcements/${ann._id}`, { isPinned: !ann.isPinned });
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === ann._id ? res.data.announcement : a))
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const activeCount = announcements.filter((a) => a.isActive).length;
  const pinnedCount = announcements.filter((a) => a.isPinned).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">
            Post notices, offers, and updates for your customers
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#c47a5a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b56a4a] transition-colors"
        >
          <FiPlus size={16} />
          New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{pagination.total}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Active (this page)</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Pinned (this page)</p>
          <p className="mt-1 text-2xl font-bold text-[#c47a5a]">{pinnedCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Hidden (this page)</p>
          <p className="mt-1 text-2xl font-bold text-gray-400">
            {announcements.length - activeCount}
          </p>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white p-5 shadow-sm animate-pulse">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl bg-white p-14 shadow-sm text-center">
          <FiBell className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <h3 className="text-base font-semibold text-gray-700">No Announcements Yet</h3>
          <p className="mt-1 text-sm text-gray-400">
            Create your first announcement to inform customers.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#c47a5a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#b56a4a] transition-colors"
          >
            <FiPlus size={14} />
            Create Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const cfg = TYPE_CONFIG[ann.type];
            const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
            return (
              <div
                key={ann._id}
                className={`rounded-xl bg-white shadow-sm overflow-hidden border-l-4 transition-opacity ${
                  !ann.isActive ? "opacity-60" : ""
                } ${ann.isPinned ? "border-[#c47a5a]" : "border-transparent"}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {ann.isPinned && (
                          <FiBookmark size={13} className="text-[#c47a5a] shrink-0" />
                        )}
                        <h3 className="text-base font-semibold text-gray-800 truncate">
                          {ann.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <FiTag size={9} />
                          {cfg.label}
                        </span>
                        {!ann.isActive && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            Hidden
                          </span>
                        )}
                        {isExpired && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                            Expired
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">
                        {ann.body}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FiCalendar size={10} />
                          {new Date(ann.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {ann.expiresAt && (
                          <span className={`flex items-center gap-1 ${isExpired ? "text-red-400" : ""}`}>
                            <FiAlertCircle size={10} />
                            Expires {new Date(ann.expiresAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {typeof ann.createdBy === "object" && ann.createdBy !== null && (
                          <span>by {ann.createdBy.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleTogglePin(ann)}
                        title={ann.isPinned ? "Unpin" : "Pin to top"}
                        className={`p-2 rounded-lg border transition-colors text-sm ${
                          ann.isPinned
                            ? "bg-[#c47a5a]/10 border-[#c47a5a]/20 text-[#c47a5a]"
                            : "border-gray-200 text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        <FiBookmark size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(ann)}
                        title={ann.isActive ? "Hide" : "Show"}
                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        {ann.isActive ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => openEdit(ann)}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(ann._id)}
                        disabled={deletingId === ann._id}
                        className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
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
            Page {pagination.page} of {pagination.pages} &bull; {pagination.total} announcements
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Happy Hour Today! 50% Off All Drinks"
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c47a5a]/20 focus:border-[#c47a5a] text-sm"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">{form.title.length}/100</p>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Describe the announcement in detail..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c47a5a]/20 focus:border-[#c47a5a] resize-none text-sm"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">{form.body.length}/1000</p>
              </div>

              {/* Type + Expires Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AnnouncementType }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c47a5a]/20 focus:border-[#c47a5a] text-sm bg-white"
                  >
                    <option value="notice">Notice</option>
                    <option value="offer">Offer</option>
                    <option value="event">Event</option>
                    <option value="closure">Closure</option>
                    <option value="update">Update</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#c47a5a]/20 focus:border-[#c47a5a] text-sm"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      form.isActive ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form.isActive ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <FiCheckCircle size={13} className={form.isActive ? "text-green-500" : "text-gray-400"} />
                    Active
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setForm((f) => ({ ...f, isPinned: !f.isPinned }))}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      form.isPinned ? "bg-[#c47a5a]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form.isPinned ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <FiBookmark size={13} className={form.isPinned ? "text-[#c47a5a]" : "text-gray-400"} />
                    Pinned
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#c47a5a] text-white rounded-xl text-sm font-semibold hover:bg-[#b56a4a] disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Announcement"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
