import React, { useRef, useState, useEffect } from "react";
import { Upload, Trash2, RefreshCw, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

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
  // Convert pixel gap to approximate percentage offset (canvas base ~600px, so gap/6 ≈ gap as %)
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

    // First check for files dragged from the OS
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageUpload(slot.id, event.target.result);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Then check for base64/URL data dragged from the Uploads panel
    const imageUrl = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("image/url");
    if (imageUrl) {
      onImageUpload(slot.id, imageUrl);
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
    // Removed e.preventDefault() to allow click events to bubble up for selection
    // We handle native drag prevention via draggable={false} on the img
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
        } ${!image ? "bg-slate-200/80 hover:bg-slate-300/80" : ""}`}
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
          onClick={(e) => {
             e.stopPropagation();
             onSelect(slot.id);
          }}
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
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                <button
                  className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageRemove(slot.id);
                  }}
                  onTouchEnd={(e) => {
                     e.stopPropagation();
                     onImageRemove(slot.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
                <button
                  className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                   onTouchEnd={(e) => {
                     e.stopPropagation();
                     fileInputRef.current?.click();
                  }}
                >
                  <RefreshCw className="w-4 h-4 text-slate-700" />
                </button>
              </div>

              {/* Bottom controls - Zoom & Rotate */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 z-10 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                <button
                  className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newScale = Math.max((image.scale || 1) - 0.25, 0.25);
                    onImageUpdate(slot.id, { scale: newScale });
                  }}
                   onTouchEnd={(e) => {
                     e.stopPropagation();
                     e.preventDefault(); // Prevent click handling on wrapper
                     const newScale = Math.max((image.scale || 1) - 0.25, 0.25);
                     onImageUpdate(slot.id, { scale: newScale });
                  }}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/30 self-center mx-1" />
                <button
                  className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"
                   onClick={(e) => {
                    e.stopPropagation();
                    const newScale = Math.min((image.scale || 1) + 0.25, 4);
                    onImageUpdate(slot.id, { scale: newScale });
                  }}
                   onTouchEnd={(e) => {
                     e.stopPropagation();
                     e.preventDefault();
                     const newScale = Math.min((image.scale || 1) + 0.25, 4);
                     onImageUpdate(slot.id, { scale: newScale });
                  }}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/30 self-center mx-1" />
                <button
                  className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"
                   onClick={(e) => {
                    e.stopPropagation();
                    const newRotation = (image.rotation || 0) + 90;
                    onImageUpdate(slot.id, { rotation: newRotation });
                  }}
                   onTouchEnd={(e) => {
                     e.stopPropagation();
                     e.preventDefault();
                     const newRotation = (image.rotation || 0) + 90;
                     onImageUpdate(slot.id, { rotation: newRotation });
                  }}
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

        </div>
      ) : (
        // Empty slot - tap/click to upload (mobile-friendly)
        <div
          className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-slate-600 active:bg-slate-300/60 transition-colors"
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

export default ImageSlot;
