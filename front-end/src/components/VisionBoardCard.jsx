import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Calendar, LayoutGrid, X, Move, Eye } from "lucide-react";
import { visionBoardAPI } from "../services/api";

const VisionBoardCard = ({ visionBoard, onDelete, onLayoutUpdate }) => {
  // UI state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentLayout, setCurrentLayout] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [dragMode, setDragMode] = useState("view"); // "view", "image", or "note"

  // Data & layout state
  const [imageMetadata, setImageMetadata] = useState([]);
  const [optimizedLayout, setOptimizedLayout] = useState(null);
  const [customLayout, setCustomLayout] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedNoteIdx, setDraggedNoteIdx] = useState(null);
  const [noteOrder, setNoteOrder] = useState([0, 1, 2]); // order of sticky notes

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(visionBoard._id);
    } catch (err) {
      console.error("Error deleting vision board:", err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ---------------------------------------------------------------------
  // Load image dimensions & saved custom layouts
  // ---------------------------------------------------------------------
  useEffect(() => {
    const loadImageDimensions = async () => {
      const metadata = await Promise.all(
        visionBoard.images.map((img) => {
          return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
              const ar = image.width / image.height;
              resolve({
                ...img,
                width: image.width,
                height: image.height,
                aspectRatio: ar,
                isWide: ar > 1.3,
                isTall: ar < 0.7,
                isSquare: ar >= 0.7 && ar <= 1.3,
              });
            };
            image.onerror = () => {
              resolve({
                ...img,
                width: 1,
                height: 1,
                aspectRatio: 1,
                isSquare: true,
              });
            };
            image.src = img.url;
          });
        })
      );
      setImageMetadata(metadata);

      const optimized = optimizeImagePlacement(metadata);
      setOptimizedLayout(optimized);

      if (visionBoard.customLayouts) {
        const saved = {};
        Object.entries(visionBoard.customLayouts).forEach(([idx, order]) => {
          saved[idx] = order;
        });
        if (saved[currentLayout]) {
          const base = optimized[currentLayout];
          const custom = saved[currentLayout].map((imgIdx, posIdx) => ({
            gridArea: base[posIdx].gridArea,
            index: imgIdx,
          }));
          setCustomLayout(custom);
        }
      }

      // Load persisted note order for the current layout
      const storageKey = `visionBoard_${visionBoard._id}_layout_${currentLayout}_noteOrder`;
      try {
        const savedNoteOrder = JSON.parse(localStorage.getItem(storageKey));
        if (Array.isArray(savedNoteOrder) && savedNoteOrder.length === 3) {
          setNoteOrder(savedNoteOrder);
        }
      } catch (err) {
        // ignore errors, keep default order
      }
    };
    loadImageDimensions();
  }, [visionBoard.images, visionBoard.customLayouts, currentLayout]);

  // ---------------------------------------------------------------------
  // Layout generation logic (unchanged from original implementation)
  // ---------------------------------------------------------------------
  const optimizeImagePlacement = (metadata) => {
    const layoutRequirements = [
      // Layout 1 – Magazine
      [
        { gridArea: "1 / 1 / 3 / 3", preferWide: true, preferTall: false },
        { gridArea: "1 / 3 / 2 / 4", preferWide: false, preferTall: true },
        { gridArea: "2 / 3 / 3 / 4", preferWide: false, preferTall: true },
        { gridArea: "3 / 1 / 4 / 2", preferWide: false, preferTall: false },
        { gridArea: "3 / 2 / 5 / 4", preferWide: true, preferTall: false },
        { gridArea: "4 / 1 / 5 / 2", preferWide: false, preferTall: false },
        { gridArea: "5 / 1 / 6 / 2", preferWide: false, preferTall: false },
        { gridArea: "5 / 2 / 6 / 3", preferWide: false, preferTall: false },
        { gridArea: "5 / 3 / 6 / 4", preferWide: false, preferTall: false },
      ],
      // Layout 2 – Pyramid
      [
        { gridArea: "1 / 1 / 2 / 2", preferWide: false, preferTall: false },
        { gridArea: "1 / 2 / 3 / 4", preferWide: true, preferTall: false },
        { gridArea: "2 / 1 / 3 / 2", preferWide: false, preferTall: true },
        { gridArea: "3 / 1 / 5 / 3", preferWide: true, preferTall: false },
        { gridArea: "3 / 3 / 4 / 4", preferWide: false, preferTall: true },
        { gridArea: "4 / 3 / 5 / 4", preferWide: false, preferTall: true },
        { gridArea: "5 / 1 / 6 / 2", preferWide: false, preferTall: false },
        { gridArea: "5 / 2 / 6 / 3", preferWide: false, preferTall: false },
        { gridArea: "5 / 3 / 6 / 4", preferWide: false, preferTall: false },
      ],
      // Layout 3 – Scattered
      [
        { gridArea: "1 / 1 / 3 / 2", preferWide: false, preferTall: true },
        { gridArea: "1 / 2 / 2 / 4", preferWide: true, preferTall: false },
        { gridArea: "2 / 2 / 3 / 3", preferWide: false, preferTall: false },
        { gridArea: "2 / 3 / 4 / 4", preferWide: false, preferTall: true },
        { gridArea: "3 / 1 / 4 / 2", preferWide: false, preferTall: false },
        { gridArea: "3 / 2 / 4 / 3", preferWide: false, preferTall: false },
        { gridArea: "4 / 1 / 5 / 3", preferWide: true, preferTall: false },
        { gridArea: "4 / 3 / 5 / 4", preferWide: false, preferTall: false },
        { gridArea: "5 / 1 / 6 / 4", preferWide: true, preferTall: false },
      ],
    ];

    const assignImages = (requirements) => {
      const assigned = new Array(9).fill(null);
      const used = new Set();
      // First pass – strong matches
      requirements.forEach((req, posIdx) => {
        let bestScore = -1;
        let bestIdx = -1;
        metadata.forEach((img, imgIdx) => {
          if (used.has(imgIdx)) return;
          let score = 0;
          if (req.preferWide && img.isWide) score += 3;
          if (req.preferTall && img.isTall) score += 3;
          if (!req.preferWide && !req.preferTall && img.isSquare) score += 2;
          if (score > bestScore) {
            bestScore = score;
            bestIdx = imgIdx;
          }
        });
        if (bestScore >= 2 && bestIdx !== -1) {
          assigned[posIdx] = bestIdx;
          used.add(bestIdx);
        }
      });
      // Second pass – fill remaining slots
      const unused = metadata.map((_, i) => i).filter((i) => !used.has(i));
      assigned.forEach((val, posIdx) => {
        if (val === null && unused.length) {
          assigned[posIdx] = unused.shift();
        }
      });
      return assigned.map((imgIdx, posIdx) => ({
        gridArea: requirements[posIdx].gridArea,
        index: imgIdx,
      }));
    };

    return layoutRequirements.map(assignImages);
  };

  const layouts = [
    // Magazine fallback
    [
      { gridArea: "1 / 1 / 3 / 3", index: 0 },
      { gridArea: "1 / 3 / 2 / 4", index: 1 },
      { gridArea: "2 / 3 / 3 / 4", index: 2 },
      { gridArea: "3 / 1 / 4 / 2", index: 3 },
      { gridArea: "3 / 2 / 5 / 4", index: 4 },
      { gridArea: "4 / 1 / 5 / 2", index: 5 },
      { gridArea: "5 / 1 / 6 / 2", index: 6 },
      { gridArea: "5 / 2 / 6 / 3", index: 7 },
      { gridArea: "5 / 3 / 6 / 4", index: 8 },
    ],
    // Pyramid fallback
    [
      { gridArea: "1 / 1 / 2 / 2", index: 0 },
      { gridArea: "1 / 2 / 3 / 4", index: 1 },
      { gridArea: "2 / 1 / 3 / 2", index: 2 },
      { gridArea: "3 / 1 / 5 / 3", index: 3 },
      { gridArea: "3 / 3 / 4 / 4", index: 4 },
      { gridArea: "4 / 3 / 5 / 4", index: 5 },
      { gridArea: "5 / 1 / 6 / 2", index: 6 },
      { gridArea: "5 / 2 / 6 / 3", index: 7 },
      { gridArea: "5 / 3 / 6 / 4", index: 8 },
    ],
    // Scattered fallback
    [
      { gridArea: "1 / 1 / 3 / 2", index: 0 },
      { gridArea: "1 / 2 / 2 / 4", index: 1 },
      { gridArea: "2 / 2 / 3 / 3", index: 2 },
      { gridArea: "2 / 3 / 4 / 4", index: 3 },
      { gridArea: "3 / 1 / 4 / 2", index: 4 },
      { gridArea: "3 / 2 / 4 / 3", index: 5 },
      { gridArea: "4 / 1 / 5 / 3", index: 6 },
      { gridArea: "4 / 3 / 5 / 4", index: 7 },
      { gridArea: "5 / 1 / 6 / 4", index: 8 },
    ],
  ];

  // ---------------------------------------------------------------------
  // Drag‑and‑drop handlers for images
  // ---------------------------------------------------------------------
  const handleDragStart = (e, positionIdx) => {
    if (dragMode !== "image") return;
    setDraggedIndex(positionIdx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    if (dragMode !== "image") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetIdx) => {
    if (dragMode !== "image") return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) {
      setDraggedIndex(null);
      return;
    }
    const base = customLayout || (optimizedLayout ? optimizedLayout[currentLayout] : layouts[currentLayout]);
    const newLayout = base.map((cfg, i) => {
      if (i === draggedIndex) {
        return { ...cfg, index: base[targetIdx].index };
      }
      if (i === targetIdx) {
        return { ...cfg, index: base[draggedIndex].index };
      }
      return cfg;
    });
    setCustomLayout(newLayout);
    setDraggedIndex(null);
    try {
      const order = newLayout.map((c) => c.index);
      const result = await visionBoardAPI.updateLayout(visionBoard._id, currentLayout, order);
      if (onLayoutUpdate && result?.visionBoard) {
        onLayoutUpdate(result.visionBoard);
      }
    } catch (err) {
      console.error("Failed to save custom layout:", err);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // ---------------------------------------------------------------------
  // Drag‑and‑drop handlers for sticky notes (with persistence)
  // ---------------------------------------------------------------------
  const handleNoteDragStart = (e, notePosIdx) => {
    if (dragMode !== "note") return;
    setDraggedNoteIdx(notePosIdx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleNoteDragOver = (e) => {
    if (dragMode !== "note") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleNoteDrop = (e, targetPosIdx) => {
    if (dragMode !== "note") return;
    e.preventDefault();
    if (draggedNoteIdx === null || draggedNoteIdx === targetPosIdx) {
      setDraggedNoteIdx(null);
      return;
    }
    const newOrder = [...noteOrder];
    const temp = newOrder[draggedNoteIdx];
    newOrder[draggedNoteIdx] = newOrder[targetPosIdx];
    newOrder[targetPosIdx] = temp;
    setNoteOrder(newOrder);
    // Persist to localStorage
    const storageKey = `visionBoard_${visionBoard._id}_layout_${currentLayout}_noteOrder`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
    } catch (err) {
      console.warn('Failed to persist note order:', err);
    }
    setDraggedNoteIdx(null);
  };

  const handleNoteDragEnd = () => {
    setDraggedNoteIdx(null);
  };

  // ---------------------------------------------------------------------
  // Layout selector (load persisted note order)
  // ---------------------------------------------------------------------
  const handleLayoutChange = (layoutIdx) => {
    setCurrentLayout(layoutIdx);
    // Load note order from localStorage for the new layout
    const storageKey = `visionBoard_${visionBoard._id}_layout_${layoutIdx}_noteOrder`;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved) && saved.length === 3) {
        setNoteOrder(saved);
      } else {
        setNoteOrder([0, 1, 2]);
      }
    } catch (err) {
      setNoteOrder([0, 1, 2]);
    }

    if (visionBoard.customLayouts && optimizedLayout) {
      const savedLayouts = {};
      Object.entries(visionBoard.customLayouts).forEach(([k, v]) => {
        savedLayouts[k] = v;
      });
      if (savedLayouts[layoutIdx]) {
        const base = optimizedLayout[layoutIdx];
        const custom = savedLayouts[layoutIdx].map((imgIdx, posIdx) => ({
          gridArea: base[posIdx].gridArea,
          index: imgIdx,
        }));
        setCustomLayout(custom);
      } else {
        setCustomLayout(null);
      }
    } else {
      setCustomLayout(null);
    }
  };

  const currentLayoutConfig = customLayout || (optimizedLayout ? optimizedLayout[currentLayout] : layouts[currentLayout]);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
    >
      {/* Header */}
      <div className="px-6 py-4" style={{ background: "linear-gradient(to right, #f59f0a, #d97706)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 
              className="text-xl font-bold text-white cursor-pointer hover:text-yellow-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullscreen(true);
              }}
            >
              {visionBoard.title}
            </h3>
            <div className="flex items-center gap-2 mt-1" style={{ color: "#fef3c7" }}>
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDate(visionBoard.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Layout selector */}
            <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLayoutChange(idx);
                  }}
                  className={`p-1.5 rounded transition-colors ${currentLayout === idx ? "bg-white text-amber-600" : "text-white hover:bg-white/30"}`}
                  title={`Layout ${idx + 1}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              ))}
            </div>
            {/* Delete button (icon only) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              disabled={deleting}
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
            {/* Mode toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDragMode((prev) => {
                  if (prev === "view") return "image";
                  if (prev === "image") return "note";
                  return "view";
                });
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title={
                dragMode === "view" 
                  ? "Click images to expand" 
                  : dragMode === "image" 
                    ? "Drag images" 
                    : "Drag notes"
              }
            >
              {dragMode === "view" ? (
                <Eye className="w-5 h-5 text-white" />
              ) : (
                <Move className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {showFullscreen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="mb-4 px-2">
              <h2 className="text-2xl font-bold text-white">{visionBoard.title}</h2>
              <div className="flex items-center gap-2 mt-2 text-gray-300">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formatDate(visionBoard.createdAt)}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              <div
                className="grid gap-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gridTemplateRows: "repeat(5, 100px)",
                }}
              >
                {currentLayoutConfig.map((cfg, idx) => {
                  const img = visionBoard.images[cfg.index];
                  const isDragging = draggedIndex === idx;
                  // Prepare sticky note text
                  let sentences = [];
                  if (visionBoard.textContent && visionBoard.textContent.trim().length > 0) {
                    sentences = visionBoard.textContent
                      .split(/[.!?]+/)
                      .filter((s) => s.trim().length > 0)
                      .map((s) => s.trim());
                  }
                  const textPositions = { 0: [2, 4, 7], 1: [1, 3, 5], 2: [0, 4, 6] };
                  const posArray = textPositions[currentLayout] || [];
                  const notePosIdx = posArray.indexOf(idx);
                  const noteIdx = notePosIdx !== -1 ? noteOrder[notePosIdx] : null;
                  const noteText = noteIdx !== null ? sentences[noteIdx] : null;

                  return (
                    <div
                      key={img._id || idx}
                      draggable={dragMode === "image"}
                      onDragStart={dragMode === "image" ? (e) => handleDragStart(e, idx) : undefined}
                      onDragOver={dragMode === "image" ? handleDragOver : undefined}
                      onDrop={dragMode === "image" ? (e) => handleDrop(e, idx) : undefined}
                      onDragEnd={dragMode === "image" ? handleDragEnd : undefined}
                      className={`relative overflow-hidden rounded-xl group transition-all ${
                        isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
                      } ${dragMode === "view" ? "cursor-pointer" : "cursor-move"}`}
                      style={{ gridArea: cfg.gridArea }}
                    >
                      <img
                        src={img.url}
                        alt={`Vision ${img.order}`}
                        className={`w-full h-full object-cover object-center transition-transform group-hover:scale-105 ${
                          dragMode === "view" ? "cursor-pointer" : "cursor-move"
                        }`}
                        onClick={(e) => {
                          if (dragMode === "view") {
                            e.stopPropagation();
                            setSelectedImage(img);
                            setShowImagePopup(true);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-none" />
                      {noteText && (
                        <div
                          className="absolute top-2 left-2 bg-yellow-200 bg-opacity-90 p-2 rounded shadow-md"
                          style={{
                            maxWidth: "90%",
                            transform: "rotate(-2deg)",
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "0.9rem",
                            lineHeight: "1.2",
                          }}
                          draggable={dragMode === "note"}
                          onDragStart={(e) => handleNoteDragStart(e, notePosIdx)}
                          onDragOver={handleNoteDragOver}
                          onDrop={(e) => handleNoteDrop(e, notePosIdx)}
                          onDragEnd={handleNoteDragEnd}
                        >
                          {noteText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Individual Image Popup Modal */}
      {showImagePopup && selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowImagePopup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowImagePopup(false)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Image container */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Image */}
              <div className="relative max-h-[70vh] flex items-center justify-center bg-gray-100">
                <img
                  src={selectedImage.url}
                  alt={`Vision ${selectedImage.order}`}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
              
              {/* Image info footer */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Image {selectedImage.order + 1}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedImage.width && selectedImage.height 
                        ? `${selectedImage.width} × ${selectedImage.height} pixels`
                        : 'Vision board image'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // Download image functionality
                        const link = document.createElement('a');
                        link.href = selectedImage.url;
                        link.download = `vision-board-${visionBoard.title}-image-${selectedImage.order + 1}.jpg`;
                        link.click();
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Grid of images (non‑fullscreen) */}
      <div
        className="grid gap-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(5, 100px)",
        }}
      >
        {currentLayoutConfig.map((cfg, idx) => {
          const img = visionBoard.images[cfg.index];
          const isDragging = draggedIndex === idx;
          let sentences = [];
          if (visionBoard.textContent && visionBoard.textContent.trim().length > 0) {
            sentences = visionBoard.textContent
              .split(/[.!?]+/)
              .filter((s) => s.trim().length > 0)
              .map((s) => s.trim());
          }
          const textPositions = { 0: [2, 4, 7], 1: [1, 3, 5], 2: [0, 4, 6] };
          const posArray = textPositions[currentLayout] || [];
          const notePosIdx = posArray.indexOf(idx);
          const noteIdx = notePosIdx !== -1 ? noteOrder[notePosIdx] : null;
          const noteText = noteIdx !== null ? sentences[noteIdx] : null;

          return (
            <div
              key={img._id || idx}
              draggable={dragMode === "image"}
              onDragStart={dragMode === "image" ? (e) => handleDragStart(e, idx) : undefined}
              onDragOver={dragMode === "image" ? handleDragOver : undefined}
              onDrop={dragMode === "image" ? (e) => handleDrop(e, idx) : undefined}
              onDragEnd={dragMode === "image" ? handleDragEnd : undefined}
              className={`relative overflow-hidden rounded-xl group transition-all ${
                isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"
              } ${dragMode === "view" ? "cursor-pointer" : "cursor-move"}`}
              style={{ gridArea: cfg.gridArea }}
            >
              <img
                src={img.url}
                alt={`Vision ${img.order}`}
                className={`w-full h-full object-cover object-center transition-transform group-hover:scale-105 ${
                  dragMode === "view" ? "cursor-pointer" : "cursor-move"
                }`}
                onClick={(e) => {
                  if (dragMode === "view") {
                    e.stopPropagation();
                    setSelectedImage(img);
                    setShowImagePopup(true);
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-none" />
              {noteText && (
                <div
                  className="absolute top-2 left-2 bg-yellow-200 bg-opacity-90 p-2 rounded shadow-md"
                  style={{
                    maxWidth: "90%",
                    transform: "rotate(-2deg)",
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "0.9rem",
                    lineHeight: "1.2",
                  }}
                  draggable={dragMode === "note"}
                  onDragStart={(e) => handleNoteDragStart(e, notePosIdx)}
                  onDragOver={handleNoteDragOver}
                  onDrop={(e) => handleNoteDrop(e, notePosIdx)}
                  onDragEnd={handleNoteDragEnd}
                >
                  {noteText}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">Delete Vision Board?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{visionBoard.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default VisionBoardCard;
