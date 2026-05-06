import React from "react";
import {
  Sticker,
  Palette,
  Type,
  LayoutTemplate,
  Settings2,
  Target,
  Sparkles,
  Layers3,
} from "lucide-react";

const EditorSidebar = ({ activePanel, setActivePanel }) => {
  const tabs = [
    { id: "templates", icon: LayoutTemplate, label: "Design" },
    { id: "assets", icon: Sticker, label: "Assets" },
    { id: "text", icon: Type, label: "Text" },
    { id: "style", icon: Palette, label: "Style" },
    { id: "layers", icon: Layers3, label: "Layers" },
    { id: "settings", icon: Settings2, label: "Canvas" },
    { id: "goals", icon: Target, label: "Goals" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-[68px] w-full flex-row items-center justify-around overflow-x-auto border-t border-slate-200 bg-white/96 px-1 backdrop-blur lg:relative lg:h-full lg:w-[88px] lg:flex-col lg:justify-start lg:gap-3 lg:border-r lg:border-t-0 lg:bg-[#0b1220] lg:px-3 lg:py-5 dark:border-slate-800 dark:bg-[#07101d]/96 lg:dark:bg-[#0b1220]">
      <div className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3884]/10 text-[#1a3884] dark:bg-white/5 dark:text-blue-300">
        <Sparkles className="h-5 w-5" />
      </div>
      {tabs.map((tab) => {
        const isActive = activePanel === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActivePanel(activePanel === tab.id ? null : tab.id)}
            className={`group relative flex h-full min-w-[56px] flex-1 flex-col items-center justify-center gap-1 transition-all lg:h-auto lg:w-full lg:flex-none lg:rounded-2xl lg:px-2 lg:py-3 ${isActive
                ? "text-[#1a3884] lg:bg-white/8 lg:text-white"
                : "text-slate-400 hover:text-slate-700 lg:text-slate-500 lg:hover:bg-white/5 lg:hover:text-white dark:hover:text-white"
              }`}
          >
            {isActive && (
              <>
                <div className="absolute left-3 right-3 top-0 h-0.5 rounded-b bg-[#1a3884] lg:hidden"></div>
                <div className="absolute left-0 top-3 bottom-3 hidden w-1 rounded-r bg-blue-400 lg:block"></div>
              </>
            )}

            <div className={`rounded-xl p-2 transition-all ${isActive ? "bg-[#1a3884]/12 lg:bg-white/10" : "lg:group-hover:bg-white/5"}`}>
              <tab.icon className="h-5 w-5 lg:h-[22px] lg:w-[22px]" strokeWidth={1.75} />
            </div>
            <span className="text-[8px] font-medium tracking-wide lg:text-[10px]">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default EditorSidebar;
