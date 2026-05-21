import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

// Data & Utils
import {
  GRID_TEMPLATES,
  ASPECT_RATIOS,
} from "../templates/gridTemplates";
import {
  createVisionBoard,
  getVisionBoard,
  updateVisionBoard,
} from "../services/visionBoardProApi";
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

  const initialShortTermGoals = location.state?.initialShortTermGoals || [];
  const initialLongTermGoals = location.state?.initialLongTermGoals || [];

  const boardId = location.state?.boardId || location.state?.editBoardId || null;
  const isEditing = Boolean(location.state?.isEditing || boardId);

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [shortTermGoals, setShortTermGoals] = useState(initialShortTermGoals);
  const [longTermGoals, setLongTermGoals] = useState(initialLongTermGoals);
  const [templateId, setTemplateId] = useState("grid-2x2");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [backgroundImage, setBackgroundImage] = useState(location.state?.backgroundImage || null);
  const [borderRadius, setBorderRadius] = useState(8);
  const [gap, setGap] = useState(8);
  const [images, setImages] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [guideState, setGuideState] = useState({ vertical: false, horizontal: false });

  // New State for Canvas Layout
  const [zoomLevel, setZoomLevel] = useState(50); 
  const [activePanel, setActivePanel] = useState("templates"); 
  const isFirstRender = useRef(true);

  // Auto-fit function
  const fitCanvas = () => {
    if (!canvasRef.current) return;

    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const isMobile = containerWidth < 1024;

    // Leave enough breathing room for the tool chrome so the board reads like a preview surface.
    // Dynamic width based on panel state: Sidebar (80px) + Drawer (380px)
    const sidebarWidth = isMobile ? 0 : 80;
    const drawerWidth = (isMobile || !activePanel) ? 0 : 380;
    const uiWidth = sidebarWidth + drawerWidth;
    
    const targetWidth = containerWidth - uiWidth - (isMobile ? 32 : 80); // Reduced margin
    const targetHeight = containerHeight - (isMobile ? 220 : 160); // Reduced height margin (TopBar + BottomBar)

    const currentRatio = ASPECT_RATIOS[aspectRatio];
    if (!currentRatio) return;

    const scaleX = targetWidth / currentRatio.width;
    const scaleY = targetHeight / currentRatio.height;

    const scale = Math.min(scaleX, scaleY);

    const maxZoom = isMobile ? 85 : 150;
    const paddingBuffer = isMobile ? 5 : 2; // Much tighter fit
    const newZoom = Math.min(
      Math.max(Math.floor(scale * 100) - paddingBuffer, 10),
      maxZoom
    );

    setZoomLevel(newZoom);
  };

  // Auto-fit on mount and when ratio changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fitCanvas();
    }, 100);

    window.addEventListener('resize', fitCanvas);
    return () => {
      window.removeEventListener('resize', fitCanvas);
      clearTimeout(timer);
    };
  }, [aspectRatio, templateId, activePanel]); // Re-run when board shape or UI layout changes

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
  const [assetOverlays, setAssetOverlays] = useState({});
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [nextTextId, setNextTextId] = useState(1);
  const [nextAssetId, setNextAssetId] = useState(1);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [userUploads, setUserUploads] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({ canUndo: false, canRedo: false });
  const historyBootstrappedRef = useRef(false);
  const applyingSnapshotRef = useRef(false);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const lastSnapshotRef = useRef(null);
  const draftLoadAttemptedRef = useRef(false);
  const draftRestoredRef = useRef(false);
  const boardLoadAttemptedRef = useRef(false);

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

  const getDraftKey = () => {
    let userId = "guest";
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      userId = user?.id || user?._id || user?.email || "guest";
    } catch (error) {
      userId = "guest";
    }
    return `vision-board-pro:draft:${userId}:${boardId || "new"}`;
  };

  const buildEditorSnapshot = () => ({
    title,
    description,
    shortTermGoals,
    longTermGoals,
    templateId,
    aspectRatio,
    backgroundColor,
    backgroundImage,
    borderRadius,
    gap,
    images,
    textOverlays,
    assetOverlays,
    userUploads,
    nextTextId,
    nextAssetId,
  });

  const updateHistoryMeta = () => {
    setHistoryMeta({
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
    });
  };

  const applySnapshot = (snapshot) => {
    if (!snapshot) return;
    applyingSnapshotRef.current = true;
    setTitle(snapshot.title || "Untitled Vision Board");
    setDescription(snapshot.description || "");
    setShortTermGoals(snapshot.shortTermGoals || []);
    setLongTermGoals(snapshot.longTermGoals || []);
    setTemplateId(snapshot.templateId || "grid-2x2");
    setAspectRatio(snapshot.aspectRatio || "1:1");
    setBackgroundColor(snapshot.backgroundColor || "#FFFFFF");
    setBackgroundImage(snapshot.backgroundImage || null);
    setBorderRadius(snapshot.borderRadius ?? 8);
    setGap(snapshot.gap ?? 8);
    setImages(snapshot.images || {});
    setTextOverlays(snapshot.textOverlays || {});
    setAssetOverlays(snapshot.assetOverlays || {});
    setUserUploads(snapshot.userUploads || []);
    setNextTextId(snapshot.nextTextId || 1);
    setNextAssetId(snapshot.nextAssetId || 1);
    syncPrimarySelection([]);
  };

  const extractNextId = (entries, prefix) => {
    const maxId = Object.keys(entries || {}).reduce((max, key) => {
      const match = `${key}`.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (!match) return max;
      return Math.max(max, parseInt(match[1], 10));
    }, 0);
    return maxId + 1;
  };

  const normalizeBoardSnapshot = (board) => {
    const slotImages = board?.slotImages
      ? JSON.parse(JSON.stringify(board.slotImages))
      : {};
    const savedTextOverlays = board?.textOverlays
      ? JSON.parse(JSON.stringify(board.textOverlays))
      : {};
    const savedAssetOverlays = board?.assetOverlays
      ? JSON.parse(JSON.stringify(board.assetOverlays))
      : {};
    const savedUserUploads = Array.isArray(board?.userUploads)
      ? JSON.parse(JSON.stringify(board.userUploads))
      : [];

    return {
      title: (board?.title || "Untitled Vision Board").slice(0, TITLE_CHAR_LIMIT),
      description: (board?.description || "").slice(0, DESCRIPTION_CHAR_LIMIT),
      shortTermGoals: board?.shortTermGoals || [],
      longTermGoals: board?.longTermGoals || [],
      templateId: board?.templateId || "grid-2x2",
      aspectRatio: board?.canvasSettings?.aspectRatio || "1:1",
      backgroundColor: board?.canvasSettings?.backgroundColor || "#FFFFFF",
      backgroundImage: board?.canvasSettings?.backgroundImage || null,
      borderRadius: board?.canvasSettings?.borderRadius ?? 8,
      gap: board?.canvasSettings?.gap ?? 8,
      images: slotImages,
      textOverlays: savedTextOverlays,
      assetOverlays: savedAssetOverlays,
      userUploads: savedUserUploads,
      nextTextId: extractNextId(savedTextOverlays, "text"),
      nextAssetId: extractNextId(savedAssetOverlays, "asset"),
    };
  };

  const getNextLayerZIndex = () => {
    const imageZ = Object.values(images).map((item) => item?.zIndex || 10);
    const assetZ = Object.values(assetOverlays).map((item) => item?.zIndex || 35);
    const textZ = Object.values(textOverlays).map((item) => item?.zIndex || 50);
    return Math.max(0, ...imageZ, ...assetZ, ...textZ) + 1;
  };

  const selectedLayer = selectedTextId
    ? { id: selectedTextId, type: "text" }
    : selectedAssetId
      ? { id: selectedAssetId, type: "asset" }
      : selectedSlot !== null
        ? { id: selectedSlot, type: "image" }
        : null;

  const selectedImage = selectedSlot !== null ? images[selectedSlot] : null;
  const selectedText = selectedTextId ? textOverlays[selectedTextId] : null;
  const selectedAsset = selectedAssetId ? assetOverlays[selectedAssetId] : null;

  const layers = useMemo(() => {
    const imageLayers = Object.entries(images).map(([id, image]) => ({
      id: Number(id),
      type: "image",
      name: image.name || `Image ${Number(id) + 1}`,
      hidden: Boolean(image.hidden),
      locked: Boolean(image.locked),
      zIndex: image.zIndex || 10,
    }));

    const textLayers = Object.entries(textOverlays).map(([id, overlay]) => ({
      id,
      type: "text",
      name: overlay.name || overlay.text || "Text layer",
      hidden: Boolean(overlay.hidden),
      locked: Boolean(overlay.locked),
      zIndex: overlay.zIndex || 50,
    }));

    const assetLayers = Object.entries(assetOverlays).map(([id, asset]) => ({
      id,
      type: "asset",
      name: asset.name || "Canvas asset",
      hidden: Boolean(asset.hidden),
      locked: Boolean(asset.locked),
      zIndex: asset.zIndex || 35,
    }));

    return [...imageLayers, ...assetLayers, ...textLayers];
  }, [assetOverlays, images, textOverlays]);

  const updateLayerItem = (id, type, updates) => {
    if (type === "image") {
      setImages((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          ...updates,
        },
      }));
      return;
    }

    if (type === "asset") {
      setAssetOverlays((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          ...updates,
        },
      }));
      return;
    }

    setTextOverlays((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates,
      },
    }));
  };

  const syncPrimarySelection = (nextSelectedLayers) => {
    setSelectedLayers(nextSelectedLayers);
    const lastSelected = nextSelectedLayers[nextSelectedLayers.length - 1];

    if (!lastSelected) {
      setSelectedSlot(null);
      setSelectedTextId(null);
      setSelectedAssetId(null);
      return;
    }

    if (lastSelected.type === "image") {
      setSelectedSlot(lastSelected.id);
      setSelectedTextId(null);
      setSelectedAssetId(null);
      return;
    }

    if (lastSelected.type === "asset") {
      setSelectedAssetId(lastSelected.id);
      setSelectedSlot(null);
      setSelectedTextId(null);
      return;
    }

    setSelectedTextId(lastSelected.id);
    setSelectedSlot(null);
    setSelectedAssetId(null);
  };

  const buildSelection = (id, type, additive = false) => {
    if (!additive) {
      syncPrimarySelection([{ id, type }]);
      return;
    }

    setSelectedLayers((prev) => {
      const exists = prev.some((entry) => entry.id === id && entry.type === type);
      const nextSelectedLayers = exists
        ? prev.filter((entry) => !(entry.id === id && entry.type === type))
        : [...prev, { id, type }];

      const lastSelected = exists
        ? nextSelectedLayers[nextSelectedLayers.length - 1]
        : { id, type };

      if (!lastSelected) {
        setSelectedSlot(null);
        setSelectedTextId(null);
        setSelectedAssetId(null);
      } else if (lastSelected.type === "image") {
        setSelectedSlot(lastSelected.id);
        setSelectedTextId(null);
        setSelectedAssetId(null);
      } else if (lastSelected.type === "asset") {
        setSelectedAssetId(lastSelected.id);
        setSelectedSlot(null);
        setSelectedTextId(null);
      } else {
        setSelectedTextId(lastSelected.id);
        setSelectedSlot(null);
        setSelectedAssetId(null);
      }

      return nextSelectedLayers;
    });
  };

  const swapLayerOrder = (id, type, direction) => {
    const ordered = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const currentIndex = ordered.findIndex(
      (layer) => layer.id === id && layer.type === type
    );

    if (currentIndex === -1) return;

    const targetIndex = direction === "forward" ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= ordered.length) return;

    const currentLayer = ordered[currentIndex];
    const targetLayer = ordered[targetIndex];

    updateLayerItem(currentLayer.id, currentLayer.type, { zIndex: targetLayer.zIndex });
    updateLayerItem(targetLayer.id, targetLayer.type, { zIndex: currentLayer.zIndex });
  };

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
          fitMode: "fit",
          cropMode: false,
          brightness: 100,
          contrast: 100,
          blur: 0,
          tint: "rgba(0,0,0,0)",
          filterPreset: "clean",
          name: `Image ${slotId + 1}`,
          hidden: false,
          locked: false,
          zIndex: getNextLayerZIndex(),
        },
      }));
      syncPrimarySelection([{ id: slotId, type: "image" }]);
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
          fitMode: "fit",
          cropMode: false,
          brightness: 100,
          contrast: 100,
          blur: 0,
          tint: "rgba(0,0,0,0)",
          filterPreset: "clean",
          name: `Image ${slotId + 1}`,
          hidden: false,
          locked: false,
          zIndex: getNextLayerZIndex(),
        },
      }));
      syncPrimarySelection([{ id: slotId, type: "image" }]);
    }
  };

  // Handle image update (pan, zoom, rotate)
  const handleImageUpdate = (slotId, updates) => {
    if (images[slotId]?.locked) return;
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
    syncPrimarySelection(
      selectedLayers.filter((entry) => !(entry.type === "image" && entry.id === slotId))
    );
  };

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
        setUserUploads((prev) => [
          {
            id: `upload-${Date.now()}`,
            name: file.name.replace(/\.[^.]+$/, ""),
            src: imageData,
            width: 180,
            height: 180,
          },
          ...prev,
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleAddAssetToCanvas = (asset) => {
    const id = `asset-${nextAssetId}`;
    setAssetOverlays((prev) => ({
      ...prev,
      [id]: {
        id,
        name: asset.name,
        src: asset.src,
        width: asset.width || 160,
        height: asset.height || 160,
        position: { x: 50, y: 50 },
        rotation: 0,
        scale: 1,
        opacity: 1,
        hidden: false,
        locked: false,
        zIndex: getNextLayerZIndex(),
      },
    }));
    setNextAssetId((prev) => prev + 1);
    syncPrimarySelection([{ id, type: "asset" }]);
  };

  const handleAddUploadToCanvas = (upload) => {
    handleAddAssetToCanvas({
      name: upload.name || "Saved upload",
      src: upload.src || upload,
      width: upload.width || 180,
      height: upload.height || 180,
    });
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
      [id]: {
        ...textData,
        id,
        name: textData.name || `Text ${nextTextId}`,
        hidden: false,
        locked: false,
        zIndex: getNextLayerZIndex(),
        lineHeight: textData.lineHeight || 1.15,
        letterSpacing: textData.letterSpacing || 0,
        opacity: textData.opacity ?? 1,
        scale: textData.scale || 1,
        maxWidth: textData.maxWidth || 280,
        backgroundStyle: textData.backgroundStyle || "none",
        backgroundColor: textData.backgroundColor || "rgba(255,255,255,0.9)",
      },
    }));
    setNextTextId((prev) => prev + 1);
    syncPrimarySelection([{ id, type: "text" }]);
  };

  // Update text overlay
  const handleUpdateText = (id, updates) => {
    if (textOverlays[id]?.locked && !("locked" in updates) && !("hidden" in updates) && !("name" in updates) && !("zIndex" in updates)) {
      return;
    }
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
    syncPrimarySelection(
      selectedLayers.filter((entry) => !(entry.type === "text" && entry.id === textId))
    );
  };

  const handleDeleteAsset = (assetId) => {
    setAssetOverlays((prev) => {
      const next = { ...prev };
      delete next[assetId];
      return next;
    });
    syncPrimarySelection(
      selectedLayers.filter((entry) => !(entry.type === "asset" && entry.id === assetId))
    );
  };

  // Select text overlay
  const handleSelectText = (textId, additive = false) => {
    if (textOverlays[textId]?.hidden) return;
    buildSelection(textId, "text", additive);
  };

  const handleSelectAsset = (assetId, additive = false) => {
    if (assetOverlays[assetId]?.hidden) return;
    buildSelection(assetId, "asset", additive);
  };

  const handleSelectLayer = (id, type, additive = false) => {
    if (type === "image") {
      if (images[id]?.hidden) return;
      buildSelection(id, type, additive);
      return;
    }

    if (type === "asset") {
      if (assetOverlays[id]?.hidden) return;
      buildSelection(id, type, additive);
      return;
    }

    if (textOverlays[id]?.hidden) return;
    buildSelection(id, type, additive);
  };

  const handleRenameLayer = (id, type, name) => {
    updateLayerItem(id, type, { name });
  };

  const handleToggleLayerVisibility = (id, type) => {
    const source =
      type === "image" ? images[id] : type === "asset" ? assetOverlays[id] : textOverlays[id];
    const nextHidden = !source?.hidden;
    updateLayerItem(id, type, { hidden: nextHidden });
    if (nextHidden) {
      syncPrimarySelection(
        selectedLayers.filter((entry) => !(entry.type === type && entry.id === id))
      );
    }
  };

  const handleToggleLayerLock = (id, type) => {
    const source =
      type === "image" ? images[id] : type === "asset" ? assetOverlays[id] : textOverlays[id];
    updateLayerItem(id, type, { locked: !source?.locked });
  };

  const handleMoveLayerForward = (id, type) => {
    swapLayerOrder(id, type, "forward");
  };

  const handleMoveLayerBackward = (id, type) => {
    swapLayerOrder(id, type, "backward");
  };

  const handleUpdateSelectedImage = (updates) => {
    if (selectedSlot === null) return;
    handleImageUpdate(selectedSlot, updates);
  };

  const handleUpdateAsset = (id, updates) => {
    if (assetOverlays[id]?.locked && !("locked" in updates) && !("hidden" in updates) && !("name" in updates) && !("zIndex" in updates)) {
      return;
    }
    setAssetOverlays((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates,
      },
    }));
  };

  const handleResetSelectedImage = () => {
    if (selectedSlot === null || !images[selectedSlot]) return;
    handleImageUpdate(selectedSlot, {
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      fitMode: "fit",
      cropMode: false,
      brightness: 100,
      contrast: 100,
      blur: 0,
      tint: "rgba(0,0,0,0)",
      filterPreset: "clean",
    });
  };

  const duplicateImageToSlot = (slotId) => {
    const sourceImage = images[slotId];
    if (!sourceImage) return;

    const availableSlot = currentTemplate.slots.find(
      (slot) => !images[slot.id] && slot.id !== slotId
    );

    if (!availableSlot) {
      toast({
        title: "No Empty Slot",
        description: "Add another layout slot before duplicating this image.",
      });
      return;
    }

    setImages((prev) => ({
      ...prev,
      [availableSlot.id]: {
        ...sourceImage,
        slotIndex: availableSlot.id,
        name: `${sourceImage.name || `Image ${slotId + 1}`} Copy`,
        position: { ...(sourceImage.position || { x: 0, y: 0 }) },
        zIndex: getNextLayerZIndex(),
      },
    }));
    syncPrimarySelection([{ id: availableSlot.id, type: "image" }]);
  };

  const handleDuplicateImage = (slotId = selectedSlot) => {
    if (slotId === null || slotId === undefined) return;
    duplicateImageToSlot(slotId);
  };

  const handleDuplicateAsset = (assetId = selectedAssetId) => {
    if (!assetId || !assetOverlays[assetId]) return;
    const sourceAsset = assetOverlays[assetId];
    const id = `asset-${nextAssetId}`;
    setAssetOverlays((prev) => ({
      ...prev,
      [id]: {
        ...sourceAsset,
        id,
        name: `${sourceAsset.name} Copy`,
        position: {
          x: Math.min((sourceAsset.position?.x || 50) + 6, 94),
          y: Math.min((sourceAsset.position?.y || 50) + 6, 94),
        },
        zIndex: getNextLayerZIndex(),
      },
    }));
    setNextAssetId((prev) => prev + 1);
    syncPrimarySelection([{ id, type: "asset" }]);
  };

  const handleApplyAlignment = (mode) => {
    if (selectedLayers.length === 0) return;

    const selectedTextLayers = selectedLayers
      .filter((entry) => entry.type === "text")
      .map((entry) => ({
        id: entry.id,
        overlay: textOverlays[entry.id],
      }))
      .filter(({ overlay }) => overlay && !overlay.locked && !overlay.hidden);

    const selectedImageLayers = selectedLayers
      .filter((entry) => entry.type === "image")
      .map((entry) => ({
        id: entry.id,
        image: images[entry.id],
      }))
      .filter(({ image }) => image && !image.locked && !image.hidden);

    const selectedAssetLayers = selectedLayers
      .filter((entry) => entry.type === "asset")
      .map((entry) => ({
        id: entry.id,
        asset: assetOverlays[entry.id],
      }))
      .filter(({ asset }) => asset && !asset.locked && !asset.hidden);

    const updateTextPosition = (id, position) =>
      handleUpdateText(id, {
        position: {
          x: Math.max(0, Math.min(100, position.x)),
          y: Math.max(0, Math.min(100, position.y)),
        },
      });

    const updateImagePosition = (id, position) =>
      handleImageUpdate(id, {
        position,
      });

    const updateAssetPosition = (id, position) =>
      handleUpdateAsset(id, {
        position: {
          x: Math.max(0, Math.min(100, position.x)),
          y: Math.max(0, Math.min(100, position.y)),
        },
      });

    const sortByAxis = (items, axis) =>
      [...items].sort((a, b) => (a.overlay?.position?.[axis] ?? a.image?.position?.[axis] ?? 0) - (b.overlay?.position?.[axis] ?? b.image?.position?.[axis] ?? 0));

    switch (mode) {
      case "align-left":
        selectedTextLayers.forEach(({ id }) => updateTextPosition(id, { x: 12, y: textOverlays[id].position.y }));
        selectedImageLayers.forEach(({ id }) => updateImagePosition(id, { x: -80, y: images[id].position?.y || 0 }));
        selectedAssetLayers.forEach(({ id }) => updateAssetPosition(id, { x: 12, y: assetOverlays[id].position.y }));
        break;
      case "align-center":
      case "center-canvas":
        selectedTextLayers.forEach(({ id }) => updateTextPosition(id, { x: 50, y: textOverlays[id].position.y }));
        selectedImageLayers.forEach(({ id }) => updateImagePosition(id, { x: 0, y: images[id].position?.y || 0 }));
        selectedAssetLayers.forEach(({ id }) => updateAssetPosition(id, { x: 50, y: assetOverlays[id].position.y }));
        if (mode === "center-canvas") {
          selectedTextLayers.forEach(({ id }) => updateTextPosition(id, { x: 50, y: 50 }));
          selectedImageLayers.forEach(({ id }) => updateImagePosition(id, { x: 0, y: 0 }));
          selectedAssetLayers.forEach(({ id }) => updateAssetPosition(id, { x: 50, y: 50 }));
        }
        break;
      case "align-right":
        selectedTextLayers.forEach(({ id }) => updateTextPosition(id, { x: 88, y: textOverlays[id].position.y }));
        selectedImageLayers.forEach(({ id }) => updateImagePosition(id, { x: 80, y: images[id].position?.y || 0 }));
        selectedAssetLayers.forEach(({ id }) => updateAssetPosition(id, { x: 88, y: assetOverlays[id].position.y }));
        break;
      case "align-top":
        selectedTextLayers.forEach(({ id }) => updateTextPosition(id, { x: textOverlays[id].position.x, y: 12 }));
        selectedImageLayers.forEach(({ id }) => updateImagePosition(id, { x: images[id].position?.x || 0, y: -80 }));
        selectedAssetLayers.forEach(({ id }) => updateAssetPosition(id, { x: assetOverlays[id].position.x, y: 12 }));
        break;
      case "align-middle":
        selectedTextLayers.forEach(({ id }) => updateTextPosition(id, { x: textOverlays[id].position.x, y: 50 }));
        selectedImageLayers.forEach(({ id }) => updateImagePosition(id, { x: images[id].position?.x || 0, y: 0 }));
        selectedAssetLayers.forEach(({ id }) => updateAssetPosition(id, { x: assetOverlays[id].position.x, y: 50 }));
        break;
      case "align-bottom":
        selectedTextLayers.forEach(({ id }) => updateTextPosition(id, { x: textOverlays[id].position.x, y: 88 }));
        selectedImageLayers.forEach(({ id }) => updateImagePosition(id, { x: images[id].position?.x || 0, y: 80 }));
        selectedAssetLayers.forEach(({ id }) => updateAssetPosition(id, { x: assetOverlays[id].position.x, y: 88 }));
        break;
      case "distribute-horizontal": {
        const sortedTexts = sortByAxis(selectedTextLayers, "x");
        if (sortedTexts.length > 2) {
          const first = sortedTexts[0].overlay.position.x;
          const last = sortedTexts[sortedTexts.length - 1].overlay.position.x;
          const gapStep = (last - first) / (sortedTexts.length - 1);
          sortedTexts.forEach(({ id }, index) =>
            updateTextPosition(id, { x: first + gapStep * index, y: textOverlays[id].position.y })
          );
        }
        const sortedImages = sortByAxis(selectedImageLayers, "x");
        if (sortedImages.length > 2) {
          const first = sortedImages[0].image.position?.x || 0;
          const last = sortedImages[sortedImages.length - 1].image.position?.x || 0;
          const gapStep = (last - first) / (sortedImages.length - 1);
          sortedImages.forEach(({ id }, index) =>
            updateImagePosition(id, { x: first + gapStep * index, y: images[id].position?.y || 0 })
          );
        }
        const sortedAssets = sortByAxis(selectedAssetLayers, "x");
        if (sortedAssets.length > 2) {
          const first = sortedAssets[0].asset.position.x;
          const last = sortedAssets[sortedAssets.length - 1].asset.position.x;
          const gapStep = (last - first) / (sortedAssets.length - 1);
          sortedAssets.forEach(({ id }, index) =>
            updateAssetPosition(id, { x: first + gapStep * index, y: assetOverlays[id].position.y })
          );
        }
        break;
      }
      case "distribute-vertical": {
        const sortedTexts = sortByAxis(selectedTextLayers, "y");
        if (sortedTexts.length > 2) {
          const first = sortedTexts[0].overlay.position.y;
          const last = sortedTexts[sortedTexts.length - 1].overlay.position.y;
          const gapStep = (last - first) / (sortedTexts.length - 1);
          sortedTexts.forEach(({ id }, index) =>
            updateTextPosition(id, { x: textOverlays[id].position.x, y: first + gapStep * index })
          );
        }
        const sortedImages = sortByAxis(selectedImageLayers, "y");
        if (sortedImages.length > 2) {
          const first = sortedImages[0].image.position?.y || 0;
          const last = sortedImages[sortedImages.length - 1].image.position?.y || 0;
          const gapStep = (last - first) / (sortedImages.length - 1);
          sortedImages.forEach(({ id }, index) =>
            updateImagePosition(id, { x: images[id].position?.x || 0, y: first + gapStep * index })
          );
        }
        const sortedAssets = sortByAxis(selectedAssetLayers, "y");
        if (sortedAssets.length > 2) {
          const first = sortedAssets[0].asset.position.y;
          const last = sortedAssets[sortedAssets.length - 1].asset.position.y;
          const gapStep = (last - first) / (sortedAssets.length - 1);
          sortedAssets.forEach(({ id }, index) =>
            updateAssetPosition(id, { x: assetOverlays[id].position.x, y: first + gapStep * index })
          );
        }
        break;
      }
      default:
        break;
    }
  };

  const handleUndo = () => {
    if (undoStackRef.current.length === 0) return;
    const previousSnapshot = undoStackRef.current.pop();
    if (lastSnapshotRef.current) {
      redoStackRef.current.unshift(lastSnapshotRef.current);
    }
    lastSnapshotRef.current = previousSnapshot;
    applySnapshot(previousSnapshot);
    updateHistoryMeta();
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const nextSnapshot = redoStackRef.current.shift();
    if (lastSnapshotRef.current) {
      undoStackRef.current.push(lastSnapshotRef.current);
    }
    lastSnapshotRef.current = nextSnapshot;
    applySnapshot(nextSnapshot);
    updateHistoryMeta();
  };

  useEffect(() => {
    const snapshot = buildEditorSnapshot();
    const serialized = JSON.stringify(snapshot);

    if (applyingSnapshotRef.current) {
      applyingSnapshotRef.current = false;
      lastSnapshotRef.current = snapshot;
      historyBootstrappedRef.current = true;
      updateHistoryMeta();
      return;
    }

    if (!historyBootstrappedRef.current) {
      historyBootstrappedRef.current = true;
      lastSnapshotRef.current = snapshot;
      updateHistoryMeta();
      return;
    }

    const previousSerialized = JSON.stringify(lastSnapshotRef.current);
    if (serialized === previousSerialized) {
      return;
    }

    undoStackRef.current.push(lastSnapshotRef.current);
    if (undoStackRef.current.length > 40) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    lastSnapshotRef.current = snapshot;
    updateHistoryMeta();
  }, [
    title,
    description,
    shortTermGoals,
    longTermGoals,
    templateId,
    aspectRatio,
    backgroundColor,
    backgroundImage,
    borderRadius,
    gap,
    images,
    textOverlays,
    assetOverlays,
    userUploads,
    nextTextId,
    nextAssetId,
  ]);

  useEffect(() => {
    if (!draftLoadAttemptedRef.current) {
      draftLoadAttemptedRef.current = true;
      try {
        const savedDraft = localStorage.getItem(getDraftKey());
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          if (parsedDraft?.snapshot) {
            draftRestoredRef.current = true;
            applySnapshot(parsedDraft.snapshot);
            lastSnapshotRef.current = parsedDraft.snapshot;
            toast({
              title: "Draft Restored",
              description: "Recovered your last in-progress vision board.",
            });
          }
        }
      } catch (error) {
        console.error("Draft restore error:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!isEditing || !boardId || boardLoadAttemptedRef.current || draftRestoredRef.current) {
      return;
    }

    boardLoadAttemptedRef.current = true;

    const loadBoardForEditing = async () => {
      try {
        const result = await getVisionBoard(boardId);
        if (result?.data) {
          const normalizedSnapshot = normalizeBoardSnapshot(result.data);
          applySnapshot(normalizedSnapshot);
          lastSnapshotRef.current = normalizedSnapshot;
        }
      } catch (error) {
        console.error("Vision board edit restore error:", error);
        toast({
          title: "Unable to Load Board",
          description: error.message || "We couldn't restore this saved vision board for editing.",
          variant: "destructive",
        });
        navigate("/vision-board-pro/gallery");
      }
    };

    loadBoardForEditing();
  }, [boardId, isEditing, navigate, toast]);

  useEffect(() => {
    if (!historyBootstrappedRef.current || !lastSnapshotRef.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          getDraftKey(),
          JSON.stringify({
            savedAt: new Date().toISOString(),
            snapshot: lastSnapshotRef.current,
          })
        );
      } catch (error) {
        console.error("Draft save error:", error);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [title, description, shortTermGoals, longTermGoals, templateId, aspectRatio, backgroundColor, backgroundImage, borderRadius, gap, images, textOverlays, assetOverlays, userUploads, nextTextId, nextAssetId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTag = event.target?.tagName;
      if (targetTag === "INPUT" || targetTag === "TEXTAREA") return;

      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }
      if ((isMeta && event.key.toLowerCase() === "y") || (isMeta && event.shiftKey && event.key.toLowerCase() === "z")) {
        event.preventDefault();
        handleRedo();
        return;
      }

      const step = event.shiftKey ? 4 : 1;

      if (selectedSlot !== null && images[selectedSlot] && !images[selectedSlot].locked) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault();
          const current = images[selectedSlot];
          const delta =
            event.key === "ArrowLeft"
              ? { x: -step, y: 0 }
              : event.key === "ArrowRight"
                ? { x: step, y: 0 }
                : event.key === "ArrowUp"
                  ? { x: 0, y: -step }
                  : { x: 0, y: step };

          handleImageUpdate(selectedSlot, {
            position: {
              x: (current.position?.x || 0) + delta.x,
              y: (current.position?.y || 0) + delta.y,
            },
          });
        }
      }

      if (selectedTextId && textOverlays[selectedTextId] && !textOverlays[selectedTextId].locked) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault();
          const current = textOverlays[selectedTextId];
          const delta =
            event.key === "ArrowLeft"
              ? { x: -0.35 * step, y: 0 }
              : event.key === "ArrowRight"
                ? { x: 0.35 * step, y: 0 }
                : event.key === "ArrowUp"
                  ? { x: 0, y: -0.35 * step }
                  : { x: 0, y: 0.35 * step };

          handleUpdateText(selectedTextId, {
            position: {
              x: Math.max(0, Math.min(100, (current.position?.x || 0) + delta.x)),
              y: Math.max(0, Math.min(100, (current.position?.y || 0) + delta.y)),
            },
          });
        }
      }

      if (selectedAssetId && assetOverlays[selectedAssetId] && !assetOverlays[selectedAssetId].locked) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault();
          const current = assetOverlays[selectedAssetId];
          const delta =
            event.key === "ArrowLeft"
              ? { x: -0.35 * step, y: 0 }
              : event.key === "ArrowRight"
                ? { x: 0.35 * step, y: 0 }
                : event.key === "ArrowUp"
                  ? { x: 0, y: -0.35 * step }
                  : { x: 0, y: 0.35 * step };

          handleUpdateAsset(selectedAssetId, {
            position: {
              x: Math.max(0, Math.min(100, (current.position?.x || 0) + delta.x)),
              y: Math.max(0, Math.min(100, (current.position?.y || 0) + delta.y)),
            },
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [assetOverlays, images, selectedAssetId, selectedSlot, selectedTextId, textOverlays]);

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
      setSelectedAssetId(null);
      setSelectedLayers([]);

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
        assetOverlays,
        userUploads,
        shortTermGoals,
        longTermGoals,
      };

      if (isEditing && boardId) {
        await updateVisionBoard(boardId, boardData);
        setLastSavedAt(new Date());
        toast({
          title: "Updated!",
          description: "Vision board updated successfully",
        });
      } else {
        await createVisionBoard(boardData);
        setLastSavedAt(new Date());
        toast({
          title: "Saved!",
          description: "Vision board created successfully",
        });
      }

      localStorage.removeItem(getDraftKey());

      // Redirect to gallery after saving
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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#eef3f9] dark:bg-[#00152E]">

      {/* Top Bar */}
      <EditorTopBar
        title={title}
        setTitle={setTitle}
        onSave={handleSave}
        isSaving={isSaving}
        onPreview={() => setShowPreview(true)}
        handleInstantCheck={handleInstantCheck}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyMeta.canUndo}
        canRedo={historyMeta.canRedo}
        lastSaved={lastSavedAt}
      />

      {/* Main Workspace */}
      <div className="relative flex flex-1 overflow-hidden">

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
            layers={layers}
            selectedLayer={selectedLayer}
            selectedLayers={selectedLayers}
            handleSelectLayer={handleSelectLayer}
            handleRenameLayer={handleRenameLayer}
            handleToggleLayerVisibility={handleToggleLayerVisibility}
            handleToggleLayerLock={handleToggleLayerLock}
            handleMoveLayerForward={handleMoveLayerForward}
            handleMoveLayerBackward={handleMoveLayerBackward}
            snapEnabled={snapEnabled}
            setSnapEnabled={setSnapEnabled}
            handleApplyAlignment={handleApplyAlignment}
            selectedImage={selectedImage}
            handleUpdateSelectedImage={handleUpdateSelectedImage}
            handleDuplicateImage={handleDuplicateImage}
            handleDuplicateAsset={handleDuplicateAsset}
            handleResetSelectedImage={handleResetSelectedImage}
            userUploads={userUploads}
            handleUserUpload={handleUserUpload}
            handleAddAssetToCanvas={handleAddAssetToCanvas}
            handleAddUploadToCanvas={handleAddUploadToCanvas}
            selectedText={selectedText}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            currentRatio={currentRatio}
            shortTermGoals={shortTermGoals}
            setShortTermGoals={setShortTermGoals}
            longTermGoals={longTermGoals}
            setLongTermGoals={setLongTermGoals}
            handleDeleteAsset={handleDeleteAsset}
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
          clearSelection={() => syncPrimarySelection([])}
          selectedLayers={selectedLayers}
          setSelectedLayers={setSelectedLayers}
          handleSelectLayer={handleSelectLayer}
          textOverlays={textOverlays}
          assetOverlays={assetOverlays}
          selectedTextId={selectedTextId}
          setSelectedTextId={setSelectedTextId}
          handleSelectText={handleSelectText}
          handleSelectAsset={handleSelectAsset}
          handleUpdateText={handleUpdateText}
          handleUpdateAsset={handleUpdateAsset}
          zoomLevel={zoomLevel}
          snapEnabled={snapEnabled}
          guideState={guideState}
          setGuideState={setGuideState}
          handleDeleteText={handleDeleteText}
          handleDeleteAsset={handleDeleteAsset}
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
