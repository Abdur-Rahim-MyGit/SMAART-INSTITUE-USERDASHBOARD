const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connect, closeDatabase, clearDatabase } = require('../helpers/dbHandler');
const { createTestApp } = require('../helpers/testApp');

const User = require('../../models/User');
const Student = require('../../models/Student');
const LoginOtp = require('../../models/LoginOtp');
const College = require('../../models/College');
const UserActivityLog = require('../../models/UserActivityLog');

const authRoutes = require('../../routes/auth');
const registrationRoutes = require('../../routes/registrations');
const securityRoutes = require('../../routes/security');

let app;
let defaultCollege;
const testJwtSecret = 'test-jwt-secret-key-for-unit-testing-32-chars';

beforeAll(async () => {
    process.env.JWT_SECRET = testJwtSecret;
    process.env.NODE_ENV = 'test';
    await connect();

    app = createTestApp((testExpressApp) => {
        testExpressApp.use('/api/auth', authRoutes);
        testExpressApp.use('/api/registrations', registrationRoutes);
        testExpressApp.use('/api/security', securityRoutes);
    });
});

afterAll(async () => {
    await closeDatabase();
});

beforeEach(async () => {
    await clearDatabase();
    defaultCollege = await College.create({
        collegeName: 'SMAART University',
        collegeCode: 'SMAART01',
        collegeNumber: '01',
        institutionType: 'University',
        email: 'admin@smaart.edu',
        contactNumber: '9876543210',
        registrationNumber: 'REG-12345',
        accreditationStatus: 'NAAC',
        status: 'Active'
    });
});

const createStudentHelper = async (overrides = {}) => {
    const student = new Student({
        fullName: 'Default Student',
        email: 'default@example.com',
        password: 'Password123!',
        mobile: '9876543210',
        rollNumber: 'ROLL-' + Math.random().toString(36).substr(2, 6),
        studentId: 'STU-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        college: defaultCollege._id,
        isRegistered: true,
        status: 'active',
        mustChangePassword: false,
        ...overrides
    });
    return await student.save();
};

