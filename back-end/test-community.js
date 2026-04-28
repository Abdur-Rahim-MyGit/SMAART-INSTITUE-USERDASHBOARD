const mongoose = require('mongoose');
require('dotenv').config();

const CommunityTaskProgress = require('./models/CommunityTaskProgress');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB.");
        
        // Mock a user ID
        const mockUserId = new mongoose.Types.ObjectId();
        
        // Try creating
        let progress = await CommunityTaskProgress.create({
            user: mockUserId,
            completedTasks: { "test-1": true }
        });
        console.log("Created:", progress);
        
        // Try updating
        progress = await CommunityTaskProgress.findOneAndUpdate(
            { user: mockUserId },
            { $set: { completedTasks: { "test-1": true, "test-2": false } } },
            { new: true, upsert: true }
        );
        console.log("Updated:", progress);
        
        // Cleanup
        await CommunityTaskProgress.deleteOne({ user: mockUserId });
        console.log("Cleaned up.");
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await mongoose.disconnect();
    }
}

test();
