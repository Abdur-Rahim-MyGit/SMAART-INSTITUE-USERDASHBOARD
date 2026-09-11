import { memo, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles } from "@/components/icons";
import { apiCall } from "@/services/api";
import { WORDS, DOMAINS, classifyDomain } from "@/data/wordOfTheDay";
import { useTranslation } from "react-i18next";

// Same plain word for every student on a given calendar day, worldwide --
// a day-of-year index into the bank, stable regardless of time zone drift
// within the day (uses the viewer's local date, which is all "today" means
// to a person looking at a calendar widget).
const wordForToday = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / 86400000);
  return WORDS[dayOfYear % WORDS.length];
};

/**
 * Word of the Day — sits below the calendar/tasks card. Shows one everyday
 * word all students see today; tapping flips the card to reveal the
 * technical term for that same idea in the viewer's own locked career path.
 */
const WordOfTheDay = memo(() => {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  const [domain, setDomain] = useState("general");
  const [hasLockedPath, setHasLockedPath] = useState(false);

  const entry = useMemo(() => wordForToday(), []);
  const reveal = entry.terms[domain] || entry.terms.general;
  const domainLabel = DOMAINS[domain]?.label || DOMAINS.general.label;

  useEffect(() => {
    let cancelled = false;
    apiCall("/career-agent/final-pathway", { method: "GET" })
      .then((res) => {
        if (cancelled || !res?.found) return;
        const role = res.primary_role;
        if (role) {
          setDomain(classifyDomain(role));
          setHasLockedPath(!!res.is_locked);
        }
      })
      .catch(() => {
        // apiCall throws on any non-2xx response, so a student with no
        // pathway saved yet (a 404) lands here too -- the card still works,
        // it just shows the general professional term until they lock one.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-4 sm:mt-6">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-pressed={flipped}
        aria-label={
          flipped
            ? t("dashboard.word_of_day.flip_back", "Show the everyday word")
            : t("dashboard.word_of_day.flip_reveal", "Reveal the technical term for your career path")
        }
        className="group block w-full text-left [perspective:1200px]"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative h-[132px] w-full"
        >
          {/* Front — the shared everyday word */}
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-[#d7ebf5]/60 bg-white p-4 shadow-sm transition-colors group-hover:border-[#045C9A]/30 dark:border-white/[0.07] dark:bg-[#0d3a5f] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] dark:group-hover:border-[#A6D7E8]/25"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#045C9A] dark:text-[#A6D7E8]">
                <BookOpen className="h-3.5 w-3.5" />
                {t("dashboard.word_of_day.title", "Word of the Day")}
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {t("dashboard.word_of_day.tap_hint", "Tap to reveal")}
              </span>
            </div>
            <div>
              <p className="text-[19px] font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white">
                {entry.word}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-slate-500 dark:text-slate-400">
                {entry.meaning}
              </p>
            </div>
          </div>

          {/* Back — the career-path technical term */}
          <div
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-[#045C9A]/25 bg-[#EAF7FD] p-4 shadow-sm dark:border-[#A6D7E8]/20 dark:bg-[#045C9A]/15"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#045C9A] dark:text-[#A6D7E8]">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {hasLockedPath
                    ? domainLabel
                    : t("dashboard.word_of_day.general_hint", "Lock a career path for a tailored term")}
                </span>
              </span>
              <span className="shrink-0 text-[10px] font-medium text-[#045C9A]/70 dark:text-[#A6D7E8]/70">
                {t("dashboard.word_of_day.tap_hint_back", "Tap to flip back")}
              </span>
            </div>
            <div>
              <p className="text-[17px] font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white">
                {reveal.term}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-[#034a7d] dark:text-slate-300">
                {reveal.def}
              </p>
            </div>
          </div>
        </motion.div>
      </button>
    </div>
  );
});

WordOfTheDay.displayName = "WordOfTheDay";

export default WordOfTheDay;
