import React from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const EditorBottomBar = ({ zoomLevel, setZoomLevel, onFitToScreen }) => {
  return (
    <div className="pointer-events-none fixed bottom-[78px] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[340px] -translate-x-1/2 lg:bottom-5 lg:left-[calc(50%+40px)] lg:w-auto lg:max-w-none">
      <div className="pointer-events-auto flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-2.5 py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur transition-all dark:border-slate-700 dark:bg-[#0b1220]/92 sm:gap-3 sm:px-3 lg:py-2 lg:w-auto">
        <button
          onClick={() => setZoomLevel(Math.max(10, zoomLevel - 10))}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1 lg:w-28 lg:flex-none">
          <Slider
            value={[zoomLevel]}
            min={10}
            max={300}
            step={1}
            onValueChange={(val) => setZoomLevel(val[0])}
            className="cursor-pointer"
          />
        </div>

        <button
          onClick={() => setZoomLevel(Math.min(300, zoomLevel + 10))}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        <div className="w-px self-stretch bg-slate-200 dark:bg-slate-700" />

        <span className="w-10 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300 sm:w-12 sm:text-xs">
          {Math.round(zoomLevel)}%
        </span>

        <button
          onClick={onFitToScreen}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          title="Fit to screen"
        >
          <Maximize className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default EditorBottomBar;
