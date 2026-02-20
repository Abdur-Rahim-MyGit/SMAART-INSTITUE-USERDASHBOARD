require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

async function listAllSessions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const courses = await Course.find({});

        courses.forEach(course => {
            console.log(`\nCourse: ${course.title} (${course.courseCode})`);
            if (course.modules && course.modules.length > 0) {
                course.modules.forEach(module => {
                    console.log(`  Module: ${module.title}`);
                    const dayNumbers = module.days.map(d => d.dayNumber).sort((a, b) => a - b);
                    console.log(`    Days: ${dayNumbers.join(', ')}`);

                    if (module.microAssessments) {
                        const maDays = module.microAssessments.map(ma => ma.dayId).sort((a, b) => a - b);
                        console.log(`    MicroAssessments for Days: ${maDays.join(', ')}`);
                    }
                });
            } else {
                console.log('  No modules found.');
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

listAllSessions();
