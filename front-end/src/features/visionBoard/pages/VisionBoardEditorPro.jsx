import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Image as ImageIcon,
  ChevronLeft,
  Loader2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
  Eye,
  X,
  Grid3X3,
  Palette,
  Settings2,
  Maximize,
  Check,
  Upload,
  Trash2,
  RefreshCw,
  Type,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  AlertTriangle,
} from "lucide-react";
import {
  GRID_TEMPLATES,
  ASPECT_RATIOS,
  EXPORT_RESOLUTIONS,
  BACKGROUND_COLORS,
  BORDER_RADIUS_PRESETS,
  GAP_PRESETS,
} from "../templates/gridTemplates";
import { createVisionBoard } from "../services/visionBoardProApi";
import {
  moderateText,
  moderateTextAsync,
  moderateTextOverlaysAsync,
  getModerationWarning,
  loadToxicityModel,
} from "../utils/contentModeration";
import {
  checkBase64ImageNSFW,
  preloadNSFWModel,
} from "../utils/imageModeration";

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE SLOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ImageSlot = ({
  slot,
  image,
  gap,
  borderRadius,
  isSelected,
  onSelect,
  onImageUpload,
  onImageUpdate,
  onImageRemove,
}) => {
  const fileInputRef = useRef(null);
  const slotRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState(null);
  const [initialScale, setInitialScale] = useState(1);

  // Gap in percentage based on canvas width
  const gapPercent = gap / 6; // Convert gap pixels to percentage

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageUpload(slot.id, event.target.result);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageUpload(slot.id, event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Calculate distance between two touch points
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get client coordinates from mouse or touch event
  const getClientCoords = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Image panning within slot - Mouse
  const handleMouseDown = (e) => {
    if (!image) return;
    e.preventDefault();
    const { clientX, clientY } = getClientCoords(e);
    setIsDragging(true);
    setDragStart({
      x: clientX - (image.position?.x || 0),
      y: clientY - (image.position?.y || 0),
    });
  };

  // Image panning within slot - Touch (with pinch-to-zoom support)
  const handleTouchStart = (e) => {
    if (!image) return;
    e.stopPropagation();

    // Check for pinch gesture (2 fingers)
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setInitialPinchDistance(distance);
      setInitialScale(image.scale || 1);
      return;
    }

    // Single finger - pan
    const { clientX, clientY } = getClientCoords(e);
    setIsDragging(true);
    setDragStart({
      x: clientX - (image.position?.x || 0),
      y: clientY - (image.position?.y || 0),
    });
  };

  // Handle zoom in/out (larger increments for mobile)
  const handleZoomIn = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!image) return;
    const currentScale = image.scale || 1;
    const newScale = Math.min(currentScale + 0.25, 4);
    onImageUpdate(slot.id, { scale: newScale });
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!image) return;
    const currentScale = image.scale || 1;
    const newScale = Math.max(currentScale - 0.25, 0.25);
    onImageUpdate(slot.id, { scale: newScale });
  };

  // Handle reset to fit
  const handleReset = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!image) return;
    onImageUpdate(slot.id, {
      scale: 1,
      position: { x: 0, y: 0 },
      rotation: 0
    });
  };

  // Handle rotation
  const handleRotateCW = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!image) return;
    const currentRotation = image.rotation || 0;
    onImageUpdate(slot.id, { rotation: currentRotation + 90 });
  };

  useEffect(() => {
    if (!image) return;

    const handleTouchMove = (e) => {
      // Pinch-to-zoom
      if (e.touches.length === 2 && initialPinchDistance) {
        e.preventDefault();
        const newDistance = getTouchDistance(e.touches);
        if (newDistance) {
          const scaleFactor = newDistance / initialPinchDistance;
          const newScale = Math.min(Math.max(initialScale * scaleFactor, 0.25), 4);
          onImageUpdate(slot.id, { scale: newScale });
        }
        return;
      }

      // Single finger pan
      if (isDragging && e.touches.length === 1) {
        const { clientX, clientY } = getClientCoords(e);
        const newX = clientX - dragStart.x;
        const newY = clientY - dragStart.y;
        onImageUpdate(slot.id, { position: { x: newX, y: newY } });
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onImageUpdate(slot.id, { position: { x: newX, y: newY } });
    };

    const handleEnd = () => {
      setIsDragging(false);
      setInitialPinchDistance(null);
    };

    // Mouse events
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    // Touch events
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [isDragging, dragStart, image, slot.id, onImageUpdate, initialPinchDistance, initialScale]);

  // Pure percentage-based positioning matching gridTemplates.js structure
  const slotStyle = {
    position: "absolute",
    left: `calc(${slot.x}% + ${gapPercent / 2}%)`,
    top: `calc(${slot.y}% + ${gapPercent / 2}%)`,
    width: `calc(${slot.width}% - ${gapPercent}%)`,
    height: `calc(${slot.height}% - ${gapPercent}%)`,
    borderRadius: `${borderRadius}px`,
    overflow: "hidden",
    zIndex: 10,
  };

  return (
    <div
      ref={slotRef}
      style={slotStyle}
      className={`relative transition-all ${isSelected ? "ring-2 ring-teal-500 ring-offset-2" : ""
        } ${!image ? "bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slot.id);
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {image ? (
        // Image display with pan/zoom support (touch + mouse)
        <div
          className="absolute inset-0 cursor-move overflow-hidden flex items-center justify-center touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ backgroundColor: "transparent" }}
        >
          <img
            src={image.url}
            alt={`Slot ${slot.id}`}
            draggable={false}
            className="pointer-events-none select-none"
            style={{
              maxWidth: "none",
              maxHeight: "none",
              width: "auto",
              height: "auto",
              minWidth: "100%",
              minHeight: "100%",
              objectFit: "contain",
              position: "absolute",
              left: `calc(50% + ${image.position?.x || 0}px)`,
              top: `calc(50% + ${image.position?.y || 0}px)`,
              transform: `translate(-50%, -50%) scale(${image.scale || 1}) rotate(${image.rotation || 0}deg)`,
              transformOrigin: "center center",
            }}
          />

          {/* Image controls overlay - only when selected */}
          {isSelected && (
            <>
              {/* Top right controls - Delete & Replace */}
              <div className="absolute top-1 right-1 flex gap-1 z-10">
                <button
                  className="w-7 h-7 sm:w-6 sm:h-6 bg-white/90 hover:bg-white active:bg-slate-100 dark:active:bg-white/10 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageRemove(slot.id);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onImageRemove(slot.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-red-500" />
                </button>
                <button
                  className="w-7 h-7 sm:w-6 sm:h-6 bg-white/90 hover:bg-white active:bg-slate-100 dark:active:bg-white/10 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-slate-600" />
                </button>
              </div>

              {/* Bottom controls - Zoom, Rotate & Reset (compact for inline) */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1 z-10 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-1 box-content shadow-lg border border-white/10 w-max max-w-[90%] overflow-x-auto no-scrollbar">
                <button
                  className="w-6 h-6 bg-white/90 hover:bg-white active:bg-slate-100 dark:active:bg-white/10 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0"
                  onClick={handleZoomOut}
                  onTouchEnd={handleZoomOut}
                >
                  <ZoomOut className="w-3 h-3 text-slate-700" />
                </button>
                <span className="flex items-center justify-center text-white text-[10px] font-medium min-w-[32px] font-mono">
                  {Math.round((image.scale || 1) * 100)}%
                </span>
                <button
                  className="w-6 h-6 bg-white/90 hover:bg-white active:bg-slate-100 dark:active:bg-white/10 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0"
                  onClick={handleZoomIn}
                  onTouchEnd={handleZoomIn}
                >
                  <ZoomIn className="w-3 h-3 text-slate-700" />
                </button>
                <div className="w-px h-4 bg-white/30 self-center shrink-0" />
                <button
                  className="w-6 h-6 bg-white/90 hover:bg-white active:bg-slate-100 dark:active:bg-white/10 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0"
                  onClick={handleRotateCW}
                  onTouchEnd={handleRotateCW}
                >
                  <RotateCw className="w-3 h-3 text-slate-700" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        // Empty slot - tap/click to upload (mobile-friendly)
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-600 active:bg-slate-200/60 dark:text-white/60 dark:hover:text-white/80 dark:active:bg-white/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            fileInputRef.current?.click();
          }}
        >
          <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 opacity-50" />
          <span className="text-[10px] sm:text-xs font-medium">Tap to Add</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const TemplateSelector = ({ selectedTemplate, onSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.values(GRID_TEMPLATES).map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`relative p-2 rounded-lg border transition-all aspect-square group ${selectedTemplate === template.id
            ? "border-[#30919D] bg-[#30919D]/10 ring-1 ring-[#30919D]/30"
            : "border-slate-200 dark:border-white/10 hover:border-[#30919D]/50 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10"
            }`}
        >
          {/* Mini preview of template */}
          <div className="w-full h-full relative">
            {template.slots.map((slot, i) => (
              <div
                key={i}
                className={`absolute transition-colors ${selectedTemplate === template.id
                  ? "bg-[#30919D]/50 border border-[#30919D]/30"
                  : "bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/5 group-hover:bg-slate-300 dark:group-hover:bg-white/20"
                  }`}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width - 2}%`,
                  height: `${slot.height - 2}%`,
                  borderRadius: "2px",
                }}
              />
            ))}
          </div>
          {selectedTemplate === template.id && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#30919D] rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#001a38]">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY DATA & COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Font Categories for Vision Boards
const FONT_CATEGORIES = {
  script: {
    name: "Inspirational Script",
    icon: "✨",
    color: "from-rose-400 to-pink-500",
    description: "Elegant, flowing fonts for affirmations",
    fonts: [
      {
        name: "Caveat",
        family: "'Caveat', cursive",
        preview: "Dream Big",
        useCase: "Personal affirmations",
      },
      {
        name: "Dancing Script",
        family: "'Dancing Script', cursive",
        preview: "Believe",
        useCase: "Romantic goals",
      },
      {
        name: "Pacifico",
        family: "'Pacifico', cursive",
        preview: "Create",
        useCase: "Creative goals",
      },
      {
        name: "Great Vibes",
        family: "'Great Vibes', cursive",
        preview: "Manifest",
        useCase: "Personal mantras",
      },
      {
        name: "Sacramento",
        family: "'Sacramento', cursive",
        preview: "Inspire",
        useCase: "Elegant quotes",
      },
      {
        name: "Satisfy",
        family: "'Satisfy', cursive",
        preview: "Grateful",
        useCase: "Gratitude statements",
      },
    ],
  },
  bold: {
    name: "Bold Statement",
    icon: "💪",
    color: "from-slate-700 to-gray-900",
    description: "Powerful fonts for goals and headlines",
    fonts: [
      {
        name: "Montserrat Bold",
        family: "'Montserrat', sans-serif",
        weight: "900",
        preview: "ACHIEVE",
        useCase: "Major goals",
      },
      {
        name: "Oswald",
        family: "'Oswald', sans-serif",
        weight: "700",
        preview: "SUCCESS",
        useCase: "Headlines",
      },
      {
        name: "Anton",
        family: "'Anton', sans-serif",
        preview: "POWER",
        useCase: "Fitness goals",
      },
      {
        name: "Bebas Neue",
        family: "'Bebas Neue', sans-serif",
        preview: "FOCUS",
        useCase: "Sports goals",
      },
      {
        name: "Righteous",
        family: "'Righteous', cursive",
        preview: "SHINE",
        useCase: "Entertainment",
      },
    ],
  },
  minimal: {
    name: "Minimal Modern",
    icon: "◯",
    color: "from-teal-400 to-cyan-500",
    description: "Clean fonts for minimalist boards",
    fonts: [
      {
        name: "Raleway Light",
        family: "'Raleway', sans-serif",
        weight: "200",
        preview: "simplicity",
        useCase: "Wellness",
      },
      {
        name: "Quicksand",
        family: "'Quicksand', sans-serif",
        weight: "300",
        preview: "breathe",
        useCase: "Meditation",
      },
      {
        name: "Poppins",
        family: "'Poppins', sans-serif",
        weight: "300",
        preview: "balance",
        useCase: "Productivity",
      },
      {
        name: "Inter",
        family: "'Inter', sans-serif",
        weight: "300",
        preview: "focus",
        useCase: "Tech goals",
      },
    ],
  },
  cutout: {
    name: "Magazine Cutout",
    icon: "✂️",
    color: "from-amber-400 to-orange-500",
    description: "Playful scrapbook-style fonts",
    fonts: [
      {
        name: "Permanent Marker",
        family: "'Permanent Marker', cursive",
        preview: "DREAM!",
        useCase: "Fun goals",
      },
      {
        name: "Indie Flower",
        family: "'Indie Flower', cursive",
        preview: "adventure",
        useCase: "Travel dreams",
      },
      {
        name: "Amatic SC",
        family: "'Amatic SC', cursive",
        weight: "700",
        preview: "CREATE",
        useCase: "Art projects",
      },
      {
        name: "Special Elite",
        family: "'Special Elite', cursive",
        preview: "stories",
        useCase: "Writing goals",
      },
    ],
  },
  retro: {
    name: "Retro Vintage",
    icon: "🌅",
    color: "from-orange-400 to-rose-500",
    description: "Nostalgic fonts with warm vibes",
    fonts: [
      {
        name: "Lobster",
        family: "'Lobster', cursive",
        preview: "Good Vibes",
        useCase: "Lifestyle",
      },
      {
        name: "Playfair Display",
        family: "'Playfair Display', serif",
        style: "italic",
        preview: "Elegance",
        useCase: "Luxury goals",
      },
      {
        name: "Poiret One",
        family: "'Poiret One', cursive",
        preview: "GOLDEN",
        useCase: "Success visualization",
      },
    ],
  },
};

// Text Effects
const TEXT_EFFECTS = [
  { id: "none", name: "None", icon: "—" },
  {
    id: "shadow",
    name: "Shadow",
    icon: "◐",
    style: { textShadow: "2px 2px 4px rgba(0,0,0,0.3)" },
  },
  {
    id: "outline",
    name: "Outline",
    icon: "◇",
    style: {
      WebkitTextStroke: "1px currentColor",
      WebkitTextFillColor: "transparent",
    },
  },
  {
    id: "glow",
    name: "Glow",
    icon: "✦",
    style: { textShadow: "0 0 10px currentColor, 0 0 20px currentColor" },
  },
  {
    id: "3d",
    name: "3D",
    icon: "▣",
    style: { textShadow: "1px 1px 0 #888, 2px 2px 0 #777, 3px 3px 0 #666" },
  },
  {
    id: "neon",
    name: "Neon",
    icon: "💡",
    style: {
      textShadow:
        "0 0 5px #fff, 0 0 10px #fff, 0 0 15px currentColor, 0 0 20px currentColor",
    },
  },
];

// Text Colors
const TEXT_COLORS = [
  "#000000",
  "#FFFFFF",
  "#1F2937",
  "#4B5563",
  "#9CA3AF",
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#CA8A04",
  "#65A30D",
  "#16A34A",
  "#0D9488",
  "#0891B2",
  "#2563EB",
  "#7C3AED",
  "#C026D3",
  "#DB2777",
  "#E11D48",
];

// Typography Panel Component
const TypographyPanel = ({
  onAddText,
  textOverlays,
  onUpdateText,
  onDeleteText,
  selectedTextId,
  onSelectText,
}) => {
  const [expandedCategory, setExpandedCategory] = useState("script");
  const [showEffects, setShowEffects] = useState(false);

  return (
    <div className="space-y-4">
      {/* Google Fonts Link */}
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Pacifico&family=Great+Vibes&family=Montserrat:wght@200;400;700;900&family=Oswald:wght@400;700&family=Anton&family=Bebas+Neue&family=Raleway:wght@200;400&family=Quicksand:wght@300;400;500&family=Poppins:wght@300;400;500;600&family=Inter:wght@300;400;500&family=Permanent+Marker&family=Indie+Flower&family=Amatic+SC:wght@400;700&family=Special+Elite&family=Lobster&family=Righteous&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poiret+One&family=Sacramento&family=Satisfy&display=swap"
        rel="stylesheet"
      />

      {/* Add Text Button */}
      <button
        onClick={() =>
          onAddText({
            text: "Your Text Here",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 32,
            fontWeight: "700",
            color: "#FFFFFF",
            effect: "none",
            position: { x: 50, y: 50 },
            align: "center",
            rotation: 0,
          })
        }
        className="w-full py-4 bg-gradient-to-r from-[#30919D] to-[#267a84] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-[#267a84] hover:to-[#1f6670] transition-all shadow-lg hover:shadow-[#30919D]/40 hover:-translate-y-0.5"
      >
        <Plus className="w-5 h-5" />
        Add Text Overlay
      </button>

      {/* Active Text Editor */}
      {selectedTextId && textOverlays[selectedTextId] && (
        <div className="bg-white/90 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#30919D] flex items-center gap-2">
              <Type className="w-4 h-4" /> Editing Text
            </span>
            <button
              onClick={() => onDeleteText(selectedTextId)}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Delete text"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={textOverlays[selectedTextId].text}
            onChange={(e) =>
              onUpdateText(selectedTextId, { text: e.target.value })
            }
            className="w-full px-3 py-2.5 text-sm border rounded-lg mb-4 bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#30919D]/50 focus:ring-1 focus:ring-[#30919D]/50 outline-none transition-all"
            placeholder="Enter your text..."
          />

          {/* Font Size */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium text-slate-600 dark:text-white/60 w-12">Size</span>
            <input
              type="range"
              min="12"
              max="120"
              value={textOverlays[selectedTextId].fontSize}
              onChange={(e) =>
                onUpdateText(selectedTextId, {
                  fontSize: parseInt(e.target.value),
                })
              }
              className="flex-1 accent-[#30919D] h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-700 dark:text-white/80 w-8 text-right bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded">
              {textOverlays[selectedTextId].fontSize}
            </span>
          </div>

          {/* Text Color */}
          <div className="mb-4">
            <span className="text-xs font-medium text-slate-600 dark:text-white/60 block mb-2">Color</span>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateText(selectedTextId, { color })}
                  className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${textOverlays[selectedTextId].color === color
                    ? "ring-2 ring-slate-300 dark:ring-white border-transparent"
                    : "border-slate-300/60 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/50"
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={textOverlays[selectedTextId].color}
                onChange={(e) =>
                  onUpdateText(selectedTextId, { color: e.target.value })
                }
                className="w-6 h-6 rounded-md cursor-pointer border-none bg-transparent p-0"
              />
            </div>
          </div>

          {/* Text Align */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-slate-600 dark:text-white/60 w-12">Align</span>
            <div className="flex bg-slate-100 dark:bg-black/20 rounded-lg p-0.5 border border-slate-200 dark:border-white/5">
              {[
                { value: "left", icon: AlignLeft },
                { value: "center", icon: AlignCenter },
                { value: "right", icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onUpdateText(selectedTextId, { align: value })}
                  className={`p-1.5 rounded-md transition-all ${textOverlays[selectedTextId].align === value
                    ? "bg-[#30919D] text-white shadow-sm"
                    : "text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Text Effects */}
          <div className="mb-4">
            <span className="text-xs font-medium text-slate-600 dark:text-white/60 block mb-2">Effect</span>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_EFFECTS.map((effect) => (
                <button
                  key={effect.id}
                  onClick={() =>
                    onUpdateText(selectedTextId, { effect: effect.id })
                  }
                  className={`px-2.5 py-1.5 text-[10px] rounded-lg border transition-all ${textOverlays[selectedTextId].effect === effect.id
                    ? "bg-[#30919D] text-white border-[#30919D] font-medium"
                    : "bg-transparent text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  {effect.icon} {effect.name}
                </button>
              ))}
            </div>
          </div>

          {/* Text Rotation */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-white/60">Rotation</span>
              <span className="text-xs font-mono text-slate-700 dark:text-white/80 bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded">
                {textOverlays[selectedTextId].rotation || 0}deg
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={textOverlays[selectedTextId].rotation || 0}
              onChange={(e) =>
                onUpdateText(selectedTextId, {
                  rotation: parseInt(e.target.value),
                })
              }
              className="w-full accent-[#30919D] h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer mb-2"
            />
            <div className="flex justify-between gap-1">
              {[-90, -45, 0, 45, 90].map((deg) => (
                <button
                  key={deg}
                  onClick={() =>
                    onUpdateText(selectedTextId, { rotation: deg })
                  }
                  className={`flex-1 px-1 py-1 text-[10px] rounded hover:bg-white/10 transition-colors ${(textOverlays[selectedTextId].rotation || 0) === deg
                    ? "text-[#30919D] font-bold bg-slate-100 dark:bg-white/5"
                    : "text-slate-500 dark:text-white/40"
                    }`}
                >
                  {deg}deg
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Font Categories */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-800 dark:text-white/80 flex items-center gap-2">
          <Type className="w-4 h-4" />
          Font Library
        </h3>

        {Object.entries(FONT_CATEGORIES).map(([key, category]) => (
          <div key={key} className="border border-[#30919D]/30 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === key ? null : key)
              }
              className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors ${expandedCategory === key ? "bg-[#30919D]/10" : "hover:bg-[#30919D]/5 dark:hover:bg-white/5"
                }`}
            >
              <div className="flex items-center gap-2">
                <span>{category.icon}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white/80">
                  {category.name}
                </span>
              </div>
              {expandedCategory === key ? (
                <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50" />
              )}
            </button>

            <AnimatePresence>
              {expandedCategory === key && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 bg-slate-50 dark:bg-[#071a30] space-y-1">
                    <p className="text-xs text-slate-500 dark:text-white/50 mb-2">
                      {category.description}
                    </p>
                    {category.fonts.map((font) => (
                      <button
                        key={font.name}
                        onClick={() => {
                          if (selectedTextId) {
                            onUpdateText(selectedTextId, {
                              fontFamily: font.family,
                              fontWeight: font.weight || "400",
                              fontStyle: font.style || "normal",
                            });
                          } else {
                            onAddText({
                              text: font.preview,
                              fontFamily: font.family,
                              fontSize: 32,
                              fontWeight: font.weight || "400",
                              fontStyle: font.style || "normal",
                              color: "#000000",
                              effect: "none",
                              position: { x: 50, y: 50 },
                              align: "center",
                              rotation: 0,
                            });
                          }
                        }}
                        className="w-full p-2 bg-white dark:bg-[#0b1f38] rounded-lg border border-[#30919D]/30 hover:border-[#30919D] hover:bg-[#30919D]/10 transition-all text-left group"
                      >
                        <div
                          className="text-xl text-slate-800 dark:text-white/85 truncate"
                          style={{
                            fontFamily: font.family,
                            fontWeight: font.weight || "400",
                            fontStyle: font.style || "normal",
                          }}
                        >
                          {font.preview}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-500 dark:text-white/50">
                            {font.name}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-white/50">
                            {font.useCase}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Text Effects Reference */}
      <button
        onClick={() => setShowEffects(!showEffects)}
        className="w-full px-3 py-2 flex items-center justify-between text-left bg-gradient-to-r from-[#30919D]/20 to-[#267a84]/20 rounded-lg border border-[#30919D]/30"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#30919D]" />
          <span className="text-sm font-medium text-[#30919D]">
            Text Effects Guide
          </span>
        </div>
        {showEffects ? (
          <ChevronUp className="w-4 h-4 text-[#30919D]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#30919D]" />
        )}
      </button>

      <AnimatePresence>
        {showEffects && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-3 bg-gradient-to-br from-[#30919D]/10 to-[#267a84]/10 rounded-lg">
              {TEXT_EFFECTS.filter((e) => e.id !== "none").map((effect) => (
                <div key={effect.id} className="bg-white dark:bg-[#0b1f38] rounded-lg p-3 border border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{effect.icon}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white/80">
                      {effect.name}
                    </span>
                  </div>
                  <div
                    className="text-2xl font-bold text-slate-800 dark:text-white/85"
                    style={effect.style}
                  >
                    PREVIEW
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Overlays List */}
      {Object.keys(textOverlays).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-700 dark:text-white/80 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Text Layers ({Object.keys(textOverlays).length})
          </h3>
          {Object.entries(textOverlays).map(([id, overlay]) => (
            <button
              key={id}
              onClick={() => onSelectText(id)}
              className={`w-full p-2 rounded-lg border text-left transition-all ${selectedTextId === id
                ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10"
                : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 bg-white dark:bg-[#0b1f38]"
                }`}
            >
              <div
                className="text-sm truncate text-slate-800 dark:text-white/85"
                style={{ fontFamily: overlay.fontFamily }}
              >
                {overlay.text}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-white/50 mt-1">
                {overlay.fontSize}px - Click to edit
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Text Overlay Canvas Component
const TextOverlay = ({
  overlay,
  isSelected,
  onSelect,
  onUpdate,
  canvasWidth,
  canvasHeight,
  canvasRef,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Get client coordinates from mouse or touch event
  const getClientCoords = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const { clientX, clientY } = getClientCoords(e);

    // Get canvas position relative to viewport
    const canvasRect = canvasRef?.current?.getBoundingClientRect();
    if (!canvasRect) return;

    // Calculate the current position of the text in pixels
    const currentPixelX = (overlay.position.x / 100) * canvasRect.width;
    const currentPixelY = (overlay.position.y / 100) * canvasRect.height;

    // Calculate offset from mouse position to text position
    const mouseX = clientX - canvasRect.left;
    const mouseY = clientY - canvasRect.top;

    setIsDragging(true);
    setDragOffset({
      x: mouseX - currentPixelX,
      y: mouseY - currentPixelY,
    });
    onSelect();
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const { clientX, clientY } = getClientCoords(e);

      // Get canvas position relative to viewport
      const canvasRect = canvasRef?.current?.getBoundingClientRect();
      if (!canvasRect) return;

      // Calculate mouse position relative to canvas
      const mouseX = clientX - canvasRect.left;
      const mouseY = clientY - canvasRect.top;

      // Calculate new position as percentage, accounting for drag offset
      const newX = ((mouseX - dragOffset.x) / canvasRect.width) * 100;
      const newY = ((mouseY - dragOffset.y) / canvasRect.height) * 100;

      onUpdate({
        position: {
          x: Math.max(0, Math.min(100, newX)),
          y: Math.max(0, Math.min(100, newY)),
        },
      });
    };

    const handleEnd = () => setIsDragging(false);

    // Mouse events
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    // Touch events
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [isDragging, dragOffset, canvasRef, onUpdate]);

  const getEffectStyle = () => {
    const effect = TEXT_EFFECTS.find((e) => e.id === overlay.effect);
    return effect?.style || {};
  };

  return (
    <div
      className={`absolute cursor-move select-none touch-none ${isSelected ? "ring-2 ring-teal-500 ring-offset-2" : ""
        }`}
      style={{
        left: `${overlay.position.x}%`,
        top: `${overlay.position.y}%`,
        transform: `translate(-50%, -50%) rotate(${overlay.rotation || 0}deg)`,
        pointerEvents: "auto",
        zIndex: 50,
        fontFamily: overlay.fontFamily,
        fontSize: `${overlay.fontSize}px`,
        fontWeight: overlay.fontWeight || "400",
        fontStyle: overlay.fontStyle || "normal",
        color: overlay.color,
        textAlign: overlay.align,
        whiteSpace: "nowrap",
        padding: "4px 8px",
        ...getEffectStyle(),
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onClick={handleClick}
    >
      {overlay.text}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// PREVIEW MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PreviewModal = ({ isOpen, onClose, canvasRef, title }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState("hd");
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generatePreview();
    }
  }, [isOpen]);

  const generatePreview = async () => {
    if (!canvasRef.current) return;

    try {
      // Scale up for better preview quality (at least 2x or more for high-res)
      const minScale = Math.max(2, 1080 / canvasRef.current.offsetWidth);
      const canvas = await html2canvas(canvasRef.current, {
        scale: minScale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });
      setPreviewImage(canvas.toDataURL("image/png", 1.0));
    } catch (error) {
      console.error("Preview generation error:", error);
    }
  };

  const handleDownload = async (format = "png") => {
    if (!canvasRef.current) return;

    setIsExporting(true);
    try {
      const resolution = EXPORT_RESOLUTIONS[selectedResolution];
      const canvas = await html2canvas(canvasRef.current, {
        scale: resolution.width / canvasRef.current.offsetWidth,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });

      const link = document.createElement("a");
      link.download = `${title || "vision-board"}-${resolution.width}x${resolution.height
        }.${format}`;
      link.href = canvas.toDataURL(
        `image/${format}`,
        format === "jpg" ? 0.95 : 1.0
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-[#0b1f38] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Final Preview
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-white/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview */}
          <div className="p-6 flex justify-center bg-slate-100 dark:bg-[#001a38]">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#071a30]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-700 dark:text-white/70 font-medium">Resolution:</span>
                <select
                  value={selectedResolution}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white bg-white dark:bg-[#001a38] focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {Object.entries(EXPORT_RESOLUTIONS).map(([key, res]) => (
                    <option key={key} value={key}>
                      {res.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownload("png")}
                  disabled={isExporting}
                  className="bg-white dark:bg-white/10 text-[#002147] dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#002147] dark:text-white" />
                  ) : (
                    <Download className="w-4 h-4 mr-2 text-[#002147] dark:text-white" />
                  )}
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload("jpg")}
                  disabled={isExporting}
                  className="bg-white dark:bg-white/10 text-[#002147] dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20"
                >
                  <Download className="w-4 h-4 mr-2 text-[#002147] dark:text-white" />
                  Download JPG
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EDITOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const VisionBoardEditorPro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef(null);

  const TITLE_CHAR_LIMIT = 50;
  const DESCRIPTION_CHAR_LIMIT = 250;

  // Check authentication on mount
  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr || userStr === '{}' || userStr === 'undefined' || userStr === 'null') {
      toast({
        title: "Authentication Required",
        description: "Please log in to create vision boards",
        variant: "destructive",
      });
      navigate("/", { replace: true });
    }
  }, [navigate, toast]);

  // Board state
  const initialTitle = (location.state?.initialTitle || "Untitled Vision Board").slice(0, TITLE_CHAR_LIMIT);
  const initialDescription = (location.state?.initialDescription || "").slice(0, DESCRIPTION_CHAR_LIMIT);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [templateId, setTemplateId] = useState("grid-2x2");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [borderRadius, setBorderRadius] = useState(8);
  const [gap, setGap] = useState(8);
  const [images, setImages] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const backgroundInputRef = useRef(null);

  // Handle background image upload with NSFW detection
  const handleBackgroundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target.result;
        setIsCheckingImage(true);

        try {
          const nsfwResult = await checkBase64ImageNSFW(imageData);

          if (!nsfwResult.isSafe) {
            toast({
              title: "Background Image Blocked",
              description: nsfwResult.reason || "This image contains inappropriate content.",
              variant: "destructive",
            });
            return;
          }

          setBackgroundImage(imageData);
        } catch (error) {
          console.error("Error checking background image:", error);
          setBackgroundImage(imageData); // Fail open
        } finally {
          setIsCheckingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Text overlay state
  const [textOverlays, setTextOverlays] = useState({});
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [nextTextId, setNextTextId] = useState(1);

  // UI state
  const [activePanel, setActivePanel] = useState("templates");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isCheckingImage, setIsCheckingImage] = useState(false);

  const handleInstantCheck = (text) => {
    // Use aggressive substring matching for instant feedback during typing
    const result = moderateText(text, false);
    if (!result.isClean) {
      toast({
        title: "Inappropriate Content",
        description: "Your text contains inappropriate language. Actions have been blocked for safety.",
        variant: "destructive",
      });
      navigate("/vision-board-pro/gallery");
      return true;
    }
    return false;
  };

  // Pre-load Toxicity Model and NSFW Detection Model
  useEffect(() => {
    const initModels = async () => {
      setIsModelLoading(true);
      await Promise.all([
        loadToxicityModel(),
        preloadNSFWModel(),
      ]);
      setIsModelLoading(false);
    };
    initModels();
  }, []);

  const currentTemplate = GRID_TEMPLATES[templateId];
  const currentRatio = ASPECT_RATIOS[aspectRatio];

  // Calculate display size (fit in viewport) - responsive for mobile
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 768);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive max dimensions calculation
  // Account for Dashboard Sidebar (80px on lg) + Tools Panel (w-56/224px on md, w-72/288px on lg)
  let sidePanelWidth = 0;
  if (windowWidth >= 1024) {    // lg
    sidePanelWidth = 80 + 288 + 48; // Sidebar + Panel + Padding
  } else if (windowWidth >= 768) { // md
    sidePanelWidth = 80 + 224 + 32; // Sidebar + Panel + Padding
  } else {
    sidePanelWidth = 32; // Mobile padding
  }

  const availableHeight = Math.max(220, windowHeight - 320); // leave more room for header + bottom controls
  const rawMaxWidth = Math.max(320, windowWidth - sidePanelWidth);
  const rawMaxHeight = Math.max(260, availableHeight);
  const maxWidth = Math.min(rawMaxWidth, currentRatio.width);
  const maxHeight = Math.min(rawMaxHeight, currentRatio.height);
  const scale = Math.min(
    maxWidth / currentRatio.width,
    maxHeight / currentRatio.height,
    1
  );
  const displayWidth = currentRatio.width * scale;
  const displayHeight = currentRatio.height * scale;

  // Handle image upload to slot with NSFW detection
  const handleImageUpload = async (slotId, imageData) => {
    setIsCheckingImage(true);

    try {
      // Check for NSFW content before adding
      const nsfwResult = await checkBase64ImageNSFW(imageData);

      if (!nsfwResult.isSafe) {
        toast({
          title: "Image Blocked",
          description: nsfwResult.reason || "This image contains inappropriate content.",
          variant: "destructive",
        });
        setIsCheckingImage(false);
        return;
      }

      // Image is safe, add it to the slot
      setImages((prev) => ({
        ...prev,
        [slotId]: {
          slotIndex: slotId,
          url: imageData,
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
        },
      }));
      setSelectedSlot(slotId);
    } catch (error) {
      console.error("Error checking image:", error);
      // If check fails, allow the image (fail open) but notify
      setImages((prev) => ({
        ...prev,
        [slotId]: {
          slotIndex: slotId,
          url: imageData,
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
        },
      }));
      setSelectedSlot(slotId);
    } finally {
      setIsCheckingImage(false);
    }
  };

  // Handle image update (pan, zoom, rotate)
  const handleImageUpdate = (slotId, updates) => {
    setImages((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        ...updates,
      },
    }));
  };

  // Handle image removal
  const handleImageRemove = (slotId) => {
    setImages((prev) => {
      const newImages = { ...prev };
      delete newImages[slotId];
      return newImages;
    });
    setSelectedSlot(null);
  };

  // Handle template change
  const handleTemplateChange = (newTemplateId) => {
    setTemplateId(newTemplateId);
    // Keep images but may need to remap slots
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT OVERLAY HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Add new text overlay
  const handleAddText = (textData) => {
    const id = `text-${nextTextId}`;
    setTextOverlays((prev) => ({
      ...prev,
      [id]: { ...textData, id },
    }));
    setNextTextId((prev) => prev + 1);
    setSelectedTextId(id);
    setSelectedSlot(null); // Deselect image slot
  };

  // Update text overlay
  const handleUpdateText = (id, updates) => {
    if (updates.text) {
      if (handleInstantCheck(updates.text)) return;
    }
    setTextOverlays((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  // Delete text overlay
  const handleDeleteText = (textId) => {
    setTextOverlays((prev) => {
      const newOverlays = { ...prev };
      delete newOverlays[textId];
      return newOverlays;
    });
    if (selectedTextId === textId) {
      setSelectedTextId(null);
    }
  };

  // Select text overlay
  const handleSelectText = (textId) => {
    setSelectedTextId(textId);
    setSelectedSlot(null); // Deselect image slot
  };

  // ═══════════════════════════════════════════════════════════════════════════

  // Zoom selected image
  const handleZoom = (direction) => {
    if (selectedSlot === null || !images[selectedSlot]) return;
    const currentScale = images[selectedSlot].scale || 1;
    const newScale =
      direction === "in"
        ? Math.min(currentScale + 0.1, 3)
        : Math.max(currentScale - 0.1, 0.5);
    handleImageUpdate(selectedSlot, { scale: newScale });
  };

  // Rotate selected image
  const handleRotate = (direction) => {
    if (selectedSlot === null || !images[selectedSlot]) return;
    const currentRotation = images[selectedSlot].rotation || 0;
    const newRotation =
      direction === "cw" ? currentRotation + 90 : currentRotation - 90;
    handleImageUpdate(selectedSlot, { rotation: newRotation });
  };

  // Reset selected image position
  const handleResetPosition = () => {
    if (selectedSlot === null || !images[selectedSlot]) return;
    handleImageUpdate(selectedSlot, {
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
    });
  };

  // Save board
  const handleSave = async () => {
    if (!canvasRef.current) return;

    try {
      setIsSaving(true);

      // Check if moderation model is still loading
      if (isModelLoading) {
        toast({
          title: "Safety System Initializing",
          description: "Please wait a moment while we prepare the safety checks...",
        });
        // We'll proceed, but the moderation calls will wait for the model
      }

      // Synchronous Gatekeeper Check - Catch anything missed by real-time checks
      if (handleInstantCheck(title)) {
        setIsSaving(false);
        return;
      }
      if (handleInstantCheck(description)) {
        setIsSaving(false);
        return;
      }

      // Check all text overlays synchronously first
      for (const overlay of Object.values(textOverlays)) {
        if (overlay.text && handleInstantCheck(overlay.text)) {
          setIsSaving(false);
          return;
        }
      }

      const trimmedTitle = title.slice(0, TITLE_CHAR_LIMIT).trim();
      const trimmedDescription = description.slice(0, DESCRIPTION_CHAR_LIMIT).trim();

      // Content moderation check before saving
      const titleCheck = await moderateTextAsync(trimmedTitle);
      if (!titleCheck.isClean) {
        toast({
          title: "Inappropriate Content",
          description:
            "Your vision board title contains inappropriate language. Please revise.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const descCheck = await moderateTextAsync(trimmedDescription);
      if (!descCheck.isClean) {
        toast({
          title: "Inappropriate Content",
          description:
            "Your vision board description contains inappropriate language. Please revise.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const overlaysCheck = await moderateTextOverlaysAsync(textOverlays);
      if (!overlaysCheck.isClean) {
        toast({
          title: "Inappropriate Content",
          description: getModerationWarning(overlaysCheck.flaggedItems),
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // try { // Removed nested try
      // setIsSaving(true); // Moved to top
      setSelectedSlot(null); // Deselect before capture
      setSelectedTextId(null); // Deselect text before capture

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Calculate scale to capture at full resolution
      // displayWidth is scaled down, we need to scale up to get currentRatio dimensions
      const exportScale = currentRatio.width / canvasRef.current.offsetWidth;

      // Capture canvas as SINGLE MERGED COLLAGE IMAGE at full resolution
      const canvas = await html2canvas(canvasRef.current, {
        scale: exportScale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
        width: canvasRef.current.offsetWidth,
        height: canvasRef.current.offsetHeight,
      });

      const collageBase64 = canvas.toDataURL("image/png", 1.0);

      // Check authentication before saving
      const userStr = sessionStorage.getItem("user");
      if (!userStr || userStr === '{}' || userStr === 'undefined' || userStr === 'null') {
        toast({
          title: "Authentication Required",
          description: "Please log in to save your vision board",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }

      // Prepare board data - store both merged collage AND editable data
      const boardData = {
        title: trimmedTitle,
        description: trimmedDescription,
        templateId,
        canvasSettings: {
          aspectRatio,
          width: currentRatio.width,
          height: currentRatio.height,
          backgroundColor,
          backgroundImage, // Canvas background image
          borderRadius,
          gap,
        },
        collageImage: collageBase64, // Merged image for display
        slotImages: images, // Individual images for editing
        textOverlays: textOverlays, // Text overlays for editing
      };

      await createVisionBoard(boardData);
      toast({
        title: "Saved!",
        description: "Vision board created successfully",
      });
      // Redirect to gallery after creating
      navigate("/vision-board-pro/gallery");
    } catch (error) {
      console.error("Save error:", error);

      // Handle authentication error specifically
      if (error.message?.includes("not authenticated")) {
        toast({
          title: "Session Expired",
          description: "Please log in again to save your vision board",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to save vision board",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen lms-dashboard-bg bg-slate-50 dark:bg-[#001229] overflow-hidden flex">
      <DashboardSidebar />

      <div className="flex-1 h-full flex flex-col w-full relative pt-4 md:pt-0">
        {/* Header */}
        <div className="bg-white/85 dark:bg-[#001a38]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between gap-4 w-full flex-shrink-0 z-30">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vision-board-pro/gallery")}
              className="px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => {
                  const val = e.target.value.slice(0, TITLE_CHAR_LIMIT);
                  setTitle(val);
                  handleInstantCheck(val);
                }}
                maxLength={TITLE_CHAR_LIMIT}
                className="border-0 font-semibold text-lg focus-visible:ring-0 w-full min-w-0 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 p-0 h-auto"
                placeholder="Board title..."
              />
              <span className={`text-xs font-medium ${title.length >= TITLE_CHAR_LIMIT ? "text-red-500 dark:text-red-300" : "text-slate-400 dark:text-white/40"}`}>
                {title.length}/{TITLE_CHAR_LIMIT}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="px-4 border-slate-200 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 bg-transparent"
            >
              <Eye className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-[#30919D] hover:bg-[#267a84] text-white font-semibold shadow-[0_0_15px_rgba(48,145,157,0.4)] hover:shadow-[0_0_20px_rgba(48,145,157,0.6)] px-6 min-h-[36px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full overflow-hidden">
          {/* Mobile Panel Toggle */}
          <div className="md:hidden flex border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#001a38]/90 backdrop-blur-md z-20 overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActivePanel("templates")}
              className={`flex-1 min-w-[70px] px-3 py-3 text-xs font-medium transition-colors ${activePanel === "templates"
                ? "text-[#30919D] border-b-2 border-[#30919D] bg-slate-50 dark:bg-white/5"
                : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
            >
              <Grid3X3 className="w-4 h-4 mx-auto mb-1" />
              Templates
            </button>
            <button
              onClick={() => setActivePanel("style")}
              className={`flex-1 min-w-[70px] px-3 py-3 text-xs font-medium transition-colors ${activePanel === "style"
                ? "text-[#30919D] border-b-2 border-[#30919D] bg-slate-50 dark:bg-white/5"
                : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
            >
              <Palette className="w-4 h-4 mx-auto mb-1" />
              Style
            </button>
            <button
              onClick={() => setActivePanel("text")}
              className={`flex-1 min-w-[70px] px-3 py-3 text-xs font-medium transition-colors ${activePanel === "text"
                ? "text-[#30919D] border-b-2 border-[#30919D] bg-slate-50 dark:bg-white/5"
                : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
            >
              <Type className="w-4 h-4 mx-auto mb-1" />
              Text
            </button>
            <button
              onClick={() => setActivePanel("settings")}
              className={`flex-1 min-w-[70px] px-3 py-3 text-xs font-medium transition-colors ${activePanel === "settings"
                ? "text-[#30919D] border-b-2 border-[#30919D] bg-slate-50 dark:bg-white/5"
                : "text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
            >
              <Settings2 className="w-4 h-4 mx-auto mb-1" />
              Settings
            </button>
          </div>

          {/* Left Panel - Desktop */}
          <div className="hidden md:block w-72 bg-white/95 dark:bg-[#001a38]/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 h-full overflow-y-auto overflow-x-hidden flex-shrink-0 custom-scrollbar">
            <div className="p-4 border-b border-slate-200 dark:border-white/10">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#30919D] hover:bg-[#267a84] text-white font-semibold shadow-[0_0_12px_rgba(48,145,157,0.35)] hover:shadow-[0_0_18px_rgba(48,145,157,0.5)]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
            {/* Panel Tabs */}
            <div className="grid grid-cols-4 border-b border-slate-200 dark:border-white/10">
              <button
                onClick={() => setActivePanel("templates")}
                className={`flex flex-col items-center justify-center py-4 px-1 transition-colors border-b-2 ${activePanel === "templates"
                  ? "text-[#30919D] border-[#30919D] bg-slate-50 dark:bg-white/5"
                  : "text-slate-400 dark:text-white/40 border-transparent hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
              >
                <Grid3X3 className="w-5 h-5 mb-1.5" />
                <span className="text-[10px] font-medium tracking-wide">TEMPLATES</span>
              </button>
              <button
                onClick={() => setActivePanel("style")}
                className={`flex flex-col items-center justify-center py-4 px-1 transition-colors border-b-2 ${activePanel === "style"
                  ? "text-[#30919D] border-[#30919D] bg-slate-50 dark:bg-white/5"
                  : "text-slate-400 dark:text-white/40 border-transparent hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
              >
                <Palette className="w-5 h-5 mb-1.5" />
                <span className="text-[10px] font-medium tracking-wide">STYLE</span>
              </button>
              <button
                onClick={() => setActivePanel("text")}
                className={`flex flex-col items-center justify-center py-4 px-1 transition-colors border-b-2 ${activePanel === "text"
                  ? "text-[#30919D] border-[#30919D] bg-slate-50 dark:bg-white/5"
                  : "text-slate-400 dark:text-white/40 border-transparent hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
              >
                <Type className="w-5 h-5 mb-1.5" />
                <span className="text-[10px] font-medium tracking-wide">TEXT</span>
              </button>
              <button
                onClick={() => setActivePanel("settings")}
                className={`flex flex-col items-center justify-center py-4 px-1 transition-colors border-b-2 ${activePanel === "settings"
                  ? "text-[#30919D] border-[#30919D] bg-slate-50 dark:bg-white/5"
                  : "text-slate-400 dark:text-white/40 border-transparent hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
              >
                <Settings2 className="w-5 h-5 mb-1.5" />
                <span className="text-[10px] font-medium tracking-wide">SETTINGS</span>
              </button>
            </div>

            <div className="p-5">
              {/* Templates Panel */}
              {activePanel === "templates" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Grid3X3 className="w-4 h-4 text-[#30919D]" />
                      Grid Layouts
                    </h3>
                    <div className="p-1">
                      <TemplateSelector
                        selectedTemplate={templateId}
                        onSelect={handleTemplateChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Typography/Text Panel */}
              {activePanel === "text" && (
                <TypographyPanel
                  onAddText={handleAddText}
                  textOverlays={textOverlays}
                  onUpdateText={handleUpdateText}
                  onDeleteText={handleDeleteText}
                  selectedTextId={selectedTextId}
                  onSelectText={handleSelectText}
                />
              )}

              {/* Style Panel */}
              {activePanel === "style" && (
                <div className="space-y-8">
                  {/* Background Color */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      Background Color
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                      {BACKGROUND_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setBackgroundColor(color)}
                          className={`w-9 h-9 rounded-lg border-2 transition-transform hover:scale-110 ${backgroundColor === color
                            ? "border-slate-400 dark:border-white ring-2 ring-slate-200 dark:ring-white/20"
                            : "border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30"
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="text-xs text-slate-500 dark:text-white/50">Custom:</span>
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent p-0"
                      />
                      <span className="text-xs font-mono text-slate-700 dark:text-white/70">
                        {backgroundColor}
                      </span>
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex justify-between">
                      <span>Corner Radius</span>
                      <span className="text-[#30919D]">{borderRadius}px</span>
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {BORDER_RADIUS_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setBorderRadius(preset.value)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors border ${borderRadius === preset.value
                            ? "bg-[#30919D] border-[#30919D] text-white font-medium shadow-lg shadow-[#30919D]/20"
                            : "bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/30"
                            }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gap */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex justify-between">
                      <span>Gap Spacing</span>
                      <span className="text-[#30919D]">{gap}px</span>
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      {GAP_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setGap(preset.value)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors border ${gap === preset.value
                            ? "bg-[#30919D] border-[#30919D] text-white font-medium shadow-lg shadow-[#30919D]/20"
                            : "bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/30"
                            }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Image */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      Background Image
                    </h3>
                    <input
                      ref={backgroundInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                    {backgroundImage ? (
                      <div className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/20 group">
                          <img
                            src={backgroundImage}
                            alt="Background preview"
                            className="w-full h-28 object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                            <button
                              onClick={() =>
                                backgroundInputRef.current?.click()
                              }
                              className="px-3 py-1.5 bg-[#30919D] rounded-lg text-xs font-medium text-white hover:bg-[#267a84] shadow-lg"
                            >
                              Change
                            </button>
                            <button
                              onClick={() => setBackgroundImage(null)}
                              className="px-3 py-1.5 bg-red-500/80 rounded-lg text-xs font-medium text-white hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => backgroundInputRef.current?.click()}
                        className="w-full py-8 border border-dashed border-slate-300 dark:border-white/20 rounded-xl hover:border-[#30919D]/50 hover:bg-[#30919D]/5 transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#30919D]/20 transition-colors">
                          <ImageIcon className="w-5 h-5 text-slate-400 dark:text-white/40 group-hover:text-[#30919D]" />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-white/40 group-hover:text-slate-800 dark:group-hover:text-white/70">
                          Upload Background
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Settings Panel */}
              {activePanel === "settings" && (
                <div className="space-y-6">
                  {/* Aspect Ratio */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      Canvas Size
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                        <button
                          key={key}
                          onClick={() => setAspectRatio(key)}
                          className={`px-3 py-3 text-xs rounded-xl transition-all text-left border ${aspectRatio === key
                            ? "bg-[#30919D]/20 text-[#30919D] font-medium border-[#30919D]"
                            : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50 border-transparent hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                            }`}
                        >
                          <div className="font-medium mb-0.5">{key}</div>
                          <div className="text-[10px] opacity-60">
                            {ratio.width}×{ratio.height}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Export Info */}
                  <div className="bg-[#30919D]/10 rounded-xl p-4 border border-[#30919D]/20">
                    <h4 className="text-sm font-semibold text-[#30919D] mb-2 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export Quality
                    </h4>
                    <p className="text-xs text-[#30919D]/70 leading-relaxed">
                      Your board will be exported at <strong className="text-slate-900 dark:text-white/90">{currentRatio.width}×{currentRatio.height}px</strong>.
                      Use the Preview button to download at different resolutions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Panel Content - Collapsible */}
          <div className="md:hidden bg-white/95 dark:bg-[#001a38]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 max-h-[40vh] overflow-y-auto">
            <div className="p-4">
              {/* Templates Panel */}
              {activePanel === "templates" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-white mb-3">Grid Layouts</h3>
                  <TemplateSelector
                    selectedTemplate={templateId}
                    onSelect={handleTemplateChange}
                  />
                </div>
              )}

              {/* Typography/Text Panel */}
              {activePanel === "text" && (
                <TypographyPanel
                  onAddText={handleAddText}
                  textOverlays={textOverlays}
                  onUpdateText={handleUpdateText}
                  onDeleteText={handleDeleteText}
                  selectedTextId={selectedTextId}
                  onSelectText={handleSelectText}
                />
              )}

              {/* Style Panel */}
              {activePanel === "style" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-white mb-2">Background Color</h3>
                    <div className="grid grid-cols-8 gap-2">
                      {BACKGROUND_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setBackgroundColor(color)}
                          className={`w-8 h-8 rounded-lg border-2 transition-transform ${backgroundColor === color
                            ? "border-slate-400 dark:border-white scale-110 ring-2 ring-slate-200 dark:ring-white/20"
                            : "border-slate-200 dark:border-white/10"
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-white mb-2">Border Radius</h3>
                    <div className="flex flex-wrap gap-2">
                      {BORDER_RADIUS_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setBorderRadius(preset.value)}
                          className={`px-3 py-1.5 text-[10px] rounded-lg border ${borderRadius === preset.value
                            ? "bg-[#30919D] border-[#30919D] text-white font-medium"
                            : "bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60"
                            }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-white mb-2">Gap Size</h3>
                    <div className="flex flex-wrap gap-2">
                      {GAP_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setGap(preset.value)}
                          className={`px-3 py-1.5 text-[10px] rounded-lg border ${gap === preset.value
                            ? "bg-[#30919D] border-[#30919D] text-white font-medium"
                            : "bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60"
                            }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Panel */}
              {activePanel === "settings" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-white mb-2">Canvas Size</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                      <button
                        key={key}
                        onClick={() => setAspectRatio(key)}
                        className={`px-2 py-2 text-[10px] rounded-lg text-center border ${aspectRatio === key
                          ? "bg-[#30919D]/20 text-[#30919D] font-medium border-[#30919D]"
                          : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50 border-transparent"
                          }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-[#001229] dark:via-[#001a38] dark:to-[#001229] relative">
            {/* Scrollable Canvas Container */}
            <div className="flex-1 overflow-auto p-2 sm:p-3 md:p-6 pt-4 sm:pt-6 md:pt-8 w-full custom-scrollbar">
              <div className="flex flex-col items-center min-h-full w-full justify-center">
                {/* Canvas */}
                <div
                  ref={canvasRef}
                  className="relative flex-shrink-0 max-w-full transition-all duration-300 ease-in-out border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_-12px_rgba(2,8,23,0.25)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]"
                  style={{
                    width: displayWidth,
                    height: displayHeight,
                    maxWidth: '100%',
                    backgroundColor,
                    borderRadius: `${Math.min(borderRadius, 32)}px`,
                    overflow: "hidden",
                    position: "relative",
                    isolation: "isolate",
                  }}
                  onClick={() => {
                    setSelectedSlot(null);
                    setSelectedTextId(null);
                  }}
                >
                  {/* Google Fonts for canvas */}
                  <link
                    href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Pacifico&family=Great+Vibes&family=Montserrat:wght@200;400;700;900&family=Oswald:wght@400;700&family=Anton&family=Bebas+Neue&family=Raleway:wght@200;400&family=Quicksand:wght@300;400;500&family=Poppins:wght@300;400;500;600&family=Inter:wght@300;400;500&family=Permanent+Marker&family=Indie+Flower&family=Amatic+SC:wght@400;700&family=Special+Elite&family=Lobster&family=Righteous&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poiret+One&family=Sacramento&family=Satisfy&display=swap"
                    rel="stylesheet"
                  />

                  {/* Background Image Layer */}
                  {backgroundImage && (
                    <img
                      src={backgroundImage}
                      alt="Background"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{ zIndex: 0 }}
                    />
                  )}

                  {/* Image Slots */}
                  {currentTemplate.slots.map((slot) => (
                    <ImageSlot
                      key={slot.id}
                      slot={slot}
                      image={images[slot.id]}
                      gap={gap}
                      borderRadius={borderRadius}
                      isSelected={selectedSlot === slot.id}
                      onSelect={(id) => {
                        setSelectedSlot(id);
                        setSelectedTextId(null);
                      }}
                      onImageUpload={handleImageUpload}
                      onImageUpdate={handleImageUpdate}
                      onImageRemove={handleImageRemove}
                    />
                  ))}

                  {/* Text Overlays */}
                  {Object.entries(textOverlays).map(([id, overlay]) => (
                    <TextOverlay
                      key={id}
                      overlay={overlay}
                      isSelected={selectedTextId === id}
                      onSelect={() => handleSelectText(id)}
                      onUpdate={(updates) => handleUpdateText(id, updates)}
                      canvasWidth={displayWidth}
                      canvasHeight={displayHeight}
                      canvasRef={canvasRef}
                    />
                  ))}
                </div>

                {/* Instructions */}
                {Object.keys(images).length === 0 && (
                  <div className="mt-8 text-center bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-white/10 max-w-sm">
                    <p className="text-sm text-slate-600 dark:text-white/60 font-medium">
                      Select a slot to add images, or drag & drop to get started.
                      Use the tools panel to customize your vision board.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Bottom Controls */}
            <div className="flex-shrink-0 p-2 sm:p-4 bg-white/85 dark:bg-[#001a38]/90 backdrop-blur-md border-t border-slate-200 dark:border-white/10 relative z-20">
              {/* Image Controls - Touch-friendly */}
              {selectedSlot !== null && images[selectedSlot] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2 sm:p-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-4 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-white/50 hidden sm:inline">Zoom</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleZoom("out")}
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 active:scale-95 transition-transform bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/30"
                    >
                      <ZoomOut className="w-4 h-4 sm:w-4 sm:h-4" />
                    </Button>
                    <span className="text-xs sm:text-sm font-medium w-12 sm:w-12 text-center text-slate-700 dark:text-white/90 font-mono bg-slate-100 dark:bg-white/5 py-1 rounded">
                      {Math.round((images[selectedSlot]?.scale || 1) * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleZoom("in")}
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 active:scale-95 transition-transform bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/30"
                    >
                      <ZoomIn className="w-4 h-4 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-white/50 hidden sm:inline">Rotate</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotate("ccw")}
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 active:scale-95 transition-transform bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/30"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotate("cw")}
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 active:scale-95 transition-transform bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/30"
                    >
                      <RotateCw className="w-4 h-4 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetPosition}
                    className="h-10 sm:h-8 px-3 sm:px-3 active:scale-95 transition-transform bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <RefreshCw className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>

                  <div className="hidden md:block text-xs text-slate-500 dark:text-white/40 ml-2">
                    Drag image to reposition
                  </div>
                </motion.div>
              )}

              {/* Text Overlay Controls */}
              {selectedTextId && textOverlays[selectedTextId] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-2 sm:p-3 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                    {/* Font Size */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-white/50">Size</span>
                      <input
                        type="range"
                        min="12"
                        max="120"
                        value={textOverlays[selectedTextId]?.fontSize || 32}
                        onChange={(e) =>
                          handleUpdateText(selectedTextId, {
                            fontSize: parseInt(e.target.value),
                          })
                        }
                        className="w-16 sm:w-24 h-1.5 bg-slate-200 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#30919D]"
                      />
                      <span className="text-xs sm:text-sm font-medium w-8 sm:w-10 text-slate-700 dark:text-white/90 bg-slate-100 dark:bg-white/5 py-1 rounded text-center">
                        {textOverlays[selectedTextId]?.fontSize || 32}
                      </span>
                    </div>

                    <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />

                    {/* Color */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-white/50">Color</span>
                      <input
                        type="color"
                        value={textOverlays[selectedTextId]?.color || "#000000"}
                        onChange={(e) =>
                          handleUpdateText(selectedTextId, {
                            color: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                      />
                    </div>

                    <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />

                    {/* Font Selection */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-white/50 hidden sm:inline">Font</span>
                      <select
                        value={
                          textOverlays[selectedTextId]?.fontFamily ||
                          "'Montserrat', sans-serif"
                        }
                        onChange={(e) =>
                          handleUpdateText(selectedTextId, {
                            fontFamily: e.target.value,
                          })
                        }
                        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-[#001a38] text-slate-700 dark:text-white rounded-lg focus:ring-1 focus:ring-[#30919D] focus:outline-none max-w-[120px] sm:max-w-none"
                        style={{
                          fontFamily:
                            textOverlays[selectedTextId]?.fontFamily ||
                            "'Montserrat', sans-serif",
                        }}
                      >
                        {Object.values(FONT_CATEGORIES)
                          .flatMap((cat) => cat.fonts)
                          .map((font) => (
                            <option
                              key={font.name}
                              value={font.family}
                              style={{ fontFamily: font.family }}
                            >
                              {font.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />

                    {/* Effect Selection */}
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-sm text-slate-500 dark:text-white/50">Effect</span>
                      <select
                        value={textOverlays[selectedTextId]?.effect || "none"}
                        onChange={(e) =>
                          handleUpdateText(selectedTextId, {
                            effect: e.target.value,
                          })
                        }
                        className="px-2 py-1.5 text-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-[#001a38] text-slate-700 dark:text-white rounded-lg focus:ring-1 focus:ring-[#30919D] focus:outline-none"
                      >
                        <option value="none">None</option>
                        {TEXT_EFFECTS.map((effect) => (
                          <option key={effect.id} value={effect.id}>
                            {effect.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />

                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      size="sm"
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 h-8 min-h-[34px] px-3 sm:px-4"
                      onClick={() => {
                        handleDeleteText(selectedTextId);
                        setSelectedTextId(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-white/40 mt-2 text-center">
                    Click text to edit - Drag to reposition
                  </div>
                </motion.div>
              )}

              {/* No selection message */}
              {selectedSlot === null && !selectedTextId && (
                <div className="text-center text-slate-500 dark:text-white/30 py-4 flex flex-col items-center justify-center gap-2">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-white/5">
                    <Grid3X3 className="w-5 h-5 opacity-60" />
                  </div>
                  <p className="text-sm font-medium">Select an image or text to see tools</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        canvasRef={canvasRef}
        title={title}
      />
    </div>
  );
};

export default VisionBoardEditorPro;
