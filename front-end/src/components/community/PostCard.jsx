import { useEffect, useRef } from "react";
import {
  Clock3,
  Eye,
  MessageCircle,
  Paperclip,
  Pin,
  Send,
  Zap,
} from "lucide-react";
import ReadMoreText from "@/components/community/ReadMoreText";
import ReactionBar from "@/components/community/ReactionBar";
import Timestamp from "@/components/community/Timestamp";
import {
  getAuthorName,
  getCategoryMeta,
  getInitials,
  highlightText,
} from "@/components/community/community-utils";

/**
 * Renders a single reply row inside a discussion thread.
 *
 * @param {{
 *   reply: Record<string, unknown>,
 *   now: number,
 *   searchQuery: string,
 * }} props - Reply item props.
 * @returns {import("react").JSX.Element} Reply row.
 */
function ReplyItem({ reply, now, searchQuery }) {
  const replyId = reply?._id?.toString?.() || reply?.id?.toString?.() || "";

  return (
    <div className="community-surface-muted rounded-[16px] p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
          {getInitials(reply.author)}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[hsl(var(--lms-primary))]">
            {highlightText(getAuthorName(reply.author), searchQuery, `reply-author-${replyId}`)}
          </p>
          <div className="mt-1 inline-flex items-center gap-1 text-[13px] text-[hsl(var(--lms-text-muted))]">
            <Clock3 className="h-3.5 w-3.5" />
            <Timestamp now={now} value={reply.createdAt} format="absoluteDateTime" />
          </div>
        </div>
      </div>

      <div className="text-[15px] leading-[1.65] text-[hsl(var(--lms-text-muted))] [overflow-wrap:break-word] [word-break:break-word] [hyphens:auto]">
        {highlightText(reply.content || "", searchQuery, `reply-body-${replyId}`)}
      </div>
    </div>
  );
}

/**
 * Renders the small status badge row for a post card.
 *
 * @param {{
 *   post: Record<string, unknown>,
 *   searchQuery: string,
 *   postId: string,
 * }} props - Badge row props.
 * @returns {import("react").JSX.Element} Badge row.
 */
function PostBadges({ post, searchQuery, postId }) {
  const category = getCategoryMeta(post.category);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-[10px] py-[4px] text-[11px] font-medium text-[hsl(var(--lms-primary))]">
        <span aria-hidden="true" className="text-[14px] leading-none">
          {category.emoji}
        </span>
        {highlightText(category.label, searchQuery, `category-${postId}`)}
      </span>

      {post.isPinned ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-[10px] py-[3px] text-[11px] font-medium text-amber-800">
          <Pin className="h-3 w-3" />
          Pinned
        </span>
      ) : null}

      {post.channelType === "support" ? (
        <span className="rounded-full border border-red-200 bg-red-50 px-[10px] py-[3px] text-[11px] font-medium text-red-800">
          Notice
        </span>
      ) : null}
    </div>
  );
}

/**
 * Renders a single discussion card with metadata, interactions, and replies.
 *
 * @param {{
 *   post: Record<string, unknown>,
 *   now: number,
 *   currentUserId: string|null,
 *   canPin?: boolean,
 *   searchQuery: string,
 *   replyDraft: string,
 *   isExpanded: boolean,
 *   areRepliesOpen: boolean,
 *   isPending?: boolean,
 *   onToggleExpand: (postId: string) => void,
 *   onReactionToggle: (postId: string, type: string) => void,
 *   onBookmarkToggle: (postId: string) => void,
 *   onPinToggle?: (postId: string) => void,
 *   onPostVisible?: (postId: string) => void,
 *   onRepliesToggle: (postId: string) => void,
 *   onReplyDraftChange: (postId: string, value: string) => void,
 *   onReplySubmit: (postId: string) => void,
 * }} props - Post card props.
 * @returns {import("react").JSX.Element} Discussion card.
 */
