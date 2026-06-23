import { useState } from "react";
import { motion } from "framer-motion";
import {
  IconBriefcase as BookOpen,
  IconBook2 as BookText,
  IconArrowLeft as ArrowLeft,
  IconArrowRight as ArrowRight,
  IconFileDescription as FileText,
  IconNotes as StickyNote,
  IconListCheck as ListTodo,
  IconTool as Wrench,
  IconChevronDown as ChevronDown,
  IconChevronUp as ChevronUp,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

/* ─────────────────────────────────────────────────────────
   Tool definitions  (Career Agent removed as per request)
───────────────────────────────────────────────────────── */
const toolkitSections = [
  {
    id: 3,
    title: "SMAART AI Resume Builder",
    description:
      "Craft ATS-optimized resumes that stand out. Leverage AI to generate impactful summaries and role-specific content that maximizes your interview chances.",
    icon: FileText,
    path: "/dashboard/resume-builder",
    badge: "Professional",
    badgeColor: "#1a3884",
    cta: "Open Resume Builder",
    meta: "ATS + AI Writing",
    detail: "Build polished, recruiter-ready resumes with guided AI support and instant ATS score feedback.",
  },
  {
    id: 6,
    title: "General Dictionary",
    description:
      "Master professional terminology with our interactive dictionary. Features real-time definitions and daily vocabulary building tools.",
    icon: BookText,
    path: "/dashboard/dictionary",
    badge: "Reference",
    badgeColor: "#1a3884",
    cta: "Browse Dictionary",
    meta: "Definitions",
    detail: "Search meanings and vocabulary exercises to strengthen your professional language.",
  },
  {
    id: 8,
    title: "Interview Preparation",
    description:
      "Access role-specific interview questions, aptitude tests, and domain resources tailored to your selected career path.",
    icon: BookOpen,
    path: "/dashboard/interview-prep",
    badge: "Career",
    badgeColor: "#1a3884",
    cta: "Start Practicing",
    meta: "Aptitude + Domain + HR",
    detail: "Get fully equipped with Technical, Domain, and Behavioural questions synced to your Career Agent profile.",
  },
  // {
  //   id: 5,
  //   title: "Library",
  //   description:
  //     "Unlock a curated repository of knowledge. Explore essential books, industry articles, and learning tracks tailored to accelerate your personal and professional growth.",
  //   icon: BookOpen,
  //   path: "/dashboard/library",
  //   badge: "Resources",
  //   badgeColor: "#059669",
  //   cta: "Explore Library",
  //   meta: "Books + Articles",
  //   detail: "Access a hand-picked collection of reading material aligned to career tracks and industry standards.",
  // },
  {
    id: 7,
    title: "My Notes",
    description:
      "Capture, organize, and sync your thoughts. Keep track of course insights and personal breakthroughs in one secure, cloud-synced space.",
    icon: StickyNote,
    path: "/dashboard/notes",
    badge: "Productivity",
    badgeColor: "#1a3884",
    cta: "Open My Notes",
    meta: "Cloud Sync + Editor",
    detail: "Rich text notes with tagging, categorization, and full-text search — always in sync across devices.",
  },
  // {
  //   id: 9,
  //   title: "To-Do & Calendar",
  //   description:
  //     "Stay on top of your daily schedules and study deadlines. Add tasks, toggle active states, set automated reminders, and view everything dynamically inside an interactive monthly calendar sync.",
  //   icon: ListTodo,
  //   path: "/dashboard/todos",
  //   badge: "Productivity",
  //   badgeColor: "#d97706",
  //   cta: "Launch Tracker",
  //   meta: "Task List + Calendar Sync",
  //   detail: "Manage due tasks, trigger alert notifications, and navigate date-by-date schedules with ease.",
  // },
];




/* ─────────────────────────────────────────────────────────
   Toolkit Card
───────────────────────────────────────────────────────── */
const TRUNCATE_LENGTH = 100;

const ToolkitCard = ({ section, index }) => {
  const navigate = useNavigate();
  const Icon = section.icon;
  const [expanded, setExpanded] = useState(false);
  const isLong = section.description.length > TRUNCATE_LENGTH;
  const displayText =
    expanded || !isLong
      ? section.description
      : section.description.slice(0, TRUNCATE_LENGTH).trimEnd() + "…";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5 }}
      className="group h-full"
    >
      <div
        onClick={() => navigate(section.path)}
        className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-sm transition-all duration-300 hover:border-[#1a3884]/40 hover:shadow-md dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:hover:border-[#1a3884]/50"
      >

        <div className="relative z-10 flex flex-1 flex-col p-5">
          {/* Header row */}
          <div className="mb-4 flex items-start justify-between gap-3">
            {/* Icon */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1a3884] text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Icon size={18} stroke={1.5} />
            </div>
          </div>

          {/* Meta label */}
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1a3884]/60 dark:text-blue-400/60">
            {section.meta}
          </p>

          {/* Title */}
          <h3 className="mb-2.5 text-[15px] font-bold leading-snug tracking-tight text-[#0d1f4e] transition-colors group-hover:text-[#1a3884] dark:text-white dark:group-hover:text-blue-300">
            {section.title}
          </h3>

          {/* Description with Read More */}
          <div className="mb-1">
            <p className="text-[13px] leading-[1.7] text-slate-500 dark:text-slate-400">
              {displayText}
            </p>
            {isLong && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((p) => !p);
                }}
                className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-[#1a3884] transition-opacity hover:opacity-70 dark:text-blue-400"
              >
                {expanded ? (
                  <>
                    Show Less <ChevronUp size={13} stroke={1.5} />
                  </>
                ) : (
                  <>
                    Read More <ChevronDown size={13} stroke={1.5} />
                  </>
                )}
              </button>
            )}
          </div>





          {/* Spacer */}
          <div className="flex-1" />

          <div className="mt-4 mb-5 border-t border-[#e4edfa] dark:border-[#1a3884]/20" />

          {/* CTA Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(section.path);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] px-4 py-3 text-left transition-all duration-300 group-hover:border-[#1a3884] group-hover:bg-[#1a3884] active:scale-[0.98] dark:border-[#1a3884]/25 dark:bg-[#002060]/40 dark:group-hover:bg-[#1a3884]"
          >
            <div>
              <p className="text-[13px] font-semibold text-[#0d1f4e] transition-colors group-hover:text-white dark:text-slate-200 dark:group-hover:text-white">
                {section.cta}
              </p>
              <p className="text-[11px] text-slate-400 transition-colors group-hover:text-blue-100 dark:text-slate-500 dark:group-hover:text-blue-200">
                Launch from your toolkit
              </p>
            </div>
            <ArrowRight stroke={1.5} className="h-4 w-4 flex-shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-white" />
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
    <div className="min-h-screen bg-transparent pb-12 transition-colors duration-300">
      <div className="mx-auto max-w-7xl p-8">

        {/* Back Button - Mobile Only */}
        <div className="mb-4 md:hidden">
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
              <ArrowLeft stroke={1.5} className="h-4 w-4" />
            </div>
            {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
          </button>
        </div>

        {/* ── Hero Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
        >
          <div className="relative z-10">
            {/* Title */}
            <h1 className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
              SMAART <span className="text-[#1a3884] dark:text-blue-300">Toolkit</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Explore our curated repository of career intelligence, wellness resources, and learning tools.
            </p>
          </div>
        </motion.div>

        {/* ── Section label ── */}
        <div className="mb-4 flex items-center gap-3">
          <Wrench stroke={1.5} className="h-4 w-4 text-[#1a3884]/60 dark:text-blue-400/60" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1a3884]/60 dark:text-blue-400/60">
            Your Tools
          </p>
          <div className="h-px flex-1 bg-[#d8e6f7] dark:bg-[#1a3884]/20" />
        </div>

        {/* ── Tool Cards Grid ── */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {toolkitSections.map((section, index) => (
            <ToolkitCard key={section.id} section={section} index={index} />
          ))}
        </div>


      </div>
    </div>
  );
};

export default SMAArtToolkit;
