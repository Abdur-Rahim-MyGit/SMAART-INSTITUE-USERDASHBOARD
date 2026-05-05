import { motion } from "framer-motion";
import {
  Heart, BookOpen, BookText, ArrowRight, MessageSquare,
  User, FileText, Database, Shield, Sparkles, ShieldCheck, Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const toolkitSections = [
  {
    id: 0,
    title: "Skills Vault",
    description: "Your professional vault — securely store and showcase your certificates, badges, course progress, and key learning flashcards all in one centralized place.",
    icon: Shield,
    path: "/dashboard/skills-vault",
    color: "#1a3884",
    badge: "Vault"
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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [.22, 1, .36, 1] }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <div
        onClick={() => navigate(section.path)}
        className="relative h-full bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 rounded-[32px] overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600"
      >
        {/* Top accent bar – brand blue */}
        <div className="h-1 bg-[#1a3884] dark:bg-blue-600" />

        <div className="p-8 h-full flex flex-col">
          {/* Header: Icon & Badge */}
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#1a3884] dark:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110">
              <Icon size={28} strokeWidth={2} />
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#1a3884] dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              {section.badge}
            </span>
          </div>

          {/* Title & Description */}
          <div className="flex-1 space-y-3 mb-8">
            <h3 className="text-xl font-black text-[#0f172a] dark:text-white leading-tight tracking-tight group-hover:text-[#1a3884] transition-colors">
              {section.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium line-clamp-3">
              {section.description}
            </p>
          </div>

          {/* Action Button */}
          <button
            className="w-full p-[1rem] py-4.5 px-8 rounded-2xl text-sm font-black flex items-center justify-center gap-3 bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40 group-hover:bg-[#1a3884] group-hover:text-white group-hover:border-[#1a3884] transition-all duration-300 active:scale-[0.97]"
          >
            Launch {section.title.split(' ')[0]} Tool
            <ArrowRight className="w-5 h-5 ml-auto opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const SMAArtToolkit = () => {
  return (
    <div className="space-y-6">
      <main className="px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Hero Section – Matching the "Centre" Pattern */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-[#4f46e5] text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                <div className="w-4 h-4 rounded-full bg-[#4f46e5]/10 flex items-center justify-center border border-[#4f46e5]/20">
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
                Intelligence Suite
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-black text-[#0f172a] tracking-tight leading-none">
                  SMAARt - <span className="text-[#1a3884]">Toolkit</span>
                </h1>
                <p className="text-[#1a3884] dark:text-[#C0C0C0] text-3xl font-['Dancing Script',cursive] mb-1">
                  Empower your journey with professional tools...
                </p>
                <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
                  Explore our curated repository of career intelligence, wellness resources, and learning tools designed for your growth.
                </p>
              </div>
            </div>

            {/* Toolkit Status Card – Matching the "Centre" Pattern */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] border border-slate-50 flex items-center gap-10 min-w-[320px]">
              {/* <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Active</p>
                <h3 className="text-5xl font-black text-[#1a3884]">{toolkitSections.length}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Available Tools</p>
              </div> */}
              {/* <div className="h-16 w-px bg-slate-100" /> */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span className="text-sm font-bold text-slate-700">Verified Resources</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-sm font-bold text-slate-400">AI Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toolkit Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {toolkitSections.map((section, index) => (
              <ToolkitCard key={section.id} section={section} index={index} />
            ))}
          </div>

          {/* Guidelines Section – Matching the "Centre" Pattern */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-slate-800/40 rounded-[40px] border border-slate-100 dark:border-slate-700/30 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.05)] overflow-hidden relative group"
          >
            {/* Subtle background watermark */}
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
              <div className="w-80 h-80 rounded-full border-[40px] border-[#1a3884] flex items-center justify-center">
                <div className="w-12 h-40 bg-[#1a3884] rounded-full" />
              </div>
            </div>

            <div className="p-10 flex flex-col md:flex-row items-center gap-12 relative z-10">
              {/* Info Icon Box */}
              <div className="w-20 h-20 rounded-[28px] bg-[#eef2ff] border border-blue-100 flex items-center justify-center flex-shrink-0 text-[#4f46e5]">
                <Info className="w-10 h-10" />
              </div>

              <div className="flex-1 space-y-8">
                <h4 className="text-2xl font-black text-[#0f172a] tracking-tight">Toolkit Usage & Resources</h4>
                <div className="grid sm:grid-cols-2 gap-x-16 gap-y-8">
                  {[
                    { title: "INSTANT ACCESS", desc: "Explore all professional tools immediately without any prerequisites." },
                    { title: "AI ENHANCED", desc: "Leverage cutting-edge intelligence for your career and learning journey." },
                    { title: "SECURE VAULT", desc: "Your data, certificates and progress are safely stored in the Skills Vault." },
                    { title: "CONSTANT UPDATES", desc: "We are regularly adding new tools to help you succeed professionally." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] mt-2 flex-shrink-0" />
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em]">{item.title}</p>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
};

export default SMAArtToolkit;
