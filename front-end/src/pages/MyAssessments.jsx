import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, Target, X, CheckCircle2, Download, Shield, Share2,
  BarChart2, MapPin, Briefcase, Calendar, CheckCircle, ArrowLeft
} from "lucide-react";
import AssessmentBanner from "@/components/AssessmentBanner";
import { assessmentApi } from "@/services/assessmentApi";
import { generateAssessmentReport } from "@/utils/reportGenerator";
import useUser from "@/hooks/useUser";
import spImage from "@/assets/sp.jpeg";

// Theme colors
const THEME = {
  navy: '#002147',
  teal: '#1a3884',
  white: '#FFFFFF'
};

// Assessment configuration
const assessmentConfig = [
  {
    key: 'baseline',
    code: 'ASM00001',
    title: 'Base Line Test - T1',
    shortTitle: 'Base Line - T1',
    category: 'Assessment',
    icon: Target,
    path: '/dashboard/assessments/baseline',
    questions: '300 Questions',
    duration: '~45 mins'
  }
];

// Quotients list
const QUOTIENTS = [
  { id: 'CRQ', label: 'CRQ', desc: 'Cognitive Reasoning Quotient', color: '#a78bfa' },
  { id: 'SRQ', label: 'SRQ', desc: 'Self-Regulation Quotient', color: '#60a5fa' },
  { id: 'LQ', label: 'LQ', desc: 'Learning Quotient (Learning Agility Quotient)', color: '#34d399' },
  { id: 'SIQ', label: 'SIQ', desc: 'Social Intelligence Quotient', color: '#f472b6' },
  { id: 'PEQ', label: 'PEQ', desc: 'Professional Execution Quotient', color: '#fb923c' },
  { id: 'DAQ', label: 'DAQ', desc: 'Digital & AI Quotient', color: '#38bdf8' },
  { id: 'SEQ', label: 'SEQ', desc: 'Sustainability & Ethics Quotient', color: '#4ade80' },
];

