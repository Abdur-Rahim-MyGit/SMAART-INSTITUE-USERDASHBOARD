const axios = require('axios');

const GOOGLE_AI_KEY = 'AIzaSyB6ele3hGRUsFfBiWPhheYivJqsKZfEjcM';
const GOOGLE_AI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function testGoogleAI() {
  try {
    console.log('Calling Google AI Gemini API directly...');
    const response = await axios.post(
      `${GOOGLE_AI_URL}?key=${GOOGLE_AI_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'Hello, respond with exactly the word "SUCCESS".'
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Status Code:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Google AI failed:', err.message);
    if (err.response) {
      console.error('Response Status:', err.response.status);
      console.error('Response Data:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

testGoogleAI();
