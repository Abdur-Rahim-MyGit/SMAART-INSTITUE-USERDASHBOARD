import { Loader2, Search, X } from "lucide-react";

/**
 * Renders the community search input with clear and keyboard support.
 *
 * @param {{
 *   value: string,
 *   onChange: (nextValue: string) => void,
 *   onClear: () => void,
 *   loading?: boolean,
 * }} props - Search bar props.
 * @returns {import("react").JSX.Element} Search control row.
 */
const SearchBar = ({
  value,
  onChange,
  onClear,
  loading = false,
}) => {
  return (
    <div className="w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--lms-text-muted))]" />
        <input
          id="community-search"
          type="search"
          value={value}
          aria-label="Search community"
          placeholder="Search posts, people, and discussions..."
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && value) {
              onClear();
            }
          }}
          className="h-12 w-full rounded-[14px] border border-slate-200 bg-slate-50/70 pl-12 pr-12 text-[15px] text-[hsl(var(--lms-primary))] transition-all placeholder:text-[hsl(var(--lms-text-muted))] hover:border-slate-300 hover:bg-white focus:border-primary focus:bg-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10"
        />

        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : value ? (
            <button
              type="button"
              onClick={onClear}
              className="tap-target inline-flex items-center justify-center rounded-md text-[hsl(var(--lms-text-muted))] transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
