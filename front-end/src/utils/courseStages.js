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

  return url && url.trim() !== '' ? url : null;
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
    courseNumber: course?.courseNumber,
    steps: mapCourseDaysToFlowSteps(days, module),
    totalSteps: COURSE_STAGE_TITLES.length,
  };
};

export const buildFlowFromLearningFlow = (course) => {
  const lf = course?.learningFlow || {};
  const steps = {};
  let stepIndex = 1;

  // 1. Why Step
  if (lf.stepA_Why) {
    steps[String(stepIndex)] = {
      title: lf.stepA_Why.title || 'Why',
      contentType: 'video-text',
      videoUrl: lf.stepA_Why.videoUrl || null,
      content: lf.stepA_Why.text || '',
      duration: '5 min'
    };
    stepIndex++;
  }

  // 2. Story Step
  if (lf.stepB_Story) {
    steps[String(stepIndex)] = {
      title: lf.stepB_Story.title || 'Story',
      contentType: 'video-text',
      videoUrl: lf.stepB_Story.videoUrl || null,
      content: lf.stepB_Story.narrative || '',
      duration: '7 min'
    };
    stepIndex++;
  }

  // 3. Framework Step
  if (lf.stepC_Framework) {
    let body = lf.stepC_Framework.content || '';
    if (lf.stepC_Framework.keyPoints?.length) {
      body += '\n\n**Key Takeaways:**\n' + lf.stepC_Framework.keyPoints.filter(p => !!p).map(p => `- ${p}`).join('\n');
    }
    steps[String(stepIndex)] = {
      title: lf.stepC_Framework.title || 'Framework',
      contentType: lf.stepC_Framework.videoUrl ? 'video-text' : 'notes',
      content: body,
      videoUrl: lf.stepC_Framework.videoUrl || null,
      videoType: lf.stepC_Framework.videoType || 'external',
      diagramUrl: lf.stepC_Framework.diagramUrl || null,
      duration: lf.stepC_Framework.videoUrl ? '15 min' : '10 min'
    };
    stepIndex++;
  }

  // 4. Practice Step
  if (lf.stepD_Practice) {
    const submissionType = lf.stepD_Practice.submissionType || 'reflection';
    const isQuiz = submissionType === 'quiz';
    const rawQs = lf.stepD_Practice.questions || [];

    if (isQuiz) {
      steps[String(stepIndex)] = {
        title: lf.stepD_Practice.title || 'Practice',
        contentType: 'quiz',
        content: lf.stepD_Practice.instructions || '',
        duration: '15 min',
        assessmentData: {
          title: 'Practice Quiz',
          questions: rawQs,
          moduleId: 1,
          dayId: stepIndex,
          stepId: stepIndex,
          shuffleQuestions: lf.stepD_Practice.randomizeQuestions !== false
        }
      };
    } else {
      const questions = rawQs.map(q => ({
        ...q,
        type: q.type || 'reflection'
      }));
      steps[String(stepIndex)] = {
        title: lf.stepD_Practice.title || 'Practice',
        contentType: 'advanced-mcq',
        content: lf.stepD_Practice.instructions || 'Practice exercise submission.',
        questions,
        duration: '10 min'
      };
    }
    stepIndex++;
  }

  // 5. Flashcards Step
  if (lf.stepE_FlashCard && lf.stepE_FlashCard.cards?.length) {
    steps[String(stepIndex)] = {
      title: lf.stepE_FlashCard.title || 'Flash Cards',
      contentType: 'flashcard',
      cards: lf.stepE_FlashCard.cards,
      content: 'Review these key flashcards to reinforce your learning.',
      duration: '5 min'
    };
    stepIndex++;
  }

  // 6. Advanced Practice Step
  if (lf.stepF_AdvancedPractice) {
    const submissionType = lf.stepF_AdvancedPractice.submissionType || 'reflection';
    const isQuiz = submissionType === 'quiz';
    const rawQs = lf.stepF_AdvancedPractice.questions || [];

    if (isQuiz) {
      steps[String(stepIndex)] = {
        title: lf.stepF_AdvancedPractice.title || 'Advanced Practice',
        contentType: 'quiz',
        content: lf.stepF_AdvancedPractice.instructions || '',
        duration: '15 min',
        assessmentData: {
          title: 'Advanced Quiz',
          questions: rawQs,
          moduleId: 1,
          dayId: stepIndex,
          stepId: stepIndex,
          shuffleQuestions: lf.stepF_AdvancedPractice.randomizeQuestions !== false
        }
      };
    } else {
      const questions = rawQs.map(q => ({
        ...q,
        type: q.type || 'reflection'
      }));
      steps[String(stepIndex)] = {
        title: lf.stepF_AdvancedPractice.title || 'Advanced Practice',
        contentType: 'advanced-mcq',
        content: lf.stepF_AdvancedPractice.instructions || 'Advanced exercise submission.',
        questions,
        duration: '15 min'
      };
    }
    stepIndex++;
  }

  // 7. Case Study Step
  if (lf.stepG_CaseStudy && lf.stepG_CaseStudy.isEnabled !== false) {
    steps[String(stepIndex)] = {
      title: 'Case Study',
      caseTitle: lf.stepG_CaseStudy.caseTitle || 'Case Study',
      contentType: 'case-study',
      content: lf.stepG_CaseStudy.caseText || '',
      questions: lf.stepG_CaseStudy.questions || [],
      mcq: lf.stepG_CaseStudy.questions?.find(q => q.type === 'mcq') || null,
      duration: '15 min'
    };
    stepIndex++;
  }

  // 8. Notes Step
  if (lf.stepH_Notes && lf.stepH_Notes.isEnabled !== false) {
    steps[String(stepIndex)] = {
      title: lf.stepH_Notes.title || 'Self-Reflection',
      contentType: 'notes',
      content: lf.stepH_Notes.prompt || 'Write down your key takeaways and personal action plans.',
      videoUrl: lf.stepH_Notes.videoUrl || null,
      videoType: lf.stepH_Notes.videoType || 'external',
      duration: lf.stepH_Notes.videoUrl ? '15 min' : '5 min'
    };
    stepIndex++;
  }

  return {
    overview: course.description || '',
    overviewTitle: course.title,
    courseCode: course.courseCode,
    courseDbId: course._id,
    courseNumber: course.courseNumber,
    steps,
    totalSteps: stepIndex - 1
  };
};
