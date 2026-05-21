import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Target, CheckCircle2, Lock, ChevronRight, ChevronDown, PlayCircle, FileText, Volume2, Sparkles, Trophy, Star } from "lucide-react";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import MCQPractice from "@/components/MCQPractice";
import FlashcardTask from "@/components/FlashcardTask";
import AdvancedPractice from "@/components/AdvancedPractice";
import CaseStudy from "@/components/CaseStudy";
import Notes from "@/components/Notes";
import FloatingDictionary from "@/components/FloatingDictionary";
import FloatingNotes from "@/components/FloatingNotes";
import { STAGE_1_COURSES, STAGE_2_COURSES, STAGE_3_COURSES, PIQ_TRACK, AIQ_TRACK, SQ_TRACK } from "@/data/courseStructureData";
import { getLearningFlowData } from "@/data/learningFlowData";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Sample video URLs - replace with actual video URLs from your backend
const COURSE_VIDEOS = {
  'S01': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S02': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S03': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S04': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S05': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S06': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S07': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S08': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S09': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S10': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S11': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S12': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S13': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S14': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S15': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S16': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S17': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S18': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S19': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S20': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S21': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S22': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S23': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S24': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S25': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ01': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ02': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ03': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ04': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ05': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ01': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ02': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ03': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ04': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ05': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ01': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ02': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ03': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ04': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ05': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

const getCourseById = (courseId) => {
  const allCourses = [
    ...STAGE_1_COURSES,
    ...STAGE_2_COURSES,
    ...STAGE_3_COURSES,
    ...PIQ_TRACK,
    ...AIQ_TRACK,
    ...SQ_TRACK,
  ];
  return allCourses.find(course => course.id === courseId);
};

const getStageAndTrackInfo = (courseId) => {
  if (STAGE_1_COURSES.find(c => c.id === courseId)) {
    return { stage: 'Stage 1', stageName: 'Capacity', type: 'Stage 1 Capacity' };
  }
  if (STAGE_2_COURSES.find(c => c.id === courseId)) {
    return { stage: 'Stage 2', stageName: 'Capability', type: 'Stage 2 Capability' };
  }
  if (STAGE_3_COURSES.find(c => c.id === courseId)) {
    return { stage: 'Stage 3', stageName: 'Leadership', type: 'Stage 3 Leadership' };
  }
  if (PIQ_TRACK.find(c => c.id === courseId)) {
    return { stage: 'PIQ Track', stageName: 'Personal Intelligence', type: 'PIQ Track' };
  }
  if (AIQ_TRACK.find(c => c.id === courseId)) {
    return { stage: 'AIQ Track', stageName: 'AI Readiness', type: 'AIQ Track' };
  }
  if (SQ_TRACK.find(c => c.id === courseId)) {
    return { stage: 'SQ Track', stageName: 'Sustainability', type: 'SQ Track' };
  }
  return { stage: 'Unknown', stageName: 'Unknown', type: 'Unknown' };
};

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [activeStep, setActiveStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [showOverview, setShowOverview] = useState(true);
  const [showTranscription, setShowTranscription] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [showCongratulation, setShowCongratulation] = useState(false);
  const [congratulationAcknowledged, setCongratulationAcknowledged] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  const course = getCourseById(courseId);
  const { stage, stageName, type } = getStageAndTrackInfo(courseId);
  const videoUrl = COURSE_VIDEOS[courseId];
  const learningFlowData = getLearningFlowData(courseId);

  useEffect(() => {
    // Reset all local state when course changes
    setShowIntro(true);
    setActiveStep(null);
    setCompletedSteps({});
    setShowCongratulation(false);
    setCongratulationAcknowledged(false);
    setIsCompleted(false);
    setVideoProgress(0);
    setVideoWatched(false);
    setLoading(false);
    window.scrollTo(0, 0);
  }, [courseId]);

  const handleStartCourse = () => {
    setShowIntro(false);
    setActiveStep('1');
    setVideoWatched(false);
  };

  const handleStepClick = (stepNumber) => {
    if (!isStepLocked(stepNumber)) {
      setActiveStep(activeStep === stepNumber ? null : stepNumber);
      setVideoWatched(false);
    } else {
      toast.error(`Please complete Step ${parseInt(stepNumber) - 1} first!`);
    }
  };

  const handleStepComplete = (stepNumber) => {
    setCompletedSteps(prev => ({ ...prev, [stepNumber]: true }));
    
    // Check if all 9 steps are completed
    const allSteps = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const newCompletedSteps = { ...completedSteps, [stepNumber]: true };
    const allCompleted = allSteps.every(step => newCompletedSteps[step]);
    
    if (allCompleted) {
      setIsCompleted(true);
      setShowCongratulation(true);
      setActiveStep(null);
    } else {
      // Auto-advance to next step
      const nextStep = (parseInt(stepNumber) + 1).toString();
      setActiveStep(nextStep);
      setVideoWatched(false);
    }
  };


  const isStepLocked = (stepNumber) => {
    return false; // Unlocked all for testing
  };

  const getStepStatus = (stepNumber) => {
    if (completedSteps[stepNumber]) return 'completed';
    if (isStepLocked(stepNumber)) return 'locked';
    return 'available';
  };

  const handleBack = () => {
    navigate('/dashboard/courses');
  };

  const handleVideoProgressUpdate = (maxTime, completed, duration) => {
    setVideoProgress(maxTime);
    if (completed) setVideoWatched(true);
    setIsCompleted(completed);
  };

  const handleNextLesson = () => {
    // Find current course index
    const allCourses = [
      ...STAGE_1_COURSES,
      ...STAGE_2_COURSES,
      ...STAGE_3_COURSES,
      ...PIQ_TRACK,
      ...AIQ_TRACK,
      ...SQ_TRACK,
    ];
    const currentIndex = allCourses.findIndex(c => c.id === courseId);
    
    // Stage Gating Logic - Redirect to assessment at stage boundaries
    if (courseId === 'S10') {
      navigate('/assessment/T2');
      return;
    }
    if (courseId === 'S19') {
      navigate('/assessment/T3');
      return;
    }
    if (courseId === 'S25') {
      navigate('/assessment/T4');
      return;
    }

    if (currentIndex !== -1 && currentIndex < allCourses.length - 1) {
      const nextCourse = allCourses[currentIndex + 1];
      // Reset state for next lesson
      setCompletedSteps({});
      setActiveStep(null);
      setShowCongratulation(false);
      setCongratulationAcknowledged(false);
      setIsCompleted(false);
      setVideoProgress(0); // Reset video progress for next course
      navigate(`/dashboard/courses/${nextCourse.id}/player`);
    } else {
      navigate('/dashboard/courses');
    }
  };

  const handleAcknowledgeCongratulation = () => {
    setShowCongratulation(false);
    setCongratulationAcknowledged(true);
  };

  const renderStepContent = (stepData, stepLetter) => {
    const contentType = stepData.contentType;
    const isStepCompleted = completedSteps[stepLetter];

    switch (contentType) {
      case 'video-text':
        return (
          <div className="space-y-4">
            {stepData.videoUrl && (
              <div className="rounded-xl overflow-hidden">
                <CustomVideoPlayer
                  videoUrl={stepData.videoUrl}
                  title={stepData.title}
                  onProgressUpdate={handleVideoProgressUpdate}
                  onNext={activeStep !== '9' ? () => {
                    const nextStep = (parseInt(activeStep) + 1).toString();
                    handleStepComplete(activeStep);
                    setActiveStep(nextStep);
                    setVideoWatched(false);
                  } : null}
                />
              </div>
            )}
            
            {/* Tab Switcher Section */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex p-1.5 bg-slate-100/50 dark:bg-slate-800/50 m-4 rounded-xl border border-slate-200/30 dark:border-white/5">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all duration-300 text-sm relative ${
                    activeTab === 'preview'
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {activeTab === 'preview' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-[#1a3884] rounded-lg shadow-lg shadow-[#1a3884]/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <BookOpen size={16} className={activeTab === 'preview' ? 'text-white' : 'text-slate-400'} />
                    Preview
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('transcription')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all duration-300 text-sm relative ${
                    activeTab === 'transcription'
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {activeTab === 'transcription' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-[#1a3884] rounded-lg shadow-lg shadow-[#1a3884]/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <FileText size={16} className={activeTab === 'transcription' ? 'text-white' : 'text-slate-400'} />
                    Transcription
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'preview' && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <div className="bg-[#F8FAFC] rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Lesson Preview</h4>
                      <p className="text-gray-600 leading-relaxed">
                        {stepData.content || 'Watch this lesson to continue your learning journey.'}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{stepData.duration || '5-10 min'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4" />
                          <span>Video Lesson</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeTab === 'transcription' && (
                  <motion.div
                    key="transcription"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <div className="bg-[#F8FAFC] rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Video Transcription</h4>
                      <p className="text-gray-600 leading-relaxed italic">
                        Transcription will be available here once the video content is processed.
                      </p>
                      <p className="text-gray-500 text-sm mt-4">
                        This feature allows you to read along with the video content, making it easier to follow along and review key points.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      case 'mcq':
        return (
          <MCQPractice
            content={stepData.content}
            questions={stepData.questions}
            onComplete={() => handleStepComplete(stepLetter)}
            isCompleted={isStepCompleted}
          />
        );
      case 'flashcard':
        return (
          <FlashcardTask
            content={stepData.content}
            cards={stepData.cards}
            onComplete={() => handleStepComplete(stepLetter)}
            isCompleted={isStepCompleted}
          />
        );
      case 'advanced-mcq':
        return (
          <AdvancedPractice
            content={stepData.content}
            questions={stepData.questions}
            onComplete={() => handleStepComplete(stepLetter)}
            isCompleted={isStepCompleted}
          />
        );
      case 'case-study':
        return (
          <CaseStudy
            content={stepData.content}
            mcq={stepData.mcq}
            onComplete={() => handleStepComplete(stepLetter)}
            isCompleted={isStepCompleted}
          />
        );
      case 'notes':
        return (
          <Notes
            content={stepData.content}
            placeholder={stepData.placeholder}
            onComplete={() => handleStepComplete(stepLetter)}
            isCompleted={isStepCompleted}
            onNextLesson={handleNextLesson}
            showNextLesson={congratulationAcknowledged && stepLetter === '9'}
            courseId={courseId}
          />
        );
      default:
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {stepData.content}
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#00152E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3884]"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#00152E] flex items-center justify-center">
        <div className="text-center p-8">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#112b6b] dark:text-white mb-2">Course Not Found</h2>
          <p className="text-gray-500 mb-6">The course you are looking for could not be found.</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#1a3884] hover:bg-[#002147] text-white rounded-xl font-bold transition-all"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#00152E] transition-colors duration-500 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 dark:bg-blue-900/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 dark:bg-indigo-900/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />
      
      <div className="relative z-10">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button
                onClick={handleBack}
                className="group flex items-center gap-2 text-slate-500 hover:text-[#1a3884] transition-all duration-300 font-bold text-xs"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 group-hover:border-[#1a3884]/30 group-hover:bg-[#1a3884]/5 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span>Back to Overview</span>
              </button>
              <div className="h-5 w-px bg-slate-200 dark:bg-[#003170]" />
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-slate-100 text-[#1a3884] border-transparent font-bold px-3 py-0.5 text-[10px]">
                  {stage}
                </Badge>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                  {stageName}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Optional Header Right Content */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className={showIntro ? "flex justify-center" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
          {/* Left Column - Video and Content */}
          <div className={showIntro ? "max-w-3xl w-full" : "lg:col-span-2"}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Course Info Header - Only show if not in intro or show centered in intro */}
              {!showIntro && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400">{course.id}</span>
                    {isCompleted && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {course.title}
                  </h1>
                  <p className="text-sm text-slate-500">{course.subtitle}</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {showIntro ? (
                  <motion.div
                    key="intro-screen"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#1a3884]" />
                    
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-[#1a3884]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-7 h-7 text-[#1a3884]" />
                      </div>
                      <h1 className="text-2xl font-bold text-[#002147] mb-2">
                        {course.title}
                      </h1>
                      <p className="text-sm text-gray-500 font-medium">
                        {course.subtitle}
                      </p>
                    </div>

                    <div className="bg-[#F8FAFC] rounded-xl p-5 mb-6 border border-gray-200">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Course Details
                      </h3>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-400">Course ID</p>
                          <p className="text-sm font-bold text-[#002147]">{course.id}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-400">Type</p>
                          <p className="text-sm font-bold text-[#002147]">{type}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-400">Duration</p>
                          <p className="text-sm font-bold text-[#002147]">45 min</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {learningFlowData?.overview || course.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={handleStartCourse}
                        className="group flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#1a3884] to-[#112b6b] hover:from-[#112b6b] hover:to-[#002147] text-white rounded-2xl font-black text-sm transition-all duration-300 shadow-xl shadow-[#1a3884]/30 hover:shadow-[#1a3884]/40 transform hover:-translate-y-1 active:scale-95"
                      >
                        Start Learning Journey
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ) : !activeStep ? (
                  <motion.div
                    key="main-overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-center p-12">
                      <p className="text-gray-500">Please select a step from the learning flow to begin.</p>
                    </div>
                  </motion.div>
                ) : (
                  /* Active Step Content */
                  <motion.div
                    key="active-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/8 mb-6 shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#1a3884] flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {activeStep}
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl text-slate-900 dark:text-white leading-tight">
                            {learningFlowData?.steps[activeStep]?.title || `Step ${activeStep}`}
                          </h3>
                          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Active Session</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-[#F8FAFC] dark:bg-[#002A5C] rounded-xl text-xs font-bold text-slate-500 border border-slate-100 dark:border-white/10">
                        {learningFlowData?.steps[activeStep]?.duration || '5-10 min'}
                      </div>
                    </div>

                    {learningFlowData?.steps[activeStep] ? (
                      renderStepContent(learningFlowData.steps[activeStep], activeStep)
                    ) : (
                      <div className="p-8 text-center bg-[#F8FAFC] rounded-xl">
                        <Sparkles className="w-12 h-12 text-[#1a3884]/20 mx-auto mb-4" />
                        <h4 className="font-bold text-gray-400">Content Coming Soon</h4>
                        <p className="text-sm text-gray-400">Step {activeStep} content is being prepared.</p>
                        <button 
                          onClick={() => handleStepComplete(activeStep)}
                          className="mt-6 px-6 py-2 bg-[#1a3884] text-white rounded-lg font-bold"
                        >
                          Complete Step
                        </button>
                      </div>
                    )}
                    
                    {activeStep && activeStep !== '9' && (
                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={() => {
                            const nextStep = (parseInt(activeStep) + 1).toString();
                            handleStepComplete(activeStep);
                            setActiveStep(nextStep);
                            setVideoWatched(false);
                          }}
                          className="px-8 py-3.5 rounded-xl bg-[#1a3884] text-white font-bold text-sm transition-all duration-300 flex items-center gap-2 hover:bg-[#112b6b] shadow-md active:scale-95 group"
                        >
                          Continue
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}

                    {activeStep === '9' && congratulationAcknowledged && (
                      <button
                        onClick={handleNextLesson}
                        className="w-full px-6 py-5 bg-[#1a3884] hover:bg-[#002147] text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] mt-4"
                      >
                        Unlock Next Course
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {!showIntro && (
            <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Progress Card */}
              <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 border border-slate-200 dark:border-white/8 shadow-sm"
              >
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C] flex items-center justify-center border border-slate-200 dark:border-white/10">
                    <Target className="w-5 h-5 text-[#1a3884]" />
                  </div>
                  Progress
                </h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Content Progress</span>
                      <span className="text-[#1a3884]">
                        {Math.round((videoProgress / 100) * 100)}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-[#002A5C] rounded-full overflow-hidden border border-slate-200 dark:border-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(videoProgress / 100) * 100}%` }}
                        className="h-full bg-[#1a3884] rounded-full"
                        transition={{ type: "spring", bounce: 0, duration: 1 }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Steps Completed</span>
                      <span className="text-[#0D7377]">
                        {Object.keys(completedSteps).length}/9
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-[#002A5C] rounded-full overflow-hidden border border-slate-200 dark:border-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(Object.keys(completedSteps).length / 9) * 100}%` }}
                        className="h-full bg-[#0D7377] rounded-full"
                        transition={{ type: "spring", bounce: 0, duration: 1 }}
                      />
                    </div>
                  </div>

                  {isCompleted && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/50 mt-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-md">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-900 dark:text-green-400">Course Completed</p>
                        <p className="text-[10px] text-green-700 dark:text-green-500 font-medium">All steps validated</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              {/* Curriculum Flow Card */}
              <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 border border-slate-200 dark:border-white/8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C] flex items-center justify-center border border-slate-200 dark:border-white/10">
                      <PlayCircle className="w-5 h-5 text-[#1a3884]" />
                    </div>
                    Curriculum
                  </h3>
                  <div className="px-3 py-1 bg-slate-100 dark:bg-[#002A5C] rounded-lg text-xs font-bold text-slate-500">
                    {Object.keys(completedSteps).length}/9
                  </div>
                </div>
                
                <div className="space-y-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((step) => {
                    const status = getStepStatus(step);
                    const stepData = learningFlowData?.steps[step];
                    const isActive = activeStep === step;
                    
                    return (
                      <button
                        key={step}
                        disabled={status === 'locked'}
                        onClick={() => handleStepClick(step)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                          isActive
                            ? 'bg-[#1a3884] border-[#1a3884] text-white shadow-md'
                            : status === 'completed'
                            ? 'bg-[#F8FAFC] dark:bg-slate-800/50 border-slate-100 dark:border-white/8'
                            : status === 'locked'
                            ? 'opacity-40 cursor-not-allowed border-transparent'
                            : 'bg-white dark:bg-[#002147] border-slate-200 dark:border-white/8 hover:border-[#1a3884]/30'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 
                          status === 'completed' ? 'bg-green-100 text-green-600' : 
                          status === 'locked' ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : status === 'locked' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <span className="font-bold text-sm">{step}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 text-left min-w-0">
                          <h4 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                            {stepData?.title || 'Step ' + step}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                            <Clock size={12} className={isActive ? 'text-white/60' : 'text-slate-400'} />
                            <span className={isActive ? 'text-white/70' : ''}>
                              {stepData?.duration || '5-10 min'}
                            </span>
                          </div>
                        </div>

                        {status !== 'locked' && !isActive && (
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>


            </motion.div>
            </div>
          )}
        </div>
      </main>

      {/* Congratulation Modal */}
      <AnimatePresence>
        {showCongratulation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-200"
            >
              {/* Animated Trophy Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Congratulations Text */}
              <div className="text-center mb-6">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-[#002147] mb-2"
                >
                  Congratulations! 🎉
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600"
                >
                  You've completed all 9 learning steps for this lesson!
                </motion.p>
              </div>

              {/* Progress Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 mb-6 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">Your Progress</span>
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">9/9 Steps</span>
                </div>
                <div className="flex gap-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((step, idx) => (
                    <motion.div
                      key={step}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6 + idx * 0.05 }}
                      className="flex-1 h-2 bg-green-500 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>

              {/* Stars Animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex justify-center gap-2 mb-6"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.7 + star * 0.1, type: "spring", stiffness: 200 }}
                  >
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={handleNextLesson}
                className="w-full py-4 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Continue to Next Lesson
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      <FloatingDictionary />
      <FloatingNotes />
    </div>
  );
};

export default CoursePlayer;