// ----- Skills Passport Card (full modal) -----
const SkillsPassportModal = ({ onClose, currentUser, baselineResult }) => {
  const userName = currentUser?.fullName || "SMAART Minds";
  const identityRef = (currentUser?._id || currentUser?.id || "6933C176").toString().slice(-8).toUpperCase();
  const joinYear = currentUser?.createdAt
    ? new Date(currentUser.createdAt).getFullYear()
    : new Date().getFullYear();
  const stageBand = baselineResult?.stageBand || null;
  const verifiedDate = baselineResult
    ? new Date(baselineResult.createdAt || Date.now()).toLocaleDateString('en-GB').replace(/\//g, '/')
    : new Date().toLocaleDateString('en-GB').replace(/\//g, '/');

  // Build skill proficiency score ring
  const score = baselineResult?.baselineScore || 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  // Skill tags derived from quotients
  const skills = [
    "Lead Generation",
    "CRM Management (HubSpot / Zoho)",
    "Sales Negotiation",
    "Market Research & Competitor Analysis",
    "Client Relationship Management",
    "Communication & Presentation",
    "Proposal & Pitch Deck Creation",
    "Sales Pipeline Tracking",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl mx-4 my-8 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(56,189,248,0.18)]"
        style={{ background: 'linear-gradient(160deg, #0d1b3e 0%, #060e22 60%, #0a1628 100%)', border: '1.5px solid rgba(56,189,248,0.18)' }}
      >
        {/* Subtle glowing top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #38bdf8, #818cf8, transparent)' }} />

        {/* Header */}
        <div className="relative px-8 pt-10 pb-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full transition-all hover:bg-white/10"
            style={{ color: '#64748b' }}
          >
            <X className="w-4 h-4" />
          </button>

          <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: '#f1f5f9' }}>
            Digital Skills Passport
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Verified Career Identity &amp; Competency Credential</p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <button
              onClick={() => baselineResult && generateAssessmentReport(currentUser, baselineResult)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
            >
              <Download className="w-4 h-4" />
              Export Credential
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <BarChart2 className="w-4 h-4" />
              View Reports
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Share2 className="w-4 h-4" />
              Share Profile
            </button>
          </div>
        </div>

        {/* Identity Card */}
        <div className="mx-6 mb-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              {/* Logo icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.12)', border: '1.5px solid rgba(56,189,248,0.3)' }}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="4" stroke="#38bdf8" strokeWidth="1.5" />
                  <path d="M8 12h8M12 8v8" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: '#f1f5f9' }}>{userName}</p>
                <span className="flex items-center gap-1 text-xs font-bold mt-0.5" style={{ color: '#10b981' }}>
                  <CheckCircle className="w-3 h-3" />
                  VERIFIED
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#38bdf8', opacity: 0.7 }}>Identity Ref</p>
              <p className="text-lg font-black tracking-widest mt-0.5" style={{ color: '#38bdf8' }}>{identityRef}</p>
            </div>
          </div>
        </div>

        {/* Main Body: Two columns */}
        <div className="mx-6 mb-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex flex-col md:flex-row">
            {/* Left: Robot + Info + Ring */}
            <div className="md:w-[45%] flex flex-col items-center px-5 py-6 border-b md:border-b-0 md:border-r" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              {/* Robot Image */}
              <div className="relative w-36 h-36 mb-4">
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 75%)' }} />
                <img
                  src={spImage}
                  alt="SMAART AI"
                  className="w-full h-full object-cover rounded-2xl"
                  style={{ border: '2px solid rgba(56,189,248,0.25)' }}
                />
              </div>

              {/* Info rows */}
              <div className="w-full space-y-2 mb-5">
                {stageBand && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} />
                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#64748b' }}>Rank</span>
                    <span className="ml-auto text-xs font-bold" style={{ color: '#e2e8f0' }}>{stageBand.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} />
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#64748b' }}>Loc</span>
                  <span className="ml-auto text-xs font-bold" style={{ color: '#e2e8f0' }}>Remote, Earth</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} />
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#64748b' }}>Exp</span>
                  <span className="ml-auto text-xs font-bold truncate max-w-[100px]" style={{ color: '#e2e8f0' }}>SMAART Institute</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} />
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#64748b' }}>Join</span>
                  <span className="ml-auto text-xs font-bold" style={{ color: '#e2e8f0' }}>{joinYear}</span>
                </div>
              </div>

              {/* Global Readiness Ring */}
              <div className="flex flex-col items-center mt-2">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="10" />
                  <motion.circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke="url(#ringGrad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    transform="rotate(-90 60 60)"
                  />
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                  <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#38bdf8">{score}%</text>
                  <text x="60" y="72" textAnchor="middle" fontSize="8" fill="#64748b">SCORE</text>
                </svg>
                <p className="text-xs font-bold tracking-widest uppercase mt-1" style={{ color: '#38bdf8' }}>Global Readiness</p>
              </div>
            </div>

            {/* Right: Skill Proficiency + Tags */}
            <div className="md:w-[55%] px-5 py-6">
              <div className="flex items-center gap-2 mb-5">
                <Target className="w-4 h-4" style={{ color: '#38bdf8' }} />
                <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#e2e8f0' }}>Skill Proficiency</h3>
              </div>

              {/* Skill tags */}
              <div className="flex flex-col gap-2">
                {skills.map((skill, i) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.35 }}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}
                  >
                    <span>{skill}</span>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
                  </motion.div>
                ))}
              </div>

              {/* Quotients */}
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: '#64748b' }}>Assessment Quotients</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {QUOTIENTS.map(q => (
                    <div key={q.id} className="flex items-center gap-2">
                      <span className="text-xs font-black w-10 flex-shrink-0" style={{ color: q.color }}>{q.id}</span>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>– {q.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mx-6 mb-6 rounded-2xl flex items-center justify-between px-5 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#475569' }}>Issued by</span>
            <span className="text-sm font-bold" style={{ color: '#94a3b8' }}>SMAART Minds AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#38bdf8' }} />
            <span className="text-xs font-bold" style={{ color: '#38bdf8' }}>AI Verified</span>
            <span className="text-xs" style={{ color: '#475569' }}>• {verifiedDate}</span>
          </div>
        </div>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent)' }} />
      </motion.div>
    </motion.div>
  );
};

// ----- Main MyAssessments Component -----
const MyAssessments = () => {
  const { user: currentUser, loading: userLoading } = useUser();
  const userName = currentUser?.fullName || "";
  const [hasCompletedBaseLine, setHasCompletedBaseLine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextUnlockTime, setNextUnlockTime] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [showPassport, setShowPassport] = useState(false);

  const [baseLineAssessmentDetails, setBaseLineAssessmentDetails] = useState(null);
  const [baselineResult, setBaselineResult] = useState(null);

  const [results, setResults] = useState({ baseline: null });
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const completionStatus = { baseline: hasCompletedBaseLine };

  useEffect(() => {
    const firstLoginFlag = sessionStorage.getItem("isFirstLogin");
    if (firstLoginFlag === "true") {
      setIsFirstLogin(true);
      setTimeout(() => { sessionStorage.removeItem("isFirstLogin"); }, 5000);
    }
  }, []);

  useEffect(() => {
    const fetchAssessmentDetails = async () => {
      try {
        const response = await assessmentApi.getByCode('ASM00001');
        if (response.success && response.data) setBaseLineAssessmentDetails(response.data);
      } catch (error) {
        console.error("Error fetching assessment details:", error);
      }
    };
    fetchAssessmentDetails();
  }, []);

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    if (!nextUnlockTime) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [nextUnlockTime]);

  useEffect(() => {
    const checkCompletion = async () => {
      try {
        const userData = sessionStorage.getItem("user");
        if (!userData) { setLoading(false); return; }
        const parsedUser = JSON.parse(userData);
        const userId = parsedUser.id || parsedUser._id;
        if (!userId) { setLoading(false); return; }

        const [userResultsResponse, baseLineRes] = await Promise.all([
          assessmentApi.getUserResults(userId, 'completed'),
          assessmentApi.getBaseLineResults(userId).catch(() => ({ success: false }))
        ]);

        if (userResultsResponse.success && userResultsResponse.data) {
          const completedBaseLine = baseLineRes.success && !!baseLineRes.data;
          setHasCompletedBaseLine(completedBaseLine);
          if (baseLineRes.success && baseLineRes.data) setBaselineResult(baseLineRes.data);

          const assessmentFlow = [{ key: 'baseline', completed: completedBaseLine, code: 'ASM00001' }];
          const nextIndex = assessmentFlow.findIndex(a => !a.completed);
          const activeIndex = nextIndex === -1 ? assessmentFlow.length : nextIndex;
          setCurrentStepIndex(activeIndex);
          setNextUnlockTime(null);

          const newResults = { ...results };
          if (baseLineRes.success && baseLineRes.data) {
            newResults.baseline = {
              score: baseLineRes.data.score || 0,
              totalScore: baseLineRes.data.totalScore || 300,
              percentage: baseLineRes.data.percentage || 0,
              baselineScore: baseLineRes.data.baselineScore,
              stageBand: baseLineRes.data.stageBand,
              t1Profile: baseLineRes.data.t1Profile
            };
          } else {
            newResults.baseline = null;
          }
          setResults(newResults);
        }
      } catch (error) {
        console.error("Error checking assessment completion:", error);
      } finally {
        setLoading(false);
      }
    };
    checkCompletion();
  }, []);

  const getAssessmentStatus = (index, key) => {
    const isCompleted = completionStatus[key];
    const isCurrent = index === currentStepIndex;
    const isLocked = index > currentStepIndex;
    const isTimerActive = isCurrent && nextUnlockTime && currentTime < nextUnlockTime;
    return { isCompleted, isCurrent, isLocked, isTimerActive };
  };

  const renderPathNode = (assessment, index) => {
    const { isCompleted, isCurrent, isLocked, isTimerActive } = getAssessmentStatus(index, assessment.key);
    const IconComponent = assessment.icon;

    return (
      <motion.div
        key={assessment.key}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="relative flex items-center"
      >
        <div className="flex-shrink-0 flex flex-col items-center mr-4">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shadow-md"
            style={{
              backgroundColor: isCompleted ? THEME.teal : isCurrent ? THEME.navy : '#374151',
              color: THEME.white,
              border: `2px solid ${isCompleted ? THEME.teal : isCurrent ? THEME.teal : '#4B5563'}`
            }}
          >
            Step {index + 1}
          </div>
        </div>

        <div className="relative flex-1 max-w-lg">
          <motion.div
            whileHover={!isLocked && !isTimerActive ? { scale: 1.02 } : {}}
            className="relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300"
            style={{
              backgroundColor: THEME.navy,
              border: `2px solid ${isCompleted ? THEME.teal : isCurrent && !isTimerActive ? THEME.teal : '#374151'}`,
              opacity: isLocked || isTimerActive ? 0.7 : 1
            }}
          >
            <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, ${THEME.teal}, ${THEME.navy})` }} />
            <div className="relative z-10 p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4 mb-3">
                <div
                  className="relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: isCompleted ? THEME.teal : isCurrent && !isTimerActive ? THEME.teal : '#4B5563' }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: THEME.white }} />
                  ) : (
                    <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: THEME.white }} />
                  )}
                  {isCurrent && !isTimerActive && !isCompleted && (
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: `${THEME.teal}40` }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: isCompleted || isCurrent ? THEME.teal : '#9CA3AF' }}>
                    {assessment.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold truncate" style={{ color: isLocked || isTimerActive ? '#9CA3AF' : THEME.white }}>
                    {assessment.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs" style={{ color: '#D1D5DB' }}>{assessment.questions}</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>•</span>
                    <span className="text-xs" style={{ color: '#D1D5DB' }}>{assessment.duration}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                {isCompleted ? (
                  <button
                    onClick={() => setSelectedAssessment({
                      id: assessment.key,
                      title: assessment.title,
                      icon: assessment.icon,
                      data: results[assessment.key],
                      description: `View your ${assessment.title} results.`
                    })}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 hover:opacity-90"
                    style={{ backgroundColor: `${THEME.teal}20`, color: THEME.teal, border: `1px solid ${THEME.teal}50` }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    View Results
                  </button>
                ) : (
                  <a
                    href={assessment.path}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ backgroundColor: THEME.teal, color: THEME.white, border: `2px solid ${THEME.white}30` }}
                  >
                    Start Assessment
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen">
      <main className="p-4 sm:p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {isFirstLogin && (
              <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="mb-6 sm:mb-8">
                <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${THEME.teal}20, ${THEME.navy})`, border: `2px solid ${THEME.teal}` }}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl" style={{ backgroundColor: `${THEME.teal}30` }}>
                        <Award className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: THEME.teal }} />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: THEME.white }}>Welcome back, {userName || "Student"}! 🎉</h2>
                    </div>
                    <p className="text-sm sm:text-base mb-4" style={{ color: '#D1D5DB' }}>Complete your base line assessment to unlock personalized insights.</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mb-6 sm:mb-8">
              <AssessmentBanner title="MY ASSESSMENTS" />
            </div>

            {/* Skills Passport Button */}
            <div className="mb-6 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(56,189,248,0.25)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowPassport(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, #1e3a78, #0f2861)',
                  color: '#38bdf8',
                  border: '1.5px solid rgba(56,189,248,0.35)',
                  boxShadow: '0 4px 16px rgba(56,189,248,0.12)'
                }}
              >
                <Shield className="w-4 h-4" />
                Skills Passport
              </motion.button>
            </div>

            <div className="relative max-w-3xl mx-auto pl-4 sm:pl-8">
              <div className="absolute left-0 sm:left-2 top-12 bottom-12 w-1 rounded-full" style={{ backgroundColor: `${THEME.teal}50` }} />
              <div className="relative space-y-6 sm:space-y-8 py-4">
                {assessmentConfig.map((assessment, index) => renderPathNode(assessment, index))}
              </div>
            </div>
          </motion.div>

          {/* Results Modal */}
          <AnimatePresence>
            {selectedAssessment && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setSelectedAssessment(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#001730] border-2 border-cyan-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)]"
                >
                  <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#001e3c]">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg border border-cyan-400/50 text-cyan-400 bg-transparent">
                        <selectedAssessment.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedAssessment.title}</h2>
                        <p className="text-cyan-400/70 text-sm">Detailed Results</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedAssessment(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar text-gray-300">
                    {selectedAssessment.id === 'baseline' && selectedAssessment.data && (
                      <div className="space-y-6">
                        <div className="p-8 rounded-xl bg-gradient-to-b from-[#002845] to-[#001730] border border-cyan-500/30 text-center">
                          <h3 className="text-cyan-400/80 uppercase tracking-wider text-sm font-bold mb-4">Readiness Profile</h3>
                          <div className="inline-block px-8 py-3 rounded-full bg-cyan-500/10 text-cyan-400 font-bold text-lg border border-cyan-500/30 backdrop-blur-md uppercase tracking-widest">
                            Current Band: {selectedAssessment.data.stageBand || 'Emerging'}
                          </div>
                        </div>
                        <button
                          onClick={() => generateAssessmentReport(currentUser, selectedAssessment.data)}
                          className="w-full py-4 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:translate-y-[-2px] hover:shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30"
                        >
                          <Download className="w-5 h-5" />
                          Download Detailed PDF Report
                        </button>
                        <div className="bg-[#001e3c] p-6 rounded-xl border border-white/10">
                          <h4 className="text-lg font-bold text-white mb-3">Assessment Summary</h4>
                          <p className="text-gray-300">You have completed the Base Line Test - T1. This assessment measures your fundamental understanding and provides a baseline for your growth journey.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skills Passport Modal */}
          <AnimatePresence>
            {showPassport && (
              <SkillsPassportModal
                onClose={() => setShowPassport(false)}
                currentUser={currentUser}
                baselineResult={baselineResult}
              />
            )}
          </AnimatePresence>
        </main>
    </div>
  );
};

export default MyAssessments;
