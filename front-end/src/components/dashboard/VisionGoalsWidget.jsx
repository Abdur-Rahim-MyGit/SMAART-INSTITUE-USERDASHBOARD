import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Flag, ArrowRight, Loader2, Star, Sparkles } from "lucide-react";
import { getActiveVision } from "@/features/visionBoard/services/visionBoardProApi";
import { useNavigate } from "react-router-dom";

const VisionGoalsWidget = () => {
  const [visionData, setVisionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActiveVision = async () => {
      try {
        const result = await getActiveVision();
        if (result.data) {
          setVisionData(result.data);
        }
      } catch (error) {
        console.error("Failed to load active vision goals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveVision();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl animate-pulse flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700/50">
        <Loader2 className="w-10 h-10 text-[#1a3884] dark:text-blue-400 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Loading your vision...</p>
      </div>
    );
  }

  if (!visionData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1a3884] via-[#002147] to-[#00152E] shadow-2xl p-8 md:p-12 border border-white/10 group"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        {/* Animated Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 group-hover:bg-blue-400/30 transition-colors duration-700"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 group-hover:bg-indigo-400/30 transition-colors duration-700"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-amber-300 font-bold uppercase tracking-widest text-xs">Set Your Intentions</span>
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
              What is your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">grand vision?</span>
            </h3>
            <p className="text-slate-300/90 max-w-xl text-lg font-medium leading-relaxed mx-auto md:mx-0">
              Create your Vision Board Pro to manifest your goals and keep them front and center every day.
            </p>
          </div>
          <button 
            onClick={() => navigate('/vision-board-pro/gallery')}
            className="group/btn relative overflow-hidden px-8 py-4 bg-white text-[#002147] font-bold rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] flex items-center gap-3 shrink-0"
          >
            <span className="relative z-10">Create Vision Board</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-white to-slate-100 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </motion.div>
    );
  }

  const shortTerm = (visionData.shortTermGoals || []).filter(g => g && g.trim() !== "");
  const longTerm = (visionData.longTermGoals || []).filter(g => g && g.trim() !== "");

  const handleEdit = () => {
    navigate("/vision-board-pro/create", {
      state: {
        isEditing: true,
        boardId: visionData.id,
        initialTitle: visionData.title,
        initialDescription: visionData.description,
        initialShortTermGoals: visionData.shortTermGoals,
        initialLongTermGoals: visionData.longTermGoals,
        backgroundImage: visionData.image
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-[#0f172a] dark:to-[#020617] shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-10"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-100/50 to-transparent dark:from-blue-900/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-100/50 to-transparent dark:from-emerald-900/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a3884]/10 dark:bg-blue-500/10 border border-[#1a3884]/20 dark:border-blue-500/20 mb-4">
              <Star className="w-4 h-4 text-[#1a3884] dark:text-blue-400 fill-[#1a3884] dark:fill-blue-400" />
              <span className="text-[#1a3884] dark:text-blue-400 font-bold uppercase tracking-widest text-[11px]">Active Vision</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              {visionData.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Keep your eyes on the prize. Here's what you're working towards.</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-end">
            <button 
              onClick={handleEdit}
              className="group flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 rounded-full text-sm font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-600/20 dark:hover:bg-blue-500/30 transition-all shadow-sm"
            >
              Edit Goals
            </button>
            <button 
              onClick={() => navigate('/vision-board-pro/gallery')}
              className="group flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm hover:shadow-md"
            >
              Open Gallery <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Canvas & Goals Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Canvas Display (Left Side) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            {visionData.image ? (
              <div className="relative group w-full max-w-[320px] mx-auto perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#1a3884] to-emerald-400 rounded-3xl blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                <div className="relative bg-white p-3 pb-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform rotate-[-2deg] group-hover:rotate-0 group-hover:-translate-y-2 transition-all duration-500 border border-slate-100 dark:border-slate-800">
                  <div className="rounded-xl overflow-hidden bg-slate-100 aspect-square flex items-center justify-center relative">
                     <img 
                      src={visionData.image} 
                      alt={visionData.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 flex items-center justify-center">
                       <button onClick={handleEdit} className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-900 px-4 py-2 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                          Edit Canvas
                       </button>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 text-center font-['Caveat',cursive] text-slate-500 dark:text-slate-400 text-lg opacity-80">
                    My Vision
              </div>
            </div>
              </div>
            ) : (
               <div className="w-full aspect-square max-w-[320px] mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center">
                  <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <button onClick={handleEdit} className="px-4 py-2 bg-[#1a3884] text-white rounded-full text-sm font-bold shadow-md hover:bg-blue-800 transition-colors">
                    Create Design
                  </button>
               </div>
            )}
          </div>

          {/* Goals (Right Side) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Short Term Goals Card */}
          <div className="group relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-shadow">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-80"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shadow-inner">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Short Term</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">1-6 Months</p>
              </div>
            </div>

            {shortTerm.length > 0 ? (
              <ul className="space-y-4">
                {shortTerm.map((goal, idx) => (
                  <li key={idx} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed pt-1">{goal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/30 dark:bg-slate-800/30">
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mb-3">No short-term goals added yet.</p>
                <button 
                  onClick={handleEdit}
                  className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full transition-colors"
                >
                  + Add Goals
                </button>
              </div>
            )}
          </div>

          {/* Long Term Goals Card */}
          <div className="group relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-shadow">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shadow-inner">
                <Flag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Long Term</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">1-5 Years</p>
              </div>
            </div>

            {longTerm.length > 0 ? (
              <ul className="space-y-4">
                {longTerm.map((goal, idx) => (
                  <li key={idx} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed pt-1">{goal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/30 dark:bg-slate-800/30">
                <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mb-3">No long-term goals added yet.</p>
                <button 
                  onClick={handleEdit}
                  className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full transition-colors"
                >
                  + Add Goals
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );
};

export default VisionGoalsWidget;
