import React, { useRef } from "react";
import { Grid3X3, ImageIcon, PaintBucket, Square } from "lucide-react";
import {
  BACKGROUND_COLORS,
  BORDER_RADIUS_PRESETS,
  GAP_PRESETS,
} from "../../templates/gridTemplates";

const sectionClass =
  "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]";

const panelLabel =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45";

const StylePanel = ({
  backgroundColor,
  setBackgroundColor,
  borderRadius,
  setBorderRadius,
  gap,
  setGap,
  backgroundImage,
  setBackgroundImage,
  handleBackgroundUpload,
}) => {
  const backgroundInputRef = useRef(null);

  return (
    <div className="space-y-4">
      <div className={sectionClass}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#7aa2ff]/15 dark:text-[#9cb9ff]">
            <PaintBucket className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Canvas Styling
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/55">
              Shape the tone of the board with cleaner surfaces, spacing, and framing.
            </p>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <label className={panelLabel}>Background Color</label>
        <div className="grid grid-cols-6 gap-2">
          {BACKGROUND_COLORS.map((color) => {
            const active = backgroundColor === color;

            return (
              <button
                key={color}
                onClick={() => setBackgroundColor(color)}
                className={`h-9 w-9 rounded-xl border transition ${
                  active
                    ? "scale-110 border-slate-900 ring-2 ring-slate-300 dark:border-white dark:ring-white/25"
                    : "border-slate-200 hover:scale-105 dark:border-white/10"
                }`}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-white/75">
                Custom Tone
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-white/45">
                Fine tune the base canvas color.
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-white/10">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-white/60">
                {backgroundColor}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <Square className="h-4 w-4 text-slate-500 dark:text-white/50" />
          <label className="text-sm font-semibold text-slate-900 dark:text-white">
            Corner Radius
          </label>
          <span className="ml-auto text-xs font-medium text-[#1a3884] dark:text-[#9cb9ff]">
            {borderRadius === 9999 ? "Full" : `${borderRadius}px`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BORDER_RADIUS_PRESETS.map((preset) => {
            const active = borderRadius === preset.value;

            return (
              <button
                key={preset.value}
                onClick={() => setBorderRadius(preset.value)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-[#1a3884]/60 bg-[#1a3884]/[0.08]"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                }`}
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {preset.label}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-white/45">
                  {preset.value === 9999 ? "Circular framing" : `${preset.value}px corners`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-slate-500 dark:text-white/50" />
          <label className="text-sm font-semibold text-slate-900 dark:text-white">
            Slot Spacing
          </label>
          <span className="ml-auto text-xs font-medium text-[#1a3884] dark:text-[#9cb9ff]">
            {gap}px
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {GAP_PRESETS.map((preset) => {
            const active = gap === preset.value;

            return (
              <button
                key={preset.value}
                onClick={() => setGap(preset.value)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-[#1a3884]/60 bg-[#1a3884]/[0.08]"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                }`}
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {preset.label}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-white/45">
                  {preset.value === 0 ? "Edge to edge collage" : `${preset.value}px breathing room`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-slate-500 dark:text-white/50" />
          <label className="text-sm font-semibold text-slate-900 dark:text-white">
            Background Image
          </label>
        </div>
        <p className="mb-4 text-xs leading-5 text-slate-500 dark:text-white/50">
          Use a subtle scene or texture behind the composition when a flat color feels too minimal.
        </p>

        <input
          ref={backgroundInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundUpload}
          className="hidden"
        />

        {backgroundImage ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="relative h-40 overflow-hidden">
              <img
                src={backgroundImage}
                alt="Background preview"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                <div className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700">
                  Background Applied
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => backgroundInputRef.current?.click()}
                    className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-white"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => setBackgroundImage(null)}
                    className="rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => backgroundInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-[#1a3884]/35 hover:bg-[#1a3884]/[0.04] dark:border-white/15 dark:bg-white/[0.03] dark:hover:border-[#7aa2ff]/25 dark:hover:bg-[#7aa2ff]/[0.05]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-white/10">
              <ImageIcon className="h-5 w-5 text-slate-500 dark:text-white/55" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white">
                Upload Background
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-white/45">
                JPG, PNG, or artwork that sets the mood.
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default StylePanel;
