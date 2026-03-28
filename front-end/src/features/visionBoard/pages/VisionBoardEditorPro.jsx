import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

// Data & Utils
import {
  GRID_TEMPLATES,
  ASPECT_RATIOS,
} from "../templates/gridTemplates";
import { createVisionBoard } from "../services/visionBoardProApi";
import {
  moderateText,
  moderateTextAsync,
  moderateTextOverlaysAsync,
  getModerationWarning,
  loadToxicityModel,
} from "../utils/contentModeration";
import {
  checkBase64ImageNSFW,
  preloadNSFWModel,
} from "../utils/imageModeration";

// Layout Components
import EditorTopBar from "../components/layout/EditorTopBar";
import EditorSidebar from "../components/layout/EditorSidebar";
import EditorDrawer from "../components/layout/EditorDrawer";
import EditorCanvas from "../components/layout/EditorCanvas";
import EditorBottomBar from "../components/layout/EditorBottomBar";
import PreviewModal from "../components/modals/PreviewModal";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EDITOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const VisionBoardEditorPro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef(null);

  const TITLE_CHAR_LIMIT = 50;
  const DESCRIPTION_CHAR_LIMIT = 250;

  // Check authentication on mount
  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr || userStr === '{}' || userStr === 'undefined' || userStr === 'null') {
      toast({
        title: "Authentication Required",
        description: "Please log in to create vision boards",
        variant: "destructive",
      });
      navigate("/", { replace: true });
    }
  }, [navigate, toast]);

  // Board state
  const initialTitle = (location.state?.initialTitle || "Untitled Vision Board").slice(0, TITLE_CHAR_LIMIT);
  const initialDescription = (location.state?.initialDescription || "").slice(0, DESCRIPTION_CHAR_LIMIT);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [templateId, setTemplateId] = useState("grid-2x2");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [borderRadius, setBorderRadius] = useState(8);
  const [gap, setGap] = useState(8);
  const [images, setImages] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // New State for Canvas Layout
  const [zoomLevel, setZoomLevel] = useState(45); 
  const [activePanel, setActivePanel] = useState("templates"); // Default open panel

  // Auto-fit function
  const fitCanvas = () => {
    if (!canvasRef.current) return;
    
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const isMobile = containerWidth < 1024;
    
    // Target constraints
    const targetWidth = isMobile ? containerWidth - 32 : containerWidth - 420; // Mobile: total width - padding, Desktop: minus sidebar/drawer
    const targetHeight = isMobile ? containerHeight - 200 : containerHeight - 140; 
    
    const currentRatio = ASPECT_RATIOS[aspectRatio];
    if (!currentRatio) return;

    const scaleX = targetWidth / currentRatio.width;
    const scaleY = targetHeight / currentRatio.height;
    
    // Use the smaller scale to ensure it fits both dimensions
    const scale = Math.min(scaleX, scaleY);
    
    // Convert to percentage, clamp between 10% and 300%
    const newZoom = Math.min(Math.max(Math.floor(scale * 100) - 5, 10), 300);
    
    setZoomLevel(newZoom);
  };

  // Auto-fit on mount and when ratio changes
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
        fitCanvas();
    }, 100);
    
    window.addEventListener('resize', fitCanvas);
    return () => {
        window.removeEventListener('resize', fitCanvas);
        clearTimeout(timer);
    };
  }, [aspectRatio, templateId]); // Re-run when board shape changes

  // Handle background image upload with NSFW detection
  const handleBackgroundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target.result;
        try {
          const nsfwResult = await checkBase64ImageNSFW(imageData);

          if (!nsfwResult.isSafe) {
            toast({
              title: "Explicit Content",
              description: nsfwResult.reason || "Explicit content detected.",
              variant: "destructive",
            });
            return;
          }

          setBackgroundImage(imageData);
        } catch (error) {
          console.error("Error checking background image:", error);
          setBackgroundImage(imageData); // Fail open
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Text overlay state
  const [textOverlays, setTextOverlays] = useState({});
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [nextTextId, setNextTextId] = useState(1);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const handleInstantCheck = (text) => {
    // Use exact word-boundary matching to avoid false positives (e.g. "class" matching "ass")
    const result = moderateText(text, true);
    if (!result.isClean) {
      toast({
        title: "Inappropriate Content",
        description: "Your text contains inappropriate language. Please revise it.",
        variant: "destructive",
      });
      return true;
    }
    return false;
  };

  // Pre-load Toxicity Model and NSFW Detection Model
  useEffect(() => {
    const initModels = async () => {
      setIsModelLoading(true);
      await Promise.all([
        loadToxicityModel(),
        preloadNSFWModel(),
      ]);
      setIsModelLoading(false);
    };
    initModels();
  }, []);

  const currentTemplate = GRID_TEMPLATES[templateId];
  const currentRatio = ASPECT_RATIOS[aspectRatio];

  // Handle image upload to slot with NSFW detection
  const handleImageUpload = async (slotId, imageData) => {
    try {
      // Check for NSFW content before adding
      const nsfwResult = await checkBase64ImageNSFW(imageData);

      if (!nsfwResult.isSafe) {
        toast({
          title: "Explicit Content",
          description: nsfwResult.reason || "Explicit content detected.",
          variant: "destructive",
        });
        return;
      }

      // Add image to the slot
      setImages((prev) => ({
        ...prev,
        [slotId]: {
          slotIndex: slotId,
          url: imageData,
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
        },
      }));
      setSelectedSlot(slotId);
    } catch (error) {
      console.error("Error checking image:", error);
      // If check fails, allow the image (fail open) but notify
      setImages((prev) => ({
        ...prev,
        [slotId]: {
          slotIndex: slotId,
          url: imageData,
          position: { x: 0, y: 0 },
          scale: 1,
          rotation: 0,
        },
      }));
      setSelectedSlot(slotId);
    }
  };

  // Handle image update (pan, zoom, rotate)
  const handleImageUpdate = (slotId, updates) => {
    setImages((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        ...updates,
      },
    }));
  };

  // Handle image removal
  const handleImageRemove = (slotId) => {
    setImages((prev) => {
      const newImages = { ...prev };
      delete newImages[slotId];
      return newImages;
    });
    setSelectedSlot(null);
  };

  // Review this section for userUploads state
  const [userUploads, setUserUploads] = useState([]);

  // Handle user upload (for Uploads panel)
  const handleUserUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const imageData = event.target.result;
            // Optional: Check NSFW
            const nsfwResult = await checkBase64ImageNSFW(imageData);
            if (!nsfwResult.isSafe) {
                 toast({
                    title: "Explicit Content",
                    description: nsfwResult.reason || "Explicit content detected.",
                    variant: "destructive",
                });
                return;
            }
            setUserUploads(prev => [imageData, ...prev]);
        };
        reader.readAsDataURL(file);
    }
    e.target.value = "";
  };



  // Handle template change
  const handleTemplateChange = (newTemplateId) => {
    setTemplateId(newTemplateId);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT OVERLAY HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Add new text overlay
  const handleAddText = (textData) => {
    const id = `text-${nextTextId}`;
    setTextOverlays((prev) => ({
      ...prev,
      [id]: { ...textData, id },
    }));
    setNextTextId((prev) => prev + 1);
    setSelectedTextId(id);
    setSelectedSlot(null); // Deselect image slot
  };

  // Update text overlay
  const handleUpdateText = (id, updates) => {
    if (updates.text) {
      if (handleInstantCheck(updates.text)) return;
    }
    setTextOverlays((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  // Delete text overlay
  const handleDeleteText = (textId) => {
    setTextOverlays((prev) => {
      const newOverlays = { ...prev };
      delete newOverlays[textId];
      return newOverlays;
    });
    if (selectedTextId === textId) {
      setSelectedTextId(null);
    }
  };

  // Select text overlay
  const handleSelectText = (textId) => {
    setSelectedTextId(textId);
    setSelectedSlot(null); // Deselect image slot
  };

  // ═══════════════════════════════════════════════════════════════════════════

  // Save board
  const handleSave = async () => {
    if (!canvasRef.current) return;

    try {
      setIsSaving(true);

      // Check if moderation model is still loading
      if (isModelLoading) {
        toast({
          title: "Safety System Initializing",
          description: "Please wait a moment while we prepare the safety checks...",
        });
      }

      // Synchronous Gatekeeper Check
      if (handleInstantCheck(title)) {
        setIsSaving(false);
        return;
      }
      if (handleInstantCheck(description)) {
        setIsSaving(false);
        return;
      }

      // Check all text overlays synchronously first
      for (const overlay of Object.values(textOverlays)) {
        if (overlay.text && handleInstantCheck(overlay.text)) {
            setIsSaving(false);
            return;
        }
      }

      const trimmedTitle = title.slice(0, TITLE_CHAR_LIMIT).trim();
      const trimmedDescription = description.slice(0, DESCRIPTION_CHAR_LIMIT).trim();

      // Content moderation check before saving
      const titleCheck = await moderateTextAsync(trimmedTitle);
      if (!titleCheck.isClean) {
        toast({
          title: "Inappropriate Content",
          description: "Your vision board title contains inappropriate language. Please revise.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const descCheck = await moderateTextAsync(trimmedDescription);
      if (!descCheck.isClean) {
        toast({
            title: "Inappropriate Content",
            description: "Your vision board description contains inappropriate language. Please revise.",
            variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const overlaysCheck = await moderateTextOverlaysAsync(textOverlays);
      if (!overlaysCheck.isClean) {
        toast({
          title: "Inappropriate Content",
          description: getModerationWarning(overlaysCheck.flaggedItems),
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      setSelectedSlot(null); // Deselect before capture
      setSelectedTextId(null); // Deselect text before capture

      // Wait for React to re-render the DOM without selection borders
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Capture canvas using "Clone & Append" strategy to strictly enforce dimensions and ignore zoom
      const collageBase64 = await new Promise(async (resolve, reject) => {
        try {
          const originalCanvas = canvasRef.current;
          if (!originalCanvas) throw new Error("Canvas element not found");

          // Clone the canvas node
          const clone = originalCanvas.cloneNode(true);
          
          // Force exact pixel dimensions and reset transforms on the clone
          clone.style.transform = "none";
          clone.style.width = `${currentRatio.width}px`;
          clone.style.height = `${currentRatio.height}px`;
          // Position off-screen but part of DOM so html2canvas can render it
          clone.style.position = "fixed";
          clone.style.top = "0"; // Must be within viewport for some renderers, but z-index hides it
          clone.style.left = "0";
          clone.style.zIndex = "-9999";
          clone.style.margin = "0";
          // Ensure background is captured if set
          if (!backgroundColor || backgroundColor === 'transparent') {
             clone.style.backgroundColor = '#ffffff'; 
          }

          document.body.appendChild(clone);

          const canvas = await html2canvas(clone, {
            scale: 1, // 1:1 of the forced pixel size
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: null, // We set it on the element
            width: currentRatio.width,
            height: currentRatio.height,
            windowWidth: currentRatio.width, // Hint for full visibility
            windowHeight: currentRatio.height
          });

          document.body.removeChild(clone);
          resolve(canvas.toDataURL("image/png", 1.0));
        } catch (err) {
          reject(err);
        }
      });

      // Check authentication before saving
      const userStr = sessionStorage.getItem("user");
      if (!userStr || userStr === '{}' || userStr === 'undefined' || userStr === 'null') {
        toast({
          title: "Authentication Required",
          description: "Please log in to save your vision board",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }

      // Prepare board data
      const boardData = {
        title: trimmedTitle,
        description: trimmedDescription,
        templateId,
        canvasSettings: {
          aspectRatio,
          width: currentRatio.width,
          height: currentRatio.height,
          backgroundColor,
          backgroundImage, 
          borderRadius,
          gap,
        },
        collageImage: collageBase64, 
        slotImages: images, 
        textOverlays: textOverlays, 
      };

      await createVisionBoard(boardData);
      toast({
        title: "Saved!",
        description: "Vision board created successfully",
      });
      // Redirect to gallery after creating
      navigate("/vision-board-pro/gallery");
    } catch (error) {
      console.error("Save error:", error);

      if (error.message?.includes("not authenticated")) {
        toast({
          title: "Session Expired",
          description: "Please log in again to save your vision board",
          variant: "destructive",
        });
        navigate("/", { replace: true });
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to save vision board",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFitToScreen = () => {
     fitCanvas();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
      
      {/* Top Bar */}
      <EditorTopBar 
        title={title}
        setTitle={setTitle}
        onSave={handleSave}
        isSaving={isSaving}
        onPreview={() => setShowPreview(true)}
        handleInstantCheck={handleInstantCheck}
        // TODO: Implement undo/redo history tracking
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={false}
        canRedo={false}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Icon Sidebar */}
        <EditorSidebar 
            activePanel={activePanel} 
            setActivePanel={setActivePanel} 
        />

        {/* Slide-out Drawer Panel */}
        {activePanel && (
            <EditorDrawer 
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                // Props passed down to panels
                templateId={templateId}
                handleTemplateChange={handleTemplateChange}
                textOverlays={textOverlays}
                handleAddText={handleAddText}
                handleUpdateText={handleUpdateText}
                handleDeleteText={handleDeleteText}
                selectedTextId={selectedTextId}
                handleSelectText={handleSelectText}
                backgroundColor={backgroundColor}
                setBackgroundColor={setBackgroundColor}
                borderRadius={borderRadius}
                setBorderRadius={setBorderRadius}
                gap={gap}
                setGap={setGap}
                backgroundImage={backgroundImage}
                setBackgroundImage={setBackgroundImage}
                handleBackgroundUpload={handleBackgroundUpload}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                currentRatio={currentRatio}
                userUploads={userUploads}
                handleUserUpload={handleUserUpload}
            />
        )}

        {/* Main Canvas Area */}
        <EditorCanvas 
            canvasRef={canvasRef}
            displayWidth={currentRatio.width}
            displayHeight={currentRatio.height}
            backgroundColor={backgroundColor}
            backgroundImage={backgroundImage}
            borderRadius={borderRadius}
            gap={gap}
            currentTemplate={currentTemplate}
            images={images}
            handleImageUpload={handleImageUpload}
            handleImageUpdate={handleImageUpdate}
            handleImageRemove={handleImageRemove}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            textOverlays={textOverlays}
            selectedTextId={selectedTextId}
            setSelectedTextId={setSelectedTextId}
            handleSelectText={handleSelectText}
            handleUpdateText={handleUpdateText}
            zoomLevel={zoomLevel}
        />
      </div>

      {/* Bottom Bar */}
      <EditorBottomBar 
        zoomLevel={zoomLevel} 
        setZoomLevel={setZoomLevel} 
        onFitToScreen={handleFitToScreen} 
      />

      {/* Modals */}
      <PreviewModal 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
        canvasRef={canvasRef} 
        title={title} 
      />




    </div>
  );
};

export default VisionBoardEditorPro;
