const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Student = require('./models/Student');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/smaart-institute', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('Connected to MongoDB');
    
    try {
        // Check if user exists in User collection
        console.log('\n=== Checking User Collection ===');
        const userRecord = await User.findOne({ email: 'rahul@gmail.com' });
        console.log('User record found:', userRecord ? 'YES' : 'NO');
        if (userRecord) {
            console.log('User details:', {
                userId: userRecord.userId,
                fullName: userRecord.fullName,
                email: userRecord.email,
                status: userRecord.status,
                hasPassword: !!userRecord.password,
                mustChangePassword: userRecord.mustChangePassword
            });
            
            // Test password comparison
            const isPasswordMatch = await bcrypt.compare('Rahul@123', userRecord.password);
            console.log('Password match (Rahul@123):', isPasswordMatch ? 'YES' : 'NO');
        }
        
        // Check if user exists in Student collection
        console.log('\n=== Checking Student Collection ===');
        const studentRecord = await Student.findOne({ email: 'rahul@gmail.com' });
        console.log('Student record found:', studentRecord ? 'YES' : 'NO');
        if (studentRecord) {
            console.log('Student details:', {
                studentId: studentRecord.studentId,
                fullName: studentRecord.fullName,
                email: studentRecord.email,
                status: studentRecord.status,
                hasPassword: !!studentRecord.password,
                mustChangePassword: studentRecord.mustChangePassword,
                isFirstLogin: studentRecord.isFirstLogin,
                isRegistered: studentRecord.isRegistered
            });
            
            // Test password comparison
            const isPasswordMatch = await bcrypt.compare('Rahul@123', studentRecord.password);
            console.log('Password match (Rahul@123):', isPasswordMatch ? 'YES' : 'NO');
        }
        
        // Check for any similar email addresses
        console.log('\n=== Checking for Similar Emails ===');
        const similarUsers = await User.find({ 
            email: { $regex: /rahul/i } 
        });
        console.log('Users with "rahul" in email:', similarUsers.length);
        similarUsers.forEach(user => {
            console.log(`- ${user.email} (${user.fullName})`);
        });
        
        const similarStudents = await Student.find({ 
            email: { $regex: /rahul/i } 
        });
        console.log('Students with "rahul" in email:', similarStudents.length);
        similarStudents.forEach(student => {
            console.log(`- ${student.email} (${student.fullName})`);
        });
        
    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDisconnected from MongoDB');
    }
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});
