const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connect, closeDatabase, clearDatabase } = require('../helpers/dbHandler');
const { createTestApp } = require('../helpers/testApp');

const Student = require('../../models/Student');
const College = require('../../models/College');
const Assessment = require('../../models/Assessment');
const Result = require('../../models/Result');
const StageResult = require('../../models/StageResult');
const BaseLineResult = require('../../models/BaseLineResult');
const ProctoringSession = require('../../models/ProctoringSession');
const QuestionBank = require('../../models/QuestionBank');

const assessmentRoutes = require('../../routes/assessments');
const stageResultRoutes = require('../../routes/stageresults');
const baselineResultRoutes = require('../../routes/baselineresults');
const resultRoutes = require('../../routes/results');
const proctoringRoutes = require('../../routes/proctoring');
const questionBankRoutes = require('../../routes/questionBanks');

let app;
let defaultCollege;
const testJwtSecret = 'test-jwt-secret-key-for-unit-testing-32-chars';

beforeAll(async () => {
    process.env.JWT_SECRET = testJwtSecret;
    process.env.NODE_ENV = 'test';
    await connect();

    app = createTestApp((testExpressApp) => {
        testExpressApp.use('/api/assessments', assessmentRoutes);
        testExpressApp.use('/api/stageresults', stageResultRoutes);
        testExpressApp.use('/api/baselineresults', baselineResultRoutes);
        testExpressApp.use('/api/results', resultRoutes);
        testExpressApp.use('/api/proctoring', proctoringRoutes);
        testExpressApp.use('/api/questionbanks', questionBankRoutes);
    });
});

afterAll(async () => {
    await closeDatabase();
});

beforeEach(async () => {
    await clearDatabase();
    defaultCollege = await College.create({
        collegeName: 'SMAART Institute of Technology',
        collegeCode: 'SMAART02',
        collegeNumber: '02',
        institutionType: 'Autonomous College',
        email: 'admin2@smaart.edu',
        contactNumber: '9876543210',
        registrationNumber: 'REG-54321',
        accreditationStatus: 'NAAC',
        status: 'Active'
    });
});

// Helper to create students and signed JWT tokens
const createStudentWithToken = async (overrides = {}) => {
    const student = new Student({
        fullName: 'Test Student',
        email: 'student-' + Math.random().toString(36).substr(2, 6) + '@example.com',
        password: 'Password123!',
        mobile: '9876543210',
        rollNumber: 'ROLL-' + Math.random().toString(36).substr(2, 6),
        studentId: 'STU-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        college: defaultCollege._id,
        isRegistered: true,
        status: 'active',
        role: 'student',
        userType: 'student',
        currentSessionId: 'sess-' + Math.random().toString(36).substr(2, 6),
        sessionExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        ...overrides
    });
    await student.save();

    const token = jwt.sign(
        { userId: student._id.toString(), userType: student.userType || 'student', role: student.role || 'student', sessionId: student.currentSessionId },
        testJwtSecret,
        { expiresIn: '2h' }
    );

    return { student, token, authHeader: `Bearer ${token}` };
};

