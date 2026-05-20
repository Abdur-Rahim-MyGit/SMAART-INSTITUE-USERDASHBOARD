import React from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Type,
  Sticker,
  Settings2,
  X,
  ChevronLeft,
  Target,
  LayoutTemplate,
  Layers3,
} from "lucide-react";
import TemplateSelector from "../panels/TemplateSelector";
import TypographyPanel from "../panels/TypographyPanel";
import StylePanel from "../panels/StylePanel";
import LayersPanel from "../panels/LayersPanel";
import AssetsPanel from "../panels/AssetsPanel";
import { ASPECT_RATIOS } from "../../templates/gridTemplates";

const PANEL_META = {
  templates: {
    title: "Layout",
    description: "Choose a strong structure first, then refine the composition.",
    icon: LayoutTemplate,
  },
  assets: {
    title: "Assets",
    description: "Build richer boards with shapes, badges, decorative packs, and saved uploads.",
    icon: Sticker,
  },
  text: {
    title: "Typography",
    description: "Add headlines, affirmations, and supporting copy.",
    icon: Type,
  },
  style: {
    title: "Canvas Style",
    description: "Tune colors, spacing, corners, and the overall mood.",
    icon: Palette,
  },
  layers: {
    title: "Layers",
    description: "Organize stacking order, lock content, and control precision tools.",
    icon: Layers3,
  },
  settings: {
    title: "Canvas Size",
    description: "Match the board ratio to phone, desktop, or presentation needs.",
    icon: Settings2,
  },
  // goals: {
  //   title: "Goals",
  //   description: "Keep short-term and long-term goals visible while you design.",
  //   icon: Target,
  // },
};

