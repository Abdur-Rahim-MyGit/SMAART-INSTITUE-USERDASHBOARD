import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, QrCode, CheckCircle2, MapPin, Calendar, Clock,
  Printer, ShieldCheck, User, Building, Award, RefreshCw,
  Sparkles, Download
} from "lucide-react";
import QRCodeSVG from "./QRCodeSVG";
import { placementsAPI, getBackendUrl } from "@/services/api";

const JobFairDigitalPassModal = ({ isOpen, onClose, fair, user }) => {
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const passRef = useRef(null);

  const fetchPass = async () => {
    if (!fair?._id) return;
    try {
      setRefreshing(true);
      const res = await placementsAPI.getJobFairPass(fair._id);
      if (res?.success && res.data) {
        setPassData(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch fair pass details, using fallback", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPass();
    }
  }, [isOpen, fair?._id]);

  if (!isOpen) return null;

  const student = passData?.student || {
    name: user?.name || user?.fullName || user?.firstName || "Student",
    email: user?.email || "",
    rollNo: user?.rollNo || user?.studentId || "2026-STD",
    degree: user?.degree || "Undergraduate",
    department: user?.department || user?.branch || "Engineering",
    currentCGPA: user?.currentCGPA || user?.cgpa || null,
    profilePhoto: user?.profilePhoto || user?.avatar || null
  };

  const studentName = String(student?.name || user?.name || user?.fullName || "Student");
  const studentRollNo = String(student?.rollNo || user?.rollNo || user?.studentId || "2026-STD");

  const passCode = passData?.passCode || `SJF-${String(fair?._id || "2026").slice(-4).toUpperCase()}-${String(user?._id || "0000").slice(-4).toUpperCase()}`;
  const isCheckedIn = passData?.isCheckedIn;
  const qrValue = passData?.qrPayload || JSON.stringify({
    type: "SMAART_JOB_FAIR_PASS",
    fairId: fair?._id,
    studentId: user?._id,
    passCode,
    name: studentName,
    rollNo: studentRollNo,
    timestamp: new Date().toISOString()
  });

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative flex flex-col w-full max-w-[460px] max-h-[92vh] rounded-3xl bg-white shadow-[0_25px_60px_-15px_rgba(13,31,78,0.35)] dark:bg-[#001026] dark:border dark:border-[#1a3884]/40 overflow-hidden"
        >
          {/* Header Action Bar (Fixed Top) */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/90 dark:border-[#1a3884]/30 dark:bg-[#001430]/90 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d1f4e] to-[#1a3884] text-white shadow-sm shadow-[#0d1f4e]/20">
                <QrCode className="h-4 w-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0d1f4e] dark:text-white">
                  Digital Event Pass
                </h3>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-400">
                  Live Venue & Booth Identity Card
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={fetchPass}
                title="Refresh pass status"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-[#1a3884]/30 dark:hover:text-blue-300 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#1a3884]" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Pass Body */}
          <div className="overflow-y-auto p-4 sm:p-5 flex-1 space-y-4">
            {/* Printable Pass Container */}
            <div ref={passRef} className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200/90 dark:border-[#1a3884]/40 bg-white dark:bg-[#001738]">
              {/* TOP TICKET SECTION: Navy Gradient Identity Header */}
              <div className="relative p-4 sm:p-5 bg-gradient-to-br from-[#09183d] via-[#0d2257] to-[#1a3884] text-white overflow-hidden">
                {/* Ambient glow accents */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/15 blur-2xl pointer-events-none" />
                <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

                {/* Badge Top row: System Branding & Pass Code */}
                <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-cyan-200">
                      SMAART PASS
                    </span>
                  </div>

                  <span className="rounded-md bg-white/15 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white backdrop-blur-sm">
                    {passCode}
                  </span>
                </div>

                {/* Event Name */}
                <div className="relative z-10 mt-3">
                  <h4 className="text-base font-extrabold tracking-tight text-white line-clamp-1">
                    {fair?.title || "SMAART JOB FAIR"}
                  </h4>
                </div>

                {/* Candidate Mini Profile Card */}
                <div className="relative z-10 mt-3 rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm text-cyan-200 overflow-hidden shrink-0 border border-white/20">
                      {student?.profilePhoto ? (
                        <img 
                            src={student.profilePhoto.startsWith("http") ? student.profilePhoto : `${getBackendUrl()}/${student.profilePhoto}`} 
                            alt={studentName} 
                            className="h-full w-full object-cover" 
                        />
                      ) : (
                        studentName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {studentName}
                      </div>
                      <div className="text-[10.5px] text-cyan-100/90 truncate">
                        Roll No: <span className="font-semibold text-white">{studentRollNo}</span>
                      </div>
                      <div className="text-[10px] text-white/70 truncate">
                        {student?.degree} • {student?.department}
                      </div>
                    </div>
                  </div>

                  {student?.currentCGPA && (
                    <div className="shrink-0 text-center rounded-lg bg-white/15 px-2.5 py-1 border border-white/15">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-200">CGPA</div>
                      <div className="text-xs font-black text-white">{student.currentCGPA}</div>
                    </div>
                  )}
                </div>

                {/* Event Metadata (Date & Venue) */}
                <div className="relative z-10 mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10.5px] text-cyan-100/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                    <span className="truncate">
                      {fair?.startDate ? new Date(fair.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Event Day"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-cyan-300 shrink-0" />
                    <span className="truncate" title={fair?.location || "Venue"}>
                      {fair?.location || "Main Campus"}
                    </span>
                  </div>
                </div>
              </div>

              {/* TICKET PERFORATION & CUTOUT NOTCHES */}
              <div className="relative flex items-center justify-between px-2 bg-slate-50 dark:bg-[#001430]/70 py-1">
                {/* Left Notch */}
                <div className="absolute -left-3 h-5 w-5 rounded-full bg-white dark:bg-[#001026] border-r border-slate-200 dark:border-[#1a3884]/40" />
                
                {/* Perforated dashed line */}
                <div className="w-full border-t-2 border-dashed border-slate-200 dark:border-[#1a3884]/40" />
                
                {/* Right Notch */}
                <div className="absolute -right-3 h-5 w-5 rounded-full bg-white dark:bg-[#001026] border-l border-slate-200 dark:border-[#1a3884]/40" />
              </div>

              {/* BOTTOM TICKET SECTION: QR Code & Live Status */}
              <div className="p-4 sm:p-5 text-center bg-slate-50/50 dark:bg-[#001430]/70 flex flex-col items-center">
                <div className="inline-block rounded-2xl bg-white p-2.5 shadow-sm border border-slate-200/90 dark:border-slate-700">
                  <QRCodeSVG
                    value={qrValue}
                    size={160}
                    fgColor="#0d1f4e"
                    bgColor="#ffffff"
                  />
                </div>

                {/* Status Indicator */}
                <div className="mt-3">
                  {isCheckedIn ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Checked In & Verified</span>
                      {passData?.checkedInAt && (
                        <span className="opacity-75 font-normal">
                          ({new Date(passData.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-[11px] font-bold text-[#1a3884] dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                      </span>
                      <span>Ready for Venue & Booth Scan</span>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-[10.5px] text-slate-400 dark:text-slate-400 max-w-xs leading-relaxed">
                  Present this QR code at the event entrance or recruiter booths for instant identity verification.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions (Fixed Bottom) */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/90 dark:border-[#1a3884]/30 dark:bg-[#001430]/90 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0d1f4e] shadow-sm transition-all hover:bg-slate-50 active:scale-95 dark:border-[#1a3884]/40 dark:bg-[#001738] dark:text-white"
            >
              <Printer className="h-3.5 w-3.5 text-[#1a3884] dark:text-cyan-400" />
              Print / Save Pass
            </button>

            <button
              onClick={onClose}
              className="rounded-xl bg-[#0d1f4e] px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1a3884] active:scale-95 dark:bg-[#1a3884] dark:hover:bg-[#24499e]"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};

export default JobFairDigitalPassModal;
