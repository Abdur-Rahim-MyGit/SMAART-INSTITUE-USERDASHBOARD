import React from "react";
import { ZoomIn, ZoomOut, RotateCw, Trash2, RefreshCw } from "lucide-react";

const SelectionControls = ({
  selectedSlot,
  images,
  onImageUpdate,
  onImageRemove,
  onImageReplace
}) => {
  if (!selectedSlot || !images[selectedSlot]) {
    return null; 
    // DEBUG: return <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-500 text-white p-2 z-[9999]">No Selection: {selectedSlot}</div>;
  }

  const image = images[selectedSlot];

  const handleZoomIn = () => {
    const currentScale = image.scale || 1;
    const newScale = Math.min(currentScale + 0.25, 4);
    onImageUpdate(selectedSlot, { scale: newScale });
  };

  const handleZoomOut = () => {
    const currentScale = image.scale || 1;
    const newScale = Math.max(currentScale - 0.25, 0.25);
    onImageUpdate(selectedSlot, { scale: newScale });
  };

  const handleRotateCW = () => {
    const currentRotation = image.rotation || 0;
    onImageUpdate(selectedSlot, { rotation: currentRotation + 90 });
  };

  return (
    <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/20 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 z-[9999]">
      
      {/* Zoom Controls */}
      <div className="flex items-center gap-3">
        <button 
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
            title="Zoom Out"
        >
            <ZoomOut className="w-5 h-5 text-slate-700 dark:text-white" />
        </button>
        <span className="text-sm font-mono font-medium min-w-[3rem] text-center text-slate-700 dark:text-white">
            {Math.round((image.scale || 1) * 100)}%
        </span>
        <button 
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
            title="Zoom In"
        >
            <ZoomIn className="w-5 h-5 text-slate-700 dark:text-white" />
        </button>
      </div>

      <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>

      {/* Rotate */}
      <button 
        onClick={handleRotateCW}
        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors flex flex-col items-center gap-1"
        title="Rotate"
      >
        <RotateCw className="w-5 h-5 text-slate-700 dark:text-white" />
      </button>

      <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button 
            onClick={onImageReplace}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-700 dark:text-white"
            title="Replace Image"
        >
            <RefreshCw className="w-5 h-5" />
        </button>
        
        <button 
            onClick={() => onImageRemove(selectedSlot)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors text-red-500"
            title="Remove Image"
        >
            <Trash2 className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};

export default SelectionControls;
