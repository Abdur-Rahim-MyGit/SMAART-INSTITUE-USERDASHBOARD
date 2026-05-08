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
  { key: "all",   label: "All Time" },
  { key: "today", label: "Today"    },
  { key: "week",  label: "This Week"},
];

const ROLE_FILTERS = [
  { key: "all",          label: "All"           },
  { key: "admin",        label: "🌐 SMAART" },
  { key: "college_admin",label: "🏫 College"},
];

// ── Component ─────────────────────────────────────────────────────────────────
const NoticesFeed = ({ currentUser }) => {
  const [announcements, setAnnouncements]   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [dateFilter, setDateFilter]         = useState("all");
  const [roleFilter, setRoleFilter]         = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");

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
          className="w-full pl-12 pr-10 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-semibold text-[#002147] placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#002147]/5 focus:border-[#002147]/30 focus:bg-white transition-all shadow-sm"
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
      <div className="flex flex-wrap items-center gap-3">
        {/* Date filter pills */}
        <div className="flex items-center gap-1 p-1 bg-gray-100/50 rounded-xl border border-gray-200 shadow-sm">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                dateFilter === f.key
                  ? "bg-white text-[#002147] shadow-sm"
                  : "text-gray-500 hover:text-[#002147]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <span className="text-gray-200 font-light hidden sm:block">|</span>

        {/* Role filter pills */}
        <div className="flex items-center gap-1 p-1 bg-gray-100/50 rounded-xl border border-gray-200 shadow-sm">
          <span className="pl-2 pr-1">
            <SlidersHorizontal className="w-3 h-3 text-gray-400" />
          </span>
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                roleFilter === f.key
                  ? "bg-white text-[#002147] shadow-sm"
                  : "text-gray-500 hover:text-[#002147]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Clear all filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}

        {/* Result count */}
        {!loading && (
          <span className="ml-auto text-[11px] text-gray-400 font-semibold">
            {visible.length} {visible.length === 1 ? "notice" : "notices"}
          </span>
        )}
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
                className={`bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 transition-all duration-300 group relative ${
                  isExpired
                    ? "opacity-60 grayscale border-gray-100"
                    : ann.isPinned
                    ? "border-amber-100 hover:border-amber-200 hover:shadow-md"
                    : "border-gray-50 hover:border-gray-100 hover:shadow-md"
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
                    className={`px-3 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-1.5 ${
                      ann.createdByRole === "admin"
                        ? "bg-[#002147]/5 text-[#002147] border border-[#002147]/5"
                        : "bg-blue-50 text-blue-700 border border-blue-100"
                    }`}
                  >
                    {ann.createdByRole === "admin" ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <School className="w-3 h-3" />
                    )}
                    {ann.createdByRole === "admin" ? "SMAART" : "College"}
                  </span>

                  {/* New Badge */}
                  {new Date(ann.createdAt) > new Date(Date.now() - 48 * 60 * 60 * 1000) && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-green-500/20">
                      New
                    </span>
                  )}

                  {ann.targetType === "all" && (
                    <span className="px-3 py-1.5 bg-indigo-50/50 text-indigo-700 text-[10px] font-black rounded-xl border border-indigo-100 uppercase tracking-widest">
                      🎓 Everyone
                    </span>
                  )}
                  {ann.targetType === "college" &&
                    ann.targetCollegeIds?.length > 0 && (
                      <span className="px-3 py-1.5 bg-blue-50/50 text-blue-700 text-[10px] font-black rounded-xl border border-blue-100 uppercase tracking-widest">
                        🏫 {ann.targetCollegeIds.map((c) => c.collegeName || "College").join(", ")}
                      </span>
                    )}
                </div>

                {/* ── Title ─────────────────────────────────────────────── */}
                <h3 className="text-[#002147] text-lg font-extrabold mb-2 tracking-tight">
                  {ann.title}
                </h3>

                {/* ── Description ───────────────────────────────────────── */}
                <p className="text-gray-600 text-sm leading-relaxed font-medium whitespace-pre-line mb-6">
                  {ann.description}
                </p>

                {/* ── Attachment link ───────────────────────────────────── */}
                {ann.attachmentUrl && (
                  <div className="flex mb-6">
                    <a
                      href={ann.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn inline-flex items-center gap-3 px-5 py-2.5 bg-gray-50 hover:bg-[#002147] text-[#002147] hover:text-white text-xs font-black rounded-2xl transition-all duration-300 border border-gray-100 hover:border-[#002147] shadow-sm hover:shadow-lg hover:shadow-blue-900/10"
                    >
                      {ann.attachmentType === 'pdf' ? <FileText className="w-4 h-4" /> : 
                       ann.attachmentType === 'image' ? <ImageIcon className="w-4 h-4" /> : 
                       <LinkIcon className="w-4 h-4" />}
                      View Attachment
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
                    </a>
                  </div>
                )}

                {/* ── Footer: creator + time + expiry ───────────────────── */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#002147] to-[#1a3a5f] flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-blue-900/10">
                      {(ann.createdById?.fullName || "SMAART")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-[#002147] uppercase tracking-wider">
                        {ann.createdById?.fullName || "SMAART"}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(ann.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {ann.expiryDate && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${
                      isExpired ? "bg-gray-50 border-gray-100 text-gray-400" : "bg-orange-50 border-orange-100 text-orange-600"
                    }`}>
                      <Calendar className="w-3 h-3" />
                      {isExpired ? "Ended" : "Valid Until"}: {new Date(ann.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
};

export default NoticesFeed;
