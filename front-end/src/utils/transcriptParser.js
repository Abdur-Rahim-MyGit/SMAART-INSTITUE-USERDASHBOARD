const TIMESTAMP_PATTERN = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{1,3})/;

const parseTimestamp = (value) => {
  const match = value.trim().match(TIMESTAMP_PATTERN);
  if (!match) return 0;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const rawMs = match[4] || "0";
  const milliseconds = rawMs.length === 3 ? Number(rawMs) : Number(rawMs.padEnd(3, "0"));

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

const normalizeContent = (content = "") =>
  content
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

const parseCueBlock = (block) => {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== "WEBVTT" && !line.startsWith("NOTE") && !/^\d+$/.test(line));

  const timingIndex = lines.findIndex((line) => line.includes("-->"));
  if (timingIndex === -1) return null;

  const [startRaw, endRaw] = lines[timingIndex].split("-->");
  const text = lines
    .slice(timingIndex + 1)
    .join(" ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;

  const start = parseTimestamp(startRaw);
  const end = parseTimestamp(endRaw);

  return {
    id: `${start}-${end}-${text}`,
    start,
    end,
    text,
  };
};

export const detectTranscriptFormat = (content = "") => {
  const normalized = normalizeContent(content);
  if (!normalized) return "unknown";
  if (normalized.startsWith("WEBVTT")) return "vtt";
  if (/^\d+\s*\n\d{2}:\d{2}:\d{2},\d{3}\s*-->/m.test(normalized)) return "srt";
  if (normalized.includes("-->")) return "vtt";
  return "unknown";
};

export const parseTranscript = (content = "") => {
  const normalized = normalizeContent(content);
  if (!normalized) return [];

  const blocks = normalized.split(/\n{2,}/);
  const cues = blocks.map(parseCueBlock).filter(Boolean);

  if (cues.length > 0) return cues;

  // Some SRT exports use single newlines between cues.
  const srtBlocks = normalized.split(/\n(?=\d+\n\d{2}:\d{2}:\d{2},\d{3}\s-->)/);
  return srtBlocks.map(parseCueBlock).filter(Boolean);
};
