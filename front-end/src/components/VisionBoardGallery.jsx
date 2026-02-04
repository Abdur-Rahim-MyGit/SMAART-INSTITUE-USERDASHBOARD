import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Image as ImageIcon,
  X,
  Trash2,
  Edit3,
  Eye,
  Upload,
  Loader2,
  MoreVertical,
  Calendar,
  Images,
  AlertCircle,
} from "lucide-react";

// Dynamic API URL based on hostname
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// ═══════════════════════════════════════════════════════════════════════════
// VISION BOARD CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const VisionBoardCard = React.forwardRef(
  ({ board, onEdit, onDelete, onView }, ref) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setShowMenu(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const images = board.images || [];
    const hasThumbnail = board.thumbnail && board.thumbnail.url;

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="group overflow-hidden bg-white border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300">
          {/* Thumbnail or Image Grid */}
          <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            {hasThumbnail ? (
              // Show the complete board thumbnail
              <img
                src={board.thumbnail.url}
                alt={board.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : images.length > 0 ? (
              // Fallback to image grid for older boards
              <div className="grid grid-cols-2 grid-rows-2 h-full gap-0.5 p-0.5">
                {images.slice(0, 4).map((image, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden bg-gray-200"
                  >
                    <img
                      src={image.url}
                      alt={image.alt || `Vision board image ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {idx === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">
                          +{images.length - 4} more
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {images.length < 4 &&
                  [...Array(4 - images.length)].map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="bg-gray-100 flex items-center justify-center"
                    >
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <Images className="w-12 h-12 mb-2" />
                <span className="text-sm">No preview available</span>
              </div>
            )}

            {/* Template badge */}
            {board.templateName && board.templateName !== "Custom" && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-teal-500/90 text-white text-xs font-medium rounded-md">
                {board.templateName}
              </div>
            )}

            {/* Hover overlay with View button */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onView(board)}
                className="bg-white/90 hover:bg-white shadow-lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </div>

            {/* Menu Button */}
            <div className="absolute top-2 right-2" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                  >
                    <button
                      onClick={() => {
                        onEdit(board);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDelete(board);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Card Content */}
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 text-lg truncate mb-1">
              {board.title}
            </h3>
            {board.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {board.description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(board.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Images className="w-3 h-3" />
                <span>{images.length} images</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

VisionBoardCard.displayName = "VisionBoardCard";

// ═══════════════════════════════════════════════════════════════════════════
// CREATE/EDIT MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const VisionBoardModal = ({ isOpen, onClose, onSave, editingBoard = null }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const isEditing = !!editingBoard;

  // Initialize form when editing
  useEffect(() => {
    if (editingBoard) {
      setTitle(editingBoard.title || "");
      setDescription(editingBoard.description || "");
      setExistingImages(editingBoard.images || []);
      setNewFiles([]);
      setPreviewUrls([]);
    } else {
      setTitle("");
      setDescription("");
      setExistingImages([]);
      setNewFiles([]);
      setPreviewUrls([]);
    }
    setError("");
  }, [editingBoard, isOpen]);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return false;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be less than 5MB");
        return false;
      }
      return true;
    });

    if (imageFiles.length === 0) return;

    setError("");
    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
    setNewFiles((prev) => [...prev, ...imageFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        existingImages,
        newFiles,
        boardId: editingBoard?._id,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save vision board");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {isEditing ? "Edit Vision Board" : "Create New Vision Board"}
            </h2>
            <p className="text-gray-600 mt-1">
              {isEditing
                ? "Update your vision board details and images"
                : "Give your vision board a title and add inspiring images"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Dream Goals"
              className="w-full"
              disabled={isLoading}
            />
          </div>

          {/* Description Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your vision board..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none h-20"
              disabled={isLoading}
            />
          </div>

          {/* Image Upload Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-300 hover:border-teal-400 hover:bg-gray-50"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={isLoading}
              />
              <Upload
                className={`w-10 h-10 mx-auto mb-3 ${
                  isDragging ? "text-teal-500" : "text-gray-400"
                }`}
              />
              <p className="text-gray-700 font-medium mb-1">
                Drag and drop images here
              </p>
              <p className="text-gray-500 text-sm">
                or click to browse (max 5MB per image)
              </p>
            </div>
          </div>

          {/* Image Previews */}
          {(existingImages.length > 0 || previewUrls.length > 0) && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected Images ({existingImages.length + previewUrls.length})
              </p>
              <div className="grid grid-cols-4 gap-3">
                {/* Existing Images */}
                {existingImages.map((image, idx) => (
                  <div key={`existing-${idx}`} className="relative group">
                    <img
                      src={image.url}
                      alt={image.alt || "Vision board image"}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeExistingImage(idx)}
                      disabled={isLoading}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* New Image Previews */}
                {previewUrls.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative group">
                    <img
                      src={url}
                      alt={`New image ${idx + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-teal-300"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-teal-500 text-white text-xs rounded">
                      New
                    </div>
                    <button
                      onClick={() => removeNewImage(idx)}
                      disabled={isLoading}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Saving..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Board"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DELETE CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════════════════

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  board,
  isLoading,
}) => {
  if (!isOpen || !board) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete Vision Board?
          </h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{board.title}"? This action cannot
            be undone and all images will be permanently removed.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => onConfirm(board._id)}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEW MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ViewModal = ({ isOpen, onClose, board }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [board]);

  if (!isOpen || !board) return null;

  const images = board.images || [];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-5xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">
            {board.title}
          </h2>
          {board.description && (
            <p className="text-gray-300">{board.description}</p>
          )}
        </div>

        {images.length > 0 ? (
          <>
            {/* Main Image */}
            <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden mb-4">
              <img
                src={images[selectedImageIndex]?.url}
                alt={images[selectedImageIndex]?.alt || "Vision board image"}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                {images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex
                        ? "border-teal-500 ring-2 ring-teal-500/50"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || `Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Images className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No images in this vision board</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GALLERY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const VisionBoardGallery = ({ userId }) => {
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [deletingBoard, setDeletingBoard] = useState(null);
  const [viewingBoard, setViewingBoard] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Fetch vision boards
  const fetchBoards = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/vision-boards?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch vision boards");
      }

      const data = await response.json();
      setBoards(data);
      setError("");
    } catch (err) {
      console.error("Error fetching vision boards:", err);
      setError("Failed to load vision boards. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Create or update vision board
  const handleSaveBoard = async ({
    title,
    description,
    existingImages,
    newFiles,
    boardId,
  }) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);

    if (boardId) {
      // Editing - include existing images
      formData.append("existingImages", JSON.stringify(existingImages));
    } else {
      // Creating - include userId
      formData.append("userId", userId);
    }

    // Add new files
    newFiles.forEach((file) => {
      formData.append("images", file);
    });

    const url = boardId
      ? `${API_BASE_URL}/vision-boards/${boardId}`
      : `${API_BASE_URL}/vision-boards`;

    const response = await fetch(url, {
      method: boardId ? "PUT" : "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to save vision board");
    }

    const savedBoard = await response.json();

    if (boardId) {
      setBoards((prev) =>
        prev.map((b) => (b._id === boardId ? savedBoard : b))
      );
      toast({
        title: "Vision Board Updated",
        description: "Your changes have been saved successfully.",
      });
    } else {
      setBoards((prev) => [savedBoard, ...prev]);
      toast({
        title: "Vision Board Created",
        description: "Your new vision board is ready!",
      });
    }

    setEditingBoard(null);
    setShowCreateModal(false);
  };

  // Delete vision board
  const handleDeleteBoard = async (boardId) => {
    setIsDeleting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/vision-boards/${boardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vision board");
      }

      setBoards((prev) => prev.filter((b) => b._id !== boardId));
      toast({
        title: "Vision Board Deleted",
        description: "The vision board has been permanently removed.",
      });
    } catch (err) {
      console.error("Error deleting vision board:", err);
      toast({
        title: "Error",
        description: "Failed to delete vision board. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingBoard(null);
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          Please log in to view your vision boards.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Vision Boards</h2>
          <p className="text-gray-600 mt-1">
            {boards.length} {boards.length === 1 ? "board" : "boards"} created
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Board
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchBoards}>
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && boards.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Images className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No vision boards yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first vision board to visualize your goals
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Board
          </Button>
        </div>
      )}

      {/* Responsive Grid */}
      {!isLoading && !error && boards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {boards.map((board) => (
              <VisionBoardCard
                key={board._id}
                board={board}
                onEdit={(b) => setEditingBoard(b)}
                onDelete={(b) => setDeletingBoard(b)}
                onView={(b) => setViewingBoard(b)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <VisionBoardModal
        isOpen={showCreateModal || !!editingBoard}
        onClose={() => {
          setShowCreateModal(false);
          setEditingBoard(null);
        }}
        onSave={handleSaveBoard}
        editingBoard={editingBoard}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingBoard}
        onClose={() => setDeletingBoard(null)}
        onConfirm={handleDeleteBoard}
        board={deletingBoard}
        isLoading={isDeleting}
      />

      {/* View Modal */}
      <ViewModal
        isOpen={!!viewingBoard}
        onClose={() => setViewingBoard(null)}
        board={viewingBoard}
      />
    </div>
  );
};

export default VisionBoardGallery;
