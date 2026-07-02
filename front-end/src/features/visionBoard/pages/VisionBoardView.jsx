import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Download,
  Edit,
  Loader2,
  Calendar,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { getVisionBoard } from "../services/visionBoardProApi";

const VisionBoardView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams();
  const { toast } = useToast();
  const canvasRef = useRef(null);

  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1);

  // Derive canvas dimensions from board data
  // The Pro editor saves canvasSettings at the top level, NOT under boardData
  const canvasSettings = useMemo(() => board?.canvasSettings || board?.boardData || {}, [board]);
  const canvasWidth = canvasSettings.width || canvasSettings.canvasWidth || 1200;
  const canvasHeight = canvasSettings.height || canvasSettings.canvasHeight || 800;

  useEffect(() => {
    loadBoard();
  }, [id]);

  // Keep the canvas scaled to the viewport on mobile to avoid horizontal scroll
  useEffect(() => {
    const computeScale = () => {
      if (!board) return;
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : canvasWidth;
      const viewportHeight = typeof window !== "undefined" ? window.innerHeight : canvasHeight;
      const maxWidth = Math.max(240, viewportWidth - 32);
      const maxHeight = Math.max(240, viewportHeight - 220);
      const nextScale = Math.min(1, maxWidth / canvasWidth, maxHeight / canvasHeight);
      setScale(nextScale > 0 ? nextScale : 1);
    };

    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [board, canvasWidth, canvasHeight]);

  const loadBoard = async () => {
    try {
      setIsLoading(true);
      const result = await getVisionBoard(id);
      setBoard(result.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load vision board",
        variant: "destructive",
      });
      navigate("/vision-board-pro/gallery");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: board.boardData?.background?.value || "#ffffff",
        scale: 2, // High quality
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `${board.title || "vision-board"}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Downloaded!",
        description: "Vision board saved as PNG",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Unknown date";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render element (read-only)
  const renderElement = (element) => {
    const style = {
      position: "absolute",
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: `rotate(${element.rotation || 0}deg)`,
      zIndex: element.zIndex || 1,
    };

    switch (element.type) {
      case "image":
        return (
          <div key={element.id} style={style}>
            <img
              src={element.src}
              alt="Vision board element"
              className="w-full h-full object-cover rounded"
              draggable={false}
            />
          </div>
        );
      case "text":
        return (
          <div
            key={element.id}
            style={{
              ...style,
              fontSize: element.fontSize || 16,
              fontWeight: element.fontWeight || "normal",
              fontStyle: element.fontStyle || "normal",
              color: element.color || "#000000",
              fontFamily: element.fontFamily || "Inter, sans-serif",
              textAlign: element.textAlign || "center",
              backgroundColor: element.bgColor || "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px",
              overflow: "hidden",
            }}
          >
            {element.content}
          </div>
        );
      case "shape":
        return (
          <div
            key={element.id}
            style={style}
            className={element.shape === "circle" ? "rounded-full" : "rounded"}
          >
            <div
              className={`w-full h-full ${
                element.shape === "circle" ? "rounded-full" : "rounded"
              }`}
              style={{
                backgroundColor: element.color || "#14B8A6",
                opacity: element.opacity || 1,
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] dark:bg-[#06101d]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a3884]" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] dark:bg-[#06101d]">
        <p className="text-gray-500">Vision board not found</p>
      </div>
    );
  }

  // Pro editor saves a pre-rendered collageImage; legacy editor saves elements array
  const collageImage = board.collageImage || null;
  const elements = board.boardData?.elements || [];
  const bgColor = canvasSettings.backgroundColor || board.boardData?.background?.value || "#ffffff";
  const bgImage = canvasSettings.backgroundImage || (board.boardData?.background?.type === "image" ? board.boardData.background.value : null);

  const scaledWidth = canvasWidth * scale;
  const scaledHeight = canvasHeight * scale;

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#06101d]">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Back Button - Mobile Only */}
        <div className="mb-4 md:hidden">
          <button
            onClick={() => navigate("/vision-board-pro/gallery")}
            className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </div>
            {t("vision_board.back_to_gallery", "Back to Gallery")}
          </button>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/8 dark:bg-[#0b1627]">
          <div className="border-b border-slate-200 px-4 py-4 dark:border-white/8 sm:px-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/vision-board-pro/gallery")}
                className="hidden sm:inline-flex rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#002A5C] dark:hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Gallery
              </Button>
              <div className="hidden h-6 w-px bg-slate-200 sm:block dark:bg-[#003170]" />
              <div>
                <div className="mb-2 inline-flex items-center rounded-full border border-[#1a3884]/15 bg-[#1a3884]/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a3884] dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                  Presentation View
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {board.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(board.createdAt)}
                  </span>
                  {formatTime(board.createdAt) && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(board.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
                className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#002147] dark:text-slate-200 dark:hover:bg-[#002A5C]"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PNG
              </Button>
              <Button
                onClick={() =>
                  navigate(`/vision-board-pro/create`, {
                    state: {
                      isEditing: true,
                      boardId: id,
                    },
                  })
                }
                className="rounded-xl bg-[#1a3884] text-white hover:bg-[#132c6b]"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
          {board.description && (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{board.description}</p>
          )}
        </div>

        <div className="bg-[radial-gradient(circle_at_top,#f8fafc_0%,#edf2f8_100%)] p-4 sm:p-6 dark:bg-[radial-gradient(circle_at_top,#12213b_0%,#07101d_100%)]">
          <div className="flex justify-center overflow-auto rounded-[24px] border border-slate-200/80 bg-white/45 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/20 sm:p-6">
            {collageImage ? (
              <div
                ref={canvasRef}
                className="relative overflow-hidden rounded-[24px] border border-white/80 shadow-[0_30px_70px_rgba(15,23,42,0.18)] dark:border-white/10"
                style={{ maxWidth: '100%', maxHeight: '75vh' }}
              >
                <img
                  src={collageImage}
                  alt={board.title}
                  className="h-full w-full rounded-[24px] object-contain"
                  style={{ maxHeight: '75vh' }}
                />
              </div>
            ) : (
              <div
                className="relative"
                style={{ width: scaledWidth, height: scaledHeight, overflow: "hidden" }}
              >
                <div
                  ref={canvasRef}
                  className="relative overflow-hidden rounded-[24px] border border-white/80 shadow-[0_30px_70px_rgba(15,23,42,0.18)] dark:border-white/10"
                  style={{
                    width: canvasWidth,
                    height: canvasHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    backgroundColor: bgColor,
                    backgroundImage: bgImage ? `url(${bgImage})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {elements.map(renderElement)}

                  {elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <p>This vision board is empty</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500 dark:border-white/8 dark:text-slate-400">
          Designed in Vision Board Studio
        </div>
      </div>
    </div>
    </div>
  );
};

export default VisionBoardView;


