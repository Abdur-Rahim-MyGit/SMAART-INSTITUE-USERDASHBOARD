import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Star,
  Loader2,
  Images,
  Calendar,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Download,
  X,
  CheckCircle2,
  ArrowRight,
  Edit,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import {
  getAllVisionBoards,
  deleteVisionBoard,
  duplicateVisionBoard,
  setActiveVision,
  clearActiveVision,
  getActiveVision,
  resetUserIdCache,
} from "../services/visionBoardProApi";
import { GRID_TEMPLATES } from "../templates/gridTemplates";
import { moderateTextAsync, loadToxicityModel, moderateText } from "../utils/contentModeration";

// ═══════════════════════════════════════════════════════════════════════════
// BOARD CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const BoardCard = ({ board, onDelete, onDuplicate, onEdit, onPreview, onSetAsActive, onDeactivate, isCurrentVision, viewMode = "grid" }) => {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [isSettingActive, setIsSettingActive] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`group relative overflow-hidden rounded-[24px] border bg-white transition-all duration-500 hover:-translate-y-1.5 dark:bg-[#00152E] ${viewMode === "list" ? "md:flex" : ""} ${isCurrentVision
        ? "border-primary/30 shadow-[0_20px_50px_rgba(26,56,132,0.12)] ring-1 ring-primary/10"
        : "border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 dark:border-white/8 dark:hover:border-slate-700 dark:hover:shadow-black/40"
        }`}
    >
      {isCurrentVision && (
        <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-[#081120]/90 dark:text-blue-300">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {t("vision_board.active_vision")}
        </div>
      )}

      <div className={`relative overflow-hidden bg-slate-100 dark:bg-[#002147] ${viewMode === "list" ? "md:w-[320px] md:flex-shrink-0" : "aspect-[4/5]"}`}>
        {board.collageImage ? (
          <img
            src={board.collageImage}
            alt={board.title}
            className={`h-full w-full transition-transform duration-500 group-hover:scale-[1.03] ${viewMode === "list" ? "object-cover md:min-h-[260px]" : "object-cover"}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
            <Images className="h-14 w-14" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onPreview(board)}
              className="rounded-full bg-white px-5 font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t("vision_board.preview")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(board)}
              className="rounded-full border-white/60 bg-white/10 px-5 font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              <Edit className="mr-2 h-4 w-4" />
              {t("vision_board.edit")}
            </Button>
          </div>
        </div>

        <div className="absolute right-3 top-3 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/92 text-slate-700 shadow-lg transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-[#081120]/90 dark:text-slate-200 dark:hover:bg-[#002A5C]"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full z-30 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#002A5C]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(board);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700/50"
                  >
                    <Copy className="w-3.5 h-3.5" /> {t("vision_board.duplicate")}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(board);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700/50"
                  >
                    <Edit className="w-3.5 h-3.5" /> {t("vision_board.edit")}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(board);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t("vision_board.delete")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3.5 p-4 md:flex-1">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${isCurrentVision
              ? "border-[#1a3884]/20 bg-[#1a3884]/5 text-[#1a3884] dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-400"
              : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-400"
              }`}>
              {isCurrentVision ? t("vision_board.current_focus") : t("vision_board.stored_vision")}
            </span>
            <p className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500">
              {formatDate(board.createdAt)}
            </p>
          </div>
          <h3 className="truncate text-[16px] font-extrabold tracking-tight text-slate-900 dark:text-white" title={board.title}>
            {board.title}
          </h3>
          <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            {board.description || t("vision_board.default_board_desc")}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPreview(board)}
            className="flex-1 rounded-lg border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#002147] dark:text-slate-200 dark:hover:bg-[#002A5C]"
          >
            {t("vision_board.preview")}
          </Button>
          <Button
            size="sm"
            onClick={async (e) => {
              e.stopPropagation();
              setIsSettingActive(true);
              if (isCurrentVision) {
                await onDeactivate(board);
              } else {
                await onSetAsActive(board);
              }
              setIsSettingActive(false);
            }}
            disabled={isSettingActive}
            className={`flex-1 rounded-lg font-bold tracking-wide transition-all ${isCurrentVision
              ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200"
              : "bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
              }`}
          >
            {isSettingActive ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                {t("vision_board.updating")}
              </>
            ) : isCurrentVision ? (
              <>
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                {t("vision_board.active")}
              </>
            ) : (
              t("vision_board.set_active")
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DELETE CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════════════════

const DeleteModal = ({ isOpen, board, onConfirm, onCancel, isDeleting }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-[#00152E] rounded-[24px] max-w-md w-full p-8 shadow-2xl border border-slate-100 dark:border-white/8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-black text-center mb-2 text-slate-900 dark:text-white uppercase tracking-tight">
            {t("vision_board.delete_modal_title")}
          </h3>
          <p className="text-center mb-6 text-gray-500">
            {t("vision_board.delete_modal_desc", { title: board?.title })}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
              disabled={isDeleting}
            >
              {t("vision_board.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("vision_board.deleting")}
                </>
              ) : (
                t("vision_board.delete")
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW MODAL
// ═══════════════════════════════════════════════════════════════════════════

const PreviewModal = ({ isOpen, board, onClose, currentVisionId, onVisionChange }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  if (!isOpen || !board) return null;

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

  const handleSetAsVision = async () => {
    try {
      await setActiveVision(board._id);
      onVisionChange(board._id);

      toast({
        title: t("vision_board.toast_vision_enabled_title") || "Vision Enabled!",
        description: t("vision_board.toast_vision_enabled_desc") || "Your vision board is now displayed on your dashboard.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to set as vision",
        variant: "destructive",
      });
    }
  };

  const handleDisableVision = async () => {
    try {
      await clearActiveVision();
      onVisionChange(null);

      toast({
        title: t("vision_board.toast_vision_disabled_title") || "Vision Disabled",
        description: t("vision_board.toast_vision_disabled_desc") || "Vision board removed from dashboard.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable vision",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-[#00152E] rounded-[28px] w-auto max-w-[90vw] shadow-2xl border border-slate-100 dark:border-white/8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex flex-col pr-4">
              <h2 className="text-lg font-semibold text-[#002147] break-words">
                {board.title}
              </h2>
              {board.description && (
                <p className="text-sm text-gray-500 mt-1 max-w-xl break-words">
                  {board.description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Image - Auto size based on content */}
          <div className="p-4 bg-white flex justify-center items-center">
            {board.collageImage ? (
              <img
                src={board.collageImage}
                alt={board.title}
                className="rounded-lg shadow-lg"
                style={{
                  maxWidth: '80vw',
                  maxHeight: '60vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-48 w-48 text-gray-500">
                <Images className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t border-gray-200 flex flex-row justify-between items-center gap-3">
            {isCurrentVision ? (
              <Button
                onClick={handleDisableVision}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                {t("vision_board.disable_vision")}
              </Button>
            ) : (
              <Button
                onClick={handleSetAsVision}
                className="bg-[#1a3884] hover:bg-[#132c6b] text-white font-semibold shadow-[0_0_15px_rgba(26,56,132,0.4)]"
              >
                <Eye className="w-4 h-4 mr-2" />
                {t("vision_board.enable_vision")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownload}
              className="border-gray-200 text-[#002147] hover:bg-gray-50 bg-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("vision_board.download")}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GALLERY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const VisionBoardGalleryPro = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteBoard, setDeleteBoard] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewBoard, setPreviewBoard] = useState(null);
  const [maxAllowed, setMaxAllowed] = useState(3);
  const [canCreateMore, setCanCreateMore] = useState(true);
  const [currentVisionId, setCurrentVisionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");

  const TITLE_CHAR_LIMIT = 50;
  const DESCRIPTION_CHAR_LIMIT = 250;

  const filteredBoards = useMemo(() => {
    let nextBoards = [...boards];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      nextBoards = nextBoards.filter((board) =>
        board.title?.toLowerCase().includes(query) ||
        board.description?.toLowerCase().includes(query)
      );
    }

    if (statusFilter === "active") {
      nextBoards = nextBoards.filter((board) => currentVisionId === board._id);
    }

    if (statusFilter === "draft") {
      nextBoards = nextBoards.filter((board) => currentVisionId !== board._id);
    }

    nextBoards.sort((a, b) => {
      if (sortBy === "name") {
        return (a.title || "").localeCompare(b.title || "");
      }

      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return nextBoards;
  }, [boards, currentVisionId, searchQuery, sortBy, statusFilter]);

  // Load boards and check current vision
  useEffect(() => {
    // Check if user has basic info (at least email) before making API calls
    const user = JSON.parse(
      sessionStorage.getItem("user") || "{}"
    );

    // Allow loading if user has id OR email (API will fetch id by email if missing)
    if (!user._id && !user.id && !user.email) {
      // User not authenticated at all - skip silently
      return;
    }

    // Reset cache to ensure fresh ID fetch (important for dev bypass login)
    resetUserIdCache();

    loadBoards();
    loadActiveVision();
    // Pre-load Toxicity Model
    loadToxicityModel();
  }, []);

  const loadActiveVision = async () => {
    try {
      // API will fetch correct user ID by email if missing from session
      const result = await getActiveVision();
      if (result.data) {
        setCurrentVisionId(result.data.id);
      }
    } catch (error) {
      // Only log error if it's not an authentication error (those are expected for new users)
      if (!error.message?.includes('not authenticated')) {
        console.error('Failed to load active vision:', error);
      }
    }
  };

  const loadBoards = async () => {
    try {
      setIsLoading(true);

      // API will fetch correct user ID by email if missing from session

      const result = await getAllVisionBoards();
      setBoards(result.data || []);
      setMaxAllowed(result.maxAllowed || 3);
      setCanCreateMore(result.canCreateMore !== false);
    } catch (error) {
      // Check if it's an authentication error
      if (error.message && error.message.includes("not authenticated")) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your vision boards",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to load vision boards",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantCheck = (text, fieldName) => {
    // Use exact word-boundary matching to avoid false positives
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

  const handleConfirmCreate = async () => {
    const trimmedTitle = newTitle.trim();
    const trimmedDescription = newDescription.trim();

    // Synchronous Gatekeeper Check
    if (handleInstantCheck(trimmedTitle, "title")) return;
    if (handleInstantCheck(trimmedDescription, "description")) return;

    if (!trimmedTitle || !trimmedDescription) {
      toast({
        title: "Add a title and description",
        description: "Please enter both fields to continue.",
        variant: "destructive",
      });
      return;
    }

    // Content moderation check - REMOVED deep checks for speed, relying on Editor's Save
    /* 
    const titleCheck = await moderateTextAsync(trimmedTitle);
    if (!titleCheck.isClean) {
      toast({
        title: "Inappropriate Content",
        description: "Your vision board title contains inappropriate language. Please revise.",
        variant: "destructive",
      });
      return;
    }

    const descCheck = await moderateTextAsync(trimmedDescription);
    if (!descCheck.isClean) {
      toast({
        title: "Inappropriate Content",
        description: "Your vision board description contains inappropriate language. Please revise.",
        variant: "destructive",
      });
      return;
    }
    */

    if (trimmedTitle.length > TITLE_CHAR_LIMIT) {
      toast({
        title: "Title is too long",
        description: `Please keep the title to ${TITLE_CHAR_LIMIT} characters or fewer.`,
        variant: "destructive",
      });
      return;
    }

    if (trimmedDescription.length > DESCRIPTION_CHAR_LIMIT) {
      toast({
        title: "Description is too long",
        description: `Please keep the description within ${DESCRIPTION_CHAR_LIMIT} characters.`,
        variant: "destructive",
      });
      return;
    }

    const payload = {
      initialTitle: trimmedTitle,
      initialDescription: trimmedDescription,
    };
    setShowCreateModal(false);
    setNewTitle("");
    setNewDescription("");
    navigate("/vision-board-pro/create", { state: payload });
  };

  const handlePreview = (board) => {
    setPreviewBoard(board);
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
        // Optional: you can pass templateId, textOverlays etc if you want full restore,
        // but since we only save the collage image, full restore is tricky.
        // We will pass the collageImage as the backgroundImage so they can build on top of it.
        backgroundImage: board.collageImage
      }
    });
  };

  // Handle setting a vision board as active and navigating to dashboard
  const handleSetAsActive = async (board) => {
    try {
      await setActiveVision(board._id);
      setCurrentVisionId(board._id);

      toast({
        title: "Vision Enabled!",
        description: "Your vision board is now displayed on your dashboard.",
      });

      // Navigate to dashboard to show the active vision
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to set vision board",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteBoard) return;

    try {
      setIsDeleting(true);
      await deleteVisionBoard(deleteBoard._id);
      setBoards((prev) => {
        const newBoards = prev.filter((b) => b._id !== deleteBoard._id);
        // Update canCreateMore since we deleted one
        setCanCreateMore(newBoards.length < maxAllowed);
        return newBoards;
      });
      toast({
        title: "Deleted",
        description: "Vision board deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vision board",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteBoard(null);
    }
  };

  const handleDuplicate = async (board) => {
    // Check limit before duplicating
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
        const newBoards = [result.data, ...prev];
        setCanCreateMore(newBoards.length < maxAllowed);
        return newBoards;
      });
      toast({
        title: "Duplicated",
        description: "Vision board duplicated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate vision board",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    try {
      await clearActiveVision();
      setCurrentVisionId(null);
      toast({
        title: "Vision Deactivated",
        description: "Vision board removed from dashboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate vision board",
        variant: "destructive",
      });
    }
  };


  return (
    <main className="min-h-screen w-full bg-transparent px-4 py-5 transition-colors duration-300 md:px-8">
      <div className="mx-auto max-w-[1600px] pb-6">
        {/* Back Button - Mobile Only */}
        <div className="mb-4 md:hidden">
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-3 text-[#112b6b] dark:text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#1a3884] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
              <ArrowLeft className="w-4 h-4" />
            </div>
            {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
          </button>
        </div>

        {/* ── Standardized Header ── */}
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
            <div className="flex flex-col">
                <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                    Vision Board <span className="text-[#1a3884] dark:text-blue-300">Gallery</span>
                </h1>
                <p className="mt-1 max-w-xl text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                    {t("vision_board.gallery_subtitle")}
                </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-[#F8FAFC] dark:bg-[#002147] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-white shadow-sm dark:border-white/10">
                    <Grid3X3 className="h-3.5 w-3.5 text-[#1a3884] dark:text-blue-400" />
                    {boards.length} / {maxAllowed} {t("vision_board.slots")}
                </div>
                <Button
                    onClick={handleCreateNew}
                    disabled={!canCreateMore}
                    className={`h-8 rounded-lg px-4 text-xs font-bold tracking-wide transition-all active:scale-95 ${canCreateMore
                        ? "bg-[#1a3884] text-white hover:bg-[#132c6b] shadow-sm"
                        : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-[#002A5C]"
                        }`}
                >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {t("vision_board.create_new_board")}
                </Button>
            </div>
        </motion.div>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#1a3884]" />
              <p className="animate-pulse text-slate-400">{t("vision_board.loading_boards")}</p>
            </div>
          ) : boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white py-24 text-center shadow-sm dark:border-white/10 dark:bg-[#0b1627]">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#1a3884]/10">
                <Images className="h-8 w-8 text-[#1a3884]" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-white">{t("vision_board.no_boards")}</h3>
              <p className="mx-auto mb-8 max-w-md text-slate-500 dark:text-slate-400">
                {t("vision_board.no_boards_desc")}
              </p>
              <Button onClick={handleCreateNew} className="h-11 rounded-2xl bg-[#1a3884] px-8 font-semibold text-white hover:bg-[#132c6b]">
                <Plus className="mr-2 h-4.5 w-4.5" />
                {t("vision_board.create_vision_board")}
              </Button>
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-white/8 dark:bg-[#0b1627]">
              <Search className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t("vision_board.no_boards_match")}</h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">{t("vision_board.no_boards_match_desc")}</p>
            </div>
          ) : (
            <div className={viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid grid-cols-1 gap-4"
            }>
              <AnimatePresence>
                {filteredBoards.map((board) => (
                  <BoardCard
                    key={board._id}
                    board={board}
                    onDelete={setDeleteBoard}
                    onDuplicate={handleDuplicate}
                    onEdit={handleEdit}
                    onPreview={handlePreview}
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
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteBoard}
        board={deleteBoard}
        onConfirm={handleDelete}
        onCancel={() => setDeleteBoard(null)}
        isDeleting={isDeleting}
      />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={!!viewBoard}
        board={viewBoard}
        onClose={() => setPreviewBoard(null)}
        currentVisionId={currentVisionId}
        onVisionChange={setCurrentVisionId}
      />

      {/* Create New Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#00152E] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">{t("vision_board.manifest_vision")}</h3>
              <p className="text-[14px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 mb-8">{t("vision_board.manifest_desc")}
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <label className="font-bold uppercase tracking-wider">{t("vision_board.board_title")}</label>
                    <span className={`font-bold ${newTitle.length >= TITLE_CHAR_LIMIT ? "text-red-500" : "text-slate-400"}`}>
                      {newTitle.length}/{TITLE_CHAR_LIMIT}
                    </span>
                  </div>
                  <Input
                    value={newTitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTitle(val);
                      handleInstantCheck(val, "title");
                    }}
                    placeholder={t("vision_board.title_placeholder")}
                    maxLength={TITLE_CHAR_LIMIT}
                    className="h-12 bg-slate-50 dark:bg-[#002147] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                    <label className="font-bold uppercase tracking-wider">{t("vision_board.aspiration_details")}</label>
                    <span className={`font-bold ${newDescription.length >= DESCRIPTION_CHAR_LIMIT ? "text-red-500" : "text-slate-400"}`}>
                      {newDescription.length}/{DESCRIPTION_CHAR_LIMIT}
                    </span>
                  </div>
                  <textarea
                    value={newDescription}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewDescription(val);
                      handleInstantCheck(val, "description");
                    }}
                    rows={4}
                    placeholder={t("vision_board.aspiration_placeholder")}
                    maxLength={DESCRIPTION_CHAR_LIMIT}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#002147] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="h-12 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#002A5C] hover:bg-slate-50 dark:hover:bg-[#002A5C] rounded-xl font-bold px-6"
                >
                  {t("vision_board.cancel")}
                </Button>
                <Button
                  onClick={handleConfirmCreate}
                  className="h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 rounded-xl px-8"
                >
                  {t("vision_board.start_creating")} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default VisionBoardGalleryPro;



