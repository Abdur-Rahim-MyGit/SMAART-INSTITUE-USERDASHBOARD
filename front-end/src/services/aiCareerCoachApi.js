import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * AI Career Coach API Service
 * Handles all API calls for AI Career Coach features
 */

// Create axios instance with auth headers
const createAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    return {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };
};

const aiCareerCoachApi = {
    // Profile Management
    getProfile: async () => {
        const response = await axios.get(
            `${API_BASE_URL}/ai-career-coach/profile`,
            createAuthHeaders()
        );
        return response.data;
    },

    updateProfile: async (profileData) => {
        const response = await axios.put(
            `${API_BASE_URL}/ai-career-coach/profile`,
            profileData,
            createAuthHeaders()
        );
        return response.data;
    },

    analyzeProfile: async () => {
        const response = await axios.post(
            `${API_BASE_URL}/ai-career-coach/profile/analyze`,
            {},
            createAuthHeaders()
        );
        return response.data;
    },

    // Career Features
    getCareerRecommendations: async () => {
        const response = await axios.get(
            `${API_BASE_URL}/ai-career-coach/recommendations`,
            createAuthHeaders()
        );
        return response.data;
    },

    analyzeSkillGap: async (targetRole) => {
        const response = await axios.post(
            `${API_BASE_URL}/ai-career-coach/skill-gap`,
            { targetRole },
            createAuthHeaders()
        );
        return response.data;
    },

    generateLearningPlan: async (targetRole, timeframe = '6 months') => {
        const response = await axios.post(
            `${API_BASE_URL}/ai-career-coach/learning-plan`,
            { targetRole, timeframe },
            createAuthHeaders()
        );
        return response.data;
    },

    generateResume: async (targetRole) => {
        const response = await axios.post(
            `${API_BASE_URL}/ai-career-coach/resume`,
            { targetRole },
            createAuthHeaders()
        );
        return response.data;
    },

    // Chat Features
    sendChatMessage: async (message, sessionId = null) => {
        const response = await axios.post(
            `${API_BASE_URL}/ai-career-coach/chat`,
            { message, sessionId },
            createAuthHeaders()
        );
        return response.data;
    },

    getChatHistory: async (sessionId) => {
        const response = await axios.get(
            `${API_BASE_URL}/ai-career-coach/chat/${sessionId}`,
            createAuthHeaders()
        );
        return response.data;
    },

    getChatSessions: async () => {
        const response = await axios.get(
            `${API_BASE_URL}/ai-career-coach/chat/sessions`,
            createAuthHeaders()
        );
        return response.data;
    }
};

export default aiCareerCoachApi;
