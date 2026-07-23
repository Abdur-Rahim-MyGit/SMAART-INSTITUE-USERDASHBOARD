require('dotenv').config();
const mongoose = require('mongoose');
const College = require('../models/College');

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully.");
    
    const search = "srm";
    const limit = 20;
    
    let query = {};
    const searchLower = search.trim().toLowerCase();
    const escapedSearch = searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp('\\b' + escapedSearch, 'i');
    const prefixRegex = new RegExp('^' + escapedSearch, 'i');

    console.log("Running prefix query...");
    const prefixMatches = await College.find({
      ...query,
      $or: [
        { collegeName: prefixRegex },
        { collegeCode: prefixRegex }
      ]
    })
      .select('collegeName collegeCode address institutionType affiliation status logo')
      .sort({ collegeName: 1 })
      .limit(parseInt(limit));

    console.log("Prefix matches count:", prefixMatches.length);

    console.log("Running substring query...");
    const prefixIds = prefixMatches.map(c => c._id);
    const substringMatches = await College.find({
      ...query,
      _id: { $nin: prefixIds },
      $or: [
        { collegeName: searchRegex }
      ]
    })
      .select('collegeName collegeCode address institutionType affiliation status logo')
      .sort({ collegeName: 1 })
      .limit(parseInt(limit) - prefixMatches.length);

    console.log("Substring matches count:", substringMatches.length);
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await mongoose.disconnect();
  }
}
run();
