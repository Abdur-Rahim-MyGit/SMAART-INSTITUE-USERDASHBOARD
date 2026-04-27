import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY = "smaart_community_tasks";

const TASK_CATEGORIES = [
  {
    id: "connect",
    emoji: "🗣️",
    label: "Connect & Engage",
    color: "bg-blue-500",
    light: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    tasks: [
      "Post your first discussion in the community",
      "Reply to a peer's question with a helpful answer",
      "Welcome a new community member in the feed",
      "Share a resource link in a discussion post",
      "Join your first Student Group",
      "React to 5 posts with emoji reactions",
      "Bookmark 3 discussions for later reading",
      "Post in the Mentor channel for guidance",
      "Share a motivational quote in the Discussion feed",
      "Start a discussion that includes a media attachment",
    ],
  },
  {
    id: "learning",
    emoji: "📚",
    label: "Learning & Growth",
    color: "bg-violet-500",
    light: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    tasks: [
      "Share a study tip that helped you succeed",
      "Post a question about your current course module",
      "Create a community poll on a learning topic",
      "Summarize a key lesson from your module in a post",
      "Share a YouTube or external resource for peers",
      "Ask a mentor a career-related question publicly",
      "Discuss a book or article you found inspiring",
      "Post your biggest takeaway from an assessment",
      "Share a mind map or handwritten notes as an image",
      "Write a reflection post after completing a module",
    ],
  },
  {
    id: "achieve",
    emoji: "🏆",
    label: "Achieve & Excel",
    color: "bg-amber-500",
    light: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    tasks: [
      "Get your first 'Best Answer' mark on a reply",
      "Earn your first 50 community points",
      "Appear in the Top Contributors leaderboard",
      "Start 5 unique discussions in different categories",
      "Receive 10 likes on a single discussion post",
      "Get 5 replies on one of your discussions",
      "Post in all 3 channels: Discussion, Support & Mentor",
      "Create a poll that receives 10 or more votes",
      "Have a post reach a Quality Score (QS) above 0.50",
      "Share a discussion directly to a Student Group",
    ],
  },
  {
    id: "contribute",
    emoji: "💡",
    label: "Contribute & Share",
    color: "bg-emerald-500",
    light: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    tasks: [
      "Help a peer with a detailed, well-written reply",
      "Responsibly report an inappropriate post",
      "Share your Vision Board goal in the community",
      "Post about a skill you are actively building",
      "Create a new Study Group for your college peers",
      "Share a coding challenge or problem-solving puzzle",
      "Upload an infographic or visual learning tip",
      "Write a success story or personal achievement post",
      "Mentor a junior student publicly in the Discussion channel",
      "Post about your career aspirations and long-term goals",
    ],
  },
  {
    id: "personal",
    emoji: "🌟",
    label: "Personal Development",
    color: "bg-rose-500",
    light: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    tasks: [
      "Set your Vision Board as your active dashboard goal",
      "Complete your SMAART profile to 100%",
      "Log 5 check-in sessions in MindCare",
      "Complete a Skills Passport badge or milestone",
      "Submit a professional support ticket via the Help desk",
      "Update your Skills Passport with a new achievement",
      "Write a weekly reflection post in the community",
      "Complete all assessments for a course module",
      "Write a gratitude post in the Support channel",
      "Share your 1-year SMAART goal with the community",
    ],
  },
];

// Flatten all tasks with a unique global ID
const ALL_TASKS = TASK_CATEGORIES.flatMap((cat, catIdx) =>
  cat.tasks.map((task, taskIdx) => ({
    id: `${cat.id}-${taskIdx}`,
    globalIndex: catIdx * 10 + taskIdx + 1,
    categoryId: cat.id,
    label: task,
  }))
);

const TOTAL = ALL_TASKS.length; // 50

const CommunityTasks = () => {
  const [completed, setCompleted] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [expandedCategories, setExpandedCategories] = useState({
    connect: true,
    learning: false,
    achieve: false,
    contribute: false,
    personal: false,
  });

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPct = Math.round((completedCount / TOTAL) * 100);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch {
      // ignore
    }
  }, [completed]);

  const toggleTask = (taskId) => {
    setCompleted((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const getMilestoneLabel = () => {
    if (completedCount === 0) return "Start your journey! ✨";
    if (completedCount < 10) return "Getting started! 🌱";
    if (completedCount < 20) return "Building momentum! 🚀";
    if (completedCount < 30) return "Half way there! 💪";
    if (completedCount < 40) return "Almost a champion! 🔥";
    if (completedCount < 50) return "Final push! 🏅";
    return "Community Champion! 🏆";
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 hover:bg-white/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-[#002147] to-blue-700 rounded-xl shadow-sm">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#002147] font-bold text-base leading-none">
            Community Challenges
          </h3>
          <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-widest">
            50 Tasks · {getMilestoneLabel()}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#002147]/10 px-2.5 py-1 rounded-full">
          <Trophy className="w-3 h-3 text-[#002147]" />
          <span className="text-[11px] font-black text-[#002147]">
            {completedCount}/{TOTAL}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Progress
          </span>
          <span className="text-[10px] font-black text-[#002147]">
            {progressPct}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#002147] to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {completedCount === TOTAL && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2 p-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200"
          >
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs font-bold text-amber-700">
              🎉 You've completed all 50 Community Challenges!
            </p>
          </motion.div>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {TASK_CATEGORIES.map((cat) => {
          const catTasks = ALL_TASKS.filter((t) => t.categoryId === cat.id);
          const catCompleted = catTasks.filter((t) => completed[t.id]).length;
          const isOpen = expandedCategories[cat.id];

          return (
            <div
              key={cat.id}
              className={`rounded-2xl border overflow-hidden transition-all ${cat.border}`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 ${cat.light} hover:brightness-95 transition-all`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{cat.emoji}</span>
                  <span className={`text-xs font-black ${cat.text} uppercase tracking-wide`}>
                    {cat.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black ${cat.text} opacity-70`}>
                    {catCompleted}/{catTasks.length}
                  </span>
                  {isOpen ? (
                    <ChevronUp className={`w-3.5 h-3.5 ${cat.text}`} />
                  ) : (
                    <ChevronDown className={`w-3.5 h-3.5 ${cat.text}`} />
                  )}
                </div>
              </button>

              {/* Category Task List */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="tasks"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 py-2 space-y-1 bg-white/50">
                      {catTasks.map((task) => {
                        const isDone = !!completed[task.id];
                        return (
                          <motion.button
                            key={task.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleTask(task.id)}
                            className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all group/task ${
                              isDone
                                ? `${cat.light} border border-transparent`
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {isDone ? (
                                <CheckCircle
                                  className={`w-4 h-4 ${cat.text}`}
                                  strokeWidth={2.5}
                                />
                              ) : (
                                <Circle
                                  className="w-4 h-4 text-gray-300 group-hover/task:text-gray-400 transition-colors"
                                  strokeWidth={2}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span
                                className={`text-[11px] font-semibold leading-relaxed block ${
                                  isDone
                                    ? `${cat.text} line-through opacity-60`
                                    : "text-gray-700"
                                }`}
                              >
                                <span className="text-[9px] font-black text-gray-400 mr-1">
                                  #{task.globalIndex}
                                </span>
                                {task.label}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Reset Button */}
      {completedCount > 0 && (
        <button
          onClick={() => {
            if (window.confirm("Reset all challenge progress?")) {
              setCompleted({});
            }
          }}
          className="mt-4 w-full py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
        >
          Reset Progress
        </button>
      )}
    </div>
  );
};

export default CommunityTasks;
