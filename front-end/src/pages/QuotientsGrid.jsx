import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Activity,
  Lightbulb,
  Zap,
  Cpu,
  Leaf,
  X,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { assessmentApi } from "@/services/assessmentApi";
import Big5RadarChart from "@/components/Big5RadarChart";

// Helper function to generate SQ description based on percentile range
const getSQDescription = (percentileRange) => {
  const descriptions = {
    '0-25': 'Your sustainability awareness is in the developing stage. You are beginning to understand the importance of environmental, social, and ethical considerations. Focus on learning about sustainable practices, exploring eco-friendly alternatives in your daily life, and understanding the impact of your choices on the planet and society. This is an excellent starting point for your sustainability journey.',
    '26-50': 'Your sustainability awareness is in the moderate range. You have a basic understanding of sustainability principles and make some conscious choices. To advance further, deepen your knowledge of environmental issues, increase your sustainable behaviors, and explore ways to reduce your ecological footprint. Consider adopting more sustainable habits and encouraging others to do the same.',
    '51-75': 'You have strong sustainability awareness. You understand environmental, social, and ethical issues well and actively make sustainable choices in your daily life. You recognize the importance of conservation and responsible consumption. Continue to stay informed about sustainability developments, share your knowledge with others, and explore advanced sustainable practices. Your strong foundation positions you well to be a sustainability advocate.',
    '76-100': 'Your sustainability awareness is exceptional. You possess comprehensive understanding of environmental, social, and ethical sustainability, demonstrate advanced sustainable behaviors, and show strong commitment to responsible living. You actively contribute to a more sustainable future through your choices and actions. Continue to lead by example, mentor others in sustainability practices, and contribute to creating positive environmental and social impact in your community.'
  };
  return descriptions[percentileRange] || descriptions['26-50'];
};

