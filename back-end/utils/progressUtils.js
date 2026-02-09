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
        const dayObj = moduleDoc.days.find(d => d.dayNumber === dayIdInt);
        if (!dayObj) return false;

        const mProg = enrollment.moduleProgress.find(mp => mp.module.toString() === moduleDoc._id.toString());
        if (!mProg) return false;

        // Define required steps for this day from the course schema
        const requiredSteps = dayObj.steps ? dayObj.steps.filter(s => s.isRequired !== false) : [];

        // If no steps defined, we look at VideoContent (legacy/alternative structure)
        if (requiredSteps.length === 0) {
            // Check if there are videos in VideoContent
            const videosInDay = dayObj.VideoContent || [];
            if (videosInDay.length > 0) {
                // If there are videos, ensure at least one is completed for this day
                return mProg.videoProgress && mProg.videoProgress.some(vp =>
                    vp.dayId === dayIdInt && vp.isCompleted
                );
            }
            return true;
        }

        for (const step of requiredSteps) {
            if (step.type === 'video') {
                const isDone = mProg.videoProgress && mProg.videoProgress.some(vp =>
                    vp.dayId === dayIdInt && vp.stepId === step.stepNumber && vp.isCompleted
                );
                if (!isDone) return false;
            } else if (['quiz', 'assessment', 'assignment', 'submission', 'reflection', 'flashcards', 'flashcard'].includes(step.type)) {
                // These are typically tracked in completedTasks
                const isDone = mProg.completedTasks && mProg.completedTasks.some(ct =>
                    ct.dayId === dayIdInt && ct.taskId === step.stepNumber
                );
                if (!isDone) return false;
            }
        }
        return true;
    } catch (err) {
        console.error('Error in isSessionCompleted:', err);
        return false;
    }
};

module.exports = {
    isSessionCompleted
};
