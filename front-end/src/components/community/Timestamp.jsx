import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Builds the relative label used across community activity timestamps.
 *
 * @param {string|Date|null|undefined} value - UTC timestamp from the API.
 * @param {number} now - Current client timestamp used for live refreshes.
 * @returns {{absolute: string, absoluteDate: string, relative: string, iso: string}|null} Display labels or null.
 */
function getTimestampLabels(value, now) {
  if (!value) {
    return null;
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return null;
  }

  const diffMs = Math.max(0, now - parsedValue.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relative = "Just now";

  if (diffMinutes < 1) {
    relative = "Just now";
  } else if (diffMinutes < 60) {
    relative = `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    relative = diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
  } else {
    relative = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsedValue);
  }

  return {
    absolute: new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(parsedValue),
    absoluteDate: new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsedValue),
    relative,
    iso: parsedValue.toISOString(),
  };
}

/**
 * Renders a live-updating relative timestamp with an absolute hover tooltip.
 *
 * @param {{
 *   value: string|Date|null|undefined,
 *   now: number,
 *   className?: string,
 *   format?: "relative"|"absoluteDateTime"|"absoluteDate",
 * }} props - Timestamp component props.
 * @returns {import("react").JSX.Element|null} Relative timestamp element.
 */
const Timestamp = ({
  value,
  now,
  className = "",
  format = "relative",
}) => {
  const labels = getTimestampLabels(value, now);

  if (!labels) {
    return null;
  }

  const visibleLabel =
    format === "absoluteDateTime"
      ? labels.absolute
      : format === "absoluteDate"
        ? labels.absoluteDate
        : labels.relative;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time
          dateTime={labels.iso}
          className={className}
          title={labels.absolute}
        >
          {visibleLabel}
        </time>
      </TooltipTrigger>
      <TooltipContent className="border-[hsl(var(--lms-border))] bg-white text-[hsl(var(--lms-primary))] shadow-[0_12px_30px_rgba(0,33,71,0.08)]">
        {labels.absolute}
      </TooltipContent>
    </Tooltip>
  );
};

export default Timestamp;
