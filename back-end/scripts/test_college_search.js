// Script to test college search
const mongoose = require('mongoose');
require('dotenv').config();

const College = require('./models/College');

async function testSearch() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Test searches
    const searchTerms = ['SRM', 'srm', 'SRM College', 'chennai', ''];
    
    for (const search of searchTerms) {
      console.log(`\n--- Testing search: "${search}" ---`);
      
      let query = { status: { $regex: '^active$', $options: 'i' } };
      let colleges = [];
      
      if (search) {
        const searchLower = search.trim().toLowerCase();
        const escapedSearch = searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp('\\b' + escapedSearch, 'i');
        const prefixRegex = new RegExp('^' + escapedSearch, 'i');

        // 1. Fetch prefix matches first
        const prefixMatches = await College.find({
          ...query,
          $or: [
            { collegeName: prefixRegex },
            { collegeCode: prefixRegex }
          ]
        })
          .select('collegeName collegeCode address status')
          .sort({ collegeName: 1 })
          .limit(20);

        colleges = [...prefixMatches];

        // 2. If we need more results, fetch substring matches
        if (colleges.length < 20) {
          const remainingLimit = 20 - colleges.length;
          const prefixIds = prefixMatches.map(c => c._id);

          const substringMatches = await College.find({
            ...query,
            _id: { $nin: prefixIds },
            $or: [
              { collegeName: searchRegex }
            ]
          })
            .select('collegeName collegeCode address status')
            .sort({ collegeName: 1 })
            .limit(remainingLimit);

          colleges = [...colleges, ...substringMatches];
        }
      } else {
        colleges = await College.find(query)
          .select('collegeName collegeCode address status')
          .sort({ collegeName: 1 })
          .limit(20);
      }
      
      console.log(`Found ${colleges.length} colleges:`);
      colleges.forEach(c => console.log(`  - ${c.collegeName} (${c.collegeCode})`));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected');
  }
}

testSearch();
