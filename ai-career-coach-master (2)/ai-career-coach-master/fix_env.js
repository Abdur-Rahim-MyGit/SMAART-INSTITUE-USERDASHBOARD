const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Fix the invalid model name
    if (content.includes('gemini-2.5-flash')) {
        console.log('Found invalid model: gemini-2.5-flash. Fixing...');
        content = content.replace(/gemini-2.5-flash/g, 'gemini-flash-1.5');
    } else if (!content.includes('AI_MODEL')) {
        console.log('AI_MODEL not found. Adding default...');
        content += '\nAI_MODEL=google/gemini-flash-1.5';
    }

    // Ensure OpenRouter URL is correct
    if (!content.includes('OPENROUTER_BASE_URL')) {
        content += '\nOPENROUTER_BASE_URL=https://openrouter.ai/api/v1';
    }

    // Write back
    fs.writeFileSync(envPath, content);
    console.log('Updated .env file successfully.');

} catch (err) {
    console.error('Failed to update .env:', err);
}
