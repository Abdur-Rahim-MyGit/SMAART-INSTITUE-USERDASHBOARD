const axios = require('axios');

/**
 * OpenRouter AI Service
 * Handles all AI interactions using OpenRouter API
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';

class OpenRouterService {
    /**
     * Send a chat message to AI
     */
    async chat(messages, systemPrompt = null) {
        try {
            console.log('🔑 OpenRouter API Key:', OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 20)}...` : 'NOT SET');
            console.log('🤖 AI Model:', AI_MODEL);

            const formattedMessages = [];

            // Add system prompt if provided
            const isGoogleModel = AI_MODEL.includes('google');

            if (systemPrompt && !isGoogleModel) {
                formattedMessages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            // Add conversation messages
            messages.forEach((msg, index) => {
                let content = msg.content;

                // For Google models, prepend system prompt to the first message
                if (index === 0 && systemPrompt && isGoogleModel) {
                    content = `System Instructions: ${systemPrompt}\n\n${content}`;
                }

                formattedMessages.push({
                    role: msg.role || 'user',
                    content: content
                });
            });

            console.log('📤 Sending request to OpenRouter (Axios)...');

            const requestBody = {
                model: AI_MODEL,
                messages: formattedMessages,
            };

            // Only add parameters if supported by model (Llama supports them, Google might not)
            // For safety with unknown models, we can omit them or be conservative
            if (!AI_MODEL.includes('google')) {
                requestBody.temperature = 0.7;
                requestBody.max_tokens = 2000;
            }

            const response = await axios.post(
                OPENROUTER_API_URL,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://smaartminds.com',
                        'X-Title': 'SMAART Minds Career Coach'
                    },
                    timeout: 30000
                }
            );

            console.log('✅ OpenRouter API response received');

            return {
                success: true,
                message: response.data.choices[0].message.content,
                usage: response.data.usage
            };
        } catch (error) {
            console.error('❌ OpenRouter API Error:', error.response?.data || error.message);
            console.error('Status:', error.response?.status);
            console.error('Full error:', JSON.stringify(error.response?.data, null, 2));
            return {
                success: false,
                error: error.response?.data?.error?.message || 'AI service temporarily unavailable'
            };
        }
    }

    /**
     * Analyze user profile
     */
    async analyzeProfile(profile) {
        const systemPrompt = `You are an expert AI Career Coach. Your task is to analyze the user's professional profile based STRICTLY on the provided data.

INPUT DATA:
- Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || 'None')}
- Experience: ${profile.experience || 'None'}
- Education: ${profile.education || 'None'}
- Projects: ${profile.projects || 'None'}
- Certificates: ${profile.certificates || 'None'}
- Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : (profile.interests || 'None')}
- Goals: ${profile.goals || 'None'}

ANALYSIS RULES:
1. **No Hallucinations**: Do NOT invent skills, experience, or degrees that are not listed.
2. **Infer from Context**: If explicit skills are missing, infer them *only* from the Education and Projects listed.
3. **Focus on Quality**: Even if data is sparse (e.g., only Education), provide high-quality advice relevant to that specific field (e.g., specific advice for a ${profile.education} student).

OUTPUT SECTIONS:
1. **Profile Summary**: A 2-sentence summary of where they stand currently.
2. **Recommended Career Paths**: 2-3 specific roles that fit their *actual* background. Explain why based on their specific education/goals.
3. **Skill Gap Analysis**: Compare their *current* (or inferred) skills vs required skills for the top role.
4. **Learning Path**: A structured roadmap to acquire missing skills.
5. **Immediate Actions**: 3 concrete steps to take now.

Format efficiently with clear Markdown headers.`;

        const userMessage = `Please analyze my professional profile based on the data provided above.`;

        return this.chat([{ role: 'user', content: userMessage }], systemPrompt);
    }

    /**
     * Get career recommendations
     */
    async getCareerRecommendations(profile, preferences = {}) {
        const systemPrompt = `You are a career guidance expert. Based on the user's profile, recommend 3-5 specific career paths. For each path, include:
1. Job title
2. Why it's a good fit (2-3 sentences)
3. Key skills needed
4. Typical salary range
5. Growth potential