const QuotientsGrid = () => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({
    big5: null,
    vak: null,
    eq: null,
    cq: null,
    arq: null,
    aiq: null,
    sq: null
  });
  const [status, setStatus] = useState({
    big5: false,
    vak: false,
    eq: false,
    cq: false,
    arq: false,
    aiq: false,
    sq: false
  });

  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
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

        // Fetch completed results status
        const userResultsResponse = await assessmentApi.getUserResults(userId, 'completed');

        if (userResultsResponse.success && userResultsResponse.data) {
          const completedStatus = {
            big5: userResultsResponse.data.some(r => r.assessmentCode?.toUpperCase().trim() === "ASM00001"),
            eq: userResultsResponse.data.some(r => r.assessmentCode?.toUpperCase().trim() === "ASM00002"),
            vak: userResultsResponse.data.some(r => r.assessmentCode?.toUpperCase().trim() === "ASM00003"),
            cq: userResultsResponse.data.some(r => r.assessmentCode?.toUpperCase().trim() === "ASM00004"),
            arq: userResultsResponse.data.some(r => r.assessmentCode?.toUpperCase().trim() === "ASM00005"),
            aiq: userResultsResponse.data.some(r => r.assessmentCode?.toUpperCase().trim() === "ASM00006"),
            sq: userResultsResponse.data.some(r => r.assessmentCode?.toUpperCase().trim() === "ASM00007"),
          };
          setStatus(completedStatus);

          // Fetch actual results for completed assessments
          const newResults = { ...results };

          if (completedStatus.big5) {
            const res = await assessmentApi.getBig5Results(userId);
            if (res.success) newResults.big5 = res.data.scores;
          }
          if (completedStatus.vak) {
            const res = await assessmentApi.getVAKResults(userId);
            if (res.success) newResults.vak = res.data;
          }
          if (completedStatus.eq) {
            const res = await assessmentApi.getEQResults(userId);
            if (res.success) newResults.eq = res.data;
          }
          if (completedStatus.cq) {
            const res = await assessmentApi.getCQResults(userId);
            if (res.success) newResults.cq = res.data;
          }
          if (completedStatus.arq) {
            const res = await assessmentApi.getARQResults(userId);
            if (res.success) newResults.arq = res.data;
          }
          if (completedStatus.aiq) {
            const res = await assessmentApi.getAIQResults(userId);
            if (res.success) newResults.aiq = res.data;
          }
          if (completedStatus.sq) {
            const res = await assessmentApi.getSQResults(userId);
            if (res.success) {
              newResults.sq = res.data;
              // Add description if missing (for old results)
              if (!newResults.sq.description && newResults.sq.percentileRange) {
                newResults.sq.description = getSQDescription(newResults.sq.percentileRange);
              }
            }
          }

          setResults(newResults);
        }
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const assessments = [
    {
      id: 'big5',
      title: 'Personality Profile',
      icon: Brain,
      data: results.big5,
      isCompleted: status.big5,
      description: "Discover your Big 5 personality traits."
    },
    {
      id: 'vak',
      title: 'Learning Style',
      icon: BookOpen,
      data: results.vak,
      isCompleted: status.vak,
      description: "Understand your visual, auditory, and kinesthetic preferences."
    },
    {
      id: 'eq',
      title: 'Emotional Intelligence',
      icon: Activity,
      data: results.eq,
      isCompleted: status.eq,
      description: "Measure your emotional awareness and management."
    },
    {
      id: 'cq',
      title: 'Creativity Quotient',
      icon: Lightbulb,
      data: results.cq,
      isCompleted: status.cq,
      description: "Assess your creative potential and openness."
    },
    {
      id: 'arq',
      title: 'Adaptability & Resilience',
      icon: Zap,
      data: results.arq,
      isCompleted: status.arq,
      description: "Evaluate your ability to adapt to change."
    },
    {
      id: 'aiq',
      title: 'AI Literacy',
      icon: Cpu,
      data: results.aiq,
      isCompleted: status.aiq,
      description: "Measure your readiness for the AI era."
    },
    {
      id: 'sq',
      title: 'Sustainability',
      icon: Leaf,
      data: results.sq,
      isCompleted: status.sq,
      description: "Check your sustainability awareness and values."
    }
  ];

  return (
    <div className="h-screen bg-[#002147] overflow-hidden">
      <DashboardSidebar />

      <div className="h-[calc(100vh-64px)] pt-16 flex flex-col">

        <main className="flex-1 p-3 md:p-4 lg:p-5 overflow-hidden flex flex-col">
          {/* Header Section - Compact */}
          <div className="mb-3 flex-shrink-0">
            <h1 className="text-2xl font-bold text-white mb-1">Quotients Grid</h1>
            <p className="text-gray-400 text-sm">Your comprehensive assessment profile</p>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-fr overflow-hidden">
            {assessments.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => item.isCompleted && setSelectedAssessment(item)}
                className={`
                  relative overflow-hidden rounded-xl border-2 bg-[#001730]
                  ${item.isCompleted
                    ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:border-cyan-400'
                    : 'border-white/10 opacity-70 grayscale'}
                  transition-all duration-300 group
                `}
              >
                <div className="p-4 relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg bg-transparent border border-white/20 group-hover:border-cyan-400/50 text-cyan-400 transition-colors`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    {item.isCompleted && (
                      <div className="px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold tracking-wider">
                        DONE
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1 tracking-tight">{item.title}</h3>
                  <p className="text-gray-400 text-xs mb-2 leading-relaxed line-clamp-1">{item.description}</p>

                  <div className="mt-auto">
                    {item.isCompleted ? (
                      <div>
                        {/* Dynamic Summary based on ID */}
                        {item.id === 'big5' && item.data && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {Object.entries(item.data).slice(0, 2).map(([k, v]) => (
                              <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#002845] border border-cyan-900/50 text-cyan-100">
                                {k.charAt(0).toUpperCase() + k.slice(1)}: {v.raw}%
                              </span>
                            ))}
                          </div>
                        )}
                        {item.id === 'vak' && item.data && (
                          <div className="text-sm font-bold text-white mb-1">
                            {item.data.learningStyle}
                          </div>
                        )}
                        {item.id === 'eq' && item.data && (
                          <div className="flex items-end gap-1 text-white mb-1">
                            <span className="text-2xl font-bold">{Math.round(item.data.normalizedScore)}</span>
                            <span className="text-xs mb-0.5 text-cyan-400/70">/ 100</span>
                          </div>
                        )}
                        {(item.id === 'cq' || item.id === 'arq') && item.data && (
                          <div className="flex items-end gap-1 text-white mb-1">
                            <span className="text-2xl font-bold">{Math.round(item.data.compositeScore)}</span>
                            <span className="text-xs mb-0.5 text-cyan-400/70">Score</span>
                          </div>
                        )}
                        {item.id === 'aiq' && item.data && (
                          <div className="flex items-end gap-1 text-white mb-1">
                            <span className="text-2xl font-bold">{Math.round(item.data.aiqPercentage)}%</span>
                            <span className="text-xs mb-0.5 text-cyan-400/70">Literacy</span>
                          </div>
                        )}
                        {item.id === 'sq' && item.data && (
                          <div className="flex items-end gap-1 text-white mb-1">
                            <span className="text-2xl font-bold">{Math.round(item.data.sqPercentage)}%</span>
                            <span className="text-xs mb-0.5 text-cyan-400/70">Sustainability</span>
                          </div>
                        )}

                        <button className="w-full py-1.5 bg-white rounded-lg text-[#002147] font-bold text-xs hover:bg-cyan-50 transition-colors flex items-center justify-center gap-1">
                          View Details
                        </button>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <span className="inline-block px-2 py-0.5 rounded bg-white/5 text-gray-500 text-[10px] border border-white/10">
                          Pending
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Details Modal */}
          <AnimatePresence>
            {selectedAssessment && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setSelectedAssessment(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#001730] border-2 border-cyan-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)]"
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#001e3c]">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg border border-cyan-400/50 text-cyan-400 bg-transparent">
                        <selectedAssessment.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedAssessment.title}</h2>
                        <p className="text-cyan-400/70 text-sm">Detailed Breakdown</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAssessment(null)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Modal Content - Scrollable */}
                  <div className="p-6 overflow-y-auto custom-scrollbar text-gray-300">

                    {/* Big 5 Content */}
                    {selectedAssessment.id === 'big5' && selectedAssessment.data && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="bg-[#002845] rounded-xl p-6 border border-cyan-900/30">
                            <Big5RadarChart scores={selectedAssessment.data} />
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white">Trait Breakdown</h3>
                            {Object.entries(selectedAssessment.data).map(([trait, val]) => (
                              <div key={trait}>
                                <div className="flex justify-between mb-1 text-sm">
                                  <span className="capitalize text-white">{trait}</span>
                                  <span className="text-cyan-400">{val.raw}%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500" style={{ width: `${val.raw}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VAK Content */}
                    {selectedAssessment.id === 'vak' && selectedAssessment.data && (
                      <div className="space-y-6">
                        <div className="p-6 rounded-xl bg-[#002845] border border-cyan-500/30 text-center">
                          <h3 className="text-cyan-400 uppercase tracking-wider text-sm font-bold mb-2">Dominant Style</h3>
                          <div className="text-4xl font-bold text-white mb-2">{selectedAssessment.data.learningStyle}</div>
                          <p className="text-gray-300 max-w-2xl mx-auto">{selectedAssessment.data.description}</p>
                        </div>
                        {selectedAssessment.data.scores && (
                          <div className="grid grid-cols-3 gap-4">
                            {Object.entries(selectedAssessment.data.scores).map(([mode, score]) => (
                              <div key={mode} className="bg-[#001e3c] p-4 rounded-xl text-center border border-white/10">
                                <div className="capitalize text-gray-400 text-sm mb-1">{mode}</div>
                                <div className="text-2xl font-bold text-white">{score}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generic Content for EQ, CQ, ARQ, AIQ, SQ where structure is similar */}
                    {['eq', 'cq', 'arq', 'aiq', 'sq'].includes(selectedAssessment.id) && selectedAssessment.data && (
                      <div className="space-y-6">
                        <div className="p-8 rounded-xl bg-gradient-to-b from-[#002845] to-[#001730] border border-cyan-500/30 text-center">
                          <h3 className="text-cyan-400/80 uppercase tracking-wider text-sm font-bold mb-2">Overall Score</h3>
                          <div className="text-6xl font-bold text-white mb-4">
                            {selectedAssessment.id === 'eq' ? Math.round(selectedAssessment.data.normalizedScore) :
                              selectedAssessment.id === 'aiq' ? Math.round(selectedAssessment.data.aiqPercentage) + '%' :
                                selectedAssessment.id === 'sq' ? Math.round(selectedAssessment.data.sqPercentage) + '%' :
                                  Math.round(selectedAssessment.data.compositeScore)}
                          </div>
                          <div className="inline-block px-4 py-1 rounded-full bg-cyan-950/50 text-cyan-300 font-medium text-sm border border-cyan-500/30 backdrop-blur-md">
                            {selectedAssessment.data.percentileRange}th Percentile
                          </div>
                        </div>

                        <div className="bg-[#001e3c] p-6 rounded-xl border border-white/10">
                          <h4 className="text-lg font-bold text-white mb-3">Analysis</h4>
                          <p className="leading-relaxed text-gray-300">{selectedAssessment.data.description}</p>
                        </div>

                        {/* Subscores for AIQ as an example */}
                        {selectedAssessment.id === 'aiq' && selectedAssessment.data.subscores && (
                          <div>
                            <h4 className="text-lg font-bold text-white mb-4">Competency Breakdown</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {Object.entries(selectedAssessment.data.subscores).map(([key, val]) => (
                                <div key={key} className="bg-[#001e3c] p-4 rounded-xl border border-white/10">
                                  <div className="text-gray-400 text-xs uppercase mb-1">{key}</div>
                                  <div className="text-2xl font-bold text-cyan-400">{Math.round(val)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

export default QuotientsGrid;
