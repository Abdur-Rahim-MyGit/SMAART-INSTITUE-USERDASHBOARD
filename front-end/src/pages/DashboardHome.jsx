import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import VisionBoardSplash from "@/components/VisionBoardSplash";
import {
  Users, HeartPulse, Sparkles, ArrowUp,
  BookOpen, Award, CheckCircle2, Circle, Clock, Briefcase, MapPin, DollarSign, Globe, Zap, Shield, Check,
  Code, Database, Cloud
} from "lucide-react";
import useUser from "@/hooks/useUser";
import StudentOnboarding from "@/components/onboarding/StudentOnboarding";
import CollegeBanners from "@/components/CollegeBanners";

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [showVisionSplash, setShowVisionSplash] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('visionSplashShown');
    if (!hasSeenSplash) setShowVisionSplash(true);
  }, []);

  useEffect(() => {
    if (user && !userLoading) setDashboardLoading(false);
  }, [user, userLoading]);

  const handleVisionSplashComplete = () => {
    setShowVisionSplash(false);
    sessionStorage.setItem('visionSplashShown', 'true');
  };

  if (userLoading || dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2ED] dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1a3884] rounded-none animate-spin"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      {/* Vision Board Splash Overlay */}
      {showVisionSplash && (
        <VisionBoardSplash onComplete={handleVisionSplashComplete} duration={3000} />
      )}
      
      {/* Student Onboarding */}
      {!showVisionSplash && user && (
        <StudentOnboarding user={user} />
      )}

      <div className="space-y-6">

              {/* NEW HERO SECTION */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full bg-[#1a3884] py-5 px-6 rounded-none shadow-2xl text-center"
              >
                {/* Content */}
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-2xl md:text-4xl font-black text-white tracking-tight mb-3"
                  >
                    Welcome Back, {user?.firstName || user?.fullName?.split(' ')[0] || "User"}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-blue-100 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed"
                  >
                    Ready to take the next step in your career journey? Let's keep moving forward.
                  </motion.p>
              </motion.div>

              {/* DYNAMIC COLLEGE BANNERS SECTION */}
              <CollegeBanners />

              {/* CONSOLIDATED LEARNING SECTION */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
              >
                {/* 1. Continue Learning Bar */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                      <BookOpen className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Continue learning</h3>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight mt-0.5">Capability Building Program</h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="flex-1 md:w-48 lg:w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                      <div className="w-[75%] h-full bg-[#1a3884] dark:bg-blue-500 rounded-lg"></div>
                    </div>
                    <span className="text-xs font-semibold text-[#1a3884] dark:text-blue-400 whitespace-nowrap">75% Complete</span>
                    <button onClick={() => navigate('/dashboard/courses')} className="bg-[#1a3884] dark:bg-blue-600 hover:bg-[#112558] dark:hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm whitespace-nowrap">
                      Continue Learning
                    </button>
                  </div>
                </div>

                {/* 2. Path Cards Grid */}
                <div className="p-4 bg-slate-50/30 dark:bg-slate-800/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: 1,
                        title: 'Software Development',
                        subtitle: 'Certification: Python, Java',
                        progress: 60,
                        btnText: 'Continue Path',
                        icon: <Code className="w-5 h-5 text-[#1a3884]" />,
                        color: 'blue'
                      },
                      {
                        id: 2,
                        title: 'Data Analytics',
                        subtitle: 'Certification: Advanced SQL Queries',
                        progress: 40,
                        btnText: 'Continue Path',
                        icon: <Database className="w-5 h-5 text-indigo-600" />,
                        color: 'indigo'
                      },
                      {
                        id: 3,
                        title: 'Cloud Architecture',
                        subtitle: 'Session 1: Hosting Development Sprints',
                        progress: 20,
                        btnText: 'Continue Path',
                        icon: <Cloud className="w-5 h-5 text-amber-600" />,
                        color: 'amber'
                      }
                    ].map((path) => (
                      <div
                        key={path.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm group hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            {path.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{path.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{path.subtitle}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => window.open('http://localhost:5173/', '_blank')}
                          className="w-full bg-[#1a3884] hover:bg-[#112558] text-white py-2.5 rounded-lg text-sm font-semibold transition-all"
                        >
                           {path.btnText}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-col gap-4">
                   <motion.div
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                     className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm"
                   >
                      <h3 className="font-semibold text-sm mb-3 text-slate-900 dark:text-white">Events & Community</h3>
                      <div className="flex flex-col gap-2">
                         <button onClick={() => navigate('/community')} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition rounded-lg border border-slate-100 dark:border-slate-700 group">
                            <div className="w-9 h-9 rounded-lg bg-[#1a3884]/10 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-[#1a3884]/20 dark:group-hover:bg-blue-900/50 transition">
                               <Users className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                            </div>
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-200 flex-1 text-left">Community Feed</span>
                         </button>

                         <button onClick={() => navigate('/my-courses')} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition rounded-lg border border-slate-100 dark:border-slate-700 group">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition">
                               <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-200 flex-1 text-left">Concept Checks</span>
                         </button>

                         <button onClick={() => navigate('/mind-care')} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition rounded-lg border border-slate-100 dark:border-slate-700 group">
                            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition">
                               <HeartPulse className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                            </div>
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-200 flex-1 text-left">Mind Care</span>
                         </button>
                      </div>
                   </motion.div>

                   {/* Optional Info Cards */}
                   <motion.div
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                     className="grid grid-cols-1 gap-3"
                   >
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition cursor-pointer group">
                         <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition">
                            <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                         </div>
                         <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">Location Intelligence</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tech hubs matching your skills</div>
                         </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition cursor-pointer group">
                         <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition">
                            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                         </div>
                         <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">Salary Intelligence</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Market value projection</div>
                         </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition cursor-pointer group">
                         <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition">
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                         </div>
                         <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">English Level</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Professional Working</div>
                         </div>
                      </div>
                   </motion.div>
                </div>

              {/* BOTTOM STRIP: Tools & Utilities (Kept from old design to maintain functionality) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                 <motion.button 
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}
                   onClick={() => navigate('/smaart-wallet')}
                   className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-[#C0C0C0] dark:border-slate-800 rounded-none px-6 py-3 shadow-sm hover:shadow-md transition"
                 >
                    <span className="font-bold text-sm text-[#1a3884] dark:text-white">Wallet & Badges</span>
                    <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                       <Award className="w-4 h-4 text-[#C0C0C0]" />
                       <Shield className="w-4 h-4 text-[#C0C0C0]" />
                       <Sparkles className="w-4 h-4 text-[#C0C0C0]" />
                    </div>
                 </motion.button>

                 <div className="flex items-center gap-4">
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }}
                      onClick={() => navigate('/smaart-toolkit')}
                      className="bg-white dark:bg-slate-900 border border-[#C0C0C0] dark:border-slate-800 rounded-none px-6 py-3 font-bold text-sm text-[#1a3884] dark:text-white shadow-sm hover:shadow-md transition"
                    >
                       Quick Access Toolkit
                    </motion.button>
                    
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.0 }}
                      className="w-12 h-12 bg-[#1a3884] text-white rounded-none flex items-center justify-center shadow-lg hover:bg-[#112558] transition"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                       <ArrowUp className="w-5 h-5" />
                    </motion.button>
                 </div>
              </div>

      </div>
    </PageTransition>
  );
};

export default DashboardHome;


