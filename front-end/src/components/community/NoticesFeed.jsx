import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Pin,
  Loader2,
  Calendar,
  Link as LinkIcon,
  Search,
  X,
  SlidersHorizontal,
  Heart,
} from "lucide-react";
import { announcementsAPI } from "@/services/announcementsApi";

// ── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// ── Filter config ─────────────────────────────────────────────────────────────
const DATE_FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
];

const ROLE_FILTERS = [
  { key: "all", label: "All" },
  { key: "admin", label: "🌐 SMAART Admin" },
  { key: "college_admin", label: "🏫 College Admin" },
];

// ── Component ─────────────────────────────────────────────────────────────────
const NoticesFeed = ({ currentUser }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePicker, setActivePicker] = useState(null); // Track which announcement's picker is open

  // ── Fetch from backend (only re-runs when dateFilter changes) ──────────────
  const fetchAnnouncements = async (dFilter) => {
    setLoading(true);
    try {
      const params = dFilter !== "all" ? { dateFilter: dFilter } : {};
      const res = await announcementsAPI.getAnnouncements(params);
      if (res.success) {
        // Pinned first, then newest
        const sorted = [...res.data].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setAnnouncements(sorted);
      }
    } catch (err) {
      console.error("[NoticesFeed] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(dateFilter);
  }, [dateFilter]);

  const handleReact = async (id, emoji) => {
    try {
      const res = await announcementsAPI.react(id, emoji);
      if (res.success) {
        setAnnouncements((prev) =>
          prev.map((ann) =>
            ann._id === id
              ? {
                ...ann,
                reactions: res.data.reactions,
              }
              : ann
          )
        );
      }
    } catch (err) {
      console.error("[NoticesFeed] React error:", err);
    }
  };

  // ── Client-side filtering: search + role (in-memory, no extra API call) ────
  const visible = useMemo(() => {
    let list = announcements;

    // Role filter
    if (roleFilter !== "all") {
      list = list.filter((a) => a.createdByRole === roleFilter);
    }

    // Search: match title or description (case-insensitive)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [announcements, roleFilter, searchQuery]);

  const hasActiveFilters = roleFilter !== "all" || searchQuery.trim() !== "";

  const clearFilters = () => {
    setRoleFilter("all");
    setSearchQuery("");
  };

  useEffect(() => {
    const handleGlobalClick = () => setActivePicker(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search announcements…"
          className="w-full pl-11 pr-10 py-3 bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl text-sm font-medium text-[#002147] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147]/30 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Filter row: Date + Role + Clear ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Date filter pills */}
        <div className="flex items-center gap-1 p-1 bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateFilter === f.key
                ? "bg-[#002147] text-white shadow-sm"
                : "text-gray-500 hover:text-[#002147] hover:bg-white/70"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        {/* <span className="text-gray-200 font-light hidden sm:block">|</span> */}

        {/* Role filter pills */}
        <div className="flex items-center gap-1 p-1 bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
          {/* <span className="pl-2 pr-1">
            <SlidersHorizontal className="w-3 h-3 text-gray-400" />
          </span> */}
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${roleFilter === f.key
                ? "bg-[#002147] text-white shadow-sm"
                : "text-gray-500 hover:text-[#002147] hover:bg-white/70"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Clear all filters */}
        {/* {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )} */}

        {/* Result count */}
        {/* {!loading && (
          <span className="ml-auto text-[11px] text-gray-400 font-semibold">
            {visible.length} {visible.length === 1 ? "notice" : "notices"}
          </span>
        )} */}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="w-8 h-8 text-[#002147] animate-spin" />
        </div>
      )}

      {/* ── Empty states ────────────────────────────────────────────────── */}
      {!loading && visible.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-14 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/40 shadow-sm"
        >
          <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          {hasActiveFilters || searchQuery ? (
            <>
              <p className="text-gray-600 font-bold mb-1">No results found</p>
              <p className="text-gray-400 text-sm mb-4">
                Try adjusting your search or filter.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-bold text-[#002147] bg-[#002147]/5 hover:bg-[#002147]/10 rounded-xl transition-all"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 font-bold mb-1">
                No announcements yet
              </p>
              <p className="text-gray-400 text-sm">
                Check back later for updates from your institution.
              </p>
            </>
          )}
        </motion.div>
      )}

      {/* ── Announcement cards ───────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {!loading &&
          visible.map((ann, index) => {
            const isExpired =
              ann.expiryDate && new Date(ann.expiryDate) < new Date();

            return (
              <motion.div
                key={ann._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
                className={`bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border transition-all duration-300 group ${isExpired
                  ? "opacity-60 border-gray-100"
                  : ann.isPinned
                    ? "border-amber-200 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5"
                    : "border-white/40 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5"
                  }`}
              >
                {/* ── Badge row ─────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {ann.isPinned && !isExpired && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      <Pin className="w-2.5 h-2.5" /> Pinned
                    </span>
                  )}
                  {isExpired && (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Expired
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${ann.createdByRole === "admin"
                      ? "bg-[#002147]/10 text-[#002147]"
                      : "bg-blue-50 text-blue-700"
                      }`}
                  >
                    {ann.createdByRole === "admin"
                      ? "🌐 SMAART Admin"
                      : "🏫 College Admin"}
                  </span>
                  {/* {ann.targetType === "all" && (
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full">
                      🎓 All Students
                    </span>
                  )}
                  {ann.targetType === "college" &&
                    ann.targetCollegeIds?.length > 0 && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full">
                        🏫 {ann.targetCollegeIds.map((c) => c.name || "College").join(", ")}
                      </span>
                    )} */}
                </div>

                {/* ── Title ─────────────────────────────────────────────── */}
                <h3 className="text-[#002147] text-base font-bold mb-2 group-hover:text-[#003580] transition-colors">
                  {ann.title}
                </h3>

                {/* ── Description ───────────────────────────────────────── */}
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-4">
                  {ann.description}
                </p>

                {/* ── Attachment link ───────────────────────────────────── */}
                {ann.attachmentUrl && (
                  <a
                    href={ann.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#002147]/5 hover:bg-[#002147]/10 text-[#002147] text-xs font-bold rounded-xl transition-all mb-4"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    View Attachment
                  </a>
                )}



                {/* ── Footer: creator + time + expiry ───────────────────── */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400 font-medium pt-3 border-t border-gray-100">
                  {/* ── Action Row: Reactions ──────────────────────────────── */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Reaction counts */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {["👍", "❤️", "🔥", "😂", "🙌"].map((emoji) => {
                        const count = ann.reactions?.filter(r => r.emoji === emoji).length || 0;
                        const hasReacted = ann.reactions?.some(r => r.userId?.toString() === currentUser?._id?.toString() && r.emoji === emoji);

                        if (count === 0 && !hasReacted) return null;

                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReact(ann._id, emoji)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all ${hasReacted
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200"
                              }`}
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* React Button with Picker Popover */}
                    <div className="relative">
                      {(() => {
                        const hasReacted = ann.reactions?.some(r => r.userId?.toString() === currentUser?._id?.toString());
                        const userReaction = ann.reactions?.find(r => r.userId?.toString() === currentUser?._id?.toString());
                        
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePicker(activePicker === ann._id ? null : ann._id);
                            }}
                            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-gray-100 ${
                              activePicker === ann._id ? "bg-gray-100 scale-110" : ""
                            }`}
                            title="React"
                          >
                            {hasReacted ? (
                              <span className="text-xl filter drop-shadow-sm">
                                {userReaction.emoji}
                              </span>
                            ) : (
                              <Heart className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        );
                      })()}

                      {/* Click-based picker */}
                      <AnimatePresence>
                        {activePicker === ann._id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-3 p-1.5 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center gap-1 z-20"
                          >
                            {["👍", "❤️", "🔥", "😂", "🙌"].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReact(ann._id, emoji);
                                  setActivePicker(null);
                                }}
                                className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors text-xl hover:scale-125 duration-200"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#002147]/10 flex items-center justify-center text-[10px] font-bold text-[#002147] flex-shrink-0">
                      {(ann.createdById?.fullName || "A")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <span className="text-gray-500 font-semibold">
                      {ann.createdById?.fullName || "Admin"}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>{timeAgo(ann.createdAt)}</span>
                    {ann.expiryDate && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span
                          className={`flex items-center gap-1 ${isExpired ? "text-gray-400" : "text-orange-500"
                            }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {isExpired ? "Expired" : "Expires"}{" "}
                          {new Date(ann.expiryDate).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
};

export default NoticesFeed;
