const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/users/_debug_dump/vumakumar@gmail.com');
        const json = await res.json();
        console.log(JSON.stringify(json.registration.workExperience, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();
