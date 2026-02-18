import React from "react";
import { Check } from "lucide-react";
import { GRID_TEMPLATES } from "../../templates/gridTemplates";

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE SELECTOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const TemplateSelector = ({ selectedTemplate, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.values(GRID_TEMPLATES).map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`relative p-2 rounded-xl border-2 transition-all duration-300 aspect-square group overflow-hidden ${
            selectedTemplate === template.id
              ? "border-[#30919D] bg-[#30919D]/10 shadow-lg shadow-[#30919D]/20"
              : "border-slate-200 dark:border-white/10 hover:border-[#30919D]/50 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10"
          }`}
        >
          {/* Mini preview of template */}
          <div className="w-full h-full relative opacity-90">
            {template.slots.map((slot, i) => (
              <div
                key={i}
                className={`absolute transition-all duration-300 ${
                  selectedTemplate === template.id
                    ? "bg-[#30919D]/60"
                    : "bg-slate-300 dark:bg-white/20"
                }`}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width - 2}%`,
                  height: `${slot.height - 2}%`,
                  borderRadius: "4px",
                }}
              />
            ))}
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
          {selectedTemplate === template.id && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#30919D] rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#001a38]">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default TemplateSelector;
