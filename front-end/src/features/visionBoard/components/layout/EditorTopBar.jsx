import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Eye,
  Cloud,
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
  return (
    <div className="h-14 bg-gradient-to-r from-[#005c97] to-[#363795] flex items-center justify-between px-3 text-white flex-shrink-0 z-50 shadow-md">
      {/* Left: Home & File Menu */}
      <div className="flex items-center gap-4">
        <Link
          to="/vision-board-pro/gallery"
          className="flex items-center gap-1 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold text-sm hidden sm:block">Home</span>
        </Link>

        
        {/* Undo/Redo - often in the header for Canva-like apps */}
        <div className="hidden sm:flex items-center gap-1 ml-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white hover:bg-white/10 hover:text-white h-8 w-8"
                            onClick={onUndo}
                            disabled={!canUndo}
                        >
                            <Undo2 className={`w-4 h-4 ${!canUndo ? 'opacity-40' : ''}`} />
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
                            className="text-white hover:bg-white/10 hover:text-white h-8 w-8"
                            onClick={onRedo}
                            disabled={!canRedo}
                        >
                            <Redo2 className={`w-4 h-4 ${!canRedo ? 'opacity-40' : ''}`} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Redo</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </div>

      {/* Center: Title */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
         <div className="relative group">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (handleInstantCheck) handleInstantCheck(e.target.value);
              }}
              className="bg-transparent border-transparent hover:border-white/20 focus:border-white/30 focus:bg-white/10 text-white placeholder:text-white/50 text-center font-medium h-8 transition-all"
              placeholder="Untitled Design"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isSaving ? (
                     <Loader2 className="w-3 h-3 animate-spin text-white/70" />
                ) : (
                    <Cloud className="w-3 h-3 text-white/70" />
                )}
            </div>
         </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">


         {/* Share Button */}
        <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 hover:text-white h-9 px-3 gap-2"
            onClick={onSave}
            disabled={isSaving}
        >
            {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Save</span>
        </Button>

        <Button 
            className="bg-white text-[#363795] hover:bg-slate-100 h-9 px-4 font-semibold gap-2"
            onClick={onPreview}
        >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  );
};

export default EditorTopBar;
