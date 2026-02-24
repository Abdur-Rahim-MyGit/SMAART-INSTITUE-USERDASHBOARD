import React, { useRef } from "react";
import { Palette, Type, Settings2, X, ChevronLeft, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TemplateSelector from "../panels/TemplateSelector";
import TypographyPanel from "../panels/TypographyPanel";
import StylePanel from "../panels/StylePanel";
import { ASPECT_RATIOS } from "../../templates/gridTemplates";

const EditorDrawer = ({
  activePanel,
  setActivePanel,
  // Props for Panels
  templateId,
  handleTemplateChange,
  textOverlays,
  handleAddText,
  handleUpdateText,
  handleDeleteText,
  selectedTextId,
  handleSelectText,
  backgroundColor,
  setBackgroundColor,
  borderRadius,
  setBorderRadius,
  gap,
  setGap,
  backgroundImage,
  setBackgroundImage,
  handleBackgroundUpload,
  aspectRatio,
  setAspectRatio,
  currentRatio,
  userUploads,
  handleUserUpload
}) => {
    
  if (!activePanel) return null;

  const closeDrawer = () => setActivePanel(null);

  return (
    <div className="fixed inset-x-0 bottom-[60px] top-auto h-[50vh] z-40 bg-white dark:bg-[#0b1f38] border-t border-slate-200 dark:border-white/10 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] rounded-t-2xl lg:static lg:w-[340px] lg:h-full lg:border-r lg:border-t-0 lg:shadow-xl lg:rounded-none transition-all duration-300">
      
      {/* Mobile Drag Handle */}
      <div className="w-full flex justify-center pt-2 pb-1 lg:hidden">
        <div className="w-10 h-1 bg-slate-200 dark:bg-white/20 rounded-full"></div>
      </div>

      {/* Drawer Header */}
      <div className="h-10 lg:h-14 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 bg-slate-50 dark:bg-white/5 rounded-t-2xl lg:rounded-none">
        <h3 className="font-semibold text-sm lg:text-base text-slate-800 dark:text-white capitalize flex items-center gap-2">
           {activePanel === 'templates' && <Type className="w-4 h-4 text-[#1a3884]" />} {/* Using Type icon as placeholder for templates if LayoutTemplate is not imported, or just reuse an existing one. Actually LayoutTemplate was not imported in this file. Let's check imports. */}
           {activePanel === 'style' && <Palette className="w-4 h-4 text-[#1a3884]" />}
           {activePanel === 'text' && <Type className="w-4 h-4 text-[#1a3884]" />}
           {activePanel === 'settings' && <Settings2 className="w-4 h-4 text-[#1a3884]" />}
           {activePanel}
        </h3>
        <button onClick={closeDrawer} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-8 lg:pb-24">
        
        {/* Templates Panel */}
        {activePanel === "templates" && (
            <div className="space-y-4">
                <p className="text-xs text-slate-500 mb-2">Choose a layout structure for your vision board.</p>
                <TemplateSelector
                    selectedTemplate={templateId}
                    onSelect={handleTemplateChange}
                />
            </div>
        )}

        {/* Text Panel */}
        {activePanel === "text" && (
            <TypographyPanel
                onAddText={handleAddText}
                textOverlays={textOverlays}
                onUpdateText={handleUpdateText}
                onDeleteText={handleDeleteText}
                selectedTextId={selectedTextId}
                onSelectText={handleSelectText}
            />
        )}

        {/* Style Panel */}
        {activePanel === "style" && (
            <StylePanel
                backgroundColor={backgroundColor}
                setBackgroundColor={setBackgroundColor}
                borderRadius={borderRadius}
                setBorderRadius={setBorderRadius}
                gap={gap}
                setGap={setGap}
                backgroundImage={backgroundImage}
                setBackgroundImage={setBackgroundImage}
                handleBackgroundUpload={handleBackgroundUpload}
            />
        )}

        {/* Settings Panel (Resize etc) */}
        {activePanel === "settings" && (
            <div className="space-y-6">
                <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    Canvas Size
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                    <button
                        key={key}
                        onClick={() => setAspectRatio(key)}
                        className={`px-3 py-3 text-xs rounded-xl transition-all text-left border ${aspectRatio === key
                        ? "bg-[#1a3884]/20 text-[#1a3884] font-medium border-[#1a3884]"
                        : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50 border-transparent hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                        }`}
                    >
                        <div className="font-medium mb-0.5">{key}</div>
                        <div className="text-[10px] opacity-60">
                        {ratio.width}×{ratio.height}
                        </div>
                    </button>
                    ))}
                </div>
                </div>
                
                <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-lg text-xs text-slate-600 dark:text-white/60">
                    <p>Current Dimensions: <strong>{currentRatio?.width} x {currentRatio?.height} px</strong></p>
                </div>
            </div>
        )}





      </div>
      
      {/* Collapse Handle (Optional, styling enhancement) */}
      <div 
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-3 h-12 bg-white dark:bg-[#0b1f38] border border-l-0 border-slate-200 dark:border-white/10 rounded-r-md flex items-center justify-center cursor-pointer shadow-sm z-0 text-slate-400 hover:text-slate-600"
        onClick={closeDrawer}
        title="Close Panel"
      >
        <ChevronLeft className="w-3 h-3" />
      </div>

    </div>
  );
};

export default EditorDrawer;

