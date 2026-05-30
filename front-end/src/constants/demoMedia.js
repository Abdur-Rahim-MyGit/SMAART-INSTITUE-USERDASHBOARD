/** Demo assets for lessons without uploaded video or captions yet. */
export const DEMO_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";
export const DEMO_TRANSCRIPT_VTT = "/transcripts/sample-course.vtt";
export const DEMO_TRANSCRIPT_SRT = "/transcripts/sample-course.srt";

export const resolveLessonVideoUrl = (url) => url?.trim() || DEMO_VIDEO_URL;

export const resolveLessonTranscriptUrl = (dayOrStep) => {
  if (!dayOrStep) return DEMO_TRANSCRIPT_VTT;
  return (
    dayOrStep.transcriptUrl ||
    dayOrStep.transcriptionUrl ||
    dayOrStep.captionsUrl ||
    DEMO_TRANSCRIPT_VTT
  );
};
