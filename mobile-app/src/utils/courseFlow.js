/**
 * Course learning-flow builder — the mobile port of the web's
 * `front-end/src/utils/courseStages.js` + the resolution branch in
 * `front-end/src/pages/CoursePlayer.jsx`.
 *
 * WHY THIS EXISTS
 * ---------------
 * The web resolves a course's steps from three sources in a strict priority
 * order. Mobile originally implemented only the *last* of them, which is why
 * courses that render fine in a browser came up empty (or as placeholder video)
 * on the phone — nearly every authored course carries its content on
 * `course.learningFlow`, and that branch was never consulted.
 *
 *   1. `course.learningFlow`     ← authored content. Primary source on web.
 *   2. `course.modules[0].days`  ← day-based content, merged when the course is
 *                                  active and has days.
 *   3. `GET /courses/:id/stages` ← server-side projection of (2). Fallback only,
 *                                  used when the course document is unavailable.
 *
 * `resolveLearningFlow` below reproduces that branch exactly, so a course shows
 * the same steps, titles, durations and video URLs on both clients.
 *
 * Steps are returned as an ARRAY (web keys them by string index) because every
 * mobile consumer iterates them; `stepId` preserves the web's 1-based numbering
 * so saved `UserProgress` rows stay compatible across platforms.
 */

/** Default seven-step flow, mirroring `back-end/utils/courseStageDefaults.js`. */
export const STAGE_TITLES = ['Why', 'Story', 'Framework', 'Practice', 'Apply', 'Reflect', 'Notes'];

/** Index 6 ("Notes") is text-only on web. */
export const NOTES_STEP_INDEX = 6;

/**
 * Placeholder used when a day carries no uploaded video.
 * Identical to the web's `TEMP_VIDEO_URL` so both clients degrade the same way.
 */
export const FALLBACK_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

/** Same precedence chain as the web's `getVideoUrlFromDay`. */
export function getVideoUrlFromDay(day) {
  const url =
    day?.videoContent?.videoUrl ||
    day?.video_url ||
    day?.videoUrl ||
    day?.VideoContent?.[0]?.videoUrl ||
    day?.steps?.[0]?.content?.videoUrl ||
    null;

  if (!url || String(url).trim() === '') return FALLBACK_VIDEO_URL;
  return url;
}

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Normalise one question's options. Port of the web's `normalizeQuizQuestion`.
 *
 * The admin course builder stores options either as an array or as an
 * object keyed by letter (`{ A: '…', B: '…' }`). Treating the object case as an
 * array throws `options.map is not a function`, which aborts the whole course
 * load — so both shapes are handled here exactly as the web handles them.
 */
function normalizeOptions(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return OPTION_LABELS.filter((label) => {
      const val = raw[label] ?? raw[label.toLowerCase()];
      return val != null && String(val).trim() !== '';
    }).map((label) => String(raw[label] ?? raw[label.toLowerCase()]).trim());
  }
  if (Array.isArray(raw)) {
    return raw
      .map((o) => (typeof o === 'string' ? o.trim() : String(o?.text ?? o?.label ?? o?.value ?? '').trim()))
      .filter((s) => s.length > 0);
  }
  return [];
}

/**
 * Resolve which option is correct. Port of the web's `getCorrectOptionIndex`.
 *
 * `quizSchema.correctAnswer` is a **String** in `models/Course.js`, not a
 * number — authors save it as a letter ('B'), a numeric string ('1'), or the
 * full option text. Accepting only a numeric type (as the first cut of this
 * port did) leaves every admin-authored question ungradeable, which silently
 * hides the Submit button and makes quiz steps impossible to complete.
 *
 * Returns -1 when nothing matches, mirroring the web.
 */
