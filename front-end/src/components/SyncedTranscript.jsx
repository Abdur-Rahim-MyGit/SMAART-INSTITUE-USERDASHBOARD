import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlignLeft, Captions, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { DEMO_TRANSCRIPT_VTT } from "@/constants/demoMedia";
import { parseTranscript } from "@/utils/transcriptParser";
import { coursesAPI } from "@/services/api";

const fallbackTranscript = `WEBVTT

00:00:00.000 --> 00:00:03.000
Welcome to this SMAART learning session.

00:00:03.000 --> 00:00:06.500
As the video begins, focus on the core idea behind the lesson.

00:00:06.500 --> 00:00:10.500
The first step is to notice the concept, then connect it to your own experience.

00:00:10.500 --> 00:00:15.000
Pause when needed, replay a section, and use the transcript to review important points.

00:00:15.000 --> 00:00:20.000
By the end, you should be able to explain the lesson in your own words.`;

const formatTime = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const SyncedTranscript = ({
  currentTime = 0,
  transcriptUrl,
  transcriptText,
  videoUrl,
  title = "Video Transcription",
  onCueClick,
  courseCode,
}) => {
  const [rawTranscript, setRawTranscript] = useState(transcriptText || "");
  const [isFullView, setIsFullView] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(transcriptUrl && !transcriptText));
  const [loadError, setLoadError] = useState("");
  const activeLineRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    if (transcriptText) {
      setRawTranscript(transcriptText);
      setIsLoading(false);
      setLoadError("");
      return;
    }

    const loadTranscript = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        if (videoUrl && (!transcriptUrl || transcriptUrl.includes('sample-course.vtt'))) {
          setLoadError("Auto-generating transcript with Deepgram... this may take a moment.");
          try {
            const res = await coursesAPI.transcribeVideo(videoUrl, courseCode);
            if (res && res.transcription) {
              if (isMounted) {
                setRawTranscript(res.transcription);
                setLoadError("");
              }
              return;
            }
          } catch (apiErr) {
             console.warn("Auto-transcription failed:", apiErr);
             if (isMounted) setLoadError("Auto-transcription failed. Using fallback transcript.");
          }
        }

        const response = await fetch(transcriptUrl || DEMO_TRANSCRIPT_VTT);
        if (!response.ok) throw new Error("Transcript unavailable");
        const text = await response.text();
        if (isMounted) setRawTranscript(text);
      } catch (error) {
        if (isMounted) {
          setRawTranscript(fallbackTranscript);
          if (!loadError || !loadError.includes("failed")) {
            setLoadError("Using sample transcript until lesson captions are uploaded.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadTranscript();

    return () => {
      isMounted = false;
    };
  }, [transcriptText, transcriptUrl, videoUrl, courseCode]);

  const cues = useMemo(() => {
    const parsed = parseTranscript(rawTranscript);
    if (parsed.length > 0) return parsed;

    const plainText = rawTranscript
      .replace(/^WEBVTT\s*/i, "")
      .replace(/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!plainText) return [];

    return [{ id: "plain-text", start: 0, end: Number.MAX_SAFE_INTEGER, text: plainText }];
  }, [rawTranscript]);

  const activeIndex = useMemo(() => {
    const index = cues.findIndex((cue) => currentTime >= cue.start && currentTime < cue.end);
    if (index !== -1) return index;

    for (let cueIndex = cues.length - 1; cueIndex >= 0; cueIndex -= 1) {
      if (currentTime >= cues[cueIndex].start) return cueIndex;
    }

    return 0;
  }, [cues, currentTime]);

  useEffect(() => {
    if (!isFullView && activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeLineRef.current;
      
      const containerHalfHeight = container.clientHeight / 2;
      const elementHalfHeight = element.clientHeight / 2;
      const scrollPosition = element.offsetTop - containerHalfHeight + elementHalfHeight;

      container.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: "smooth"
      });
    }
  }, [activeIndex, isFullView]);

  const fullTranscript = cues.map((cue) => cue.text).join(" ");

  return (
    <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/70 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-200/70 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1a3884]/10 flex items-center justify-center text-[#1a3884]">
            <Captions className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500">{cues.length} synced lines</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsFullView((value) => !value)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#1a3884] text-white text-sm font-semibold hover:bg-[#112b6b] transition-colors"
        >
          <AlignLeft className="w-4 h-4" />
          {isFullView ? "Synced Lines" : "Full Transcript"}
          {isFullView ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[180px] flex items-center justify-center text-[#1a3884]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isFullView ? (
            <motion.div
              key="full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-5 sm:p-6"
            >
              <p className="text-gray-700 leading-7 whitespace-pre-line">{fullTranscript}</p>
            </motion.div>
          ) : (
            <motion.div
              key="synced"
              ref={containerRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative max-h-[320px] overflow-y-auto p-3 sm:p-4 space-y-2"
            >
              {cues.map((cue, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={cue.id}
                    ref={isActive ? activeLineRef : null}
                    type="button"
                    onClick={() => onCueClick?.(cue.start)}
                    className={`w-full text-left rounded-xl p-4 transition-all border ${
                      isActive
                        ? "bg-white border-[#1a3884] shadow-sm"
                        : "bg-white/60 border-transparent hover:bg-white"
                    } ${onCueClick ? "cursor-pointer" : "cursor-default"}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <div className="flex gap-3">
                      <span className={`text-xs font-bold tabular-nums mt-1 ${isActive ? "text-[#1a3884]" : "text-gray-400"}`}>
                        {formatTime(cue.start)}
                      </span>
                      <span className={`leading-6 ${isActive ? "text-gray-950 font-semibold" : "text-gray-600"}`}>
                        {cue.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {loadError && <p className="px-5 pb-4 text-xs text-amber-700">{loadError}</p>}
    </div>
  );
};

export default SyncedTranscript;

