import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import PageTransition from "@/components/PageTransition";
import VisionBoardSplash from "@/components/VisionBoardSplash";
import {
  Shield, Brain, Star, Image as ImageIcon,
  Users, HeartPulse, Sparkles, ArrowUp,
  BookOpen, Award
} from "lucide-react";
import useUser from "@/hooks/useUser";

// --- Minimal Radar Chart from SkillsPassport ---
const MiniRadarChart = ({ data, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const size = 160;
  const center = size / 2;
  const radius = 60;
  const totalAxes = 6;

  const getPoint = (value, index, maxRadius) => {
    const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
    const dist = (value / 100) * maxRadius;
    return {
      x: center + dist * Math.cos(angle),
      y: center + dist * Math.sin(angle)
    };
  };

  const getPath = (values, maxRadius) => {
    return values.map((v, i) => {
      const point = getPoint(v, i, maxRadius);
      return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    }).join(' ') + ' Z';
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-sm">
      {[100, 75, 50, 25].map((pct, i) => (
        <path
          key={i}
          d={getPath(Array(totalAxes).fill(pct), radius)}
          fill="none"
          stroke={isDark ? "currentColor" : "#e2e8f0"} 
          strokeWidth="1"
          strokeDasharray={i === 0 ? "none" : "2 2"}
          className={isDark ? "text-slate-700" : ""}
        />
      ))}
      {Array.from({ length: totalAxes }).map((_, i) => {
        const point = getPoint(100, i, radius);
        return (
          <line
            key={i} x1={center} y1={center} x2={point.x} y2={point.y}
            stroke={isDark ? "currentColor" : "#e2e8f0"}
            className={isDark ? "text-slate-700" : ""} strokeWidth="1"
          />
        );
      })}
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        d={getPath(data.map(d => d.value), radius)}
        fill="rgba(201, 164, 91, 0.2)"
        stroke="#C9A45B"
        strokeWidth="2"
      />
      {data.map((d, i) => {
        const point = getPoint(d.value, i, radius);
        return (
          <circle key={i} cx={point.x} cy={point.y} r="2.5" fill="#C9A45B" />
        );
      })}
      {data.map((d, i) => {
        const point = getPoint(125, i, radius); 
        return (
          <text
            key={i} x={point.x} y={point.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fontWeight="bold" fill={isDark ? "#94a3b8" : "#9ca3af"}
          >
            {d.id}
          </text>
        );
      })}
    </svg>
  );
};

// --- Mini Star Roadmap ---
const MiniRoadmapChart = ({ progressPct = 60 }) => {
  const points = [
    { x: 10, y: 90 }, { x: 30, y: 70 }, { x: 50, y: 55 }, 
    { x: 70, y: 35 }, { x: 90, y: 15 }
  ];
  
  return (
    <div className="w-full h-full relative p-4 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        {/* Draw Path */}
        <path 
           d={`M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}
           fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="3 3"
        />
        <path 
           d={`M ${points[0].x} ${points[0].y} ` + points.slice(1, 3).map(p => `L ${p.x} ${p.y}`).join(' ')}
           fill="none" stroke="#1a3884" strokeWidth="2" 
        />
        {/* Draw Stars */}
        {points.map((p, i) => {
            const isCompleted = i < 3;
            const isCurrent = i === 3;
            return (
              <g key={i} transform={`translate(${p.x - 5}, ${p.y - 5}) scale(0.4)`}>
                <path 
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                  fill={isCompleted ? "#C9A45B" : (isCurrent ? "#1a3884" : "#e5e7eb")} 
                />
              </g>
            )
        })}
      </svg>
    </div>
  )
}

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [showVisionSplash, setShowVisionSplash] = useState(false);
  
  // Stats
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCourse: null,
    moduleProgress: 0,
    resumeUrl: '/dashboard/courses',
    quotients: [
        { id: 'CRQ', value: 75 }, { id: 'SRQ', value: 82 }, 
        { id: 'LQ', value: 65 }, { id: 'SIQ', value: 90 }, 
        { id: 'PEQ', value: 70 }, { id: 'DAQ', value: 60 }
    ]
  });

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('visionSplashShown');
    if (!hasSeenSplash) setShowVisionSplash(true);
  }, []);

  useEffect(() => {
    // Mock user fetch / check
    if (user && !userLoading) {
        setDashboardLoading(false);
    }
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

  // Styles
  const bgMain = "bg-[#F5F2ED] dark:bg-[#0B1120]";
  const cardLight = "bg-[#FDFBF7] border border-[#E8E4D9] shadow-sm rounded-3xl";
  const darkCard = "bg-[#16213E] text-white rounded-3xl";
  const goldCard = "bg-[#C9A45B] text-white rounded-3xl";

  return (
    <>
      {showVisionSplash && (
        <VisionBoardSplash onComplete={handleVisionSplashComplete} duration={3000} />
      )}

      <div className={`min-h-screen ${bgMain} font-sans transition-colors duration-300 text-slate-800`}>
        <DashboardSidebar />

        <div className="min-h-screen p-4 md:p-8 lg:p-10 pb-24 lg:pb-10">
          <PageTransition>
            <div className="max-w-[1600px] mx-auto space-y-6">

              {/* TOP ROW: Continue Learning & Vision Board */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Continue Learning Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className={`${darkCard} lg:col-span-2 p-6 md:p-8 relative overflow-hidden flex flex-col justify-center min-h-[160px]`}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between z-10 gap-6">
                    <div className="flex items-center gap-5">
                      {/* Avatar / Icon Placeholder */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A45B] to-[#A68B5C] flex items-center justify-center p-0.5 shadow-lg">
                          <div className="w-full h-full rounded-full bg-[#16213E] flex items-center justify-center">
                              <Star className="w-8 h-8 text-[#C9A45B] fill-[#C9A45B]" />
                          </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-serif font-bold tracking-wide text-white">Continue Learning</h2>
                        <div className="flex items-center gap-3 mt-2">
                           <span className="text-sm font-semibold opacity-80 uppercase tracking-widest text-[#C9A45B]">Level 3</span>
                           <div className="w-32 sm:w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="w-[75%] h-full bg-[#C9A45B] rounded-full"></div>
                           </div>
                           <span className="text-sm opacity-80 text-white">75%</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                       onClick={() => navigate('/dashboard/courses')}
                       className="px-8 py-3 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors shadow-sm"
                    >
                      Resume
                    </button>
                  </div>
                </motion.div>

                {/* Vision Board Preview */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className={`${cardLight} p-5 flex flex-col`}
                >
                  <div className="flex items-center justify-between mb-3">
                     <h3 className="font-bold text-lg">Vision Board</h3>
                     <button className="text-xs font-semibold text-slate-400 hover:text-slate-600">Edit</button>
                  </div>
                  <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-2 cursor-pointer" onClick={() => navigate('/vision-board')}>
                     {/* Mock Images */}
                     <div className="bg-slate-200 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" /></div>
                     <div className="bg-slate-200 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" /></div>
                     <div className="bg-slate-200 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" /></div>
                     <div className="bg-slate-200 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" /></div>
                     <div className="bg-slate-200 rounded-lg overflow-hidden"><img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" /></div>
                     <div className="bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100"><ImageIcon className="w-5 h-5 text-slate-300" /></div>
                  </div>
                </motion.div>
              </div>

              {/* Title */}
              <div className="pt-2">
                 <h2 className="text-2xl font-serif font-bold tracking-wide text-[#1a3884]">Learning Journey</h2>
              </div>

              {/* MIDDLE ROW: Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COL 1: Mini Roadmap (Spans 4) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className={`${cardLight} lg:col-span-4 p-6 flex flex-col min-h-[380px]`}
                  onClick={() => navigate('/my-courses')}
                >
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-lg">Mini-Roadmap</h3>
                     <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition"><ArrowUp className="w-4 h-4 rotate-45 text-slate-500" /></button>
                  </div>
                  <div className="flex-1 relative cursor-pointer group">
                     <MiniRoadmapChart />
                     <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-4 py-2 bg-white rounded-full font-bold text-sm shadow-md text-[#1a3884]">View Full Map</span>
                     </div>
                  </div>
                </motion.div>

                {/* COL 2 & 3: Middle Widgets (Spans 5) */}
                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                   
                   {/* Col 2A: Quotients & Dark Coach Card */}
                   <div className="flex flex-col gap-6">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className={`${cardLight} p-5 flex-1 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => navigate('/quotients')}
                      >
                         <h3 className="font-bold w-full text-left mb-2">Quotients</h3>
                         <div className="w-40 h-40">
                             <MiniRadarChart data={stats.quotients} />
                         </div>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className={`${darkCard} p-5 h-[140px] flex flex-col justify-between`}
                      >
                         <h3 className="font-bold text-white">AI Career Coach</h3>
                         <p className="text-xs opacity-70 leading-relaxed text-white">
                            Focus on improving your Digital & AI literacy. We have recommended 2 new micro-modules.
                         </p>
                      </motion.div>
                   </div>
                   
                   {/* Col 2B: Gold Coach Card & Skills Passport */}
                   <div className="flex flex-col gap-6">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className={`${goldCard} p-5 h-[140px] flex flex-col justify-between`}
                      >
                         <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white">AI Career Coach</h3>
                            <Brain className="w-5 h-5 opacity-50 text-white" />
                         </div>
                         <p className="text-[11px] font-semibold opacity-90 leading-relaxed mb-1 text-white">
                            "Success in management requires adaptability. Review your Module 2 notes."
                         </p>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        className={`${cardLight} p-5 flex-1 flex flex-col cursor-pointer hover:shadow-md transition`}
                        onClick={() => navigate('/skills-passport')}
                      >
                         <h3 className="font-bold mb-4">Skills Passport</h3>
                         <div className="flex-1 flex items-end gap-2 px-2 mt-2">
                             {/* Mini Bar Chart */}
                             {[40, 75, 45, 90, 60].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2">
                                  <div className={`w-full rounded-t-sm ${i === 3 ? 'bg-[#1a3884]' : 'bg-[#e5e7eb]'}`} style={{ height: `${h}%` }}></div>
                                  <span className="text-[9px] font-bold text-slate-400">{i+1}</span>
                                </div>
                             ))}
                         </div>
                      </motion.div>
                   </div>
                </div>

                {/* COL 4: Right Sidebar Deadlines (Spans 3) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                  className="lg:col-span-3 flex flex-col gap-4"
                >
                   <h3 className="font-bold text-lg px-1">Upcoming Deadlines</h3>
                   
                   <div className={`${cardLight} p-1 py-2 flex flex-col gap-1`}>
                      <button onClick={() => navigate('/community')} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition rounded-xl group">
                         <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#1a3884]/10 transition">
                            <Users className="w-5 h-5 text-slate-600 group-hover:text-[#1a3884]" />
                         </div>
                         <span className="font-semibold text-sm flex-1 text-left">Community feed</span>
                      </button>
                      
                      <div className="w-[80%] mx-auto h-[1px] bg-slate-100"></div>

                      <button onClick={() => navigate('/my-courses')} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition rounded-xl group">
                         <div className="w-10 h-10 rounded-full bg-[#C9A45B]/10 flex items-center justify-center transition">
                            <BookOpen className="w-5 h-5 text-[#C9A45B]" />
                         </div>
                         <span className="font-semibold text-sm flex-1 text-left">Module 3 Concept Check</span>
                      </button>

                      <div className="w-[80%] mx-auto h-[1px] bg-slate-100"></div>

                      <button onClick={() => navigate('/mind-care')} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition rounded-xl group">
                         <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#1a3884]/10 transition">
                            <HeartPulse className="w-5 h-5 text-slate-600 group-hover:text-[#1a3884]" />
                         </div>
                         <span className="font-semibold text-sm flex-1 text-left">Mind Care check-in</span>
                      </button>
                   </div>
                </motion.div>

              </div>

              {/* BOTTOM ROW: Tools & Utilities */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4">
                 <motion.button 
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}
                   onClick={() => navigate('/smaart-wallet')}
                   className="flex items-center gap-3 bg-white border border-[#E8E4D9] rounded-full px-6 py-3 shadow-sm hover:shadow-md transition"
                 >
                    <span className="font-bold text-sm">Wallet & Badges</span>
                    <div className="flex items-center gap-1 ml-2">
                       <Award className="w-4 h-4 text-slate-400" />
                       <Shield className="w-4 h-4 text-slate-400" />
                       <Sparkles className="w-4 h-4 text-slate-400" />
                    </div>
                 </motion.button>

                 <div className="flex items-center gap-3">
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }}
                      onClick={() => navigate('/smaart-toolkit')}
                      className="bg-white border border-[#E8E4D9] rounded-full px-6 py-3 font-bold text-sm shadow-sm hover:shadow-md transition"
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
        </div>
      </div>
    </>
  );
};

export default DashboardHome;
