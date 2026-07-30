import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconDownload, IconBuilding, IconCheck, IconX as IconCross } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import useUser from '@/hooks/useUser';

const OfferLetterModal = ({ isOpen, onClose, application, onAccept, onDecline, onKeepInProgress, companyName, companyLogo }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [showSignatureInput, setShowSignatureInput] = useState(false);

  if (!isOpen || !application) return null;

  const handleAction = async (status) => {
    setIsProcessing(true);
    if (status === 'Accepted') {
      await onAccept(application._id || application.id, signatureText);
    } else if (status === 'Declined') {
      await onDecline(application._id || application.id);
    } else if (status === 'In Progress') {
      if (onKeepInProgress) {
        await onKeepInProgress(application._id || application.id);
      }
    }
    setIsProcessing(false);
    onClose();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const offerDate = application.offerDate ? new Date(application.offerDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : currentDate;

  const candidateName = user?.fullName || user?.firstName || 'Candidate';
  const jobTitle = application.job?.title || application.jobTitle || 'the offered position';
  const packageAmt = application.offeredPackage || 'as discussed';
  const recruiterSignature = application.recruiterSignature || application.job?.recruiterName || application.job?.recruiter?.name || companyName || 'Authorized Signatory';
  
  // Smart Logo Fallback
  const getSmartLogo = () => {
    if (companyLogo && companyLogo.trim() !== '') return companyLogo;
    if (companyName) {
      const lowerName = companyName.toLowerCase();
      if (lowerName.includes('google')) return 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg';
      if (lowerName.includes('microsoft')) return 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg';
      if (lowerName.includes('amazon')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg';
      
      // Generic clearbit fallback
      const domain = lowerName.split(' ')[0] + '.com';
      return `https://logo.clearbit.com/${domain}`;
    }
    return null;
  };
  
  const displayLogo = getSmartLogo();

  const appId = application._id || application.id || '00000';
  const refNumber = typeof appId === 'string' ? appId.slice(-6).toUpperCase() : Math.floor(Math.random() * 100000);
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const fullRef = `OFF/${refNumber}/${currentYear}`;

  const handleInitiateAccept = () => {
    setShowSignatureInput(true);
    setSignatureText(candidateName);
  };

  return (
    <AnimatePresence>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        .signature-font {
            font-family: 'Great Vibes', cursive;
            font-weight: 400;
        }
      `}</style>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex w-full max-w-4xl flex-col max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#0f172a]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#001530] bg-[#002147] px-6 py-4 rounded-t-2xl">
            <h2 className="text-xl font-bold text-white tracking-wide">Official Offer Letter</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg bg-[#1a3884] px-3 py-1.5 text-sm font-medium text-white border border-[#3055b5] hover:bg-[#2546a1] transition-colors shadow-sm"
              >
                <IconDownload size={16} />
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors ml-2"
              >
                <IconX size={20} />
              </button>
            </div>
          </div>

          {/* Letter Content - Printable Area */}
          <div className="overflow-y-auto p-8 sm:p-12 print:p-0 bg-white dark:bg-[#0f172a]" id="offer-letter-content">
            <div className="max-w-3xl mx-auto">
              
              {/* Letterhead */}
              <div className="flex items-end justify-between mb-10 border-b-2 border-[#002147]/10 dark:border-slate-800 pb-6">
                <div className="flex items-center gap-5">
                  {displayLogo ? (
                    <img 
                      src={displayLogo} 
                      alt={companyName} 
                      className="h-14 w-auto max-w-[160px] object-contain" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="h-14 w-14 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-[#002147] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 shadow-sm"
                    style={{ display: displayLogo ? 'none' : 'flex' }}
                  >
                    <IconBuilding size={28} />
                  </div>
                  <div className="pb-1">
                    <h1 className="text-[22px] font-bold tracking-wide text-[#002147] dark:text-white uppercase">{companyName}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium tracking-wide uppercase">Official Employment Offer</p>
                  </div>
                </div>
                <div className="text-right text-slate-500 dark:text-slate-400 text-sm font-medium pb-1">
                  <p>Date: <span className="font-bold text-slate-800 dark:text-slate-200">{offerDate}</span></p>
                  <p>Ref: <span className="font-bold text-slate-800 dark:text-slate-200">{fullRef}</span></p>
                </div>
              </div>

              {/* Salutation */}
              <div className="mb-8 space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed text-[14px]">
                <p>Dear <span className="font-bold text-slate-900 dark:text-white">{candidateName}</span>,</p>
                
                <p>
                  We are thrilled to extend this offer of employment for the position of <span className="font-bold text-[#002147] dark:text-[#4f7dff]">{jobTitle}</span> with <span className="font-bold">{companyName}</span>. 
                  After reviewing your background and having the opportunity to interview you, we are confident that your skills and experience will be a great addition to our team.
                </p>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-6 border border-slate-200 dark:border-slate-700 my-8 shadow-sm">
                  <h3 className="text-lg font-bold text-[#002147] dark:text-white mb-4 uppercase tracking-wider font-sans text-sm">Offer Details</h3>
                  <ul className="space-y-4 font-sans text-sm">
                    <li className="flex gap-3 items-center">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] w-32 shrink-0">Position:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{jobTitle}</span>
                    </li>
                    <li className="flex gap-3 items-center">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] w-32 shrink-0">Compensation:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">{packageAmt}</span>
                    </li>
                    <li className="flex gap-3 items-center">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] w-32 shrink-0">Start Date:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">To be determined upon acceptance</span>
                    </li>
                  </ul>
                </div>

                <p>
                  This offer is contingent upon the successful completion of any background checks or reference checks as required by the company.
                  Please review this document carefully. By accepting this offer, you confirm your understanding and agreement to these terms.
                </p>

                <p>
                  We look forward to welcoming you to the <span className="font-bold">{companyName}</span> team and are excited about the journey ahead!
                </p>
              </div>

              {/* Signatures */}
              <div className="mt-16 flex justify-between pt-8">
                <div className="text-center">
                  <div className="mb-2 h-12 flex items-end justify-center">
                    <span className="signature-font text-4xl text-[#002147] dark:text-blue-300 opacity-90 pr-4" style={{ transform: 'rotate(-3deg)' }}>
                      {recruiterSignature}
                    </span>
                  </div>
                  <div className="h-px w-48 bg-slate-300 dark:bg-slate-700 mx-auto my-2"></div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Authorized Signatory</p>
                  <p className="text-sm text-slate-500">{companyName}</p>
                </div>
                
                <div className={`text-center transition-opacity duration-300 ${(application.status === 'Accepted' || signatureText) ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="h-12 flex items-end justify-center mb-2">
                    {signatureText ? (
                      <span className="signature-font text-4xl text-emerald-800 dark:text-emerald-300 pl-4" style={{ transform: 'rotate(-2deg)' }}>
                        {signatureText}
                      </span>
                    ) : null}
                  </div>
                  <div className="h-px w-48 bg-slate-300 dark:bg-slate-700 mx-auto my-2"></div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Candidate Signature</p>
                  <p className="text-sm text-slate-500">Date: {signatureText ? currentDate : '_______________'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left font-medium">
                Please respond to this offer by accepting or declining below. This action is final.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <button
                  onClick={() => handleAction('Declined')}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-rose-600 shadow-sm hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/50 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-900/20 whitespace-nowrap transition-all focus:ring-2 focus:ring-rose-500/20 outline-none"
                >
                  <IconCross size={16} stroke={2.5} />
                  Decline
                </button>
                <button
                  onClick={() => handleAction('In Progress')}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-amber-600 shadow-sm hover:bg-amber-50 hover:border-amber-300 dark:border-amber-900/50 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-amber-900/20 whitespace-nowrap transition-all focus:ring-2 focus:ring-amber-500/20 outline-none"
                >
                  Keep in Progress
                </button>
                <button
                  onClick={handleInitiateAccept}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#0d1f4e] px-6 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-[#0d1f4e]/20 hover:bg-[#1a3884] whitespace-nowrap transition-all focus:ring-2 focus:ring-[#1a3884]/40 outline-none"
                >
                  <IconCheck size={16} stroke={2.5} />
                  Accept Offer
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Signature Overlay */}
          <AnimatePresence>
            {showSignatureInput && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6"
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-slate-200 dark:border-slate-700"
                >
                  <h3 className="text-2xl font-black text-[#002147] dark:text-white mb-2 tracking-tight">E-Sign Your Offer</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                    Please type your full legal name to digitally sign and officially accept this employment offer from {companyName}.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Candidate Signature</label>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                          <input 
                              type="text" 
                              placeholder="Type your full name"
                              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#002147]/20 focus:border-[#002147] outline-none transition-all"
                              value={signatureText}
                              onChange={(e) => setSignatureText(e.target.value)}
                              autoFocus
                          />
                          <div className="flex justify-between items-end px-2 pt-2">
                              <div className="text-xs text-slate-500 font-medium pb-2">Signature Preview:</div>
                              {signatureText ? (
                                  <div className="signature-font text-3xl text-emerald-700 dark:text-emerald-400 tracking-wide" style={{ transform: 'rotate(-2deg)' }}>
                                      {signatureText}
                                  </div>
                              ) : (
                                  <div className="text-sm text-slate-400 italic pb-2">Waiting for signature...</div>
                              )}
                          </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => {
                        setShowSignatureInput(false);
                        setSignatureText("");
                      }}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction('Accepted')}
                      disabled={isProcessing || !signatureText.trim()}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#002147] px-4 py-3 text-sm font-bold text-white hover:bg-[#001530] disabled:opacity-50 transition-colors shadow-lg shadow-[#002147]/20"
                    >
                      <IconCheck size={18} stroke={3} />
                      {isProcessing ? 'Processing...' : 'Sign & Accept'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OfferLetterModal;
