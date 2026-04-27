// Clear require cache to force reload .env
delete require.cache[require.resolve('dotenv')];
require('dotenv').config({ override: true });

const axios = require('axios');

console.log('🧪 Testing OpenRouter API with NEW configuration...\n');
console.log('API Key:', process.env.OPENROUTER_API_KEY ? `${process.env.OPENROUTER_API_KEY.substring(0, 30)}...` : 'NOT SET ❌');
console.log('Model:', process.env.AI_MODEL);
console.log('');

async function testAPI() {
    try {
        console.log('📡 Sending request to OpenRouter...\n');

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: process.env.AI_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: 'Say "Hello! I am your AI Career Coach and I am working perfectly!" in one sentence.'
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://smaartminds.com',
                    'X-Title': 'SMAART Minds Career Coach'
                },
                timeout: 30000
            }
        );

        console.log('✅ SUCCESS! AI Career Coach is working!\n');
        console.log('🤖 AI Response:');
        console.log('━'.repeat(60));
        console.log(response.data.choices[0].message.content);
        console.log('━'.repeat(60));
        console.log('\n📊 Usage Stats:');
        console.log(JSON.stringify(response.data.usage, null, 2));
        console.log('\n🎉 AI Career Coach is READY TO USE!');
        console.log('\n🚀 Next Steps:');
        console.log('1. Go to: http://localhost:8080/dashboard/smaart-toolkit');
        console.log('2. Click "AI Career Chat"');
        console.log('3. Start chatting with your AI Career Coach!');

    } catch (error) {
        console.log('❌ ERROR!\n');
        if (error.response) {
            console.log('Status Code:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('\n📋 Error Details:');
            console.log(JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('⚠️  No response received from server');
            console.log('Error:', error.message);
        } else {
            console.log('Error:', error.message);
        }

        console.log('\n💡 Troubleshooting:');
        console.log('1. Check if the API key is valid at https://openrouter.ai/keys');
        console.log('2. Verify you have credits/quota available');
        console.log('3. Try a different model');
        console.log('4. Check your internet connection');

        process.exit(1);
    }
}

testAPI();
