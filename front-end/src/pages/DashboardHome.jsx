import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import PageTransition from "@/components/PageTransition";
import VisionBoardSplash from "@/components/VisionBoardSplash";
import {
  Users, HeartPulse, Sparkles, ArrowUp,
  BookOpen, Award, CheckCircle2, Circle, Clock, Briefcase, MapPin, DollarSign, Globe, Zap, Shield, Check
} from "lucide-react";
import useUser from "@/hooks/useUser";
import StudentOnboarding from "@/components/onboarding/StudentOnboarding";

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
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1a3884] rounded-full animate-spin"></div>
      </div>
    );
  }

  const bgMain = "bg-[#F5F2ED] dark:bg-[#0B1120]";

  return (
    <>
      {showVisionSplash && (
        <VisionBoardSplash onComplete={handleVisionSplashComplete} duration={3000} />
      )}
      
      {!showVisionSplash && user && (
        <StudentOnboarding user={user} />
      )}

      <div className={`h-screen flex flex-col ${bgMain} font-sans transition-colors duration-300 text-slate-800 overflow-hidden`}>
        <DashboardSidebar />

        <div className="flex-1 overflow-y-auto transition-all duration-300">
          <DashboardHeader />

          <main className="p-3 md:p-5 lg:p-6 pb-20 lg:pb-6">
            <PageTransition>
            <div className="max-w-[1600px] mx-auto space-y-4">


              <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between"
              >
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                        <BookOpen className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                     </div>
                     <div>
                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Continue learning</h3>
                        <h2 className="text-base font-bold font-serif leading-tight text-[#1a3884] dark:text-white">Level 3: Management Basics</h2>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 lg:w-32 h-1 bg-blue-50 dark:bg-slate-800 rounded-full overflow-hidden border border-blue-100 dark:border-slate-700">
                           <div className="w-[75%] h-full bg-[#1a3884] dark:bg-blue-500 rounded-full"></div>
                        </div>
                        <span className="text-[10px] font-bold text-[#1a3884] dark:text-blue-300">75%</span>
                     </div>
                     <button onClick={() => navigate('/dashboard/courses')} className="bg-[#1a3884] dark:bg-blue-600 hover:bg-[#112558] dark:hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold transition shadow-sm">
                        Resume
                     </button>
                  </div>
              </motion.div>

              {/* TOP ROW: Career Direction & Skills by Tier */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Career Direction Hero (Span 8) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                     <h2 className="text-xl font-serif font-bold text-[#1a3884] dark:text-white">Career Direction</h2>
                     <button className="text-xs font-semibold text-[#1a3884] dark:text-blue-400 hover:text-[#C9A45B] transition">View Evidence</button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                     <div>
                       <div className="text-2xl font-bold text-slate-800 dark:text-white">12</div>
                       <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Cluster Roles</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-slate-800 dark:text-white">45</div>
                       <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Unique Skills</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-slate-800 dark:text-white">120</div>
                       <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Days on Platform</div>
                     </div>
                  </div>
                  
                  <div className="mb-4">
                     <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                       <span>14 of 45 skills developed (8 verified, 6 self-declared)</span>
                     </div>
                     <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                        <div className="h-full bg-green-600 dark:bg-green-500" style={{ width: '25%' }} title="Verified"></div>
                        <div className="h-full bg-green-300 dark:bg-green-400" style={{ width: '20%' }} title="Self-Declared"></div>
                     </div>
                     <button className="text-[9px] font-bold text-[#1a3884] dark:text-blue-400 opacity-80 hover:opacity-100 transition mt-1.5">
                        Add evidence to strengthen your profile
                     </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-auto">
                     {/* Role Eligibility Cards */}
                     {[
                       { role: 'Software Engineer', salary: '$80k-$100k', ai: 'High', away: '2 skills away' },
                       { role: 'Data Analyst', salary: '$70k-$90k', ai: 'Med', away: 'Eligible' },
                       { role: 'UX Designer', salary: '$75k-$95k', ai: 'Low', away: '1 skill away' },
                       { role: 'Product Manager', salary: '$90k-$120k', ai: 'High', away: '3 skills away' }
                     ].map((role, idx) => (
                       <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl flex flex-col gap-2 hover:shadow-md transition cursor-pointer">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                <Briefcase className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                             </div>
                             <div>
                               <div className="font-bold text-xs leading-tight text-slate-800 dark:text-slate-200">{role.role}</div>
                               <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{role.salary}</div>
                             </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                              <div className="h-full bg-green-500" style={{ width: role.away === 'Eligible' ? '100%' : '60%' }}></div>
                              {role.away !== 'Eligible' && <div className="h-full bg-green-300" style={{ width: '20%' }}></div>}
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold">
                             <span className="px-2 py-1 bg-[#1a3884]/10 dark:bg-blue-900/40 text-[#1a3884] dark:text-blue-300 rounded-md">AI: {role.ai}</span>
                             <span className={`${role.away === 'Eligible' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {role.away === 'Eligible' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                                {role.away}
                             </span>
                          </div>
                       </div>
                     ))}
                  </div>
                </motion.div>

                {/* Skills by Tier (Span 4) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col"
                >
                  <h2 className="text-base font-serif font-bold text-[#1a3884] dark:text-white mb-2">Skills by Tier</h2>
                  
                  <div className="flex-1 space-y-3">
                     <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                           Tier 1: Foundational
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/20 hover:bg-green-50 dark:hover:bg-green-900/40 transition cursor-pointer">
                           <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Basic Excel</span>
                           </div>
                           <span className="text-[11px] font-bold px-2 py-1 bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-md">4 roles</span>
                        </div>
                     </div>

                     <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                           Tier 2: Intermediate
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition cursor-pointer">
                           <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">SQL Basics</span>
                           </div>
                           <span className="text-[11px] font-bold px-2 py-1 bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded-md">2 roles</span>
                        </div>
                     </div>

                     <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                           Tier 3: Advanced
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
                           <div className="flex items-center gap-3">
                              <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Advanced Python</span>
                           </div>
                           <span className="text-[11px] font-bold px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md">1 role</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                     <button className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1a3884] dark:text-blue-400 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm">Job Application</button>
                     <button className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1a3884] dark:text-blue-400 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm">Interview Prep</button>
                  </div>
                </motion.div>
              </div>

              {/* MIDDLE ROW: Next Best Skill, Learning Path, Apply & Tracking */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Col 1-4: Next Best Skill & Apply Your Skills */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                     className="bg-[#12265A] text-white rounded-2xl p-4 shadow-lg relative overflow-hidden flex flex-col"
                   >
                      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                      <div className="z-10 flex flex-col items-start text-left">
                         <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                            <Zap className="w-4 h-4 text-[#DEBA6F]" fill="none" strokeWidth={2} />
                         </div>
                         <h3 className="font-bold text-[9px] text-white uppercase tracking-[0.2em] mb-1.5">Next Best Skill</h3>
                         <h2 className="text-xl font-extrabold font-serif mb-2 leading-none tracking-tight text-white">Python Programming</h2>
                         <p className="text-[13px] text-white/90 leading-relaxed max-w-[95%] mb-4">
                            Completing this makes you eligible for 1 more role. (Coursera, ~40 hrs)
                         </p>
                         <button className="bg-[#C5A059] text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-[#b08f4c] transition shadow-md">
                            Start Learning
                         </button>
                      </div>
                   </motion.div>

                   <motion.div 
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                     className="bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1"
                   >
                      <div className="flex justify-between items-center mb-3">
                         <h3 className="font-bold text-base font-serif text-[#1a3884] dark:text-white">Apply Your Skills</h3>
                         <ArrowUp className="w-4 h-4 rotate-45 text-slate-400" />
                      </div>
                      <div className="space-y-3">
                         <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition cursor-pointer group">
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition">Frontend Internship</div>
                            <div className="flex gap-1.5 mb-1.5">
                               <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                               <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                               <Circle className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold bg-white dark:bg-slate-800 px-2 py-1 rounded-lg inline-block border border-slate-100 dark:border-slate-700">Timing: Ready in 2w</div>
                         </div>
                         <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition cursor-pointer group">
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition">Open Source Project</div>
                            <div className="flex gap-1.5 mb-1.5">
                               <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                               <Circle className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold bg-white dark:bg-slate-800 px-2 py-1 rounded-lg inline-block border border-slate-100 dark:border-slate-700">Timing: Now</div>
                         </div>
                      </div>
                   </motion.div>
                 </div>

                {/* Col 5-9: Learning Path */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col h-full"
                >
                   <h2 className="text-base font-serif font-bold text-[#1a3884] dark:text-white mb-2">Learning Path</h2>
                   
                   <div className="flex-1 space-y-3">
                      {/* 5a Your Skill Dev Path */}
                      <div>
                         <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">1. Your Skill Development Path</h3>
                         <div className="bg-[#F8F9FA] dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:border-[#1a3884]/30 dark:hover:border-blue-500/50 transition">
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                  <div className="flex items-center gap-3 mb-2">
                                     <span className="w-5 h-5 bg-[#1a3884] text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
                                     <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Python Programming</span>
                                  </div>
                                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Unlocks <span className="text-[#1a3884] dark:text-blue-400 font-bold">2 roles</span> • High priority</div>
                               </div>
                               <button className="text-xs font-bold bg-[#1a3884] text-white px-4 py-2 rounded-xl hover:bg-[#112558] transition shadow-sm">Mark Complete</button>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 inline-flex items-center gap-2">
                               <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Free course: Codecademy (20h)
                            </div>
                         </div>
                      </div>

                      {/* 5b Free Company Training */}
                      <div>
                         <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">2. Free Company Training</h3>
                         <div className="bg-[#F8F9FA] dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:border-[#1a3884]/30 dark:hover:border-blue-500/50 transition">
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                  <span className="font-bold text-base text-slate-800 dark:text-slate-200 block mb-1">TechCorp Cloud Bootcamp</span>
                                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-2">
                                     <Clock className="w-3.5 h-3.5" /> Duration: 4 Weeks
                                  </div>
                               </div>
                               <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/50">Hiring Pipeline</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 font-medium mt-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                               <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> AWS</span>
                               <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" /> Docker</span>
                            </div>
                         </div>
                      </div>

                      {/* 5c Certifications */}
                      <div>
                         <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">3. Certifications for Advantage</h3>
                         <div className="bg-[#F8F9FA] dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:border-[#1a3884]/30 dark:hover:border-blue-500/50 transition">
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">AWS Solutions Architect</span>
                                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Issued By Amazon</span>
                               </div>
                               <span className="text-[9px] font-bold bg-[#C9A45B]/10 text-[#C9A45B] px-2 py-0.5 rounded-full border border-[#C9A45B]/20">Essential</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-3 mt-2">
                               <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                                  <span className="text-[9px] text-slate-400 font-semibold uppercase">Cost</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">$150</span>
                               </div>
                               <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                                  <span className="text-[9px] text-slate-400 font-semibold uppercase">Prep Time</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">40 hours</span>
                               </div>
                            </div>

                            <ul className="text-sm text-slate-600 dark:text-slate-300 font-medium space-y-2.5">
                               <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-[#C9A45B]"></div> Industry recognized credential</li>
                               <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-[#C9A45B]"></div> High ROI for Cloud roles</li>
                               <li className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-[#C9A45B]"></div> Boosts resume visibility significantly</li>
                            </ul>
                         </div>
                      </div>
                   </div>
                </motion.div>

                <div className="lg:col-span-3 flex flex-col gap-4">
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                     className="bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-2xl p-4 shadow-sm"
                   >
                      <h3 className="font-bold text-sm font-serif mb-2 text-[#1a3884] dark:text-white">Events & Community</h3>
                      <div className="flex flex-col gap-2">
                         <button onClick={() => navigate('/community')} className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition rounded-xl border border-slate-100 dark:border-slate-700 group">
                            <div className="w-8 h-8 rounded-full bg-[#1a3884]/5 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-[#1a3884]/10 dark:group-hover:bg-blue-900/50 transition whitespace-nowrap overflow-visible">
                               <Users className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                            </div>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex-1 text-left">Community Feed</span>
                         </button>
                         
                         <button onClick={() => navigate('/my-courses')} className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition rounded-xl border border-slate-100 dark:border-slate-700 group">
                            <div className="w-8 h-8 rounded-full bg-[#C9A45B]/10 flex items-center justify-center transition">
                               <BookOpen className="w-4 h-4 text-[#C9A45B]" />
                            </div>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex-1 text-left">Concept Checks</span>
                         </button>

                         <button onClick={() => navigate('/mind-care')} className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition rounded-xl border border-slate-100 dark:border-slate-700 group">
                            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition">
                               <HeartPulse className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                            </div>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex-1 text-left">Mind Care</span>
                         </button>
                      </div>
                   </motion.div>

                   {/* Optional Info Cards */}
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                     className="grid grid-cols-1 gap-3"
                   >
                      <div className="bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-xl p-3 shadow-sm flex items-center gap-3 hover:shadow-md transition cursor-pointer group">
                         <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition">
                            <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                         </div>
                         <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Location Intelligence</div>
                            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Tech hubs matching your skills</div>
                         </div>
                      </div>
                      
                      <div className="bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer group">
                         <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition">
                            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                         </div>
                         <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Salary Intelligence</div>
                            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Market value projection</div>
                         </div>
                      </div>
                      
                      <div className="bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer group">
                         <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition">
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                         </div>
                         <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">English Level</div>
                            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Professional Working</div>
                         </div>
                      </div>
                   </motion.div>
                </div>
              </div>



              {/* BOTTOM STRIP: Tools & Utilities (Kept from old design to maintain functionality) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                 <motion.button 
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}
                   onClick={() => navigate('/smaart-wallet')}
                   className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-full px-6 py-3 shadow-sm hover:shadow-md transition"
                 >
                    <span className="font-bold text-sm text-[#1a3884] dark:text-white">Wallet & Badges</span>
                    <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                       <Award className="w-4 h-4 text-[#C9A45B]" />
                       <Shield className="w-4 h-4 text-[#C9A45B]" />
                       <Sparkles className="w-4 h-4 text-[#C9A45B]" />
                    </div>
                 </motion.button>

                 <div className="flex items-center gap-4">
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }}
                      onClick={() => navigate('/smaart-toolkit')}
                      className="bg-white dark:bg-slate-900 border border-[#E8E4D9] dark:border-slate-800 rounded-full px-6 py-3 font-bold text-sm text-[#1a3884] dark:text-white shadow-sm hover:shadow-md transition"
                    >
                       Quick Access Toolkit
                    </motion.button>
                    
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.0 }}
                      className="w-12 h-12 bg-[#1a3884] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#112558] transition"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                       <ArrowUp className="w-5 h-5" />
                    </motion.button>
                 </div>
              </div>

              </div>
            </PageTransition>
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
