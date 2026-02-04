import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Download,
  Edit,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react";
import { getVisionBoard } from "../services/visionBoardApi";

const VisionBoardView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const canvasRef = useRef(null);

  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1);

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
      navigate("/vision-board/gallery");
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Vision board not found</p>
      </div>
    );
  }

  const boardData = board.boardData || {};
  const elements = boardData.elements || [];
  const background = boardData.background || {
    type: "color",
    value: "#ffffff",
  };
  const canvasWidth = boardData.canvasWidth || 1200;
  const canvasHeight = boardData.canvasHeight || 800;

  const scaledWidth = canvasWidth * scale;
  const scaledHeight = canvasHeight * scale;

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardSidebar />

      <div className="lg:ml-72 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/vision-board/gallery")}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Gallery
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {board.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(board.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(board.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PNG
              </Button>
              <Button
                onClick={() => navigate(`/vision-board/edit/${id}`)}
                className="bg-[#30919D] hover:bg-[#267a84] text-[#002147] shadow-[0_0_15px_rgba(48,145,157,0.5)] hover:shadow-[0_0_25px_rgba(48,145,157,0.7)]"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
          {board.description && (
            <p className="text-gray-600 mt-3">{board.description}</p>
          )}
        </div>

        {/* Canvas Display */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="flex justify-center">
            <div
              className="relative"
              style={{ width: scaledWidth, height: scaledHeight, overflow: "hidden" }}
            >
              <div
                ref={canvasRef}
                className="relative rounded-xl shadow-lg overflow-hidden"
                style={{
                  width: canvasWidth,
                  height: canvasHeight,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  backgroundColor:
                    background.type === "color" ? background.value : "#ffffff",
                  backgroundImage:
                    background.type === "image"
                      ? `url(${background.value})`
                      : "none",
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
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 text-center text-sm text-gray-500">
          Created with Vision Board Creator
        </div>
      </div>
    </div>
  );
};

export default VisionBoardView;
