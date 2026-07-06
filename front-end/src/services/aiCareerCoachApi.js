import { apiCall } from './api';

/**
 * AI Career Coach API Service
 * Uses the same apiCall utility as the rest of the app for consistent auth handling.
 */
const aiCareerCoachApi = {

    // Profile Management
    getProfile: () => apiCall('/ai-career-coach/profile', { method: 'GET' }),

    updateProfile: (profileData) => apiCall('/ai-career-coach/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    }),

    analyzeProfile: () => apiCall('/ai-career-coach/profile/analyze', {
        method: 'POST',
        body: JSON.stringify({})
    }),

    // Career Features
    getCareerRecommendations: () => apiCall('/ai-career-coach/recommendations', { method: 'GET' }),

    analyzeSkillGap: (targetRole) => apiCall('/ai-career-coach/skill-gap', {
        method: 'POST',
        body: JSON.stringify({ targetRole })
    }),

    generateLearningPlan: (targetRole, timeframe = '6 months') => apiCall('/ai-career-coach/learning-plan', {
        method: 'POST',
        body: JSON.stringify({ targetRole, timeframe })
    }),

    generateResume: (targetRole) => apiCall('/ai-career-coach/resume', {
        method: 'POST',
        body: JSON.stringify({ targetRole })
    }),

    generateSummary: (resumeData, targetRole) => apiCall('/ai-career-coach/generate-summary', {
        method: 'POST',
        body: JSON.stringify({ resumeData, targetRole })
    }),

    // Chat Features
    sendChatMessage: (message, sessionId = null) => apiCall('/ai-career-coach/chat', {
        method: 'POST',
        body: JSON.stringify({ message, sessionId })
    }),

    getChatHistory: (sessionId) => apiCall(`/ai-career-coach/chat/${sessionId}`, { method: 'GET' }),

    getChatSessions: () => apiCall('/ai-career-coach/chat/sessions', { method: 'GET' }),
};

export default aiCareerCoachApi;
