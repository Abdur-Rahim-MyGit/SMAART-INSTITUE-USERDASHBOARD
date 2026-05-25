import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CROP_SIZE = 240;

const ImageCropperModal = ({ isOpen, imageSrc, onClose, onCrop, isSaving }) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [baseDimensions, setBaseDimensions] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // Calculate dimensions to fill the crop area on image load
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    const ratio = Math.max(CROP_SIZE / naturalWidth, CROP_SIZE / naturalHeight);
    const w = naturalWidth * ratio;
    const h = naturalHeight * ratio;
    setBaseDimensions({ width: w, height: h });
    setPosition({ x: 0, y: 0 });
    setZoom(1);
  };

  // Helper to constrain shifts to keep image fully covering the crop circle
  const constrainPosition = (x, y, currentZoom) => {
    if (baseDimensions.width === 0) return { x: 0, y: 0 };
    const currentDrawWidth = baseDimensions.width * currentZoom;
    const currentDrawHeight = baseDimensions.height * currentZoom;
    const limitX = Math.max(0, (currentDrawWidth - CROP_SIZE) / 2);
    const limitY = Math.max(0, (currentDrawHeight - CROP_SIZE) / 2);
    return {
      x: Math.min(Math.max(x, -limitX), limitX),
      y: Math.min(Math.max(y, -limitY), limitY)
    };
  };

  // Keep image aligned when zoom changes
  useEffect(() => {
    if (baseDimensions.width > 0) {
      setPosition((prev) => constrainPosition(prev.x, prev.y, zoom));
    }
  }, [zoom, baseDimensions]);

  // Mouse Drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setPosition(constrainPosition(newX, newY, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Drag handlers (for mobile support)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStart.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;
    setPosition(constrainPosition(newX, newY, zoom));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Canvas cropping logic based on actual DOM layout
  const handleSave = () => {
    if (!imgRef.current || !containerRef.current) return;

    const imgRect = imgRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate relative position and scale
    const left = imgRect.left - containerRect.left;
    const top = imgRect.top - containerRect.top;
    const width = imgRect.width;
    const height = imgRect.height;

    // Crop circle is centered inside container
    const cropLeft = (containerRect.width - CROP_SIZE) / 2;
    const cropTop = (containerRect.height - CROP_SIZE) / 2;

    const canvas = document.createElement('canvas');
    const exportScale = 2; // Export double res (480x480) for high quality
    const exportSize = CROP_SIZE * exportScale;
    
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    ctx.clearRect(0, 0, exportSize, exportSize);

    // Apply high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Scale the relative offsets and size to the export resolution
    const drawX = (left - cropLeft) * exportScale;
    const drawY = (top - cropTop) * exportScale;
    const drawWidth = width * exportScale;
    const drawHeight = height * exportScale;

    ctx.drawImage(imgRef.current, drawX, drawY, drawWidth, drawHeight);

    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.92);
  };

  // Global mouse up safety
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[200] p-4 select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-[#002147] rounded-[28px] shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 dark:border-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Crop Profile Photo
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">
                  Drag and zoom to position perfectly
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-[#002A5C] transition-colors"
                disabled={isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crop Box Container */}
            <div className="flex justify-center mb-6">
              <div
                ref={containerRef}
                className="relative w-[300px] h-[300px] bg-slate-950 dark:bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing border border-slate-200 dark:border-white/5"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* The Uploaded Image */}
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop Target"
                  onLoad={handleImageLoad}
                  className="absolute origin-center pointer-events-none"
                  style={{
                    width: baseDimensions.width || 'auto',
                    height: baseDimensions.height || 'auto',
                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    left: '50%',
                    top: '50%',
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                />

                {/* Circular Crop Overlay Vignette Mask */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div 
                    className="rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)]"
                    style={{ width: CROP_SIZE, height: CROP_SIZE }}
                  />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-100 dark:bg-[#001E3D] rounded-lg appearance-none cursor-pointer accent-[#1a3884] dark:accent-blue-400"
                />
                <ZoomIn className="w-4 h-4 text-slate-400" />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
                  className="text-xs font-semibold text-slate-400 dark:text-slate-400 hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#002A5C]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Adjustment
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-3 px-4 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-[#002A5C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || baseDimensions.width === 0}
                className="flex-1 py-3 px-4 bg-[#1a3884] text-white rounded-2xl font-bold hover:bg-[#132c6b] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cropping...
                  </>
                ) : (
                  'Apply Crop'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageCropperModal;
