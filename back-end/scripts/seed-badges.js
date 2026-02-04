const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Badge = require('../models/Badge');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const badges = [
    // --- Course Completion Badges ---
    {
        badgeId: 'COURSE_COMPLETION_1',
        title: 'First Step',
        description: 'Completed your first course!',
        category: 'learning',
        tier: 'bronze',
        xp: 100,
        icon: 'Trophy',
        color: '#CD7F32',
        criteria: {
            type: 'course_completion',
            moduleCount: 1
        },
        rarity: 'common',
        displayOrder: 1
    },
    {
        badgeId: 'COURSE_FnB_MASTER',
        title: 'F&B Service Expert',
        description: 'Completed the F&B Service course successfully.',
        category: 'certification',
        tier: 'gold',
        xp: 500,
        icon: 'Medal',
        color: '#FFD700',
        criteria: {
            type: 'course_completion',
            // We will match this by course code in the code logic usually, 
            // but here we might need a specific way to link it. 
            // For now, let's assume the system awards this by ID if passed explicitly.
            customRule: 'exact_course_code:FNB-001'
        },
        rarity: 'rare',
        displayOrder: 2
    },

    // --- Assessment Badges ---
    {
        badgeId: 'ASSESSMENT_T1_PRO',
        title: 'Cognitive Champion',
        description: 'Scored above 80% in the T1 Assessment.',
        category: 'assessment',
        tier: 'silver',
        xp: 300,
        icon: 'Brain',
        color: '#C0C0C0',
        criteria: {
            type: 'assessment_score',
            assessmentCode: 'ASM00001',
            minScore: 80
        },
        rarity: 'uncommon',
        displayOrder: 3
    },

    // --- Streak Badges ---
    {
        badgeId: 'STREAK_3_DAYS',
        title: 'Consistency is Key',
        description: 'Logged in and learned for 3 consecutive days.',
        category: 'streak',
        tier: 'bronze',
        xp: 50,
        icon: 'Flame',
        color: '#CD7F32',
        criteria: {
            type: 'streak',
            streakDays: 3
        },
        rarity: 'common',
        displayOrder: 10
    }
];

async function seedBadges() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('❌ MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Clear existing badges to avoid duplicates
        console.log('🧹 Clearing existing badges...');
        await Badge.deleteMany({});

        // Insert new badges
        console.log(`🌱 Seeding ${badges.length} badges...`);
        const result = await Badge.insertMany(badges);

        console.log(`✅ Successfully seeded ${result.length} badges!`);
        console.log('Badges created:');
        result.forEach(b => console.log(` - [${b.badgeId}] ${b.title}`));

        mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error seeding badges:', err);
        process.exit(1);
    }
}

seedBadges();
