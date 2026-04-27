import React, { useState, useEffect, useCallback } from "react";
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

const BoardCard = ({ board, onDelete, onDuplicate, onEdit, onView, onSetAsActive, onDeactivate, isCurrentVision }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isSettingActive, setIsSettingActive] = useState(false);
  const template =
    GRID_TEMPLATES[board.templateId] || GRID_TEMPLATES["grid-2x2"];

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
      className={`group relative bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${isCurrentVision ? 'border-[#1a3884] ring-2 ring-[#1a3884]/20 shadow-[#1a3884]/10' : 'border-slate-200 dark:border-slate-700 hover:border-[#1a3884]/50 dark:hover:border-[#1a3884]/50'
        }`}
    >
      {/* Active Vision Badge */}
      {isCurrentVision && (
        <div className="absolute top-0 left-0 right-0 bg-[#1a3884] text-white text-[9px] font-bold py-1 px-2 text-center z-10 shadow-sm tracking-widest uppercase">
          <Star className="w-2.5 h-2.5 inline mr-1 mb-0.5 fill-white" />
          Active Vision
        </div>
      )}

      {/* Collage Image */}
      <div className={`relative aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden ${isCurrentVision ? 'mt-5 border-t border-slate-100 dark:border-slate-700' : ''}`}>
        {board.collageImage ? (
          <img
            src={board.collageImage}
            alt={board.title}
            className="w-full h-full object-contain bg-slate-200 dark:bg-slate-950 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <Images className="w-16 h-16" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="flex flex-col gap-3">
            <Button
              size="sm"
              onClick={() => onView(board)}
              className="bg-white hover:bg-slate-100 text-slate-900 font-semibold px-6 shadow-lg transform hover:scale-105 transition-all rounded-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full
            </Button>
          </div>
        </div>



        {/* Menu Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-lg transition-colors border border-slate-200 dark:border-slate-600"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-30 overflow-hidden">

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(board);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors border-b border-slate-100 dark:border-slate-700"
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

      {/* Footer Info */}
      <div className="p-3.5 relative">
        <div className="mb-3">
          <h3 className="font-bold text-slate-800 dark:text-white truncate text-sm mb-0.5" title={board.title}>
            {board.title}
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
            <Calendar className="w-3 h-3" />
            {formatDate(board.createdAt)}
          </p>
        </div>

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
          className={`w-full text-[10px] font-bold h-8 shadow-sm relative overflow-hidden transition-all duration-300 rounded-lg group/btn ${isCurrentVision
            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500 text-green-700 dark:text-green-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 hover:text-red-600'
            : 'bg-[#1a3884] hover:bg-[#132c6b] text-white border-0 hover:shadow-md hover:-translate-y-0.5'
            }`}
        >
          {isSettingActive ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              Processing...
            </>
          ) : isCurrentVision ? (
            <>
              <span className="flex items-center group-hover/btn:hidden">
                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                Active Vision
              </span>
              <span className="hidden group-hover/btn:flex items-center">
                <EyeOff className="w-3 h-3 mr-1.5" />
                Deactivate
              </span>
            </>
          ) : (
            <>
              Set as Active Goal
            </>
          )}
        </Button>
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

  const TITLE_CHAR_LIMIT = 50;
  const DESCRIPTION_CHAR_LIMIT = 250;

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


  return (
    <main className="w-full relative py-4 px-4 md:px-8 bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300 min-h-screen">
          <div className="max-w-[1600px] mx-auto pb-6">

            {/* Header Section - Compact */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
              <div className="flex-1 text-center md:text-left">
                <p className="text-[#1a3884] dark:text-[#C0C0C0] text-3xl md:text-4xl font-['Dancing Script',cursive] mb-1">
                  Visualize your goals and manifest your future.
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-xl">
                  Create, view, and set your active vision board here.
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center text-xs font-bold text-[#1a3884]/70 dark:text-[#C0C0C0]/70 bg-white/50 dark:bg-[#1e293b]/50 px-4 py-2 rounded-xl border border-[#1a3884]/10 dark:border-[#C0C0C0]/10 shadow-sm">
                  <Grid3X3 className="w-3.5 h-3.5 mr-2 opacity-50" />
                  {boards.length} / {maxAllowed} BOARDS
                </div>

                <Button
                  onClick={handleCreateNew}
                  disabled={!canCreateMore}
                  className={`h-11 px-6 rounded-xl font-bold shadow-lg transition-all ${canCreateMore
                    ? "bg-[#1a3884] hover:bg-[#132c6b] text-white hover:-translate-y-0.5"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-0"
                    }`}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Board
                </Button>
              </div>
            </div>

            {/* Content Container */}
            <div className="relative">

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 text-[#1a3884] animate-spin" />
                <p className="text-slate-400 animate-pulse">Loading your visions...</p>
              </div>
            ) : boards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm border-dashed">
                <div className="w-20 h-20 bg-[#1a3884]/10 rounded-full flex items-center justify-center mb-6">
                  <Images className="w-8 h-8 text-[#1a3884]" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No vision boards found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                  Start your journey by creating your first vision board today.
                </p>
                <Button onClick={handleCreateNew} className="bg-[#1a3884] hover:bg-[#132c6b] text-white rounded-xl px-8 h-12 font-bold shadow-lg hover:shadow-[#1a3884]/25">
                  <Plus className="w-5 h-5 mr-2" /> Create Board
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                  {boards.map(board => (
                    <BoardCard
                      key={board._id}
                      board={board}
                      onDelete={setDeleteBoard}
                      onDuplicate={handleDuplicate}
                      onEdit={handleEdit}
                      onView={handleView}
                      onSetAsActive={handleSetAsActive}
                      onDeactivate={async () => {
                        // Inline deactivate handler
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
                      }}
                      isCurrentVision={currentVisionId === board._id}
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">What's your dream?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Add a title and a short description to start your new vision board.</p>

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
                      placeholder="Briefly describe what you want to achieve..."
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



