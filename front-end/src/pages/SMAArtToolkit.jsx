import { motion } from "framer-motion";
import { Heart, BookOpen, BookText, ArrowRight, MessageSquare, User, FileText, Brain } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";

const toolkitSections = [
  {
    id: 1,
    title: "AI Career Chat",
    description: "Have real-time conversations with your AI career coach. Get personalized advice, career guidance, and strategic insights 24/7 to accelerate your professional growth.",
    icon: MessageSquare,
    path: "/dashboard/ai-career-coach/chat",
    color: "from-purple-400 to-indigo-500",
    iconColor: "text-purple-500",
    badge: "AI Powered",
    badgeColor: "from-purple-600 to-indigo-600"
  },
  {
    id: 2,
    title: "Profile Analysis",
    description: "Complete career profile with AI-powered analysis, career path recommendations, skill gap insights, and personalized learning plans - all in one place.",
    icon: User,
    path: "/dashboard/profile-analysis",
    color: "from-blue-400 to-cyan-500",
    iconColor: "text-blue-500",
    badge: "Comprehensive",
    badgeColor: "from-blue-600 to-cyan-600"
  },
  {
    id: 3,
    title: "SMAART AI Resume Builder",
    description: "Create ATS-optimized resume content powered by AI. Generate professional summaries, experience descriptions, and keyword-rich content tailored for your target role.",
    icon: FileText,
    path: "/dashboard/resume-builder",
    color: "from-violet-400 to-purple-500",
    iconColor: "text-violet-500",
    badge: "Professional",
    badgeColor: "from-violet-600 to-purple-600"
  },
  {
    id: 4,
    title: "Mind Care Sessions",
    description: "Personalized wellness sessions designed to nurture your mental health and emotional well-being. Connect with experts and discover inner peace.",
    icon: Heart,
    path: "/dashboard/mindcare-sessions",
    color: "from-rose-400 to-pink-500",
    iconColor: "text-rose-500",
    badge: "Wellness",
    badgeColor: "from-rose-600 to-pink-600"
  },
  {
    id: 5,
    title: "Library",
    description: "Access a vast collection of resources, books, articles, and learning materials to expand your knowledge and fuel your personal growth.",
    icon: BookOpen,
    path: "/dashboard/library",
    color: "from-emerald-400 to-teal-500",
    iconColor: "text-emerald-500",
    badge: "Resources",
    badgeColor: "from-emerald-600 to-teal-600"
  },
  {
    id: 6,
    title: "General Dictionary",
    description: "Your comprehensive reference guide for terminology, concepts, and definitions. Master the vocabulary that empowers your learning journey.",
    icon: BookText,
    path: "/dashboard/dictionary",
    color: "from-amber-400 to-orange-500",
    iconColor: "text-amber-500",
    badge: "Reference",
    badgeColor: "from-amber-600 to-orange-600"
  },
];

const ToolkitCard = ({ section, index }) => {
  const navigate = useNavigate();
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => navigate(section.path)}
      className="group relative h-full cursor-pointer"
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${section.color} rounded-3xl opacity-0 group-hover:opacity-75 transition duration-500 blur-xl group-hover:blur-2xl`} />

      {/* Card */}
      <div className="relative h-full overflow-hidden rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-all duration-500 group-hover:translate-y-[-8px] group-hover:shadow-2xl group-hover:border-transparent">

        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500`} />
        <div className={`absolute top-0 right-0 w-72 h-72 bg-gradient-to-br ${section.color} opacity-5 dark:opacity-[0.08] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-all duration-500 group-hover:scale-150 group-hover:opacity-15 dark:group-hover:opacity-25`} />

        {/* Content */}
        <div className="p-8 h-full flex flex-col items-start relative z-10">

          {/* Header */}
          <div className="w-full flex justify-between items-start mb-6">
            <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${section.color} shadow-lg shadow-blue-500/30 dark:shadow-none text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-2xl`}>
              <Icon size={30} strokeWidth={2} className="relative z-10" />
            </div>

            <span className={`text-[10px] font-bold uppercase tracking-widest text-white py-1.5 px-3 rounded-lg bg-gradient-to-r ${section.badgeColor || 'from-blue-600 to-purple-600'} shadow-lg shadow-blue-500/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}>
              {section.badge}
            </span>
          </div>

          {/* Title & Description */}
          <div className="flex-1">
            <h3 className={`text-xl font-bold text-slate-800 dark:text-white mb-3 transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ${section.color}`}>
              {section.title}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 transition-colors duration-300 group-hover:text-slate-700 dark:group-hover:text-slate-300">
              {section.description}
            </p>
          </div>

          {/* Footer */}
          <div className="w-full mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between transition-all duration-300 group-hover:border-transparent">
            <span className="text-xs font-bold uppercase tracking-wider transition-all duration-300 text-slate-400 dark:text-slate-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-indigo-600">
              Explore Tool
            </span>

            <div className={`w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center transition-all duration-500 group-hover:bg-gradient-to-r ${section.color} group-hover:text-white group-hover:scale-110 group-hover:rotate-45 shadow-md group-hover:shadow-xl`}>
              <ArrowRight size={16} className="transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SMAArtToolkit = () => {
  return (
    <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] transition-colors duration-300">
      <DashboardSidebar />

      <div className="min-h-screen transition-all duration-300">
        <DashboardHeader />

        <main className="w-full relative py-8 px-4 md:px-0">
          <div className="max-w-7xl mx-auto pb-12">

            {/* Header */}
            <div className="mb-12 px-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Brain className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                  <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white">
                    SMAART Toolkit
                  </h1>
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                  Empower your journey with AI-powered career tools, wellness resources, and comprehensive learning materials
                </p>
              </motion.div>
            </div>

            {/* Toolkit Grid */}
            <div className="px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {toolkitSections.map((section, index) => (
                  <ToolkitCard key={section.id} section={section} index={index} />
                ))}
              </div>
            </div>

            {/* Info Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 px-4"
            >
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-8 text-white text-center">
                <h3 className="text-2xl font-bold mb-2">🚀 Unlock Your Potential</h3>
                <p className="text-white/90 max-w-2xl mx-auto">
                  Explore our comprehensive toolkit designed to support your career growth, mental wellness, and continuous learning
                </p>
              </div>
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default SMAArtToolkit;
