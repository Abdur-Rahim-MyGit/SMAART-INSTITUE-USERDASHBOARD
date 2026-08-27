const jwt = require('jsonwebtoken');
const { errorHandler, notFound, catchAsync } = require('../../middleware/errorHandler');
const { AppError } = require('../../utils/errors');
const sanitizeMongo = require('../../middleware/sanitizeMongo');
const deviceFingerprint = require('../../middleware/deviceFingerprint');
const { requireRole } = require('../../middleware/roleMiddleware');
const { signAssessmentToken, verifyAssessmentToken } = require('../../middleware/assessmentAuth');
const {
    loginLimiter,
    otpLimiter,
    passwordResetLimiter,
    searchLimiter,
    generalLimiter,
    resumeExportLimiter,
    aiLimiter,
    uploadLimiter
} = require('../../middleware/rateLimiter');

describe('Middleware Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {},
            body: {},
            query: {},
            params: {},
            ip: '127.0.0.1'
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

    describe('sanitizeMongo Middleware', () => {
        it('removes keys starting with $ or containing . from body, query, and params', () => {
            req.body = {
                valid: 'ok',
                $ne: 'injection',
                'nested.key': 'val',
                nested: {
                    $gt: 5,
                    safe: 'hello'
                }
            };
            req.query = { $where: 'attack', normal: 'good' };
            req.params = { '$id': '123' };

            sanitizeMongo(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.body.valid).toBe('ok');
            expect(req.body.$ne).toBeUndefined();
            expect(req.body['nested.key']).toBeUndefined();
            expect(req.body.nested.$gt).toBeUndefined();
            expect(req.body.nested.safe).toBe('hello');
            expect(req.query.$where).toBeUndefined();
            expect(req.query.normal).toBe('good');
            expect(req.params.$id).toBeUndefined();
        });

        it('handles array and deep structures without blowing stack', () => {
            req.body = {
                items: [{ $bad: 1, good: 2 }, 'string', 42]
            };
            sanitizeMongo(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.body.items[0].$bad).toBeUndefined();
            expect(req.body.items[0].good).toBe(2);
        });
    });

    describe('deviceFingerprint Middleware', () => {
        it('attaches userAgent and ip to req.deviceInfo', () => {
            req.headers['user-agent'] = 'Mozilla/5.0 TestBrowser';
            req.ip = '192.168.1.10';

            deviceFingerprint(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.deviceInfo).toEqual({
                userAgent: 'Mozilla/5.0 TestBrowser',
                ip: '192.168.1.10'
            });
        });

        it('falls back to remoteAddress or unknown when headers and ip are missing', () => {
            // Case 1: remoteAddress fallback
            delete req.ip;
            req.connection = { remoteAddress: '10.20.30.40' };
            deviceFingerprint(req, res, next);
            expect(req.deviceInfo.userAgent).toBe('unknown');
            expect(req.deviceInfo.ip).toBe('10.20.30.40');

            // Case 2: all missing
            delete req.connection;
            deviceFingerprint(req, res, next);
            expect(req.deviceInfo.ip).toBe('unknown');
        });
    });

    describe('errorHandler and notFound Middleware', () => {
        it('notFound creates 404 AppError and calls next with it', () => {
            req.originalUrl = '/api/unknown-endpoint';
            notFound(req, res, next);

            expect(next).toHaveBeenCalled();
            const err = next.mock.calls[0][0];
            expect(err).toBeInstanceOf(AppError);
            expect(err.statusCode).toBe(404);
            expect(err.message).toMatch(/not found/i);
        });

        it('errorHandler formats development errors with stack trace', () => {
            process.env.NODE_ENV = 'development';
            const err = new AppError('Something went wrong', 400, 'BAD_REQUEST');

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Something went wrong');
            expect(res.body.stack).toBeDefined();
        });

        it('errorHandler transforms CastError, duplicate fields, validation errors, and JWT errors in production', () => {
            process.env.NODE_ENV = 'production';

            // CastError
            const castErr = { name: 'CastError', path: '_id', value: '123' };
            errorHandler(castErr, req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.code).toBe('INVALID_INPUT');

            // Duplicate key
            const dupErr = { code: 11000, errmsg: 'duplicate key error index: email_1 dup key: { email: "test@a.com" }' };
            errorHandler(dupErr, req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.code).toBe('DUPLICATE_FIELD');

            // ValidationError
            const valErr = { name: 'ValidationError', errors: { email: { message: 'Invalid email' } } };
            errorHandler(valErr, req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');

            // JsonWebTokenError
            const jwtErr = { name: 'JsonWebTokenError' };
            errorHandler(jwtErr, req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.code).toBe('INVALID_TOKEN');

            // TokenExpiredError
            const expErr = { name: 'TokenExpiredError' };
            errorHandler(expErr, req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.code).toBe('TOKEN_EXPIRED');
        });

        it('errorHandler sanitizes production errors for operational AppErrors', () => {
            process.env.NODE_ENV = 'production';
            const err = new AppError('Invalid college ID', 400, 'INVALID_INPUT');

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toBe('Invalid college ID');
        });

        it('errorHandler masks unknown errors in production with generic 500 message', () => {
            process.env.NODE_ENV = 'production';
            const err = new Error('Database connection crashed');

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.body.message).toBe('Something went very wrong!');
        });

        it('catchAsync wraps async handler and forwards rejections to next()', async () => {
            const asyncFn = catchAsync(async (q, s, n) => {
                throw new Error('Async failure');
            });

            await asyncFn(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].message).toBe('Async failure');
        });
    });

    describe('roleMiddleware (requireRole)', () => {
        it('allows admin bypass when secret matches', () => {
            process.env.ADMIN_SYSTEM_SECRET = 'admin-secret-xyz';
            req.headers['x-admin-bypass'] = 'true';
            req.headers['x-admin-secret'] = 'admin-secret-xyz';

            const mw = requireRole('admin', 'teacher');
            mw(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user.role).toBe('admin');
        });

        it('returns 401 if user is not set on request', () => {
            const mw = requireRole('admin');
            mw(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('returns 403 if user lacks required role', () => {
            req.user = { role: 'student' };
            const mw = requireRole('admin', 'teacher');
            mw(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('calls next() if user role is included', () => {
            req.user = { role: 'teacher' };
            const mw = requireRole('admin', 'teacher');
            mw(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('calls next() if user roles array has matching role', () => {
            req.user = { roles: ['student', 'teacher'] };
            const mw = requireRole('teacher');
            mw(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('denies access if admin bypass secret length mismatches or secret is missing', () => {
            req.headers['x-admin-bypass'] = 'true';
            req.headers['x-admin-secret'] = 'short';
            const mw = requireRole('admin');
            mw(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);

            delete process.env.ADMIN_SYSTEM_SECRET;
            req.headers['x-admin-secret'] = 'admin-secret-123';
            mw(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('denies access if user has no role or roles defined', () => {
            req.user = {};
            const mw = requireRole('admin');
            mw(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe('assessmentAuth Middleware', () => {
        const testSecret = 'test-jwt-secret-key-for-unit-testing-32-chars';

        beforeEach(() => {
            process.env.JWT_SECRET = testSecret;
        });

        it('signs assessment token valid for assessment session', () => {
            const token = signAssessmentToken({ resultId: 'res-1', userId: 'user-1' });
            expect(typeof token).toBe('string');
            const decoded = jwt.verify(token, testSecret);
            expect(decoded.resultId).toBe('res-1');
            expect(decoded.userId).toBe('user-1');
        });

        it('returns 403 if x-assessment-token header is missing', () => {
            verifyAssessmentToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/token missing/i);
            expect(next).not.toHaveBeenCalled();
        });

        it('returns 403 if token is invalid or expired', () => {
            req.headers['x-assessment-token'] = 'invalid-token-here';
            verifyAssessmentToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/expired or invalid/i);
        });

        it('returns 403 if resultId in request does not match token', () => {
            const token = jwt.sign({ resultId: 'res-abc', userId: 'usr-1' }, testSecret);
            req.headers['x-assessment-token'] = token;
            req.body.resultId = 'res-different';

            verifyAssessmentToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/Security Breach: Token mismatch/i);
        });

        it('returns 403 if token userId does not match authenticated user', () => {
            const token = jwt.sign({ resultId: 'res-abc', userId: 'usr-attacker' }, testSecret);
            req.headers['x-assessment-token'] = token;
            req.body.resultId = 'res-abc';
            req.user = { _id: 'usr-victim' };

            verifyAssessmentToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/Security Breach: Token does not belong to the current user/i);
        });

        it('verifies assessment session token successfully and sets req.assessmentSession', () => {
            const token = jwt.sign({ resultId: 'res-abc', userId: 'usr-1' }, testSecret);
            req.headers['x-assessment-token'] = token;
            req.body.resultId = 'res-abc';
            req.user = { _id: 'usr-1' };

            verifyAssessmentToken(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.assessmentSession.resultId).toBe('res-abc');
        });
    });

    describe('rateLimiter exports and keyGenerators', () => {
        it('exports all standard rate limiters with proper config and executes keyGenerators', () => {
            expect(loginLimiter).toBeDefined();
            expect(otpLimiter).toBeDefined();
            expect(passwordResetLimiter).toBeDefined();
            expect(searchLimiter).toBeDefined();
            expect(generalLimiter).toBeDefined();
            expect(resumeExportLimiter).toBeDefined();
            expect(aiLimiter).toBeDefined();
            expect(uploadLimiter).toBeDefined();

            // Test keyGenerator functions
            req.ip = '10.0.0.1';
            req.body = { email: 'User@Test.com' };
            req.user = { _id: 'user-id-123' };

            // loginLimiter keyGenerator
            const loginKeyGen = loginLimiter.keyGenerator || (loginLimiter.options && loginLimiter.options.keyGenerator);
            if (loginKeyGen) {
                expect(loginKeyGen(req)).toBe('10.0.0.1-user@test.com');
            }

            // resumeExportLimiter keyGenerator
            const resumeKeyGen = resumeExportLimiter.keyGenerator || (resumeExportLimiter.options && resumeExportLimiter.options.keyGenerator);
            if (resumeKeyGen) {
                expect(resumeKeyGen(req)).toBe('user-id-123');
                expect(resumeKeyGen({ ip: '127.0.0.1' })).toBe('127.0.0.1');
            }

            // aiLimiter keyGenerator
            const aiKeyGen = aiLimiter.keyGenerator || (aiLimiter.options && aiLimiter.options.keyGenerator);
            if (aiKeyGen) {
                expect(aiKeyGen(req)).toBe('user-id-123');
            }

            // uploadLimiter keyGenerator
            const uploadKeyGen = uploadLimiter.keyGenerator || (uploadLimiter.options && uploadLimiter.options.keyGenerator);
            if (uploadKeyGen) {
                expect(uploadKeyGen(req)).toBe('user-id-123');
            }
        });
    });
});
