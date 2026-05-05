import React from "react";
import {
  AlignCenter,
  AlignHorizontalSpaceAround,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignVerticalSpaceAround,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  ImageIcon,
  Layers3,
  Lock,
  ScanLine,
  Type,
  Unlock,
} from "lucide-react";
import { IMAGE_FILTER_PRESETS } from "../../utils/constants";

const sectionClass =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]";

const labelClass =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45";

const sliderClass =
  "h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#1a3884] dark:bg-white/10";

const tintSwatches = [
  "rgba(0,0,0,0)",
  "rgba(15,23,42,0.14)",
  "rgba(255,255,255,0.14)",
  "rgba(59,130,246,0.14)",
  "rgba(236,72,153,0.14)",
  "rgba(16,185,129,0.14)",
];

const alignmentButtons = [
  { id: "align-left", label: "Left", hint: "Align left", icon: AlignLeft },
  { id: "align-center", label: "Center", hint: "Align center", icon: AlignCenter },
  { id: "align-right", label: "Right", hint: "Align right", icon: AlignRight },
  { id: "align-top", label: "Top", hint: "Align top", icon: AlignJustify },
  { id: "align-middle", label: "Middle", hint: "Align middle", icon: AlignCenter },
  { id: "align-bottom", label: "Bottom", hint: "Align bottom", icon: AlignJustify },
  { id: "distribute-horizontal", label: "Space X", hint: "Distribute horizontally", icon: AlignHorizontalSpaceAround },
  { id: "distribute-vertical", label: "Space Y", hint: "Distribute vertically", icon: AlignVerticalSpaceAround },
  { id: "center-canvas", label: "Canvas", hint: "Center on canvas", icon: ScanLine },
];