export function getCorrectOptionIndex(options, correct) {
  if (correct === null || correct === undefined || !options.length) return -1;

  if (typeof correct === 'number' && Number.isInteger(correct)) {
    if (correct >= 0 && correct < options.length) return correct;
  }

  const str = String(correct).trim();

  const letter = str.toUpperCase();
  if (/^[A-F]$/.test(letter)) {
    const idx = letter.charCodeAt(0) - 65;
    if (idx < options.length) return idx;
  }

  const asNum = Number(str);
  if (!Number.isNaN(asNum) && asNum >= 0 && asNum < options.length && String(asNum) === str) {
    return asNum;
  }

  return options.findIndex(
    (opt) => opt === correct || String(opt).trim().toLowerCase() === str.toLowerCase()
  );
}

function normalizeQuestions(questions = []) {
  return (questions || [])
    .filter(Boolean)
    .map((q, i) => {
      const options = normalizeOptions(q.options ?? q.choices);
      const correctIndex = getCorrectOptionIndex(options, q.correctAnswer ?? q.correct ?? q.answer);
      return {
        id: q._id || q.id || `q${i}`,
        question: String(q.question || q.questionText || q.text || q.title || '').trim(),
        options,
        // Normalise the web's -1 "no match" to null, which is what the UI
        // checks when deciding whether a question can be graded.
        correctIndex: correctIndex >= 0 ? correctIndex : null,
        explanation: String(q.explanation || q.explanationText || '').trim(),
        type: q.type || 'mcq',
        points: Number(q.points) || 1,
      };
    })
    // Same guard as the web: a question with no text or fewer than two
    // options is unanswerable and is dropped rather than rendered broken.
    .filter((q) => q.question && q.options.length >= 2);
}

/** Admin quiz attached to a day, via micro-assessments or a `quiz` step. */
function quizForDay(module, day, dayIndex) {
  const dayId = day?.dayNumber ?? dayIndex + 1;

  const fromMicro = (module?.microAssessments || []).find(
    (ma) => Number(ma.dayId) === Number(dayId)
  );
  if (fromMicro?.questions?.length) {
    return {
      title: fromMicro.title || 'Micro-Assessment',
      questions: normalizeQuestions(fromMicro.questions),
      dayId,
      moduleId: fromMicro.moduleId || module?.sequence || 1,
    };
  }

  const quizStep = (day?.steps || []).find(
    (s) => s.type === 'quiz' && s.content?.questions?.length > 0
  );
  if (quizStep) {
    return {
      title: quizStep.title || quizStep.content?.title || 'Micro-Assessment',
      questions: normalizeQuestions(quizStep.content.questions),
      dayId,
      moduleId: module?.sequence || 1,
    };
  }
  return null;
}

/** Source 2 — day-based content. Mirrors `mapCourseDaysToFlowSteps`. */
export function buildFlowFromCourse(course) {
  const module = course?.modules?.[0] || {};
  const days = module.days || [];

  // A course with no days at all yields nothing, so `resolveLearningFlow` can
  // fall through to the stages projection and ultimately to the empty state.
  //
  // This is a deliberate divergence from the web, which always pads to seven.
  // Web can afford to: it pads onto `getLearningFlowData(courseId)`, a bundle
  // of static per-course content mobile does not carry. Padding here instead
  // manufactured seven stock steps pointing at the placeholder video — steps a
  // student could watch to 95% and have recorded as genuine progress against a
  // course that has no content.
  if (!days.length) return [];

  // With real days present, pad short arrays out to the seven canonical titles
  // so the flow is not ragged — same as the web.
  const normalized =
    days.length >= STAGE_TITLES.length
      ? days.slice(0, STAGE_TITLES.length)
      : STAGE_TITLES.map((title, i) => days[i] || { moduleDetails: { title } });

  return normalized.map((day, index) => {
    const title = day.moduleDetails?.title || STAGE_TITLES[index];
    const isNotes = index === NOTES_STEP_INDEX;
    const videoUrl = isNotes ? null : getVideoUrlFromDay(day);
    const quiz = quizForDay(module, day, index);

    return {
      stepId: index + 1,
      title: quiz?.title || title,
      contentType: quiz ? 'quiz' : isNotes ? 'notes' : 'video-text',
      videoUrl,
      content:
        day.moduleDetails?.description ||
        day.videoContent?.description ||
        `${title} learning activity.`,
      transcription: day.videoContent?.transcription || '',
      durationMin: day.videoContent?.duration || 5,
      questions: quiz?.questions || [],
      cards: [],
    };
  });
}

