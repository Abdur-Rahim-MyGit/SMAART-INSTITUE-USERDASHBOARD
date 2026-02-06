const axios = require('axios');

const run = async () => {
    try {
        const badgeId = '6984430d9581368ec5b3b26f'; // Imran's badge ID
        console.log(`Testing verification for badge ID: ${badgeId}`);

        const response = await axios.get(`http://localhost:5000/api/users/verify-badge/${badgeId}`);

        console.log('\n--- API Response ---');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('\n✅ Verification API is working correctly!');
        } else {
            console.log('\n❌ Verification failed.');
        }

    } catch (err) {
        console.error('❌ API Error:', err.response ? err.response.data : err.message);
    }
};

run();
