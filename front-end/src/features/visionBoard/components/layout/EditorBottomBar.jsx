import React, { useState } from "react";
import { ZoomIn, ZoomOut, Maximize, HelpCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const EditorBottomBar = ({ zoomLevel, setZoomLevel, onFitToScreen }) => {
  return (
    <div className="hidden lg:flex h-10 bg-white dark:bg-[#1a3884] border-t border-slate-200 dark:border-white/10 items-center justify-between px-4 fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {/* Left: Spacer */}
        <div className="flex items-center gap-4">
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-800" title="Help">
                <HelpCircle className="w-4 h-4" />
            </button>
            
            <div className="w-px h-4 bg-slate-300"></div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setZoomLevel(Math.max(10, zoomLevel - 10))}
                    className="text-slate-500 hover:text-slate-800 p-1"
                >
                    <ZoomOut className="w-3.5 h-3.5" />
                </button>
                
                <div className="w-24">
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
                    className="text-slate-500 hover:text-slate-800 p-1"
                >
                    <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-mono w-10 text-center">{Math.round(zoomLevel)}%</span>
            </div>
            
            <button 
                onClick={onFitToScreen}
                className="text-slate-500 hover:text-slate-800 p-1" 
                title="Fit to Screen"
            >
                <Maximize className="w-3.5 h-3.5" />
            </button>
        </div>
    </div>
  );
};

export default EditorBottomBar;
