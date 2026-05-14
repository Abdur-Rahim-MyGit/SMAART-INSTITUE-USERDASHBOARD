import React from "react";
import {
  Sticker,
  Palette,
  Type,
  LayoutTemplate,
  Settings2,
  Target,
  Layers3,
} from "lucide-react";

// ─── Brand tokens (match tailwind.config.ts + index.css globals) ────────────
// Light  → sidebar bg : #ffffff  |  active fill : #1a3884  |  idle icon : #64748b
// Dark   → sidebar bg : #002147  |  active fill : #1a3884  |  idle icon : #94a3b8

const EditorSidebar = ({ activePanel, setActivePanel }) => {
  const tabs = [
    { id: "templates", icon: LayoutTemplate, label: "Design"  },
    { id: "assets",    icon: Sticker,        label: "Assets"  },
    { id: "text",      icon: Type,           label: "Text"    },
    { id: "style",     icon: Palette,        label: "Style"   },
    { id: "layers",    icon: Layers3,        label: "Layers"  },
    { id: "settings",  icon: Settings2,      label: "Canvas"  },
    { id: "goals",     icon: Target,         label: "Goals"   },
  ];

  return (
    /* ── Sidebar shell ────────────────────────────────────────────────────────
       Mobile  : fixed bottom bar  (h-[68px], horizontal scroll)
       Desktop : left column       (w-[80px], vertical stack)
       Light   : bg-white  border-slate-200
       Dark    : bg-[#002147] border-[#1a3884]/40   ← global navy theme  */
    <div
      className={[
        // mobile base
        "fixed bottom-0 left-0 right-0 z-50",
        "flex h-[68px] w-full flex-row items-center justify-around",
        "overflow-x-auto px-1",
        // desktop overrides
        "lg:relative lg:h-full lg:w-[80px]",
        "lg:flex-col lg:justify-start lg:gap-1",
        "lg:px-2 lg:py-5",
        // light mode colours
        "border-t border-slate-200 bg-white",
        "lg:border-r lg:border-t-0 lg:border-slate-200",
        // dark mode colours — fill with global navy
        "dark:border-[#1a3884]/40 dark:bg-[#002147]",
        "lg:dark:border-[#1a3884]/40 lg:dark:bg-[#002147]",
      ].join(" ")}
    >
      {tabs.map((tab) => {
        const isActive = activePanel === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            title={tab.label}
            onClick={() =>
              setActivePanel(activePanel === tab.id ? null : tab.id)
            }
            className={[
              // base
              "group relative flex h-full min-w-[52px] flex-1 flex-col",
              "items-center justify-center gap-1",
              "transition-all duration-200",
              // desktop shape
              "lg:h-auto lg:w-full lg:flex-none lg:rounded-xl lg:px-1 lg:py-2.5",
              // ── active state ──────────────────────────────────────────────
              isActive
                ? [
                    // light — primary blue fill, white text
                    "text-[#1a3884]",
                    "lg:bg-[#1a3884] lg:text-white lg:shadow-md",
                    // dark  — primary blue fill, white text (same pill colour)
                    "dark:text-white",
                    "lg:dark:bg-[#1a3884] lg:dark:text-white lg:dark:shadow-[0_4px_14px_rgba(26,56,132,0.45)]",
                  ].join(" ")
                // ── idle state ────────────────────────────────────────────
                : [
                    // light
                    "text-slate-400 lg:text-slate-500",
                    "lg:hover:bg-slate-100 lg:hover:text-[#1a3884]",
                    // dark — slate-300 so labels are readable on #002147
                    "dark:text-slate-300",
                    "lg:dark:hover:bg-[#1a3884]/20 lg:dark:hover:text-white",
                  ].join(" "),
            ].join(" ")}
          >
            {/* ── Mobile active indicator (top bar) ─────────────────────── */}
            {isActive && (
              <span className="absolute left-4 right-4 top-0 h-[3px] rounded-b bg-[#1a3884] dark:bg-blue-400 lg:hidden" />
            )}

            {/* ── Icon ──────────────────────────────────────────────────── */}
            <span
              className={[
                "rounded-lg p-1.5 transition-all duration-200",
                isActive
                  ? // active: icon sits on the filled pill directly
                    "text-[#1a3884] lg:text-white lg:dark:text-white"
                  : // idle: inherit button colour
                    "lg:group-hover:text-[#1a3884] dark:lg:group-hover:text-white",
              ].join(" ")}
            >
              <tab.icon
                className="h-[20px] w-[20px] lg:h-[21px] lg:w-[21px]"
                strokeWidth={isActive ? 2.25 : 1.75}
              />
            </span>

            {/* ── Label ─────────────────────────────────────────────────── */}
            <span
              className={[
                "text-[8px] font-semibold tracking-wide lg:text-[9.5px]",
                isActive
                  ? "text-[#1a3884] lg:text-white dark:text-white"
                  : "text-slate-400 dark:text-slate-300 group-hover:text-[#1a3884] dark:group-hover:text-white",
              ].join(" ")}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default EditorSidebar;
