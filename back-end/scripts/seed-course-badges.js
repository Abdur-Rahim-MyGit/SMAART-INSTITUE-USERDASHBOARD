const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Course = require('../models/Course');
const Badge = require('../models/Badge');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const defaultMongoURI = process.env.MONGODB_URI;
const mongoURI = process.env.MONGODB_URI || defaultMongoURI;

async function seedCourseBadges() {
    try {
        console.log('🔌 Connecting to MongoDB database...');
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB successfully.');

        // 1. Fetch all courses
        console.log('📚 Fetching all courses...');
        const courses = await Course.find();
        console.log(`ℹ️ Found ${courses.length} courses in the database.`);

        if (courses.length === 0) {
            console.log('⚠️ No courses found. Please ensure courses are seeded first.');
            mongoose.disconnect();
            return;
        }

        // 2. Clear existing course-specific badges (those ending with _BRONZE, _SILVER, _GOLD)
        console.log('🧹 Cleaning existing course badges to prevent duplicates...');
        const deleteResult = await Badge.deleteMany({
            badgeId: { $regex: /_(BRONZE|SILVER|GOLD)$/i }
        });
        console.log(`🧹 Deleted ${deleteResult.deletedCount} old course badges.`);

        // 3. Generate Bronze, Silver, Gold badges for each course
        const badgesToInsert = [];
        let displayOrder = 10; // Start course badges from display order 10 onwards

        courses.forEach(course => {
            const courseCode = course.courseCode || `CRS${course._id.toString().substring(0, 5).toUpperCase()}`;
            const moduleCount = course.modules ? course.modules.length : 0;
            const midModules = Math.max(1, Math.ceil(moduleCount / 2));

            // Bronze Badge
            badgesToInsert.push({
                badgeId: `${courseCode}_BRONZE`,
                title: `${course.title} (Bronze)`,
                description: `Awarded for starting and showing excellent early dedication in the course: ${course.title}.`,
                category: 'learning',
                tier: 'bronze',
                xp: 150,
                icon: 'Award',
                color: '#CD7F32', // Bronze
                criteria: {
                    type: 'module_completion',
                    courseId: course._id,
                    moduleCount: 1
                },
                rarity: 'common',
                displayOrder: displayOrder++,
                isActive: true
            });

            // Silver Badge
            badgesToInsert.push({
                badgeId: `${courseCode}_SILVER`,
                title: `${course.title} (Silver)`,
                description: `Awarded for successfully reaching the mid-way point and completing ${midModules} modules in: ${course.title}.`,
                category: 'learning',
                tier: 'silver',
                xp: 300,
                icon: 'Award', // Lucide-react will render Award beautifully
                color: '#C0C0C0', // Silver
                criteria: {
                    type: 'module_completion',
                    courseId: course._id,
                    moduleCount: midModules
                },
                rarity: 'uncommon',
                displayOrder: displayOrder++,
                isActive: true
            });

            // Gold Badge
            badgesToInsert.push({
                badgeId: `${courseCode}_GOLD`,
                title: `${course.title} (Gold)`,
                description: `Awarded for 100% completion, passing all assessments, and achieving master competency in: ${course.title}.`,
                category: 'certification',
                tier: 'gold',
                xp: 600,
                icon: 'Trophy',
                color: '#FFD700', // Gold
                criteria: {
                    type: 'course_completion',
                    courseId: course._id
                },
                rarity: 'rare',
                displayOrder: displayOrder++,
                isActive: true
            });
        });

        // 4. Insert all generated badges
        console.log(`🌱 Inserting ${badgesToInsert.length} new course badges into the database...`);
        const result = await Badge.insertMany(badgesToInsert);
        console.log(`🎉 Successfully seeded ${result.length} badges!`);

        console.log('🔌 Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('✅ Done!');
    } catch (error) {
        console.error('❌ Error seeding course badges:', error);
        try {
            await mongoose.disconnect();
        } catch (e) {}
        process.exit(1);
    }
}

seedCourseBadges();
