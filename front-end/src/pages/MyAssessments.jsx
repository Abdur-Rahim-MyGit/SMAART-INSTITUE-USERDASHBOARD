import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Award, Target, X, CheckCircle2, Download, Shield, Share2,
  BarChart2, MapPin, Briefcase, Calendar, CheckCircle, ArrowLeft
} from "lucide-react";
import AssessmentBanner from "@/components/AssessmentBanner";
import { assessmentApi } from "@/services/assessmentApi";
import { generateAssessmentReport } from "@/utils/reportGenerator";
import useUser from "@/hooks/useUser";
import SkillsPassportModal from "@/components/SkillsPassportModal";
import { AssessmentsSkeleton } from "@/components/SkeletonPatterns";

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

// ----- Main MyAssessments Component -----
const MyAssessments = () => {
  const { t } = useTranslation();
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

    const translatedTitle = t(`my_assessments.${assessment.key}_title`, { defaultValue: assessment.title });
    const translatedCategory = t(`my_assessments.category_${assessment.category.toLowerCase()}`, { defaultValue: assessment.category });
    const translatedQuestions = t(`my_assessments.questions_count`, { defaultValue: assessment.questions });
    const translatedDuration = t(`my_assessments.duration_approx`, { defaultValue: assessment.duration });

    return (
      <motion.div
        key={assessment.key}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="relative flex items-center"
      >
        <div className="mr-4 flex flex-shrink-0 flex-col items-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-xs font-bold shadow-md sm:h-14 sm:w-14 sm:text-sm ${
              isCompleted
                ? "bg-gradient-to-br from-[#1a3884] to-[#3b6de3] text-white shadow-lg shadow-blue-500/20"
                : isCurrent
                  ? "bg-gradient-to-br from-[#1a3884] to-[#3b6de3] text-white"
                  : "border-2 border-slate-100 bg-[#F8FAFC] text-slate-400 dark:border-white/10 dark:bg-[#002A5C] dark:text-slate-500"
            }`}
          >
            {t("my_assessments.step")} {index + 1}
          </div>
        </div>

        <div className="relative max-w-lg flex-1">
          <motion.div
            whileHover={!isLocked && !isTimerActive ? { scale: 1.02 } : {}}
            className={`relative overflow-hidden rounded-[24px] border shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)] transition-all duration-300 dark:shadow-none ${
              isCompleted || (isCurrent && !isTimerActive)
                ? "border-blue-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] dark:border-blue-500/25 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,1)_100%)]"
                : "border-slate-200/80 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] opacity-70 dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,1)_100%)]"
            }`}
          >
            <div className="relative z-10 p-5 sm:p-6">
              <div className="mb-4 flex items-start gap-4">
                <div
                  className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm sm:h-16 sm:w-16 ${
                    isCompleted || (isCurrent && !isTimerActive)
                      ? "bg-blue-50 text-[#1a3884] dark:bg-blue-500/10 dark:text-blue-400"
                      : "bg-[#F8FAFC] text-slate-400 dark:bg-[#002A5C] dark:text-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" />
                  ) : (
                    <IconComponent className="h-7 w-7 sm:h-8 sm:w-8" />
                  )}
                  {isCurrent && !isTimerActive && !isCompleted && (
                    <span className="absolute inset-0 animate-ping rounded-2xl bg-blue-400/20" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCompleted || isCurrent ? "text-[#1a3884] dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {translatedCategory}
                  </span>
                  <h3 className={`truncate text-lg font-black sm:text-xl ${isLocked || isTimerActive ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                    {translatedTitle}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{translatedQuestions}</span>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-600">•</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{translatedDuration}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                {isCompleted ? (
                  <button
                    onClick={() => setSelectedAssessment({
                      id: assessment.key,
                      title: translatedTitle,
                      icon: assessment.icon,
                      data: results[assessment.key],
                      description: t("my_assessments.view_results_desc", { title: translatedTitle, defaultValue: `View your ${translatedTitle} results.` })
                    })}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-[#1a3884] hover:bg-[#1a3884] hover:text-white dark:border-white/10 dark:bg-[#002147] dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-[#1a3884]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t("my_assessments.view_results")}
                  </button>
                ) : (
                  <a
                    href={assessment.path}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3884] via-[#2b57c4] to-[#3b6de3] py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/15 transition-all hover:shadow-xl"
                  >
                    {t("my_assessments.start_assessment")}
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
      <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {loading ? (
          <AssessmentsSkeleton />
        ) : (
          <>
            <motion.div className="mx-auto max-w-7xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {isFirstLogin && (
              <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }} className="mb-6 sm:mb-8">
                <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#eef4ff_100%)] p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.24)] dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(15,23,42,0.98)_48%,_rgba(30,41,59,1)_100%)] sm:p-8">
                  <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
                  <div className="relative z-10">
                    <div className="mb-3 flex items-center gap-4">
                      <div className="rounded-2xl bg-blue-50 p-3 text-[#1a3884] dark:bg-blue-500/10 dark:text-blue-300">
                        <Award className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 sm:text-2xl">{t("my_assessments.welcome_back", { name: userName || t("common.student") })}</h2>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">{t("my_assessments.welcome_back_desc")}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="mb-6 sm:mb-8">
              <AssessmentBanner title={t("my_assessments.page_title")} />
            </div>

            {/* Skills Passport Button */}
            <div className="mb-8 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPassport(true)}
                className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-[#F8FAFC] dark:bg-[#002147] dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-[#002A5C]"
              >
                <Shield className="h-4 w-4 text-[#1a3884] dark:text-blue-400" />
                {t("my_assessments.skills_passport")}
              </motion.button>
            </div>

            <div className="relative mx-auto max-w-3xl pl-4 sm:pl-8">
              <div className="absolute bottom-12 left-0 top-12 w-1 rounded-full bg-blue-100 dark:bg-blue-900/50 sm:left-2" />
              <div className="relative space-y-6 py-4 sm:space-y-8">
                {assessmentConfig.map((assessment, index) => renderPathNode(assessment, index))}
              </div>
            </div>
          </motion.div>

          {/* Results Modal */}
          <AnimatePresence>
            {selectedAssessment && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
                onClick={() => setSelectedAssessment(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#eef4ff_100%)] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.24)] dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(15,23,42,0.98)_48%,_rgba(30,41,59,1)_100%)]"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-5 dark:border-slate-700/80">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-blue-50 p-2.5 text-[#1a3884] dark:bg-blue-500/10 dark:text-blue-400">
                        <selectedAssessment.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">{selectedAssessment.title}</h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("my_assessments.detailed_results")}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedAssessment(null)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#002A5C] dark:hover:text-slate-300">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="custom-scrollbar overflow-y-auto p-6 text-slate-600 dark:text-slate-300">
                    {selectedAssessment.id === 'baseline' && selectedAssessment.data && (
                      <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-8 text-center backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/60">
                          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("my_assessments.readiness_profile")}</h3>
                          <div className="inline-block rounded-full border border-blue-200 bg-blue-50 px-8 py-3 text-lg font-black uppercase tracking-widest text-[#1a3884] dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
                            {t("my_assessments.current_band", { band: selectedAssessment.data.stageBand || 'Emerging' })}
                          </div>
                        </div>
                        <button
                          onClick={() => generateAssessmentReport(currentUser, selectedAssessment.data)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                        >
                          <Download className="h-5 w-5" />
                          {t("my_assessments.download_pdf")}
                        </button>
                        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-6 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/60">
                          <h4 className="mb-3 text-lg font-black text-slate-900 dark:text-slate-50">{t("my_assessments.assessment_summary")}</h4>
                          <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{t("my_assessments.assessment_summary_desc")}</p>
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
          </>
        )}
        </main>
    </div>
  );
};

export default MyAssessments;
