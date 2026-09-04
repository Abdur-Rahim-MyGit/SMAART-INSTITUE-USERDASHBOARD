const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const LoginOtp = require('../../models/LoginOtp');
const SupportTicket = require('../../models/SupportTicket');
const Badge = require('../../models/Badge');
const UserBadge = require('../../models/UserBadge');
const Notification = require('../../models/Notification');
const Degree = require('../../models/Degree');

describe('Mongoose Models Schema & Methods Unit Tests', () => {
    describe('User Model', () => {
        it('validates user schema correctly and flags missing required fields', () => {
            const user = new User({});
            const err = user.validateSync();
            expect(err.errors.fullName).toBeDefined();
            expect(err.errors.email).toBeDefined();
        });

        it('validates email format and mobile number constraint', () => {
            const user = new User({
                fullName: 'John Tester',
                email: 'invalid-email-format',
                mobile: '123' // must be 10 digits
            });
            const err = user.validateSync();
            expect(err.errors.email).toBeDefined();
            expect(err.errors.mobile).toBeDefined();
        });

        it('passes validation with valid fields', () => {
            const user = new User({
                fullName: 'Valid User',
                email: 'valid.user@example.com',
                mobile: '9876543210',
                role: 'student'
            });
            const err = user.validateSync();
            expect(err).toBeUndefined();
            expect(user.status).toBe('pending');
        });

        it('matchPassword method compares entered password against bcrypt hash', async () => {
            const password = 'SecretPassword123';
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = new User({
                fullName: 'Pass Test',
                email: 'pass@example.com',
                password: hashedPassword
            });

            const isMatch = await user.matchPassword(password);
            expect(isMatch).toBe(true);

            const isWrongMatch = await user.matchPassword('WrongPassword');
            expect(isWrongMatch).toBe(false);
        });
    });

    describe('LoginOtp Model', () => {
        it('validates required fields for LoginOtp', () => {
            const otpDoc = new LoginOtp({});
            const err = otpDoc.validateSync();
            expect(err.errors.email).toBeDefined();
            expect(err.errors.otp).toBeDefined();
            expect(err.errors.tempToken).toBeDefined();
            expect(err.errors.userData).toBeDefined();
        });

        it('verifyOtp compares plain text OTP with hashed OTP', async () => {
            const plainOtp = '654321';
            const hashed = await bcrypt.hash(plainOtp, 10);

            const otpDoc = new LoginOtp({
                email: 'user@test.com',
                otp: hashed,
                tempToken: 'token-123',
                userData: { id: 'u1' }
            });

            const valid = await otpDoc.verifyOtp(plainOtp);
            expect(valid).toBe(true);

            const invalid = await otpDoc.verifyOtp('000000');
            expect(invalid).toBe(false);
        });
    });

    describe('SupportTicket Model', () => {
        it('validates required fields and length constraints', () => {
            const ticket = new SupportTicket({
                title: 'Abc', // too short (< 5 chars)
                subject: 'Query'
            });
            const err = ticket.validateSync();
            expect(err.errors.title).toBeDefined();
        });

        it('accepts valid ticket document, syncs title/subject, and calculates responseCount virtual', async () => {
            const ticket = new SupportTicket({
                title: 'Cannot access course',
                description: 'Getting error 403 on module 2',
                category: 'technical',
                responses: [
                    { message: 'We are investigating.' }
                ]
            });
            await ticket.validate();
            expect(ticket.subject).toBe('Cannot access course');
            expect(ticket.status).toBe('open');
            expect(ticket.priority).toBe('medium');
            expect(ticket.responseCount).toBe(1);
        });
    });

    describe('Badge & UserBadge Models', () => {
        it('validates Badge schema required fields and defaults', () => {
            const badge = new Badge({
                badgeId: 'TEST-BADGE',
                title: 'Test Badge',
                description: 'Test description',
                category: 'learning',
                tier: 'standard',
                xp: 150,
                criteria: {
                    type: 'course_completion'
                }
            });
            const err = badge.validateSync();
            expect(err).toBeUndefined();
            expect(badge.isActive).toBe(true);
        });

        it('validates UserBadge document and defaults', () => {
            const userBadge = new UserBadge({
                userId: new mongoose.Types.ObjectId(),
                badgeId: new mongoose.Types.ObjectId(),
                isEarned: true
            });
            const err = userBadge.validateSync();
            expect(err).toBeUndefined();
            expect(userBadge.isEarned).toBe(true);
        });
    });

    describe('Notification & Degree Models', () => {
        it('creates notification with proper default read status', () => {
            const notif = new Notification({
                userId: new mongoose.Types.ObjectId(),
                recipient: new mongoose.Types.ObjectId(),
                title: 'New Announcement',
                message: 'Class starts at 10 AM',
                type: 'achievement'
            });
            expect(notif.isRead).toBe(false);
        });

        it('validates Degree model', () => {
            const degree = new Degree({
                uniqueId: 'DEG-UG-ENG-BTECH-CS',
                level: 'Undergraduate (UG)',
                domain: 'Engineering',
                fullName: 'Bachelor of Technology',
                abbreviation: 'B.Tech',
                specialization: 'Computer Science and Engineering'
            });
            const err = degree.validateSync();
            expect(err).toBeUndefined();
        });
    });
});
