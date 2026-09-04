const mongoose = require('mongoose');
const {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError
} = require('../../utils/errors');
const { countActiveLearningDays } = require('../../utils/activeDays');
const { computePLVI, totalGrowth, bandFor, BANDS } = require('../../utils/plvi');
const {
    ORG_NAME,
    normalizeText,
    buildResumeFingerprint,
    createResumePublicId,
    buildVerificationPath
} = require('../../utils/resumeSecurity');
const {
    awardBadge,
    checkCourseCompletionBadges,
    awardCourseMasterBadge,
    checkSkillCompletionBadges,
    getUserBadges,
    getUserBadgeStats
} = require('../../utils/badgeUtils');
const { runModeration, FLAG_SEVERITY } = require('../../utils/jobModerationEngine');

const Badge = require('../../models/Badge');
const UserBadge = require('../../models/UserBadge');
const UserProgress = require('../../models/UserProgress');

jest.mock('../../models/Badge');
jest.mock('../../models/UserBadge');
jest.mock('../../models/UserProgress');

describe('Services & Business Utilities Unit Tests', () => {
    describe('Custom Error Classes', () => {
        it('instantiates custom errors with correct status codes and defaults', () => {
            const appErr = new AppError('General msg', 400, 'ERR_CODE');
            expect(appErr.statusCode).toBe(400);
            expect(appErr.code).toBe('ERR_CODE');
            expect(appErr.isOperational).toBe(true);

            const appErrDefault = new AppError('Default code msg', 500);
            expect(appErrDefault.code).toBeNull();

            const valErr = new ValidationError('Invalid inputs', [{ field: 'email' }]);
            expect(valErr.statusCode).toBe(400);
            expect(valErr.code).toBe('VALIDATION_ERROR');
            expect(valErr.errors).toHaveLength(1);

            const valErrDefault = new ValidationError('Default errors');
            expect(valErrDefault.errors).toEqual([]);

            const authErr = new AuthenticationError();
            expect(authErr.statusCode).toBe(401);
            expect(authErr.message).toBe('Authentication failed');

            const authzErr = new AuthorizationError();
            expect(authzErr.statusCode).toBe(403);
            expect(authzErr.message).toBe('Access denied');

            const notFoundErr = new NotFoundError();
            expect(notFoundErr.statusCode).toBe(404);
            expect(notFoundErr.message).toBe('Resource not found');

            const conflictErr = new ConflictError();
            expect(conflictErr.statusCode).toBe(409);
        });
    });

    describe('Active Learning Days Calculation', () => {
        it('returns 0 for invalid inputs or inverted date range', async () => {
            expect(await countActiveLearningDays(null, new Date(), new Date())).toBe(0);
            expect(await countActiveLearningDays('invalid-id', new Date(), new Date())).toBe(0);
            expect(await countActiveLearningDays('507f1f77bcf86cd799439011', '2026-05-10', '2026-05-01')).toBe(0);
        });

        it('returns aggregate count of active days for valid dates', async () => {
            UserProgress.aggregate = jest.fn().mockResolvedValue([{ days: 5 }]);
            const days = await countActiveLearningDays(
                '507f1f77bcf86cd799439011',
                '2026-01-01',
                '2026-01-10'
            );
            expect(days).toBe(5);
        });
    });

    describe('PLVI (Personal Learning Velocity Index)', () => {
        it('computes PLVI and band correctly with calendar days fallback', () => {
            const result = computePLVI(50, 80, '2026-01-01', '2026-01-11');
            expect(result).toBeDefined();
            expect(result.plvi).toBeGreaterThan(0);
            expect(result.tDaysBasis).toBe('calendar');
            expect(typeof result.band).toBe('string');
        });

        it('computes PLVI with active learning days denominator when provided', () => {
            const result = computePLVI(50, 90, '2026-01-01', '2026-01-20', 8);
            expect(result).toBeDefined();
            expect(result.tDays).toBe(8);
            expect(result.tDaysBasis).toBe('active');
        });

        it('calculates total growth and bands correctly', () => {
            expect(totalGrowth(60, 85)).toBe(25);
            expect(totalGrowth(null, 85)).toBeNull();
            expect(bandFor(0.5)).toBeDefined();
            expect(bandFor(-1.0)).toBeDefined();
        });

        it('returns null for missing parameters in computePLVI', () => {
            expect(computePLVI(null, 80, '2026-01-01', '2026-01-10')).toBeNull();
        });
    });

    describe('Resume Security & Fingerprinting', () => {
        it('normalizes whitespace and strings correctly', () => {
            expect(normalizeText('  Hello   World  ')).toBe('Hello World');
            expect(normalizeText(null)).toBe('');
        });

        it('builds a deterministic 7-character alphanumeric resume fingerprint', () => {
            const payload = {
                personalInfo: { fullName: 'John Doe', email: 'john@example.com' },
                summary: 'Software Engineer',
                skills: ['Node.js', 'React']
            };
            const fp1 = buildResumeFingerprint(payload);
            const fp2 = buildResumeFingerprint(payload);
            expect(fp1).toBe(fp2);
            expect(fp1).toHaveLength(7);
        });

        it('creates formatted public resume ID and verification path', () => {
            const fp = 'ABC1234';
            const publicId = createResumePublicId(fp);
            expect(publicId).toMatch(/^SMR-\d{4}-ABC1-[0-9A-F]{8}$/);

            const path = buildVerificationPath(publicId, fp);
            expect(path).toContain('/verify-resume/');
            expect(path).toContain('?h=ABC1234');
        });
    });

    describe('Badge Awarding Utilities', () => {
        const userId = '507f1f77bcf86cd799439011';

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('returns error if badge template does not exist', async () => {
            Badge.findOne = jest.fn().mockResolvedValue(null);
            const res = await awardBadge(userId, 'NON-EXISTENT');
            expect(res.success).toBe(false);
            expect(res.error).toMatch(/template not found/i);
        });

        it('awards newly earned badge when not already earned', async () => {
            const mockBadge = {
                _id: new mongoose.Types.ObjectId(),
                badgeId: 'MOD-COMPLETE',
                title: 'Module Master'
            };
            Badge.findOne = jest.fn().mockResolvedValue(mockBadge);
            UserBadge.findOne = jest.fn().mockResolvedValue(null);

            const saveMock = jest.fn().mockResolvedValue({});
            UserBadge.mockImplementation(() => ({
                save: saveMock,
                userId,
                badgeId: mockBadge._id,
                isEarned: true
            }));

            const res = await awardBadge(userId, 'MOD-COMPLETE', { moduleId: 'm1' });
            expect(res.success).toBe(true);
            expect(res.newlyEarned).toBe(true);
        });

        it('recognizes already earned badges', async () => {
            const mockBadge = { _id: new mongoose.Types.ObjectId(), badgeId: 'CRS-COMPLETE' };
            Badge.findOne = jest.fn().mockResolvedValue(mockBadge);
            UserBadge.findOne = jest.fn().mockResolvedValue({ isEarned: true, userId });

            const res = await awardBadge(userId, 'CRS-COMPLETE');
            expect(res.alreadyEarned).toBe(true);
        });

        it('fetches user badges and calculates statistics', async () => {
            const mockUserBadges = [
                {
                    _id: 'ub1',
                    badgeId: { badgeId: 'B1', title: 'Badge 1', xp: 50, category: 'learning' },
                    isEarned: true,
                    earnedDate: new Date()
                },
                {
                    _id: 'ub2',
                    badgeId: { badgeId: 'B2', title: 'Badge 2', xp: 100, category: 'learning' },
                    isEarned: true,
                    earnedDate: new Date()
                }
            ];

            UserBadge.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockUserBadges)
                })
            });

            const badges = await getUserBadges(userId);
            expect(badges).toHaveLength(2);
            expect(badges[0].xp).toBe(50);

            UserBadge.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockUserBadges)
            });

            const stats = await getUserBadgeStats(userId);
            expect(stats.totalEarned).toBe(2);
            expect(stats.totalXP).toBe(150);
        });
    });

    describe('Job Moderation Engine', () => {
        it('cleans legitimate job postings without flags', () => {
            const result = runModeration(
                'Full Stack Developer',
                'We are looking for a skilled developer proficient in React and Node.js with strong teamwork skills.'
            );
            expect(result.isFlagged).toBe(false);
            expect(result.hasHardBlock).toBe(false);
            expect(result.flags).toHaveLength(0);
        });

        it('detects and hard-blocks explicit gender exclusions and fee charging scams', () => {
            const result = runModeration(
                'Accountant Wanted',
                'Female candidates only. Candidates must pay a registration fee of 500 INR to process application.'
            );
            expect(result.isFlagged).toBe(true);
            expect(result.hasHardBlock).toBe(true);
            const categories = result.flags.map(f => f.category);
            expect(categories).toContain('Explicit sex preference');
            expect(categories).toContain('Fee-charging scam');
        });

        it('flags profanity appropriately', () => {
            const result = runModeration(
                'Job Title',
                'Do not be a dumbass while writing code.'
            );
            expect(result.isFlagged).toBe(true);
            expect(result.flags.some(f => f.category === 'Profanity / abusive language')).toBe(true);
        });
    });
});