const GoalList = ({ title, description, goals, setGoals, placeholder, accentClass }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
    </div>

    <div className="space-y-2">
      {goals.map((goal, index) => (
        <div key={`${title}-${index}`} className="flex gap-2">
          <input
            type="text"
            defaultValue={goal}
            onBlur={(e) => {
              const nextGoals = [...goals];
              nextGoals[index] = e.target.value;
              setGoals(nextGoals);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const nextGoals = [...goals];
                nextGoals[index] = e.target.value;
                setGoals(nextGoals);
                e.target.blur();
              }
            }}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-[#1a3884] dark:border-slate-700 dark:bg-[#09111f] dark:text-white"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => setGoals(goals.filter((_, i) => i !== index))}
            className="rounded-xl p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setGoals([...goals, ""])}
        className={`w-full rounded-xl py-2 text-sm font-medium transition-colors ${accentClass}`}
      >
        + Add Goal
      </button>
    </div>
  </div>
);

const EditorDrawer = ({
  activePanel,
  setActivePanel,
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
  layers,
  selectedLayer,
  selectedLayers,
  handleSelectLayer,
  handleRenameLayer,
  handleToggleLayerVisibility,
  handleToggleLayerLock,
  handleMoveLayerForward,
  handleMoveLayerBackward,
  snapEnabled,
  setSnapEnabled,
  handleApplyAlignment,
  selectedImage,
  handleUpdateSelectedImage,
  handleDuplicateImage,
  handleDuplicateAsset,
  handleResetSelectedImage,
  userUploads,
  handleUserUpload,
  handleAddAssetToCanvas,
  handleAddUploadToCanvas,
  selectedText,
  aspectRatio,
  setAspectRatio,
  currentRatio,
  shortTermGoals = [],
  setShortTermGoals,
  longTermGoals = [],
  setLongTermGoals,
  handleDeleteAsset,
}) => {
  if (!activePanel) return null;

  const closeDrawer = () => setActivePanel(null);
  const currentMeta = PANEL_META[activePanel];
  const HeaderIcon = currentMeta?.icon || LayoutTemplate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, x: 0 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 12, x: -10 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-[68px] top-auto z-40 flex h-[64vh] flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-[0_-12px_28px_rgba(15,23,42,0.12)] lg:static lg:h-full lg:w-[360px] lg:rounded-none lg:border-r lg:border-t-0 lg:border-slate-200 lg:bg-[#f8fafc] lg:shadow-none dark:border-slate-800 dark:bg-[#0d1626] lg:dark:border-slate-800 lg:dark:bg-[#0d1626] xl:w-[380px]">
      <div className="flex w-full justify-center pb-1 pt-2 lg:hidden">
        <div className="h-1 w-10 rounded-full bg-slate-200 dark:bg-white/20" />
      </div>

      {/* <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-[#0d1626]/95">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1a3884]/10 text-[#1a3884] dark:bg-blue-400/20 dark:text-blue-300">
              <HeaderIcon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {currentMeta?.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {currentMeta?.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div> */}

      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-5 lg:pb-28">
        {activePanel === "templates" && (
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
              Template Library
            </p>
            <TemplateSelector
              selectedTemplate={templateId}
              onSelect={handleTemplateChange}
            />
          </div>
        )}

        {activePanel === "text" && (
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
              Typography
            </p>
            <TypographyPanel
              onAddText={handleAddText}
              textOverlays={textOverlays}
              onUpdateText={handleUpdateText}
              onDeleteText={handleDeleteText}
              selectedTextId={selectedTextId}
              onSelectText={handleSelectText}
            />
          </div>
        )}

        {activePanel === "assets" && (
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
              Assets
            </p>
            <AssetsPanel
              userUploads={userUploads}
              onUploadAsset={handleUserUpload}
              onAddAssetToCanvas={handleAddAssetToCanvas}
              onAddUploadToCanvas={handleAddUploadToCanvas}
            />
          </div>
        )}

        {activePanel === "style" && (
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
              Style
            </p>
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
          </div>
        )}

        {activePanel === "layers" && (
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
              Layers
            </p>
            <LayersPanel
              layers={layers}
              selectedLayer={selectedLayer}
              selectedLayers={selectedLayers}
              onSelectLayer={handleSelectLayer}
              onRenameLayer={handleRenameLayer}
              onToggleVisibility={handleToggleLayerVisibility}
              onToggleLock={handleToggleLayerLock}
              onMoveForward={handleMoveLayerForward}
              onMoveBackward={handleMoveLayerBackward}
              snapEnabled={snapEnabled}
              setSnapEnabled={setSnapEnabled}
              onApplyAlignment={handleApplyAlignment}
              selectedImage={selectedImage}
              onUpdateImage={handleUpdateSelectedImage}
              onDuplicateImage={handleDuplicateImage}
              onDuplicateAsset={handleDuplicateAsset}
              onResetImage={handleResetSelectedImage}
              selectedText={selectedText}
              onDeleteAsset={handleDeleteAsset}
              onDeleteText={handleDeleteText}
            />
          </div>
        )}

        {activePanel === "settings" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-300">
                Aspect Ratio
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAspectRatio(key)}
                    className={`rounded-2xl border px-3 py-3 text-left text-xs transition-all ${aspectRatio === key
                      ? "border-[#1a3884] bg-[#1a3884]/10 text-[#1a3884] dark:border-blue-400 dark:bg-blue-400/20 dark:text-blue-300"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                      }`}
                  >
                    <div className="mb-0.5 font-semibold">{key}</div>
                    <div className="text-[10px] opacity-60">
                      {ratio.width} x {ratio.height}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              <p className="mb-1 font-semibold text-slate-900 dark:text-white">Current Output</p>
              <p>{currentRatio?.width} x {currentRatio?.height} px</p>
            </div>
          </div>
        )}

        {/* {activePanel === "goals" && (
          <div className="space-y-6">
            <GoalList
              title="Short Term Goals"
              description="Near-term targets for the next one to six months."
              goals={shortTermGoals}
              setGoals={setShortTermGoals}
              placeholder="Enter short-term goal..."
              accentClass="bg-primary/10 text-primary hover:bg-primary/20 dark:bg-blue-400/10 dark:text-blue-300"
            />

            <GoalList
              title="Long Term Goals"
              description="Bigger milestones that anchor the broader vision."
              goals={longTermGoals}
              setGoals={setLongTermGoals}
              placeholder="Enter long-term goal..."
              accentClass="bg-emerald-500/8 text-emerald-700 hover:bg-emerald-500/12 dark:bg-emerald-500/10 dark:text-emerald-300"
            />
          </div>
        )} */}
      </div>

      <div
        className="absolute top-1/2 -right-3 z-0 hidden h-12 w-3 -translate-y-1/2 transform cursor-pointer items-center justify-center rounded-r-md border border-l-0 border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-600 dark:border-slate-800 dark:bg-[#0d1626] lg:flex"
        onClick={closeDrawer}
        title="Close Panel"
      >
        <ChevronLeft className="h-3 w-3" />
      </div>
    </motion.div>
  );
};

export default EditorDrawer;
