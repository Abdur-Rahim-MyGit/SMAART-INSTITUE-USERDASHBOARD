import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Eye,
  Save,
  Loader2,
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
    <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200/50 bg-white/70 px-2 text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-slate-800/50 dark:bg-[#00152E]/80 dark:text-white sm:px-3">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          to="/vision-board-pro/gallery"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-[#002A5C]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:block">Boards</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/50 p-1 dark:border-white/10 dark:bg-slate-900/60 sm:flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#002A5C] dark:hover:text-white"
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
                  className="h-8 w-8 text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#002A5C] dark:hover:text-white"
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
        <div className="group relative flex min-h-[72px] items-center rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 shadow-inner transition-all focus-within:bg-white dark:border-white/10 dark:bg-slate-900/70">
          <div className="min-w-0 flex-1">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (handleInstantCheck) handleInstantCheck(e.target.value);
              }}
              className="h-8 border-0 bg-transparent px-0 text-left text-sm font-bold text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Untitled vision board"
            />
          </div>
          <div className="hidden flex-shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 shadow-sm transition-all dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 xl:flex">
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            ) : (
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
            )}
            <span>{statusLabel}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-10 gap-2 rounded-2xl border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-[#002A5C]"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Save</span>
        </Button>

        <Button
          className="h-10 gap-2 rounded-2xl bg-[#1a3884] px-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#1a3884]/90 hover:shadow-blue-500/40 dark:bg-[#1a3884] sm:px-4"
          onClick={onPreview}
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Preview</span>
        </Button>
      </div>
    </div>
  );
};

export default EditorTopBar;
