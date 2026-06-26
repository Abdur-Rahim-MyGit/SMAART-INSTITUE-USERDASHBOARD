import { Bookmark, MessageCircle, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCurrentReaction,
  getReactionCounts,
  isBookmarkedByCurrentUser,
} from "@/components/community/community-utils";

const REACTION_CONFIG = [
  {
    value: "like",
    label: "Like",
    emoji: "\ud83d\udc4d",
    activeClassName: "border-blue-200 bg-blue-50 text-blue-700 shadow-sm",
    bubbleClassName: "bg-blue-100 text-blue-700",
    hoverClassName: "hover:border-blue-200 hover:bg-blue-50/70",
  },
  {
    value: "heart",
    label: "Heart",
    emoji: "\u2764\ufe0f",
    activeClassName: "border-rose-200 bg-rose-50 text-rose-700 shadow-sm",
    bubbleClassName: "bg-rose-100 text-rose-700",
    hoverClassName: "hover:border-rose-200 hover:bg-rose-50/70",
  },
  {
    value: "insightful",
    label: "Insightful",
    emoji: "\ud83d\udca1",
    activeClassName: "border-amber-200 bg-amber-50 text-amber-700 shadow-sm",
    bubbleClassName: "bg-amber-100 text-amber-700",
    hoverClassName: "hover:border-amber-200 hover:bg-amber-50/70",
  },
  {
    value: "support",
    label: "Support",
    emoji: "\ud83e\udd1d",
    activeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm",
    bubbleClassName: "bg-emerald-100 text-emerald-700",
    hoverClassName: "hover:border-emerald-200 hover:bg-emerald-50/70",
  },
  {
    value: "smile",
    label: "Funny",
    emoji: "😄",
    activeClassName: "border-violet-200 bg-violet-50 text-violet-700 shadow-sm",
    bubbleClassName: "bg-violet-100 text-violet-700",
    hoverClassName: "hover:border-violet-200 hover:bg-violet-50/70",
  },
];

/**
 * Renders the post interaction footer with reactions, replies, and save controls.
 *
 * @param {{
 *   post: Record<string, unknown>,
 *   currentUserId: string|null,
 *   canPin?: boolean,
 *   isPending?: boolean,
 *   areRepliesOpen: boolean,
 *   onReactionToggle: (postId: string, type: string) => void,
 *   onBookmarkToggle: (postId: string) => void,
 *   onPinToggle?: (postId: string) => void,
 *   onRepliesToggle: (postId: string) => void,
 * }} props - Reaction bar props.
 * @returns {import("react").JSX.Element} Post interaction footer.
 */
const ReactionBar = ({
  post,
  currentUserId,
  canPin = false,
  isPending = false,
  areRepliesOpen,
  onReactionToggle,
  onBookmarkToggle,
  onPinToggle,
  onRepliesToggle,
}) => {
  const postId = post?._id?.toString?.() || post?.id?.toString?.() || "";
  const reactionCounts = getReactionCounts(post);
  const currentReaction = getCurrentReaction(post, currentUserId);
  const isBookmarked = isBookmarkedByCurrentUser(post, currentUserId);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-3">
      <div className="flex flex-wrap gap-2">
        {REACTION_CONFIG.map(
          ({
            value,
            label,
            emoji,
            activeClassName,
            bubbleClassName,
            hoverClassName,
          }) => (
            <button
              key={value}
              type="button"
              onClick={() => onReactionToggle(postId, value)}
              disabled={isPending}
              aria-pressed={currentReaction === value}
              aria-label={`React with ${label}`}
              className={cn(
                "tap-target inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-[hsl(var(--lms-primary))] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                currentReaction === value ? activeClassName : hoverClassName,
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-[14px]",
                  currentReaction === value ? "bg-white/90" : bubbleClassName,
                )}
                aria-hidden="true"
              >
                {emoji}
              </span>
              <span>{label}</span>
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[12px] font-semibold text-current shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
                {reactionCounts[value]}
              </span>
            </button>
          ),
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRepliesToggle(postId)}
            className={cn(
              "tap-target inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-[hsl(var(--lms-primary))] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
              areRepliesOpen
                ? "bg-slate-100 shadow-sm"
                : "bg-white hover:border-slate-300 hover:bg-[#F8FAFC]",
            )}
          >
            <MessageCircle className="h-4 w-4" />
            {post?.replies?.length || 0} replies
          </button>

          {canPin ? (
            <button
              type="button"
              onClick={() => onPinToggle?.(postId)}
              disabled={isPending}
              aria-pressed={Boolean(post?.isPinned)}
              aria-label={post?.isPinned ? "Unpin post" : "Pin post"}
              className={cn(
                "tap-target inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border px-3 py-1.5 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                post?.isPinned
                  ? "border-amber-200 bg-amber-50 text-amber-800 shadow-sm"
                  : "border-slate-200 bg-white text-[hsl(var(--lms-primary))] hover:border-amber-200 hover:bg-amber-50/70",
              )}
            >
              <Pin className="h-4 w-4" />
              {post?.isPinned ? "Pinned" : "Pin"}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onBookmarkToggle(postId)}
          disabled={isPending}
          aria-pressed={isBookmarked}
          aria-label={isBookmarked ? "Remove bookmark" : "Save post"}
          className={cn(
            "tap-target inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-[hsl(var(--lms-primary))] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
            isBookmarked
              ? "bg-slate-100 shadow-sm"
              : "bg-white hover:border-slate-300 hover:bg-[#F8FAFC]",
          )}
        >
          <Bookmark className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );
};

export default ReactionBar;
