import { Loader2, Paperclip, Send, Sparkles, X } from "lucide-react";
import { COMMUNITY_CATEGORIES } from "@/components/community/community-utils";

/**
 * Renders the create-post composer used at the top of the community feed.
 *
 * @param {{
 *   title: string,
 *   content: string,
 *   category: string,
 *   isSubmitting?: boolean,
 *   attachmentFile?: File|null,
 *   onTitleChange: (value: string) => void,
 *   onContentChange: (value: string) => void,
 *   onCategoryChange: (value: string) => void,
 *   onAttachmentChange: (file: File|null) => void,
 *   onAttachmentClear: () => void,
 *   onSubmit: () => void,
 * }} props - Composer props.
 * @returns {import("react").JSX.Element} Community composer card.
 */
const CommunityComposer = ({
  title,
  content,
  category,
  isSubmitting = false,
  attachmentFile = null,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onAttachmentChange,
  onAttachmentClear,
  onSubmit,
}) => {
  const isDisabled = !title.trim() || !content.trim() || isSubmitting;

  return (
    <section className="community-surface rounded-[24px] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[13px] font-medium tracking-[0.04em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Start a discussion
          </div>
          <h2 className="max-w-3xl text-[18px] font-semibold leading-[1.45] text-[hsl(var(--lms-primary))] sm:text-[20px]">
            Share a useful update, question, or discussion with your community.
          </h2>
        </div>
      </div>

      <div className="space-y-3.5">
        <input
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Write a clear discussion title"
          className="h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50/75 px-4 text-[15px] font-medium text-[hsl(var(--lms-primary))] transition-all placeholder:text-[hsl(var(--lms-text-muted))] hover:border-slate-300 hover:bg-white focus:border-primary focus:bg-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10"
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="h-11 min-w-[200px] rounded-[14px] border border-slate-200 bg-slate-50/75 px-4 text-[15px] font-medium text-[hsl(var(--lms-primary))] transition-all hover:border-slate-300 hover:bg-white focus:border-primary focus:bg-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10"
          >
            {COMMUNITY_CATEGORIES.filter((option) => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="Write something valuable. Mention the context, question, or insight you want the community to respond to."
          className="min-h-[112px] w-full rounded-[16px] border border-slate-200 bg-slate-50/75 px-[14px] py-3 text-[15px] leading-[1.6] text-[hsl(var(--lms-text-muted))] transition-all placeholder:text-[hsl(var(--lms-text-muted))] hover:border-slate-300 hover:bg-white focus:border-primary focus:bg-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10"
        />

        <div className="community-surface-muted flex flex-col gap-3 rounded-[16px] border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[13px] font-medium text-[hsl(var(--lms-primary))]">
              Add a photo or file
            </p>
            <p className="text-[13px] text-[hsl(var(--lms-text-muted))]">
              Upload an image, video, or PDF to support your discussion.
            </p>
            {attachmentFile ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] text-[hsl(var(--lms-primary))] shadow-sm">
                <Paperclip className="h-3.5 w-3.5" />
                <span className="max-w-[220px] truncate">{attachmentFile.name}</span>
                <button
                  type="button"
                  onClick={onAttachmentClear}
                  className="inline-flex items-center justify-center rounded-full text-[hsl(var(--lms-text-muted))] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  aria-label="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          <label className="tap-target inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-[hsl(var(--lms-primary))] shadow-sm transition-all hover:border-primary/20 hover:bg-primary/5 focus-within:ring-2 focus-within:ring-primary/20">
            <Paperclip className="h-4 w-4" />
            Upload
            <input
              type="file"
              accept="image/*,video/*,application/pdf"
              className="sr-only"
              onChange={(event) => onAttachmentChange(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="flex justify-end border-t border-slate-200/80 pt-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isDisabled}
            className="tap-target inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-6 text-[14px] font-semibold text-white transition-all hover:bg-primary/95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish post
          </button>
        </div>
      </div>
    </section>
  );
};

export default CommunityComposer;
