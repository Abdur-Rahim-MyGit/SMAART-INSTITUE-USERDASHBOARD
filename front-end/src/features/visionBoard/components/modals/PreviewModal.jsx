import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { X, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPORT_RESOLUTIONS } from "../../templates/gridTemplates";

// ═══════════════════════════════════════════════════════════════════════════
// PREVIEW MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PreviewModal = ({ isOpen, onClose, canvasRef, title }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState("hd");
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generatePreview();
    }
  }, [isOpen]);

  const generatePreview = async () => {
    if (!canvasRef.current) return;

    try {
      // Scale up for better preview quality (at least 2x or more for high-res)
      const minScale = Math.max(2, 1080 / canvasRef.current.offsetWidth);
      const canvas = await html2canvas(canvasRef.current, {
        scale: minScale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });
      setPreviewImage(canvas.toDataURL("image/png", 1.0));
    } catch (error) {
      console.error("Preview generation error:", error);
    }
  };

  const handleDownload = async (format = "png") => {
    if (!canvasRef.current) return;

    setIsExporting(true);
    try {
      const resolution = EXPORT_RESOLUTIONS[selectedResolution];
      const canvas = await html2canvas(canvasRef.current, {
        scale: resolution.width / canvasRef.current.offsetWidth,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });

      const link = document.createElement("a");
      link.download = `${title || "vision-board"}-${resolution.width}x${resolution.height
        }.${format}`;
      link.href = canvas.toDataURL(
        `image/${format}`,
        format === "jpg" ? 0.95 : 1.0
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-[#0b1f38] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Final Preview
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-white/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview */}
          <div className="p-6 flex justify-center bg-slate-100 dark:bg-[#001a38]">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#071a30]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-700 dark:text-white/70 font-medium">Resolution:</span>
                <select
                  value={selectedResolution}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white bg-white dark:bg-[#001a38] focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {Object.entries(EXPORT_RESOLUTIONS).map(([key, res]) => (
                    <option key={key} value={key}>
                      {res.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownload("png")}
                  disabled={isExporting}
                  className="bg-white dark:bg-white/10 text-[#002147] dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#002147] dark:text-white" />
                  ) : (
                    <Download className="w-4 h-4 mr-2 text-[#002147] dark:text-white" />
                  )}
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload("jpg")}
                  disabled={isExporting}
                  className="bg-white dark:bg-white/10 text-[#002147] dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20"
                >
                  <Download className="w-4 h-4 mr-2 text-[#002147] dark:text-white" />
                  Download JPG
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PreviewModal;
