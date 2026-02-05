const axios = require('axios');

const run = async () => {
    try {
        const email = 'naifbasha50@gmail.com';
        const url = `http://localhost:5000/api/users/register-details/${email}`;
        console.log(`Calling API: ${url}`);

        const response = await axios.get(url);
        const data = response.data;

        console.log('\n--- API Response Data ---');
        console.log(`FullName: ${data.fullName}`);
        console.log(`Email: ${data.email}`);
        console.log(`Badges: ${JSON.stringify(data.badges || 'MISSING')}`);

        if (data.badges && data.badges.length > 0) {
            console.log('\nFirst Badge Details:');
            console.log(JSON.stringify(data.badges[0], null, 2));
        }

    } catch (err) {
        console.error('API Call Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
};

run();
