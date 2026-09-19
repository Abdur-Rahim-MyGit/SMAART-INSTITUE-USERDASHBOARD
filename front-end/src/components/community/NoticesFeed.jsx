import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Megaphone,
  Pin,
  Loader2,
  Calendar,
  LinkIcon,
  Search,
  X,
  Globe,
  GraduationCap,
  ExternalLink,
  FileText,
  Sticker,
} from "@/components/icons";
import { announcementsAPI } from "@/services/announcementsApi";

// Same tokens as the rest of the dashboard pages.
const SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const PANEL =
  "bg-[#F1F5F9] dark:bg-[#072036]/60 border border-[#d7ebf5] dark:border-white/10";
const FIELD =
  "w-full rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] px-4 text-sm font-medium text-[#072036] outline-none transition-colors placeholder:text-slate-400 focus:border-[#045C9A] focus:bg-white focus:ring-2 focus:ring-[#045C9A]/20 dark:border-white/10 dark:bg-[#072036]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#072036]";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] text-xs font-bold text-slate-600 transition-colors hover:border-[#045C9A]/30 hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";
const EASE = [0.25, 0.1, 0.25, 1];

const REACTIONS = ["👍", "❤️", "🔥", "💡", "🙌", "😄"];

const ChipGroup = ({ id, options, value, onChange }) => (
  <div id={id} className={`flex h-10 max-w-full items-center gap-1 overflow-x-auto rounded-xl p-1 ${PANEL}`}>
    {options.map(({ key, label, Icon }) => {
      const active = value === key;
      return (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={active}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors ${
            active
              ? "bg-white text-[#045C9A] shadow-sm dark:bg-[#045C9A]/40 dark:text-white"
              : "text-[#35566b] hover:text-[#045C9A] dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </button>
      );
    })}
  </div>
);

const NoticesFeed = ({ currentUser, refreshTrigger, onLoadingChange }) => {
  const { t } = useTranslation();

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return t("community_page.just_now");
    if (diffMins < 60) return `${diffMins} ${t("community_page.m_ago")}`;
    if (diffHours < 24) return `${diffHours} ${t("community_page.h_ago")}`;
    if (diffDays < 7) return `${diffDays} ${t("community_page.d_ago", "d ago")}`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const DATE_FILTERS = [
    { key: "all", label: t("community_page.filter_all") },
    { key: "today", label: t("community_page.filter_today") },
    { key: "week", label: t("community_page.filter_week") },
  ];

  const ROLE_FILTERS = [
    { key: "all", label: t("community_page.filter_all") },
    { key: "admin", label: t("community_page.filter_smaart_admin"), Icon: Globe },
    { key: "college_admin", label: t("community_page.filter_college_admin"), Icon: GraduationCap },
  ];

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePicker, setActivePicker] = useState(null);

  const fetchAnnouncements = async (dFilter) => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      const params = dFilter !== "all" ? { dateFilter: dFilter } : {};
      const res = await announcementsAPI.getAnnouncements(params);
      if (res.success) {
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
      onLoadingChange?.(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(dateFilter);
  }, [dateFilter, refreshTrigger]);

  const handleReact = async (id, emoji) => {
    try {
      const res = await announcementsAPI.react(id, emoji);
      if (res.success) {
        setAnnouncements((prev) => prev.map((ann) => (ann._id === id ? { ...ann, reactions: res.data.reactions } : ann)));
      }
    } catch (err) {
      console.error("[NoticesFeed] React error:", err);
    }
  };

  const visible = useMemo(() => {
    let list = announcements;
    if (roleFilter !== "all") list = list.filter((a) => a.createdByRole === roleFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((a) => a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q));
    return list;
  }, [announcements, roleFilter, searchQuery]);

  const hasActiveFilters = roleFilter !== "all" || searchQuery.trim() !== "";

  const clearFilters = () => {
    setRoleFilter("all");
    setSearchQuery("");
  };

  useEffect(() => {
    const close = () => setActivePicker(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const userId = currentUser?._id?.toString() || currentUser?.id?.toString();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
        className={`flex flex-col gap-3 rounded-2xl p-3 xl:flex-row xl:items-center ${SURFACE}`}
      >
        <div className="relative min-w-0 flex-1 xl:min-w-[240px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="notice-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("community_page.search_placeholder")}
            className={`${FIELD} h-10 pl-10 pr-10`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={t("community_page.clear_search", "Clear search")}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChipGroup id="notice-date" options={DATE_FILTERS} value={dateFilter} onChange={setDateFilter} />
          <ChipGroup id="notice-role" options={ROLE_FILTERS} value={roleFilter} onChange={setRoleFilter} />
        </div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-9 w-9 animate-spin text-[#045C9A] dark:text-[#A6D7E8]" />
        </div>
      )}

      {/* Empty */}
      {!loading && visible.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center ${SURFACE}`}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#045C9A]/10 dark:bg-[#045C9A]/25">
            <Megaphone className="h-7 w-7 text-[#045C9A] dark:text-[#A6D7E8]" />
          </div>
          <h3 className="text-lg font-extrabold tracking-tight text-[#072036] dark:text-white">
            {hasActiveFilters ? t("community_page.no_results") : t("community_page.no_announcements")}
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-[#35566b] dark:text-slate-400">
            {hasActiveFilters ? t("community_page.no_results_desc") : t("community_page.no_announcements_desc")}
          </p>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className={`${BTN_GHOST} mt-5 h-9 px-4`}>
              {t("community_page.clear_filters")}
            </button>
          )}
        </motion.div>
      )}

      {/* Cards */}
      <AnimatePresence mode="popLayout">
        {!loading &&
          visible.map((ann, index) => {
            const isExpired = ann.expiryDate && new Date(ann.expiryDate) < new Date();
            const isSmaart = ann.createdByRole === "admin";
            const reacted = ann.reactions?.some((r) => r.userId?.toString() === userId);
            const attachment = ann.attachmentUrl
              ? ann.attachmentType === "video" || /\.(mp4|webm|ogg)$/i.test(ann.attachmentUrl)
                ? "video"
                : ann.attachmentType === "image" || /\.(jpeg|jpg|gif|png|webp)$/i.test(ann.attachmentUrl)
                  ? "image"
                  : "link"
              : null;

            return (
              <motion.article
                key={ann._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: Math.min(index, 6) * 0.04, duration: 0.3, ease: EASE }}
                className={`relative overflow-hidden rounded-2xl transition-shadow hover:shadow-md ${SURFACE} ${isExpired ? "opacity-60" : ""}`}
              >
                {ann.isPinned && !isExpired && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-[#045C9A] dark:bg-[#A6D7E8]" aria-hidden="true" />
                )}

                <div className="p-5 sm:p-6">
                  {/* Badge row */}
                  <div className="mb-3 flex flex-wrap items-center gap-1.5">
                    {ann.isPinned && !isExpired && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#045C9A]/10 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
                        <Pin className="h-3 w-3" />
                        {t("community_page.pinned")}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider ${
                        isSmaart
                          ? "bg-[#072036] text-white dark:bg-[#A6D7E8] dark:text-[#072036]"
                          : "bg-[#F1F5F9] text-[#35566b] dark:bg-white/[0.06] dark:text-slate-300"
                      }`}
                    >
                      {isSmaart ? <Globe className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                      {isSmaart ? t("community_page.smaart") : t("community_page.college")}
                    </span>
                    {isExpired && (
                      <span className="inline-flex items-center rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 dark:bg-white/[0.06] dark:text-slate-500">
                        {t("community_page.expired")}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {timeAgo(ann.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-[16px] font-extrabold tracking-tight text-[#072036] dark:text-white sm:text-[17px]">
                    {ann.title}
                  </h3>
                  <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-[#35566b] dark:text-slate-400 sm:text-sm">
                    {ann.description}
                  </p>

                  {/* Attachment */}
                  {attachment === "video" && (
                    <div className="mt-4 w-full max-w-2xl overflow-hidden rounded-xl border border-[#d7ebf5] bg-[#072036] dark:border-white/10">
                      <video src={ann.attachmentUrl} controls className="h-auto max-h-[400px] w-full" />
                    </div>
                  )}
                  {attachment === "image" && (
                    <div className="mt-4 w-full max-w-2xl overflow-hidden rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] dark:border-white/10 dark:bg-[#072036]/60">
                      <img src={ann.attachmentUrl} alt="" className="h-auto max-h-[400px] w-full object-cover" />
                    </div>
                  )}
                  {attachment === "link" && (
                    <a href={ann.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`${BTN_GHOST} mt-4 h-9 px-4`}>
                      {ann.attachmentType === "pdf" ? <FileText className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                      {t("community_page.view_attachment")}
                      <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                    </a>
                  )}

                  {/* Footer: reactions + meta */}
                  <div className="mt-4 flex flex-col gap-3 border-t border-[#d7ebf5] pt-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {REACTIONS.map((emoji) => {
                        const count = ann.reactions?.filter((r) => r.emoji === emoji).length || 0;
                        const mine = ann.reactions?.some((r) => r.userId?.toString() === userId && r.emoji === emoji);
                        if (count === 0 && !mine) return null;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReact(ann._id, emoji)}
                            aria-pressed={mine}
                            className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs font-bold tabular-nums transition-colors ${
                              mine
                                ? "border-[#045C9A]/30 bg-[#EAF7FD] text-[#045C9A] dark:border-[#A6D7E8]/30 dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]"
                                : "border-[#d7ebf5] bg-[#F1F5F9] text-[#35566b] hover:border-[#045C9A]/30 hover:bg-[#EAF7FD] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10"
                            }`}
                          >
                            <span aria-hidden="true">{emoji}</span>
                            {count}
                          </button>
                        );
                      })}

                      {!reacted && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePicker(activePicker === ann._id ? null : ann._id);
                            }}
                            aria-label={t("community_page.react", "React")}
                            aria-expanded={activePicker === ann._id}
                            className={`inline-flex h-7 items-center gap-1 rounded-full border border-dashed px-2.5 text-xs font-bold transition-colors ${
                              activePicker === ann._id
                                ? "border-[#045C9A] bg-[#EAF7FD] text-[#045C9A] dark:border-[#A6D7E8] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]"
                                : "border-[#d7ebf5] text-[#35566b] hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:border-white/15 dark:text-slate-400 dark:hover:text-white"
                            }`}
                          >
                            <Sticker className="h-4 w-4" />
                            {t("community_page.react", "React")}
                          </button>

                          <AnimatePresence>
                            {activePicker === ann._id && (
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                transition={{ duration: 0.18, ease: EASE }}
                                role="menu"
                                className="absolute bottom-full left-0 z-20 mb-2 flex items-center gap-0.5 rounded-full border border-[#d7ebf5] bg-white p-1 shadow-xl dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]"
                              >
                                {REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    role="menuitem"
                                    aria-label={emoji}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReact(ann._id, emoji);
                                      setActivePicker(null);
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-[#EAF7FD] dark:hover:bg-white/10"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {!isSmaart && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#045C9A]/10 text-[9px] font-extrabold text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
                            {(ann.createdById?.fullName || "C").charAt(0).toUpperCase()}
                          </span>
                          <span className="text-[#35566b] dark:text-slate-300">{ann.createdById?.fullName || t("community_page.college")}</span>
                        </span>
                      )}
                      {ann.expiryDate && (
                        <span className={`inline-flex items-center gap-1 ${isExpired ? "" : "text-amber-600 dark:text-amber-300"}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          {isExpired ? t("community_page.expired") : t("community_page.expires")}{" "}
                          {new Date(ann.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
      </AnimatePresence>
    </div>
  );
};

export default NoticesFeed;
