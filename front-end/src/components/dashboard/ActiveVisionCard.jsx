import React, { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Edit, Images, Target } from "@/components/icons";
import { getActiveVision, saveVisionBoardGoals } from "@/features/visionBoard/services/visionBoardProApi";
import { goalProgress, normalizeGoals, toggleGoalAt } from "@/features/visionBoard/utils/goals";
import GoalChecklist, { GoalMeter } from "@/features/visionBoard/components/GoalChecklist";

const SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#072036] text-xs font-bold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] text-xs font-bold text-slate-600 transition-colors hover:border-[#045C9A]/30 hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";
const EASE = [0.25, 0.1, 0.25, 1];

const SectionHeading = ({ children }) => (
  <div className="mb-4 flex items-center gap-2.5">
    <span className="h-4 w-[3px] shrink-0 rounded-full bg-[#045C9A]" />
    <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-[#072036] dark:text-slate-300">{children}</h2>
  </div>
);

/**
 * The board a student marked "Set Active" in the gallery, with its goals as a
 * live checklist. Ticking a goal saves straight to the board.
 */
const ActiveVisionCard = memo(() => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [vision, setVision] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getActiveVision()
      .then((res) => {
        if (!cancelled && res?.data) setVision(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (listKey, index) => {
    if (!vision) return;
    const previous = vision;
    const next = { ...vision, [listKey]: toggleGoalAt(vision[listKey], index) };
    setVision(next);
    try {
      await saveVisionBoardGoals(vision.id, {
        shortTermGoals: normalizeGoals(next.shortTermGoals),
        longTermGoals: normalizeGoals(next.longTermGoals),
      });
    } catch (error) {
      setVision(previous);
      toast({ title: "Error", description: error.message || "Could not save that goal", variant: "destructive" });
    }
  };

  if (loading) return null;

  if (!vision) {
    return (
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <SectionHeading>{t("dashboard.my_vision", "My Vision")}</SectionHeading>
        <div className={`flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between ${SURFACE}`}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/25 dark:text-[#A6D7E8]">
              <Images className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#072036] dark:text-white">{t("dashboard.vision_empty_title", "No active vision board yet")}</p>
              <p className="text-xs text-[#35566b] dark:text-slate-400">{t("dashboard.vision_empty_desc", "Build a board with your goals and set it active to track them here.")}</p>
            </div>
          </div>
          <button type="button" onClick={() => navigate("/dashboard/vision-boards")} className={`${BTN_PRIMARY} h-9 shrink-0 px-4`}>
            {t("dashboard.vision_create", "Create vision board")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.section>
    );
  }

  const progress = goalProgress(vision);

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
      <SectionHeading>{t("dashboard.my_vision", "My Vision")}</SectionHeading>
      <div className={`overflow-hidden rounded-2xl ${SURFACE}`}>
        <div className="flex flex-col md:flex-row">
          <button
            type="button"
            onClick={() => navigate(`/vision-board/view/${vision.id}`)}
            aria-label={t("dashboard.vision_open", "Open board")}
            className="group relative aspect-[4/3] w-full overflow-hidden bg-[#F1F5F9] dark:bg-[#072036]/60 md:aspect-auto md:w-[260px] md:shrink-0 lg:w-[300px]"
          >
            {vision.image ? (
              <img src={vision.image} alt={vision.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                <Images className="h-12 w-12" />
              </span>
            )}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#045C9A] shadow-sm backdrop-blur dark:bg-[#072036]/90 dark:text-[#A6D7E8]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#045C9A] dark:bg-[#A6D7E8]" />
              {t("vision_board.active_vision", "Active Vision")}
            </span>
          </button>

          <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-[16px] font-extrabold tracking-tight text-[#072036] dark:text-white" title={vision.title}>
                  {vision.title}
                </h3>
                {vision.description && (
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-[#35566b] dark:text-slate-400">{vision.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/vision-board-pro/create", { state: { isEditing: true, boardId: vision.id } })}
                  className={`${BTN_GHOST} h-8 px-3`}
                >
                  <Edit className="h-3.5 w-3.5" />
                  {t("vision_board.edit", "Edit")}
                </button>
                <button type="button" onClick={() => navigate("/dashboard/vision-boards")} className={`${BTN_GHOST} h-8 px-3`}>
                  {t("dashboard.vision_gallery", "Gallery")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {progress.total > 0 ? (
              <>
                <GoalMeter progress={progress} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <GoalChecklist
                    title={t("vision_board.short_term_goals", "Short-term goals")}
                    goals={vision.shortTermGoals}
                    onToggle={(i) => toggle("shortTermGoals", i)}
                    limit={4}
                    emptyText={t("vision_board.no_goals_yet", "No goals yet.")}
                  />
                  <GoalChecklist
                    title={t("vision_board.long_term_goals", "Long-term goals")}
                    goals={vision.longTermGoals}
                    onToggle={(i) => toggle("longTermGoals", i)}
                    accent="emerald"
                    limit={4}
                    emptyText={t("vision_board.no_goals_yet", "No goals yet.")}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#d7ebf5] px-4 py-3 dark:border-white/10">
                <Target className="h-5 w-5 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                <p className="text-xs text-[#35566b] dark:text-slate-400">
                  {t("dashboard.vision_no_goals", "Add short-term and long-term goals in the editor's Goals panel to track them here.")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
});

ActiveVisionCard.displayName = "ActiveVisionCard";

export default ActiveVisionCard;
