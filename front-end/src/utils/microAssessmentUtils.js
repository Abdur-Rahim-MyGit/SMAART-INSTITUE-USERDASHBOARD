/**
 * Admin course-builder quizzes: options A–D, correctAnswer as letter (A/B/C/D),
 * option text, index, or full answer string.
 */

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const getOptionLabel = (index) => OPTION_LABELS[index] ?? String(index + 1);

export const normalizeQuizQuestion = (raw = {}) => {
  let options = raw.options;

  if (options && typeof options === 'object' && !Array.isArray(options)) {
    options = OPTION_LABELS.filter((label) => {
      const val = options[label] ?? options[label.toLowerCase()];
      return val != null && String(val).trim() !== '';
    }).map((label) => String(options[label] ?? options[label.toLowerCase()]).trim());
  } else if (Array.isArray(options)) {
    options = options
      .map((o) => {
        if (typeof o === 'string') return o.trim();
        return String(o?.text ?? o?.label ?? o?.value ?? '').trim();
      })
      .filter((s) => s.length > 0);
  } else {
    options = [];
  }

  return {
    ...raw,
    question: (raw.question || raw.questionText || '').trim(),
    type: raw.type || 'mcq',
    options,
    correctAnswer: raw.correctAnswer ?? raw.correct ?? raw.answer,
    explanation: (raw.explanation || raw.explanationText || '').trim(),
    points: raw.points ?? 1,
  };
};

export const normalizeQuizQuestions = (questions = []) =>
  (questions || []).map(normalizeQuizQuestion).filter((q) => q.question && q.options.length >= 2);

export const getCorrectOptionIndex = (question) => {
  const options = question?.options || [];
  const correct = question?.correctAnswer;
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

  const byText = options.findIndex(
    (opt) =>
      opt === correct ||
      String(opt).trim().toLowerCase() === str.toLowerCase()
  );
  return byText;
};

export const isAnswerCorrect = (question, selectedIndex) => {
  if (selectedIndex === null || selectedIndex === undefined) return false;
  const correctIdx = getCorrectOptionIndex(question);
  return correctIdx >= 0 && selectedIndex === correctIdx;
};

export const getMcqOptionClassName = ({ showFeedback, index, selectedIndex, question }) => {
  const correctIdx = getCorrectOptionIndex(question);
  const isSelected = selectedIndex === index;
  const isCorrectOption = index === correctIdx;

  if (!showFeedback) {
    return isSelected
      ? 'border-[#1a3884] bg-[#1a3884]/10 text-[#0e5c65] dark:text-blue-300 dark:bg-[#1a3884]/20'
      : 'border-gray-200 dark:border-white/10 hover:border-[#1a3884]/50 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]';
  }

  if (isCorrectOption) {
    return 'border-green-500 bg-green-50 text-green-800 dark:bg-green-500/10 dark:text-green-400';
  }
  if (isSelected && !isCorrectOption) {
    return 'border-red-500 bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-400';
  }
  return 'border-gray-200 dark:border-white/8 opacity-50';
};

