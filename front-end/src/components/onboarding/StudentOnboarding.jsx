import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronRight, ChevronLeft, CheckCircle2, 
  Home, BookOpen, Brain, MessageSquare, User, HelpCircle, 
  Sparkles, Award, Zap, Wallet, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";

const StudentOnboarding = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7; // Updated to 7 to match steps array length

  useEffect(() => {
    if (!user?.email) return;
    
    const hasSeenOnboarding = localStorage.getItem(`hasSeenStudentOnboarding_${user.email}`);
    if (!hasSeenOnboarding) {
      // Small delay if needed, but since it mounts after splash it can show faster
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = () => {
    if (user?.email) {
      localStorage.setItem(`hasSeenStudentOnboarding_${user.email}`, "true");
    }
    setIsOpen(false);
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to SMAART Institute!",
      description: "Complete setup in 2 mins → Unlock courses. Your personalized academic journey starts here with tools designed for excellence.",
      icon: Sparkles,
      color: "from-[#1a3884] to-[#1a3884]",
      content: (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a3884] shadow-inner border border-blue-100">
            <Sparkles size={40} className="animate-pulse" />
          </div>
          <p className="text-slate-600 font-medium">Empowering you with AI-driven insights and professional roadmaps to achieve your career goals.</p>
        </div>
      )
    },
    {
      title: "Dashboard Overview",
      description: "Your progress, scores, next steps. This central hub provides a comprehensive snapshot of your academic performance and clarifies your immediate priorities.",
      icon: Home,
      color: "from-[#1a3884] to-[#1a3884]",
      content: (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center gap-4">
           <div className="p-3 bg-white rounded-lg shadow-md border border-[#1a3884]/10 text-[#1a3884]">
             <Home className="w-8 h-8" />
           </div>
           <p className="text-sm text-slate-600 text-center">Monitor your 'Level' progression and see exactly which skills are placing you closer to your target career roles.</p>
        </div>
      )
    },
    {
      title: "Courses & Roadmap",
      description: "10 modules + roadmap. Navigate through our structured learning path with curated modules that build your expertise from the ground up.",
      icon: BookOpen,
      color: "from-[#1a3884] to-[#1a3884]",
      content: (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center gap-4">
           <div className="p-3 bg-white rounded-lg shadow-md border border-[#1a3884]/10 text-[#1a3884]">
             <BookOpen className="w-8 h-8" />
           </div>
           <p className="text-sm text-slate-600 text-center">Follow the visual career roadmap to ensure you're developing the specific competencies that employers value most today.</p>
        </div>
      )
    },
    {
      title: "SMAART Toolkit",
      description: "Professional tools at your fingertips. Access a curated collection of resources including resume builder, dictionary, library, and wellness tools.",
      icon: Lightbulb,
      color: "from-[#1a3884] to-[#1a3884]",
      content: (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center gap-4">
           <div className="p-3 bg-white rounded-lg shadow-md border border-[#1a3884]/10 text-[#1a3884]">
             <Lightbulb className="w-8 h-8" />
           </div>
           <p className="text-sm text-slate-600 text-center">Explore our toolkit to enhance your learning experience with specialized resources designed for your success.</p>
        </div>
      )
    },
    {
      title: "Your Profile",
      description: "Settings + certificates. Access your official documents, manage your personal credentials, and configure your learning preferences in one secure place.",
      icon: User,
      color: "from-[#1a3884] to-[#1a3884]",
      content: (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center gap-4">
           <div className="p-3 bg-white rounded-lg shadow-md border border-[#1a3884]/10 text-[#1a3884]">
             <User className="w-8 h-8" />
           </div>
           <p className="text-sm text-slate-600 text-center">Your profile keeps track of your verified achievements and certifications, ready to be showcased to future employers.</p>
        </div>
      )
    },
    {
      title: "Help & Support",
      description: "Support + resources. Our comprehensive support system ensures you never feel stuck, providing quick access to technical aid and platform guides.",
      icon: HelpCircle,
      color: "from-[#1a3884] to-[#1a3884]",
      content: (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col items-center gap-4">
           <div className="p-3 bg-white rounded-lg shadow-md border border-[#1a3884]/10 text-[#1a3884]">
             <HelpCircle className="w-8 h-8" />
           </div>
           <p className="text-sm text-slate-600 text-center">Reach out to our support team or explore the SMAART Toolkit for a collection of specialized resources to enhance your experience.</p>
        </div>
      )
    },
    {
      title: "Setup Complete!",
      description: "You're all set to begin. Your dashboard is now unlocked and ready for exploration. Let's start building your future.",
      icon: CheckCircle2,
      color: "from-[#1a3884] to-[#1a3884]",
      content: (
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-[#1a3884] shadow-lg border-4 border-white">
            <CheckCircle2 size={50} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Registration Fully Validated</h4>
            <p className="text-slate-500 text-sm">Redirecting you to your personalized dashboard...</p>
          </div>
        </div>
      )
    }
  ];

  const currentData = steps[currentStep - 1] || steps[0];
  const Icon = currentData.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_20px_rgba(192,192,192,0.4)] overflow-hidden border-4 border-[#C0C0C0] ring-1 ring-[#C0C0C0]/50"
        >
          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 flex">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-full transition-all duration-500 ${idx + 1 <= currentStep ? 'bg-[#1a3884]' : 'bg-transparent'}`}
                style={{ width: `${100 / totalSteps}%` }}
              />
            ))}
          </div>

          <button 
            onClick={skipOnboarding}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-20 p-2"
          >
            <X size={20} />
          </button>

          {/* Header Gradient */}
          <div className={`h-32 bg-gradient-to-br ${currentData.color} flex items-center justify-center p-6 relative overflow-hidden`}>
             <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-24 h-24 border-t border-l border-white rounded-tl-3xl" />
                <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-r border-white rounded-br-3xl" />
             </div>
             <motion.div
               key={currentStep}
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-white"
             >
               <Icon size={40} />
             </motion.div>
          </div>

          <div className="p-8 pt-6">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-blue-50 text-[#1a3884] text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
                Step {currentStep} of {totalSteps}
              </span>
              <h2 className="text-2xl font-sans font-extrabold text-[#1a3884] mb-3">
                {currentData.title}
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                {currentData.description}
              </p>
            </div>

            <motion.div
              key={`content-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-10"
            >
              {currentData.content}
            </motion.div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 w-full">
                {currentStep > 1 && (
                  <Button
                    onClick={handlePrev}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                  >
                    <ChevronLeft size={18} className="mr-2" /> Previous
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  className={`flex-[2] h-12 rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${
                    currentStep === totalSteps ? 'bg-[#1a3884] hover:bg-[#2349a8]' : 'bg-[#1a3884] hover:bg-[#2349a8]'
                  }`}
                >
                  {currentStep === totalSteps ? (
                    <>Get Started <CheckCircle2 size={18} className="ml-2" /></>
                  ) : (
                    <>Next Step <ChevronRight size={18} className="ml-2" /></>
                  )}
                </Button>
              </div>

              <button 
                onClick={skipOnboarding}
                className="text-xs font-bold text-slate-400 hover:text-[#1a3884] transition-colors"
              >
                Skip intro and go to Dashboard
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 pb-6">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx + 1 === currentStep ? 'w-4 bg-[#1a3884]' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudentOnboarding;

