import React, { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Move,
  RefreshCw,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

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
  snapEnabled,
  onGuideChange,
  zoomLevel = 100,
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState(null);
  const [initialScale, setInitialScale] = useState(1);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformStart, setTransformStart] = useState(null);

  const imageRef = useRef(image);
  const zoomLevelRef = useRef(zoomLevel);
  const snapEnabledRef = useRef(snapEnabled);
  const onImageUpdateRef = useRef(onImageUpdate);
  const onGuideChangeRef = useRef(onGuideChange);

  // Sync refs on render
  imageRef.current = image;
  zoomLevelRef.current = zoomLevel;
  snapEnabledRef.current = snapEnabled;
  onImageUpdateRef.current = onImageUpdate;
  onGuideChangeRef.current = onGuideChange;

  const gapPercent = gap / 6;
  const imageScale = Math.round((image?.scale || 1) * 100);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        onImageUpload(slot.id, loadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        onImageUpload(slot.id, loadEvent.target.result);
      };
      reader.readAsDataURL(file);
      return;
    }

    const imageUrl =
      event.dataTransfer.getData("text/uri-list") ||
      event.dataTransfer.getData("image/url");
    if (imageUrl) {
      onImageUpload(slot.id, imageUrl);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const getTouchDistance = (touches) => {
    if (touches.length < 2) {
      return null;
    }

    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getClientCoords = (event) => {
    if (event.touches && event.touches.length > 0) {
      return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
    }
    return { clientX: event.clientX, clientY: event.clientY };
  };

  const getSlotCenter = () => {
    const element = fileInputRef.current?.closest("[data-slot-root='true']");
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const handleMouseDown = (event) => {
    if (!imageRef.current) {
      return;
    }

    const { clientX, clientY } = getClientCoords(event);
    const zoomScale = zoomLevelRef.current / 100;
    setIsDragging(true);
    dragStartRef.current = {
      x: (clientX / zoomScale) - (imageRef.current.position?.x || 0),
      y: (clientY / zoomScale) - (imageRef.current.position?.y || 0),
    };
  };

  const handleTouchStart = (event) => {
    if (!imageRef.current) {
      return;
    }
    event.stopPropagation();

    if (event.touches.length === 2) {
      const distance = getTouchDistance(event.touches);
      setInitialPinchDistance(distance);
      setInitialScale(imageRef.current.scale || 1);
      return;
    }

    const { clientX, clientY } = getClientCoords(event);
    const zoomScale = zoomLevelRef.current / 100;
    setIsDragging(true);
    dragStartRef.current = {
      x: (clientX / zoomScale) - (imageRef.current.position?.x || 0),
      y: (clientY / zoomScale) - (imageRef.current.position?.y || 0),
    };
  };

  const handleTransformStart = (event) => {
    if (!imageRef.current || imageRef.current.locked || imageRef.current.hidden) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const center = getSlotCenter();
    const { clientX, clientY } = getClientCoords(event);
    if (!center) return;

    setIsTransforming(true);
    setTransformStart({
      scale: imageRef.current.scale || 1,
      rotation: imageRef.current.rotation || 0,
      angle: Math.atan2(clientY - center.y, clientX - center.x),
      distance: Math.max(Math.hypot(clientX - center.x, clientY - center.y), 24),
    });
  };

  useEffect(() => {
    if (!isDragging && !isTransforming) {
      return undefined;
    }

    const handleTouchMove = (event) => {
      if (event.touches.length === 2 && initialPinchDistance) {
        event.preventDefault();
        const newDistance = getTouchDistance(event.touches);
        if (newDistance) {
          const scaleFactor = newDistance / initialPinchDistance;
          const newScale = Math.min(Math.max(initialScale * scaleFactor, 0.25), 4);
          onImageUpdateRef.current(slot.id, { scale: newScale });
        }
        return;
      }

      if (isTransforming && transformStart) {
        event.preventDefault();
        const center = getSlotCenter();
        if (!center) return;
        const { clientX, clientY } = getClientCoords(event);
        const nextAngle = Math.atan2(clientY - center.y, clientX - center.x);
        const nextDistance = Math.max(Math.hypot(clientX - center.x, clientY - center.y), 24);
        const rotationDelta = ((nextAngle - transformStart.angle) * 180) / Math.PI;
        const nextScale = Math.min(Math.max(transformStart.scale * (nextDistance / transformStart.distance), 0.25), 4);
        onImageUpdateRef.current(slot.id, {
          scale: Number(nextScale.toFixed(2)),
          rotation: Math.round(transformStart.rotation + rotationDelta),
        });
        return;
      }

      if (isDragging && event.touches.length === 1) {
        event.preventDefault();
        const { clientX, clientY } = getClientCoords(event);
        const zoomScale = zoomLevelRef.current / 100;
        const rawX = (clientX / zoomScale) - dragStartRef.current.x;
        const rawY = (clientY / zoomScale) - dragStartRef.current.y;
        const shouldSnapX = snapEnabledRef.current && Math.abs(rawX) < 12;
        const shouldSnapY = snapEnabledRef.current && Math.abs(rawY) < 12;
        onGuideChangeRef.current?.({ vertical: shouldSnapX, horizontal: shouldSnapY, spacingX: null, spacingY: null });
        onImageUpdateRef.current(slot.id, {
          position: {
            x: shouldSnapX ? 0 : rawX,
            y: shouldSnapY ? 0 : rawY,
          },
        });
      }
    };

    const handleMouseMove = (event) => {
      if (isTransforming && transformStart) {
        const center = getSlotCenter();
        if (!center) return;
        const nextAngle = Math.atan2(event.clientY - center.y, event.clientX - center.x);
        const nextDistance = Math.max(Math.hypot(event.clientX - center.x, event.clientY - center.y), 24);
        const rotationDelta = ((nextAngle - transformStart.angle) * 180) / Math.PI;
        const nextScale = Math.min(Math.max(transformStart.scale * (nextDistance / transformStart.distance), 0.25), 4);
        onImageUpdateRef.current(slot.id, {
          scale: Number(nextScale.toFixed(2)),
          rotation: Math.round(transformStart.rotation + rotationDelta),
        });
        return;
      }

      if (!isDragging) {
        return;
      }

      const zoomScale = zoomLevelRef.current / 100;
      const rawX = (event.clientX / zoomScale) - dragStartRef.current.x;
      const rawY = (event.clientY / zoomScale) - dragStartRef.current.y;
      const shouldSnapX = snapEnabledRef.current && Math.abs(rawX) < 12;
      const shouldSnapY = snapEnabledRef.current && Math.abs(rawY) < 12;
      onGuideChangeRef.current?.({ vertical: shouldSnapX, horizontal: shouldSnapY, spacingX: null, spacingY: null });

      onImageUpdateRef.current(slot.id, {
        position: {
          x: shouldSnapX ? 0 : rawX,
          y: shouldSnapY ? 0 : rawY,
        },
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsTransforming(false);
      setTransformStart(null);
      setInitialPinchDistance(null);
      onGuideChangeRef.current?.({ vertical: false, horizontal: false, spacingX: null, spacingY: null });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
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
  }, [
    initialPinchDistance,
    initialScale,
    isDragging,
    isTransforming,
    slot.id,
    transformStart,
  ]);

  const slotStyle = {
    position: "absolute",
    left: `calc(${slot.x}% + ${gapPercent / 2}%)`,
    top: `calc(${slot.y}% + ${gapPercent / 2}%)`,
    width: `calc(${slot.width}% - ${gapPercent}%)`,
    height: `calc(${slot.height}% - ${gapPercent}%)`,
    borderRadius: `${borderRadius}px`,
    overflow: "hidden",
    zIndex: image?.zIndex || 10,
  };

  const isHidden = Boolean(image?.hidden);
  const isLocked = Boolean(image?.locked);
  const fitMode = image?.fitMode || "fit";
  const imageFilter = `brightness(${image?.brightness ?? 100}%) contrast(${image?.contrast ?? 100}%) blur(${image?.blur ?? 0}px)`;

  return (
    <div
      data-slot-root="true"
      style={slotStyle}
      className={`group relative transition-all ${
        isSelected
          ? "ring-2 ring-[#1a3884] ring-offset-4 ring-offset-white dark:ring-[#7aa2ff] dark:ring-offset-[#0f172a]"
          : ""
      } ${
        !image
          ? "border border-dashed border-slate-300/90 bg-slate-100/90 hover:border-slate-400 hover:bg-slate-200/80 dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-white/25 dark:hover:bg-white/10"
          : ""
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(slot.id, event.shiftKey || event.metaKey || event.ctrlKey);
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
        <div
          className="absolute inset-0 flex cursor-move items-center justify-center overflow-hidden touch-none"
          onMouseDown={isLocked || isHidden ? undefined : handleMouseDown}
          onTouchStart={isLocked || isHidden ? undefined : handleTouchStart}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(slot.id, event.shiftKey || event.metaKey || event.ctrlKey);
          }}
        >
          {!isHidden ? (
            <img
              src={image.url}
              alt={`Slot ${slot.id}`}
              draggable={false}
              className="pointer-events-none absolute select-none"
              style={{
                maxWidth: "none",
                maxHeight: "none",
                width: "auto",
                height: "auto",
                minWidth: "100%",
                minHeight: "100%",
                objectFit: fitMode === "fit" ? "contain" : "cover",
                left: `calc(50% + ${image.position?.x || 0}px)`,
                top: `calc(50% + ${image.position?.y || 0}px)`,
                transform: `translate(-50%, -50%) scale(${image.scale || 1}) rotate(${image.rotation || 0}deg)`,
                transformOrigin: "center center",
                filter: imageFilter,
              }}
            />
          ) : null}

          {image?.tint && image.tint !== "rgba(0,0,0,0)" && !isHidden && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundColor: image.tint }}
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

          {isSelected && !isHidden && (
            <>
              <div className="absolute left-2 top-2 z-10 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
                {isLocked ? "Locked layer" : fitMode === "crop" ? "Drag to crop" : "Drag to reposition"}
              </div>

              <div className="absolute right-2 top-2 z-10 flex gap-2">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 shadow-md transition hover:bg-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    onImageRemove(slot.id);
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation();
                    onImageRemove(slot.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 shadow-md transition hover:bg-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={isLocked}
                >
                  <RefreshCw className="h-4 w-4 text-slate-700" />
                </button>
              </div>

              <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-2 backdrop-blur-md">
                <button
                  className="rounded-full p-1 text-white transition-colors hover:bg-white/20"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isLocked) return;
                    onImageUpdate(slot.id, {
                      scale: Math.max((image.scale || 1) - 0.25, 0.25),
                    });
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    if (isLocked) return;
                    onImageUpdate(slot.id, {
                      scale: Math.max((image.scale || 1) - 0.25, 0.25),
                    });
                  }}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <div className="min-w-[3rem] text-center text-[11px] font-semibold text-white">
                  {imageScale}%
                </div>
                <button
                  className="rounded-full p-1 text-white transition-colors hover:bg-white/20"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isLocked) return;
                    onImageUpdate(slot.id, {
                      scale: Math.min((image.scale || 1) + 0.25, 4),
                    });
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    if (isLocked) return;
                    onImageUpdate(slot.id, {
                      scale: Math.min((image.scale || 1) + 0.25, 4),
                    });
                  }}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="h-4 w-px bg-white/30" />
                <button
                  className="rounded-full p-1 text-white transition-colors hover:bg-white/20"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isLocked) return;
                    onImageUpdate(slot.id, {
                      rotation: (image.rotation || 0) + 90,
                    });
                  }}
                  onTouchEnd={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    if (isLocked) return;
                    onImageUpdate(slot.id, {
                      rotation: (image.rotation || 0) + 90,
                    });
                  }}
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              <div className="absolute bottom-2 left-2 z-10 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Move className="h-3.5 w-3.5" />
                  {isLocked ? "Locked" : "Selected"}
                </span>
              </div>

              {!isLocked && (
                <button
                  type="button"
                  className="absolute -bottom-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-[#1a3884] text-white shadow-lg"
                  onMouseDown={handleTransformStart}
                  onTouchStart={handleTransformStart}
                  title="Resize and rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div
          className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center text-slate-500 transition-colors hover:text-slate-700 active:bg-slate-300/60 dark:text-white/45 dark:hover:text-white/75"
          onClick={(event) => {
            event.stopPropagation();
            fileInputRef.current?.click();
          }}
          onTouchEnd={(event) => {
            event.stopPropagation();
            event.preventDefault();
            fileInputRef.current?.click();
          }}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm dark:bg-white/10">
            <ImagePlus className="h-6 w-6 opacity-70" />
          </div>
          <span className="text-xs font-semibold">Add Image</span>
          <span className="mt-1 text-[11px] opacity-70">Tap or drop media here</span>
        </div>
      )}
    </div>
  );
};

export default ImageSlot;
