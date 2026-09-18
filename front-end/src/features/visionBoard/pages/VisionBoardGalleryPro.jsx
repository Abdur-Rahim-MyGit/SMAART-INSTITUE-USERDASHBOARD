import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiCall as globalApiCall } from "@/services/api";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
import {
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Images,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Download,
  X,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Edit,
  Edit2,
  Share,
  LinkIcon,
  Target,
  Sparkles,
} from "@/components/icons";
import {
  getAllVisionBoards,
  deleteVisionBoard,
  duplicateVisionBoard,
  setActiveVision,
  clearActiveVision,
  getActiveVision,
  resetUserIdCache,
  renameVisionBoard,
} from "../services/visionBoardProApi";
import { moderateText } from "../utils/contentModeration";
import { goalProgress } from "../utils/goals";
import { STARTER_BOARDS, buildCareerSuggestion } from "../templates/starterBoards";
import ShareBoardModal from "../components/modals/ShareBoardModal";

// Same tokens as CourseStructure / AssessmentsDashboard so the gallery reads
// as one product with the rest of the dashboard.
const SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const MODAL_SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-[#045C9A]/30 shadow-2xl";
const PANEL =
  "bg-[#F1F5F9] dark:bg-[#072036]/60 border border-[#d7ebf5] dark:border-white/10";
const CHIP_BRAND =
  "bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#072036] text-xs font-bold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white";
const BTN_BRAND =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#045C9A] text-xs font-bold text-white transition-colors hover:bg-[#034a7d] disabled:cursor-not-allowed disabled:opacity-60";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] text-xs font-bold text-slate-600 transition-colors hover:border-[#045C9A]/30 hover:bg-[#EAF7FD] hover:text-[#045C9A] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";
const FIELD =
  "w-full rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] px-4 text-sm font-medium text-[#072036] outline-none transition-colors placeholder:text-slate-400 focus:border-[#045C9A] focus:bg-white focus:ring-2 focus:ring-[#045C9A]/20 dark:border-white/10 dark:bg-[#072036]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#072036]";
const LABEL = "font-bold uppercase tracking-wider text-[#35566b] dark:text-slate-400";
const MENU_ITEM =
  "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold text-[#16324a] transition-colors hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:text-slate-200 dark:hover:bg-white/[0.06] dark:hover:text-white";
const EASE = [0.25, 0.1, 0.25, 1];

const TITLE_CHAR_LIMIT = 50;
const DESCRIPTION_CHAR_LIMIT = 250;

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const GoalMeter = ({ progress, compact = false }) => {
  const { t } = useTranslation();
  if (!progress.total) return null;
  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-1.5"}>
      <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold text-[#35566b] dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Target className="h-3.5 w-3.5 text-[#045C9A] dark:text-[#A6D7E8]" />
          {t("vision_board.goals_done", { done: progress.done, total: progress.total, defaultValue: "{{done}} of {{total}} goals done" })}
        </span>
        {!compact && <span className="tabular-nums">{progress.pct}%</span>}
      </div>
      <div className={`h-1.5 overflow-hidden rounded-full bg-[#A6D7E8]/40 dark:bg-white/10 ${compact ? "w-16" : "w-full"}`}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${progress.pct}%`, background: "linear-gradient(90deg,#034a7d 0%,#045C9A 100%)" }}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// BOARD CARD
// ═══════════════════════════════════════════════════════════════════════════

const BoardCard = ({
  board,
  onDelete,
  onDuplicate,
  onEdit,
  onRename,
  onShare,
  onPreview,
  onSetAsActive,
  onDeactivate,
  isCurrentVision,
  viewMode = "grid",
}) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [isSettingActive, setIsSettingActive] = useState(false);
  const isList = viewMode === "list";
  const progress = goalProgress(board);

  const toggleActive = async (e) => {
    e.stopPropagation();
    setIsSettingActive(true);
    try {
      if (isCurrentVision) {
        await onDeactivate(board);
      } else {
        await onSetAsActive(board);
      }
    } finally {
      setIsSettingActive(false);
    }
  };

  const menuAction = (fn) => (e) => {
    e.stopPropagation();
    setShowMenu(false);
    fn(board);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={`group relative flex overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${SURFACE} ${
        isCurrentVision ? "ring-1 ring-[#045C9A]/40 dark:ring-[#A6D7E8]/30" : ""
      } ${isList ? "flex-col md:flex-row" : "flex-col"}`}
    >
      {/* Artwork */}
      <div
        className={`relative overflow-hidden bg-[#F1F5F9] dark:bg-[#072036]/60 ${
          isList ? "aspect-[4/3] md:aspect-auto md:min-h-[210px] md:w-[300px] md:shrink-0" : "aspect-[4/3]"
        }`}
      >
        {board.collageImage ? (
          <img
            src={board.collageImage}
            alt={board.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
            <Images className="h-12 w-12" />
          </div>
        )}

        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
          {isCurrentVision && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#045C9A] shadow-sm backdrop-blur dark:bg-[#072036]/90 dark:text-[#A6D7E8]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#045C9A] dark:bg-[#A6D7E8]" />
              {t("vision_board.active_vision")}
            </span>
          )}
          {board.isShared && (
            <span
              title={t("vision_board.shared_publicly", "Shared with a public link")}
              className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 shadow-sm backdrop-blur dark:bg-[#072036]/90 dark:text-emerald-300"
            >
              <LinkIcon className="h-3 w-3" />
              {t("vision_board.shared", "Shared")}
            </span>
          )}
        </div>

        {/* Hover actions (pointer devices) */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-2 bg-[#072036]/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
          <button
            type="button"
            onClick={() => onPreview(board)}
            className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-[#072036] shadow-lg transition-colors hover:bg-[#EAF7FD]"
          >
            <Eye className="h-4 w-4" />
            {t("vision_board.preview")}
          </button>
          <button
            type="button"
            onClick={() => onEdit(board)}
            className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-white/60 bg-white/15 px-4 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <Edit className="h-4 w-4" />
            {t("vision_board.edit")}
          </button>
        </div>

        {/* Overflow menu -- always reachable on touch, hover-revealed on desktop */}
        <div className="absolute right-3 top-3 z-20 opacity-100 transition-opacity duration-200 md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
          <div className="relative">
            <button
              type="button"
              aria-label={t("vision_board.more_actions", "More actions")}
              aria-expanded={showMenu}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((v) => !v);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#072036] shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-[#072036]/90 dark:text-white dark:hover:bg-[#072036]"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div role="menu" className={`absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl py-1 ${MODAL_SURFACE}`}>
                  <button type="button" role="menuitem" onClick={menuAction(onRename)} className={MENU_ITEM}>
                    <Edit2 className="h-4 w-4" /> {t("vision_board.rename", "Rename")}
                  </button>
                  <button type="button" role="menuitem" onClick={menuAction(onEdit)} className={MENU_ITEM}>
                    <Edit className="h-4 w-4" /> {t("vision_board.edit")}
                  </button>
                  <button type="button" role="menuitem" onClick={menuAction(onShare)} className={MENU_ITEM}>
                    <Share className="h-4 w-4" /> {t("vision_board.share", "Share")}
                  </button>
                  <button type="button" role="menuitem" onClick={menuAction(onDuplicate)} className={MENU_ITEM}>
                    <Copy className="h-4 w-4" /> {t("vision_board.duplicate")}
                  </button>
                  <div className="my-1 h-px bg-[#d7ebf5] dark:bg-white/10" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={menuAction(onDelete)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" /> {t("vision_board.delete")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider ${
              isCurrentVision ? CHIP_BRAND : "bg-[#F1F5F9] text-[#35566b] dark:bg-white/[0.06] dark:text-slate-400"
            }`}
          >
            {isCurrentVision ? t("vision_board.current_focus") : t("vision_board.stored_vision")}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{formatDate(board.createdAt)}</span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-extrabold tracking-tight text-[#072036] dark:text-white" title={board.title}>
            {board.title}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-[2.4rem] text-[12.5px] leading-relaxed text-[#35566b] dark:text-slate-400">
            {board.description || t("vision_board.default_board_desc")}
          </p>
        </div>

        {progress.total > 0 && <GoalMeter progress={progress} />}

        <div className="mt-auto flex gap-2 pt-1">
          <button type="button" onClick={() => onPreview(board)} className={`${BTN_GHOST} h-9 flex-1`}>
            <Eye className="h-4 w-4" />
            {t("vision_board.preview")}
          </button>
          <button
            type="button"
            onClick={toggleActive}
            disabled={isSettingActive}
            className={`h-9 flex-1 ${
              isCurrentVision
                ? "inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                : BTN_BRAND
            }`}
          >
            {isSettingActive ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("vision_board.updating")}
              </>
            ) : isCurrentVision ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t("vision_board.active")}
              </>
            ) : (
              t("vision_board.set_active")
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════

const ModalShell = ({ onClose, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-[#072036]/70 p-4 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.96, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.96, opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: EASE }}
      role="dialog"
      aria-modal="true"
      className={`rounded-2xl ${MODAL_SURFACE} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  </motion.div>
);

const ModalHeader = ({ title, description, onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-xl font-extrabold tracking-tight text-[#072036] dark:text-white">{title}</h3>
        {description && <p className="mt-1 text-sm text-[#35566b] dark:text-slate-400">{description}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={t("vision_board.close", "Close")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#F1F5F9] hover:text-[#072036] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

const CharCount = ({ value, limit }) => (
  <span className={`font-bold ${value.length >= limit ? "text-rose-500" : "text-slate-400"}`}>
    {value.length}/{limit}
  </span>
);

const DeleteModal = ({ board, onConfirm, onCancel, isDeleting }) => {
  const { t } = useTranslation();
  return (
    <ModalShell onClose={isDeleting ? undefined : onCancel} className="w-full max-w-md p-6 sm:p-7">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
        <Trash2 className="h-6 w-6" />
      </div>
      <h3 className="text-center text-lg font-extrabold tracking-tight text-[#072036] dark:text-white">
        {t("vision_board.delete_modal_title")}
      </h3>
      <p className="mt-2 text-center text-sm text-[#35566b] dark:text-slate-400">
        {t("vision_board.delete_modal_desc", { title: board?.title })}
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onCancel} disabled={isDeleting} className={`${BTN_GHOST} h-10 flex-1`}>
          {t("vision_board.cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("vision_board.deleting")}
            </>
          ) : (
            t("vision_board.delete")
          )}
        </button>
      </div>
    </ModalShell>
  );
};

const PreviewModal = ({ board, onClose, currentVisionId, onVisionChange }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const isCurrentVision = currentVisionId === board._id;

  const handleDownload = () => {
    if (!board.collageImage) return;
    const link = document.createElement("a");
    link.download = `${board.title || "vision-board"}.png`;
    link.href = board.collageImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleVision = async () => {
    setBusy(true);
    try {
      if (isCurrentVision) {
        await clearActiveVision();
        onVisionChange(null);
        toast({
          title: t("vision_board.toast_vision_disabled_title", "Vision Disabled"),
          description: t("vision_board.toast_vision_disabled_desc", "Vision board removed from dashboard."),
        });
      } else {
        await setActiveVision(board._id);
        onVisionChange(board._id);
        toast({
          title: t("vision_board.toast_vision_enabled_title", "Vision Enabled!"),
          description: t("vision_board.toast_vision_enabled_desc", "Your vision board is now displayed on your dashboard."),
        });
      }
      onClose();
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to update vision", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={onClose} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-[#d7ebf5] px-5 py-4 dark:border-white/10">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold tracking-tight text-[#072036] dark:text-white">{board.title}</h2>
          {board.description && (
            <p className="mt-0.5 line-clamp-2 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">{board.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("vision_board.close", "Close")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#F1F5F9] hover:text-[#072036] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#F1F5F9] p-4 dark:bg-[#072036]/60 sm:p-6">
        {board.collageImage ? (
          <img src={board.collageImage} alt={board.title} className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg" />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center text-slate-300 dark:text-slate-600">
            <Images className="h-16 w-16" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-[#d7ebf5] px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleToggleVision}
          disabled={busy}
          className={`h-10 px-5 ${
            isCurrentVision
              ? "inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              : BTN_BRAND
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrentVision ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {isCurrentVision ? t("vision_board.disable_vision") : t("vision_board.enable_vision")}
        </button>
        <button type="button" onClick={handleDownload} disabled={!board.collageImage} className={`${BTN_GHOST} h-10 px-5`}>
          <Download className="h-4 w-4" />
          {t("vision_board.download")}
        </button>
      </div>
    </ModalShell>
  );
};

const RenameModal = ({ board, onClose, onSaved, onInstantCheck }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [title, setTitle] = useState(board.title || "");
  const [description, setDescription] = useState(board.description || "");
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle) {
      toast({ title: t("vision_board.title_required", "Add a title"), variant: "destructive" });
      return;
    }
    if (onInstantCheck(trimmedTitle, "title") || onInstantCheck(trimmedDescription, "description")) return;
    setBusy(true);
    try {
      const result = await renameVisionBoard(board._id, { title: trimmedTitle, description: trimmedDescription });
      onSaved(result.data || { ...board, title: trimmedTitle, description: trimmedDescription });
      toast({ title: t("vision_board.toast_renamed", "Saved"), description: t("vision_board.toast_renamed_desc", "Board details updated.") });
      onClose();
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to rename board", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={busy ? undefined : onClose} className="w-full max-w-md p-6 sm:p-7">
      <ModalHeader title={t("vision_board.rename_title", "Rename board")} description={t("vision_board.rename_desc", "Change the title and description without opening the editor.")} onClose={onClose} />
      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <label htmlFor="vb-rename-title" className={LABEL}>{t("vision_board.board_title")}</label>
            <CharCount value={title} limit={TITLE_CHAR_LIMIT} />
          </div>
          <input id="vb-rename-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_CHAR_LIMIT} className={`${FIELD} h-11`} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <label htmlFor="vb-rename-desc" className={LABEL}>{t("vision_board.aspiration_details")}</label>
            <CharCount value={description} limit={DESCRIPTION_CHAR_LIMIT} />
          </div>
          <textarea id="vb-rename-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={DESCRIPTION_CHAR_LIMIT} className={`${FIELD} resize-none py-3 leading-relaxed`} />
        </div>
      </div>
      <div className="mt-7 flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={busy} className={`${BTN_GHOST} h-10 px-5`}>{t("vision_board.cancel")}</button>
        <button type="button" onClick={handleSave} disabled={busy} className={`${BTN_PRIMARY} h-10 px-5`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {t("vision_board.save_changes", "Save changes")}
        </button>
      </div>
    </ModalShell>
  );
};

const CreateModal = ({ onClose, onConfirm, suggestion, onInstantCheck }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("blank"); // "blank" | "career" | starter id
  const [draftShort, setDraftShort] = useState([]);
  const [draftLong, setDraftLong] = useState([]);
  const [starterId, setStarterId] = useState(null);

  const pick = (nextSource) => {
    setSource(nextSource);
    if (nextSource === "blank") {
      setTitle(""); setDescription(""); setDraftShort([]); setDraftLong([]); setStarterId(null);
      return;
    }
    if (nextSource === "career" && suggestion) {
      setTitle(suggestion.title); setDescription(suggestion.description);
      setDraftShort(suggestion.shortTermGoals); setDraftLong(suggestion.longTermGoals); setStarterId(suggestion.starterId);
      return;
    }
    const starter = STARTER_BOARDS.find((s) => s.id === nextSource);
    if (starter) {
      setTitle(starter.title); setDescription(starter.description);
      setDraftShort(starter.shortTermGoals); setDraftLong(starter.longTermGoals); setStarterId(starter.id);
    }
  };

  const submit = () => {
    onConfirm({ title, description, shortTermGoals: draftShort, longTermGoals: draftLong, starterId });
  };

  const optionClass = (active) =>
    `group flex w-full flex-col gap-1.5 rounded-xl border p-3 text-left transition-all ${
      active
        ? "border-[#045C9A] bg-[#EAF7FD] ring-2 ring-[#045C9A]/20 dark:border-[#A6D7E8] dark:bg-[#045C9A]/20 dark:ring-[#A6D7E8]/20"
        : "border-[#d7ebf5] bg-white hover:border-[#045C9A]/40 hover:bg-[#EAF7FD]/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#A6D7E8]/30 dark:hover:bg-white/[0.07]"
    }`;

  return (
    <ModalShell onClose={onClose} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden">
      <div className="border-b border-[#d7ebf5] px-6 py-5 dark:border-white/10 sm:px-7">
        <ModalHeader title={t("vision_board.manifest_vision")} description={t("vision_board.manifest_desc")} onClose={onClose} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7">
        <p className={`mb-3 text-[11px] ${LABEL}`}>{t("vision_board.start_from", "Start from")}</p>

        {suggestion && (
          <button type="button" onClick={() => pick("career")} aria-pressed={source === "career"} className={`${optionClass(source === "career")} mb-3`}>
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#045C9A] text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-[#072036] dark:text-white">
                  {t("vision_board.suggested_from_path", "Suggested from your career path")}
                </span>
                <span className="block truncate text-xs text-[#35566b] dark:text-slate-400">
                  {suggestion.title} · {suggestion.shortTermGoals.length + suggestion.longTermGoals.length} {t("vision_board.starter_goals", "starter goals")}
                </span>
              </span>
              {source === "career" && <Check className="ml-auto h-5 w-5 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />}
            </span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <button type="button" onClick={() => pick("blank")} aria-pressed={source === "blank"} className={optionClass(source === "blank")}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-[#045C9A]/40 text-[#045C9A] dark:border-[#A6D7E8]/40 dark:text-[#A6D7E8]">
              <Plus className="h-4 w-4" />
            </span>
            <span className="text-sm font-extrabold text-[#072036] dark:text-white">{t("vision_board.blank_board", "Blank board")}</span>
            <span className="text-[11px] leading-snug text-[#35566b] dark:text-slate-400">{t("vision_board.blank_desc", "Start with an empty canvas.")}</span>
          </button>
          {STARTER_BOARDS.map((starter) => (
            <button key={starter.id} type="button" onClick={() => pick(starter.id)} aria-pressed={source === starter.id} className={optionClass(source === starter.id)}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `linear-gradient(135deg, ${starter.swatch[0]} 0%, ${starter.swatch[1]} 100%)` }}>
                <Target className="h-4 w-4 text-white" />
              </span>
              <span className="text-sm font-extrabold text-[#072036] dark:text-white">{starter.name}</span>
              <span className="line-clamp-2 text-[11px] leading-snug text-[#35566b] dark:text-slate-400">{starter.tagline}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <label htmlFor="vb-new-title" className={LABEL}>{t("vision_board.board_title")}</label>
              <CharCount value={title} limit={TITLE_CHAR_LIMIT} />
            </div>
            <input
              id="vb-new-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); onInstantCheck(e.target.value, "title"); }}
              placeholder={t("vision_board.title_placeholder")}
              maxLength={TITLE_CHAR_LIMIT}
              className={`${FIELD} h-11`}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <label htmlFor="vb-new-desc" className={LABEL}>{t("vision_board.aspiration_details")}</label>
              <CharCount value={description} limit={DESCRIPTION_CHAR_LIMIT} />
            </div>
            <textarea
              id="vb-new-desc"
              value={description}
              onChange={(e) => { setDescription(e.target.value); onInstantCheck(e.target.value, "description"); }}
              rows={3}
              placeholder={t("vision_board.aspiration_placeholder")}
              maxLength={DESCRIPTION_CHAR_LIMIT}
              className={`${FIELD} resize-none py-3 leading-relaxed`}
            />
          </div>
          {(draftShort.length > 0 || draftLong.length > 0) && (
            <div className={`rounded-xl px-4 py-3 ${PANEL}`}>
              <p className={`mb-2 text-[11px] ${LABEL}`}>{t("vision_board.starter_goals_title", "Goals added to the board")}</p>
              <ul className="space-y-1.5 text-xs text-[#16324a] dark:text-slate-200">
                {[...draftShort, ...draftLong].map((goal, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                    {goal}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-[#35566b] dark:text-slate-400">{t("vision_board.starter_goals_hint", "You can edit these in the Goals panel of the editor.")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-[#d7ebf5] px-6 py-4 dark:border-white/10 sm:px-7">
        <button type="button" onClick={onClose} className={`${BTN_GHOST} h-10 px-5`}>{t("vision_board.cancel")}</button>
        <button type="button" onClick={submit} className={`${BTN_PRIMARY} h-10 px-5`}>
          {t("vision_board.start_creating")} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </ModalShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// GALLERY PAGE
// ═══════════════════════════════════════════════════════════════════════════

const VisionBoardGalleryPro = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isDarkTheme, setIsDarkTheme] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteBoard, setDeleteBoard] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewBoard, setPreviewBoard] = useState(null);
  const [renameBoard, setRenameBoard] = useState(null);
  const [shareBoard, setShareBoard] = useState(null);
  const [maxAllowed, setMaxAllowed] = useState(3);
  const [canCreateMore, setCanCreateMore] = useState(true);
  const [currentVisionId, setCurrentVisionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [careerSuggestion, setCareerSuggestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");

  const filteredBoards = useMemo(() => {
    let next = [...boards];
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      next = next.filter((b) => b.title?.toLowerCase().includes(query) || b.description?.toLowerCase().includes(query));
    }
    if (statusFilter === "active") next = next.filter((b) => currentVisionId === b._id);
    if (statusFilter === "stored") next = next.filter((b) => currentVisionId !== b._id);

    next.sort((a, b) => {
      if (sortBy === "name") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return next;
  }, [boards, currentVisionId, searchQuery, sortBy, statusFilter]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    if (!user._id && !user.id && !user.email) return;
    resetUserIdCache();
    loadBoards();
    loadActiveVision();
    loadCareerSuggestion();
  }, []);

  // Escape closes whichever overlay is open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (showCreateModal) setShowCreateModal(false);
      else if (shareBoard) setShareBoard(null);
      else if (renameBoard) setRenameBoard(null);
      else if (previewBoard) setPreviewBoard(null);
      else if (deleteBoard && !isDeleting) setDeleteBoard(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCreateModal, shareBoard, renameBoard, previewBoard, deleteBoard, isDeleting]);

  const loadActiveVision = async () => {
    try {
      const result = await getActiveVision();
      if (result.data) setCurrentVisionId(result.data.id);
    } catch (error) {
      if (!error.message?.includes("not authenticated")) console.error("Failed to load active vision:", error);
    }
  };

  const loadBoards = async () => {
    try {
      setIsLoading(true);
      const result = await getAllVisionBoards();
      setBoards(result.data || []);
      setMaxAllowed(result.maxAllowed || 3);
      setCanCreateMore(result.canCreateMore !== false);
    } catch (error) {
      const unauthenticated = error.message?.includes("not authenticated");
      toast({
        title: unauthenticated ? "Authentication Required" : "Error",
        description: unauthenticated ? "Please log in to view your vision boards" : error.message || "Failed to load vision boards",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // A locked career path seeds the Create modal. Any failure (including the
  // 404 for "no pathway yet") just means no suggestion is shown.
  const loadCareerSuggestion = async () => {
    try {
      const res = await globalApiCall("/career-agent/final-pathway", { method: "GET" });
      setCareerSuggestion(buildCareerSuggestion(res));
    } catch {
      setCareerSuggestion(null);
    }
  };

  const replaceBoard = (updated) =>
    setBoards((prev) => prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)));

  const handleInstantCheck = (text, fieldName) => {
    const result = moderateText(text, true);
    if (!result.isClean) {
      toast({
        title: "Inappropriate Content",
        description: `Your ${fieldName} contains inappropriate language. Please revise it.`,
        variant: "destructive",
      });
      return true;
    }
    return false;
  };

  const handleCreateNew = () => {
    if (!canCreateMore) {
      toast({
        title: "Limit Reached",
        description: `You can only save up to ${maxAllowed} vision boards. Delete one to create a new one.`,
        variant: "destructive",
      });
      return;
    }
    setShowCreateModal(true);
  };

  const handleConfirmCreate = ({ title, description, shortTermGoals, longTermGoals, starterId }) => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (handleInstantCheck(trimmedTitle, "title")) return;
    if (handleInstantCheck(trimmedDescription, "description")) return;

    if (!trimmedTitle || !trimmedDescription) {
      toast({ title: "Add a title and description", description: "Please enter both fields to continue.", variant: "destructive" });
      return;
    }
    if (trimmedTitle.length > TITLE_CHAR_LIMIT) {
      toast({ title: "Title is too long", description: `Please keep the title to ${TITLE_CHAR_LIMIT} characters or fewer.`, variant: "destructive" });
      return;
    }
    if (trimmedDescription.length > DESCRIPTION_CHAR_LIMIT) {
      toast({ title: "Description is too long", description: `Please keep the description within ${DESCRIPTION_CHAR_LIMIT} characters.`, variant: "destructive" });
      return;
    }

    setShowCreateModal(false);
    navigate("/vision-board-pro/create", {
      state: {
        initialTitle: trimmedTitle,
        initialDescription: trimmedDescription,
        initialShortTermGoals: shortTermGoals,
        initialLongTermGoals: longTermGoals,
        starterId,
      },
    });
  };

  const handleEdit = (board) => {
    navigate("/vision-board-pro/create", {
      state: {
        isEditing: true,
        boardId: board._id,
        initialTitle: board.title,
        initialDescription: board.description,
        initialShortTermGoals: board.shortTermGoals,
        initialLongTermGoals: board.longTermGoals,
        backgroundImage: board.collageImage,
      },
    });
  };

  const handleSetAsActive = async (board) => {
    try {
      await setActiveVision(board._id);
      setCurrentVisionId(board._id);
      toast({
        title: "Vision Enabled!",
        description: "Your vision board is now displayed on your dashboard.",
        action: (
          <ToastAction altText={t("vision_board.view_on_dashboard", "View on dashboard")} onClick={() => navigate("/dashboard")}>
            {t("vision_board.view_on_dashboard", "View on dashboard")}
          </ToastAction>
        ),
      });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to set vision board", variant: "destructive" });
    }
  };

  const handleDeactivate = async () => {
    try {
      await clearActiveVision();
      setCurrentVisionId(null);
      toast({ title: "Vision Deactivated", description: "Vision board removed from dashboard." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to deactivate vision board", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteBoard) return;
    try {
      setIsDeleting(true);
      await deleteVisionBoard(deleteBoard._id);
      setBoards((prev) => {
        const next = prev.filter((b) => b._id !== deleteBoard._id);
        setCanCreateMore(next.length < maxAllowed);
        return next;
      });
      if (currentVisionId === deleteBoard._id) setCurrentVisionId(null);
      toast({ title: "Deleted", description: "Vision board deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete vision board", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteBoard(null);
    }
  };

  const handleDuplicate = async (board) => {
    if (boards.length >= maxAllowed) {
      toast({
        title: "Limit Reached",
        description: `You can only save up to ${maxAllowed} vision boards. Delete one to duplicate.`,
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await duplicateVisionBoard(board._id);
      setBoards((prev) => {
        const next = [result.data, ...prev];
        setCanCreateMore(next.length < maxAllowed);
        return next;
      });
      toast({ title: "Duplicated", description: "Vision board duplicated successfully" });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to duplicate vision board", variant: "destructive" });
    }
  };

  const statusChips = [
    { id: "all", label: t("vision_board.filter_all", "All") },
    { id: "active", label: t("vision_board.filter_active", "Active") },
    { id: "stored", label: t("vision_board.filter_stored", "Stored") },
  ];

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-transparent pb-8 transition-colors duration-300">
        {/* Same ambient layer as the dashboard, courses and assessments pages */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
          <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
          <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
        </div>

        <main className="relative z-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">
            {/* Back button -- mobile only */}
            <div className="flex items-center sm:hidden">
              <button type="button" onClick={() => navigate("/dashboard")} className="group flex w-fit items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:group-hover:border-[#045C9A]/40">
                  <ArrowLeft className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
                  {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                </span>
              </button>
            </div>

            {/* Page hero -- same structure and type scale as Courses / Assessments */}
            <motion.section
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className={`relative w-full overflow-hidden rounded-2xl ${SURFACE}`}
            >
              <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />
              <div className="relative z-10 flex flex-col gap-5 px-6 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 max-w-2xl">
                  <h1 className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
                    {t("vision_board.gallery_title", "Vision Board Gallery")}
                  </h1>
                  <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">{t("vision_board.gallery_subtitle")}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                  <div className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[11px] font-bold uppercase tracking-wider text-[#35566b] dark:text-slate-300 ${PANEL}`}>
                    <Grid3X3 className="h-4 w-4 text-[#045C9A] dark:text-[#A6D7E8]" />
                    <span className="tabular-nums">{boards.length} / {maxAllowed}</span>
                    {t("vision_board.slots")}
                  </div>
                  <button type="button" onClick={handleCreateNew} disabled={!canCreateMore} className={`${BTN_PRIMARY} h-9 px-4`}>
                    <Plus className="h-4 w-4" />
                    {t("vision_board.create_new_board")}
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Toolbar -- only once there is something to search or sort */}
            {!isLoading && boards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
                className={`flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center ${SURFACE}`}
              >
                <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="vb-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("vision_board.search_placeholder", "Search boards…")}
                    className={`${FIELD} h-10 pl-10`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div id="vb-status" className={`flex h-10 items-center gap-1 rounded-xl p-1 ${PANEL}`}>
                    {statusChips.map((chip) => {
                      const active = statusFilter === chip.id;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setStatusFilter(chip.id)}
                          aria-pressed={active}
                          className={`h-8 rounded-lg px-3 text-xs font-bold transition-colors ${
                            active ? "bg-white text-[#045C9A] shadow-sm dark:bg-[#045C9A]/40 dark:text-white" : "text-[#35566b] hover:text-[#045C9A] dark:text-slate-400 dark:hover:text-white"
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  <select
                    id="vb-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label={t("vision_board.sort_by", "Sort by")}
                    className="h-10 cursor-pointer rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] pl-3 pr-8 text-xs font-bold text-[#35566b] outline-none transition-colors focus:border-[#045C9A] focus:ring-2 focus:ring-[#045C9A]/20 dark:border-white/10 dark:bg-[#072036]/60 dark:text-slate-300"
                  >
                    <option value="recent">{t("vision_board.sort_recent", "Newest first")}</option>
                    <option value="oldest">{t("vision_board.sort_oldest", "Oldest first")}</option>
                    <option value="name">{t("vision_board.sort_name", "Name A–Z")}</option>
                  </select>

                  <div id="vb-view" className={`flex h-10 items-center gap-1 rounded-xl p-1 ${PANEL}`}>
                    {[
                      { id: "grid", Icon: Grid3X3, label: t("vision_board.view_grid", "Grid view") },
                      { id: "list", Icon: List, label: t("vision_board.view_list", "List view") },
                    ].map(({ id, Icon, label }) => {
                      const active = viewMode === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setViewMode(id)}
                          aria-pressed={active}
                          aria-label={label}
                          title={label}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                            active ? "bg-white text-[#045C9A] shadow-sm dark:bg-[#045C9A]/40 dark:text-white" : "text-[#35566b] hover:text-[#045C9A] dark:text-slate-400 dark:hover:text-white"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-28">
                <Loader2 className="h-9 w-9 animate-spin text-[#045C9A] dark:text-[#A6D7E8]" />
                <p className="text-sm font-medium text-[#35566b] dark:text-slate-400">{t("vision_board.loading_boards")}</p>
              </div>
            ) : boards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                className={`flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center ${SURFACE}`}
              >
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#045C9A]/10 dark:bg-[#045C9A]/25">
                  <Images className="h-9 w-9 text-[#045C9A] dark:text-[#A6D7E8]" />
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-[#072036] dark:text-white">{t("vision_board.no_boards")}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#35566b] dark:text-slate-400">{t("vision_board.no_boards_desc")}</p>
                <button type="button" onClick={handleCreateNew} className={`${BTN_PRIMARY} mt-7 h-10 px-6 text-sm`}>
                  <Plus className="h-4 w-4" />
                  {t("vision_board.create_vision_board")}
                </button>
              </motion.div>
            ) : filteredBoards.length === 0 ? (
              <div className={`rounded-2xl px-6 py-16 text-center ${SURFACE}`}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-white/[0.06]">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-extrabold tracking-tight text-[#072036] dark:text-white">{t("vision_board.no_boards_match")}</h3>
                <p className="mt-1.5 text-sm text-[#35566b] dark:text-slate-400">{t("vision_board.no_boards_match_desc")}</p>
                <button type="button" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }} className={`${BTN_GHOST} mt-5 h-9 px-4`}>
                  {t("vision_board.clear_filters", "Clear filters")}
                </button>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-4"}>
                <AnimatePresence>
                  {filteredBoards.map((board) => (
                    <BoardCard
                      key={board._id}
                      board={board}
                      onDelete={setDeleteBoard}
                      onDuplicate={handleDuplicate}
                      onEdit={handleEdit}
                      onRename={setRenameBoard}
                      onShare={setShareBoard}
                      onPreview={setPreviewBoard}
                      onSetAsActive={handleSetAsActive}
                      onDeactivate={handleDeactivate}
                      isCurrentVision={currentVisionId === board._id}
                      viewMode={viewMode}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

        <AnimatePresence>
          {deleteBoard && (
            <DeleteModal key="delete" board={deleteBoard} onConfirm={handleDelete} onCancel={() => setDeleteBoard(null)} isDeleting={isDeleting} />
          )}
          {previewBoard && (
            <PreviewModal key="preview" board={previewBoard} onClose={() => setPreviewBoard(null)} currentVisionId={currentVisionId} onVisionChange={setCurrentVisionId} />
          )}
          {renameBoard && (
            <RenameModal key="rename" board={renameBoard} onClose={() => setRenameBoard(null)} onSaved={replaceBoard} onInstantCheck={handleInstantCheck} />
          )}
          {shareBoard && (
            <ShareBoardModal
              key="share"
              board={boards.find((b) => b._id === shareBoard._id) || shareBoard}
              onClose={() => setShareBoard(null)}
              onChanged={(updated) => { replaceBoard(updated); setShareBoard(updated); }}
            />
          )}
          {showCreateModal && (
            <CreateModal key="create" onClose={() => setShowCreateModal(false)} onConfirm={handleConfirmCreate} suggestion={careerSuggestion} onInstantCheck={handleInstantCheck} />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default VisionBoardGalleryPro;
