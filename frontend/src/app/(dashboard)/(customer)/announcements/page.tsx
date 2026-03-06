"use client";

import { useState, useEffect } from "react";
import API from "@/lib/api";
import { Announcement } from "@/types";
import {
  FiBell,
  FiTag,
  FiAlertCircle,
  FiCalendar,
  FiBookmark,
  FiInbox,
} from "react-icons/fi";

const TYPE_CONFIG: Record<
  Announcement["type"],
  { label: string; textColor: string; bgColor: string; borderColor: string; barColor: string }
> = {
  offer:   { label: "Offer",   textColor: "text-green-700",  bgColor: "bg-green-50",  borderColor: "border-green-200", barColor: "bg-green-500"  },
  event:   { label: "Event",   textColor: "text-blue-700",   bgColor: "bg-blue-50",   borderColor: "border-blue-200",  barColor: "bg-blue-500"   },
  notice:  { label: "Notice",  textColor: "text-amber-700",  bgColor: "bg-amber-50",  borderColor: "border-amber-200", barColor: "bg-amber-500"  },
  closure: { label: "Closure", textColor: "text-red-700",    bgColor: "bg-red-50",    borderColor: "border-red-200",   barColor: "bg-red-500"    },
  update:  { label: "Update",  textColor: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200",barColor: "bg-purple-500" },
};

export default function CustomerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | Announcement["type"]>("all");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get("/announcements");
        setAnnouncements(res.data.announcements || []);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered =
    activeFilter === "all"
      ? announcements
      : announcements.filter((a) => a.type === activeFilter);

  const typeCounts = announcements.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  const filters: { key: "all" | Announcement["type"]; label: string }[] = [
    { key: "all", label: "All" },
    { key: "offer", label: "Offers" },
    { key: "event", label: "Events" },
    { key: "notice", label: "Notices" },
    { key: "closure", label: "Closures" },
    { key: "update", label: "Updates" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
        <p className="mt-1 text-sm text-gray-500">
          Stay up to date with the latest news and offers from us
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((f) => {
          const count = f.key === "all" ? announcements.length : (typeCounts[f.key] || 0);
          if (f.key !== "all" && count === 0) return null;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === f.key
                  ? "bg-[#c47a5a] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#c47a5a] hover:text-[#c47a5a]"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs ${activeFilter === f.key ? "opacity-80" : "text-gray-400"}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white p-6 shadow-sm animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-16 shadow-sm text-center">
          <FiInbox className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <h3 className="text-base font-semibold text-gray-700">No Announcements</h3>
          <p className="mt-1 text-sm text-gray-400">
            {activeFilter === "all"
              ? "There are no announcements at the moment. Check back later!"
              : `No ${activeFilter} announcements right now.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ann) => {
            const cfg = TYPE_CONFIG[ann.type];
            const isExpiringSoon =
              ann.expiresAt &&
              new Date(ann.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;
            return (
              <div
                key={ann._id}
                className={`rounded-xl bg-white shadow-sm overflow-hidden border border-gray-100 ${
                  ann.isPinned ? "ring-1 ring-[#c47a5a]/30" : ""
                }`}
              >
                {/* Colored top bar */}
                <div className={`h-1 w-full ${cfg.barColor}`} />

                <div className="p-5">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {ann.isPinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#c47a5a]/10 px-2.5 py-0.5 text-xs font-semibold text-[#c47a5a]">
                        <FiBookmark size={10} />
                        Pinned
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor}`}
                    >
                      <FiTag size={9} />
                      {cfg.label}
                    </span>
                    {isExpiringSoon && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                        <FiAlertCircle size={9} />
                        Ending Soon
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-bold text-gray-800 mb-1">{ann.title}</h2>

                  {/* Body */}
                  <p className="text-sm text-gray-600 leading-relaxed">{ann.body}</p>

                  {/* Footer meta */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiBell size={10} />
                      {new Date(ann.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {ann.expiresAt && (
                      <span className={`flex items-center gap-1 ${isExpiringSoon ? "text-orange-500 font-medium" : ""}`}>
                        <FiCalendar size={10} />
                        Valid until{" "}
                        {new Date(ann.expiresAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
