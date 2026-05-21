import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, CheckCircle2, Linkedin, ExternalLink, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const CertificateShareModal = ({ isOpen, onClose, certificate }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !certificate) return null;

  const verificationUrl = certificate.verificationUrl || 
    `${window.location.origin}/verify-certificate/${certificate.qrCodeIdentifier || certificate.certificateId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedInShare = () => {
    // Construct LinkedIn share URL
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=600');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-[#002A5C] rounded-none w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share Credential</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Verifiable PDF Certificate</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-[#002A5C] rounded-none transition-colors text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center">
            {/* Certificate Info */}
            <div className="w-full text-center mb-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate px-4">
                {certificate.title || certificate.certificateTitle}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {certificate.issuer || 'SMAART Institute'}
              </p>
            </div>

            {/* QR Code Wrapper */}
            <div className="bg-white p-4 border-2 border-slate-100 dark:border-white/10 shadow-sm mb-6 relative group">
              <QRCodeSVG 
                value={verificationUrl} 
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#0f172a"}
                level={"H"}
                includeMargin={false}
              />
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                 <QrCode className="w-8 h-8 text-slate-800" />
              </div>
            </div>

            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center mb-6 max-w-xs">
              Scan this QR code to view the official, tamper-proof verification page for this certificate.
            </p>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={handleLinkedInShare}
                className="w-full py-3 px-4 bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#0A66C2]/20"
              >
                <Linkedin className="w-4 h-4" />
                Share to LinkedIn
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-[#003170] hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-600"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
                
                <a
                  href={verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-white dark:bg-[#002A5C] hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-slate-700 dark:text-slate-200 text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-600"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CertificateShareModal;
