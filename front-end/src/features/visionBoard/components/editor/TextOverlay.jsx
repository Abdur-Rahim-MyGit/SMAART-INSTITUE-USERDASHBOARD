import React, { useEffect, useState } from "react";
import { Move, RotateCw, Trash2 } from "lucide-react";
import { TEXT_EFFECTS } from "../../utils/constants";

const TextOverlay = ({
  overlay,
  isSelected,
  onSelect,
  onUpdate,
  canvasRef,
  snapEnabled,
  peers = [],
  overlayType,
  overlayId,
  onGuideChange,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformStart, setTransformStart] = useState(null);

  const getClientCoords = (event) => {
    if (event.touches && event.touches.length > 0) {
      return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
    }
    return { clientX: event.clientX, clientY: event.clientY };
  };

  const handleDragStart = (event) => {
    if (overlay.locked) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const { clientX, clientY } = getClientCoords(event);
    const canvasRect = canvasRef?.current?.getBoundingClientRect();
    if (!canvasRect) {
      return;
    }

    const currentPixelX = (overlay.position.x / 100) * canvasRect.width;
    const currentPixelY = (overlay.position.y / 100) * canvasRect.height;
    const mouseX = clientX - canvasRect.left;
    const mouseY = clientY - canvasRect.top;

    setIsDragging(true);
    setDragOffset({
      x: mouseX - currentPixelX,
      y: mouseY - currentPixelY,
    });
    onSelect();
  };

  const getOverlayCenter = () => {
    const canvasRect = canvasRef?.current?.getBoundingClientRect();
    if (!canvasRect) return null;
    return {
      x: canvasRect.left + ((overlay.position.x || 50) / 100) * canvasRect.width,
      y: canvasRect.top + ((overlay.position.y || 50) / 100) * canvasRect.height,
    };
  };

  const handleTransformStart = (event) => {
    if (overlay.locked) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const center = getOverlayCenter();
    const { clientX, clientY } = getClientCoords(event);
    if (!center) {
      return;
    }

    setIsTransforming(true);
    setTransformStart({
      scale: overlay.scale || 1,
      rotation: overlay.rotation || 0,
      angle: Math.atan2(clientY - center.y, clientX - center.x),
      distance: Math.max(Math.hypot(clientX - center.x, clientY - center.y), 24),
    });
    onSelect();
  };

  const getSpacingGuideState = (x, y, canvasRect) => {
    const others = peers.filter((peer) => !(peer.type === overlayType && peer.id === overlayId));
    let spacingX = null;
    let spacingY = null;

    others.forEach((peer) => {
      if (Math.abs((peer.y || 0) - y) < 3.5) {
        const deltaX = Math.abs((peer.x || 0) - x);
        const pixelGap = Math.round((deltaX / 100) * canvasRect.width);
        if (pixelGap <= 220 && (spacingX === null || pixelGap < spacingX)) {
          spacingX = pixelGap;
        }
      }
      if (Math.abs((peer.x || 0) - x) < 3.5) {
        const deltaY = Math.abs((peer.y || 0) - y);
        const pixelGap = Math.round((deltaY / 100) * canvasRect.height);
        if (pixelGap <= 220 && (spacingY === null || pixelGap < spacingY)) {
          spacingY = pixelGap;
        }
      }
    });

    return { spacingX, spacingY };
  };

  useEffect(() => {
    if (!isDragging && !isTransforming) {
      return undefined;
    }

    const handleMove = (event) => {
      const { clientX, clientY } = getClientCoords(event);
      const canvasRect = canvasRef?.current?.getBoundingClientRect();
      if (!canvasRect) {
        return;
      }

      if (isTransforming && transformStart) {
        const center = getOverlayCenter();
        if (!center) {
          return;
        }
        const nextAngle = Math.atan2(clientY - center.y, clientX - center.x);
        const nextDistance = Math.max(Math.hypot(clientX - center.x, clientY - center.y), 24);
        const rotationDelta = ((nextAngle - transformStart.angle) * 180) / Math.PI;
        const nextScale = Math.min(Math.max(transformStart.scale * (nextDistance / transformStart.distance), 0.35), 4);

        onUpdate({
          rotation: Math.round(transformStart.rotation + rotationDelta),
          scale: Number(nextScale.toFixed(2)),
        });
        return;
      }

      const mouseX = clientX - canvasRect.left;
      const mouseY = clientY - canvasRect.top;
      const newX = ((mouseX - dragOffset.x) / canvasRect.width) * 100;
      const newY = ((mouseY - dragOffset.y) / canvasRect.height) * 100;
      const shouldSnapX = snapEnabled && Math.abs(newX - 50) < 1.25;
      const shouldSnapY = snapEnabled && Math.abs(newY - 50) < 1.25;
      const nextX = Math.max(0, Math.min(100, shouldSnapX ? 50 : newX));
      const nextY = Math.max(0, Math.min(100, shouldSnapY ? 50 : newY));
      const spacingGuides = getSpacingGuideState(nextX, nextY, canvasRect);
      onGuideChange?.({ vertical: shouldSnapX, horizontal: shouldSnapY, ...spacingGuides });

      onUpdate({
        position: {
          x: nextX,
          y: nextY,
        },
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
      setIsTransforming(false);
      setTransformStart(null);
      onGuideChange?.({ vertical: false, horizontal: false, spacingX: null, spacingY: null });
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
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
  }, [canvasRef, dragOffset, isDragging, isTransforming, onGuideChange, onUpdate, overlay.position.x, overlay.position.y, snapEnabled, transformStart]);

  const getEffectStyle = () => {
    const effect = TEXT_EFFECTS.find((entry) => entry.id === overlay.effect);
    return effect?.style || {};
  };

  const getBackgroundStyle = () => {
    const style = overlay.backgroundStyle || "none";
    if (style === "pill") {
      return {
        backgroundColor: overlay.backgroundColor || "rgba(255,255,255,0.92)",
        borderRadius: "999px",
        color: overlay.color,
      };
    }

    if (style === "soft") {
      return {
        backgroundColor: overlay.backgroundColor || "rgba(15,23,42,0.35)",
        borderRadius: "16px",
      };
    }

    return {};
  };

  return (
    <div
      className="absolute z-50 cursor-move select-none touch-none"
      style={{
        left: `${overlay.position.x}%`,
        top: `${overlay.position.y}%`,
        transform: `translate(-50%, -50%) rotate(${overlay.rotation || 0}deg) scale(${overlay.scale || 1})`,
        pointerEvents: "auto",
        zIndex: overlay.zIndex || 50,
      }}
      onMouseDown={overlay.locked ? undefined : handleDragStart}
      onTouchStart={overlay.locked ? undefined : handleDragStart}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onSelect(event.shiftKey || event.metaKey || event.ctrlKey);
      }}
    >
      <div
        className={`relative rounded-xl px-3 py-2 transition-all ${
          isSelected
            ? "ring-2 ring-[#1a3884] ring-offset-2 ring-offset-white dark:ring-[#7aa2ff] dark:ring-offset-[#0f172a]"
            : ""
        }`}
        style={{
          fontFamily: overlay.fontFamily,
          fontSize: `${overlay.fontSize}px`,
          fontWeight: overlay.fontWeight || "400",
          fontStyle: overlay.fontStyle || "normal",
          color: overlay.color,
          textAlign: overlay.align,
          whiteSpace: "pre-wrap",
          lineHeight: overlay.lineHeight || 1.15,
          letterSpacing: `${overlay.letterSpacing || 0}px`,
          opacity: overlay.opacity ?? 1,
          width: "max-content",
          maxWidth: `${overlay.maxWidth || 280}px`,
          backgroundColor: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
          backdropFilter: isSelected ? "blur(6px)" : "none",
          ...getBackgroundStyle(),
          ...getEffectStyle(),
        }}
      >
        {isSelected && (
          <>
            <div className="absolute -top-10 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#00152E]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/10">
              <Move className="h-3 w-3" />
              {overlay.locked ? "Locked Text" : "Drag Text"}
            </div>
            <button
              type="button"
              className="absolute -bottom-3 -right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-[#1a3884] text-white shadow-xl transition-all hover:scale-110 active:scale-95"
              onMouseDown={handleTransformStart}
              onTouchStart={handleTransformStart}
              title="Resize and rotate"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="absolute -bottom-3 -left-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-red-600 text-white shadow-xl transition-all hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              title="Delete text"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
        {overlay.text}
      </div>
    </div>
  );
};

export default TextOverlay;
