const axios = require('axios');

/**
 * Test AI Career Coach API
 * This script tests if the OpenRouter API is working correctly
 */

const API_BASE_URL = 'http://localhost:5000/api';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'mistralai/devstral-2512:free';

async function testOpenRouterDirectly() {
    console.log('\n🧪 Testing OpenRouter API directly...\n');

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: AI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful career coach.'
                    },
                    {
                        role: 'user',
                        content: 'Hello! Can you help me with my career?'
                    }
                ],
                temperature: 0.7,
                max_tokens: 200
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:5173',
                    'X-Title': 'SMAART Minds AI Career Coach Test'
                }
            }
        );

        console.log('✅ OpenRouter API is working!');
        console.log('\n📝 Response:');
        console.log(response.data.choices[0].message.content);
        console.log('\n💰 Usage:');
        console.log(JSON.stringify(response.data.usage, null, 2));
        return true;
    } catch (error) {
        console.error('❌ OpenRouter API Error:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.error?.message || error.message);
        console.error('Full Error:', JSON.stringify(error.response?.data, null, 2));
        return false;
    }
}

async function testHealthEndpoint() {
    console.log('\n🧪 Testing server health endpoint...\n');

    try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Server is running!');
        console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Server health check failed:');
        console.error(error.message);
        return false;
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('🚀 AI CAREER COACH API TEST');
    console.log('='.repeat(60));

    console.log('\n📋 Configuration:');
    console.log('API Key:', OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 20)}...` : '❌ NOT SET');
    console.log('AI Model:', AI_MODEL);
    console.log('API Base URL:', API_BASE_URL);

    // Test 1: Server Health
    const healthOk = await testHealthEndpoint();

    if (!healthOk) {
        console.log('\n❌ Server is not running. Please start the backend server first.');
        process.exit(1);
    }

    // Test 2: OpenRouter API
    const openRouterOk = await testOpenRouterDirectly();

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    console.log('Server Health:', healthOk ? '✅ PASS' : '❌ FAIL');
    console.log('OpenRouter API:', openRouterOk ? '✅ PASS' : '❌ FAIL');
    console.log('='.repeat(60));

    if (healthOk && openRouterOk) {
        console.log('\n🎉 All tests passed! AI Career Coach is ready to use!');
        console.log('\n📝 Next steps:');
        console.log('1. Go to: http://localhost:8080/dashboard/smaart-toolkit');
        console.log('2. Click "AI Career Chat"');
        console.log('3. Start chatting with the AI!');
    } else {
        console.log('\n❌ Some tests failed. Please check the errors above.');

        if (!openRouterOk) {
            console.log('\n💡 Troubleshooting:');
            console.log('1. Check if OPENROUTER_API_KEY is set in .env');
            console.log('2. Verify the API key is valid at https://openrouter.ai/keys');
            console.log('3. Check your internet connection');
            console.log('4. Try a different AI model');
        }
    }

    console.log('\n');
}

// Run tests
runTests().catch(error => {
    console.error('\n❌ Test execution failed:');
    console.error(error);
    process.exit(1);
});
