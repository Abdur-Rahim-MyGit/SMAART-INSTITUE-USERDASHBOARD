import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, ChevronUp } from "lucide-react";
import { highlightText } from "@/components/community/community-utils";

const COLLAPSED_HEIGHT = 132;

/**
 * Normalizes rich post content into a readable plain-text preview.
 *
 * @param {string} content - Original markdown or plain-text content.
 * @returns {string} Plain-text preview content.
 */
function getPlainPreview(content) {
  return String(content || "")
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Renders a readable post body with animated expand and collapse support.
 *
 * @param {{
 *   content: string,
 *   expanded: boolean,
 *   onToggle: () => void,
 *   bodyId: string,
 *   searchQuery?: string,
 * }} props - Read-more props for a single post.
 * @returns {import("react").JSX.Element} Expandable post body.
 */
const ReadMoreText = ({
  content,
  expanded,
  onToggle,
  bodyId,
  searchQuery = "",
}) => {
  const containerRef = useRef(null);
  const [measuredHeight, setMeasuredHeight] = useState(COLLAPSED_HEIGHT);
  const plainPreview = useMemo(() => getPlainPreview(content), [content]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    setMeasuredHeight(containerRef.current.scrollHeight);
  }, [content, expanded, searchQuery]);

  const isLongContent =
    plainPreview.length > 280 || measuredHeight > COLLAPSED_HEIGHT;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden transition-[max-height] ease-in-out"
        style={{
          maxHeight: expanded || !isLongContent ? measuredHeight + 24 : COLLAPSED_HEIGHT,
          transitionDuration: "250ms",
        }}
      >
        {!expanded && isLongContent ? (
          <div
            id={bodyId}
            ref={containerRef}
            className="space-y-3 text-[15px] leading-[1.65] text-[hsl(var(--lms-text-muted))] [overflow-wrap:break-word] [word-break:break-word] [hyphens:auto]"
          >
            <p className="whitespace-pre-wrap">
              {highlightText(plainPreview, searchQuery, bodyId)}
            </p>
          </div>
        ) : (
          <div
            id={bodyId}
            ref={containerRef}
            className="prose prose-slate max-w-none text-[15px] leading-[1.65] text-[hsl(var(--lms-text-muted))] prose-headings:text-[hsl(var(--lms-primary))] prose-p:my-0 prose-pre:overflow-x-auto prose-pre:whitespace-pre prose-pre:rounded-[12px] prose-pre:border prose-pre:border-[#E5E7EB] prose-pre:bg-slate-950 prose-pre:p-4 prose-code:break-normal prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:max-w-full prose-img:rounded-[12px] prose-img:border prose-img:border-[#E5E7EB] prose-img:shadow-sm [overflow-wrap:break-word] [word-break:break-word] [hyphens:auto]"
          >
            <ReactMarkdown
              components={{
                img: ({ node: _node, ...props }) => (
                  <img {...props} alt={props.alt || "Community post media"} />
                ),
                code: ({ inline, className, children, ...props }) => {
                  if (inline) {
                    return (
                      <code
                        className={`${className || ""} rounded bg-slate-100 px-1.5 py-0.5 text-[13px] text-[hsl(var(--lms-primary))]`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {!expanded && isLongContent ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/85 to-transparent" />
        ) : null}
      </div>

      {isLongContent ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {expanded ? "Show less" : "Read more ->"}
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      ) : null}
    </div>
  );
};

export default ReadMoreText;
