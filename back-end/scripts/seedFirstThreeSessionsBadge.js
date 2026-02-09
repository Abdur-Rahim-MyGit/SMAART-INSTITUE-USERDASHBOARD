const mongoose = require('mongoose');
const Badge = require('../models/Badge');
require('dotenv').config();

const seedBadge = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const badge = await Badge.findOneAndUpdate(
            { badgeId: 'BADGE-FIRST-3-SESSIONS' },
            {
                badgeId: 'BADGE-FIRST-3-SESSIONS',
                title: 'Getting Started',
                description: 'Completed the first three sessions of your learning journey!',
                category: 'milestone',
                tier: 'bronze',
                xp: 50,
                icon: 'rocket',
                color: '#CD7F32',
                rarity: 'common',
                criteria: {
                    type: 'custom',
                    customRule: 'first_three_sessions'
                },
                isActive: true,
                displayOrder: 10
            },
            { upsert: true, new: true }
        );

        console.log('✅ Badge created/updated:', badge.badgeId);
        console.log('   Title:', badge.title);
        console.log('   Tier:', badge.tier);
        console.log('   XP:', badge.xp);

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedBadge();
