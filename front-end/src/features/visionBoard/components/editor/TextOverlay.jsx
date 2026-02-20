import React, { useState, useEffect } from "react";
import { TEXT_EFFECTS } from "../../utils/constants";

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

export default TextOverlay;
