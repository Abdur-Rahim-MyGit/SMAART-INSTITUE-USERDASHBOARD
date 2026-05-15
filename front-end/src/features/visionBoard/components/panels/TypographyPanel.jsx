import React, { useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Layers,
  Plus,
  RectangleHorizontal,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import {
  FONT_CATEGORIES,
  TEXT_COLORS,
  TEXT_EFFECTS,
  TEXT_STYLE_PRESETS,
} from "../../utils/constants";

const sectionClass =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]";

const labelClass =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45";

const sliderClass =
  "h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#1a3884] dark:bg-white/10";

const backgroundOptions = [
  { id: "none", label: "None" },
  { id: "soft", label: "Soft Block" },
  { id: "pill", label: "Pill" },
];

const TypographyPanel = ({
  onAddText,
  textOverlays,
  onUpdateText,
  onDeleteText,
  selectedTextId,
  onSelectText,
}) => {
  const [expandedCategory, setExpandedCategory] = useState("script");
  const selectedOverlay = selectedTextId ? textOverlays[selectedTextId] : null;
  const layerEntries = useMemo(
    () => Object.entries(textOverlays).filter(([, overlay]) => !overlay.hidden),
    [textOverlays]
  );

  const createTextOverlay = (seed = {}) =>
    onAddText({
      text: "Dream it here",
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 32,
      fontWeight: "700",
      color: "#FFFFFF",
      effect: "none",
      position: { x: 50, y: 50 },
      align: "center",
      rotation: 0,
      lineHeight: 1.15,
      letterSpacing: 0,
      opacity: 1,
      maxWidth: 280,
      backgroundStyle: "none",
      backgroundColor: "rgba(255,255,255,0.9)",
      ...seed,
    });

  const applyPreset = (preset) => {
    if (selectedTextId) {
      onUpdateText(selectedTextId, {
        text: preset.text,
        ...preset.styles,
      });
      return;
    }

    createTextOverlay({
      text: preset.text,
      ...preset.styles,
    });
  };

  return (
    <div className="space-y-4">
      {/* <div className={sectionClass}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#7aa2ff]/15 dark:text-[#9cb9ff]">
            <Type className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Editorial Type
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/55">
              Build hierarchy with refined copy, typographic rhythm, and presentation styles.
            </p>
          </div>
        </div>
        <button
          onClick={() => createTextOverlay()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a3884] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#132c6b]"
        >
          <Plus className="h-4 w-4" />
          Add Text Layer
        </button>
      </div> */}

      <div className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <RectangleHorizontal className="h-4 w-4 text-slate-500 dark:text-white/50" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Text Styles
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TEXT_STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/50 px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
            >
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {preset.name}
              </div>
              <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-white/45">
                {preset.text}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedOverlay && (
        <div className={sectionClass}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Selected Text
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-white/50">
                Tune composition, wrapping, opacity, and background treatment.
              </div>
            </div>
            <button
              onClick={() => onDeleteText(selectedTextId)}
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-red-200 text-red-600 shadow-sm transition-all hover:bg-red-50 hover:shadow-md dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
              title="Delete text"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Content</label>
              <textarea
                value={selectedOverlay.text}
                onChange={(e) => onUpdateText(selectedTextId, { text: e.target.value })}
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/50 px-3 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#1a3884]/40 focus:bg-white focus:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                placeholder="Enter your text"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Size</label>
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={selectedOverlay.fontSize}
                  onChange={(e) =>
                    onUpdateText(selectedTextId, { fontSize: parseInt(e.target.value, 10) })
                  }
                  className={sliderClass}
                />
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-white/55">
                  {selectedOverlay.fontSize}px
                </div>
              </div>
              <div>
                <label className={labelClass}>Rotation</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedOverlay.rotation || 0}
                  onChange={(e) =>
                    onUpdateText(selectedTextId, { rotation: parseInt(e.target.value, 10) })
                  }
                  className={sliderClass}
                />
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-white/55">
                  {selectedOverlay.rotation || 0} deg
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Line Height</label>
                <input
                  type="range"
                  min="0.8"
                  max="2"
                  step="0.05"
                  value={selectedOverlay.lineHeight || 1.15}
                  onChange={(e) =>
                    onUpdateText(selectedTextId, { lineHeight: parseFloat(e.target.value) })
                  }
                  className={sliderClass}
                />
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-white/55">
                  {(selectedOverlay.lineHeight || 1.15).toFixed(2)}
                </div>
              </div>
              <div>
                <label className={labelClass}>Letter Spacing</label>
                <input
                  type="range"
                  min="-1"
                  max="8"
                  step="0.1"
                  value={selectedOverlay.letterSpacing || 0}
                  onChange={(e) =>
                    onUpdateText(selectedTextId, { letterSpacing: parseFloat(e.target.value) })
                  }
                  className={sliderClass}
                />
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-white/55">
                  {(selectedOverlay.letterSpacing || 0).toFixed(1)}px
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Opacity</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={selectedOverlay.opacity ?? 1}
                  onChange={(e) =>
                    onUpdateText(selectedTextId, { opacity: parseFloat(e.target.value) })
                  }
                  className={sliderClass}
                />
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-white/55">
                  {Math.round((selectedOverlay.opacity ?? 1) * 100)}%
                </div>
              </div>
              <div>
                <label className={labelClass}>Max Width</label>
                <input
                  type="range"
                  min="120"
                  max="600"
                  step="10"
                  value={selectedOverlay.maxWidth || 280}
                  onChange={(e) =>
                    onUpdateText(selectedTextId, { maxWidth: parseInt(e.target.value, 10) })
                  }
                  className={sliderClass}
                />
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-white/55">
                  {selectedOverlay.maxWidth || 280}px
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Alignment</label>
              <div className="flex rounded-2xl border border-slate-200 bg-slate-50/50 p-1 dark:border-white/10 dark:bg-white/[0.04]">
                {[
                  { value: "left", icon: AlignLeft },
                  { value: "center", icon: AlignCenter },
                  { value: "right", icon: AlignRight },
                ].map(({ value, icon: Icon }) => {
                  const active = selectedOverlay.align === value;

                  return (
                    <button
                      key={value}
                      onClick={() => onUpdateText(selectedTextId, { align: value })}
                      className={`flex-1 rounded-xl p-2 transition-all duration-200 ${active
                          ? "bg-white text-[#1a3884] shadow-md dark:bg-[#1a3884]/20 dark:text-[#9cb9ff]"
                          : "text-slate-500 hover:text-slate-900 dark:text-white/45 dark:hover:text-white"
                        }`}
                    >
                      <Icon className="mx-auto h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Color</label>
              <div className="flex flex-wrap gap-2">
                {TEXT_COLORS.slice(0, 12).map((color) => {
                  const active = selectedOverlay.color === color;

                  return (
                    <button
                      key={color}
                      onClick={() => onUpdateText(selectedTextId, { color })}
                      className={`h-8 w-8 rounded-lg border transition ${active
                          ? "scale-110 border-slate-900 ring-2 ring-slate-300 dark:border-white dark:ring-white/25"
                          : "border-slate-200 hover:scale-105 dark:border-white/10"
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
                <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65">
                  Custom
                  <input
                    type="color"
                    value={selectedOverlay.color}
                    onChange={(e) => onUpdateText(selectedTextId, { color: e.target.value })}
                    className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass}>Background Treatment</label>
              <div className="grid grid-cols-3 gap-2">
                {backgroundOptions.map((option) => {
                  const active = (selectedOverlay.backgroundStyle || "none") === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onUpdateText(selectedTextId, { backgroundStyle: option.id })}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${active
                          ? "border-[#1a3884]/60 bg-[#1a3884]/[0.08] text-[#1a3884] dark:text-[#9cb9ff]"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
                        }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {(selectedOverlay.backgroundStyle || "none") !== "none" && (
                <div className="mt-3">
                  <label className={labelClass}>Background Color</label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                    <input
                      type="color"
                      value={selectedOverlay.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        onUpdateText(selectedTextId, { backgroundColor: e.target.value })
                      }
                      className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="text-xs text-slate-600 dark:text-white/55">
                      {selectedOverlay.backgroundColor || "#ffffff"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">
                <Sparkles className="h-3.5 w-3.5" />
                Effect
              </label>
              <div className="flex flex-wrap gap-2">
                {TEXT_EFFECTS.map((effect) => {
                  const active = selectedOverlay.effect === effect.id;

                  return (
                    <button
                      key={effect.id}
                      onClick={() => onUpdateText(selectedTextId, { effect: effect.id })}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${active
                          ? "border-[#1a3884]/60 bg-[#1a3884] text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65 dark:hover:border-white/20"
                        }`}
                    >
                      {effect.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={sectionClass}>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Font Library
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-white/50">
            Curated families for different moods and board styles.
          </p>
        </div>

        <div className="space-y-3">
          {Object.entries(FONT_CATEGORIES).map(([key, category]) => {
            const isOpen = expandedCategory === key;

            return (
              <div
                key={key}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <button
                  onClick={() => setExpandedCategory(isOpen ? null : key)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base shadow-sm dark:bg-white/10">
                      <span>{category.icon}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {category.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-white/50">
                        {category.description}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:text-white/45">
                    {category.fonts.length}
                  </div>
                </button>

                {isOpen && (
                  <div className="grid gap-2 border-t border-slate-200/70 p-3 dark:border-white/10">
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
                            return;
                          }

                          createTextOverlay({
                            text: font.preview,
                            fontFamily: font.family,
                            fontWeight: font.weight || "400",
                            fontStyle: font.style || "normal",
                            color: "#0f172a",
                          });
                        }}
                        className="rounded-xl border border-transparent bg-white px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:border-white/10 dark:hover:bg-white/[0.07]"
                      >
                        <div
                          className="truncate text-xl text-slate-900 dark:text-white"
                          style={{
                            fontFamily: font.family,
                            fontWeight: font.weight || "400",
                            fontStyle: font.style || "normal",
                          }}
                        >
                          {font.preview}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-700 dark:text-white/75">
                            {font.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-white/45">
                            {font.useCase}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {layerEntries.length > 0 && (
        <div className={sectionClass}>
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-500 dark:text-white/50" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Text Layers
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-white/55">
              {layerEntries.length}
            </span>
          </div>

          <div className="space-y-2">
            {layerEntries.map(([id, overlay], index) => {
              const active = selectedTextId === id;

              return (
                <div
                  key={id}
                  onClick={() => onSelectText(id)}
                  className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${active
                      ? "border-[#1a3884]/60 bg-[#1a3884]/[0.07]"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                    }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectText(id);
                    }
                  }}
                >
                  <div className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 shadow-sm dark:bg-white/10 dark:text-white/45">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm text-slate-900 dark:text-white"
                      style={{ fontFamily: overlay.fontFamily }}
                    >
                      {overlay.text}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-white/45">
                      {overlay.fontSize}px
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteText(id);
                    }}
                    className="opacity-0 transition group-hover:opacity-100"
                    title="Delete layer"
                  >
                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TypographyPanel;
