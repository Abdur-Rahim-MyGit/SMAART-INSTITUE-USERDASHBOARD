const mongoose = require('mongoose');
require('dotenv').config();

// Ensure both models are registered
require('../models/Counter');
const College = require('../models/College');

const sampleColleges = [
  {
    collegeName: "SRM Institute of Science and Technology",
    collegeCode: "SRMIST",
    institutionType: "University",
    email: "admin@srmist.edu.in",
    contactNumber: "04427455510",
    registrationNumber: "SRM-REG-12345",
    accreditationStatus: "Both",
    status: "Active",
    address: {
      street: "SRM Nagar, Kattankulathur",
      city: "Kanchipuram",
      state: "Tamil Nadu",
      pincode: "603203",
      country: "India"
    }
  },
  {
    collegeName: "SRM Institute of Science and Technology, Ramapuram",
    collegeCode: "SRMRMP",
    institutionType: "University",
    email: "admin.rmp@srmist.edu.in",
    contactNumber: "04443923040",
    registrationNumber: "SRM-RMP-REG-67890",
    accreditationStatus: "NAAC",
    status: "Active",
    address: {
      street: "Bharathi Salai, Ramapuram",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600089",
      country: "India"
    }
  },
  {
    collegeName: "Vellore Institute of Technology",
    collegeCode: "VIT",
    institutionType: "University",
    email: "admin@vit.ac.in",
    contactNumber: "04162243091",
    registrationNumber: "VIT-REG-54321",
    accreditationStatus: "Both",
    status: "Active",
    address: {
      street: "Katpadi Road",
      city: "Vellore",
      state: "Tamil Nadu",
      pincode: "632014",
      country: "India"
    }
  },
  {
    collegeName: "Indian Institute of Technology, Madras",
    collegeCode: "IITM",
    institutionType: "University",
    email: "admin@iitm.ac.in",
    contactNumber: "04422578000",
    registrationNumber: "IITM-REG-09876",
    accreditationStatus: "Both",
    status: "Active",
    address: {
      street: "Sardar Patel Road",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600036",
      country: "India"
    }
  }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds';
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    // Check if colleges already exist
    const count = await College.countDocuments({});
    if (count > 0) {
      console.log(`Database already has ${count} colleges. Skipping seeding.`);
      return;
    }

    console.log('Seeding sample colleges...');
    // We save each document to trigger the pre-save hook for collegeCode logic
    for (const collegeData of sampleColleges) {
      const college = new College(collegeData);
      await college.save();
      console.log(`seeded: ${college.collegeName} (${college.collegeCode})`);
    }

    console.log('Successfully seeded all sample colleges!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seed();
