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
  BellRing,
  Globe,
  School,
  Star,
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Clock,
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
          className="w-full pl-12 pr-10 py-3.5 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-[#002147] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#002147]/5 focus:border-[#002147]/30 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-sm"
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
        <div className="flex items-center gap-1 p-1 bg-gray-100/50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateFilter === f.key
                ? "bg-[#002147] text-white shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/70"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        {/* <span className="text-gray-200 font-light hidden sm:block">|</span> */}

        {/* Role filter pills */}
        <div className="flex items-center gap-1 p-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/60 dark:border-slate-700 shadow-sm">
          {/* <span className="pl-2 pr-1">
            <SlidersHorizontal className="w-3 h-3 text-gray-400" />
          </span> */}
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${roleFilter === f.key
                ? "bg-[#002147] text-white shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/70"
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
          className="text-center py-14 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl border border-white/40 dark:border-slate-700/40 shadow-sm"
        >
          <Megaphone className="w-12 h-12 text-gray-200 dark:text-slate-700 mx-auto mb-4" />
          {hasActiveFilters || searchQuery ? (
            <>
              <p className="text-gray-600 dark:text-slate-300 font-bold mb-1">No results found</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mb-4">
                Try adjusting your search or filter.
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-bold text-[#002147] dark:text-white bg-[#002147]/5 dark:bg-white/5 hover:bg-[#002147]/10 dark:hover:bg-white/10 rounded-xl transition-all"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-slate-300 font-bold mb-1">
                No announcements yet
              </p>
              <p className="text-gray-400 dark:text-slate-500 text-sm">
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
                className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border transition-all duration-300 group ${isExpired
                  ? "opacity-60 border-gray-100 dark:border-slate-800"
                  : ann.isPinned
                    ? "border-amber-200 dark:border-amber-900/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5"
                    : "border-white/40 dark:border-slate-700/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5"
                  }`}
              >
                {/* Subtle indicator for pinned */}
                {ann.isPinned && !isExpired && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 rounded-l-3xl" />
                )}
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
                    className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${ann.createdByRole === "admin"
                      ? "bg-[#002147]/10 dark:bg-blue-900/30 text-[#002147] dark:text-blue-400 border border-[#002147]/5 dark:border-blue-800/30"
                      : "bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-slate-300 border border-blue-100 dark:border-slate-600"
                      }`}
                  >
                    {ann.createdByRole === "admin" ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <School className="w-3 h-3" />
                    )}
                    {ann.createdByRole === "admin" ? "SMAART" : "College"}
                  </span>
                  {/* {ann.targetType === "all" && (
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full">
                      🎓 All Students
                    </span>
                  )}
                  {ann.targetType === "college" &&
                    ann.targetCollegeIds?.length > 0 && (
                      <span className="px-3 py-1.5 bg-blue-50/50 text-blue-700 text-[10px] font-black rounded-xl border border-blue-100 uppercase tracking-widest">
                        🏫 {ann.targetCollegeIds.map((c) => c.collegeName || "College").join(", ")}
                      </span>
                    )} */}
                </div>

                {/* ── Title ─────────────────────────────────────────────── */}
                <h3 className="text-[#002147] dark:text-white text-lg font-extrabold mb-2 tracking-tight">
                  {ann.title}
                </h3>

                {/* ── Description ───────────────────────────────────────── */}
                <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed font-medium whitespace-pre-line mb-6">
                  {ann.description}
                </p>

                {/* ── Attachment link/preview ───────────────────────────────────── */}
                {ann.attachmentUrl && (
                  <div className="flex mb-6">
                    {ann.attachmentType === 'video' || ann.attachmentUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 w-full max-w-2xl bg-black">
                        <video 
                          src={ann.attachmentUrl} 
                          controls
                          className="w-full h-auto max-h-[400px]" 
                        />
                      </div>
                    ) : ann.attachmentType === 'image' || ann.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700 w-full max-w-2xl bg-gray-50 dark:bg-slate-800">
                        <img 
                          src={ann.attachmentUrl} 
                          alt="Announcement Attachment" 
                          className="w-full h-auto object-cover max-h-[400px]" 
                        />
                      </div>
                    ) : (
                      <a
                        href={ann.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/btn inline-flex items-center gap-3 px-5 py-2.5 bg-gray-50 dark:bg-slate-700 hover:bg-[#002147] dark:hover:bg-blue-600 text-[#002147] dark:text-white hover:text-white text-xs font-black rounded-2xl transition-all duration-300 border border-gray-100 dark:border-slate-600 hover:border-[#002147] dark:hover:border-blue-600 shadow-sm hover:shadow-lg hover:shadow-blue-900/10"
                      >
                        {ann.attachmentType === 'pdf' ? <FileText className="w-4 h-4" /> :
                          <LinkIcon className="w-4 h-4" />}
                        View Attachment
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
                      </a>
                    )}
                  </div>
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
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 border border-transparent hover:bg-gray-200 dark:hover:bg-slate-600"
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
                        if (hasReacted) return null;

                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePicker(activePicker === ann._id ? null : ann._id);
                            }}
                            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-gray-100 dark:hover:bg-slate-700 ${activePicker === ann._id ? "bg-gray-100 dark:bg-slate-700 scale-110" : ""
                              }`}
                            title="React"
                          >
                            <Heart className="w-5 h-5 cursor-pointer text-black dark:text-white hover:text-red-500" />
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
                            className="absolute bottom-full left-0 mb-3 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-slate-700 flex items-center gap-1 z-20"
                          >
                            {["👍", "❤️", "🔥", "😂", "🙌"].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReact(ann._id, emoji);
                                  setActivePicker(null);
                                }}
                                className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 rounded-full transition-colors text-xl hover:scale-125 duration-200"
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
                    <div className="w-6 h-6 rounded-full bg-[#002147]/10 dark:bg-blue-900/20 flex items-center justify-center text-[10px] font-bold text-[#002147] dark:text-blue-300 flex-shrink-0">
                      {(ann.createdById?.fullName || "A")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <span className="text-gray-500 dark:text-slate-300 font-semibold">
                      {ann.createdById?.fullName || "Admin"}
                    </span>
                    <span className="text-gray-300 dark:text-slate-700">•</span>
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
