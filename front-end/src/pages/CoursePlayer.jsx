import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Clock, Target, CheckCircle2, Lock, ChevronRight, ChevronDown, PlayCircle, FileText, Volume2, Sparkles, Trophy, Star } from "lucide-react";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import MCQPractice from "@/components/MCQPractice";
import FlashcardTask from "@/components/FlashcardTask";
import AdvancedPractice from "@/components/AdvancedPractice";
import CaseStudy from "@/components/CaseStudy";
import Notes from "@/components/Notes";
import FloatingDictionary from "@/components/FloatingDictionary";
import { STAGE_1_COURSES, STAGE_2_COURSES, STAGE_3_COURSES, PIQ_TRACK, AIQ_TRACK, SQ_TRACK } from "@/data/courseStructureData";
import { getLearningFlowData } from "@/data/learningFlowData";
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
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {stepData.content}
              </p>
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
            showNextLesson={congratulationAcknowledged && stepNumber === '9'}
            courseId={courseId}
          />
        );
      default:
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
              {stepData.content}
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#002147] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3884]"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#002147] flex items-center justify-center">
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
    <div className="min-h-screen bg-white dark:bg-[#002147] text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-white dark:bg-[#002147] border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-500 hover:text-[#1a3884] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Courses</span>
            </button>
            <div className="h-6 w-px bg-gray-200 dark:border-gray-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#1a3884]">
                {stage}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {stageName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className={showIntro ? "flex justify-center" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
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
                    <span className="text-xs font-mono text-gray-400">{course.id}</span>
                    {isCompleted && (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-[#112b6b] dark:text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                    {course.title}
                  </h1>
                  <p className="text-gray-500">{course.subtitle}</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {showIntro ? (
                  <motion.div
                    key="intro-screen"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#1a3884]" />
                    
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-[#1a3884]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-7 h-7 text-[#1a3884]" />
                      </div>
                      <h1 className="text-2xl font-bold text-[#112b6b] dark:text-white mb-2">
                        {course.title}
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {course.subtitle}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Course Details
                      </h3>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-400">Course ID</p>
                          <p className="text-sm font-bold text-[#112b6b] dark:text-white">{course.id}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-400">Type</p>
                          <p className="text-sm font-bold text-[#112b6b] dark:text-white">{type}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-400">Duration</p>
                          <p className="text-sm font-bold text-[#112b6b] dark:text-white">45 min</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                          {learningFlowData?.overview || course.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={handleStartCourse}
                        className="group flex items-center gap-2 px-8 py-3 bg-[#1a3884] hover:bg-[#002147] text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      >
                        Start Learning Journey
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 mb-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1a3884] flex items-center justify-center text-white font-bold">
                          {activeStep}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#112b6b] dark:text-white">
                            {learningFlowData?.steps[activeStep]?.title || `Step ${activeStep}`}
                          </h3>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-500">
                        {learningFlowData?.steps[activeStep]?.duration || '5-10 min'}
                      </div>
                    </div>

                    {learningFlowData?.steps[activeStep] ? (
                      renderStepContent(learningFlowData.steps[activeStep], activeStep)
                    ) : (
                      <div className="p-8 text-center bg-gray-50 dark:bg-slate-900/50 rounded-xl">
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
                          disabled={false}
                          onClick={() => {
                            const nextStep = (parseInt(activeStep) + 1).toString();
                            handleStepComplete(activeStep);
                            setActiveStep(nextStep);
                            setVideoWatched(false);
                          }}
                          className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${
                            (learningFlowData?.steps[activeStep]?.videoUrl && !videoWatched) ||
                            (learningFlowData?.steps[activeStep]?.contentType !== 'video-text' && !completedSteps[activeStep])
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                              : 'bg-gradient-to-r from-[#1a3884] to-[#0D7377] text-white hover:shadow-xl transform hover:scale-[1.02]'
                          }`}
                        >
                          Continue to Next Step
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {activeStep === '9' && congratulationAcknowledged && (
                      <button
                        onClick={handleNextLesson}
                        className="w-full px-6 py-4 bg-gradient-to-r from-[#1a3884] to-[#0D7377] hover:from-[#002147] hover:to-[#0a5a5e] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] mt-4"
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
                style={{
                  boxShadow: '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <h3 className="text-lg font-bold text-[#112b6b] dark:text-white mb-4">Your Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Video Progress</span>
                      <span className="font-semibold text-[#112b6b] dark:text-white">
                        {Math.round((videoProgress / 100) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1a3884] rounded-full transition-all duration-300"
                        style={{ width: `${(videoProgress / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Learning Flow</span>
                      <span className="font-semibold text-[#112b6b] dark:text-white">
                        {Object.keys(completedSteps).length}/9
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0D7377] rounded-full transition-all duration-300"
                        style={{ width: `${(Object.keys(completedSteps).length / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Course Completed!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Learning Flow Steps */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
                style={{
                  boxShadow: '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <h3 className="text-lg font-bold text-[#112b6b] dark:text-white mb-4 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-[#1a3884]" />
                  Learning Flow
                </h3>
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
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-[#1a3884] text-white shadow-lg'
                            : status === 'completed'
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : status === 'locked'
                            ? 'bg-gray-50 dark:bg-slate-900/10 opacity-50 cursor-not-allowed grayscale'
                            : 'bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-100 dark:border-gray-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-white/20' : 
                          status === 'completed' ? 'bg-green-500' : 
                          status === 'locked' ? 'bg-gray-200' : 'bg-[#1a3884]/10'
                        }`}>
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : status === 'locked' ? (
                            <Lock className="w-3 h-3 text-gray-400" />
                          ) : (
                            <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-[#1a3884]'}`}>{step}</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className={`font-semibold text-sm ${isActive ? 'text-white' : status === 'completed' ? 'text-green-700 dark:text-green-300' : 'text-[#112b6b] dark:text-white'}`}>
                            {stepData?.title || 'Step ' + step}
                          </h4>
                          <p className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                            {stepData?.subtitle || ''}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'} transition-transform ${isActive ? 'rotate-90' : ''}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
            </div>
          )}
        </div>
      </div>

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
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700"
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
                  className="text-3xl font-bold text-[#112b6b] dark:text-white mb-2"
                >
                  Congratulations! 🎉
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 dark:text-gray-300"
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
                className="w-full py-4 bg-gradient-to-r from-[#1a3884] to-[#0D7377] hover:from-[#002147] hover:to-[#0a5a5e] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Continue to Next Lesson
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <FloatingDictionary />
    </div>
  );
};

export default CoursePlayer;
