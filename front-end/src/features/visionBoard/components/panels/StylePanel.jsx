import React, { useRef } from "react";
import { ImageIcon } from "lucide-react";
import { 
  BACKGROUND_COLORS, 
  BORDER_RADIUS_PRESETS, 
  GAP_PRESETS 
} from "../../templates/gridTemplates";

const StylePanel = ({
  backgroundColor,
  setBackgroundColor,
  borderRadius,
  setBorderRadius,
  gap,
  setGap,
  backgroundImage,
  setBackgroundImage,
  handleBackgroundUpload
}) => {
  const backgroundInputRef = useRef(null);

  return (
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
  );
};

export default StylePanel;
