const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');
const Student = require('../models/Student');

const cleanupAndSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for cleanup...');

        // 1. Clear modern collections
        console.log('Clearing Badge collection...');
        await Badge.deleteMany({});

        console.log('Clearing UserBadge collection...');
        await UserBadge.deleteMany({});

        // 2. Clear legacy embedded badges in User and Student
        console.log('Clearing embedded badges in User collection...');
        await User.updateMany({}, { $set: { badges: [] } });

        console.log('Clearing embedded badges in Student collection...');
        await Student.updateMany({}, { $set: { badges: [] } });

        // 3. Seed new simplified templates
        const newBadges = [
            {
                badgeId: 'MOD-COMPLETE',
                title: 'Module Master',
                description: 'Awarded for successfully completing an entire learning module.',
                category: 'learning',
                tier: 'silver',
                xp: 100,
                icon: 'book-open',
                color: '#3b82f6',
                criteria: {
                    type: 'skill_completion'
                }
            },
            {
                badgeId: 'CRS-COMPLETE',
                title: 'Course Conqueror',
                description: 'Awarded for successfully completing an entire course path.',
                category: 'certification',
                tier: 'gold',
                xp: 500,
                icon: 'award',
                color: '#f59e0b',
                criteria: {
                    type: 'course_completion'
                }
            }
        ];

        await Badge.insertMany(newBadges);
        console.log('✅ Seeded new Module and Course completion templates.');

        console.log('🚀 Badge system cleanup and reset complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during cleanup:', err);
        process.exit(1);
    }
};

cleanupAndSeed();
