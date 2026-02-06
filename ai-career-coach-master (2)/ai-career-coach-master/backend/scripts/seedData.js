require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const rolesData = require('../data/roles.json');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing roles
        await Role.deleteMany({});
        console.log('🗑️  Cleared existing roles');

        // Insert new roles
        await Role.insertMany(rolesData);
        console.log(`✅ Inserted ${rolesData.length} roles`);

        console.log('🎉 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed Error:', error.message);
        process.exit(1);
    }
};

seedData();
