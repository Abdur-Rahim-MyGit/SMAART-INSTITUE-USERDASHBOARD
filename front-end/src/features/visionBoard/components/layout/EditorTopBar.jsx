import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Eye,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EditorTopBar = ({
  title,
  setTitle,
  onSave,
  isSaving,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPreview,
  lastSaved,
  handleInstantCheck
}) => {
  const statusLabel = isSaving
    ? "Saving"
    : lastSaved
      ? `Saved ${new Date(lastSaved).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
      : "Ready";

  return (
    <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-2 text-slate-900 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-[#081120]/95 dark:text-white sm:px-3">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          to="/vision-board-pro/gallery"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:block">Boards</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/60 sm:flex">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            onClick={onUndo}
                            disabled={!canUndo}
                        >
                            <Undo2 className={`h-4 w-4 ${!canUndo ? 'opacity-40' : ''}`} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            onClick={onRedo}
                            disabled={!canRedo}
                        >
                            <Redo2 className={`h-4 w-4 ${!canRedo ? 'opacity-40' : ''}`} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </div>

      <div className="mx-1 min-w-0 flex-1 md:block">
         <div className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Vision Board Studio
              </p>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (handleInstantCheck) handleInstantCheck(e.target.value);
              }}
                className="h-7 border-0 bg-transparent px-0 text-left text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Untitled vision board"
            />
            </div>
            <div className="hidden flex-shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 xl:flex">
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-emerald-500" />}
              {statusLabel}
            </div>
         </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
            variant="outline" 
            className="h-10 gap-2 border-slate-200 bg-white px-3 text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onSave}
            disabled={isSaving}
        >
            {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Save</span>
        </Button>

        <Button 
            className="h-10 gap-2 bg-[#1a3884] px-3 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#132c6b] sm:px-4"
            onClick={onPreview}
        >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
        </Button>
      </div>
    </div>
  );
};

export default EditorTopBar;
