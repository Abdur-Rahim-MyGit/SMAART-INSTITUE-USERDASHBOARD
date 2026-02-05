const axios = require('axios');

/**
 * Chatbot Service using Google AI Gemini API
 * This service handles AI-powered support conversations before escalating to tickets
 */

// Use Google AI directly if key is available, otherwise fall back to OpenRouter
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Google AI Gemini API endpoint
const GOOGLE_AI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-1.5-flash';

// System prompt with knowledge about SMAART Minds platform
const SYSTEM_PROMPT = `You are a helpful support assistant for SMAART Minds, an educational platform. Your role is to help users with common questions and guide them through the platform.

**Platform Features:**
- **Assessments**: T1 Baseline Assessment (measuring 6 key career readiness dimensions)
- **Courses**: Structured learning pathways with modules and days
- **Vision Boards**: Create and manage personal vision boards with images and text
- **Mind Care Sessions**: Interactive quiz-based mental wellness activities
- **Avatar System**: Personalized user avatars that evolve
- **Support Tickets**: For issues you cannot resolve

**Common Topics:**
1. **Account & Registration**: Help with login, password reset, profile completion
2. **Assessments**: How to take assessments, view results, understand scores
3. **Courses**: Enrolling in courses, accessing modules, tracking progress
4. **Vision Boards**: Creating boards, uploading images, editing text
5. **Technical Issues**: Browser compatibility, loading problems, errors
6. **Navigation**: Finding features, understanding the dashboard

**Guidelines:**
- Be friendly, concise, and helpful
- Provide step-by-step instructions when needed
- If you cannot help with a technical issue, suggest creating a support ticket
- Ask clarifying questions if the user's issue is unclear
- Keep responses under 150 words unless detailed steps are needed

**When to Escalate:**
- Technical errors you cannot diagnose
- Account access issues requiring admin intervention
- Billing or payment questions
- Feature requests or bug reports
- Complex issues requiring human support

If a user needs to create a ticket, tell them: "I recommend creating a support ticket so our team can help you directly. Click the 'Create Ticket' button below."`;

/**
 * Send a message to the chatbot and get a response
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @returns {Promise<Object>} - Bot response and updated conversation
 */
async function sendMessage(userMessage, conversationHistory = []) {
    try {
        console.log('🤖 Chatbot service called');
        console.log('Google AI Key present:', !!GOOGLE_AI_KEY);
        console.log('OpenRouter Key present:', !!OPENROUTER_API_KEY);

        // Use Google AI if available, otherwise OpenRouter
        if (GOOGLE_AI_KEY) {
            return await sendMessageGoogleAI(userMessage, conversationHistory);
        } else if (OPENROUTER_API_KEY) {
            return await sendMessageOpenRouter(userMessage, conversationHistory);
        } else {
            throw new Error('No API key configured. Please add GOOGLE_AI_API_KEY or OPENROUTER_API_KEY to .env');
        }
    } catch (error) {
        console.error('❌ Chatbot service error:', error.response?.data || error.message);
        console.error('Full error:', error);

        // Fallback response if API fails
        return {
            success: false,
            message: "I'm having trouble connecting right now. Please try again or create a support ticket for immediate assistance.",
            error: error.message,
            conversationHistory
        };
    }
}

/**
 * Send message using Google AI Gemini API directly
 */
async function sendMessageGoogleAI(userMessage, conversationHistory = []) {
    try {
        // Build conversation context
        let contextText = SYSTEM_PROMPT + '\n\n';
        conversationHistory.forEach(msg => {
            contextText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        contextText += `User: ${userMessage}\nAssistant:`;

        // Call Google AI Gemini API
        const response = await axios.post(
            `${GOOGLE_AI_URL}?key=${GOOGLE_AI_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: contextText
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const botMessage = response.data.candidates[0].content.parts[0].text;

        // Update conversation history
        const updatedHistory = [
            ...conversationHistory,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: botMessage }
        ];

        return {
            success: true,
            message: botMessage,
            conversationHistory: updatedHistory,
            provider: 'Google AI'
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Send message using OpenRouter API (fallback)
 */
async function sendMessageOpenRouter(userMessage, conversationHistory = []) {
    try {
        // Build messages array with system prompt and conversation history
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory,
            { role: 'user', content: userMessage }
        ];

        // Call OpenRouter API
        const response = await axios.post(
            OPENROUTER_API_URL,
            {
                model: MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:8080',
                    'X-Title': 'SMAART Minds Support Bot'
                }
            }
        );

        const botMessage = response.data.choices[0].message.content;

        // Update conversation history
        const updatedHistory = [
            ...conversationHistory,
            { role: 'user', content: userMessage },
            { role: 'assistant', content: botMessage }
        ];

        return {
            success: true,
            message: botMessage,
            conversationHistory: updatedHistory,
            usage: response.data.usage,
            provider: 'OpenRouter'
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Detect if the conversation should be escalated to a support ticket
 * @param {Array} conversationHistory - The conversation history
 * @returns {boolean} - Whether to suggest escalation
 */
function shouldEscalate(conversationHistory) {
    if (conversationHistory.length === 0) return false;

    // Check only the last user message for immediate escalation keywords
    const lastMessage = conversationHistory[conversationHistory.length - 1];

    // If last message is from bot, check the one before it (user's last message)
    const lastUserMessage = lastMessage.role === 'user'
        ? lastMessage
        : conversationHistory[conversationHistory.length - 2];

    if (!lastUserMessage) return false;

    const content = lastUserMessage.content.toLowerCase();

    const escalationKeywords = [
        'create a support ticket',
        'create a ticket',
        'submit a ticket',
        'file a ticket',
        'open a ticket',
        'raise a ticket',
        'talk to human',
        'speak to someone',
        'not helping',
        'still not working',
        'error persists',
        'admin',
        'urgent',
        'ticket'
    ];

    return escalationKeywords.some(keyword => content.includes(keyword));
}

module.exports = {
    sendMessage,
    shouldEscalate
};
