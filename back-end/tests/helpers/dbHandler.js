const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to the in-memory database.
 */
const connect = async () => {
    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        console.warn('MongoMemoryServer fallback to local test DB:', err.message);
        const fallbackUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smaart_integration_test';
        await mongoose.connect(fallbackUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
};

/**
 * Drop database, close the connection and stop mongod.
 */
const closeDatabase = async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.dropDatabase();
            await mongoose.connection.close();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    } catch (err) {
        console.error('Error closing test database:', err.message);
    }
};

/**
 * Remove all data for all collections.
 */
const clearDatabase = async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    }
};

module.exports = {
    connect,
    closeDatabase,
    clearDatabase,
};
