import React from "react";
import { Check, LayoutGrid } from "lucide-react";
import { GRID_TEMPLATES } from "../../templates/gridTemplates";

const TemplateSelector = ({ selectedTemplate, onSelect }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm dark:border-white/10 dark:from-white/10 dark:to-white/5 dark:bg-white/5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#7aa2ff]/15 dark:text-[#9cb9ff]">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Layout Presets
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/55">
              Choose a composition that matches the balance and pacing of the board.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.values(GRID_TEMPLATES).map((template) => {
          const isActive = selectedTemplate === template.id;

          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 ${
                isActive
                  ? "border-[#1a3884]/70 bg-[#1a3884]/[0.08] shadow-[0_20px_40px_-24px_rgba(26,56,132,0.7)]"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/90 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20 dark:hover:bg-white/[0.07]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {template.name}
                  </div>
                  <div className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-white/50">
                    {template.description}
                  </div>
                </div>
                {isActive ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a3884] text-white shadow-sm">
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:text-white/45">
                    {template.slots.length || 0} slots
                  </div>
                )}
              </div>

              <div
                className={`relative aspect-[1.05/1] overflow-hidden rounded-xl border p-2 ${
                  isActive
                    ? "border-[#1a3884]/25 bg-white/80 dark:bg-[#0d1732]/80"
                    : "border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-[#0f172a]/70"
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_55%)]" />

                {template.slots.length === 0 ? (
                  <div className="absolute inset-2 flex items-center justify-center rounded-lg border border-dashed border-slate-300/80 bg-white/75 text-[11px] font-medium text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-white/40">
                    Text-first canvas
                  </div>
                ) : (
                  template.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`absolute rounded-md transition-colors ${
                        isActive
                          ? "bg-[#1a3884]/70"
                          : "bg-slate-300/90 dark:bg-white/20"
                      }`}
                      style={{
                        left: `calc(${slot.x}% + 4px)`,
                        top: `calc(${slot.y}% + 4px)`,
                        width: `calc(${slot.width}% - 8px)`,
                        height: `calc(${slot.height}% - 8px)`,
                      }}
                    />
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;
