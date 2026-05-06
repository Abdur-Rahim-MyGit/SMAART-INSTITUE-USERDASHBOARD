import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import {
  Download,
  Expand,
  Loader2,
  MonitorPlay,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPORT_RESOLUTIONS } from "../../templates/gridTemplates";

const PRESET_GROUPS = [
  { id: "hd", label: "Square HD", subtitle: "General use", icon: Sparkles },
  { id: "instagram", label: "Instagram Post", subtitle: "Feed ready", icon: Smartphone },
  { id: "story", label: "Story / Reels", subtitle: "Vertical social", icon: Smartphone },
  { id: "pinterest", label: "Pinterest", subtitle: "Tall format", icon: Smartphone },
  { id: "full-hd", label: "Presentation", subtitle: "Slides and screens", icon: MonitorPlay },
];

const PreviewModal = ({ isOpen, onClose, canvasRef, title }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState("instagram");
  const [previewImage, setPreviewImage] = useState(null);
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [qualityMode, setQualityMode] = useState("high");
  const [exportFormat, setExportFormat] = useState("png");
  const [presentationMode, setPresentationMode] = useState(false);
  const stageRef = useRef(null);

  const selectedPreset = useMemo(
    () => EXPORT_RESOLUTIONS[selectedResolution],
    [selectedResolution]
  );

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      setPreviewImage(null);
      generatePreview();
    }
    if (!isOpen) {
      setPreviewImage(null);
      setPresentationMode(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generatePreview();
    }
  }, [includeWatermark, selectedResolution]);

  const buildCaptureNode = (resolution) => {
    if (!canvasRef.current) return null;

    const originalCanvas = canvasRef.current;
    const originalWidth = originalCanvas.offsetWidth;
    const originalHeight = originalCanvas.offsetHeight;
    const width = resolution?.width || originalWidth;
    const height = resolution?.height || originalHeight;
    const fittedScale = Math.min(width / originalWidth, height / originalHeight);
    const fittedWidth = originalWidth * fittedScale;
    const fittedHeight = originalHeight * fittedScale;
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.zIndex = "-9999";
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.overflow = "hidden";
    wrapper.style.background =
      "radial-gradient(circle at top, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)";

    const clone = originalCanvas.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.left = `${(width - fittedWidth) / 2}px`;
    clone.style.top = `${(height - fittedHeight) / 2}px`;
    clone.style.transform = `scale(${fittedScale})`;
    clone.style.transformOrigin = "top left";
    clone.style.width = `${originalWidth}px`;
    clone.style.height = `${originalHeight}px`;
    clone.style.margin = "0";
    clone.style.boxShadow = "0 24px 60px rgba(15, 23, 42, 0.14)";
    clone.style.borderRadius = clone.style.borderRadius || "28px";

    if (!clone.style.backgroundColor || clone.style.backgroundColor === "transparent") {
      clone.style.backgroundColor = "#ffffff";
    }

    wrapper.appendChild(clone);

    if (includeWatermark) {
      const watermark = document.createElement("div");
      watermark.textContent = `Created in Vision Board Studio`;
      watermark.style.position = "absolute";
      watermark.style.right = "24px";
      watermark.style.bottom = "20px";
      watermark.style.padding = "8px 12px";
      watermark.style.borderRadius = "999px";
      watermark.style.background = "rgba(15,23,42,0.72)";
      watermark.style.color = "#ffffff";
      watermark.style.fontSize = "12px";
      watermark.style.fontWeight = "600";
      watermark.style.fontFamily = "Inter, sans-serif";
      wrapper.appendChild(watermark);
    }

    document.body.appendChild(wrapper);
    return { wrapper, width, height };
  };

  const captureExportCanvas = async ({ resolution, captureScale = 1 } = {}) => {
    const built = buildCaptureNode(resolution);
    if (!built) return null;

    const { wrapper, width, height } = built;
    try {
      const rawCanvas = await html2canvas(wrapper, {
        scale: captureScale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
      });
      document.body.removeChild(wrapper);

      if (!resolution) {
        return rawCanvas;
      }

      const normalizedCanvas = document.createElement("canvas");
      normalizedCanvas.width = resolution.width;
      normalizedCanvas.height = resolution.height;
      const context = normalizedCanvas.getContext("2d");
      context.drawImage(rawCanvas, 0, 0, resolution.width, resolution.height);
      return normalizedCanvas;
    } catch (error) {
      document.body.removeChild(wrapper);
      throw error;
    }
  };

  const generatePreview = async () => {
    if (!canvasRef.current) return;
    try {
      const previewCanvas = await captureExportCanvas({
        resolution: selectedPreset,
        captureScale: 1,
      });
      if (previewCanvas) {
        setPreviewImage(previewCanvas.toDataURL("image/png", 1));
      }
    } catch (error) {
      console.error("Preview generation error:", error);
    }
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setIsExporting(true);
    try {
      const resolution = EXPORT_RESOLUTIONS[selectedResolution];
      const captureScale = qualityMode === "high" ? 2 : 1;
      const exportCanvas = await captureExportCanvas({
        resolution,
        captureScale,
      });
      if (!exportCanvas) return;

      const link = document.createElement("a");
      link.download = `${title || "vision-board"}-${resolution.width}x${resolution.height}.${exportFormat}`;
      link.href = exportCanvas.toDataURL(
        `image/${exportFormat}`,
        exportFormat === "jpg" ? 0.95 : 1
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await stageRef.current.requestFullscreen();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[260] flex items-center justify-center bg-slate-950/88 p-2 backdrop-blur-md sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex h-[92vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-[#071425]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-slate-200 px-4 py-4 dark:border-white/10 sm:px-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                Output Studio
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Review, present, and export the board in the format it was designed for.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-9 rounded-xl border-slate-200 bg-white px-3 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white/75"
                onClick={() => setPresentationMode(!presentationMode)}
              >
                <MonitorPlay className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">
                  {presentationMode ? "Editor View" : "Present"}
                </span>
              </Button>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-white/70 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1.02fr)_380px]">
            <div
              ref={stageRef}
              className={`relative flex min-h-0 items-center justify-center overflow-auto p-4 sm:p-6 lg:p-10 ${
                presentationMode
                  ? "bg-[#020817]"
                  : "bg-[radial-gradient(circle_at_top,#f8fafc_0%,#eef2f7_100%)] dark:bg-[radial-gradient(circle_at_top,#10213e_0%,#071425_100%)]"
              }`}
            >
              <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur transition hover:bg-black/50"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Expand className="h-3.5 w-3.5" />
                    Fullscreen
                  </span>
                </button>
                {presentationMode && (
                  <div className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[11px] font-medium text-white/85 backdrop-blur">
                    Presenter Mode
                  </div>
                )}
              </div>

              {previewImage ? (
                <div className="flex w-full max-w-[620px] flex-col items-center">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/50 dark:text-white/70">
                    <span>{selectedPreset.label}</span>
                    <span className="text-slate-400 dark:text-white/35">
                      {selectedPreset.width} x {selectedPreset.height}
                    </span>
                  </div>

                  <motion.img
                    key={`${previewImage}-${selectedResolution}-${presentationMode}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={previewImage}
                    alt="Preview"
                    className={`max-h-[38vh] w-auto max-w-full object-contain transition-all sm:max-h-[42vh] lg:max-h-[48vh] xl:max-h-[52vh] ${
                      presentationMode
                        ? "rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.38)]"
                        : "rounded-3xl border border-white/70 shadow-[0_30px_60px_rgba(15,23,42,0.20)] dark:border-white/10"
                    }`}
                  />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1a3884]" />
                </div>
              )}
            </div>

            <div className="custom-scrollbar min-h-0 overflow-y-auto border-t border-slate-200 bg-slate-50/90 p-4 dark:border-white/10 dark:bg-[#081120] lg:border-l lg:border-t-0">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Export Presets
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-white/50">
                    Pick an output based on where the board will actually be seen.
                  </p>
                  <div className="mt-3 grid gap-2">
                    {PRESET_GROUPS.map((preset) => {
                      const config = EXPORT_RESOLUTIONS[preset.id];
                      const active = selectedResolution === preset.id;
                      const Icon = preset.icon;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => setSelectedResolution(preset.id)}
                          className={`rounded-2xl border px-3 py-3 text-left transition ${
                            active
                              ? "border-[#1a3884]/60 bg-[#1a3884]/[0.08]"
                              : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/10">
                              <Icon className="h-4 w-4 text-slate-600 dark:text-white/65" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                {preset.label}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500 dark:text-white/45">
                                {preset.subtitle} · {config.width} x {config.height}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Export Controls
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">
                        Format
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {["png", "jpg"].map((format) => (
                          <button
                            key={format}
                            onClick={() => setExportFormat(format)}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                              exportFormat === format
                                ? "border-[#1a3884]/60 bg-[#1a3884]/[0.08] text-[#1a3884] dark:text-[#9cb9ff]"
                                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55"
                            }`}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-white/45">
                        Quality
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "standard", label: "Standard" },
                          { id: "high", label: "High Detail" },
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setQualityMode(option.id)}
                            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                              qualityMode === option.id
                                ? "border-[#1a3884]/60 bg-[#1a3884]/[0.08] text-[#1a3884] dark:text-[#9cb9ff]"
                                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          Branding Watermark
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 dark:text-white/45">
                          Optional studio badge in the exported image.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludeWatermark(!includeWatermark)}
                        className={`relative h-7 w-12 rounded-full transition ${
                          includeWatermark ? "bg-[#1a3884]" : "bg-slate-300 dark:bg-white/15"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                            includeWatermark ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Output Summary
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-white/60">
                    <div className="flex items-center justify-between">
                      <span>Preset</span>
                      <span>{selectedPreset.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Format</span>
                      <span>{exportFormat.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Quality</span>
                      <span>{qualityMode === "high" ? "High Detail" : "Standard"}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="mt-4 h-11 w-full rounded-xl bg-[#1a3884] font-semibold text-white hover:bg-[#132c6b]"
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export {exportFormat.toUpperCase()}
                  </Button>
                </div>

                <div className="h-2 lg:h-4" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PreviewModal;
