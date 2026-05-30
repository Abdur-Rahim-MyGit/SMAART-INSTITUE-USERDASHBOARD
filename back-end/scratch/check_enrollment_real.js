const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://souban:souban123@ac-3hctxon-shard-00-00.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-01.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-02.bkxwjdl.mongodb.net:27017/?ssl=true&replicaSet=atlas-taxso3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const Course = require('../models/Course');
    const CourseEnrollment = require('../models/CourseEnrollment');
    const User = require('../models/User');

    const student = await User.findOne({ fullName: /rahman/i });
    if (!student) {
      console.error('Rahman not found');
      return;
    }

    const enrollments = await CourseEnrollment.find({ student: student._id }).populate('course');
    console.log('Enrollments for Rahman:', enrollments);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
