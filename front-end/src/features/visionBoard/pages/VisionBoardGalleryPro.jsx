import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
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

const BoardCard = ({ board, onDelete, onDuplicate, onEdit, onView, onSetAsActive, onDeactivate, isCurrentVision, viewMode = "grid" }) => {
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:bg-[#0f172a] ${viewMode === "list" ? "md:flex" : ""} ${isCurrentVision
        ? "border-[#1a3884]/40 shadow-[0_18px_40px_rgba(26,56,132,0.14)]"
        : "border-slate-200 shadow-sm hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
        }`}
    >
      {isCurrentVision && (
        <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/92 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1a3884] shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#081120]/90 dark:text-blue-300">
          <Star className="h-3 w-3 fill-current" />
          Active
        </div>
      )}

      <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-900 ${viewMode === "list" ? "md:w-[320px] md:flex-shrink-0" : "aspect-[4/5]"}`}>
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
              onClick={() => onView(board)}
              className="rounded-full bg-white px-5 font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(board)}
              className="rounded-full border-white/60 bg-white/10 px-5 font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/92 text-slate-700 shadow-lg transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-[#081120]/90 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full z-30 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(board);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/50"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(board);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/50"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(board);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 md:flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {isCurrentVision ? "Displayed" : "Saved"}
            </span>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {formatDate(board.createdAt)}
            </p>
          </div>
          <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white" title={board.title}>
            {board.title}
          </h3>
          <p className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-500 dark:text-slate-400">
            {board.description || "A curated board of visual goals and personal direction."}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(board)}
            className="flex-1 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View
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
            className={`flex-1 rounded-xl font-semibold ${isCurrentVision
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-[#1a3884] text-white hover:bg-[#132c6b]"
              }`}
          >
            {isSettingActive ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Saving
              </>
            ) : isCurrentVision ? (
              <>
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                Active
              </>
            ) : (
              "Set Active"
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
          className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-center mb-2 text-[#002147]">
            Delete Vision Board?
          </h3>
          <p className="text-center mb-6 text-gray-500">
            Are you sure you want to delete "{board?.title}"? This action cannot
            be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
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
                  Deleting...
                </>
              ) : (
                "Delete"
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

const ViewModal = ({ isOpen, board, onClose, currentVisionId, onVisionChange }) => {
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
        title: "Vision Enabled!",
        description: "Your vision board is now displayed on your dashboard.",
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
        title: "Vision Disabled",
        description: "Vision board removed from dashboard.",
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
          className="bg-white rounded-2xl w-auto max-w-[90vw] shadow-2xl border border-gray-200"
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
                Disable Vision
              </Button>
            ) : (
              <Button
                onClick={handleSetAsVision}
                className="bg-[#1a3884] hover:bg-[#132c6b] text-white font-semibold shadow-[0_0_15px_rgba(26,56,132,0.4)]"
              >
                <Eye className="w-4 h-4 mr-2" />
                Enable as Vision
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDownload}
              className="border-gray-200 text-[#002147] hover:bg-gray-50 bg-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteBoard, setDeleteBoard] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewBoard, setViewBoard] = useState(null);
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

  const handleView = (board) => {
    setViewBoard(board);
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
    <main className="min-h-screen w-full bg-[#f3f6fb] px-4 py-5 transition-colors duration-300 dark:bg-[#06101d] md:px-8">
      <div className="mx-auto max-w-[1600px] pb-6">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-[#0b1627] md:px-8 md:py-8">
          {/* Decorative background gradient to match image style */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-50/50 blur-3xl dark:bg-blue-900/10" />
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-50/30 blur-3xl dark:bg-indigo-900/5" />
          
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a3884] shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
                <div className="h-2 w-2 rounded-full bg-[#1a3884] shadow-[0_0_8px_rgba(26,56,132,0.4)]" />
                Vision Journey
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                Vision Board <span className="text-[#1a3884]">- Library</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-500 dark:text-slate-400 md:text-lg">
                Experience a focused visual journey. Create detailed boards for your goals, 
                track your aspirations with clarity, and keep your primary vision active 
                on your dashboard to stay inspired.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                <Grid3X3 className="h-3.5 w-3.5" />
                {boards.length} of {maxAllowed} boards
              </div>
              <Button
                onClick={handleCreateNew}
                disabled={!canCreateMore}
                className={`h-11 rounded-2xl px-6 font-semibold ${canCreateMore
                  ? "bg-[#1a3884] text-white hover:bg-[#132c6b]"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800"
                  }`}
              >
                <Plus className="mr-2 h-4.5 w-4.5" />
                Create New Board
              </Button>
            </div>
          </div>

          {boards.length > 0 && (
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search boards by title or description"
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 dark:border-slate-700 dark:bg-[#081120]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#081120]">
                  {[
                    { id: "all", label: "All" },
                    { id: "active", label: "Active" },
                    { id: "draft", label: "Saved" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setStatusFilter(option.id)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${statusFilter === option.id
                        ? "bg-[#1a3884] text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-[#081120] dark:text-slate-200"
                >
                  <option value="recent">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name</option>
                </select>

                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#081120]">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-400"}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg p-2 ${viewMode === "list" ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white" : "text-slate-400"}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#1a3884]" />
              <p className="animate-pulse text-slate-400">Loading your boards...</p>
            </div>
          ) : boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white py-24 text-center shadow-sm dark:border-slate-700 dark:bg-[#0b1627]">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#1a3884]/10">
                <Images className="h-8 w-8 text-[#1a3884]" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-white">No boards yet</h3>
              <p className="mx-auto mb-8 max-w-md text-slate-500 dark:text-slate-400">
                Start with one clear board, then add more as your goals branch into different areas.
              </p>
              <Button onClick={handleCreateNew} className="h-11 rounded-2xl bg-[#1a3884] px-8 font-semibold text-white hover:bg-[#132c6b]">
                <Plus className="mr-2 h-4.5 w-4.5" />
                Create Vision Board
              </Button>
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-800 dark:bg-[#0b1627]">
              <Search className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No boards match those filters</h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Try another search term or switch back to all boards.</p>
            </div>
          ) : (
            <div className={viewMode === "grid"
              ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
                    onView={handleView}
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

        {/* View Modal */}
        <ViewModal
          isOpen={!!viewBoard}
          board={viewBoard}
          onClose={() => setViewBoard(null)}
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
                className="bg-white dark:bg-[#0f172a] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">What's your Vision ?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Give your vision a name and a brief description to start manifesting your goals.
</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <label className="font-semibold">Title</label>
                      <span className={`font-medium ${newTitle.length >= TITLE_CHAR_LIMIT ? "text-red-500" : "text-slate-400"}`}>
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
                      placeholder="e.g., My 2026 Goals..."
                      maxLength={TITLE_CHAR_LIMIT}
                      className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <label className="font-semibold">Description</label>
                      <span className={`font-medium ${newDescription.length >= DESCRIPTION_CHAR_LIMIT ? "text-red-500" : "text-slate-400"}`}>
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
                      rows={3}
                      placeholder="Describe what you want to achieve and why it matters to you…"
                      maxLength={DESCRIPTION_CHAR_LIMIT}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
                  >
                    Start Creating <ArrowRight className="w-4 h-4 ml-1.5" />
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



