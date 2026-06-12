const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { getCalendarEvents } = require('./controllers/analyticsController');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || "mongodb://souban:souban123@ac-3hctxon-shard-00-00.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-01.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-02.bkxwjdl.mongodb.net:27017/?ssl=true&replicaSet=atlas-taxso3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('MongoDB Connected');
    
    // mock req and res
    const req = {
        user: { role: 'student', college: '64d2b27f2c41234567890abc', id: '64d2b27f2c41234567890def' }
    };
    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            console.log(JSON.stringify(data, null, 2));
            process.exit(0);
        }
    };
    
    await getCalendarEvents(req, res);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
