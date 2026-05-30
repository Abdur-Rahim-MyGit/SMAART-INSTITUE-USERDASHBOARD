import { motion } from "framer-motion";
import { BookOpen, BookText, ArrowLeft, ArrowRight, FileText, Sparkles, Info, StickyNote, Compass, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHero from "@/components/ui/PageHero";
import { useTranslation } from "react-i18next";


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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const Icon = section.icon;

  let sectionKey = "";
  if (section.path.includes("career-agent")) sectionKey = "career_agent";
  else if (section.path.includes("resume-builder")) sectionKey = "resume_builder";
  else if (section.path.includes("dictionary")) sectionKey = "dictionary";
  else if (section.path.includes("library")) sectionKey = "library";
  else if (section.path.includes("notes")) sectionKey = "notes";

  const title = t(`toolkit.sections.${sectionKey}.title`, section.title);
  const description = t(`toolkit.sections.${sectionKey}.description`, section.description);
  const badge = t(`toolkit.sections.${sectionKey}.badge`, section.badge);
  const cta = t(`toolkit.sections.${sectionKey}.cta`, section.cta);
  const meta = t(`toolkit.sections.${sectionKey}.meta`, section.meta);
  const detail = t(`toolkit.sections.${sectionKey}.detail`, section.detail);

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
        <div className="h-1 bg-[#1a3884] dark:bg-[#1a3884]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-[#edf3ff] via-white to-transparent dark:from-blue-950/40 dark:via-transparent dark:to-transparent" />
        <div className="absolute inset-px rounded-[23px] border border-white/70 opacity-70 dark:border-white/5" />

        <div className="relative z-10 flex h-full flex-col p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#1a3884] text-white shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-105 dark:bg-[#1a3884]">
              <Icon size={20} strokeWidth={2} />
            </div>

            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1a3884] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
              {badge}
            </span>
          </div>

          <div className="mb-5 flex-1">
            <div className="rounded-2xl border border-slate-100/90 bg-white/75 p-4 dark:border-slate-700/40 dark:bg-slate-900/20">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{meta}</p>
                <h3 className="text-base font-semibold leading-snug tracking-[-0.02em] text-[#0f172a] transition-colors group-hover:text-[#1a3884] dark:text-white">
                  {title}
                </h3>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700/40">
                <p className="text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                  {detail}
                </p>
              </div>
            </div>
          </div>

          <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-left transition-all duration-300 group-hover:border-[#1a3884] group-hover:bg-[#1a3884] active:scale-[0.98] dark:border-slate-600/40 dark:bg-slate-700/40">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-white dark:text-slate-200">
                {cta}
              </p>
              <p className="text-xs text-slate-400 transition-colors group-hover:text-blue-100 dark:text-slate-400">
                {t("toolkit.launch_cta", "Launch from your toolkit")}
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
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300 min-h-screen pt-4 pb-8">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto mb-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="group flex items-center gap-3 text-[#112b6b] dark:text-slate-300 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#1a3884] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
        </button>
      </div>

      <main className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* ── Standardized PageHero ── */}
          <PageHero
            badge={t("toolkit.hero_badge", "Intelligence Suite")}
            title={t("toolkit.hero_title", "SMAART Toolkit")}
            subtitle={t("toolkit.hero_subtitle", "Explore our curated repository of career intelligence, wellness resources, and learning tools designed for your growth.")}
          />

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
                <h4 className="text-lg font-semibold tracking-[-0.03em] text-[#0f172a] dark:text-white">
                  {t("toolkit.usage_title", "Toolkit Usage & Resources")}
                </h4>
                <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                  {[
                    { key: "instant_access", title: "INSTANT ACCESS", desc: "Explore all professional tools immediately without any prerequisites." },
                    { key: "ai_enhanced", title: "AI ENHANCED", desc: "Leverage cutting-edge intelligence for your career and learning journey." },
                    { key: "secure_access", title: "SECURE ACCESS", desc: "Your tools, resources, and learning progress are organized in one secure place." },
                    { key: "constant_updates", title: "CONSTANT UPDATES", desc: "We are regularly adding new tools to help you succeed professionally." },
                  ].map((item, i) => {
                    const localizedTitle = t(`toolkit.usage_items.${item.key}.title`, item.title);
                    const localizedDesc = t(`toolkit.usage_items.${item.key}.desc`, item.desc);
                    return (
                      <div key={i} className="flex gap-4">
                        <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4f46e5]" />
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f172a] dark:text-slate-100">{localizedTitle}</p>
                          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{localizedDesc}</p>
                        </div>
                      </div>
                    );
                  })}
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
