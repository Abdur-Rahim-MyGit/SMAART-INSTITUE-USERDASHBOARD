import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, ExternalLink, Loader2, X } from "@/components/icons";
import { enableShare, disableShare, buildShareUrl } from "../../services/visionBoardProApi";

const MODAL_SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-[#045C9A]/30 shadow-2xl";
const PANEL =
  "bg-[#F1F5F9] dark:bg-[#072036]/60 border border-[#d7ebf5] dark:border-white/10";
const BTN_BRAND =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#045C9A] text-xs font-bold text-white transition-colors hover:bg-[#034a7d] disabled:cursor-not-allowed disabled:opacity-60";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] text-xs font-bold text-slate-600 transition-colors hover:border-[#045C9A]/30 hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";
const FIELD =
  "w-full rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] px-4 text-sm font-medium text-[#072036] outline-none transition-colors placeholder:text-slate-400 focus:border-[#045C9A] focus:bg-white focus:ring-2 focus:ring-[#045C9A]/20 dark:border-white/10 dark:bg-[#072036]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#072036]";
const EASE = [0.25, 0.1, 0.25, 1];

/**
 * Public-link switch + copyable URL + QR for one board.
 * `board` needs _id, isShared, shareToken; `onChanged` receives the board
 * with the new share state so the caller can keep its own copy in sync.
 */
const ShareBoardModal = ({ board, onClose, onChanged }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState("");
  const shareUrl = board.isShared && board.shareToken ? buildShareUrl(board.shareToken) : "";

  useEffect(() => {
    let cancelled = false;
    if (!shareUrl) {
      setQr("");
      return undefined;
    }
    QRCode.toDataURL(shareUrl, { width: 176, margin: 1, color: { dark: "#072036", light: "#ffffff" } })
      .then((url) => { if (!cancelled) setQr(url); })
      .catch(() => { if (!cancelled) setQr(""); });
    return () => { cancelled = true; };
  }, [shareUrl]);

  const toggle = async () => {
    setBusy(true);
    try {
      const result = board.isShared ? await disableShare(board._id) : await enableShare(board._id);
      onChanged({ ...board, isShared: Boolean(result.data?.isShared), shareToken: result.data?.shareToken || null });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to update sharing", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: t("vision_board.copy_failed", "Could not copy"), description: shareUrl, variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#072036]/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 8 }}
        transition={{ duration: 0.25, ease: EASE }}
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-lg rounded-2xl p-6 sm:p-7 ${MODAL_SURFACE}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold tracking-tight text-[#072036] dark:text-white">
              {t("vision_board.share_title", "Share this board")}
            </h3>
            <p className="mt-1 text-sm text-[#35566b] dark:text-slate-400">
              {t("vision_board.share_desc", "Anyone with the link can view the board and its goals — read-only. Turn it off any time and the link stops working.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("vision_board.close", "Close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-[#F1F5F9] hover:text-[#072036] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`mt-6 flex items-center justify-between gap-4 rounded-xl px-4 py-3 ${PANEL}`}>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#072036] dark:text-white">{t("vision_board.public_link", "Public link")}</p>
            <p className="text-xs text-[#35566b] dark:text-slate-400">
              {board.isShared ? t("vision_board.link_on", "On — anyone with the link can view") : t("vision_board.link_off", "Off — only you can see this board")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(board.isShared)}
            aria-label={t("vision_board.public_link", "Public link")}
            onClick={toggle}
            disabled={busy}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${board.isShared ? "bg-[#045C9A]" : "bg-slate-300 dark:bg-white/20"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${board.isShared ? "left-6" : "left-1"}`} />
          </button>
        </div>

        {board.isShared && shareUrl && (
          <div className="mt-5 space-y-4">
            <div className="flex gap-2">
              <input id="vb-share-url" readOnly value={shareUrl} onFocus={(e) => e.target.select()} className={`${FIELD} h-10 text-xs`} />
              <button type="button" onClick={copy} className={`${BTN_BRAND} h-10 shrink-0 px-4`}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t("vision_board.copied", "Copied") : t("vision_board.copy_link", "Copy")}
              </button>
            </div>
            <div className={`flex items-center gap-4 rounded-xl p-4 ${PANEL}`}>
              <div className="flex h-[112px] w-[112px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                {qr ? <img src={qr} alt="QR code for the share link" className="h-full w-full" /> : <Loader2 className="h-5 w-5 animate-spin text-[#045C9A]" />}
              </div>
              <div className="min-w-0 text-xs text-[#35566b] dark:text-slate-400">
                <p className="font-bold text-[#072036] dark:text-white">{t("vision_board.qr_title", "Scan to open")}</p>
                <p className="mt-1">{t("vision_board.qr_desc", "Show this to a mentor or print it on your notice board.")}</p>
                <a href={shareUrl} target="_blank" rel="noreferrer" className={`${BTN_GHOST} mt-3 h-8 px-3`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("vision_board.open_link", "Open link")}
                </a>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ShareBoardModal;
