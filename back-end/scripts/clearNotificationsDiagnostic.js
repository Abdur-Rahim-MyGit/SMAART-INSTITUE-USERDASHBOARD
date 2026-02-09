const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function clear() {
    console.log('1. Starting script...');
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in environment');
        process.exit(1);
    }
    console.log('2. URI found, connecting...');

    const client = new MongoClient(uri, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000
    });

    try {
        await client.connect();
        console.log('3. Connected successfully');

        const db = client.db('minds');
        const userId = '691c4a243408254901245d8d';

        console.log(`4. Deleting notifications for user: ${userId}...`);
        const result = await db.collection('notifications').deleteMany({
            userId: new ObjectId(userId)
        });

        console.log(`5. Result: Deleted ${result.deletedCount} notifications.`);
    } catch (err) {
        console.error('❌ Error during execution:', err);
    } finally {
        console.log('6. Closing connection...');
        await client.close();
        console.log('7. Done.');
        process.exit(0);
    }
}

clear();
