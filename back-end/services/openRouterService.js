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
        const systemPrompt = `You are an expert AI Career Coach for SMAART Institute. Analyze the user's detailed profile and provide a comprehensive report.

OUTPUT SECTIONS:
1. **Recommended Career Paths**: 2-3 specific roles that fit best. Explain why.
2. **Skill Gap Analysis**: Compare current skills vs required skills for the top role. List missing critical skills.
3. **Learning Path**: A structured roadmap to acquire missing skills.
4. **Jobs to Apply**: Types of companies and job titles to target immediately.

Format efficiently with clear Markdown headers.`;

        const userMessage = `Please analyze my professional profile:

Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills || 'Not specified')}
Experience: ${profile.experience || 'Not specified'}
Education: ${profile.education || 'Not specified'}
Projects: ${profile.projects || 'None'}
Certificates: ${profile.certificates || 'None'}
Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : (profile.interests || 'Not specified')}
Goals: ${profile.goals || 'Not specified'}`;

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
    async answerCareerQuestion(question, context = {}) {
        const systemPrompt = `You are an expert AI Career Coach for SMAART Institute (UK-based).

ABOUT SMAART INSTITUTE:
- **Core Purpose**: Integrated Employability & Impact Ecosystem for the changing world of work.
- **Founder**: Rehana Ameer.
- **Mission**: Bridge the gap between education and the modern workforce using sector-agnostic frameworks.
- **Key Frameworks**:
  1. **SMAART Integrated Capability Framework™**: Integrates Skills, Judgement, and Adaptability.
  2. **SMAART Career Architecture Map™**: Careers as a multi-stage continuum.
  3. **SMAART Capability & Skills Passport™**: Verifiable record of capability.
- **Programmes**: SMAART Campus to Career™, Professional & Technical Capability, Career to Life.
- **Values**: Systems Thinking, Measurable Impact, Adaptability, Accountability, Relevance, Trust.

RESPONSE RULES:
1. **Concise & Fast**: Answer in 1 concise paragraph (max 4-5 sentences).
2. **Strictly Professional**: IF the user asks about non-career topics (love, movies, life), DO NOT ANSWER. Instead, provide a witty redirection to career goals.
   - Example: "I'm an expert in Career Love, not romantic love! Let's focus on finding a job you'll love."
3. **SMAART Ecosystem**: Actively promote the frameworks and programmes above where relevant.
4. **No Fluff**: Get straight to the strategic advice. Use **Bold** for key terms.
5. **Greetings**: If the input is just a greeting ("Hi", "Hello"), respond with a warm, fast welcome.
   - Example: "Hello! I'm your SMAART AI Coach. Ready to accelerate your career? Tell me your target role!"

Focus: Indian Job Market, Skill Development, Career Growth.`;

        let userMessage = question;

        if (context.userProfile) {
            userMessage += `\n\nMy background: ${JSON.stringify(context.userProfile, null, 2)}`;
        }

        return this.chat([{ role: 'user', content: userMessage }], systemPrompt);
    }
}

module.exports = new OpenRouterService();
