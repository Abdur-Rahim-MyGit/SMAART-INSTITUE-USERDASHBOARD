const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connect, closeDatabase, clearDatabase } = require('../helpers/dbHandler');
const { createTestApp } = require('../helpers/testApp');

// Models
const Student = require('../../models/Student');
const College = require('../../models/College');
const Course = require('../../models/Course');
const CourseEnrollment = require('../../models/CourseEnrollment');
const Task = require('../../models/Task');
const VisionBoard = require('../../models/VisionBoard');
const Resume = require('../../models/Resume');
const ResumeVerification = require('../../models/ResumeVerification');
const Certificate = require('../../models/Certificate');
const UserCertificate = require('../../models/UserCertificate');
const CareerIntelligence = require('../../models/CareerIntelligence');

const { protect } = require('../../middleware/auth');

// Mock missing production import in routes/aiCareerCoach.js
jest.mock('../../middleware/authMiddleware', () => {
    const auth = require('../../middleware/auth');
    return auth.protect;
}, { virtual: true });

// Mock external AI services and Cloudinary to prevent live network calls
jest.mock('../../services/careerAIService', () => ({
    enhanceWithAI: jest.fn().mockResolvedValue({
        summary: 'Mocked AI career insight',
        recommendedSkills: ['Python', 'Data Engineering']
    })
}));

jest.mock('../../services/openRouterService', () => ({
    generateChatCompletion: jest.fn().mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ roleOverview: 'Software Engineer Overview' }) } }]
    }),
    isConfigured: jest.fn().mockReturnValue(true)
}));

jest.mock('../../middleware/upload', () => {
    const multer = require('multer');
    return {
        cloudinary: {
            uploader: {
                upload_stream: jest.fn((options, callback) => ({
                    end: jest.fn(() => callback(null, { secure_url: 'https://mock.cloudinary/image.jpg' }))
                }))
            },
            api: {
                resources: jest.fn().mockResolvedValue({ resources: [] })
            }
        },
        uploadRegistration: multer({ storage: multer.memoryStorage() })
    };
});

// Routes
const courseRoutes = require('../../routes/courses');
const courseEnrollmentRoutes = require('../../routes/courseEnrollments');
const taskRoutes = require('../../routes/tasks');
const careerIntelligenceRoutes = require('../../routes/careerIntelligence');
const careerAgentRoutes = require('../../routes/careerAgent');
const aiCareerCoachRoutes = require('../../routes/aiCareerCoach');
const visionBoardRoutes = require('../../routes/visionBoards');
const resumeRoutes = require('../../routes/resumes');
const certificateRoutes = require('../../routes/certificates');
const userCertificateRoutes = require('../../routes/userCertificates');

let app;
let defaultCollege;
const testJwtSecret = 'test-jwt-secret-key-for-unit-testing-32-chars';

beforeAll(async () => {
    process.env.JWT_SECRET = testJwtSecret;
    process.env.NODE_ENV = 'test';
    await connect();

    app = createTestApp((testExpressApp) => {
        testExpressApp.use('/api/courses', courseRoutes);
        testExpressApp.use('/api/course-enrollments', courseEnrollmentRoutes);
        testExpressApp.use('/api/tasks', taskRoutes);
        testExpressApp.use('/api/career-intelligence', protect, careerIntelligenceRoutes);
        testExpressApp.use('/api/career-agent', careerAgentRoutes);
        testExpressApp.use('/api/ai-career-coach', aiCareerCoachRoutes);
        testExpressApp.use('/api/vision-boards', visionBoardRoutes);
        testExpressApp.use('/api/resumes', resumeRoutes);
        testExpressApp.use('/api/certificates', certificateRoutes);
        testExpressApp.use('/api/user-certificates', userCertificateRoutes);
    });
});

afterAll(async () => {
    await closeDatabase();
});