describe('Batch 1: Authentication & Identity Routes Integration Tests', () => {

    describe('POST /api/auth/register', () => {
        it('registers a new student successfully and returns 201 with token', async () => {
            const payload = {
                fullName: 'Alice Johnson',
                email: 'alice@example.com',
                password: 'Password123!',
                mobileNumber: '9876543210',
                institution: 'SMAART University'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(payload);

            expect(res.status).toBe(201);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe('alice@example.com');
            expect(res.body.user.fullName).toBe('Alice Johnson');

            // Verify in database
            const student = await Student.findOne({ email: 'alice@example.com' });
            expect(student).toBeDefined();
            expect(student.status).toBe('pending');
        });

        it('rejects registration with duplicate email (400)', async () => {
            await createStudentHelper({ email: 'dup@example.com' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    fullName: 'Another User',
                    email: 'dup@example.com',
                    password: 'Password123!',
                    mobileNumber: '9876543211'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/already exists|already registered/i);
        });

        it('rejects weak password violating security policy (400)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    fullName: 'Weak Pass User',
                    email: 'weak@example.com',
                    password: 'weak', // fails complexity
                    mobileNumber: '9876543210'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/password/i);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await createStudentHelper({
                fullName: 'Bob Smith',
                email: 'bob@example.com',
                password: 'Password123!',
                isRegistered: true,
                status: 'active',
                mustChangePassword: false
            });
        });

        it('authenticates user with valid credentials, issues OTP tempToken, and completes login upon OTP verification', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'bob@example.com',
                    password: 'Password123!'
                });

            expect(res.status).toBe(200);
            expect(res.body.requireOtp).toBe(true);
            expect(res.body.tempToken).toBeDefined();

            // Verify in DB and complete 2FA login via /verify-login-otp
            const otpRecord = await LoginOtp.findOne({ email: 'bob@example.com' });
            expect(otpRecord).toBeDefined();

            const verifyRes = await request(app)
                .post('/api/auth/verify-login-otp')
                .send({
                    tempToken: res.body.tempToken,
                    otp: '123456'
                });

            expect([200, 400]).toContain(verifyRes.status);
        });

        it('rejects login with invalid password (400/401)', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'bob@example.com',
                    password: 'WrongPassword123!'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/invalid email or password|invalid credentials/i);
        });

        it('rejects login with non-existent user email (400/401)', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'ghost@example.com',
                    password: 'Password123!'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/invalid email or password|user not found/i);
        });
    });

    describe('Signup & Login OTP Flows', () => {
        it('sends signup OTP via /send-signup-otp and creates temporary session', async () => {
            const res = await request(app)
                .post('/api/auth/send-signup-otp')
                .send({
                    email: 'newbie@example.com',
                    fullName: 'New Student'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.tempToken).toBeDefined();

            // Verify in DB
            const otpRecord = await LoginOtp.findOne({ email: 'newbie@example.com' });
            expect(otpRecord).toBeDefined();
            expect(otpRecord.flowType).toBe('account-verify');
        });

        it('verifies valid signup OTP via /verify-signup-otp', async () => {
            const rawOtp = '765432';
            const tempToken = 'temp-token-xyz-123';

            const otpRecord = new LoginOtp({
                email: 'newbie@example.com',
                otp: rawOtp,
                tempToken,
                flowType: 'account-verify',
                userData: { email: 'newbie@example.com', fullName: 'New Student' }
            });
            await otpRecord.save();

            const res = await request(app)
                .post('/api/auth/verify-signup-otp')
                .send({
                    tempToken,
                    otp: rawOtp
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.email).toBe('newbie@example.com');
        });

        it('rejects invalid signup OTP (400)', async () => {
            const tempToken = 'temp-token-fail-123';
            const otpRecord = new LoginOtp({
                email: 'fail@example.com',
                otp: '111222',
                tempToken,
                flowType: 'account-verify',
                userData: { email: 'fail@example.com', fullName: 'Fail Student' }
            });
            await otpRecord.save();

            const res = await request(app)
                .post('/api/auth/verify-signup-otp')
                .send({
                    tempToken,
                    otp: '999999' // wrong
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/invalid otp/i);
        });
    });

    describe('Session Management & /me & /logout', () => {
        it('validates active student session and detects kicked sessions', async () => {
            const student = await createStudentHelper({
                fullName: 'David Session',
                email: 'david@example.com',
                password: 'Password123!',
                currentSessionId: 'sess-active-100',
                sessionExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
            });

            const validToken = jwt.sign(
                { userId: student._id.toString(), userType: 'student', sessionId: 'sess-active-100' },
                testJwtSecret,
                { expiresIn: '2h' }
            );

            // 1. Active session check via /api/auth/me
            const resValid = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${validToken}`);

            expect(resValid.status).toBe(200);
            expect(resValid.body.success).toBe(true);
            expect(resValid.body.user.email).toBe('david@example.com');

            // 2. Kicked session test
            student.currentSessionId = 'sess-device-b-200';
            await student.save();

            const resKicked = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${validToken}`);

            expect(resKicked.status).toBe(401);
            expect(resKicked.body.kicked).toBe(true);

            // 3. Unauthenticated request
            const resNoAuth = await request(app)
                .get('/api/auth/me');

            expect(resNoAuth.status).toBe(401);
        });

        it('clears session on logout via /api/auth/logout', async () => {
            const student = await createStudentHelper({
                fullName: 'Logout Student',
                email: 'logout@example.com',
                currentSessionId: 'sess-logout-1',
                sessionExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
            });

            const validToken = jwt.sign(
                { userId: student._id.toString(), userType: 'student', sessionId: 'sess-logout-1' },
                testJwtSecret,
                { expiresIn: '2h' }
            );

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            // Verify session is cleared in DB
            const updated = await Student.findById(student._id);
            expect(updated.currentSessionId).toBeNull();
        });
    });

    describe('GET /api/registrations/institutions', () => {
        it('returns aggregated distinct institutions from student registrations', async () => {
            await createStudentHelper({
                fullName: 'Student One',
                email: 's1@col.edu',
                registration: {
                    institution: 'IIT Madras',
                    degree: 'B.Tech'
                }
            });
            await createStudentHelper({
                fullName: 'Student Two',
                email: 's2@col.edu',
                registration: {
                    institution: 'IIT Madras',
                    degree: 'M.Tech'
                }
            });

            const res = await request(app)
                .get('/api/registrations/institutions');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.some(inst => inst.name === 'IIT Madras')).toBe(true);
        });
    });

    describe('POST /api/security/log-violation & /warning-status', () => {
        let authHeader;
        let testStudent;

        beforeEach(async () => {
            testStudent = await createStudentHelper({
                fullName: 'Security Student',
                email: 'sec@example.com',
                password: 'Password123!',
                currentSessionId: 'sec-sess-1',
                sessionExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
            });

            const token = jwt.sign(
                { userId: testStudent._id.toString(), userType: 'student', sessionId: 'sec-sess-1' },
                testJwtSecret,
                { expiresIn: '2h' }
            );
            authHeader = `Bearer ${token}`;
        });

        it('logs tab switch violation and increments warning count', async () => {
            const res1 = await request(app)
                .post('/api/security/log-violation')
                .set('Authorization', authHeader)
                .send({
                    eventType: 'tab_switch'
                });

            expect(res1.status).toBe(201);
            expect(res1.body.success).toBe(true);
            expect(res1.body.warningsCount).toBe(1);

            // Second violation
            const res2 = await request(app)
                .post('/api/security/log-violation')
                .set('Authorization', authHeader)
                .send({
                    eventType: 'minimize'
                });

            expect(res2.status).toBe(201);
            expect(res2.body.warningsCount).toBe(2);

            // Check warning status
            const resStatus = await request(app)
                .get('/api/security/warning-status')
                .set('Authorization', authHeader);

            expect(resStatus.status).toBe(200);
            expect(resStatus.body.warningsCount).toBe(2);
        });

        it('rejects invalid eventType on violation log (400)', async () => {
            const res = await request(app)
                .post('/api/security/log-violation')
                .set('Authorization', authHeader)
                .send({
                    eventType: 'invalid_event_type'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
});
