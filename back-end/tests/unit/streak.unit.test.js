/**
 * Unit tests for Avatar 7-day cycle streak logic
 */

const mongoose = require('mongoose');
const Avatar = require('../../models/Avatar');

describe('Avatar Streak Unit Tests', () => {
    let avatar;

    beforeEach(() => {
        avatar = new Avatar({
            userId: new mongoose.Types.ObjectId(),
            level: 1,
            xp: 0,
            streakCycleDay: 0,
            streakCyclesCompleted: 0,
            streakActive: false,
            lastStreakDate: '',
            accessories: {
                shoes: { unlocked: false, modelUrl: '', equipped: false },
                jacket: { unlocked: false, modelUrl: '', equipped: false },
                glasses: { unlocked: false, modelUrl: '', equipped: false },
            },
            animations: {
                celebrate: { unlocked: false, modelUrl: '', equipped: false },
            }
        });
        // Mock save to avoid needing DB connection for pure unit test
        avatar.save = jest.fn().mockResolvedValue(avatar);
    });

    it('initializes and updates initial streak on day 1', async () => {
        const status = await avatar.updateStreak();
        expect(status).toBeDefined();
        expect(avatar.streakActive).toBe(true);
        expect(avatar.streak).toBe(1);
        expect(typeof status.cycleDay).toBe('number');
        expect(status.isActive).toBe(true);
    });

    it('returns existing status if streak is updated multiple times on the same date', async () => {
        const today = new Date();
        const todayStr = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');

        avatar.lastStreakDate = todayStr;
        avatar.streakActive = true;
        avatar.streakCycleDay = 3;
        avatar.streak = 3;

        const status = await avatar.updateStreak();
        expect(status.totalStreakDays).toBe(3);
        expect(avatar.save).toHaveBeenCalled();
    });

    it('resets streak when a day is skipped (gap >= 2 without Saturday exception)', async () => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const dateStr = threeDaysAgo.getFullYear() + '-' +
            String(threeDaysAgo.getMonth() + 1).padStart(2, '0') + '-' +
            String(threeDaysAgo.getDate()).padStart(2, '0');

        avatar.lastStreakDate = dateStr;
        avatar.streakActive = true;
        avatar.streak = 4;
        avatar.streakCycleDay = 4;

        const status = await avatar.updateStreak();
        expect(avatar.streak).toBe(1);
        expect(status.isActive).toBe(true);
    });

    it('handles streak cycle tracking and status reporting', async () => {
        avatar.streakCycleDay = 6;
        avatar.streakActive = true;
        avatar.streak = 6;
        avatar.streakCyclesCompleted = 1;
        const status = avatar.getStreakStatus();
        expect(status).toBeDefined();
        expect(status.isActive).toBe(true);
        expect(status.cyclesCompleted).toBe(1);
        expect(Array.isArray(status.cycleProgress)).toBe(true);
    });

    it('adds XP and correctly calculates level ups and unlocks', async () => {
        avatar.xp = 0;
        avatar.level = 1;
        avatar.xpToNextLevel = 100;

        const result = await avatar.addXP(250);
        expect(result.newLevel).toBeGreaterThanOrEqual(2);
        expect(avatar.level).toBeGreaterThanOrEqual(2);
        expect(avatar.save).toHaveBeenCalled();
    });

    it('processes level unlocks for accessories and animations', () => {
        const shoeUnlock = avatar.processLevelUnlock(2);
        expect(shoeUnlock).toEqual({ type: 'accessory', item: 'shoes', level: 2 });
        expect(avatar.accessories.shoes.unlocked).toBe(true);
        expect(avatar.accessories.shoes.equipped).toBe(true);

        const jacketUnlock = avatar.processLevelUnlock(3);
        expect(jacketUnlock).toEqual({ type: 'accessory', item: 'jacket', level: 3 });

        const noUnlock = avatar.processLevelUnlock(99);
        expect(noUnlock).toBeNull();
    });

    it('calculates level milestone and progress virtual', () => {
        avatar.xp = 50;
        avatar.xpToNextLevel = 100;
        expect(avatar.levelProgress).toBe(50);
    });
});