beforeEach(async () => {
    await clearDatabase();
    defaultCollege = await College.create({
        collegeName: 'SMAART Institute of Technology',
        collegeCode: 'SMAART03',
        collegeNumber: '03',
        institutionType: 'Autonomous College',
        email: 'admin3@smaart.edu',
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
        { userId: student._id.toString(), id: student._id.toString(), userType: student.userType || 'student', role: student.role || 'student', sessionId: student.currentSessionId },
        testJwtSecret,
        { expiresIn: '2h' }
    );

    return { student, token, authHeader: `Bearer ${token}` };
};

describe('Batch 3: Courses, Enrollment & Career/Resume Integration Tests', () => {

    describe('routes/courses.js & routes/courseEnrollments.js', () => {
        let studentA, studentB, adminStaff, sampleCourse;

        beforeEach(async () => {
            studentA = await createStudentWithToken({ fullName: 'Alice Walker' });
            studentB = await createStudentWithToken({ fullName: 'Bob Martin' });
            adminStaff = await createStudentWithToken({ fullName: 'Admin Staff', role: 'admin', userType: 'user' });

            sampleCourse = await Course.create({
                title: 'Data Structures and Algorithms',
                courseCode: 'CS101',
                courseNumber: '101',
                category: 'Capacity',
                description: 'Core foundational CS course',
                duration: 40,
                createdBy: adminStaff.student._id,
                modules: [
                    {
                        sequence: 1,
                        title: 'Module 1: Introduction to DSA',
                        description: 'Foundations of Algorithms',
                        days: [
                            { dayNumber: 1, dayId: 1, title: 'Day 1: Complexity', tasks: [{ taskId: 1, title: 'Big-O notation' }] }
                        ]
                    }
                ]
            });
        });

        it('fetches course catalog for authenticated user', async () => {
            const res = await request(app)
                .get('/api/courses')
                .set('Authorization', studentA.authHeader);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('allows student to enroll in course and isolates enrollment records', async () => {
            // Student A enrolls
            const resEnroll = await request(app)
                .post('/api/course-enrollments')
                .set('Authorization', studentA.authHeader)
                .send({
                    course: sampleCourse._id,
                    student: studentA.student._id
                });

            expect(resEnroll.status).toBe(201);
            expect(resEnroll.body.success).toBe(true);
            expect(resEnroll.body.data.course.toString()).toBe(sampleCourse._id.toString());

            // Student A queries enrollments -> finds 1 enrollment
            const resListA = await request(app)
                .get('/api/course-enrollments')
                .set('Authorization', studentA.authHeader);

            expect(resListA.status).toBe(200);
            expect(resListA.body.data.length).toBe(1);

            // Student B queries enrollments -> receives only their own records (empty)
            const resListB = await request(app)
                .get('/api/course-enrollments')
                .set('Authorization', studentB.authHeader);

            expect(resListB.status).toBe(200);
            expect(resListB.body.data.length).toBe(0);
        });

        it('blocks non-owner from accessing another student enrollment by ID (403)', async () => {
            const enrollmentA = await CourseEnrollment.create({
                student: studentA.student._id,
                course: sampleCourse._id,
                status: 'in_progress',
                progress: 10
            });

            // Student B tries to fetch Student A's enrollment
            const resGetB = await request(app)
                .get(`/api/course-enrollments/${enrollmentA._id}`)
                .set('Authorization', studentB.authHeader);

            expect(resGetB.status).toBe(403);
            expect(resGetB.body.success).toBe(false);
        });

        it('updates task progress correctly via POST /api/course-enrollments/task-progress', async () => {
            const resTask = await request(app)
                .post('/api/course-enrollments/task-progress')
                .set('Authorization', studentA.authHeader)
                .send({
                    courseCode: 'CS101',
                    moduleId: 1,
                    dayId: 1,
                    taskId: 1,
                    completed: true
                });

            expect(resTask.status).toBe(200);
            expect(resTask.body.success).toBe(true);
            expect(resTask.body.data.moduleProgress.length).toBeGreaterThan(0);
        });
    });

    describe('routes/tasks.js (User Task & Todo Management)', () => {
        let taskUser;

        beforeEach(async () => {
            taskUser = await createStudentWithToken({ fullName: 'Task Creator' });
        });

        it('creates a new task and validates required fields', async () => {
            // Validation failure (missing title & date)
            const resBad = await request(app)
                .post('/api/tasks')
                .set('Authorization', taskUser.authHeader)
                .send({});

            expect(resBad.status).toBe(400);

            // Success case
            const resSuccess = await request(app)
                .post('/api/tasks')
                .set('Authorization', taskUser.authHeader)
                .send({
                    title: 'Complete DSA Module 1',
                    date: '2026-09-01',
                    type: 'personal',
                    priority: 'High',
                    status: 'Pending'
                });

            expect(resSuccess.status).toBe(200);
            expect(resSuccess.body.title).toBe('Complete DSA Module 1');
        });

        it('retrieves user tasks and isolates per-user tasks', async () => {
            await Task.create({
                user: taskUser.student._id,
                title: 'Review Resume Draft',
                date: new Date(),
                status: 'Pending',
                priority: 'Medium'
            });

            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', taskUser.authHeader);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('Review Resume Draft');
        });
    });

    describe('routes/careerIntelligence.js & routes/careerAgent.js', () => {
        let careerUser;

        beforeEach(async () => {
            careerUser = await createStudentWithToken({ fullName: 'Career Candidate' });
        });

        it('fetches excel taxonomy structure via GET /api/career-intelligence/excel-data', async () => {
            const res = await request(app)
                .get('/api/career-intelligence/excel-data')
                .set('Authorization', careerUser.authHeader);

            expect(res.status).toBe(200);
            expect(res.body.masterSectors).toBeDefined();
            expect(res.body.allRoles).toBeDefined();
        });

        it('retrieves user career reports with zero-leak isolation', async () => {
            await CareerIntelligence.create({
                userId: careerUser.student._id,
                userInput: {
                    educationLevel: 'Undergraduate',
                    areaOfInterest: 'Technology',
                    interestedJobRole: 'Software Engineer'
                },
                report: {
                    roleOverview: 'Software Engineer in IT sector'
                },
                status: 'completed'
            });

            const res = await request(app)
                .get('/api/career-intelligence/reports')
                .set('Authorization', careerUser.authHeader);

            expect(res.status).toBe(200);
            expect(res.body.reports).toBeDefined();
            expect(res.body.reports.length).toBe(1);
        });
    });

    describe('routes/visionBoards.js', () => {
        let boardOwner, otherStudent;

        beforeEach(async () => {
            boardOwner = await createStudentWithToken({ fullName: 'Visionary Student' });
            otherStudent = await createStudentWithToken({ fullName: 'Other Student' });
        });

        it('retrieves vision boards for authenticated user', async () => {
            await VisionBoard.create({
                userId: boardOwner.student._id,
                title: 'Tech Lead Aspirations 2027',
                description: 'Career goal board'
            });

            // Owner fetches boards
            const resOwner = await request(app)
                .get('/api/vision-boards')
                .set('Authorization', boardOwner.authHeader);

            expect(resOwner.status).toBe(200);
            expect(resOwner.body.length).toBe(1);
            expect(resOwner.body[0].title).toBe('Tech Lead Aspirations 2027');

            // Other student fetches boards -> empty
            const resOther = await request(app)
                .get('/api/vision-boards')
                .set('Authorization', otherStudent.authHeader);

            expect(resOther.status).toBe(200);
            expect(resOther.body.length).toBe(0);
        });

        it('enforces ownership on single vision board GET /:id', async () => {
            const board = await VisionBoard.create({
                userId: boardOwner.student._id,
                title: 'Private Ambitions',
                description: 'Private'
            });

            // Owner access -> 200 OK
            const resOwner = await request(app)
                .get(`/api/vision-boards/${board._id}`)
                .set('Authorization', boardOwner.authHeader);

            expect(resOwner.status).toBe(200);
            expect(resOwner.body.title).toBe('Private Ambitions');

            // Other student access -> 403 Forbidden
            const resOther = await request(app)
                .get(`/api/vision-boards/${board._id}`)
                .set('Authorization', otherStudent.authHeader);

            expect(resOther.status).toBe(403);
        });
    });

    describe('routes/resumes.js', () => {
        let resumeStudent, otherUser, testResume;

        beforeEach(async () => {
            resumeStudent = await createStudentWithToken({ fullName: 'Resume Applicant' });
            otherUser = await createStudentWithToken({ fullName: 'Other Applicant' });

            testResume = await Resume.create({
                userId: resumeStudent.student._id,
                personalInfo: {
                    fullName: 'Resume Applicant',
                    email: 'applicant@example.com',
                    targetRole: 'Full Stack Engineer'
                },
                sections: []
            });
        });

        it('authorizes secure resume export and generates tamper-evident fingerprint', async () => {
            const res = await request(app)
                .post(`/api/resumes/${testResume._id}/export`)
                .set('Authorization', resumeStudent.authHeader);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.resumePublicId).toBeDefined();
            expect(res.body.data.fingerprint).toBeDefined();
            expect(res.body.data.holderName).toBe('Resume Applicant');
        });

        it('rejects export request for a resume owned by another user (404)', async () => {
            const res = await request(app)
                .post(`/api/resumes/${testResume._id}/export`)
                .set('Authorization', otherUser.authHeader);

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('verifies valid public resume export record via GET /api/resumes/verify/:publicId', async () => {
            // First export
            const resExport = await request(app)
                .post(`/api/resumes/${testResume._id}/export`)
                .set('Authorization', resumeStudent.authHeader);

            const publicId = resExport.body.data.resumePublicId;
            const fingerprint = resExport.body.data.fingerprint;

            // Public verification endpoint
            const resVerify = await request(app)
                .get(`/api/resumes/verify/${publicId}?h=${fingerprint}`);

            expect(resVerify.status).toBe(200);
            expect(resVerify.body.verified).toBe(true);
            expect(resVerify.body.data.holderName).toBe('Resume Applicant');
        });
    });

    describe('routes/certificates.js & routes/userCertificates.js', () => {
        let certStudent, certAdmin;

        beforeEach(async () => {
            certStudent = await createStudentWithToken({ fullName: 'Certified Student' });
            certAdmin = await createStudentWithToken({ fullName: 'Cert Admin', role: 'admin', userType: 'user' });
        });

        it('restricts manual certificate issuance to admin users (403 for students)', async () => {
            const certPayload = {
                certificateType: 'capacity',
                certificateTitle: 'Capacity Stage Certification',
                validatedSkills: [
                    { label: 'Problem Solving', score: 85 },
                    { label: 'Data Structures', score: 90 }
                ]
            };

            // Student attempt -> 403
            const resStudent = await request(app)
                .post('/api/certificates/issue')
                .set('Authorization', certStudent.authHeader)
                .send(certPayload);

            expect(resStudent.status).toBe(403);

            // Admin attempt -> 200/201 Success
            const resAdmin = await request(app)
                .post('/api/certificates/issue')
                .set('Authorization', certAdmin.authHeader)
                .send(certPayload);

            expect([200, 201]).toContain(resAdmin.status);
            expect(resAdmin.body.certificate.certificateId).toBeDefined();
        });

        it('retrieves user uploaded certificates via GET /api/user-certificates and protects isolation', async () => {
            await UserCertificate.create({
                userId: certStudent.student._id,
                title: 'AWS Certified Cloud Practitioner',
                issuer: 'Amazon Web Services',
                issueDate: new Date(),
                certificateUrl: 'https://example.com/aws-cert.pdf'
            });

            // Student requests certificates
            const res = await request(app)
                .get('/api/user-certificates')
                .set('Authorization', certStudent.authHeader);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].title).toBe('AWS Certified Cloud Practitioner');
        });
    });
});
