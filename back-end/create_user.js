const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Student = require('./models/Student');
const Counter = require('./models/Counter');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/smaart-institute', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log('Connected to MongoDB');
    
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('Rahul@123', 10);
        console.log('Password hashed successfully');
        
        // Get next user ID
        const counter = await Counter.findOneAndUpdate(
            { name: 'userId' },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true }
        );
        const userId = `USER${counter.sequence.toString().padStart(4, '0')}`;
        
        // Get next student ID
        const studentCounter = await Counter.findOneAndUpdate(
            { name: 'studentId' },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true }
        );
        const studentId = `STU${studentCounter.sequence.toString().padStart(4, '0')}`;
        
        // Create User record
        const newUser = new User({
            userId: userId,
            fullName: 'Rahul Kumar',
            email: 'rahul@gmail.com',
            password: hashedPassword,
            mobile: '9876543210',
            status: 'active',
            mustChangePassword: false,
            isFirstLogin: false,
            isRegistered: true,
            bio: 'Test user account',
            timezone: 'Asia/Kolkata',
            dateFormat: 'DD/MM/YYYY',
            sessionExpiresAt: null,
            settings: {
                profile: {
                    displayName: 'Rahul Kumar',
                    email: 'rahul@gmail.com',
                    bio: 'Test user account',
                    phone: '9876543210'
                },
                notifications: {
                    emailNotifications: true,
                    pushNotifications: true,
                    assessmentReminders: true,
                    courseUpdates: true,
                    coachSessionReminders: true,
                    communityActivity: true
                },
                privacy: {
                    profileVisibility: 'everyone',
                    twoFactorEnabled: false
                },
                appearance: {
                    theme: 'system',
                    accentColor: '#1a3884'
                },
                language: {
                    preferredLanguage: 'English (US)',
                    timezone: 'Asia/Kolkata (GMT+5:30)',
                    dateFormat: 'DD/MM/YYYY'
                }
            }
        });
        
        await newUser.save();
        console.log('✅ User record created successfully');
        console.log(`   User ID: ${userId}`);
        console.log(`   Email: rahul@gmail.com`);
        console.log(`   Password: Rahul@123`);
        
        // Create Student record
        const newStudent = new Student({
            studentId: studentId,
            fullName: 'Rahul Kumar',
            email: 'rahul@gmail.com',
            password: hashedPassword,
            mobile: '9876543210',
            status: 'active',
            mustChangePassword: false,
            isFirstLogin: false,
            isRegistered: true,
            college: 'SMAART Institute',
            rollNumber: '1001',
            section: 'A',
            department: 'Computer Science',
            enrolledCourses: [],
            assessments: [],
            coachingSessions: [],
            badges: [],
            profileImage: null,
            admissionDate: new Date(),
            activeVisionBoardId: null,
            sessionExpiresAt: null,
            settings: {
                profile: {
                    displayName: 'Rahul Kumar',
                    email: 'rahul@gmail.com',
                    bio: 'Test user account',
                    phone: '9876543210'
                },
                notifications: {
                    emailNotifications: true,
                    pushNotifications: true,
                    assessmentReminders: true,
                    courseUpdates: true,
                    coachSessionReminders: true,
                    communityActivity: true
                },
                privacy: {
                    profileVisibility: 'everyone',
                    twoFactorEnabled: false
                },
                appearance: {
                    theme: 'system',
                    accentColor: '#1a3884'
                },
                language: {
                    preferredLanguage: 'English (US)',
                    timezone: 'Asia/Kolkata (GMT+5:30)',
                    dateFormat: 'DD/MM/YYYY'
                }
            }
        });
        
        await newStudent.save();
        console.log('✅ Student record created successfully');
        console.log(`   Student ID: ${studentId}`);
        console.log(`   Email: rahul@gmail.com`);
        console.log(`   Password: Rahul@123`);
        
        // Test login by verifying password
        const testUser = await User.findOne({ email: 'rahul@gmail.com' });
        const isPasswordMatch = await bcrypt.compare('Rahul@123', testUser.password);
        console.log('✅ Password verification test:', isPasswordMatch ? 'PASSED' : 'FAILED');
        
        console.log('\n🎉 User account created successfully!');
        console.log('📧 Login Credentials:');
        console.log('   Email: rahul@gmail.com');
        console.log('   Password: Rahul@123');
        console.log('\n🔐 User should now be able to login successfully!');
        
    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        if (error.code === 11000) {
            console.log('💡 User might already exist. Try running the test_login.js script again.');
        }
    } finally {
        mongoose.connection.close();
        console.log('\nDisconnected from MongoDB');
    }
}).catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
});
