import { X } from "lucide-react";
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_DATE_RANGES,
  COMMUNITY_SORTS,
  COMMUNITY_VIEWS,
} from "@/components/community/community-utils";
import { cn } from "@/lib/utils";

/**
 * Renders the shared community filter controls for desktop and mobile.
 *
 * @param {{
 *   view: string,
 *   category: string,
 *   sortBy: string,
 *   dateRange: string,
 *   onViewChange: (value: string) => void,
 *   onCategoryChange: (value: string) => void,
 *   onSortChange: (value: string) => void,
 *   onDateRangeChange: (value: string) => void,
 *   onClearFilters: () => void,
 * }} props - Filter panel props.
 * @returns {import("react").JSX.Element} Filter controls.
 */
const FilterPanel = ({
  view,
  category,
  sortBy,
  dateRange,
  onViewChange,
  onCategoryChange,
  onSortChange,
  onDateRangeChange,
  onClearFilters,
}) => {
  const hasActiveFilters =
    view !== "all" ||
    category !== "all" ||
    sortBy !== "newest" ||
    dateRange !== "all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium tracking-[0.04em] text-[hsl(var(--lms-text-muted))]">
            Filters
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--lms-text-muted))]">
            Combine view, topic, date, and sort to narrow discussions.
          </p>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="tap-target inline-flex items-center gap-2 text-[13px] font-medium text-[hsl(var(--lms-text-muted))] transition-colors hover:text-[hsl(var(--lms-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <X className="h-4 w-4" />
            Clear all filters
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
          {COMMUNITY_VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewChange(option.value)}
              aria-pressed={view === option.value}
              className={cn(
                "tap-target shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                view === option.value
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-slate-200 bg-slate-50/70 text-[hsl(var(--lms-primary))] hover:border-slate-300 hover:bg-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[13px] font-medium tracking-[0.04em] text-[hsl(var(--lms-text-muted))]">
            Topic
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
            {COMMUNITY_CATEGORIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onCategoryChange(option.value)}
                aria-pressed={category === option.value}
                className={cn(
                  "tap-target shrink-0 rounded-full border px-[14px] py-[6px] text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                  category === option.value
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-slate-200 bg-slate-50/70 text-[hsl(var(--lms-primary))] hover:border-slate-300 hover:bg-white",
                )}
              >
                <span aria-hidden="true" className="mr-1">{option.emoji}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[hsl(var(--lms-text-muted))]">
              Date range
            </label>
            <select
              value={dateRange}
              onChange={(event) => onDateRangeChange(event.target.value)}
              className="h-10 w-full rounded-[12px] border border-slate-200 bg-slate-50/75 px-3 text-[13px] text-[hsl(var(--lms-primary))] transition-all hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              {COMMUNITY_DATE_RANGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[hsl(var(--lms-text-muted))]">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value)}
              className="h-10 w-full rounded-[12px] border border-slate-200 bg-slate-50/75 px-3 text-[13px] text-[hsl(var(--lms-primary))] transition-all hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              {COMMUNITY_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
