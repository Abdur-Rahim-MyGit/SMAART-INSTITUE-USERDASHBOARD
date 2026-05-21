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
  Target,
  Award,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { assessmentApi } from "@/services/assessmentApi";

const THEME = {
  navy: '#002147',
  teal: '#1a3884',
  white: '#FFFFFF'
};

const QuotientsGrid = () => {
  const [loading, setLoading] = useState(true);
  const [baselineData, setBaselineData] = useState(null);
  const [selectedQuotient, setSelectedQuotient] = useState(null);

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

        const response = await assessmentApi.getBaseLineResults(userId);
        if (response.success && response.data) {
          setBaselineData(response.data);
        }
      } catch (error) {
        console.error("Error fetching baseline results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const quotients = [
    {
      id: 'CRQ',
      title: 'Cognitive Reasoning',
      icon: Brain,
      color: '#60A5FA',
      description: 'Critical thinking & logical reasoning capabilities.'
    },
    {
      id: 'SRQ',
      title: 'Self-regulation & Drive',
      icon: Activity,
      color: '#F87171',
      description: 'Motivation, resilience & emotional control.'
    },
    {
      id: 'LQ',
      title: 'Learning Agility',
      icon: BookOpen,
      color: '#34D399',
      description: 'Adaptability & continuous learning.'
    },
    {
      id: 'SIQ',
      title: 'Social Interaction',
      icon: Target,
      color: '#FBBF24',
      description: 'Collaboration, empathy & communication.'
    },
    {
      id: 'PEQ',
      title: 'Professional Execution',
      icon: Zap,
      color: '#A78BFA',
      description: 'Work ethic, reliability & delivery.'
    },
    {
      id: 'DAQ',
      title: 'Digital & AI Literacy',
      icon: Cpu,
      color: '#F472B6',
      description: 'Tech proficiency & AI readiness.'
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-[#00152E]">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">My Quotients</h1>
              <p className="text-gray-400">Discover your readiness levels across 6 key career dimensions from your Baseline Assessment.</p>
            </header>

            {!baselineData ? (
              <div className="bg-[#002147] rounded-3xl p-12 text-center border-2 border-dashed border-gray-700">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">No Assessment Data Found</h2>
                <p className="text-gray-400 mb-6">You need to complete the T1 Baseline Assessment to see your quotients.</p>
                <a
                  href="/dashboard/assessments/baseline"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a3884] text-white rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  Take Assessment <ChevronRight size={18} />
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quotients.map((q) => {
                  const scoreData = baselineData.t1Profile?.[q.id];
                  return (
                    <motion.div
                      key={q.id}
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedQuotient({ ...q, ...scoreData })}
                      className="bg-[#002147] border border-gray-800 rounded-3xl p-6 cursor-pointer group hover:border-[#1a3884]/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: `${q.color}20` }}
                        >
                          <q.icon className="w-6 h-6" style={{ color: q.color }} />
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{q.id}</span>
                          <div className="text-2xl font-bold text-white">{scoreData?.rawScore || 0}%</div>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">{q.title}</h3>
                      <p className="text-sm text-gray-400 mb-6 line-clamp-2">{q.description}</p>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-xs font-bold text-gray-500 uppercase">Level: {scoreData?.level || 'Emerging'}</span>
                        </div>
                        <div className="h-2 bg-[#002A5C] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${scoreData?.rawScore || 0}%` }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: q.color }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selectedQuotient && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuotient(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#001730] border border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div
                    className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center"
                    style={{ backgroundColor: `${selectedQuotient.color}20` }}
                  >
                    <selectedQuotient.icon className="w-8 h-8" style={{ color: selectedQuotient.color }} />
                  </div>
                  <button
                    onClick={() => setSelectedQuotient(null)}
                    className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{selectedQuotient.title}</h2>
                    <span className="px-3 py-1 rounded-full bg-[#1a3884]/10 text-[#1a3884] text-xs font-bold uppercase tracking-widest">
                      {selectedQuotient.id}
                    </span>
                  </div>
                  <p className="text-gray-400">{selectedQuotient.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-[#002147] p-5 rounded-2xl border border-gray-800">
                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Quotient Score</span>
                    <span className="text-3xl font-bold text-white">{selectedQuotient.rawScore || 0}%</span>
                  </div>
                  <div className="bg-[#002147] p-5 rounded-2xl border border-gray-800">
                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Proficiency Level</span>
                    <span className="text-xl font-bold" style={{ color: selectedQuotient.color }}>{selectedQuotient.level || 'Emerging'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Score Progress</span>
                    <span className="text-white font-bold">{selectedQuotient.rawScore || 0}/100</span>
                  </div>
                  <div className="h-4 bg-[#002A5C] rounded-full overflow-hidden p-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedQuotient.rawScore || 0}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: selectedQuotient.color }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuotientsGrid;

