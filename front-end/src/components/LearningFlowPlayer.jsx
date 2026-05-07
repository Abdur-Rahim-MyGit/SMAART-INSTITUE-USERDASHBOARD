import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  CheckCircle2, 
  Circle, 
  Lock, 
  ChevronRight,
  Video,
  BookOpen,
  FileText,
  RotateCcw,
  Lightbulb,
  Target,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Award
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import MCQPractice from "@/components/MCQPractice";
import FlashcardTask from "@/components/FlashcardTask";
import AdvancedPractice from "@/components/AdvancedPractice";
import CaseStudy from "@/components/CaseStudy";
import Notes from "@/components/Notes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FloatingDictionary from "@/components/FloatingDictionary";

const LearningFlowPlayer = ({ 
  courseData, 
  learningFlow,
  selectedModule, 
  selectedDay, 
  onBack,
  videoCompletionMap,
  onVideoProgressUpdate
}) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState('A');
  const [completedSteps, setCompletedSteps] = useState({});

  const steps = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const stepMetadata = {
    A: { icon: Video, title: "Why", color: "bg-blue-500" },
    B: { icon: Video, title: "Story", color: "bg-indigo-500" },
    C: { icon: Video, title: "Framework", color: "bg-purple-500" },
    D: { icon: Lightbulb, title: "Practice", color: "bg-amber-500" },
    E: { icon: RotateCcw, title: "Flash Cards", color: "bg-orange-500" },
    F: { icon: Target, title: "Advanced", color: "bg-rose-500" },
    G: { icon: BookOpen, title: "Case Study", color: "bg-emerald-500" },
    H: { icon: FileText, title: "Notes", color: "bg-slate-500" }
  };

  const currentStepData = learningFlow?.steps?.[activeStep];

  // Load completion status from parent's map
  useEffect(() => {
    const newCompleted = {};
    steps.forEach(step => {
      const key = `${selectedModule}-${selectedDay}-${step}`;
      if (videoCompletionMap[key]) {
        newCompleted[step] = true;
      }
    });
    setCompletedSteps(newCompleted);

    // Auto-select first incomplete step
    const firstIncomplete = steps.find(step => !videoCompletionMap[`${selectedModule}-${selectedDay}-${step}`]);
    if (firstIncomplete) {
      setActiveStep(firstIncomplete);
    }
  }, [selectedModule, selectedDay, videoCompletionMap]);

  const handleStepComplete = (step) => {
    setCompletedSteps(prev => ({ ...prev, [step]: true }));
    if (onVideoProgressUpdate) {
      // For non-video steps, we mark as 100% complete
      onVideoProgressUpdate(selectedModule, selectedDay, step, 100, true, 100);
    }
    // No auto-advance, user must click 'Continue'
  };

  const isStepUnlocked = (step) => {
    // Making all steps unlocked as per user request for direct navigation
    return true;
  };

  const renderStepContent = () => {
    if (!currentStepData) return null;

    switch (activeStep) {
      case 'A':
      case 'B':
      case 'C':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <CustomVideoPlayer
                videoUrl={currentStepData.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                title={`${activeStep}: ${currentStepData.title}`}
                onProgressUpdate={(time, completed, duration) => {
                  if (completed) handleStepComplete(activeStep);
                  if (onVideoProgressUpdate) {
                    onVideoProgressUpdate(selectedModule, selectedDay, activeStep, time, completed, duration);
                  }
                }}
                onNext={() => {
                  if (!isLastStep) {
                    setActiveStep(nextStep);
                    document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                nextLabel={`Continue to ${nextStep ? stepMetadata[nextStep].title : 'Next'}`}
                initialCompleted={completedSteps[activeStep]}
              />
            </div>
            <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Context & Learning Goals
                </h3>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                    {currentStepData.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'D':
        return (
          <MCQPractice 
            content={currentStepData.content} 
            questions={currentStepData.questions}
            onComplete={() => handleStepComplete('D')}
            isCompleted={completedSteps['D']}
          />
        );
      case 'E':
        return (
          <FlashcardTask 
            content={{ title: currentStepData.title }} 
            cards={currentStepData.cards}
            onComplete={() => handleStepComplete('E')}
            isCompleted={completedSteps['E']}
          />
        );
      case 'F':
        return (
          <AdvancedPractice 
            content={currentStepData.content} 
            questions={currentStepData.questions}
            onComplete={() => handleStepComplete('F')}
            isCompleted={completedSteps['F']}
          />
        );
      case 'G':
        return (
          <CaseStudy 
            content={currentStepData.content} 
            mcq={currentStepData.mcq}
            onComplete={() => handleStepComplete('G')}
            isCompleted={completedSteps['G']}
          />
        );
      case 'H':
        return (
          <Notes 
            content={currentStepData.content} 
            placeholder={currentStepData.placeholder}
            onComplete={() => handleStepComplete('H')}
            isCompleted={completedSteps['H']}
            courseId={selectedModule}
          />
        );
      default:
        return null;
    }
  };

  const currentStepIndex = steps.indexOf(activeStep);
  const nextStep = steps[currentStepIndex + 1];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isCurrentStepCompleted = completedSteps[activeStep];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8fafc] dark:bg-[#020617] relative">
      {/* Background Decorative Blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#1a3884]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[5%] w-[30%] h-[50%] bg-[#C0C0C0]/5 rounded-full blur-[130px]" />
      </div>
      {/* Left Sidebar - Learning Path */}
      <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="mb-4 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {learningFlow?.title || "Learning Flow"}
            </h2>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              Step {steps.indexOf(activeStep) + 1} of 8
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {steps.map((step, idx) => {
            const meta = stepMetadata[step];
            const isActive = activeStep === step;
            const isCompleted = completedSteps[step];
            const isUnlocked = isStepUnlocked(step);

            return (
              <button
                key={step}
                onClick={() => isUnlocked && setActiveStep(step)}
                disabled={!isUnlocked}
                className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-300 group ${
                  isActive 
                    ? 'bg-white shadow-md border border-[#1a3884]/10 ring-1 ring-[#1a3884]/5' 
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? 'bg-green-500' : isActive ? meta.color : 'bg-slate-200 dark:bg-slate-800'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <meta.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  )}
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-bold truncate ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {step}. {meta.title}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {isCompleted ? 'Completed' : 'Available'}
                  </p>
                </div>

                {isUnlocked && !isCompleted && !isActive && (
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500">OVERALL PROGRESS</span>
            <span className="text-xs font-bold text-indigo-600">
              {Math.round((Object.keys(completedSteps).length / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(Object.keys(completedSteps).length / steps.length) * 100}%` }}
              className="h-full bg-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200">
              Step {steps.indexOf(activeStep) + 1}
            </Badge>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {stepMetadata[activeStep].title}: {currentStepData?.subtitle || currentStepData?.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Header just shows progress now, navigation is in the content */}
             <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course Progress</span>
               <div className="flex items-center gap-2">
                 <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500 transition-all duration-500" 
                     style={{ width: `${(Object.keys(completedSteps).length / steps.length) * 100}%` }}
                   />
                 </div>
                 <span className="text-xs font-bold text-indigo-600">
                   {Math.round((Object.keys(completedSteps).length / steps.length) * 100)}%
                 </span>
               </div>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {renderStepContent()}

                {/* Navigation Action Area */}
                  <div className="mt-12 mb-8 flex flex-col items-center w-full">
                    {/* Progress Indicator Card */}
                    <div className="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-white/5 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20 text-center mb-8 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#1a3884] to-transparent opacity-50" />
                      
                      {isCurrentStepCompleted ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-4">
                          <CheckCircle2 size={12} /> Step Validated
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-4">
                          <Play size={12} /> Step in Progress
                        </div>
                      )}

                      <h3 className="text-2xl font-black text-[#112b6b] dark:text-white mb-2">
                        {isLastStep ? "Module Concluded" : `Continue your journey`}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-sm mx-auto">
                        {isLastStep 
                          ? "You have successfully navigated through all stages of this module." 
                          : `Ready to explore "${nextStep ? stepMetadata[nextStep].title : ''}"?`}
                      </p>

                      <Button
                        onClick={() => {
                          if (isLastStep) {
                            // Milestone Course Logic
                            const courseIdStr = String(courseData?.courseCode || courseData?.id || "");
                            if (courseIdStr.includes("S10")) {
                              navigate("/assessment/T2");
                            } else if (courseIdStr.includes("S19")) {
                              navigate("/assessment/T3");
                            } else if (courseIdStr.includes("S25")) {
                              navigate("/assessment/T4");
                            } else {
                              onBack();
                            }
                          } else {
                            setActiveStep(nextStep);
                            // Scroll to top of content
                            document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={`w-full py-8 text-lg font-black rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                          isLastStep 
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                            : 'bg-[#1a3884] hover:bg-[#112b6b] shadow-[#1a3884]/20'
                        }`}
                      >
                        {isLastStep ? (
                          <>
                            {String(courseData?.courseCode || courseData?.id || "").includes("S10") || 
                             String(courseData?.courseCode || courseData?.id || "").includes("S19") || 
                             String(courseData?.courseCode || courseData?.id || "").includes("S25") ? (
                              <>Take Stage Assessment <Trophy className="ml-2 w-6 h-6" /></>
                            ) : (
                              <>Complete Lesson <CheckCircle2 className="ml-2 w-6 h-6" /></>
                            )}
                          </>
                        ) : (
                          <>Continue to {stepMetadata[nextStep].title} <ArrowRight className="ml-2 w-6 h-6" /></>
                        )}
                      </Button>
                    </div>
                  </div>
              </motion.div>
            </AnimatePresence>

            {/* Optional Supplementary Materials */}
            {learningFlow?.supplementary && (
              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  Supplementary Materials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learningFlow.supplementary.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                          {item.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {item.type} Resource
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <FloatingDictionary />
    </div>
  );
};

export default LearningFlowPlayer;
