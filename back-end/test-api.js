require('dotenv').config({ path: './back-end/.env' });
const http = require('http');

const optionsGet = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/community-tasks-progress',
  method: 'GET',
  headers: {
    'x-admin-bypass': 'true',
    'x-admin-secret': process.env.ADMIN_SYSTEM_SECRET || ''
  }
};

const reqGet = http.request(optionsGet, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('GET STATUS:', res.statusCode);
    console.log('GET BODY:', data);

    // Now test PUT
    const putData = JSON.stringify({
      completedTasks: { "connect-1": true, "connect-2": true }
    });

    const optionsPut = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/community-tasks-progress',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(putData),
        'x-admin-bypass': 'true',
        'x-admin-secret': process.env.ADMIN_SYSTEM_SECRET || ''
      }
    };

    const reqPut = http.request(optionsPut, (resPut) => {
      let putDataRes = '';
      resPut.on('data', chunk => putDataRes += chunk);
      resPut.on('end', () => {
        console.log('PUT STATUS:', resPut.statusCode);
        console.log('PUT BODY:', putDataRes);
      });
    });

    reqPut.on('error', console.error);
    reqPut.write(putData);
    reqPut.end();
  });
});

reqGet.on('error', console.error);
reqGet.end();