/** Source 1 — authored `learningFlow`. Mirrors `buildFlowFromLearningFlow`. */
export function buildFlowFromLearningFlow(course) {
  const lf = course?.learningFlow || {};
  const steps = [];
  const push = (step) => steps.push({ ...step, stepId: steps.length + 1 });

  if (lf.stepA_Why) {
    push({
      title: lf.stepA_Why.title || 'Why',
      phase: 'Why',
      contentType: 'video-text',
      videoUrl: lf.stepA_Why.videoUrl || null,
      content: lf.stepA_Why.text || '',
      durationMin: 5,
    });
  }

  if (lf.stepB_Story) {
    push({
      title: lf.stepB_Story.title || 'Story',
      phase: 'Story',
      contentType: 'video-text',
      videoUrl: lf.stepB_Story.videoUrl || null,
      content: lf.stepB_Story.narrative || '',
      durationMin: 7,
    });
  }

  if (lf.stepC_Framework) {
    let body = lf.stepC_Framework.content || '';
    if (lf.stepC_Framework.keyPoints?.length) {
      body +=
        '\n\nKey Takeaways:\n' +
        lf.stepC_Framework.keyPoints.filter(Boolean).map((p) => `• ${p}`).join('\n');
    }
    push({
      title: lf.stepC_Framework.title || 'Framework',
      phase: 'Framework',
      // Web switches to a notes-style step when no video is attached.
      contentType: lf.stepC_Framework.videoUrl ? 'video-text' : 'notes',
      videoUrl: lf.stepC_Framework.videoUrl || null,
      content: body,
      durationMin: lf.stepC_Framework.videoUrl ? 15 : 10,
    });
  }

  if (lf.stepD_Practice) {
    const isQuiz = (lf.stepD_Practice.submissionType || 'reflection') === 'quiz';
    push({
      title: lf.stepD_Practice.title || 'Practice',
      phase: 'Practice',
      contentType: isQuiz ? 'quiz' : 'advanced-mcq',
      content: lf.stepD_Practice.instructions || 'Practice exercise submission.',
      questions: normalizeQuestions(lf.stepD_Practice.questions || []),
      videoUrl: null,
      durationMin: isQuiz ? 15 : 10,
    });
  }

  if (lf.stepE_FlashCard?.cards?.length) {
    push({
      title: lf.stepE_FlashCard.title || 'Flash Cards',
      phase: 'Flash Cards',
      contentType: 'flashcard',
      cards: lf.stepE_FlashCard.cards,
      content: 'Review these key flashcards to reinforce your learning.',
      videoUrl: null,
      durationMin: 5,
    });
  }

  if (lf.stepF_AdvancedPractice) {
    const isQuiz = (lf.stepF_AdvancedPractice.submissionType || 'reflection') === 'quiz';
    push({
      title: lf.stepF_AdvancedPractice.title || 'Advanced Practice',
      phase: 'Advanced Practice',
      contentType: isQuiz ? 'quiz' : 'advanced-mcq',
      content: lf.stepF_AdvancedPractice.instructions || 'Advanced exercise submission.',
      questions: normalizeQuestions(lf.stepF_AdvancedPractice.questions || []),
      videoUrl: null,
      durationMin: 15,
    });
  }

  if (lf.stepG_CaseStudy && lf.stepG_CaseStudy.isEnabled !== false) {
    push({
      title: 'Case Study',
      phase: 'Case Study',
      caseTitle: lf.stepG_CaseStudy.caseTitle || 'Case Study',
      contentType: 'case-study',
      content: lf.stepG_CaseStudy.caseText || '',
      questions: normalizeQuestions(lf.stepG_CaseStudy.questions || []),
      videoUrl: null,
      durationMin: 15,
    });
  }

  if (lf.stepH_Notes && lf.stepH_Notes.isEnabled !== false) {
    push({
      title: lf.stepH_Notes.title || 'Self-Reflection',
      phase: 'Self-Reflection',
      contentType: 'notes',
      content: lf.stepH_Notes.prompt || 'Write down your key takeaways and personal action plans.',
      videoUrl: lf.stepH_Notes.videoUrl || null,
      durationMin: lf.stepH_Notes.videoUrl ? 15 : 5,
    });
  }

  return steps;
}

