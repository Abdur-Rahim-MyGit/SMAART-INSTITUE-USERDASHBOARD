const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Badge = require('../models/Badge');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const badges = [
    {
        badgeId: 'MOD-COMPLETE',
        title: 'Module Master',
        description: 'Awarded for completing a course module successfully.',
        category: 'capability',
        tier: 'silver',
        xp: 300,
        icon: 'Award',
        color: '#C0C0C0', // Silver
        criteria: {
            type: 'module_completion'
        },
        rarity: 'uncommon',
        displayOrder: 1,
        isActive: true
    },
    {
        badgeId: 'CRS-COMPLETE',
        title: 'Course Conqueror',
        description: 'Awarded for completing an entire course successfully.',
        category: 'capacity',
        tier: 'gold',
        xp: 500,
        icon: 'Trophy',
        color: '#FFD700', // Gold
        criteria: {
            type: 'course_completion'
        },
        rarity: 'rare',
        displayOrder: 2,
        isActive: true
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