const PostCard = ({
  post,
  now,
  currentUserId,
  canPin = false,
  searchQuery,
  replyDraft,
  isExpanded,
  areRepliesOpen,
  isPending = false,
  onToggleExpand,
  onReactionToggle,
  onBookmarkToggle,
  onPinToggle,
  onPostVisible,
  onRepliesToggle,
  onReplyDraftChange,
  onReplySubmit,
}) => {
  const articleRef = useRef(null);
  const postId = post?._id?.toString?.() || post?.id?.toString?.() || "";
  const bodyId = `community-post-body-${postId}`;
  const commentCount = post?.replies?.length || 0;
  const reactionCount = post?.reactions?.length || 0;

  useEffect(() => {
    if (!articleRef.current || !postId || !onPostVisible) {
      return undefined;
    }

    let hasTrackedView = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || hasTrackedView) {
          return;
        }

        hasTrackedView = true;
        onPostVisible(postId);
        observer.disconnect();
      },
      { threshold: 0.45 },
    );

    observer.observe(articleRef.current);

    return () => observer.disconnect();
  }, [onPostVisible, postId]);

  return (
    <article
      ref={articleRef}
      className="community-surface relative overflow-hidden rounded-[24px] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]"
    >
      <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-primary via-primary to-sky-500" aria-hidden="true" />

      <div className="space-y-3 pl-2">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            {getInitials(post.author)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-medium text-[hsl(var(--lms-primary))]">
                {highlightText(getAuthorName(post.author), searchQuery, `author-${postId}`)}
              </p>
              <PostBadges post={post} searchQuery={searchQuery} postId={postId} />
            </div>

            <div className="mt-1 inline-flex items-center gap-1 text-[13px] text-[hsl(var(--lms-text-muted))]">
              <Clock3 className="h-3.5 w-3.5" />
              <Timestamp now={now} value={post.createdAt} format="absoluteDateTime" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/80" />

        <div className="space-y-3">
          <h3 className="text-[16px] font-semibold text-[hsl(var(--lms-primary))]">
            {highlightText(post.title || "Untitled discussion", searchQuery, `title-${postId}`)}
          </h3>

          {post.media?.url && post.media?.resourceType === "image" ? (
            <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-[#F8FAFC]">
              <img
                src={post.media.url}
                alt={post.title || "Community post media"}
                className="max-h-[360px] w-full object-cover"
              />
            </div>
          ) : post.media?.url && post.media?.resourceType === "video" ? (
            <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-slate-950">
              <video controls className="max-h-[360px] w-full">
                <source src={post.media.url} />
              </video>
            </div>
          ) : post.media?.url ? (
            <a
              href={post.media.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-[14px] font-medium text-[hsl(var(--lms-primary))] transition-colors hover:border-primary/15 hover:bg-white"
            >
              <Paperclip className="h-4 w-4" />
              Open attachment
            </a>
          ) : null}

          <ReadMoreText
            bodyId={bodyId}
            content={post.content || ""}
            expanded={isExpanded}
            onToggle={() => onToggleExpand(postId)}
            searchQuery={searchQuery}
          />
        </div>

        <div className="border-t border-slate-200/80" />

        <div className="flex flex-wrap items-center gap-2 text-[13px] text-[hsl(var(--lms-text-muted))]">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {post.views || 0} views
          </span>
          <span aria-hidden="true" className="text-slate-300">&middot;</span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {commentCount} comments
          </span>
          <span aria-hidden="true" className="text-slate-300">&middot;</span>
          <span className="inline-flex items-center gap-1">
            <Zap className="h-4 w-4" />
            {reactionCount} reactions
          </span>
        </div>

        <div className="border-t border-slate-200/80" />

        <ReactionBar
          post={post}
          currentUserId={currentUserId}
          canPin={canPin}
          isPending={isPending}
          areRepliesOpen={areRepliesOpen}
          onReactionToggle={onReactionToggle}
          onBookmarkToggle={onBookmarkToggle}
          onPinToggle={onPinToggle}
          onRepliesToggle={onRepliesToggle}
        />
      </div>

      {areRepliesOpen ? (
        <div className="community-surface-muted mt-4 ml-2 rounded-[20px] p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor={`reply-input-${postId}`}
                className="text-[13px] font-medium tracking-[0.04em] text-[hsl(var(--lms-text-muted))]"
              >
                Add reply
              </label>
              <textarea
                id={`reply-input-${postId}`}
                value={replyDraft}
                onChange={(event) => onReplyDraftChange(postId, event.target.value)}
                placeholder="Write a helpful reply"
                className="min-h-[120px] w-full rounded-[14px] border border-slate-200 bg-white px-[14px] py-3 text-[15px] leading-[1.65] text-[hsl(var(--lms-text-muted))] transition-all hover:border-slate-300 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onReplySubmit(postId)}
                  disabled={isPending}
                  className="tap-target inline-flex min-h-[44px] items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  Reply
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {post.replies?.length ? (
                post.replies.map((reply) => (
                  <ReplyItem
                    key={reply._id?.toString?.() || reply.id?.toString?.()}
                    now={now}
                    reply={reply}
                    searchQuery={searchQuery}
                  />
                ))
              ) : (
                <div className="rounded-[14px] border border-dashed border-slate-200 bg-white/80 px-4 py-4 text-sm text-[hsl(var(--lms-text-muted))]">
                  No replies yet. Be the first to respond.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default PostCard;

