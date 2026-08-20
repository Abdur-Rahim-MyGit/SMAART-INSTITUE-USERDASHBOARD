// Server-side enforcement of course progression gating (T1–T4 assessments,
// sequential stage/track unlocking). Mirrors front-end/src/utils/courseUnlock.js
// so a student can't bypass the UI's locks by calling the progress-saving
// endpoints directly — without this, ENFORCE_PROGRESSION_GATES on the
// frontend is a display-only suggestion, not a real access control.

const CourseEnrollment = require('../models/CourseEnrollment');
const StageResult = require('../models/StageResult');
const BaseLineResult = require('../models/BaseLineResult');
const { STAGES, TRACKS } = require('../config/courseProgression');

const ENFORCE_PROGRESSION_GATES = true;

const classify = (course) => {
  const category = String(course.category || '').trim().toLowerCase();
  const code = String(course.courseCode || '').toUpperCase();
  const num = String(course.courseNumber || '').toUpperCase();

  if (category === 'piq' || code.startsWith('PIQ') || num.startsWith('PIQ')) return TRACKS.find((t) => t.id === 'PIQ');
  if (category === 'aiq' || code.startsWith('AIQ') || num.startsWith('AIQ')) return TRACKS.find((t) => t.id === 'AIQ');
  if (category === 'sq' || code.startsWith('SQ') || num.startsWith('SQ')) return TRACKS.find((t) => t.id === 'SQ');
  if (category === 'british council' || code.startsWith('BC') || num.startsWith('BC')) return TRACKS.find((t) => t.id === 'British Council');

  const stageByCategory = STAGES.find((s) => s.category.toLowerCase() === category);
  if (stageByCategory) return stageByCategory;

  const numeric = parseInt((num || code).replace(/\D/g, ''), 10);
  if (!isNaN(numeric)) {
    if (numeric <= 10) return STAGES[0];
    if (numeric <= 19) return STAGES[1];
    if (numeric <= 25) return STAGES[2];
  }
  return STAGES[0];
};

const getStudentProgress = async (studentId) => {
  const [enrollments, stageResults, baseline] = await Promise.all([
    CourseEnrollment.find({ student: studentId }).populate('course', 'courseCode courseNumber'),
    StageResult.find({ userId: studentId, passed: true }).select('stage'),
    BaseLineResult.findOne({ userId: studentId }).select('_id'),
  ]);

  const completedNumbers = new Set();
  enrollments.forEach((e) => {
    const isComplete = e.status === 'completed' || (e.progress || 0) >= 100;
    if (isComplete && e.course) {
      if (e.course.courseNumber) completedNumbers.add(String(e.course.courseNumber).toUpperCase());
      if (e.course.courseCode) completedNumbers.add(String(e.course.courseCode).toUpperCase());
    }
  });

  const passedAssessments = new Set(stageResults.map((r) => r.stage));
  if (baseline) passedAssessments.add('T1');

  return { completedNumbers, passedAssessments };
};

const isCompleted = (completedNumbers, ref) => !!ref && completedNumbers.has(String(ref).toUpperCase());

/**
 * Whether `studentId` may save progress against `course` right now.
 * `course` is a Mongoose Course doc (or plain object) with at least
 * courseCode/courseNumber/category/unlockAfterCourseNumber.
 */
async function canStudentAccessCourse(course, studentId) {
  if (!ENFORCE_PROGRESSION_GATES) return true;
  if (!course || !studentId) return false;

  const { completedNumbers, passedAssessments } = await getStudentProgress(studentId);

  // An admin-set per-course override takes priority over the default
  // stage/track sequencing.
  if (course.unlockAfterCourseNumber) {
    return isCompleted(completedNumbers, course.unlockAfterCourseNumber);
  }

  const bucket = classify(course);
  const targetNumber = String(course.courseNumber || course.courseCode || '').toUpperCase();
  const idx = bucket.numbers.findIndex((n) => n === targetNumber);

  if (bucket.type === 'track') {
    if (!isCompleted(completedNumbers, bucket.unlockAfter)) return false;
    if (idx <= 0) return true; // first course in the track, or an unrecognized number
    return isCompleted(completedNumbers, bucket.numbers[idx - 1]);
  }

  // Stage — Stage 1 has no assessment prerequisite; everything past it
  // requires the T1 baseline to have been passed.
  if (bucket.category !== 'Capacity' && !passedAssessments.has('T1')) return false;

  if (bucket.unlockAfter) {
    const stageGateMet = passedAssessments.has(bucket.assessmentGate) && isCompleted(completedNumbers, bucket.unlockAfter);
    if (!stageGateMet) return false;
  }

  if (idx <= 0) return true;
  return isCompleted(completedNumbers, bucket.numbers[idx - 1]);
}

module.exports = { canStudentAccessCourse, ENFORCE_PROGRESSION_GATES };
