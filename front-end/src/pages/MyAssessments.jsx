import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Target, X, Lock, CheckCircle2, Download } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import AssessmentBanner from "@/components/AssessmentBanner";
import { assessmentApi } from "@/services/assessmentApi";
import { generateAssessmentReport } from "@/utils/reportGenerator";
=======
import useUser from "@/hooks/useUser";
>>>>>>> fc2825fbaa54e1b4fc5ae041d1051e6ce061b29f

// Theme colors: Navy (#002147), Teal (#30919D), White
const THEME = {
  navy: '#002147',
  teal: '#30919D',
  white: '#FFFFFF'
};

// Assessment configuration for the path - Only Base Line Test remaining
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
<<<<<<< HEAD

const MyAssessments = () => {  const [hasCompletedBaseLine, setHasCompletedBaseLine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nextUnlockTime, setNextUnlockTime] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [userName, setUserName] = useState("");
  const [currentUser, setCurrentUser] = useState(null);  useEffect(() => {
    const firstLoginFlag = sessionStorage.getItem("isFirstLogin");
    if (firstLoginFlag === "true") {
      setIsFirstLogin(true);
      setTimeout(() => {
        sessionStorage.removeItem("isFirstLogin");
      }, 5000);
    }
<<<<<<< HEAD
    
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.fullName || "");
        setCurrentUser(user);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
=======
>>>>>>> fc2825fbaa54e1b4fc5ae041d1051e6ce061b29f
  }, []);

  useEffect(() => {
    const fetchAssessmentDetails = async () => {
      try {
        const response = await assessmentApi.getByCode('ASM00001');
        if (response.success && response.data) {
          setBaseLineAssessmentDetails(response.data);
        }
      } catch (error) {
        console.error("Error fetching assessment details:", error);
      }
    };

    fetchAssessmentDetails();
  }, []);

  // Timer for cooldown
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
        if (!userData) {
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(userData);
        const userId = parsedUser.id || parsedUser._id;

        if (!userId) {
          setLoading(false);
          return;
        }

        const [userResultsResponse, baseLineRes] = await Promise.all([
          assessmentApi.getUserResults(userId, 'completed'),
          assessmentApi.getBaseLineResults(userId).catch(() => ({ success: false }))
        ]);
        
        if (userResultsResponse.success && userResultsResponse.data) {
          // THE FIX: Strictly check if specialized results exist in BaseLineResult collection
          // This allows users to retake if they delete records from that collection.
          const completedBaseLine = baseLineRes.success && !!baseLineRes.data;
          
          setHasCompletedBaseLine(completedBaseLine);

          const assessmentFlow = [
             { key: 'baseline', completed: completedBaseLine, code: 'ASM00001' }
          ];

          const nextIndex = assessmentFlow.findIndex(a => !a.completed);
          const activeIndex = nextIndex === -1 ? assessmentFlow.length : nextIndex;
          setCurrentStepIndex(activeIndex);

          let unlockTime = null;
          setNextUnlockTime(unlockTime);

          const newResults = { ...results };

          if (baseLineRes.success && baseLineRes.data) {
             newResults.baseline = {
                // Keep backward compatible fields just in case
                score: baseLineRes.data.score || 0,
                totalScore: baseLineRes.data.totalScore || 300,
                percentage: baseLineRes.data.percentage || 0,
                // Add full report data
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
                  style={{
                    backgroundColor: isCompleted ? THEME.teal : isCurrent && !isTimerActive ? THEME.teal : '#4B5563'
                  }}
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
                    style={{ 
                      backgroundColor: `${THEME.teal}20`,
                      color: THEME.teal,
                      border: `1px solid ${THEME.teal}50`
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    View Results
                  </button>
                ) : (
                  <a
                    href={assessment.path}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    style={{ 
                      backgroundColor: THEME.teal,
                      color: THEME.white,
                      border: `2px solid ${THEME.white}30`
                    }}
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
      <DashboardSidebar />
      <div className="min-h-screen transition-all duration-300">
        <DashboardHeader />
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

            <div className="relative max-w-3xl mx-auto pl-4 sm:pl-8">
              <div className="absolute left-0 sm:left-2 top-12 bottom-12 w-1 rounded-full" style={{ backgroundColor: `${THEME.teal}50` }} />
              <div className="relative space-y-6 sm:space-y-8 py-4">
                {assessmentConfig.map((assessment, index) => renderPathNode(assessment, index))}
              </div>
            </div>
          </motion.div>

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

                          {/* DOWNLOAD REPORT BUTTON */}
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
        </main>
      </div>
    </div>
  );
};

export default MyAssessments;
