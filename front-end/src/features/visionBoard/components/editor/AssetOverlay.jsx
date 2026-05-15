import React, { useEffect, useMemo, useState } from "react";
import { Move, RotateCw, Trash2 } from "lucide-react";

const AssetOverlay = ({
  asset,
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

  const assetSize = useMemo(
    () => ({
      width: asset.width || 160,
      height: asset.height || 120,
    }),
    [asset.height, asset.width]
  );

  const getClientCoords = (event) => {
    if (event.touches && event.touches.length > 0) {
      return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
    }
    return { clientX: event.clientX, clientY: event.clientY };
  };

  const getAssetCenter = () => {
    const canvasRect = canvasRef?.current?.getBoundingClientRect();
    if (!canvasRect) return null;
    return {
      x: canvasRect.left + ((asset.position?.x || 50) / 100) * canvasRect.width,
      y: canvasRect.top + ((asset.position?.y || 50) / 100) * canvasRect.height,
    };
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

  const handleDragStart = (event) => {
    if (asset.locked) return;
    event.stopPropagation();
    event.preventDefault();
    const { clientX, clientY } = getClientCoords(event);
    const canvasRect = canvasRef?.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const currentPixelX = ((asset.position?.x || 50) / 100) * canvasRect.width;
    const currentPixelY = ((asset.position?.y || 50) / 100) * canvasRect.height;
    const mouseX = clientX - canvasRect.left;
    const mouseY = clientY - canvasRect.top;

    setIsDragging(true);
    setDragOffset({
      x: mouseX - currentPixelX,
      y: mouseY - currentPixelY,
    });
    onSelect();
  };

  const handleTransformStart = (event) => {
    if (asset.locked) return;
    event.stopPropagation();
    event.preventDefault();
    const center = getAssetCenter();
    const { clientX, clientY } = getClientCoords(event);
    if (!center) return;
    setIsTransforming(true);
    setTransformStart({
      scale: asset.scale || 1,
      rotation: asset.rotation || 0,
      angle: Math.atan2(clientY - center.y, clientX - center.x),
      distance: Math.max(Math.hypot(clientX - center.x, clientY - center.y), 24),
    });
    onSelect();
  };

  useEffect(() => {
    if (!isDragging && !isTransforming) {
      return undefined;
    }

    const handleMove = (event) => {
      const { clientX, clientY } = getClientCoords(event);
      const canvasRect = canvasRef?.current?.getBoundingClientRect();
      if (!canvasRect) return;

      if (isTransforming && transformStart) {
        const center = getAssetCenter();
        if (!center) return;
        const nextAngle = Math.atan2(clientY - center.y, clientX - center.x);
        const nextDistance = Math.max(Math.hypot(clientX - center.x, clientY - center.y), 24);
        const rotationDelta = ((nextAngle - transformStart.angle) * 180) / Math.PI;
        const nextScale = Math.min(Math.max(transformStart.scale * (nextDistance / transformStart.distance), 0.3), 4);

        onUpdate({
          rotation: Math.round(transformStart.rotation + rotationDelta),
          scale: Number(nextScale.toFixed(2)),
        });
        return;
      }

      if (!isDragging) return;

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
  }, [asset.position?.x, asset.position?.y, asset.rotation, asset.scale, canvasRef, dragOffset.x, dragOffset.y, isDragging, isTransforming, onGuideChange, onUpdate, snapEnabled, transformStart]);

  return (
    <div
      className="absolute z-40 select-none touch-none"
      style={{
        left: `${asset.position?.x || 50}%`,
        top: `${asset.position?.y || 50}%`,
        width: `${assetSize.width}px`,
        height: `${assetSize.height}px`,
        transform: `translate(-50%, -50%) rotate(${asset.rotation || 0}deg) scale(${asset.scale || 1})`,
        transformOrigin: "center center",
        zIndex: asset.zIndex || 40,
        opacity: asset.opacity ?? 1,
      }}
      onMouseDown={asset.locked ? undefined : handleDragStart}
      onTouchStart={asset.locked ? undefined : handleDragStart}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onSelect(event.shiftKey || event.metaKey || event.ctrlKey);
      }}
    >
      <div
        className={`relative h-full w-full transition-all ${
          isSelected
            ? "ring-2 ring-[#1a3884] ring-offset-2 ring-offset-white dark:ring-[#7aa2ff] dark:ring-offset-[#0f172a]"
            : ""
        }`}
      >
        <img src={asset.src} alt={asset.name || "Asset"} draggable={false} className="h-full w-full object-contain" />

        {isSelected && (
          <>
            <div className="absolute -top-10 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0f172a]/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/10">
              <Move className="h-3 w-3" />
              {asset.locked ? "Locked Asset" : "Drag Asset"}
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
              title="Delete asset"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AssetOverlay;
