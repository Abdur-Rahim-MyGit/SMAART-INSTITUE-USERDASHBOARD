import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Images, Loader2, Lock, Target } from "@/components/icons";
import { getSharedVisionBoard } from "../services/visionBoardProApi";
import { goalProgress } from "../utils/goals";
import GoalChecklist, { GoalMeter } from "../components/GoalChecklist";

const SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const CHIP_BRAND =
  "bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]";

const formatDate = (value) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

/**
 * Public, read-only view of a shared board. No login, no dashboard chrome —
 * a mentor or parent opens the link (or scans the QR) and sees the board and
 * its goals exactly as the student left them.
 */
const SharedVisionBoard = () => {
  const { token } = useParams();
  const { t } = useTranslation();
  const [board, setBoard] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | missing

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getSharedVisionBoard(token);
        if (cancelled) return;
        if (result?.data) {
          setBoard(result.data);
          setStatus("ok");
        } else {
          setStatus("missing");
        }
      } catch {
        if (!cancelled) setStatus("missing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const progress = board ? goalProgress(board) : null;
  const updated = board ? formatDate(board.updatedAt || board.createdAt) : null;

  return (
    <main className="min-h-screen bg-[#F1F5F9] px-4 py-6 text-[#16324a] transition-colors dark:bg-[#072036] dark:text-slate-200 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#045C9A] dark:text-[#A6D7E8]">
            <span className="h-2 w-2 rounded-full bg-[#045C9A] dark:bg-[#A6D7E8]" />
            SMAART Institute
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {t("vision_board.shared_board", "Shared vision board")}
          </span>
        </div>

        {status === "loading" && (
          <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-24 ${SURFACE}`}>
            <Loader2 className="h-9 w-9 animate-spin text-[#045C9A] dark:text-[#A6D7E8]" />
            <p className="text-sm font-medium text-[#35566b] dark:text-slate-400">{t("vision_board.loading_boards")}</p>
          </div>
        )}

        {status === "missing" && (
          <div className={`flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center ${SURFACE}`}>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9] text-slate-400 dark:bg-white/[0.06]">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#072036] dark:text-white">
              {t("vision_board.shared_missing", "This board isn't shared")}
            </h1>
            <p className="mt-2 max-w-md text-sm text-[#35566b] dark:text-slate-400">
              {t("vision_board.shared_missing_desc", "The link may have been turned off by its owner, or it was typed incorrectly.")}
            </p>
          </div>
        )}

        {status === "ok" && board && (
          <>
            <section className={`relative overflow-hidden rounded-2xl ${SURFACE}`}>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />
              <div className="relative z-10 flex flex-col gap-4 px-6 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 max-w-2xl">
                  <span className={`mb-2 inline-flex items-center rounded-md px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider ${CHIP_BRAND}`}>
                    {board.ownerName
                      ? t("vision_board.shared_by", { name: board.ownerName, defaultValue: "Shared by {{name}}" })
                      : t("vision_board.shared_board", "Shared vision board")}
                  </span>
                  <h1 className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
                    {board.title}
                  </h1>
                  {board.description && (
                    <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">{board.description}</p>
                  )}
                  {updated && (
                    <p className="mt-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {t("vision_board.last_updated", { date: updated, defaultValue: "Last updated {{date}}" })}
                    </p>
                  )}
                </div>
                {progress?.total > 0 && (
                  <div className="w-full shrink-0 lg:w-64">
                    <GoalMeter progress={progress} />
                  </div>
                )}
              </div>
            </section>

            <section className={`overflow-hidden rounded-2xl ${SURFACE}`}>
              <div className="flex min-h-[240px] items-center justify-center bg-[#F1F5F9] p-4 dark:bg-[#072036]/60 sm:p-6">
                {board.collageImage ? (
                  <img
                    src={board.collageImage}
                    alt={board.title}
                    className="max-h-[70vh] max-w-full rounded-xl border border-white/80 object-contain shadow-[0_24px_60px_-20px_rgba(7,32,54,0.35)] dark:border-white/10"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                    <Images className="h-12 w-12" />
                  </div>
                )}
              </div>
            </section>

            {progress?.total > 0 && (
              <section className={`rounded-2xl p-5 sm:p-6 ${SURFACE}`}>
                <div className="mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#045C9A] dark:text-[#A6D7E8]" />
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#072036] dark:text-white">
                    {t("vision_board.goals", "Goals")}
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <GoalChecklist title={t("vision_board.short_term_goals", "Short-term goals")} goals={board.shortTermGoals} emptyText={t("vision_board.no_goals_yet", "No goals yet.")} />
                  <GoalChecklist title={t("vision_board.long_term_goals", "Long-term goals")} goals={board.longTermGoals} accent="emerald" emptyText={t("vision_board.no_goals_yet", "No goals yet.")} />
                </div>
              </section>
            )}
          </>
        )}

        <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t("vision_board.designed_in", "Designed in Vision Board Studio")}
        </p>
      </div>
    </main>
  );
};

export default SharedVisionBoard;
