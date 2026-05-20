import { motion } from "framer-motion";
import { BookOpen, BookText, ArrowRight, FileText, Sparkles, Info, StickyNote, Compass, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";


const toolkitHighlights = [
  { label: "Curated tools", value: "05" },
  { label: "AI-supported", value: "03" },
  { label: "Instant access", value: "24/7" },
];


const toolkitSections = [
  {
    id: 8,
    title: "Career Agent",
    description:
      "AI-powered career intelligence engine. Get matched to ideal career directions based on your degree, skills, and ambitions. Explore role analysis, market insights, skill gaps, certifications, and a personalized roadmap — all in one place.",
    icon: Compass,
    path: "/dashboard/career-agent",
    color: "#1a3884",
    badge: "AI Powered",
    cta: "Launch Career Agent",
    meta: "Career Intelligence",
    detail: "Role analysis · skill gap · roadmap · certifications",
  },
  {
    id: 3,
    title: "SMAART AI Resume Builder",
    description:
      "Craft ATS-optimized resumes that stand out. Leverage AI to generate impactful summaries and role-specific content that maximizes your interview chances.",
    icon: FileText,
    path: "/dashboard/resume-builder",
    color: "#1a3884",
    badge: "Professional",
    cta: "Open Resume Builder",
    meta: "ATS + AI writing",
    detail: "Build polished resumes with guided AI support",
  },
  {
    id: 6,
    title: "General Dictionary",
    description:
      "Master professional terminology with our interactive dictionary. Features real-time definitions, audio pronunciation, and daily vocabulary building tools.",
    icon: BookText,
    path: "/dashboard/dictionary",
    color: "#1a3884",
    badge: "Reference",
    cta: "Browse Dictionary",
    meta: "Definitions + audio",
    detail: "Search meanings, pronunciation, and vocabulary help",
  },
  {
    id: 5,
    title: "Library",
    description:
      "Unlock a curated repository of knowledge. Explore essential books, industry articles, and learning tracks tailored to accelerate your personal and professional growth.",
    icon: BookOpen,
    path: "/dashboard/library",
    color: "#1a3884",
    badge: "Resources",
    cta: "Explore Library",
    meta: "Books + articles",
    detail: "Access curated reading for learning and career growth",
  },
  {
    id: 7,
    title: "My Notes",
    description:
      "Capture, organize, and sync your thoughts. Keep track of course insights and personal breakthroughs in one secure, cloud-synced space.",
    icon: StickyNote,
    path: "/dashboard/notes",
    color: "#1a3884",
    badge: "Productivity",
    cta: "Open My Notes",
    meta: "Cloud Sync + Editor",
    detail: "Rich text notes with categorization and search",
  },
];

const ToolkitCard = ({ section, index }) => {
  const navigate = useNavigate();
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group"
    >
    <div
        onClick={() => {
          if (section.path === '/dashboard/career-agent') {
            const path = localStorage.getItem('smaart_analysis_id') ? '/dashboard/career-agent/dashboard' : '/dashboard/career-agent/onboarding';
            navigate(path);
          } else {
            navigate(section.path);
          }
        }}
        className="relative h-full cursor-pointer overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.24)] transition-all duration-300 hover:border-slate-300 hover:shadow-[0_24px_50px_-30px_rgba(26,56,132,0.22)] dark:border-slate-700/50 dark:bg-slate-800/60 dark:hover:border-slate-600"
      >
        <div className="h-1 bg-[#1a3884] dark:bg-blue-600" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-[#edf3ff] via-white to-transparent dark:from-blue-950/40 dark:via-transparent dark:to-transparent" />
        <div className="absolute inset-px rounded-[23px] border border-white/70 opacity-70 dark:border-white/5" />

        <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#1a3884] text-white shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105 dark:bg-blue-600">
              <Icon size={20} strokeWidth={2} />
            </div>

            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1a3884] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
              {section.badge}
            </span>
          </div>

          <div className="mb-5 flex-1">
            <div className="rounded-2xl border border-slate-100/90 bg-white/75 p-4 dark:border-slate-700/40 dark:bg-slate-900/20">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{section.meta}</p>
                <h3 className="text-base font-semibold leading-snug tracking-[-0.02em] text-[#0f172a] transition-colors group-hover:text-[#1a3884] dark:text-white">
                  {section.title}
                </h3>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {section.description}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700/40">
                <p className="text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                  {section.detail}
                </p>
              </div>
            </div>
          </div>

          <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-left transition-all duration-300 group-hover:border-[#1a3884] group-hover:bg-[#1a3884] active:scale-[0.98] dark:border-slate-600/40 dark:bg-slate-700/40">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-white dark:text-slate-200">
                {section.cta}
              </p>
              <p className="text-xs text-slate-400 transition-colors group-hover:text-blue-100 dark:text-slate-400">
                Launch from your toolkit
              </p>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const SMAArtToolkit = () => {
  return (
    <div className="space-y-6">
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative self-start overflow-hidden rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] sm:p-8 dark:border-slate-700/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40">
              <div className="absolute inset-px rounded-[27px] border border-white/70 dark:border-white/5" />
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#d8e6ff] blur-3xl dark:bg-blue-700/10" />
              <div className="relative z-10 space-y-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4f46e5] shadow-sm dark:border-blue-500/20 dark:bg-slate-900/50">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full border border-[#4f46e5]/20 bg-[#4f46e5]/10">
                    <Sparkles className="h-2.5 w-2.5" />
                  </div>
                  Intelligence Suite
                </div>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-[2rem] font-black tracking-tight text-[#0f172a] sm:text-[2.35rem] lg:text-[2.5rem] lg:leading-[1.04] dark:text-white">
                    SMAART - <span className="text-[#1a3884]">Toolkit</span>
                  </h1>
                  <p className="max-w-xl text-base font-medium tracking-[0.01em] text-[#3654a1] dark:text-[#d7def0] sm:text-lg">
                    Premium learning utilities with cleaner navigation and faster action.
                  </p>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Explore our curated repository of career intelligence, wellness resources, and learning tools designed for your growth.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative self-start overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.28)] dark:border-slate-700/40 dark:bg-slate-900/80">
              <div className="absolute inset-px rounded-[23px] border border-white/70 dark:border-white/5" />
              <div className="relative z-10 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Inside the toolkit</p>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">Focused tools, cleaner access</h2>
                <p className="max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Everything here is organized for quick launch, low friction, and a cleaner working flow.
                </p>
              </div>
              <div className="relative z-10 mt-6 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800/70">
                  <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Verified resources</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800/70">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">AI-enabled workflows</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800/70">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Quick launch actions</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {toolkitSections.map((section, index) => (
              <ToolkitCard key={section.id} section={section} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_50px_-34px_rgba(15,23,42,0.25)] dark:border-slate-700/30 dark:bg-slate-800/40"
          >
            <div className="absolute inset-px rounded-[27px] border border-white/70 dark:border-white/5" />
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
              <div className="w-80 h-80 rounded-full border-[40px] border-[#1a3884] flex items-center justify-center">
                <div className="w-12 h-40 bg-[#1a3884] rounded-full" />
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-7 md:flex-row md:items-start">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] border border-blue-100 bg-[#eef2ff] text-[#4f46e5]">
                <Info className="h-8 w-8" />
              </div>

              <div className="flex-1 space-y-5">
                <h4 className="text-lg font-semibold tracking-[-0.03em] text-[#0f172a] dark:text-white">Toolkit Usage & Resources</h4>
                <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                  {[
                    { title: "INSTANT ACCESS", desc: "Explore all professional tools immediately without any prerequisites." },
                    { title: "AI ENHANCED", desc: "Leverage cutting-edge intelligence for your career and learning journey." },
                    { title: "SECURE ACCESS", desc: "Your tools, resources, and learning progress are organized in one secure place." },
                    { title: "CONSTANT UPDATES", desc: "We are regularly adding new tools to help you succeed professionally." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4f46e5]" />
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f172a] dark:text-slate-100">{item.title}</p>
                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{item.desc}</p>
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
