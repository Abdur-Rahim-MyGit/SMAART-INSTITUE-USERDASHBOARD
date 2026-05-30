const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SystemConfig = require('../models/SystemConfig');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedFeatureFlags = async () => {
    try {
        console.log('🌱 Seeding Feature Flags...');

        const flagsToSeed = [
            {
                key: 'NEW_ASSESSMENT_EVALUATION',
                description: 'Enables the new assessment evaluation and grading flow (currently in placeholder stage). When disabled, executes the existing assessment submission and grading logic without alterations.',
                enabled: false // Default to false so existing logic runs by default
            }
        ];

        for (const flag of flagsToSeed) {
            const existingFlag = await SystemConfig.findOne({ key: flag.key });

            if (existingFlag) {
                console.log(`⚠️ Feature flag "${flag.key}" already exists. Current status: enabled = ${existingFlag.enabled}`);
            } else {
                const newFlag = new SystemConfig(flag);
                await newFlag.save();
                console.log(`🚀 Created feature flag "${flag.key}" initialized to enabled = ${flag.enabled}`);
            }
        }

        console.log('✅ Success! Feature flags seeding complete.');
        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Seeding Error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
};

seedFeatureFlags();
