const User = require('./models/User');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.findOneAndUpdate(
    { email: "ramesh@gmail.com" },  // ← your actual email here
    { $set: { role: "moderator" } }
  );
  console.log("Done — user updated to moderator");
  mongoose.disconnect();
});