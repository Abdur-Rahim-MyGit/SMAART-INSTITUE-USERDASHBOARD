const http = require('http');

http.get('http://localhost:5000/api/users/register-details/dharsini882@gmail.com', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Work experience in API response:', json.workExperience);
      console.log('Career goals in API response:', json.careerGoals);
      console.log('Personal dev goals in API response:', json.personalDevelopmentGoals);
    } catch (e) {
      console.error('Parse error:', e, data);
    }
  });
}).on('error', (err) => {
  console.error('HTTP error:', err.message);
});
