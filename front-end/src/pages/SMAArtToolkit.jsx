import { motion } from "framer-motion";
import { Heart, BookOpen, BookText, ArrowRight, MessageSquare, User, FileText, Database, Shield } from "lucide-react";
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
    color: "#1a3884",
    badge: "Vault"
  },
  {
    id: 7,
    title: "Career Intelligence Agent",
    description: "AI-powered Career Intelligence Engine — get personalized career roadmaps, skill gap analysis, job recommendations, and market insights powered by structured data + GPT AI.",
    icon: Database,
    path: "/dashboard/career-data-fetcher",
    color: "#1a3884",
    badge: "AI + Data"
  },
  {
    id: 3,
    title: "SMAART AI Resume Builder",
    description: "Craft ATS-optimized resumes that stand out. Leverage AI to generate impactful summaries and role-specific content that maximizes your interview chances.",
    icon: FileText,
    path: "/dashboard/resume-builder",
    color: "#1a3884",
    badge: "Professional"
  },
  {
    id: 2,
    title: "Profile Analysis",
    description: "Transform your career potential with deep AI analysis. Get comprehensive skill gap assessments, role recommendations, and a personalized roadmap to success.",
    icon: User,
    path: "/dashboard/profile-analysis",
    color: "#1a3884",
    badge: "Comprehensive"
  },
  {
    id: 6,
    title: "General Dictionary",
    description: "Master professional terminology with our interactive dictionary. Features real-time definitions, audio pronunciation, and daily vocabulary building tools.",
    icon: BookText,
    path: "/dashboard/dictionary",
    color: "#1a3884",
    badge: "Reference"
  },
  {
    id: 5,
    title: "Library",
    description: "Unlock a curated repository of knowledge. Explore essential books, industry articles, and learning tracks tailored to accelerate your personal and professional growth.",
    icon: BookOpen,
    path: "/dashboard/library",
    color: "#1a3884",
    badge: "Resources"
  },
  {
    id: 4,
    title: "Mind Care Sessions",
    description: "Nurture your mental well-being with personalized wellness sessions. Access guided meditations, track your mood, and connect with certified experts for inner balance.",
    icon: Heart,
    path: "/dashboard/mindcare-sessions",
    color: "#1a3884",
    badge: "Wellness"
  },
];

const ToolkitCard = ({ section, index }) => {
  const navigate = useNavigate();
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => navigate(section.path)}
      className="group relative cursor-pointer"
    >
      <div className="relative h-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-none transition-all duration-300 group-hover:shadow-[0_4px_20px_rgba(26,56,132,0.12)] group-hover:border-[#1a3884]/40">
        
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 flex items-center justify-center bg-[#1a3884]/5 text-[#1a3884] rounded-none transition-all duration-300 group-hover:bg-[#1a3884] group-hover:text-white border border-slate-100 group-hover:border-transparent">
              <Icon size={22} strokeWidth={1.5} />
            </div>
            
            <span className="text-[9px] font-bold uppercase tracking-widest text-white py-1.5 px-3 bg-[#1a3884] rounded-none transition-all duration-300">
              {section.badge}
            </span>
          </div>

          {/* Title & Description */}
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-300 group-hover:text-[#1a3884]">
              {section.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
              {section.description}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#1a3884] transition-colors duration-300">
              Explore Tool
            </span>
            <div className="w-8 h-8 rounded-none bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-[#1a3884] group-hover:text-white transition-all duration-300">
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SMAArtToolkit = () => {
  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300 overflow-hidden">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-300">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto min-h-0 px-4 py-8 md:px-8">
          <div className="max-w-7xl mx-auto pb-12">
            
            {/* Toolbar - Compact description only */}
            <div className="mb-8 max-w-2xl">
              <p className="text-[#1a3884] dark:text-[#C0C0C0] text-2xl font-['Dancing_Script'] mb-1">
                Empower your journey with professional tools...
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest">
                Career intelligence, wellness and learning repository
              </p>
            </div>

            {/* Toolkit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {toolkitSections.map((section, index) => (
                <ToolkitCard key={section.id} section={section} index={index} />
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default SMAArtToolkit;

