const Degree = require('../../models/Degree');
const UserStreak = require('../../models/UserStreak');
const UserAchievement = require('../../models/UserAchievement');
const degreeController = require('../../controllers/degreeController');
const streakController = require('../../controllers/streakController');

jest.mock('../../models/Degree');
jest.mock('../../models/UserStreak');
jest.mock('../../models/UserAchievement');

describe('Controller Handlers Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            query: {},
            params: {},
            body: {},
            user: { id: '507f1f77bcf86cd799439011', timezone: 'Asia/Kolkata' }
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
        jest.clearAllMocks();
    });

    describe('degreeController', () => {
        it('getLevels returns distinct levels and handles errors', async () => {
            Degree.distinct = jest.fn().mockResolvedValue(['UG', 'PG', 'Diploma']);
            await degreeController.getLevels(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: ['UG', 'PG', 'Diploma']
            });

            Degree.distinct = jest.fn().mockRejectedValue(new Error('DB Error'));
            await degreeController.getLevels(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('getDomains validates required query param level and returns domains', async () => {
            await degreeController.getDomains(req, res);
            expect(res.status).toHaveBeenCalledWith(400);

            req.query.level = 'UG';
            Degree.distinct = jest.fn().mockResolvedValue(['Engineering', 'Arts']);
            await degreeController.getDomains(req, res);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: ['Engineering', 'Arts']
            });

            Degree.distinct = jest.fn().mockRejectedValue(new Error('DB Error'));
            await degreeController.getDomains(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('getFullNames validates level and domain query params', async () => {
            req.query = { level: 'UG' };
            await degreeController.getFullNames(req, res);
            expect(res.status).toHaveBeenCalledWith(400);

            req.query = { level: 'UG', domain: 'Engineering' };
            Degree.distinct = jest.fn().mockResolvedValue(['B.Tech', 'B.E.']);
            await degreeController.getFullNames(req, res);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: ['B.Tech', 'B.E.']
            });

            Degree.distinct = jest.fn().mockRejectedValue(new Error('DB Error'));
            await degreeController.getFullNames(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('getSpecializations validates full name and returns specializations', async () => {
            req.query = { level: 'UG', domain: 'Engineering' };
            await degreeController.getSpecializations(req, res);
            expect(res.status).toHaveBeenCalledWith(400);

            req.query = { level: 'UG', domain: 'Engineering', fullName: 'B.Tech' };
            Degree.distinct = jest.fn().mockResolvedValue(['Computer Science', 'Mechanical']);
            await degreeController.getSpecializations(req, res);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: ['Computer Science', 'Mechanical']
            });

            Degree.distinct = jest.fn().mockRejectedValue(new Error('DB Error'));
            await degreeController.getSpecializations(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('getAllDegreesHierarchical constructs nested tree object and catches error', async () => {
            const mockDegrees = [
                { level: 'UG', domain: 'Engineering', fullName: 'B.Tech', specialization: 'CSE' },
                { level: 'UG', domain: 'Engineering', fullName: 'B.Tech', specialization: 'ECE' }
            ];
            Degree.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockDegrees)
            });

            await degreeController.getAllDegreesHierarchical(req, res);
            expect(res.json).toHaveBeenCalledWith({
                UG: {
                    Engineering: {
                        'B.Tech': ['CSE', 'ECE']
                    }
                }
            });

            Degree.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Hierarchy DB Error'))
            });
            await degreeController.getAllDegreesHierarchical(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('streakController', () => {
        it('recordActivity handles non-Sunday scenarios: first activity, same day, consecutive, grace period, and reset', async () => {
            const realDate = Date;
            const wednesdayDate = new Date('2026-03-04T12:00:00Z');
            global.Date = class extends realDate {
                constructor(...args) {
                    if (args.length) return new realDate(...args);
                    return wednesdayDate;
                }
                static now() {
                    return wednesdayDate.getTime();
                }
            };

            // 1. First ever activity
            UserStreak.findOne = jest.fn().mockResolvedValue(null);
            const saveMock = jest.fn().mockResolvedValue({});
            UserStreak.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = saveMock;
            });

            await streakController.recordActivity(req, res);
            expect(res.json).toHaveBeenCalled();
            expect(res.body.message).toMatch(/First active day/i);

            // 2. Already active today
            const streakToday = {
                user: req.user.id,
                currentStreak: 2,
                lastActivityDate: new Date('2026-03-04T08:00:00Z'),
                save: saveMock
            };
            UserStreak.findOne = jest.fn().mockResolvedValue(streakToday);
            await streakController.recordActivity(req, res);
            expect(res.body.message).toMatch(/Already recorded activity/i);

            // 3. Consecutive day (yesterday was 2026-03-03)
            const streakYesterday = {
                user: req.user.id,
                currentStreak: 2,
                longestStreak: 2,
                lastActivityDate: new Date('2026-03-03T12:00:00Z'),
                save: saveMock
            };
            UserStreak.findOne = jest.fn().mockResolvedValue(streakYesterday);
            await streakController.recordActivity(req, res);
            expect(res.body.message).toMatch(/Streak incremented/i);
            expect(streakYesterday.currentStreak).toBe(3);

            // 4. Grace period (missed 1 day, last was 2026-03-02)
            const streakGrace = {
                user: req.user.id,
                currentStreak: 5,
                longestStreak: 5,
                lastActivityDate: new Date('2026-03-02T12:00:00Z'),
                save: saveMock
            };
            UserStreak.findOne = jest.fn().mockResolvedValue(streakGrace);
            await streakController.recordActivity(req, res);
            expect(res.body.message).toMatch(/grace period/i);

            // 5. Broken streak (missed > 2 active days, last was 2026-02-20)
            const streakBroken = {
                user: req.user.id,
                currentStreak: 10,
                longestStreak: 10,
                lastActivityDate: new Date('2026-02-20T12:00:00Z'),
                save: saveMock
            };
            UserStreak.findOne = jest.fn().mockResolvedValue(streakBroken);
            await streakController.recordActivity(req, res);
            expect(res.body.message).toMatch(/Exceeded grace period/i);
            expect(streakBroken.currentStreak).toBe(1);

            global.Date = realDate;
        });

        it('recordActivity awards 6-day streak milestone voucher when streak reaches 6 and prevents duplicates', async () => {
            const realDate = Date;
            const wednesdayDate = new Date('2026-03-04T12:00:00Z');
            global.Date = class extends realDate {
                constructor(...args) {
                    if (args.length) return new realDate(...args);
                    return wednesdayDate;
                }
                static now() {
                    return wednesdayDate.getTime();
                }
            };

            const streak5 = {
                user: req.user.id,
                currentStreak: 5,
                longestStreak: 5,
                lastActivityDate: new Date('2026-03-03T12:00:00Z'),
                save: jest.fn().mockResolvedValue({})
            };
            UserStreak.findOne = jest.fn().mockResolvedValue(streak5);
            UserAchievement.findOne = jest.fn().mockResolvedValue(null);
            const achSaveMock = jest.fn().mockResolvedValue({});
            UserAchievement.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = achSaveMock;
            });

            await streakController.recordActivity(req, res);
            expect(streak5.currentStreak).toBe(6);
            expect(res.body.message).toMatch(/6-Day Streak Achievement/i);
            expect(achSaveMock).toHaveBeenCalled();

            // When milestone already exists
            UserAchievement.findOne = jest.fn().mockResolvedValue({ _id: 'existing-ach' });
            streak5.lastActivityDate = new Date('2026-03-03T12:00:00Z');
            streak5.currentStreak = 5;
            await streakController.recordActivity(req, res);
            expect(streak5.currentStreak).toBe(6);

            global.Date = realDate;
        });

        it('recordActivity returns default data on Sunday when no streak exists', async () => {
            const realDate = Date;
            const sundayDate = new Date('2026-03-01T12:00:00Z');
            global.Date = class extends realDate {
                constructor(...args) {
                    if (args.length) return new realDate(...args);
                    return sundayDate;
                }
                static now() {
                    return sundayDate.getTime();
                }
            };

            delete req.user.timezone;
            UserStreak.findOne = jest.fn().mockResolvedValue(null);

            await streakController.recordActivity(req, res);
            expect(res.json).toHaveBeenCalled();
            expect(res.body.data.currentStreak).toBe(0);

            global.Date = realDate;
        });

        it('recordActivity handles errors gracefully with 500 status', async () => {
            const realDate = Date;
            const wednesdayDate = new Date('2026-03-04T12:00:00Z');
            global.Date = class extends realDate {
                constructor(...args) {
                    if (args.length) return new realDate(...args);
                    return wednesdayDate;
                }
                static now() {
                    return wednesdayDate.getTime();
                }
            };

            UserStreak.findOne = jest.fn().mockRejectedValue(new Error('DB Query Failed'));
            await streakController.recordActivity(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.body.error).toBe('Failed to record streak activity');

            global.Date = realDate;
        });

        it('getStreakStatus creates initial streak if none exists and handles DB errors', async () => {
            // Case 1: No streak exists yet
            UserStreak.findOne = jest.fn().mockResolvedValue(null);
            const saveMock = jest.fn().mockResolvedValue({});
            UserStreak.mockImplementation(function (data) {
                Object.assign(this, data);
                this.save = saveMock;
            });
            UserAchievement.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });

            await streakController.getStreakStatus(req, res);
            expect(res.json).toHaveBeenCalled();
            expect(res.body.success).toBe(true);
            expect(res.body.data.currentStreak).toBe(0);

            // Case 2: DB error
            UserStreak.findOne = jest.fn().mockRejectedValue(new Error('Streak fetch error'));
            await streakController.getStreakStatus(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.body.error).toBe('Failed to fetch streak status');
        });

        it('restoreStreak handles invalid voucher, no broken streak, longest streak bump, and errors', async () => {
            // Missing voucher code
            await streakController.restoreStreak(req, res);
            expect(res.status).toHaveBeenCalledWith(400);

            // Invalid / expired voucher
            req.body.voucherCode = 'EXPIRED_CODE';
            UserAchievement.findOne = jest.fn().mockResolvedValue(null);
            await streakController.restoreStreak(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.error).toMatch(/Invalid, expired/i);

            // Valid voucher, but no broken streak to restore
            const mockAchievement = {
                voucher: { code: 'VALID123', status: 'Active' },
                save: jest.fn().mockResolvedValue({})
            };
            UserAchievement.findOne = jest.fn().mockResolvedValue(mockAchievement);
            UserStreak.findOne = jest.fn().mockResolvedValue({ preResetStreak: 0 });
            await streakController.restoreStreak(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.error).toMatch(/No broken streak available/i);

            // Valid voucher & broken streak where restored streak exceeds longestStreak
            const mockStreak = {
                user: req.user.id,
                currentStreak: 1,
                longestStreak: 5,
                preResetStreak: 12, // restored > longest
                save: jest.fn().mockResolvedValue({})
            };
            UserStreak.findOne = jest.fn().mockResolvedValue(mockStreak);
            await streakController.restoreStreak(req, res);
            expect(res.json).toHaveBeenCalled();
            expect(mockStreak.longestStreak).toBe(12);
            expect(mockStreak.currentStreak).toBe(12);
            expect(mockAchievement.voucher.status).toBe('Redeemed');

            // DB error during restore
            UserAchievement.findOne = jest.fn().mockRejectedValue(new Error('Restore DB error'));
            await streakController.restoreStreak(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.body.error).toBe('Failed to restore streak');
        });
    });
});
