import { motion } from "framer-motion";
import { Heart, BookOpen, BookText, ArrowRight, MessageSquare, User, FileText, Brain, Shield, Database } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";

const toolkitSections = [
  {
    id: 0,
    title: "SMAART Wallet",
    description: "Your professional vault — securely store and showcase your certificates, badges, course progress, and key learning flashcards all in one centralized place.",
    icon: Shield,
    path: "/dashboard/smaart-wallet",
    color: "from-[#1a3884] to-[#2d5dc7]",
    iconColor: "text-[#1a3884]",
    badge: "Vault",
    badgeColor: "from-[#1a3884] to-[#2d5dc7]"
  },
  {
    id: 7,
    title: "Career Intelligence Agent",
    description: "AI-powered Career Intelligence Engine — get personalized career roadmaps, skill gap analysis, job recommendations, and market insights powered by structured data + GPT AI.",
    icon: Database,
    path: "/dashboard/career-data-fetcher",
    color: "from-indigo-500 to-pink-500",
    iconColor: "text-indigo-500",
    badge: "AI + Data",
    badgeColor: "from-indigo-600 to-pink-600"
  },
  {
    id: 10,
    title: "SMAART Career Agent AI",
    description: "Multifactor Career Intelligence System — professional zone-based analysis (Green/Amber/Rec) covering 3 job preferences, deep skill gaps, and learning pathways.",
    icon: Brain,
    path: "/dashboard/career-guide",
    color: "from-emerald-500 to-blue-600",
    iconColor: "text-emerald-500",
    badge: "Multifactor",
    badgeColor: "from-emerald-600 to-blue-600"
  },
  {
    id: 1,
    title: "AI Career Chat",
    description: "Engage with your intelligent career strategist. Receive real-time, personalized guidance and industry insights 24/7 to accelerate your professional trajectory.",
    icon: MessageSquare,
    path: "/dashboard/ai-career-coach/chat",
    color: "from-purple-400 to-indigo-500",
    iconColor: "text-purple-500",
    badge: "AI Powered",
    badgeColor: "from-purple-600 to-indigo-600"
  },
  {
    id: 3,
    title: "SMAART AI Resume Builder",
    description: "Craft ATS-optimized resumes that stand out. Leverage AI to generate impactful summaries and role-specific content that maximizes your interview chances.",
    icon: FileText,
    path: "/dashboard/resume-builder",
    color: "from-violet-400 to-purple-500",
    iconColor: "text-violet-500",
    badge: "Professional",
    badgeColor: "from-violet-600 to-purple-600"
  },
  {
    id: 2,
    title: "Profile Analysis",
    description: "Transform your career potential with deep AI analysis. Get comprehensive skill gap assessments, role recommendations, and a personalized roadmap to success.",
    icon: User,
    path: "/dashboard/profile-analysis",
    color: "from-blue-400 to-cyan-500",
    iconColor: "text-blue-500",
    badge: "Comprehensive",
    badgeColor: "from-blue-600 to-cyan-600"
  },
  {
    id: 6,
    title: "General Dictionary",
    description: "Master professional terminology with our interactive dictionary. Features real-time definitions, audio pronunciation, and daily vocabulary building tools.",
    icon: BookText,
    path: "/dashboard/dictionary",
    color: "from-amber-400 to-orange-500",
    iconColor: "text-amber-500",
    badge: "Reference",
    badgeColor: "from-amber-600 to-orange-600"
  },
  {
    id: 5,
    title: "Library",
    description: "Unlock a curated repository of knowledge. Explore essential books, industry articles, and learning tracks tailored to accelerate your personal and professional growth.",
    icon: BookOpen,
    path: "/dashboard/library",
    color: "from-emerald-400 to-teal-500",
    iconColor: "text-emerald-500",
    badge: "Resources",
    badgeColor: "from-emerald-600 to-teal-600"
  },
  {
    id: 4,
    title: "Mind Care Sessions",
    description: "Nurture your mental well-being with personalized wellness sessions. Access guided meditations, track your mood, and connect with certified experts for inner balance.",
    icon: Heart,
    path: "/dashboard/mindcare-sessions",
    color: "from-rose-400 to-pink-500",
    iconColor: "text-rose-500",
    badge: "Wellness",
    badgeColor: "from-rose-600 to-pink-600"
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
