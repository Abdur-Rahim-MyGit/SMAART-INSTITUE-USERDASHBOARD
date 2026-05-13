import { useState } from "react";
import {
  BellRing,
  GraduationCap,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Timestamp from "@/components/community/Timestamp";
import {
  getAuthorName,
  getInitials,
  highlightText,
} from "@/components/community/community-utils";

/**
 * Resolves the secondary line shown for a person match result.
 *
 * @param {Record<string, unknown>} person - Matched user record.
 * @returns {string} Human-readable role or title.
 */
function getPersonSubtitle(person) {
  return person?.title || person?.role || "Community member";
}

/**
 * Resolves the display name for an announcement author.
 *
 * @param {Record<string, unknown>} announcement - Notice payload.
 * @returns {string} Best-effort author name.
 */
function getAnnouncementAuthorName(announcement) {
  return (
    announcement?.createdById?.fullName ||
    announcement?.createdById?.name ||
    (announcement?.createdByRole === "admin" ? "SMAART Admin" : "College Admin")
  );
}

/**
 * Resolves the audience tag shown on a notice card.
 *
 * @param {Record<string, unknown>} announcement - Notice payload.
 * @returns {string} Human-readable audience label.
 */
function getAnnouncementAudience(announcement) {
  if (announcement?.targetType === "all") {
    return "All Students";
  }

  if (announcement?.targetType === "college") {
    return "College Updates";
  }

  return "Community";
}

/**
 * Builds the visual style classes for a notice card.
 *
 * @param {Record<string, unknown>} announcement - Notice payload.
 * @returns {{accent: string, badge: string, label: string}} Notice style metadata.
 */
function getNoticeStyle(announcement) {
  if (announcement?.isPinned) {
    return {
      accent: "border-l-amber-400",
      badge: "border border-amber-200 bg-amber-50 text-amber-800",
      label: "Pinned",
    };
  }

  if (announcement?.createdByRole === "admin") {
    return {
      accent: "border-l-red-400",
      badge: "border border-red-200 bg-red-50 text-red-800",
      label: "Official",
    };
  }

  return {
    accent: "border-l-blue-400",
    badge: "border border-blue-200 bg-blue-50 text-blue-800",
    label: "Notice",
  };
}

/**
 * Renders the right-hand sidebar with people matches and official notices.
 *
 * @param {{
 *   now: number,
 *   peopleQuery: string,
 *   userMatches: Array<Record<string, unknown>>,
 *   userMatchesLoading?: boolean,
 *   announcements: Array<Record<string, unknown>>,
 *   announcementsLoading?: boolean,
 *   onPeopleQueryChange: (value: string) => void,
 * }} props - Sidebar data props.
 * @returns {import("react").JSX.Element} Community sidebar.
 */
const CommunitySidebar = ({
  now,
  peopleQuery,
  userMatches,
  userMatchesLoading = false,
  announcements,
  announcementsLoading = false,
  onPeopleQueryChange,
}) => {
  const [expandedNotices, setExpandedNotices] = useState({});

  /**
   * Toggles a single notice card between collapsed and expanded states.
   *
   * @param {string} noticeId - Target notice id.
   * @returns {void} Updates the local expansion map.
   */
  function handleNoticeToggle(noticeId) {
    setExpandedNotices((currentState) => ({
      ...currentState,
      [noticeId]: !currentState[noticeId],
    }));
  }

  return (
    <aside className="space-y-4">
      <section className="community-surface rounded-[24px] px-4 py-[14px]">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-[hsl(var(--lms-primary))]">
              People matches
            </h3>
            <p className="mt-1 text-[15px] leading-[1.6] text-[hsl(var(--lms-text-muted))]">
              Search by name to quickly find community members related to your discussion.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--lms-text-muted))]" />
            <input
              type="search"
              value={peopleQuery}
              onChange={(event) => onPeopleQueryChange(event.target.value)}
              placeholder="Search people by name..."
              className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50/75 pl-10 pr-10 text-[14px] text-[hsl(var(--lms-primary))] transition-all placeholder:text-[hsl(var(--lms-text-muted))] hover:border-slate-300 hover:bg-white focus:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10"
            />
            {peopleQuery ? (
              <button
                type="button"
                onClick={() => onPeopleQueryChange("")}
                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full text-[hsl(var(--lms-text-muted))] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                aria-label="Clear people search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {userMatchesLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`user-skeleton-${index}`}
                className="h-14 animate-pulse rounded-[14px] bg-slate-100"
              />
            ))
          ) : peopleQuery.trim().length < 2 ? (
            <div className="community-surface-muted rounded-[14px] border border-dashed px-4 py-4 text-[15px] leading-[1.6] text-[hsl(var(--lms-text-muted))]">
              Enter at least two characters to search for people.
            </div>
          ) : userMatches.length === 0 ? (
            <div className="community-surface-muted flex items-start gap-3 rounded-[14px] border border-dashed px-4 py-4 text-[15px] leading-[1.6] text-[hsl(var(--lms-text-muted))]">
              <Search className="mt-0.5 h-4 w-4 text-slate-400" />
              <span>No members found for "{peopleQuery}".</span>
            </div>
          ) : (
            userMatches.map((person) => (
              <div
                key={person._id?.toString?.() || person.id?.toString?.()}
                className="community-surface-muted flex items-center gap-3 rounded-[16px] px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                  {getInitials(person)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[hsl(var(--lms-primary))]">
                    {highlightText(getAuthorName(person), peopleQuery, `user-${person._id}`)}
                  </p>
                  <p className="truncate text-[13px] text-[hsl(var(--lms-text-muted))]">
                    {getPersonSubtitle(person)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="community-surface rounded-[24px] px-4 py-[14px]">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary">
            <BellRing className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-[hsl(var(--lms-primary))]">
              Official notices
            </h3>
            <p className="mt-1 text-[15px] leading-[1.6] text-[hsl(var(--lms-text-muted))]">
              Key institution updates with full timestamps for easier context.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {announcementsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`notice-skeleton-${index}`}
                className="h-32 animate-pulse rounded-[14px] bg-slate-100"
              />
            ))
          ) : announcements.length === 0 ? (
            <div className="community-surface-muted rounded-[14px] border border-dashed px-4 py-4 text-[15px] leading-[1.6] text-[hsl(var(--lms-text-muted))]">
              No active official notices at the moment.
            </div>
          ) : (
            announcements.slice(0, 3).map((announcement) => {
              const style = getNoticeStyle(announcement);
              const noticeId =
                announcement._id?.toString?.() ||
                announcement.id?.toString?.() ||
                announcement.title;
              const isExpanded = Boolean(expandedNotices[noticeId]);

              return (
                <article
                  key={noticeId}
                  className={`community-surface-muted rounded-[18px] border-l-[3px] px-4 py-[14px] ${style.accent}`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-[10px] py-[3px] text-[11px] font-medium ${style.badge}`}>
                      <Users className="h-3 w-3" />
                      {style.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-[10px] py-[3px] text-[11px] font-medium text-blue-800">
                      <UserRound className="h-3 w-3" />
                      {getAnnouncementAuthorName(announcement)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-[10px] py-[3px] text-[11px] font-medium text-emerald-800">
                      <GraduationCap className="h-3 w-3" />
                      {getAnnouncementAudience(announcement)}
                    </span>
                  </div>

                  <h4 className="text-[16px] font-semibold text-[hsl(var(--lms-primary))]">
                    {announcement.title}
                  </h4>
                  <p className={`mt-2 text-[15px] leading-[1.6] text-[hsl(var(--lms-text-muted))] ${isExpanded ? "" : "line-clamp-2"}`}>
                    {announcement.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-3">
                    <div className="flex items-center gap-2 text-[13px] text-[hsl(var(--lms-text-muted))]">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200/70 bg-gradient-to-br from-[#1a3884] to-[#3654a1] text-[11px] font-bold text-white shadow-[0_8px_18px_-10px_rgba(26,56,132,0.55)]">
                        {(getAnnouncementAuthorName(announcement) || "A").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[hsl(var(--lms-primary))]">
                        {getAnnouncementAuthorName(announcement)}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        &middot;
                      </span>
                      <Timestamp now={now} value={announcement.createdAt} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNoticeToggle(noticeId)}
                      className="text-[13px] font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </aside>
  );
};

export default CommunitySidebar;
