const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Course = require('../models/Course');

const syncExistingMicroassessments = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully.');

    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses to process.`);

    for (let course of courses) {
      console.log(`Processing course: ${course.title} (${course.courseCode})`);
      
      // Let's manually trigger the sync logic as well to print log statements
      if (course.modules && Array.isArray(course.modules)) {
        course.modules.forEach((module, modIdx) => {
          const microAssessments = [];
          if (module.days && Array.isArray(module.days)) {
            module.days.forEach(day => {
              if (day.steps && Array.isArray(day.steps)) {
                day.steps.forEach(step => {
                  if (step.type === 'quiz' && step.content && step.content.questions && step.content.questions.length > 0) {
                    console.log(`  - Module ${module.sequence || (modIdx + 1)}, Day ${day.dayNumber}: Found quiz step with ${step.content.questions.length} questions.`);
                    microAssessments.push({
                      moduleId: module.sequence || (modIdx + 1),
                      dayId: day.dayNumber,
                      stepId: step.stepNumber || 4,
                      title: step.title || step.content?.title || "Micro-Assessment",
                      shuffleQuestions: step.content?.shuffleQuestions !== false && step.content?.shuffle !== false,
                      questions: step.content.questions
                    });
                  }
                });
              }
            });
          }
          module.microAssessments = microAssessments;
        });
      }
      
      // Mark fields as modified to ensure mongoose updates them
      course.markModified('modules');
      
      await course.save();
      console.log(`Successfully updated and saved course: ${course.title}`);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

syncExistingMicroassessments();
