import React, { useState } from "react";
import {
  Type,
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FONT_CATEGORIES, TEXT_EFFECTS, TEXT_COLORS } from "../../utils/constants";

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const TypographyPanel = ({
  onAddText,
  textOverlays,
  onUpdateText,
  onDeleteText,
  selectedTextId,
  onSelectText,
}) => {
  const [expandedCategory, setExpandedCategory] = useState("script");
  const [showEffects, setShowEffects] = useState(false);

  return (
    <div className="space-y-4">
      {/* Google Fonts Link - Typically this should be in index.html or proper head management, but keeping here as requested */}
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Pacifico&family=Great+Vibes&family=Montserrat:wght@200;400;700;900&family=Oswald:wght@400;700&family=Anton&family=Bebas+Neue&family=Raleway:wght@200;400&family=Quicksand:wght@300;400;500&family=Poppins:wght@300;400;500;600&family=Inter:wght@300;400;500&family=Permanent+Marker&family=Indie+Flower&family=Amatic+SC:wght@400;700&family=Special+Elite&family=Lobster&family=Righteous&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poiret+One&family=Sacramento&family=Satisfy&display=swap"
        rel="stylesheet"
      />

      {/* Add Text Button */}
      <button
        onClick={() =>
          onAddText({
            text: "Your Text Here",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 32,
            fontWeight: "700",
            color: "#FFFFFF",
            effect: "none",
            position: { x: 50, y: 50 },
            align: "center",
            rotation: 0,
          })
        }
        className="w-full py-3 bg-gradient-to-r from-[#1a3884] to-[#132c6b] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-[#132c6b] hover:to-[#1f6670] transition-all shadow-md hover:shadow-[#1a3884]/40 hover:-translate-y-0.5"
      >
        <Plus className="w-5 h-5" />
        Add Text
      </button>

      {/* Active Text Editor */}
      {selectedTextId && textOverlays[selectedTextId] && (
        <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#1a3884] flex items-center gap-2">
              <Type className="w-4 h-4" /> Edit Text
            </span>
            <button
              onClick={() => onDeleteText(selectedTextId)}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              title="Delete text"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={textOverlays[selectedTextId].text}
            onChange={(e) =>
              onUpdateText(selectedTextId, { text: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border rounded-lg mb-4 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-[#1a3884]/50 focus:ring-1 focus:ring-[#1a3884]/50 outline-none transition-all"
            placeholder="Enter your text..."
          />

          {/* Font Size */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium text-slate-600 dark:text-white/60 w-8">Size</span>
            <input
              type="range"
              min="12"
              max="120"
              value={textOverlays[selectedTextId].fontSize}
              onChange={(e) =>
                onUpdateText(selectedTextId, {
                  fontSize: parseInt(e.target.value),
                })
              }
              className="flex-1 accent-[#1a3884] h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-700 dark:text-white/80 w-8 text-right bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded">
              {textOverlays[selectedTextId].fontSize}
            </span>
          </div>

          {/* Text Color */}
          <div className="mb-4">
            <span className="text-xs font-medium text-slate-600 dark:text-white/60 block mb-2">Color</span>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateText(selectedTextId, { color })}
                  className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${textOverlays[selectedTextId].color === color
                    ? "ring-2 ring-slate-300 dark:ring-white border-transparent"
                    : "border-slate-300/60 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/50"
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={textOverlays[selectedTextId].color}
                onChange={(e) =>
                  onUpdateText(selectedTextId, { color: e.target.value })
                }
                className="w-6 h-6 rounded-md cursor-pointer border-none bg-transparent p-0"
              />
            </div>
          </div>

          {/* Text Align */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-slate-600 dark:text-white/60 w-8">Align</span>
            <div className="flex bg-slate-100 dark:bg-black/20 rounded-lg p-0.5 border border-slate-200 dark:border-white/5">
              {[
                { value: "left", icon: AlignLeft },
                { value: "center", icon: AlignCenter },
                { value: "right", icon: AlignRight },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onUpdateText(selectedTextId, { align: value })}
                  className={`p-1.5 rounded-md transition-all ${textOverlays[selectedTextId].align === value
                    ? "bg-[#1a3884] text-white shadow-sm"
                    : "text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Text Effects */}
          <div className="mb-4">
            <span className="text-xs font-medium text-slate-600 dark:text-white/60 block mb-2">Effect</span>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_EFFECTS.map((effect) => (
                <button
                  key={effect.id}
                  onClick={() =>
                    onUpdateText(selectedTextId, { effect: effect.id })
                  }
                  className={`px-2 py-1 text-[10px] rounded-lg border transition-all ${textOverlays[selectedTextId].effect === effect.id
                    ? "bg-[#1a3884] text-white border-[#1a3884] font-medium"
                    : "bg-transparent text-slate-500 dark:text-white/60 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  {effect.name}
                </button>
              ))}
            </div>
          </div>

          {/* Text Rotation */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-white/60">Rotation</span>
              <span className="text-xs font-mono text-slate-700 dark:text-white/80 bg-slate-100 dark:bg-white/5 px-1 py-0.5 rounded">
                {textOverlays[selectedTextId].rotation || 0}°
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={textOverlays[selectedTextId].rotation || 0}
              onChange={(e) =>
                onUpdateText(selectedTextId, {
                  rotation: parseInt(e.target.value),
                })
              }
              className="w-full accent-[#1a3884] h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer mb-2"
            />
          </div>
        </div>
      )}

      {/* Font Categories */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2">
          Font Library
        </h3>

        {Object.entries(FONT_CATEGORIES).map(([key, category]) => (
          <div key={key} className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-white/5">
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === key ? null : key)
              }
              className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors ${expandedCategory === key ? "bg-slate-50 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
            >
              <div className="flex items-center gap-2">
                <span>{category.icon}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white/80">
                  {category.name}
                </span>
              </div>
              {expandedCategory === key ? (
                <ChevronUp className="w-4 h-4 text-slate-400 dark:text-white/50" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-white/50" />
              )}
            </button>

            <AnimatePresence>
              {expandedCategory === key && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 space-y-1 border-t border-slate-100 dark:border-white/5">
                    {category.fonts.map((font) => (
                      <button
                        key={font.name}
                        onClick={() => {
                          if (selectedTextId) {
                            onUpdateText(selectedTextId, {
                              fontFamily: font.family,
                              fontWeight: font.weight || "400",
                              fontStyle: font.style || "normal",
                            });
                          } else {
                            onAddText({
                              text: font.preview,
                              fontFamily: font.family,
                              fontSize: 32,
                              fontWeight: font.weight || "400",
                              fontStyle: font.style || "normal",
                              color: "#000000",
                              effect: "none",
                              position: { x: 50, y: 50 },
                              align: "center",
                              rotation: 0,
                            });
                          }
                        }}
                        className="w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-left group border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                      >
                        <div
                          className="text-xl text-slate-800 dark:text-white/90 truncate"
                          style={{
                            fontFamily: font.family,
                            fontWeight: font.weight || "400",
                            fontStyle: font.style || "normal",
                          }}
                        >
                          {font.preview}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-500 dark:text-white/50">
                            {font.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Text Overlays List */}
      {Object.keys(textOverlays).length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Layers className="w-3 h-3" />
            Layers ({Object.keys(textOverlays).length})
          </h3>
          {Object.entries(textOverlays).map(([id, overlay]) => (
            <button
              key={id}
              onClick={() => onSelectText(id)}
              className={`w-full px-3 py-2 rounded-lg border text-left transition-all flex items-center justify-between group ${selectedTextId === id
                ? "border-[#1a3884] bg-[#1a3884]/5"
                : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 bg-white dark:bg-white/5"
                }`}
            >
              <div className="truncate flex-1 mr-2">
                <div
                  className="text-sm truncate text-slate-800 dark:text-white/85"
                  style={{ fontFamily: overlay.fontFamily }}
                >
                  {overlay.text}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                 <Trash2 
                    className="w-4 h-4 text-slate-400 hover:text-red-500" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteText(id);
                    }}
                 />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TypographyPanel;


