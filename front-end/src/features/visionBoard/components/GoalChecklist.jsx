import React from "react";
import { useTranslation } from "react-i18next";
import { Check, Target } from "@/components/icons";
import { normalizeGoals } from "../utils/goals";

export const GoalMeter = ({ progress, className = "" }) => {
  const { t } = useTranslation();
  if (!progress?.total) return null;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-[10.5px] font-bold text-[#35566b] dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Target className="h-3.5 w-3.5 text-[#045C9A] dark:text-[#A6D7E8]" />
          {t("vision_board.goals_done", { done: progress.done, total: progress.total, defaultValue: "{{done}} of {{total}} goals done" })}
        </span>
        <span className="tabular-nums">{progress.pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#A6D7E8]/40 dark:bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${progress.pct}%`, background: "linear-gradient(90deg,#034a7d 0%,#045C9A 100%)" }}
        />
      </div>
    </div>
  );
};

/**
 * One goal list. `onToggle(index)` makes it interactive; leave it out for a
 * read-only view (the public share page).
 */
const GoalChecklist = ({ title, goals, onToggle, accent = "brand", emptyText, limit }) => {
  const list = normalizeGoals(goals);
  const shown = limit ? list.slice(0, limit) : list;
  const hidden = list.length - shown.length;
  const tone =
    accent === "emerald"
      ? { dot: "bg-emerald-600 border-emerald-600", ring: "border-emerald-300 dark:border-emerald-500/40", text: "text-emerald-700 dark:text-emerald-300" }
      : { dot: "bg-[#045C9A] border-[#045C9A]", ring: "border-[#A6D7E8] dark:border-[#A6D7E8]/40", text: "text-[#045C9A] dark:text-[#A6D7E8]" };

  return (
    <div>
      {title && (
        <p className={`mb-2 text-[10px] font-extrabold uppercase tracking-widest ${tone.text}`}>
          {title}
          <span className="ml-1.5 font-bold text-slate-400 dark:text-slate-500">
            {list.filter((g) => g.done).length}/{list.length}
          </span>
        </p>
      )}
      {list.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((goal, index) => {
            const Tag = onToggle ? "button" : "div";
            return (
              <li key={`${index}-${goal.text}`}>
                <Tag
                  {...(onToggle ? { type: "button", onClick: () => onToggle(index), "aria-pressed": goal.done } : {})}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                    onToggle ? "hover:bg-[#EAF7FD] dark:hover:bg-white/[0.06]" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      goal.done ? `${tone.dot} text-white` : `${tone.ring} bg-white dark:bg-transparent`
                    }`}
                  >
                    {goal.done && <Check className="h-3 w-3" />}
                  </span>
                  <span className={`text-[12.5px] leading-snug ${goal.done ? "text-slate-400 line-through dark:text-slate-500" : "text-[#16324a] dark:text-slate-200"}`}>
                    {goal.text}
                  </span>
                </Tag>
              </li>
            );
          })}
          {hidden > 0 && (
            <li className="px-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">+{hidden} more</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default GoalChecklist;
