const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('./models/Role');
const roles = require('./data/roles_india.json');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing roles
        await Role.deleteMany();
        console.log('Roles cleared');

        // Insert new roles
        await Role.insertMany(roles);
        console.log('Roles seeded successfully');

        process.exit();
    } catch (error) {
        console.error('Error seeding roles:', error);
        process.exit(1);
    }
};

seedRoles();
