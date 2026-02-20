/**
 * Check if all required activities for a specific day (session) are completed
 * @param {Object} enrollment - Enrollment document
 * @param {Object} course - Course document
 * @param {Object} moduleDoc - Current module document
 * @param {Number|String} dayId - Day number
 * @returns {Promise<Boolean>}
 */
const isSessionCompleted = async (enrollment, course, moduleDoc, dayId) => {
    try {
        const dayIdInt = parseInt(dayId);
        const mProg = enrollment.moduleProgress.find(mp => mp.module.toString() === moduleDoc._id.toString());
        if (!mProg) return false;

        // A day is considered completed if there is ANY completed activity for that dayId
        // This matches the logic in CourseEnrollment.js pre-save hook

        // 1. Check videos
        const hasVideoDone = mProg.videoProgress && mProg.videoProgress.some(vp =>
            vp.dayId === dayIdInt && vp.isCompleted
        );
        if (hasVideoDone) return true;

        // 2. Check tasks/quizzes/etc
        const hasTaskDone = mProg.completedTasks && mProg.completedTasks.some(ct =>
            ct.dayId === dayIdInt
        );
        if (hasTaskDone) return true;

        const hasTaskResult = mProg.taskResults && mProg.taskResults.some(tr =>
            tr.dayId === dayIdInt
        );
        if (hasTaskResult) return true;

        const hasQuizDone = mProg.quizzesTaken && mProg.quizzesTaken.some(qt =>
            qt.dayId === dayIdInt
        );
        if (hasQuizDone) return true;

        return false;
    } catch (err) {
        console.error('Error in isSessionCompleted:', err);
        return false;
    }
};

/**
 * Check if all required activities for an entire module are completed
 * @param {Object} enrollment - Enrollment document
 * @param {Object} course - Course document
 * @param {Object} moduleDoc - Current module document
 * @returns {Promise<Boolean>}
 */
const isModuleCompleted = async (enrollment, course, moduleDoc) => {
    try {
        if (!moduleDoc.days || moduleDoc.days.length === 0) return false;

        for (const day of moduleDoc.days) {
            const isDone = await isSessionCompleted(enrollment, course, moduleDoc, day.dayNumber);
            if (!isDone) return false;
        }
        return true;
    } catch (err) {
        console.error('Error in isModuleCompleted:', err);
        return false;
    }
};

module.exports = {
    isSessionCompleted,
    isModuleCompleted
};
