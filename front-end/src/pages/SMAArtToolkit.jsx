import { motion } from "framer-motion";
// Material Symbols barrel -- the icon set the dashboard, courses,
// assessments, dictionary and notes pages use, so this page's glyphs
// sit at the same weight instead of the heavier Tabler set it used before.
import {
  FileText,
  BookOpen,
  Mic,
  StickyNote,
  Calculator,
  Wrench,
  ArrowRight,
  IconArrowLeft as ArrowLeft,
} from "@/components/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";

/* ─────────────────────────────────────────────────────────
   Tool definitions -- copy kept in sync with what each tool
   actually does today (Resume Builder dropped its ATS score,
   Dictionary gained synonyms/antonyms/rhymes, Notes gained
   checklists/tags/pinning), so the card never promises
   something the tool doesn't have.
───────────────────────────────────────────────────────── */
const toolkitSections = [
  {
    id: 3,
    slug: "resume_builder",
    title: "SMAART AI Resume Builder",
    description:
      "Build a polished, recruiter-ready resume from five professional templates, with AI-assisted summaries and skill suggestions synced to your career path.",
    icon: FileText,
    path: "/dashboard/resume-builder",
    cta: "Open Resume Builder",
    meta: "Templates + AI Writing",
  },
  {
    id: 6,
    slug: "dictionary",
    title: "General Dictionary",
    description:
      "Look up definitions, pronunciation, synonyms, antonyms and rhymes, then build your vocabulary with Word of the Day and flashcards.",
    icon: BookOpen,
    path: "/dashboard/dictionary",
    cta: "Browse Dictionary",
    meta: "Definitions + Vocabulary",
  },
  {
    id: 8,
    slug: "interview_prep",
    title: "Interview Preparation",
    description:
      "Practice role-specific interview questions, aptitude tests, and domain resources tailored to your selected career path.",
    icon: Mic,
    path: "/dashboard/interview-prep",
    cta: "Start Practicing",
    meta: "Aptitude + Domain + HR",
  },
  {
    id: 7,
    slug: "notes",
    title: "My Notes",
    description:
      "Capture notes or checklists, tag and pin what matters, color-code your workspace, and export or copy anytime -- always in sync.",
    icon: StickyNote,
    path: "/dashboard/notes",
    cta: "Open My Notes",
    meta: "Notes + Checklists + Tags",
  },
  {
    id: 10,
    slug: "cgpa_calculator",
    title: "CGPA Calculator",
    description:
      "Calculate your CGPA effortlessly. Paste your result table directly from your university portal, and instantly compute Slab-Based, Continuous, and Equal-Credit results.",
    icon: Calculator,
    path: "/dashboard/cgpa-calculator",
    cta: "Open Calculator",
    meta: "Smart Paste + 3 Methods",
  },
];

/* ─────────────────────────────────────────────────────────
   Toolkit Card -- same anatomy as the Assessments stage card
   (icon + title/meta row, full description, full-width footer
   button): no truncation, no per-card badge, so it reads as
   part of the same product instead of its own thing.
───────────────────────────────────────────────────────── */
const ToolkitCard = ({ section, index }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const Icon = section.icon;

  const title = t(`smaart_toolkit.tools.${section.slug}.title`, section.title);
  const meta = t(`smaart_toolkit.tools.${section.slug}.meta`, section.meta);
  const cta = t(`smaart_toolkit.tools.${section.slug}.cta`, section.cta);
  const description = t(`smaart_toolkit.tools.${section.slug}.description`, section.description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.06, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="group h-full"
    >
      <div
        onClick={() => navigate(section.path)}
        className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#d7ebf5] bg-white shadow-[0_2px_16px_rgba(4,92,154,0.05)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#045C9A]/30 hover:shadow-[0_6px_20px_rgba(4,92,154,0.10)] motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-[#0d3a5f]"
      >
        <div className="flex h-full flex-col p-5 sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] shadow-sm dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-base font-bold leading-tight tracking-tight text-[#072036] dark:text-white">
                {title}
              </h3>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {meta}
              </p>
            </div>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>

          <div className="flex-1" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(section.path);
            }}
            className="group/btn mt-auto flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#045C9A] text-[13px] font-semibold text-white transition-colors hover:bg-[#072036]"
          >
            {cta}
            <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */
const SMAArtToolkit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <PageTransition>
    <div className="relative min-h-screen overflow-hidden bg-transparent pb-12 transition-colors duration-300">
      {/* Same ambient layer as the dashboard, courses, assessments,
          dictionary and notes pages */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
        <NeuralBackground theme={typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
        <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">

        {/* Back Button - Mobile Only */}
        <div className="mb-4 md:hidden">
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-3 w-fit"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5">
              <ArrowLeft className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
              {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
            </span>
          </button>
        </div>

        {/* Hero -- same structure, padding and type scale as the
            courses/assessments/dictionary/notes hero. */}
        <motion.section
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative mb-6 w-full overflow-hidden rounded-2xl border border-[#d7ebf5]/80 bg-white shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />

          <div className="relative z-10 flex items-center gap-4 px-6 py-5 sm:px-8 sm:py-6">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] shadow-sm dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
              <Wrench className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
                style={{ letterSpacing: "-0.02em" }}
              >
                {t("smaart_toolkit.title_1", "SMAART")}{" "}
                <span className="text-[#045C9A] dark:text-[#A6D7E8]">{t("smaart_toolkit.title_2", "Toolkit")}</span>
              </h1>
              <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                {t("smaart_toolkit.subtitle", "Explore our curated repository of career intelligence, wellness resources, and learning tools.")}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-4 flex items-center gap-3"
        >
          <Wrench className="h-4 w-4 text-[#045C9A]/60 dark:text-[#A6D7E8]/60" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#045C9A]/60 dark:text-[#A6D7E8]/60">
            {t("smaart_toolkit.your_tools", "Your Tools")}
          </p>
          <div className="h-px flex-1 bg-[#d7ebf5] dark:bg-white/10" />
        </motion.div>

        {/* Tool Cards Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {toolkitSections.map((section, index) => (
            <ToolkitCard key={section.id} section={section} index={index} />
          ))}
        </div>

      </div>
    </div>
    </PageTransition>
  );
};

export default SMAArtToolkit;
