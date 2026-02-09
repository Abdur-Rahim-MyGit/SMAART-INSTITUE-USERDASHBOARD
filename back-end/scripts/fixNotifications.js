const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Notification = require('../models/Notification');
const CourseEnrollment = require('../models/CourseEnrollment');
const Course = require('../models/Course');
const { isSessionCompleted } = require('../utils/progressUtils');

async function fix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const userId = '691c4a243408254901245d8d';

        // 1. Clear old notifications
        const result = await Notification.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
        console.log(`🗑️ Deleted ${result.deletedCount} old notifications for user ${userId}`);

        // 2. Check current progress for sessions
        const enrollments = await CourseEnrollment.find({ student: userId }).populate('course');
        console.log(`🔍 Checking progress for ${enrollments.length} enrollments...`);

        for (const enr of enrollments) {
            if (!enr.course) continue;
            console.log(`\n📘 Course: ${enr.course.title}`);

            for (const mod of enr.course.modules) {
                for (const day of mod.days || []) {
                    const completed = await isSessionCompleted(enr, enr.course, mod, day.dayNumber);
                    if (completed) {
                        console.log(`✅ Session ${day.dayNumber} is COMPLETED`);
                    } else {
                        console.log(`⏳ Session ${day.dayNumber} is IN PROGRESS`);
                    }
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

fix();
