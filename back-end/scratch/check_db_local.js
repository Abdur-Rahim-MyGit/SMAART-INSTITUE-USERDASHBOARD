const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://souban:souban123@ac-3hctxon-shard-00-00.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-01.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-02.bkxwjdl.mongodb.net:27017/?ssl=true&replicaSet=atlas-taxso3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const UserSchema = new mongoose.Schema({
      fullName: String,
      email: String,
      role: String
    }, { collection: 'users' });
    const User = mongoose.model('User', UserSchema);

    const CourseEnrollmentSchema = new mongoose.Schema({
      student: mongoose.Schema.Types.ObjectId,
      course: mongoose.Schema.Types.ObjectId,
      status: String,
      progress: Number
    }, { collection: 'courseenrollments' });
    const CourseEnrollment = mongoose.model('CourseEnrollment', CourseEnrollmentSchema);

    const Course = mongoose.model('Course', new mongoose.Schema({}, { strict: false }));

    const courses = await Course.find({});
    console.log('All Courses in DB:', JSON.stringify(courses, null, 2));

    const users = await User.find({ fullName: /rahman/i });
    console.log('Matching Users:', users);

    for (const u of users) {
      const enrollments = await CourseEnrollment.find({ student: u._id });
      console.log(`Enrollments for user ${u.fullName} (${u._id}):`, enrollments);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
