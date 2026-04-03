const mongoose = require('mongoose');
const Degree = require('../models/Degree');

const degreeData = [
  // Undergraduate (UG) - Engineering
  { level: 'Undergraduate (UG)', domain: 'Engineering', fullName: 'Bachelor of Technology (B.Tech)', specialization: 'Computer Science and Engineering' },
  { level: 'Undergraduate (UG)', domain: 'Engineering', fullName: 'Bachelor of Technology (B.Tech)', specialization: 'Information Technology' },
  { level: 'Undergraduate (UG)', domain: 'Engineering', fullName: 'Bachelor of Technology (B.Tech)', specialization: 'Electronics and Communication Engineering' },
  { level: 'Undergraduate (UG)', domain: 'Engineering', fullName: 'Bachelor of Technology (B.Tech)', specialization: 'Mechanical Engineering' },
  { level: 'Undergraduate (UG)', domain: 'Engineering', fullName: 'Bachelor of Technology (B.Tech)', specialization: 'Civil Engineering' },
  { level: 'Undergraduate (UG)', domain: 'Engineering', fullName: 'Bachelor of Engineering (B.E)', specialization: 'Electrical Engineering' },

  // Undergraduate (UG) - Arts & Science
  { level: 'Undergraduate (UG)', domain: 'Arts', fullName: 'Bachelor of Arts (B.A)', specialization: 'English Literature' },
  { level: 'Undergraduate (UG)', domain: 'Arts', fullName: 'Bachelor of Arts (B.A)', specialization: 'Economics' },
  { level: 'Undergraduate (UG)', domain: 'Science', fullName: 'Bachelor of Science (B.Sc)', specialization: 'Physics' },
  { level: 'Undergraduate (UG)', domain: 'Science', fullName: 'Bachelor of Science (B.Sc)', specialization: 'Mathematics' },
  { level: 'Undergraduate (UG)', domain: 'Science', fullName: 'Bachelor of Science (B.Sc)', specialization: 'Chemistry' },
  { level: 'Undergraduate (UG)', domain: 'Science', fullName: 'Bachelor of Science (B.Sc)', specialization: 'Computer Science' },

  // Undergraduate (UG) - Commerce & Management
  { level: 'Undergraduate (UG)', domain: 'Commerce', fullName: 'Bachelor of Commerce (B.Com)', specialization: 'General' },
  { level: 'Undergraduate (UG)', domain: 'Commerce', fullName: 'Bachelor of Commerce (B.Com)', specialization: 'Accounting and Finance' },
  { level: 'Undergraduate (UG)', domain: 'Management', fullName: 'Bachelor of Business Administration (BBA)', specialization: 'Human Resources' },
  { level: 'Undergraduate (UG)', domain: 'Management', fullName: 'Bachelor of Business Administration (BBA)', specialization: 'Marketing' },

  // Postgraduate (PG) - Engineering
  { level: 'Postgraduate (PG)', domain: 'Engineering', fullName: 'Master of Technology (M.Tech)', specialization: 'Software Engineering' },
  { level: 'Postgraduate (PG)', domain: 'Engineering', fullName: 'Master of Technology (M.Tech)', specialization: 'Data Science' },
  { level: 'Postgraduate (PG)', domain: 'Engineering', fullName: 'Master of Technology (M.Tech)', specialization: 'VLSI Design' },

  // Postgraduate (PG) - Management
  { level: 'Postgraduate (PG)', domain: 'Management', fullName: 'Master of Business Administration (MBA)', specialization: 'Information Technology' },
  { level: 'Postgraduate (PG)', domain: 'Management', fullName: 'Master of Business Administration (MBA)', specialization: 'International Business' },

  // Doctoral (PhD/Research)
  { level: 'Doctoral (PhD/Research)', domain: 'Engineering', fullName: 'Doctor of Philosophy (Ph.D)', specialization: 'Artificial Intelligence' },
  { level: 'Doctoral (PhD/Research)', domain: 'Science', fullName: 'Doctor of Philosophy (Ph.D)', specialization: 'Quantum Physics' },

  // Diploma
  { level: 'Diploma', domain: 'Engineering', fullName: 'Diploma in Engineering', specialization: 'Computer Engineering' },
  { level: 'Diploma', domain: 'Engineering', fullName: 'Diploma in Engineering', specialization: 'Mechanical Engineering' },
  { level: 'Diploma', domain: 'Health', fullName: 'Diploma in Nursing', specialization: 'General Nursing' },

  // Professional / Integrated
  { level: 'Professional / Integrated', domain: 'Law', fullName: 'B.A. LL.B.', specialization: 'Criminal Law' },
  { level: 'Professional / Integrated', domain: 'Architecture', fullName: 'Bachelor of Architecture (B.Arch)', specialization: 'Urban Design' }
];

async function seedDegrees() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minds';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🌱 Clearing existing degrees...');
    await Degree.deleteMany({});

    console.log('🌱 Seeding degrees...');
    await Degree.insertMany(degreeData);

    console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDegrees();