const LayersPanel = ({
  layers,
  selectedLayer,
  selectedLayers,
  onSelectLayer,
  onRenameLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveForward,
  onMoveBackward,
  snapEnabled,
  setSnapEnabled,
  onApplyAlignment,
  selectedImage,
  onUpdateImage,
  onDuplicateImage,
  onDuplicateAsset,
  onResetImage,
  selectedText,
}) => {
  const orderedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="space-y-4">
      <div className={sectionClass}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#7aa2ff]/15 dark:text-[#9cb9ff]">
            <Layers3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Layers & Precision
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/55">
              Organize the stack, refine the active selection, and align with intention.
            </p>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Precision Tools
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-white/50">
              Center snapping stays subtle and helps with cleaner placement.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 transition ${
              snapEnabled
                ? "border-[#1a3884]/20 bg-[#1a3884]/10 text-[#1a3884] dark:border-[#7aa2ff]/25 dark:bg-[#7aa2ff]/12 dark:text-[#9cb9ff]"
                : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
            }`}
            aria-pressed={snapEnabled}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              Snap
            </span>
            <span
              className={`relative h-6 w-10 rounded-full transition ${
                snapEnabled ? "bg-[#1a3884]" : "bg-slate-300 dark:bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  snapEnabled ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
          Shift-click layers or canvas items to build a multi-selection. Arrow keys nudge the active selection.
        </div>
      </div>

      {selectedImage && (
        <div className={sectionClass}>
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-slate-500 dark:text-white/50" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Selected Image
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Framing</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "fit", label: "Fit" },
                  { id: "fill", label: "Fill" },
                  { id: "crop", label: "Crop" },
                ].map((mode) => {
                  const active = (selectedImage.fitMode || "fit") === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        onUpdateImage({ fitMode: mode.id, cropMode: mode.id === "crop" })
                      }
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                        active
                          ? "border-[#1a3884]/60 bg-[#1a3884]/[0.08] text-[#1a3884] dark:text-[#9cb9ff]"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Brightness</label>
                <input
                  type="range"
                  min="60"
                  max="140"
                  value={selectedImage.brightness ?? 100}
                  onChange={(e) => onUpdateImage({ brightness: parseInt(e.target.value, 10) })}
                  className={sliderClass}
                />
              </div>
              <div>
                <label className={labelClass}>Contrast</label>
                <input
                  type="range"
                  min="60"
                  max="140"
                  value={selectedImage.contrast ?? 100}
                  onChange={(e) => onUpdateImage({ contrast: parseInt(e.target.value, 10) })}
                  className={sliderClass}
                />
              </div>
              <div>
                <label className={labelClass}>Blur</label>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.2"
                  value={selectedImage.blur ?? 0}
                  onChange={(e) => onUpdateImage({ blur: parseFloat(e.target.value) })}
                  className={sliderClass}
                />
              </div>
              <div>
                <label className={labelClass}>Scale</label>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.05"
                  value={selectedImage.scale ?? 1}
                  onChange={(e) => onUpdateImage({ scale: parseFloat(e.target.value) })}
                  className={sliderClass}
                />
              </div>
            </div>

            {(selectedImage.fitMode || "fit") === "crop" && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      Crop & Focal Point
                    </div>
                    <div className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-white/45">
                      Fine-tune what stays centered in the frame.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateImage({ position: { x: 0, y: 0 }, scale: 1 })}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                  >
                    Reset Focus
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Focal X</label>
                    <input
                      type="range"
                      min="-140"
                      max="140"
                      value={selectedImage.position?.x ?? 0}
                      onChange={(e) =>
                        onUpdateImage({
                          position: {
                            x: parseInt(e.target.value, 10),
                            y: selectedImage.position?.y ?? 0,
                          },
                        })
                      }
                      className={sliderClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Focal Y</label>
                    <input
                      type="range"
                      min="-140"
                      max="140"
                      value={selectedImage.position?.y ?? 0}
                      onChange={(e) =>
                        onUpdateImage({
                          position: {
                            x: selectedImage.position?.x ?? 0,
                            y: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className={sliderClass}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { id: "left", label: "Left", x: -70, y: 0 },
                    { id: "center", label: "Center", x: 0, y: 0 },
                    { id: "right", label: "Right", x: 70, y: 0 },
                    { id: "top", label: "Top", x: 0, y: -70 },
                    { id: "mid", label: "Middle", x: 0, y: 0 },
                    { id: "bottom", label: "Bottom", x: 0, y: 70 },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onUpdateImage({ position: { x: preset.x, y: preset.y } })}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Filter Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onUpdateImage({ ...preset.values, filterPreset: preset.id })}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      (selectedImage.filterPreset || "clean") === preset.id
                        ? "border-[#1a3884]/60 bg-[#1a3884]/[0.08]"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04]"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Overlay Tint</label>
              <div className="flex flex-wrap gap-2">
                {tintSwatches.map((tint) => {
                  const active = (selectedImage.tint || "rgba(0,0,0,0)") === tint;
                  return (
                    <button
                      key={tint}
                      type="button"
                      onClick={() => onUpdateImage({ tint })}
                      className={`h-8 w-8 rounded-full border transition ${
                        active
                          ? "scale-110 border-slate-900 ring-2 ring-slate-300 dark:border-white dark:ring-white/25"
                          : "border-slate-200 dark:border-white/10"
                      }`}
                      style={{ backgroundColor: tint === "rgba(0,0,0,0)" ? "#ffffff" : tint }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onResetImage}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
              >
                Reset Transform
              </button>
              <button
                type="button"
                onClick={onDuplicateImage}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
              >
                Duplicate Image
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedText && (
        <div className={sectionClass}>
          <div className="mb-3 flex items-center gap-2">
            <Type className="h-4 w-4 text-slate-500 dark:text-white/50" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Selected Text
            </h3>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
            Text styling now lives in the Typography panel. Use this layer panel for stacking, visibility, locking, and alignment.
          </div>
        </div>
      )}

      <div className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-slate-500 dark:text-white/50" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Alignment
          </h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-white/55">
            {selectedLayers.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {alignmentButtons.map((button) => {
            const Icon = button.icon;
            return (
              <button
                key={button.id}
                type="button"
                disabled={selectedLayers.length === 0}
                onClick={() => onApplyAlignment(button.id)}
                title={button.hint}
                className="group rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-2 py-3 text-center transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 dark:border-white/10 dark:bg-white/[0.04] dark:from-white/[0.05] dark:to-white/[0.02]"
              >
                <span className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-[#1a3884]/10 group-hover:text-[#1a3884] dark:bg-white/[0.06] dark:text-white/60 dark:group-hover:bg-[#7aa2ff]/12 dark:group-hover:text-[#9cb9ff]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="block text-[11px] font-semibold text-slate-700 dark:text-white/70">
                  {button.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Layer Stack
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-white/50">
              Topmost items appear first.
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-white/55">
            {orderedLayers.length}
          </span>
        </div>

        <div className="space-y-2">
          {orderedLayers.map((layer) => {
            const isSelected = selectedLayers.some(
              (entry) => entry.id === layer.id && entry.type === layer.type
            );
            const Icon = layer.type === "text" ? Type : ImageIcon;

            return (
              <div
                key={`${layer.type}-${layer.id}`}
                className={`rounded-xl border px-3 py-3 transition ${
                  isSelected
                    ? "border-[#1a3884]/60 bg-[#1a3884]/[0.07]"
                    : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={(event) =>
                      onSelectLayer(layer.id, layer.type, event.shiftKey || event.metaKey || event.ctrlKey)
                    }
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm dark:bg-white/10 dark:text-white/55"
                  >
                    <Icon className="h-4 w-4" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={layer.name}
                      onChange={(e) => onRenameLayer(layer.id, layer.type, e.target.value)}
                      onFocus={(event) =>
                        onSelectLayer(layer.id, layer.type, event.shiftKey || event.metaKey || event.ctrlKey)
                      }
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none dark:text-white"
                    />
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-white/45">
                      {layer.type === "text" ? "Text layer" : layer.type === "asset" ? "Canvas asset" : "Image slot"} · z{layer.zIndex}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(layer.id, layer.type)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                  >
                    {layer.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {layer.hidden ? "Hidden" : "Visible"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLock(layer.id, layer.type)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                  >
                    {layer.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                    {layer.locked ? "Locked" : "Unlocked"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveForward(layer.id, layer.type)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    Forward
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveBackward(layer.id, layer.type)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    Backward
                  </button>
                  {layer.type === "image" && (
                    <button
                      type="button"
                      onClick={() => onDuplicateImage(layer.id)}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </button>
                  )}
                  {layer.type === "asset" && (
                    <button
                      type="button"
                      onClick={() => onDuplicateAsset(layer.id)}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;
