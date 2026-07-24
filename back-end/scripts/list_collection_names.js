const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collection Names:');
    collections.sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
      console.log(c.name);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
