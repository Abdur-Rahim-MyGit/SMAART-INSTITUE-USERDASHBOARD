const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const SupportTicket = mongoose.model('SupportTicket', new mongoose.Schema({}, { strict: false, collection: 'support' }));

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const tickets = await SupportTicket.find({ attachments: { $exists: true, $not: { $size: 0 } } });
    console.log(`Found ${tickets.length} tickets with attachments:`);
    tickets.forEach(t => {
      console.log(`\nTicket ID: ${t.ticketId}`);
      console.log(`Title/Subject: ${t.title || t.subject}`);
      console.log(`UserModel: ${t.userModel}`);
      console.log(`Attachments:`, JSON.stringify(t.attachments, null, 2));
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
