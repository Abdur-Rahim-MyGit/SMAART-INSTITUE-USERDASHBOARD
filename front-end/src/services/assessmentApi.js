import { apiCall } from './api';

export const assessmentApi = {
    /**
     * Get assessment by description
     * @param {string} description - Description to search for (e.g., "big 5")
     * @returns {Promise} Assessment data
     */
    getByDescription: async (description) => {
        return apiCall(`/assessments/by-description/${encodeURIComponent(description)}`);
    },

    /**
     * Get assessment by code
     * @param {string} code - Assessment code (e.g., "ASM00001")
     * @returns {Promise} Assessment data
     */
    getByCode: async (code) => {
        return apiCall(`/assessments/code/${code}`);
    },

    /**
     * Check if user has completed an assessment
     * @param {string} code - Assessment code (e.g., "ASM00001")
     * @returns {Promise} Assessment completion status
     */
    checkAssessmentStatus: async (code) => {
        return apiCall(`/assessments/code/${code}/status`);
    },

    /**
     * Start a new assessment attempt
     * @param {string} assessmentId - Assessment ID
     * @param {string} userId - User ID
     * @returns {Promise} Shuffled questions and result ID
     */
    startAssessment: async (assessmentId, userId) => {
        return apiCall(`/results/assessment/${assessmentId}/start?userId=${userId}`);
    },

    /**
     * Save individual answer (real-time)
     * @param {string} resultId - Result document ID
     * @param {string} questionId - Question ID
     * @param {number} selectedValue - Selected value (1-5)
     * @param {string} questionText - Question text (optional)
     * @returns {Promise} Save confirmation
     */
    saveAnswer: async (resultId, questionId, selectedValue, questionText = '') => {
        return apiCall(`/results/${resultId}/answer`, {
            method: 'POST',
            body: JSON.stringify({
                questionId,
                selectedValue,
                questionText
            }),
        });
    },

    /**
     * Submit completed assessment
     * @param {string} resultId - Result document ID
     * @returns {Promise} Final results with scores
     */
    submitAssessment: async (resultId) => {
        return apiCall(`/results/${resultId}/submit`, {
            method: 'POST',
        });
    },

    /**
     * Get all results for a user
     * @param {string} userId - User ID
     * @param {string} status - Optional status filter ('in-progress', 'completed', 'abandoned')
     * @returns {Promise} List of user results
     */
    getUserResults: async (userId, status = null) => {
        const url = status
            ? `/results/user/${userId}?status=${status}`
            : `/results/user/${userId}`;
        return apiCall(url);
    },

    /**
     * Get specific result details
     * @param {string} resultId - Result document ID
     * @returns {Promise} Result details
     */
    getResult: async (resultId) => {
        return apiCall(`/results/${resultId}`);
    },

    /**
     * Get Big Five results for a user
     * @param {string} userId - User ID
     * @returns {Promise} Big Five results
     */
    getBig5Results: async (userId) => {
        return apiCall(`/big5results/user/${userId}`);
    },

    /**
     * Get VAK results for a user
     * @param {string} userId - User ID
     * @returns {Promise} VAK results
     */
    getVAKResults: async (userId) => {
        return apiCall(`/vakresults/user/${userId}`);
    },

    /**
     * Get EQ results for a user
     * @param {string} userId - User ID
     * @returns {Promise} EQ results
     */
    getEQResults: async (userId) => {
        return apiCall(`/eqresults/user/${userId}`);
    },

    /**
     * Get CQ results for a user
     * @param {string} userId - User ID
     * @returns {Promise} CQ results
     */
    getCQResults: async (userId) => {
        return apiCall(`/cqresults/user/${userId}`);
    },

    /**
     * Get ARQ results for a user
     * @param {string} userId - User ID
     * @returns {Promise} ARQ results
     */
    getARQResults: async (userId) => {
        return apiCall(`/arqresults/${userId}`);
    },

    /**
     * Get AIQ results for a user
     * @param {string} userId - User ID
     * @returns {Promise} AIQ results
     */
    getAIQResults: async (userId) => {
        return apiCall(`/aiqresults/user/${userId}`);
    },

    /**
     * Get SQ results for a user
     * @param {string} userId - User ID
     * @returns {Promise} SQ results
     */
    getSQResults: async (userId) => {
        return apiCall(`/sqresults/user/${userId}`);
    },

    /**
     * Get Base Line results for a user
     * @param {string} userId - User ID
     * @returns {Promise} Base Line results
     */
    getBaseLineResults: async (userId) => {
        return apiCall(`/baselineresults/user/${userId}`);
    },
};