/** Source 3 — the server-side stage projection. Fallback only. */
export function buildFlowFromStages(stagesResponse) {
  const raw = Array.isArray(stagesResponse?.data) ? stagesResponse.data : [];
  if (!raw.length) return [];

  return raw.map((stage, index) => {
    const isNotes = index === NOTES_STEP_INDEX || stage.type === 'text';
    return {
      stepId: stage.stageNumber || index + 1,
      title: stage.title || STAGE_TITLES[index] || `Step ${index + 1}`,
      contentType: isNotes ? 'notes' : 'video-text',
      videoUrl: stage.videoUrl || (isNotes ? null : FALLBACK_VIDEO_URL),
      content: stage.description || '',
      transcription: stage.transcription || '',
      durationMin: stage.duration || 5,
      questions: [],
      cards: [],
    };
  });
}

/**
 * The web's exact priority branch (CoursePlayer.jsx). Returns
 * `{ steps, source, title, overview }` — `source` is exposed so the UI can say
 * where content came from when debugging an empty course.
 */
export function resolveLearningFlow(courseResponse, stagesResponse) {
  const course = courseResponse?.data || null;

  if (course) {
    const lf = course.learningFlow;
    const hasLearningFlow =
      lf &&
      (lf.stepA_Why ||
        lf.stepB_Story ||
        lf.stepC_Framework ||
        lf.stepD_Practice ||
        lf.stepE_FlashCard ||
        lf.stepF_AdvancedPractice);

    if (hasLearningFlow) {
      const steps = buildFlowFromLearningFlow(course);
      if (steps.length) {
        return { steps, source: 'learningFlow', title: course.title, overview: course.description || '' };
      }
    }

    // Web falls through to day-based content when the course is active and has
    // days; otherwise it still builds from the (padded) day list.
    const steps = buildFlowFromCourse(course);
    if (steps.length) {
      return { steps, source: 'modules', title: course.title, overview: course.description || '' };
    }
  }

  const stageSteps = buildFlowFromStages(stagesResponse);
  if (stageSteps.length) {
    return {
      steps: stageSteps,
      source: 'stages',
      title: stagesResponse?.courseTitle || '',
      overview: '',
    };
  }

  return { steps: [], source: 'none', title: '', overview: '' };
}

/**
 * Index saved `UserProgress` rows by step. The server keys on
 * (courseCode, moduleId, dayId, stepId); mobile sends the same module/day pair
 * the web hardcodes ('1' / 1) so rows are shared across platforms.
 */
export function indexProgressByStep(progressResponse) {
  const rows = Array.isArray(progressResponse?.data) ? progressResponse.data : [];
  const byStep = {};
  rows.forEach((row) => {
    byStep[Number(row.stepId)] = {
      lastTimestamp: Number(row.last_timestamp) || 0,
      videoDuration: Number(row.videoDuration) || 0,
      videoCompleted: Boolean(row.videoCompleted),
      testCompleted: Boolean(row.testCompleted),
      testScore: row.testScore ?? null,
    };
  });
  return byStep;
}
