import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
import { ChevronLeft, Download, Edit, Loader2, Calendar, Clock, ArrowLeft } from "@/components/icons";
import { getVisionBoard } from "../services/visionBoardProApi";

const SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const CHIP_BRAND =
  "bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#072036] text-xs font-bold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] text-xs font-bold text-slate-600 transition-colors hover:border-[#045C9A]/30 hover:bg-[#EAF7FD] hover:text-[#045C9A] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";
const EASE = [0.25, 0.1, 0.25, 1];

const useDarkTheme = () => {
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

const Shell = ({ isDark, children }) => (
  <PageTransition>
    <div className="relative min-h-screen overflow-hidden bg-transparent pb-8 transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
        <NeuralBackground theme={isDark ? "dark" : "light"} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
        <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
      </div>
      <main className="relative z-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">{children}</div>
      </main>
    </div>
  </PageTransition>
);

const VisionBoardView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams();
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const isDark = useDarkTheme();

  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1);

  // The Pro editor saves canvasSettings at the top level, NOT under boardData
  const canvasSettings = useMemo(() => board?.canvasSettings || board?.boardData || {}, [board]);
  const canvasWidth = canvasSettings.width || canvasSettings.canvasWidth || 1200;
  const canvasHeight = canvasSettings.height || canvasSettings.canvasHeight || 800;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const result = await getVisionBoard(id);
        if (!cancelled) setBoard(result.data);
      } catch (error) {
        if (cancelled) return;
        toast({ title: "Error", description: "Failed to load vision board", variant: "destructive" });
        navigate("/dashboard/vision-boards");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Keep a legacy element-canvas scaled to the viewport so it never overflows
  useEffect(() => {
    const computeScale = () => {
      if (!board) return;
      const maxWidth = Math.max(240, window.innerWidth - 32);
      const maxHeight = Math.max(240, window.innerHeight - 220);
      const next = Math.min(1, maxWidth / canvasWidth, maxHeight / canvasHeight);
      setScale(next > 0 ? next : 1);
    };
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [board, canvasWidth, canvasHeight]);

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: board.boardData?.background?.value || "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${board.title || "vision-board"}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Downloaded!", description: "Vision board saved as PNG" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (!dateString || isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    if (!dateString || isNaN(d.getTime())) return null;
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  // Legacy element-based boards (pre-collage)
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
            <img src={element.src} alt="" className="h-full w-full rounded object-cover" draggable={false} />
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
          <div key={element.id} style={style} className={element.shape === "circle" ? "rounded-full" : "rounded"}>
            <div
              className={`h-full w-full ${element.shape === "circle" ? "rounded-full" : "rounded"}`}
              style={{ backgroundColor: element.color || "#14B8A6", opacity: element.opacity || 1 }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Shell isDark={isDark}>
        <div className="flex flex-col items-center justify-center gap-3 py-32">
          <Loader2 className="h-9 w-9 animate-spin text-[#045C9A] dark:text-[#A6D7E8]" />
          <p className="text-sm font-medium text-[#35566b] dark:text-slate-400">{t("vision_board.loading_boards")}</p>
        </div>
      </Shell>
    );
  }

  if (!board) {
    return (
      <Shell isDark={isDark}>
        <div className={`flex flex-col items-center justify-center rounded-2xl px-6 py-24 text-center ${SURFACE}`}>
          <h2 className="text-lg font-extrabold tracking-tight text-[#072036] dark:text-white">
            {t("vision_board.not_found", "Vision board not found")}
          </h2>
          <button type="button" onClick={() => navigate("/dashboard/vision-boards")} className={`${BTN_GHOST} mt-5 h-9 px-4`}>
            <ChevronLeft className="h-4 w-4" />
            {t("vision_board.back_to_gallery", "Back to Gallery")}
          </button>
        </div>
      </Shell>
    );
  }

  const collageImage = board.collageImage || null;
  const elements = board.boardData?.elements || [];
  const bgColor = canvasSettings.backgroundColor || board.boardData?.background?.value || "#ffffff";
  const bgImage =
    canvasSettings.backgroundImage ||
    (board.boardData?.background?.type === "image" ? board.boardData.background.value : null);
  const createdDate = formatDate(board.createdAt);
  const createdTime = formatTime(board.createdAt);

  return (
    <Shell isDark={isDark}>
      {/* Back button -- mobile only */}
      <div className="flex items-center sm:hidden">
        <button type="button" onClick={() => navigate("/dashboard/vision-boards")} className="group flex w-fit items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:group-hover:border-[#045C9A]/40">
            <ArrowLeft className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
            {t("vision_board.back_to_gallery", "Back to Gallery")}
          </span>
        </button>
      </div>

      {/* Page hero */}
      <motion.section
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className={`relative w-full overflow-hidden rounded-2xl ${SURFACE}`}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />
        <div className="relative z-10 flex flex-col gap-5 px-6 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <span className={`mb-2 inline-flex items-center rounded-md px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider ${CHIP_BRAND}`}>
              {t("vision_board.presentation_view", "Presentation view")}
            </span>
            <h1
              className="truncate text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
              style={{ letterSpacing: "-0.02em" }}
              title={board.title}
            >
              {board.title}
            </h1>
            {board.description && (
              <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">{board.description}</p>
            )}
            {(createdDate || createdTime) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {createdDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {createdDate}
                  </span>
                )}
                {createdTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {createdTime}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button type="button" onClick={() => navigate("/dashboard/vision-boards")} className={`${BTN_GHOST} hidden h-9 px-4 sm:inline-flex`}>
              <ChevronLeft className="h-4 w-4" />
              {t("vision_board.back_to_gallery", "Back to Gallery")}
            </button>
            <button type="button" onClick={handleDownload} disabled={isDownloading} className={`${BTN_GHOST} h-9 px-4`}>
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t("vision_board.download_png", "Download PNG")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/vision-board-pro/create", { state: { isEditing: true, boardId: id } })}
              className={`${BTN_PRIMARY} h-9 px-4`}
            >
              <Edit className="h-4 w-4" />
              {t("vision_board.edit")}
            </button>
          </div>
        </div>
      </motion.section>

      {/* Stage */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
        className={`overflow-hidden rounded-2xl ${SURFACE}`}
      >
        <div className="bg-[#F1F5F9] p-4 dark:bg-[#072036]/60 sm:p-6">
          <div className="flex min-h-[240px] items-center justify-center overflow-auto">
            {collageImage ? (
              <div
                ref={canvasRef}
                className="overflow-hidden rounded-xl border border-white/80 shadow-[0_24px_60px_-20px_rgba(7,32,54,0.35)] dark:border-white/10"
                style={{ maxWidth: "100%", maxHeight: "75vh" }}
              >
                <img src={collageImage} alt={board.title} className="h-full w-full object-contain" style={{ maxHeight: "75vh" }} />
              </div>
            ) : (
              <div className="relative" style={{ width: canvasWidth * scale, height: canvasHeight * scale, overflow: "hidden" }}>
                <div
                  ref={canvasRef}
                  className="relative overflow-hidden rounded-xl border border-white/80 shadow-[0_24px_60px_-20px_rgba(7,32,54,0.35)] dark:border-white/10"
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
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                      {t("vision_board.board_empty", "This vision board is empty")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-[#d7ebf5] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-white/10 dark:text-slate-500">
          {t("vision_board.designed_in", "Designed in Vision Board Studio")}
        </div>
      </motion.section>
    </Shell>
  );
};

export default VisionBoardView;
