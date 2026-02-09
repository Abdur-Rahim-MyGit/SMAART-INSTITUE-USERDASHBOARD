// verifyBadgeLogic.js
const mongoose = require('mongoose');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const { checkSkillCompletionBadges } = require('../utils/badgeUtils');

// Connect to MongoDB (Updated based on previous context if available, otherwise defaulting to local)
// IMPORTANT: You might need to adjust the URI if it's different in your .env
const MONGO_URI = 'mongodb://127.0.0.1:27017/smaart_dashboard'; 

const runVerification = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create a Test Badge (Capability Category)
        const testBadgeId = 'TEST-SKILL-BADGE';
        let badge = await Badge.findOne({ badgeId: testBadgeId });
        
        if (!badge) {
            badge = new Badge({
                badgeId: testBadgeId,
                title: 'Test Capability Badge',
                description: 'Awarded for completing a test skill',
                category: 'capability', // NEW CATEGORY
                tier: 'gold',
                xp: 100,
                criteria: {
                    type: 'skill_completion', // NEW CRITERIA
                    skillId: new mongoose.Types.ObjectId() // Placeholder
                }
            });
            await badge.save();
            console.log('✅ Created Test Badge:', badge.badgeId);
        } else {
            console.log('ℹ️ Test Badge already exists:', badge.badgeId);
        }

        // 2. Find ANY User to test with
        const User = require('../models/User');
        const Student = require('../models/Student');
        
        let student = await User.findOne();
        if (!student) {
             console.log('⚠️ No users found. Creating a minimal test user...');
             try {
                 // Try to find if Counter exists, if not we might need to handle it
                 // But for now let's just provide all fields including mobile
                 student = new User({
                    firstName: 'Test',
                    lastName: 'User',
                    fullName: 'Test User', // Provide both just in case
                    email: 'test' + Date.now() + '@user.com',
                    password: 'password123',
                    role: 'student',
                    mobile: '1234567890',
                    userId: 'USR' + Math.floor(Math.random() * 10000) // Manually provide ID to bypass pre-save hook issues if any
                 });
                 // Bypass mongoose validation if needed for simple test
                 await student.save({ validateBeforeSave: false }); 
                 console.log('✅ Created test user:', student.email);
             } catch (err) {
                 console.error('❌ Failed to create User:', err.message);
                 return;
             }
        }
        
        console.log('👤 Testing with user:', student.email || student._id);

        // 3. Verify Locking Mechanism (Badge should NOT be in UserBadges initially or should be marked unearned)
        let userBadge = await UserBadge.findOne({ userId: student._id, badgeId: badge._id });
        if (!userBadge || !userBadge.isEarned) {
            console.log('🔒 Badge is correctly LOCKED (not earned yet).');
        } else {
            console.log('⚠️ Badge is already unlocked. Resetting for test...');
            await UserBadge.deleteOne({ userId: student._id, badgeId: badge._id });
            console.log('🔄 Badge reset to LOCKED state.');
        }

        // 4. Simulate Skill Completion
        console.log('🚀 Simulating Skill Completion...');
        // We update the badge to match a "real" skill ID if we had one, but here we just manually call the checker
        // with the ID we put in the badge criteria
        
        const result = await checkSkillCompletionBadges(
            student._id, 
            badge.criteria.skillId, 
            'Test Skill Module'
        );

        if (result.length > 0) {
            console.log('🎉 Badge Awarded Successfully!', result.map(r => r.badge.badgeId));
        } else {
            console.error('❌ Failed to award badge.');
        }

        // 5. Verify Unlocked State
        userBadge = await UserBadge.findOne({ userId: student._id, badgeId: badge._id });
        if (userBadge && userBadge.isEarned) {
             console.log('🔓 Badge is now UNLOCKED and EARNED.');
        } else {
             console.log('❌ Badge is still LOCKED.');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();