export const pickQuizQuestions = (questions = [], maxCount = 5) => {
  const normalized = normalizeQuizQuestions(questions);
  if (!normalized.length) return { picked: [], indices: [] };

  const limit = Math.min(maxCount, normalized.length);
  const indices = Array.from({ length: normalized.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const pickedIndices = indices.slice(0, limit);
  const picked = pickedIndices.map((idx) => ({
    ...normalized[idx],
    _originalIndex: idx,
  }));
  return { picked, indices: pickedIndices };
};

export const prepareQuizSession = (questions = [], { maxCount = 5, shuffle = true } = {}) => {
  const normalized = normalizeQuizQuestions(questions);
  if (!normalized.length) return { picked: [], indices: [] };

  if (!shuffle) {
    const picked = normalized.map((q, i) => ({ ...q, _originalIndex: i }));
    return { picked, indices: normalized.map((_, i) => i) };
  }

  return pickQuizQuestions(normalized, maxCount);
};

export const computeQuizScore = (questions, userAnswers) =>
  questions.reduce((acc, q, i) => {
    const idx = userAnswers[i];
    return isAnswerCorrect(q, idx) ? acc + (q.points || 1) : acc;
  }, 0);

export const PRACTICE_STEP_KEY = '4';

/** Admin course builder stores Practice quiz on learningFlow.stepD_Practice */
export const getPracticeFromLearningFlow = (course) => {
  const practice = course?.learningFlow?.stepD_Practice;
  if (!practice || practice.activityType !== 'quiz') return null;
  const questions = practice.questions || [];
  if (!questions.length) return null;

  return {
    title: 'Practice',
    questions,
    dayId: Number(PRACTICE_STEP_KEY),
    stepId: Number(PRACTICE_STEP_KEY),
    moduleId: course?.modules?.[0]?.sequence || 1,
    shuffleQuestions: practice.randomizeQuestions !== false,
  };
};

export const courseHasQuizContent = (course) =>
  Boolean(getPracticeFromLearningFlow(course)) ||
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

/** Best micro-assessment for the catalogue Practice step (step 4). */
export const getPracticeMicroAssessment = (module) => {
  const list = (module?.microAssessments || []).filter(
    (ma) => (ma.questions || []).length > 0
  );
  if (list.length) {
    return (
      list.find((ma) => Number(ma.dayId) === Number(PRACTICE_STEP_KEY)) ||
      list.find((ma) => Number(ma.stepId) === Number(PRACTICE_STEP_KEY)) ||
      list.find((ma) => /practice/i.test(ma.title || '')) ||
      list[0]
    );
  }

  if ((module?.quizzes || []).length > 0) {
    return {
      title: 'Practice',
      questions: module.quizzes,
      dayId: Number(PRACTICE_STEP_KEY),
      stepId: Number(PRACTICE_STEP_KEY),
      moduleId: module.sequence || 1,
      shuffleQuestions: true,
    };
  }

  return null;
};

/** Replace static/demo MCQ steps with admin micro-assessments (keyed by dayId). */
export const mergeAdminQuizzesIntoFlow = (flow, course) => {
  if (!flow?.steps || !course?.modules?.[0]) return flow;

  const module = course.modules[0];
  const steps = { ...flow.steps };

  const applyAssessment = (stepKey, assessment) => {
    if (!assessment?.questions?.length) return;
    const normalized = {
      ...assessment,
      questions: normalizeQuizQuestions(assessment.questions),
    };
    const existing = steps[stepKey] || {};
    const { questions: _staticQuestions, ...restExisting } = existing;
    steps[stepKey] = {
      ...restExisting,
      title: normalized.title || existing.title || 'Micro-Assessment',
      duration: existing.duration || '10 min',
      contentType: 'quiz',
      assessmentData: normalized,
      dayId: normalized.dayId,
      moduleId: normalized.moduleId,
      shuffleQuestions: normalized.shuffleQuestions,
    };
  };

  const fromLearningFlow = getPracticeFromLearningFlow(course);
  if (fromLearningFlow) {
    applyAssessment(PRACTICE_STEP_KEY, fromLearningFlow);
  }

  (module.microAssessments || []).forEach((ma) => {
    applyAssessment(String(ma.dayId), {
      title: ma.title,
      questions: ma.questions,
      stepId: ma.stepId,
      dayId: ma.dayId,
      moduleId: ma.moduleId,
      shuffleQuestions: ma.shuffleQuestions,
    });
  });

  (module.days || []).forEach((day, index) => {
    const fromDay = getQuizAssessmentForDay(module, day, index);
    if (fromDay) {
      applyAssessment(String(fromDay.dayId ?? index + 1), fromDay);
    }
  });

  // Catalogue routes (e.g. S01) use step 4 as Practice — map admin quiz even when dayId differs
  const practiceMa = getPracticeMicroAssessment(module);
  const practiceKey = PRACTICE_STEP_KEY;
  if (
    practiceMa &&
    steps[practiceKey] &&
    !steps[practiceKey]?.assessmentData
  ) {
    applyAssessment(practiceKey, {
      title: practiceMa.title,
      questions: practiceMa.questions,
      stepId: practiceMa.stepId || Number(practiceKey),
      dayId: practiceMa.dayId ?? Number(practiceKey),
      moduleId: practiceMa.moduleId,
      shuffleQuestions: practiceMa.shuffleQuestions,
    });
  }

  return {
    ...flow,
    steps,
    courseCode: course.courseCode,
    courseDbId: course._id,
    overviewTitle: flow.overviewTitle || course.title,
  };
};

export const getQuizAssessmentForDay = (module, day, dayIndex) => {
  const dayId = day?.dayNumber ?? dayIndex + 1;

  const fromMicro = (module?.microAssessments || []).find(
    (ma) => Number(ma.dayId) === Number(dayId)
  );
  if (fromMicro?.questions?.length) {
    return {
      title: fromMicro.title || 'Micro-Assessment',
      questions: normalizeQuizQuestions(fromMicro.questions),
      stepId: fromMicro.stepId || 2,
      dayId,
      moduleId: fromMicro.moduleId || module?.sequence || 1,
      shuffleQuestions: fromMicro.shuffleQuestions !== false,
    };
  }

  const quizStep = (day?.steps || []).find(
    (s) => s.type === 'quiz' && s.content?.questions?.length > 0
  );
  if (quizStep) {
    const content = quizStep.content || {};
    return {
      title: quizStep.title || content.title || 'Micro-Assessment',
      questions: normalizeQuizQuestions(content.questions),
      stepId: quizStep.stepNumber || 2,
      dayId,
      moduleId: module?.sequence || 1,
      shuffleQuestions: content.shuffleQuestions !== false && content.shuffle !== false,
    };
  }

  return null;
};
