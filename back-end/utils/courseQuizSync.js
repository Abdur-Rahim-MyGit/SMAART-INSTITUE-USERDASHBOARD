/**
 * Sync admin course-builder quiz data (learningFlow.stepD_Practice) into
 * module.microAssessments for the student dashboard player.
 */

const PRACTICE_DAY_ID = 4;

const getPracticeFromLearningFlow = (course) => {
  const practice = course?.learningFlow?.stepD_Practice;
  if (!practice || practice.activityType !== 'quiz') return null;
  const questions = practice.questions || [];
  if (!questions.length) return null;

  return {
    title: 'Practice',
    questions,
    dayId: PRACTICE_DAY_ID,
    stepId: PRACTICE_DAY_ID,
    moduleId: course?.modules?.[0]?.sequence || 1,
    shuffleQuestions: practice.randomizeQuestions !== false,
  };
};

const hasQuizInModules = (course) =>
  (course?.modules || []).some(
    (m) =>
      (m.microAssessments || []).some((ma) => (ma.questions || []).length > 0) ||
      (m.quizzes || []).some((q) => q?.question) ||
      (m.days || []).some((d) =>
        (d.steps || []).some(
          (s) => s.type === 'quiz' && (s.content?.questions || []).length > 0
        )
      )
  );

const courseHasQuizContent = (course) =>
  Boolean(getPracticeFromLearningFlow(course)) || hasQuizInModules(course);

const syncLearningFlowToMicroAssessments = (course) => {
  const practice = getPracticeFromLearningFlow(course);
  if (!practice) return course;

  const modules = [...(course.modules || [])];
  if (!modules.length) {
    modules.push({
      title: 'Main Module',
      sequence: 1,
      status: 'active',
      days: [],
      microAssessments: [],
    });
  }

  const mod = { ...modules[0] };
  const existing = (mod.microAssessments || []).filter(
    (ma) => Number(ma.dayId) !== PRACTICE_DAY_ID
  );
  mod.microAssessments = [
    ...existing,
    {
      moduleId: practice.moduleId,
      dayId: practice.dayId,
      stepId: practice.stepId,
      title: practice.title,
      shuffleQuestions: practice.shuffleQuestions,
      questions: practice.questions,
    },
  ];
  modules[0] = mod;

  return { ...course, modules };
};

const enrichCourseForPlayer = (courseDoc) => {
  if (!courseDoc) return null;
  const course =
    typeof courseDoc.toObject === 'function'
      ? courseDoc.toObject({ virtuals: false })
      : { ...courseDoc };
  return syncLearningFlowToMicroAssessments(course);
};

const pickBestCatalogCourse = (candidates = []) => {
  if (!candidates.length) return null;
  const withQuiz = candidates.filter((c) => courseHasQuizContent(enrichCourseForPlayer(c)));
  if (withQuiz.length) {
    return withQuiz.sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    )[0];
  }
  return candidates.sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
  )[0];
};

module.exports = {
  PRACTICE_DAY_ID,
  getPracticeFromLearningFlow,
  courseHasQuizContent,
  syncLearningFlowToMicroAssessments,
  enrichCourseForPlayer,
  pickBestCatalogCourse,
};
