import React from "react";
import {
  Palette,
  Type,
  LayoutTemplate,
  Upload,
  Settings2,
  Target
} from "lucide-react";

const EditorSidebar = ({ activePanel, setActivePanel }) => {
  const tabs = [
    { id: "templates", icon: LayoutTemplate, label: "Design" },
    { id: "text", icon: Type, label: "Text" },
    { id: "style", icon: Palette, label: "Style" },
    { id: "settings", icon: Settings2, label: "Canva Size" },
    { id: "goals", icon: Target, label: "Goals" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[60px] w-full bg-[#001229] flex flex-row items-center justify-around z-50 lg:relative lg:h-full lg:w-[72px] lg:flex-col lg:justify-start lg:py-4 lg:gap-4 flex-shrink-0 border-t border-white/10 lg:border-t-0 lg:border-r">
      {tabs.map((tab) => {
        const isActive = activePanel === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActivePanel(activePanel === tab.id ? null : tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 group relative lg:w-full lg:flex-none lg:h-auto lg:gap-1 lg:py-2 ${isActive ? "text-white" : "text-gray-400 hover:text-white"
              }`}
          >
            {/* Active Indication Bar - Top on mobile, Left on desktop */}
            {isActive && (
              <>
                <div className="absolute top-0 left-2 right-2 h-0.5 bg-teal-400 rounded-b lg:hidden"></div>
                <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-1 bg-teal-400 rounded-r"></div>
              </>
            )}

            <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-white/10" : "lg:group-hover:bg-white/5"}`}>
              <tab.icon className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={1.5} />
            </div>
            <span className="text-[9px] lg:text-[10px] font-medium tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default EditorSidebar;
