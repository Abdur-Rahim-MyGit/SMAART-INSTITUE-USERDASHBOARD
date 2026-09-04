const mongoose = require('mongoose');
const {
    COURSE_STAGE_TITLES,
    CURRENT_COURSE_CATALOG,
    TEMP_VIDEO_URL,
    normalizeCourseStages,
    buildCatalogCoursePayload
} = require('../../utils/courseStageDefaults');
const { isSessionCompleted, isModuleCompleted } = require('../../utils/progressUtils');
const { getLevel, calculateBaseLineProfile } = require('../../utils/baselineUtils');

describe('Course & Progression Utilities Unit Tests', () => {
    describe('courseStageDefaults', () => {
        it('exports predefined course catalog and stage titles', () => {
            expect(COURSE_STAGE_TITLES).toHaveLength(7);
            expect(CURRENT_COURSE_CATALOG.length).toBeGreaterThan(10);
            expect(typeof TEMP_VIDEO_URL).toBe('string');
        });

        it('normalizeCourseStages constructs a 7-stage normalized module structure and preserves custom steps & microAssessments', () => {
            const courseInput = {
                title: 'Leadership Skills',
                category: 'Leadership',
                modules: [{
                    microAssessments: [{ title: 'Quiz 1' }],
                    days: [{
                        title: 'Custom Day 1',
                        steps: [{ stepNumber: 1, title: 'Custom Step', type: 'video' }]
                    }]
                }]
            };
            const existingCourse = {
                modules: [{
                    sequence: 2,
                    days: [{
                        steps: [{ stepNumber: 1, title: 'Old Step', type: 'text' }]
                    }]
                }]
            };
            const normalized = normalizeCourseStages(courseInput, existingCourse);

            expect(normalized.modules).toHaveLength(1);
            expect(normalized.modules[0].days).toHaveLength(7);
            expect(normalized.duration).toBe(7);
            expect(normalized.modules[0].microAssessments).toHaveLength(1);
            expect(normalized.modules[0].days[0].steps[0].title).toBe('Custom Step');
        });

        it('buildCatalogCoursePayload creates a valid course payload from catalog item', () => {
            const catalogItem = CURRENT_COURSE_CATALOG[0];
            const userId = new mongoose.Types.ObjectId();
            const payload = buildCatalogCoursePayload(catalogItem, userId);

            expect(payload.courseCode).toBe(catalogItem.id);
            expect(payload.title).toBe(catalogItem.title);
            expect(payload.createdBy).toBe(userId);
            expect(payload.modules[0].days).toHaveLength(7);
        });
    });

    describe('progressUtils', () => {
        const moduleId = new mongoose.Types.ObjectId();
        const mockModule = {
            _id: moduleId,
            days: [{ dayNumber: 1 }, { dayNumber: 2 }]
        };

        it('isSessionCompleted returns true when video is completed for the day', async () => {
            const enrollment = {
                moduleProgress: [{
                    module: moduleId,
                    videoProgress: [{ dayId: 1, isCompleted: true }],
                    completedTasks: [],
                    taskResults: [],
                    quizzesTaken: []
                }]
            };

            const completed = await isSessionCompleted(enrollment, {}, mockModule, 1);
            expect(completed).toBe(true);
        });

        it('isSessionCompleted returns true when tasks or quizzes are completed', async () => {
            const enrollment = {
                moduleProgress: [{
                    module: moduleId,
                    videoProgress: [],
                    completedTasks: [{ dayId: 2 }],
                    taskResults: [],
                    quizzesTaken: []
                }]
            };

            const completed = await isSessionCompleted(enrollment, {}, mockModule, 2);
            expect(completed).toBe(true);
        });

        it('isSessionCompleted returns false when no activity is completed', async () => {
            const enrollment = {
                moduleProgress: [{
                    module: moduleId,
                    videoProgress: [{ dayId: 1, isCompleted: false }],
                    completedTasks: [],
                    taskResults: [],
                    quizzesTaken: []
                }]
            };

            const completed = await isSessionCompleted(enrollment, {}, mockModule, 1);
            expect(completed).toBe(false);
        });

        it('isModuleCompleted checks all days in module', async () => {
            const enrollment = {
                moduleProgress: [{
                    module: moduleId,
                    videoProgress: [
                        { dayId: 1, isCompleted: true },
                        { dayId: 2, isCompleted: true }
                    ]
                }]
            };

            const modCompleted = await isModuleCompleted(enrollment, {}, mockModule);
            expect(modCompleted).toBe(true);
        });
    });

    describe('baselineUtils', () => {
        it('getLevel maps numeric scores into performance bands correctly', () => {
            expect(getLevel(90)).toBe('Advanced');
            expect(getLevel(75)).toBe('Strong');
            expect(getLevel(50)).toBe('Progressing');
            expect(getLevel(30)).toBe('Developing');
            expect(getLevel(10)).toBe('Emerging');
        });

        it('calculateBaseLineProfile computes quotient profiles and overall baseline score', () => {
            const q1Id = new mongoose.Types.ObjectId();
            const q2Id = new mongoose.Types.ObjectId();

            const assessment = {
                questions: [
                    { _id: q1Id, quotient: 'CRQ', correctAnswer: 'A' },
                    { _id: q2Id, quotient: 'CRQ', correctAnswer: 'B' }
                ]
            };

            const result = {
                responses: [
                    { questionId: q1Id, selectedValue: 'A' },
                    { questionId: q2Id, selectedValue: 'C' } // wrong
                ]
            };

            const profile = calculateBaseLineProfile(assessment, result);
            expect(profile.score).toBe(1);
            expect(profile.totalScore).toBe(2);
            expect(profile.percentage).toBe(50);
            expect(profile.t1Profile.CRQ.rawScore).toBe(50);
            expect(profile.baselineScore).toBe(50);
            expect(profile.stageBand).toBe('Progressing');

            // Custom quotient and missing question response
            const customQId = new mongoose.Types.ObjectId();
            const unmappedQId = new mongoose.Types.ObjectId();
            const customAssessment = {
                questions: [{ _id: customQId, quotient: 'CUSTOMQ', correctAnswer: 'D' }]
            };
            const customResult = {
                responses: [
                    { questionId: customQId, selectedValue: 'D' },
                    { questionId: unmappedQId, selectedValue: 'X' }
                ]
            };
            const customProfile = calculateBaseLineProfile(customAssessment, customResult);
            expect(customProfile.score).toBe(1);
            expect(customProfile.t1Profile.CUSTOMQ.rawScore).toBe(100);
        });
    });
});
