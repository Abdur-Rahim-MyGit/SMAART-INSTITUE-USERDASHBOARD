const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://souban:souban123@ac-3hctxon-shard-00-00.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-01.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-02.bkxwjdl.mongodb.net:27017/?ssl=true&replicaSet=atlas-taxso3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const Course = require('../models/Course');

    const course = await Course.findOne({ courseCode: 'CRS00004' });
    if (!course) {
      console.error('Self-Awareness Foundations course (CRS00004) not found.');
      return;
    }

    console.log('Found course:', course.title);

    // Setup 1 module with 9 days (Why, Story, Framework, Practice, Reflection, Flashcards, Adv Practice, Case Study, Notes)
    const modules = [
      {
        title: "Self-Awareness Foundations",
        description: "Understanding your strengths and areas for growth",
        duration: 3,
        sequence: 1,
        days: [
          {
            dayNumber: 1,
            title: "Why",
            dayType: "course",
            steps: [{ stepNumber: 1, title: "Why Video", type: "video", isRequired: true }]
          },
          {
            dayNumber: 2,
            title: "Story",
            dayType: "course",
            steps: [{ stepNumber: 2, title: "Story Video", type: "video", isRequired: true }]
          },
          {
            dayNumber: 3,
            title: "Framework",
            dayType: "course",
            steps: [{ stepNumber: 3, title: "Framework Video", type: "video", isRequired: true }]
          },
          {
            dayNumber: 4,
            title: "Practice",
            dayType: "course",
            steps: [{ stepNumber: 4, title: "Practice Quiz", type: "quiz", isRequired: true }]
          },
          {
            dayNumber: 5,
            title: "Critique/Reflection",
            dayType: "course",
            steps: [{ stepNumber: 5, title: "Reflection", type: "reflection", isRequired: true }]
          },
          {
            dayNumber: 6,
            title: "Game/Flashcards",
            dayType: "course",
            steps: [{ stepNumber: 6, title: "Flashcard", type: "flashcard", isRequired: true }]
          },
          {
            dayNumber: 7,
            title: "Advanced Practice",
            dayType: "course",
            steps: [{ stepNumber: 7, title: "Advanced Practice Quiz", type: "quiz", isRequired: true }]
          },
          {
            dayNumber: 8,
            title: "Case Study",
            dayType: "course",
            steps: [{ stepNumber: 8, title: "Case Study Quiz", type: "quiz", isRequired: true }]
          },
          {
            dayNumber: 9,
            title: "Notes",
            dayType: "course",
            steps: [{ stepNumber: 9, title: "Notes Takeaways", type: "text", isRequired: true }]
          }
        ]
      }
    ];

    course.modules = modules;
    await course.save();
    console.log('Seeded modules for Self-Awareness Foundations successfully.');

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
