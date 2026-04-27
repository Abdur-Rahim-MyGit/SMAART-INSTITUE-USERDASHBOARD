const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/smaart-dashboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('MongoDB Connected');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Also try to find any document in likely user collections
    const collectionsToCheck = ['users', 'students', 'User', 'Student'];
    for (const colName of collectionsToCheck) {
        try {
            const count = await mongoose.connection.db.collection(colName).countDocuments();
            console.log(`${colName} count: ${count}`);
            if (count > 0) {
                const doc = await mongoose.connection.db.collection(colName).findOne();
                console.log(`Sample document from ${colName}:`, doc);
            }
        } catch (e) {
            console.log(`Error checking ${colName}: ${e.message}`);
        }
    }

    mongoose.disconnect();
}).catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
});