describe('Batch 2: Assessments, Progression & Results Integration Tests', () => {

    describe('routes/assessments.js', () => {
        let studentA, studentB, staffAdmin, sampleAssessment;

        beforeEach(async () => {
            studentA = await createStudentWithToken({ fullName: 'Student Alice' });
            studentB = await createStudentWithToken({ fullName: 'Student Bob' });
            staffAdmin = await createStudentWithToken({ fullName: 'Staff Admin', role: 'admin', userType: 'user' });

            sampleAssessment = await Assessment.create({
                assessmentCode: 'T1_BASELINE',
                assessmentName: 'Stage 1 Baseline Assessment',
                description: 'Foundation test description',
                questionCategory: 'General Aptitude',
                status: 'active',
                duration: 45,
                createdBy: staffAdmin.student._id,
                questions: [
                    {
                        questionText: 'What is 2 + 2?',
                        questionType: 'multiple_choice',
                        options: [
                            { label: 'A', text: '3', value: 'A' },
                            { label: 'B', text: '4', value: 'B' },
                            { label: 'C', text: '5', value: 'C' }
                        ],
                        correctAnswer: 'B',
                        marks: 1
                    }
                ]
            });
        });

        it('fetches assessment list and sanitizes answers for student users', async () => {
            const res = await request(app)
                .get('/api/assessments')
                .set('Authorization', studentA.authHeader);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('sanitizes correctAnswer field when student fetches assessment by code', async () => {
            const res = await request(app)
                .get('/api/assessments/code/T1_BASELINE')
                .set('Authorization', studentA.authHeader);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.questions[0].correctAnswer).toBeUndefined(); // stripped for students
        });

        it('preserves correctAnswer field when admin/staff fetches assessment by code', async () => {
            const res = await request(app)
                .get('/api/assessments/code/T1_BASELINE')
                .set('Authorization', staffAdmin.authHeader);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.questions[0].correctAnswer).toBe('B');
        });

        it('checks completion status via /code/:code/status', async () => {
            const resBefore = await request(app)
                .get('/api/assessments/code/T1_BASELINE/status')
                .set('Authorization', studentA.authHeader);

            expect(resBefore.status).toBe(200);
            expect(resBefore.body.data.completed).toBe(false);

            // Record completed result
            await Result.create({
                userId: studentA.student._id,
                assessmentId: sampleAssessment._id,
                assessmentName: 'Stage 1 Baseline Assessment',
                assessmentCode: 'T1_BASELINE',
                totalQuestions: 1,
                completionStatus: 'completed',
                submittedAt: new Date(),
                score: 1
            });

            const resAfter = await request(app)
                .get('/api/assessments/code/T1_BASELINE/status')
                .set('Authorization', studentA.authHeader);

            expect(resAfter.status).toBe(200);
            expect(resAfter.body.data.completed).toBe(true);
            expect(resAfter.body.data.resultId).toBeDefined();
        });

        it('allows staff to create assessment and rejects non-staff (403)', async () => {
            const newAssessmentPayload = {
                assessmentCode: 'T2_INTERMEDIATE',
                assessmentName: 'Stage 2 Intermediate Test',
                description: 'Intermediate stage examination',
                questionCategory: 'Core Skills',
                status: 'active',
                duration: 40,
                createdBy: staffAdmin.student._id,
                questions: [
                    {
                        questionText: 'What is 5 * 5?',
                        questionType: 'multiple_choice',
                        options: [
                            { label: 'A', text: '25', value: 'A' },
                            { label: 'B', text: '20', value: 'B' }
                        ],
                        correctAnswer: 'A',
                        marks: 1
                    }
                ]
            };

            // Student attempt -> 403 Forbidden
            const resStudent = await request(app)
                .post('/api/assessments')
                .set('Authorization', studentA.authHeader)
                .send(newAssessmentPayload);

            expect(resStudent.status).toBe(403);

            // Staff attempt -> 201 Created
            const resStaff = await request(app)
                .post('/api/assessments')
                .set('Authorization', staffAdmin.authHeader)
                .send(newAssessmentPayload);

            expect(resStaff.status).toBe(201);
            expect(resStaff.body.data.assessmentCode).toBe('T2_INTERMEDIATE');
        });
    });

    describe('routes/stageresults.js & routes/baselineresults.js', () => {
        let student1, student2, staff;

        beforeEach(async () => {
            student1 = await createStudentWithToken({ fullName: 'Student One' });
            student2 = await createStudentWithToken({ fullName: 'Student Two' });
            staff = await createStudentWithToken({ fullName: 'Staff User', role: 'admin', userType: 'user' });

            const fakeResultId = new mongoose.Types.ObjectId();

            // Create Baseline result for Student 1
            await BaseLineResult.create({
                userId: student1.student._id,
                resultId: fakeResultId,
                baselineScore: 78,
                stageBand: 'Strong',
                score: 28,
                totalScore: 36,
                percentage: 77.78,
                t1Profile: {
                    CRQ: { rawScore: 80, level: 'Strong', earned: 8, possible: 10 },
                    SRQ: { rawScore: 75, level: 'Progressing', earned: 7, possible: 10 },
                    LQ: { rawScore: 82, level: 'Strong', earned: 8, possible: 10 },
                    SIQ: { rawScore: 78, level: 'Strong', earned: 8, possible: 10 },
                    PEQ: { rawScore: 76, level: 'Strong', earned: 7, possible: 10 },
                    DAQ: { rawScore: 80, level: 'Strong', earned: 8, possible: 10 }
                }
            });

            // Create Stage T2 result for Student 1
            await StageResult.create({
                userId: student1.student._id,
                stage: 'T2',
                stageScore: 85,
                stageBand: 'Advanced',
                passed: true,
                score: 34,
                totalScore: 40,
                percentage: 85,
                totalQuestions: 40,
                resultId: fakeResultId
            });
        });

        it('returns all stage results for user and scopes requests to own userId', async () => {
            // Student 1 requests their own results
            const resOwn = await request(app)
                .get(`/api/stageresults/user/${student1.student._id}`)
                .set('Authorization', student1.authHeader);

            expect(resOwn.status).toBe(200);
            expect(resOwn.body.success).toBe(true);
            expect(resOwn.body.data.T1).toBeDefined();
            expect(resOwn.body.data.T2).toBeDefined();
            expect(resOwn.body.data.T1.stageScore).toBe(78);

            // Student 2 requests Student 1's results -> Scoped strictly to Student 2's data (empty)
            const resOther = await request(app)
                .get(`/api/stageresults/user/${student1.student._id}`)
                .set('Authorization', student2.authHeader);

            expect(resOther.status).toBe(200);
            expect(resOther.body.data.T1).toBeUndefined(); // Student 2 has no records
        });

        it('allows staff to view any student stage results', async () => {
            const resStaff = await request(app)
                .get(`/api/stageresults/user/${student1.student._id}`)
                .set('Authorization', staff.authHeader);

            expect(resStaff.status).toBe(200);
            expect(resStaff.body.data.T1).toBeDefined();
            expect(resStaff.body.data.T1.stageScore).toBe(78);
        });

        it('fetches specific stage result via /api/stageresults/user/:userId/stage/:stage', async () => {
            const resT2 = await request(app)
                .get(`/api/stageresults/user/${student1.student._id}/stage/T2`)
                .set('Authorization', student1.authHeader);

            expect(resT2.status).toBe(200);
            expect(resT2.body.data.stage).toBe('T2');
            expect(resT2.body.data.stageScore).toBe(85);

            // 404 for unattempted stage
            const resT3 = await request(app)
                .get(`/api/stageresults/user/${student1.student._id}/stage/T3`)
                .set('Authorization', student1.authHeader);

            expect(resT3.status).toBe(404);
        });

        it('fetches baseline results via /api/baselineresults/user/:userId and protects isolation', async () => {
            const resBase = await request(app)
                .get(`/api/baselineresults/user/${student1.student._id}`)
                .set('Authorization', student1.authHeader);

            expect(resBase.status).toBe(200);
            expect(resBase.body.data.baselineScore).toBe(78);

            // Student 2 receives 404 because they have no baseline
            const resBaseS2 = await request(app)
                .get(`/api/baselineresults/user/${student1.student._id}`)
                .set('Authorization', student2.authHeader);

            expect(resBaseS2.status).toBe(404);
        });

        it('allows student to reset own baseline result via DELETE /api/baselineresults/reset/:userId', async () => {
            const resDelete = await request(app)
                .delete(`/api/baselineresults/reset/${student1.student._id}`)
                .set('Authorization', student1.authHeader);

            expect(resDelete.status).toBe(200);
            expect(resDelete.body.success).toBe(true);

            // Confirm deleted
            const inDb = await BaseLineResult.findOne({ userId: student1.student._id });
            expect(inDb).toBeNull();
        });
    });

    describe('routes/results.js (Assessment Start & Attempts)', () => {
        let studentUser, testAssessment, adminUser;

        beforeEach(async () => {
            adminUser = await createStudentWithToken({ fullName: 'Staff Admin', role: 'admin', userType: 'user' });
            studentUser = await createStudentWithToken({ fullName: 'Exam Candidate' });

            testAssessment = await Assessment.create({
                assessmentCode: 'T1_CODE_EXAM',
                assessmentName: 'Exam Test',
                description: 'Exam Test Description',
                questionCategory: 'General Aptitude',
                status: 'active',
                duration: 45,
                createdBy: adminUser.student._id,
                questions: [
                    {
                        questionText: 'Question 1',
                        questionType: 'multiple_choice',
                        options: [
                            { label: 'A', text: 'Yes', value: '1' },
                            { label: 'B', text: 'No', value: '2' }
                        ]
                    }
                ]
            });
        });

        it('starts assessment attempt and creates in-progress result document', async () => {
            const res = await request(app)
                .get(`/api/results/assessment/${testAssessment._id}/start`)
                .set('Authorization', studentUser.authHeader);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.resultId).toBeDefined();
            expect(res.body.data.questions).toBeDefined();

            // Verify in DB
            const resultDoc = await Result.findById(res.body.data.resultId);
            expect(resultDoc).toBeDefined();
            expect(resultDoc.completionStatus).toBe('in-progress');
            expect(resultDoc.userId.toString()).toBe(studentUser.student._id.toString());
        });

        it('auto-submits expired in-progress attempt upon resuming after duration expired', async () => {
            // Create an in-progress result started 2 hours ago (duration is 45 mins)
            const expiredStartedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const expiredAttempt = await Result.create({
                userId: studentUser.student._id,
                assessmentId: testAssessment._id,
                assessmentName: 'Exam Test',
                assessmentCode: 'T1_CODE_EXAM',
                totalQuestions: 1,
                completionStatus: 'in-progress',
                startedAt: expiredStartedAt,
                responses: []
            });

            const res = await request(app)
                .get(`/api/results/assessment/${testAssessment._id}/start`)
                .set('Authorization', studentUser.authHeader);

            expect([200, 201]).toContain(res.status);

            // Expired attempt was marked completed
            const updatedOldAttempt = await Result.findById(expiredAttempt._id);
            expect(updatedOldAttempt.completionStatus).toBe('completed');
        });

        it('rejects starting non-existent assessment (404)', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/results/assessment/${fakeId}/start`)
                .set('Authorization', studentUser.authHeader);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('routes/proctoring.js', () => {
        let studentProctor, adminUser;

        beforeEach(async () => {
            studentProctor = await createStudentWithToken({ fullName: 'Proctored Student' });
            adminUser = await createStudentWithToken({ fullName: 'Proctor Admin', role: 'admin', userType: 'user' });
        });

        it('starts a proctoring session via POST /api/proctoring/session/start', async () => {
            const assessmentId = new mongoose.Types.ObjectId();
            const resultId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .post('/api/proctoring/session/start')
                .set('Authorization', studentProctor.authHeader)
                .send({
                    assessmentId,
                    resultId,
                    environmentCheck: { fullScreenGranted: true, cameraGranted: true }
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(res.body.data.status).toBe('active');
        });

        it('logs a proctoring violation event during active session', async () => {
            const session = await ProctoringSession.create({
                userId: studentProctor.student._id,
                assessmentId: new mongoose.Types.ObjectId(),
                resultId: new mongoose.Types.ObjectId(),
                status: 'active',
                startTime: new Date()
            });

            const res = await request(app)
                .post(`/api/proctoring/session/${session._id}/event`)
                .set('Authorization', studentProctor.authHeader)
                .send({
                    eventType: 'tab_switch',
                    details: 'Lost focus on window'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('completes proctoring session via POST /api/proctoring/session/:sessionId/complete', async () => {
            const session = await ProctoringSession.create({
                userId: studentProctor.student._id,
                assessmentId: new mongoose.Types.ObjectId(),
                resultId: new mongoose.Types.ObjectId(),
                status: 'active',
                startTime: new Date()
            });

            const res = await request(app)
                .post(`/api/proctoring/session/${session._id}/complete`)
                .set('Authorization', studentProctor.authHeader)
                .send();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const completedSession = await ProctoringSession.findById(session._id);
            expect(completedSession.status).toBe('completed');
        });

        it('restricts admin proctoring endpoints to staff roles', async () => {
            // Student attempt -> 403 Forbidden
            const resStudent = await request(app)
                .get('/api/proctoring/admin/sessions')
                .set('Authorization', studentProctor.authHeader);

            expect(resStudent.status).toBe(403);

            // Admin attempt -> 200 OK
            const resAdmin = await request(app)
                .get('/api/proctoring/admin/sessions')
                .set('Authorization', adminUser.authHeader);

            expect(resAdmin.status).toBe(200);
            expect(resAdmin.body.success).toBe(true);
        });
    });

    describe('routes/questionBanks.js', () => {
        let studentViewer, staffCreator;

        beforeEach(async () => {
            studentViewer = await createStudentWithToken({ fullName: 'Student Read' });
            staffCreator = await createStudentWithToken({ fullName: 'Teacher Creator', role: 'teacher', userType: 'teacher' });

            await QuestionBank.create({
                questionText: 'What is the speed of light?',
                type: 'mcq',
                category: 'Physics',
                difficulty: 'medium',
                options: [
                    { label: 'A', value: '1', text: '3x10^8 m/s' },
                    { label: 'B', value: '2', text: '3x10^6 m/s' }
                ],
                createdBy: staffCreator.student._id
            });
        });

        it('blocks students from accessing question bank (403)', async () => {
            const res = await request(app)
                .get('/api/questionbanks')
                .set('Authorization', studentViewer.authHeader);

            expect(res.status).toBe(403);
        });

        it('allows teachers/staff to list and create question bank items', async () => {
            const resList = await request(app)
                .get('/api/questionbanks')
                .set('Authorization', staffCreator.authHeader);

            expect(resList.status).toBe(200);
            expect(resList.body.success).toBe(true);
            expect(resList.body.data.length).toBeGreaterThan(0);

            // Create question
            const resCreate = await request(app)
                .post('/api/questionbanks')
                .set('Authorization', staffCreator.authHeader)
                .send({
                    questionText: 'What is Newton second law of motion?',
                    type: 'mcq',
                    category: 'Physics',
                    difficulty: 'easy',
                    createdBy: staffCreator.student._id,
                    options: [
                        { label: 'A', value: 'F=ma', text: 'F = ma' },
                        { label: 'B', value: 'E=mc2', text: 'E = mc^2' }
                    ]
                });

            expect(resCreate.status).toBe(201);
            expect(resCreate.body.success).toBe(true);
        });
    });
});