Be realistic and consider the user's current level.`;

        const userMessage = `Based on my profile, recommend career paths:

Current Skills: ${profile.skills?.join(', ') || 'Beginner'}
Experience Level: ${profile.experienceLevel || 'Entry Level'}
Interests: ${profile.interests?.join(', ') || 'General'}
Preferred Industry: ${preferences.industry || 'Open to all'}
Work Style: ${preferences.workStyle || 'Flexible'}`;

        return this.chat([{ role: 'user', content: userMessage }], systemPrompt);
    }

    /**
     * Analyze skill gap for target role
     */
    async analyzeSkillGap(currentSkills, targetRole) {
        const systemPrompt = `You are a skills assessment expert. Compare the user's current skills with requirements for their target role. Provide:
1. Skills they already have (matching)
2. Skills they need to develop (gaps)
3. Priority order for learning
4. Estimated time to acquire each skill
5. Recommended learning resources

Be specific and actionable.`;

        const userMessage = `I want to become a ${targetRole}.

My current skills: ${currentSkills?.join(', ') || 'None listed'}

What skills do I need to develop?`;

        return this.chat([{ role: 'user', content: userMessage }], systemPrompt);
    }

    /**
     * Generate learning plan
     */
    async generateLearningPlan(targetRole, currentLevel, timeframe = '6 months') {
        const systemPrompt = `You are a learning path designer. Create a detailed ${timeframe} learning plan to help the user achieve their career goal. Include:
1. Monthly breakdown of topics to learn
2. Specific courses/resources for each topic
3. Hands-on projects to build
4. Milestones and checkpoints
5. Time commitment per week

Make it realistic and achievable.`;

        const userMessage = `Create a ${timeframe} learning plan for me:

Target Role: ${targetRole}
Current Level: ${currentLevel}
Available Time: 10-15 hours per week

Please provide a structured roadmap.`;

        return this.chat([{ role: 'user', content: userMessage }], systemPrompt);
    }

    /**
     * Generate resume content
     */
    async generateResume(profile, targetRole) {
        const systemPrompt = `You are a professional resume writer. Create ATS-optimized resume content for the target role. Include:
1. Professional summary (3-4 sentences)
2. Key skills section
3. Work experience descriptions (using action verbs and metrics)
4. Achievement highlights
5. Keywords for ATS optimization

Format professionally and focus on impact.`;

        const userMessage = `Create resume content for ${targetRole}:

My Background:
- Skills: ${profile.skills?.join(', ') || 'To be added'}
- Experience: ${profile.experience || 'To be added'}
- Education: ${profile.education || 'To be added'}
- Achievements: ${profile.achievements || 'To be added'}

Please generate professional resume sections.`;

        return this.chat([{ role: 'user', content: userMessage }], systemPrompt);
    }

    /**
     * Answer career questions
     */
    async answerCareerQuestion(question, context = {}, history = []) {
        const systemPrompt = `You are a professional AI Career Coach for SMAART Minds, an employability platform in India.

Context:
- Name: ${context.userProfile?.name || 'User'}
- Education: ${context.userProfile?.education || 'unknown'}
- Current Role: ${context.userProfile?.currentRole || 'Student/Job Seeker'}
- Career Stage: ${context.userProfile?.experienceLevel || 'unknown'}
- Goals: ${context.userProfile?.goals || 'not specified'}

RESPONSE GUIDELINES:
1. **Be an Executive Career Strategist**: Do not just give generic advice. Give high-level, strategic insights suitable for ambitious professionals.
2. **Structure Your Answer**:
   - **Strategy**: Start with a high-level strategic viewpoint.
   - **Tactics**: Provide specific, numbered steps the user can take immediately.
   - **Market Context**: Mention relevant trends (especially Indian job market).
3. **Format for Readability**:
   - Use **Bold** for key terms and emphasis.
   - Use bullet points (•) and numbered lists (1, 2, 3) for readability.
   - Keep paragraphs short and punchy.
4. **Tone**: Empowerment, Clarity, Professionalism.

SMAART Minds Ecosystem (Integrate naturally when relevant):
- Recommend "Assessments" for self-discovery.
- Suggest "Skill Passport" for verifying skills.
- Mention "AI Resume Builder" for application readiness.

STRICT RULES:
- Never discuss technical implementation.
- Use **Bold** for emphasis but do not use complex markdown tables.
- Stay focused on career growth and employability.
- Be specific with resources, timelines, and action steps.
- Provide concrete examples and real-world insights.`;

        let userMessage = question;

        if (context.userProfile && history.length === 0) {
            userMessage += `\n\nMy background: ${JSON.stringify(context.userProfile, null, 2)}`;
        }

        // Combine history with new user message
        const messages = [
            ...history,
            { role: 'user', content: userMessage }
        ];

        return this.chat(messages, systemPrompt);
    }
}

module.exports = new OpenRouterService();
