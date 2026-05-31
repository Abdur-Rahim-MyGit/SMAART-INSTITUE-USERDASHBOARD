import { getQuizAssessmentForDay } from './microAssessmentUtils';

export const TEMP_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

export const COURSE_STAGE_TITLES = [
  'Why',
  'Story',
  'Framework',
  'Practice',
  'Apply',
  'Reflect',
  'Notes'
];

export const getVideoUrlFromDay = (day) => {
  const url =
    day?.videoContent?.videoUrl ||
    day?.video_url ||
    day?.videoUrl ||
    day?.VideoContent?.[0]?.videoUrl ||
    day?.steps?.[0]?.content?.videoUrl ||
    null;

  if (!url || url.trim() === '') {
    return TEMP_VIDEO_URL;
  }
  return url;
};

export const mapCourseDaysToFlowSteps = (days = [], module = {}) => {
  const steps = {};
  const normalized = days.length >= COURSE_STAGE_TITLES.length
    ? days.slice(0, COURSE_STAGE_TITLES.length)
    : COURSE_STAGE_TITLES.map((title, index) => days[index] || { moduleDetails: { title } });

  normalized.forEach((day, index) => {
    const stepKey = String(index + 1);
    const title = day.moduleDetails?.title || COURSE_STAGE_TITLES[index];
    const isNotes = index === 6;
    const videoUrl = isNotes ? null : getVideoUrlFromDay(day);
    const assessmentData = getQuizAssessmentForDay(module, day, index);
    const hasVideo = Boolean(videoUrl && !isNotes);

    let contentType = isNotes ? 'notes' : 'video-text';
    // Admin quiz on this day replaces demo MCQ (e.g. Practice / day 4)
    if (assessmentData) {
      contentType = 'quiz';
    }

    steps[stepKey] = {
      title: assessmentData?.title || title,
      duration: `${day.videoContent?.duration || 5} min`,
      contentType,
      videoUrl,
      content:
        day.moduleDetails?.description ||
        day.videoContent?.description ||
        `${title} learning activity.`,
      transcription: day.videoContent?.transcription || '',
      transcriptText: day.videoContent?.transcription || '',
      ...(assessmentData
        ? {
            assessmentData,
            dayId: assessmentData.dayId,
            moduleId: assessmentData.moduleId,
          }
        : {}),
    };
  });

  return steps;
};

export const buildFlowFromCourse = (course) => {
  const module = course?.modules?.[0] || {};
  const days = module.days || [];
  return {
    overview: course?.description || '',
    overviewTitle: course?.title,
    courseCode: course?.courseCode,
    courseDbId: course?._id,
    steps: mapCourseDaysToFlowSteps(days, module),
    totalSteps: COURSE_STAGE_TITLES.length,
  };
};
