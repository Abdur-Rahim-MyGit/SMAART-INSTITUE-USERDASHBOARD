const axios = require('axios');
const NodeCache = require('node-cache');

/**
 * AI Agent Service using OpenRouter API
 * Provides intelligent career coaching and analysis
 */
class AIAgent {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_BASE_URL;
        this.model = process.env.AI_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';

        // Cache TTL: 1 hour (3600 seconds) for standard queries
        this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5000',
                'X-Title': 'AI Career Coach'
            }
        });
    }

    /**
     * Core method to call OpenRouter API with Caching
     */
    async chat(messages, options = {}) {
        const maxRetries = 3;
        let lastError;

        // Create a unique cache key based on messages and model
        const cacheKey = JSON.stringify({ messages, model: this.model });

        // Return cached response if available (Skip network completely)
        const cachedResponse = this.cache.get(cacheKey);
        if (cachedResponse) {
            console.log('⚡ Serving from AI Cache');
            return cachedResponse;
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.client.post('/chat/completions', {
                    model: this.model,
                    messages: messages,
                    temperature: options.temperature || 0.7,
                    max_tokens: options.maxTokens || 2000,
                    top_p: options.topP || 0.9
                });

                const content = response.data.choices[0].message.content;
                this.cache.set(cacheKey, content);
                return content;

            } catch (error) {
                lastError = error;
                const status = error.response?.status;

                // Don't retry client errors (4xx) except 429 (Rate Limit)
                if (status && status >= 400 && status < 500 && status !== 429) {
                    break; // Exit loop and throw immediately
                }

                console.warn(`⚠️ AI Request Failed (Attempt ${attempt}/${maxRetries}):`, error.message);

                if (attempt < maxRetries) {
                    // Exponential backoff: 1s, 2s, 3s
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        const errorMessage = lastError.response?.data?.error?.message || lastError.message;
        console.error('❌ AI Agent Error:', errorMessage);
        throw new Error(`AI Provider Error: ${errorMessage}`);
    }

    /**
     * Analyze user profile and provide career insights
     */
    async analyzeProfile(profile) {
        // Extract target roles and interests for strict filtering
        const targetRoles = profile.careerGoals?.targetRoles || [];
        const targetIndustries = profile.careerGoals?.targetIndustries || [];
        const interests = profile.interests || [];
        const shortTermGoal = profile.careerGoals?.shortTerm || '';
        const longTermGoal = profile.careerGoals?.longTerm || '';

        const prompt = `You are an expert career coach. Analyze this profile and provide DOMAIN-SPECIFIC insights.
    
    IMPORTANT: The user has SPECIFIC career interests. Your analysis MUST be strictly relevant to these domains ONLY.
    
    User's Career Focus:
    - Target Roles: ${targetRoles.join(', ') || 'Not specified'}
    - Target Industries: ${targetIndustries.join(', ') || 'Not specified'}
    - Interests: ${interests.join(', ') || 'Not specified'}
    - Short-term Goal: ${shortTermGoal}
    - Long-term Goal: ${longTermGoal}
    
    Profile Details:
    - Education: ${JSON.stringify(profile.education)}
    - Experience: ${JSON.stringify(profile.experience)}
    - Skills: ${profile.skills.map(s => `${s.name} (${s.level}/10)`).join(', ')}
    
    CRITICAL INSTRUCTIONS:
    1. Analyze strengths and weaknesses ONLY in the context of their stated career goals.
    2. Provide a detailed Readiness Score Breakdown (Technical, Communication, Industry).
    3. If the user has 0 experience (Student/Fresher), focus analysis on their SKILLS, EDUCATION, and PROJECTS. Do not highlight "lack of experience" as a primary weakness unless it's for a Senior role.
    4. Explain the score clearly.
    5. Categorize recommended skills into "Must-Have" (Critical gaps) and "Nice-to-Have" (Bonus).
    
    Provide a JSON response with:
    {
      "summary": "A brief summary focused on their readiness for their TARGET ROLE (${shortTermGoal})",
      "careerStage": "student|junior|mid-level|senior|career-changer|upskilling",
      "readinessScore": 75,
      "readinessBreakdown": {
        "technical": 80,
        "communication": 70,
        "industry": 60
      },
      "scoreExplanation": "Why this score? What are the main drivers?",
      "strengths": [{"skill": "Skill Name", "evidence": "Why it helps", "score": 8}],
      "weaknesses": [{"skill": "Missing Skill", "severity": "critical|moderate", "recommendation": "Actionable advice"}],
      "topRoleMatches": [{"role": "Role Name", "matchScore": 85, "reasoning": "Why it matches"}],
      "resources": {
        "mustHave": ["Skill 1", "Skill 2"],
        "niceToHave": ["Skill 3", "Skill 4"]
      }
    }`;

        const messages = [
            { role: 'system', content: `You are a professional career coach. You MUST respect the user's stated career goals and ONLY provide analysis relevant to their target domain: ${targetRoles.join(', ')}. DO NOT suggest unrelated roles. Always respond with valid JSON.` },
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages);
        return this.parseJSON(response);
    }

    /**
     * Generate personalized learning plan
     */
    async generateLearningPlan(profile, targetRole) {
        const prompt = `Create a detailed 6-month learning plan for someone transitioning to: ${targetRole}

Current Profile:
- Skills: ${profile.skills.map(s => s.name).join(', ')}
- Experience: ${profile.experience.length} roles
- Career Stage: ${profile.careerStage || 'unknown'}

Provide a JSON response with:
{
  "plan": [
    {
      "month": 1,
      "focus": "...",
      "skills": ["..."],
      "courses": [{"title": "...", "platform": "...", "duration": "..."}],
      "projects": [{"title": "...", "description": "..."}],
      "milestones": ["..."]
    }
  ],
  "estimatedTimeToReady": "X months",
  "keyPriorities": ["..."]
}`;

        const messages = [
            { role: 'system', content: 'You are a learning path expert. Create practical, achievable plans. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages);
        return this.parseJSON(response);
    }

    /**
     * Skill gap analysis between user and target role
     */
    async analyzeSkillGap(userSkills, roleSkills) {
        const prompt = `Compare user skills vs required role skills and identify gaps.

User Skills: ${userSkills.map(s => `${s.name} (${s.level}/10)`).join(', ')}
Role Requirements: ${roleSkills.map(s => `${s.name} (importance: ${s.importance}/10)`).join(', ')}

Provide JSON:
{
  "overallMatch": 75,
  "strengths": [{"skill": "...", "userLevel": 8, "required": 7}],
  "gaps": [{"skill": "...", "userLevel": 3, "required": 8, "priority": "high|medium|low"}],
  "recommendations": ["..."]
}`;

        const messages = [
            { role: 'system', content: 'You are a skill assessment expert. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages);
        return this.parseJSON(response);
    }

    /**
     * Generate optimized resume content
     */
    async generateResumeContent(profile, targetRole) {
        try {
            const prompt = `Generate an executive-level, ATS-optimized resume structure for: ${targetRole}

Profile:
- Name: ${profile.user?.name || 'Candidate'}
- Experience: ${JSON.stringify(profile.experience)}
- Skills: ${profile.skills.map(s => s.name).join(', ')}
- Education: ${JSON.stringify(profile.education)}
- Projects: ${JSON.stringify(profile.progress?.projectsCompleted || [])}

INSTRUCTIONS:
1. SUMMARY: Write a powerful 3-4 line professional summary tailored specifically to ${targetRole}, emphasizing years of experience and key achievements.
2. EXPERIENCE: Rewrite experience bullets to be "Result-Oriented" starting with strong action verbs (e.g., "Deployed", "Optimized", "Led"). Quantify results where possible (e.g., "Improved performance by 20%").
3. SKILLS: Select the top 10-12 hard skills most relevant to ${targetRole}.
4. EDUCATION: Format education cleanly (e.g., "B.Tech in Computer Science" instead of just "Computer Science").

Provide strictly valid JSON:
{
  "summary": "Impactful summary...",
  "experienceBullets": [
    {
      "company": "Company Name",
      "role": "Role Title",
      "duration": "Date Range",
      "bullets": ["Actionable bullet 1", "Actionable bullet 2", "Actionable bullet 3"]
    }
  ],
  "skillsHighlight": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6", "Skill 7", "Skill 8"],
  "education": [
    {
       "degree": "Degree Name",
       "institution": "University Name",
       "year": "Year"
    }
  ],
  "keywords": ["ATS Keyword 1", "ATS Keyword 2"]
}`;

            const messages = [
                { role: 'system', content: 'You are a Senior Executive Resume Writer. You specialize in creating ATS-compliant, high-impact resumes. You NEVER return Markdown. you ALWAYS return raw JSON.' },
                { role: 'user', content: prompt }
            ];

            const response = await this.chat(messages);
            return this.parseJSON(response);

        } catch (error) {
            console.error("AI Resume Generation Failed, switching to Fallback Mode:", error.message);

            // Fallback: Construct high-quality resume from existing data
            return {
                summary: `Motivated and detail-oriented professional aspiring for ${targetRole} roles. possess a strong foundation in ${profile.skills.slice(0, 3).map(s => s.name).join(', ')} and a proven track record of applying technical skills to solve real-world problems. Eager to leverage academic background and hands-on experience to contribute effectively to organizational success.`,
                experienceBullets: (profile.experience || []).map(exp => ({
                    company: exp.company,
                    role: exp.role,
                    duration: exp.duration || "Present",
                    bullets: [
                        `Played a key role in ${exp.role} activities at ${exp.company}.`,
                        `Collaborated with cross-functional teams to deliver project milestones on time.`,
                        `Demonstrated strong problem-solving skills and technical proficiency in core technologies.`
                    ]
                })),
                skillsHighlight: (profile.skills || []).map(s => s.name).slice(0, 10),
                education: (profile.education || []).map(edu => ({
                    degree: edu.degree,
                    institution: edu.institution,
                    year: edu.endYear || "Present"
                })),
                keywords: ["Leadership", "Teamwork", "Problem Solving", "Strategic Planning", ...profile.skills.map(s => s.name)]
            };
        }
    }

    /**
     * Chat interface for conversational coaching
     */
    async coachChat(userMessage, context = {}) {
        const systemPrompt = `You are a professional AI Career Coach for SMAART Minds, an employability platform in India.

Context:
- Career Stage: ${context.careerStage || 'unknown'}
- Goals: ${context.goals || 'not specified'}

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

SMAART Minds Ecosystem (Integrate naturally):
- Recommend "Assessments" for self-discovery.
- Suggest "Skill Passport" for verifying skills.
- Mention "AI Resume Builder" for application readiness.

STRICT RULES:
- Never discuss technical implementation.
- Use **Bold** for emphasis but do not use complex markdown tables.
- Stay focused on career growth and employability.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ];

        return await this.chat(messages, { temperature: 0.8 });
    }

    /**
     * Recommend career paths based on profile
     */
    async recommendCareerPaths(profile, availableRoles) {
        // Extract user's specific career focus
        const targetRoles = profile.careerGoals?.targetRoles || [];
        const targetIndustries = profile.careerGoals?.targetIndustries || [];
        const interests = profile.interests || [];
        const shortTermGoal = profile.careerGoals?.shortTerm || '';
        const longTermGoal = profile.careerGoals?.longTerm || '';

        // Filter available roles to only those matching user's interests
        let relevantRoles = availableRoles;
        if (targetRoles.length > 0 || interests.length > 0) {
            const searchTerms = [...targetRoles, ...interests, shortTermGoal, longTermGoal]
                .filter(Boolean)
                .map(term => term.toLowerCase());

            relevantRoles = availableRoles.filter(role => {
                const roleText = `${role.title} ${role.category || ''} ${role.description || ''}`.toLowerCase();
                return searchTerms.some(term => roleText.includes(term.toLowerCase()));
            });

            // If no matches found, keep all roles but warn in prompt
            if (relevantRoles.length === 0) {
                relevantRoles = availableRoles;
            }
        }

        const prompt = `Recommend top 3 career paths for this profile.

CRITICAL: The user has SPECIFIC career goals. You MUST recommend roles that align with their stated interests ONLY.

User's Stated Career Focus:
- Target Roles: ${targetRoles.join(', ') || 'Not specified'}
- Target Industries: ${targetIndustries.join(', ') || 'Not specified'}
- Interests: ${interests.join(', ') || 'Not specified'}
- Short-term Goal: ${shortTermGoal}
- Long-term Goal: ${longTermGoal}

Profile Summary:
- Skills: ${profile.skills.map(s => `${s.name} (${s.level}/10)`).join(', ')}
- Experience Level: ${profile.experience?.length || 0} roles
- Education: ${profile.education?.map(e => `${e.degree} in ${e.fieldOfStudy}`).join(', ') || 'Not specified'}

Relevant Available Roles (filtered based on user interests): ${relevantRoles.map(r => r.title).join(', ')}

STRICT REQUIREMENTS:
1. Recommend ONLY roles that match the user's target: ${targetRoles.join(', ')}
2. If user wants "DevOps Engineer", recommend DevOps-related roles (DevOps Engineer, Site Reliability Engineer, Platform Engineer)
3. If user wants "Data Analyst", recommend Data-related roles (Data Analyst, Business Analyst, Data Scientist)
4. DO NOT recommend Business Analyst if they want DevOps, or vice versa
5. Match score should reflect how well their CURRENT skills align with their TARGET role
6. Timeline should be realistic based on skill gaps for their SPECIFIC target
7. Next steps must be actionable for achieving their STATED goal

Provide JSON:
{
  "recommendations": [
    {
      "role": "Must be relevant to: ${targetRoles.join(', ') || interests.join(', ')}",
      "matchScore": 85,
      "reasoning": "Explain match based on their skills vs requirements for ${shortTermGoal}",
      "timeline": "Realistic timeline to be job-ready for this specific role",
      "salaryRange": "e.g. ₹6L - ₹12L",
      "marketDemand": "High|Medium|Low",
      "activeJobsSearchUrl": "https://www.google.com/search?q=latest+jobs+for+${shortTermGoal}+in+India",
      "nextSteps": ["Specific actions for ${shortTermGoal}"]
    }
  ]
}`;

        const messages = [
            { role: 'system', content: `You are a career path advisor. You MUST strictly respect the user's stated career goals: ${targetRoles.join(', ')}. NEVER recommend roles outside their domain of interest. If they want DevOps, only suggest DevOps-related roles. If they want Data Analysis, only suggest Data-related roles. Be realistic and consider market demand within their chosen field. Always respond with valid JSON.` },
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages);
        return this.parseJSON(response);
    }

    /**
     * Calculate Career Readiness Score based on SMAART Minds logic
     */
    async calculateReadiness(profile, targetRole) {
        // Extract user's career goals for context
        const userTargetRoles = profile.careerGoals?.targetRoles || [];
        const shortTermGoal = profile.careerGoals?.shortTerm || targetRole;
        const interests = profile.interests || [];

        const prompt = `Calculate the Career Readiness Score (0-100) for this student targeting: ${targetRole}

IMPORTANT: This assessment is SPECIFICALLY for the role: "${targetRole}"
User's stated career goals: ${userTargetRoles.join(', ')}
User's interests: ${interests.join(', ')}

Profile:
- Skills: ${profile.skills.map(s => `${s.name} (${s.level}/10)`).join(', ')}
- Assessments: ${JSON.stringify(profile.assessments || {})}
- Experience: ${profile.experience.length} roles - ${JSON.stringify(profile.experience)}
- Projects: ${profile.progress?.projectsCompleted?.length || 0}
- Education: ${profile.education?.map(e => `${e.degree} in ${e.fieldOfStudy}`).join(', ') || 'Not specified'}

Scoring Criteria (SMAART Minds) - ALL relative to "${targetRole}":
- Skills Match (40%): How well do their skills align with "${targetRole}" requirements?
- Assessment Performance (30%): Cognitive and behavioral fit for "${targetRole}".
- Practical Experience (20%): Relevant projects and internships for "${targetRole}".
- Profile Completeness (10%): Quality of data provided.

CRITICAL INSTRUCTIONS:
1. Score based ONLY on readiness for "${targetRole}", not general career readiness
2. Skills match should compare their skills against what "${targetRole}" specifically requires
3. Experience should be evaluated for relevance to "${targetRole}"
4. IMPORTANT: If the user has 0 experience (likely a student/fresher), DO NOT penalize them heavily. Instead, shift the weight to Projects, Skills, and Education.
5. Next steps must be specific actions to become job-ready for "${targetRole}"
6. Be honest - if they lack critical skills for "${targetRole}", reflect that in the score

Provide JSON:
{
  "score": 75,
  "breakdown": {
    "skills": 30,
    "assessments": 25,
    "experience": 15,
    "completeness": 5
  },
  "feedback": "Specific feedback on readiness for ${targetRole}",
  "nextSteps": ["Specific action for ${targetRole}", "Another specific action for ${targetRole}"]
}`;

        const messages = [
            { role: 'system', content: `You are the SMAART Minds Scoring Engine. Be strict and data-driven. Evaluate ONLY for the specific role: "${targetRole}". DO NOT give generic career advice. Always respond with valid JSON.` },
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages);
        return this.parseJSON(response);
    }

    /**
     * Generate detailed role data for a specific job title
     */
    async generateRoleDetails(roleTitle) {
        const prompt = `Generate a detailed job role profile for: "${roleTitle}"
        
        Provide a JSON response strictly adhering to this schema:
        {
          "title": "${roleTitle}",
          "category": "Engineering|Design|Product|Data|Marketing|Sales|Other",
          "seniority": "mid",
          "description": "Detailed description of the role (2-3 paragraphs).",
          "requiredSkills": [
            {"name": "Skill1", "level": 8, "importance": 10, "category": "Technical"},
            {"name": "Skill2", "level": 7, "importance": 9, "category": "Technical"},
            {"name": "Skill3", "level": 6, "importance": 8, "category": "Soft Skill"}
          ],
          "salary": {
            "min": 500000,
            "max": 1500000,
            "currency": "INR",
            "period": "yearly"
          },
          "marketData": {
            "demand": "High|Medium|Low",
            "growth": "Expected growth percentage",
            "openings": 1000
          },
          "learningPath": [
            {
              "phase": "Foundation",
              "duration": "1-2 months",
              "skills": ["Skill1", "Skill2"],
              "resources": [{"type": "Course", "title": "Intro to...", "url": "https://example.com", "platform": "Coursera"}]
            }
          ],
          "relatedRoles": ["Role1", "Role2"],
          "careerProgression": {
            "previous": ["Junior Role"],
            "next": ["Senior Role"]
          }
        }
        
        Ensure the data is realistic for the Indian job market context.`;

        const messages = [
            { role: 'system', content: 'You are a job market expert. Generate detailed, realistic job role data. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages);
        return this.parseJSON(response);
    }

    /**
     * Generate personalized learning resources
     */
    async generatePersonalizedResources(profile) {
        // Extract user's specific career focus
        const targetRoles = profile.careerGoals?.targetRoles || [];
        const targetIndustries = profile.careerGoals?.targetIndustries || [];
        const interests = profile.interests || [];
        const shortTermGoal = profile.careerGoals?.shortTerm || '';
        const longTermGoal = profile.careerGoals?.longTerm || '';
        const skills = profile.skills ? profile.skills.map(s => `${s.name} (${s.level})`).join(', ') : 'None listed';
        const experience = profile.experience ? profile.experience.map(e => `${e.role} at ${e.company}`).join(', ') : 'No experience listed';

        const prompt = `You are the world's most advanced AI Career Coach. Your goal is to curate a LIVE, DYNAMIC learning path for a student.
    
    PROFILE ANALYSIS:
    - **Target**: ${targetRoles.join(', ')} in ${targetIndustries.join(', ')}
    - **Current Skills**: ${skills}
    - **Background**: ${experience}
    - **Interests**: ${interests.join(', ')}
    - **Immediate Goal**: ${shortTermGoal}
    
    YOUR MISSION:
    1. **Identify the "Critical Gap"**: What is the ONE thing stopping them from their goal right now?
    2. **Hyper-Personalize**: Do not give generic advice. If they know "React", do NOT suggest "React Basics". Suggest "Advanced Patterns" or "Next.js".
    3. **Real-Time Relevance**: Since you cannot browse the live web, generate **SMART SEARCH URLs** that will lead the user to the latest content.
    4. **Diverse Formats**: Mix video, reading, and hands-on coding.
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "courses": [
        // PROVIDE 3-4 ITEMS HERE
        {
          "title": "Precise Course Title (e.g. 'Advanced Kubernetes for Java Developers')",
          "platform": "Coursera / Udemy / Pluralsight",
          "url": "https://www.google.com/search?q=best+course+for+...", // Generate a smart search query URL
          "description": "DIRECT REASON: 'Because you know Java but lack Containerization skills needed for your target role...'",
          "difficulty": "Intermediate"
        }
      ],
      "articles": [
        // PROVIDE 3-4 ITEMS HERE
        {
          "title": "Trending Topic Title",
          "source": "Medium / Dev.to / Hashnode",
          "url": "https://www.google.com/search?q=latest+article+...",
          "summary": "Why this matters NOW for your career."
        }
      ],
      "videos": [
        // PROVIDE 3-4 ITEMS HERE
        {
          "title": "Specific Tutorial Title",
          "channel": "Top Tech Channel",
          "url": "https://www.youtube.com/results?search_query=...",
          "duration": "15-20 min"
        }
      ],
      "books": [
        // PROVIDE 2-3 ITEMS HERE
        {
          "title": "Definitive Guide Title",
          "author": "Author",
          "description": "The timeless concept this book teaches that you are missing."
        }
      ]
    }
    
    IMPORTANT: The 'url' fields MUST be search query URLs (Google, YouTube, etc.) that will dynamically find the content. This ensures the user always gets the LATEST results. GUARANTEE at least 3 items for courses, articles, and videos.`;

        const messages = [
            { role: 'system', content: `You are an elite AI Career Strategist. You ignore generic advice. You focus on high-impact, gap-closing resources. You ALWAYS return valid JSON.` },
            { role: 'user', content: prompt }
        ];

        const response = await this.chat(messages);
        return this.parseJSON(response);
    }

    /**
     * Parse JSON from AI response (handles markdown code blocks)
     */
    parseJSON(response) {
        try {
            let cleaned = response.trim();

            // Try to find JSON object within the text using regex
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleaned = jsonMatch[0];
            }

            return JSON.parse(cleaned);
        } catch (error) {
            console.error('JSON Parse Error:', error.message);
            console.error('Raw response:', response);
            // Return empty structure to prevent frontend crash
            return {
                courses: [],
                articles: [],
                videos: [],
                books: []
            };
        }
    }
}

module.exports = new AIAgent();
