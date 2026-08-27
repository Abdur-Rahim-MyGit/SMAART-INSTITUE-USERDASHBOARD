const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { protect, optionalAuth, authorize, protectOrBypass } = require('../../middleware/auth');
const User = require('../../models/User');
const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');

jest.mock('../../models/User');
jest.mock('../../models/Student');
jest.mock('../../models/Teacher');

describe('Auth Middleware Unit Tests', () => {
    let req, res, next;
    const testSecret = 'test-jwt-secret-key-for-unit-testing-32-chars';

    beforeEach(() => {
        process.env.JWT_SECRET = testSecret;
        process.env.ADMIN_SYSTEM_SECRET = 'admin-secret-123';
        process.env.NODE_ENV = 'development';

        req = {
            headers: {},
            cookies: {}
        };
        res = {
            statusCode: null,
            body: null,
            status: jest.fn().mockImplementation(function (code) {
                this.statusCode = code;
                return this;
            }),
            json: jest.fn().mockImplementation(function (payload) {
                this.body = payload;
                return this;
            })
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('protect middleware', () => {
        it('allows admin bypass in non-production with valid secret headers', async () => {
            req.headers['x-admin-bypass'] = 'true';
            req.headers['x-admin-secret'] = 'admin-secret-123';

            await protect(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.role).toBe('admin');
        });

        it('returns 401 if no token is provided in cookies or authorization header', async () => {
            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.message).toMatch(/no token/i);
            expect(next).not.toHaveBeenCalled();
        });

        it('returns 401 if token is invalid or cannot be verified', async () => {
            req.headers.authorization = 'Bearer invalid.token.value';

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.message).toMatch(/token invalid/i);
            expect(next).not.toHaveBeenCalled();
        });

        it('authenticates user successfully with Bearer token', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const token = jwt.sign({ userId, userType: 'user' }, testSecret);
            req.headers.authorization = `Bearer ${token}`;

            const mockUser = {
                _id: userId,
                name: 'Test User',
                role: 'student',
                updateOne: jest.fn().mockResolvedValue({})
            };

            User.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUser)
                })
            });

            await protect(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBe(mockUser);
        });

        it('authenticates student using cookie token and Student model', async () => {
            const studentId = new mongoose.Types.ObjectId().toString();
            const token = jwt.sign({ userId: studentId, userType: 'student' }, testSecret);
            req.cookies.token = token;

            const mockStudent = {
                _id: studentId,
                name: 'Student Name',
                role: 'student',
                updateOne: jest.fn().mockResolvedValue({})
            };

            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockStudent)
                })
            });

            await protect(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBe(mockStudent);
        });

        it('authenticates teacher using Teacher model', async () => {
            const teacherId = new mongoose.Types.ObjectId().toString();
            const token = jwt.sign({ userId: teacherId, userType: 'teacher' }, testSecret);
            req.cookies.token = token;

            const mockTeacher = {
                _id: teacherId,
                name: 'Teacher Name',
                role: 'teacher'
            };

            Teacher.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockTeacher)
                })
            });

            await protect(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBe(mockTeacher);
        });

        it('returns 401 if user is not found in database', async () => {
            const token = jwt.sign({ userId: 'missing-id', userType: 'user' }, testSecret);
            req.cookies.token = token;

            User.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(null)
                })
            });

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.message).toMatch(/not found/i);
            expect(next).not.toHaveBeenCalled();
        });

        it('returns 401 if password was changed after token was issued', async () => {
            const pastIat = Math.floor(Date.now() / 1000) - 1000;
            const token = jwt.sign({ userId: 'uid', iat: pastIat }, testSecret);
            req.cookies.token = token;

            const mockUser = {
                _id: 'uid',
                passwordChangedAt: new Date(Date.now() - 100 * 1000) // changed after token iat
            };

            User.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUser)
                })
            });

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.message).toMatch(/password was recently changed/i);
        });

        it('returns 401 with kicked=true if session ID does not match active session', async () => {
            const token = jwt.sign({ userId: 'uid', sessionId: 'sess-old' }, testSecret);
            req.cookies.token = token;

            const mockUser = {
                _id: 'uid',
                currentSessionId: 'sess-new'
            };

            User.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUser)
                })
            });

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.kicked).toBe(true);
        });

        it('returns 401 with expired=true if sessionExpiresAt is in the past', async () => {
            const token = jwt.sign({ userId: 'uid', sessionId: 'sess-1' }, testSecret);
            req.cookies.token = token;

            const mockUser = {
                _id: 'uid',
                currentSessionId: 'sess-1',
                sessionExpiresAt: new Date(Date.now() - 10000),
                updateOne: jest.fn().mockResolvedValue({})
            };

            User.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUser)
                })
            });

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.expired).toBe(true);
        });

        it('auto-extends session in background when expiry is within 30 minutes', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const token = jwt.sign({ userId, sessionId: 'sess-1' }, testSecret);
            req.cookies.token = token;

            const updateOneMock = jest.fn().mockRejectedValue(new Error('Background update failed'));
            const mockUser = {
                _id: userId,
                currentSessionId: 'sess-1',
                sessionExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes left (< 30 min threshold)
                updateOne: updateOneMock
            };

            User.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUser)
                })
            });

            await protect(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(updateOneMock).toHaveBeenCalled();
        });

        it('authenticates legacy registration userType using Student model', async () => {
            const studentId = new mongoose.Types.ObjectId().toString();
            const token = jwt.sign({ userId: studentId, userType: 'registration' }, testSecret);
            req.cookies.token = token;

            const mockStudent = {
                _id: studentId,
                name: 'Reg Student',
                role: 'student'
            };

            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockStudent)
                })
            });

            await protect(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.user).toBe(mockStudent);
        });
    });

    describe('optionalAuth middleware', () => {
        it('passes through with req.user=null if no token is provided', async () => {
            await optionalAuth(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });

        it('attaches user if valid Bearer token provided', async () => {
            const token = jwt.sign({ userId: 'uid', userType: 'user' }, testSecret);
            req.headers.authorization = `Bearer ${token}`;

            const mockUser = { _id: 'uid', name: 'Opt User' };
            User.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUser)
                })
            });

            await optionalAuth(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.user).toBe(mockUser);
        });

        it('resets req.user to null in optionalAuth when sessionId mismatches', async () => {
            const token = jwt.sign({ userId: 'uid', sessionId: 'token-sess' }, testSecret);
            req.cookies.token = token;

            const mockUser = { _id: 'uid', currentSessionId: 'active-sess' };
            User.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockUser)
                })
            });

            await optionalAuth(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.user).toBeNull();
        });

        it('attaches student/teacher and handles legacy registration in optionalAuth', async () => {
            // Student
            const studentToken = jwt.sign({ userId: 'stud-1', userType: 'student' }, testSecret);
            req.headers.authorization = `Bearer ${studentToken}`;
            const mockStudent = { _id: 'stud-1', name: 'Opt Student' };
            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockStudent)
                })
            });
            await optionalAuth(req, res, next);
            expect(req.user).toBe(mockStudent);

            // Teacher
            const teacherToken = jwt.sign({ userId: 'teach-1', userType: 'teacher' }, testSecret);
            req.headers.authorization = `Bearer ${teacherToken}`;
            const mockTeacher = { _id: 'teach-1', name: 'Opt Teacher' };
            Teacher.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockTeacher)
                })
            });
            await optionalAuth(req, res, next);
            expect(req.user).toBe(mockTeacher);

            // Registration legacy token
            const regToken = jwt.sign({ userId: 'reg-1', userType: 'registration' }, testSecret);
            req.headers.authorization = `Bearer ${regToken}`;
            Student.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue(mockStudent)
                })
            });
            await optionalAuth(req, res, next);
            expect(req.user).toBe(mockStudent);
        });

        it('sets req.user=null and continues if token verification throws', async () => {
            req.cookies.token = 'corrupt-token';
            await optionalAuth(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.user).toBeNull();
        });
    });

    describe('JWT Secret configuration', () => {
        it('throws or fails gracefully when JWT_SECRET is not configured in protect', async () => {
            delete process.env.JWT_SECRET;
            req.cookies.token = 'some.token.value';
            await protect(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            process.env.JWT_SECRET = testSecret;
        });
    });

    describe('protectOrBypass middleware', () => {
        it('allows admin bypass in development mode', () => {
            req.headers['x-admin-bypass'] = 'true';
            req.headers['x-admin-secret'] = 'admin-secret-123';

            protectOrBypass(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.user.role).toBe('admin');
        });

        it('disallows admin bypass in production mode and falls back to protect', async () => {
            process.env.NODE_ENV = 'production';
            req.headers['x-admin-bypass'] = 'true';
            req.headers['x-admin-secret'] = 'admin-secret-123';
            req.cookies.token = 'invalid-token';

            await protectOrBypass(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            process.env.NODE_ENV = 'development';
        });

        it('falls back to protect when no bypass header is given', async () => {
            req.cookies.token = 'invalid';
            await protectOrBypass(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('authorize middleware', () => {
        it('returns 401 if req.user is not set', () => {
            const mw = authorize('admin', 'teacher');
            mw(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('returns 403 if user role is not authorized', () => {
            req.user = { role: 'student' };
            const mw = authorize('admin', 'teacher');
            mw(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('calls next() if user role is authorized', () => {
            req.user = { role: 'admin' };
            const mw = authorize('admin', 'teacher');
            mw(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
