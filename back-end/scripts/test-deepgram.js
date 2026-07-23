const fetch = require('node-fetch') || global.fetch; // just in case

async function testDeepgram() {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (!deepgramApiKey) { console.error('Set DEEPGRAM_API_KEY in the environment first.'); return; }
    const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
    
    console.log('Testing Deepgram with URL:', videoUrl);
    
    try {
        const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&utterances=true', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${deepgramApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: videoUrl })
        });
        
        const data = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testDeepgram();
