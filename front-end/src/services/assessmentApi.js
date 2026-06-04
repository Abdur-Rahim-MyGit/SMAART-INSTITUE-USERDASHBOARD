import { apiCall } from './api';

export const assessmentApi = {
    /**
     * Get all assessments
     * @returns {Promise} List of assessments
     */
    getAll: async () => {
        return apiCall('/assessments');
    },

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
     * @returns {Promise} Shuffled questions, result ID, and session token
     */
    startAssessment: async (assessmentId) => {
        return apiCall(`/results/assessment/${assessmentId}/start`);
    },

    /**
     * Reset an assessment attempt (Development only)
     * @param {string} resultId - Result ID to reset
     * @returns {Promise} Confirmation
     */
    resetAssessment: async (resultId) => {
        return apiCall(`/results/${resultId}/reset`, {
            method: 'POST'
        });
    },

    /**
     * Save individual answer (real-time)
     * @param {string} resultId - Result document ID
     * @param {string} questionId - Question ID
     * @param {string} selectedValue - Selected value
     * @param {string} questionText - Question text (optional)
     * @param {string} token - Assessment session token
     * @returns {Promise} Save confirmation
     */
    saveAnswer: async (resultId, questionId, selectedValue, questionText = '', token = null) => {
        const headers = token ? { 'x-assessment-token': token } : {};
        return apiCall(`/results/${resultId}/answer`, {
            method: 'POST',
            headers,
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
     * @param {string} token - Assessment session token
     * @returns {Promise} Final results with scores
     */
    submitAssessment: async (resultId, token = null, options = {}) => {
        const headers = token ? { 'x-assessment-token': token } : {};
        return apiCall(`/results/${resultId}/submit`, {
            method: 'POST',
            headers,
            body: JSON.stringify(options)
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
     * Get Base Line results for a user (Legacy T1)
     * @param {string} userId - User ID
     * @returns {Promise} Base Line results
     */
    getBaseLineResults: async (userId) => {
        return apiCall(`/baselineresults/user/${userId}`);
    },

    /**
     * Get all stage results for a user (T1-T4)
     * @param {string} userId - User ID
     * @returns {Promise} Map of stage -> result data
     */
    getStageResults: async (userId) => {
        return apiCall(`/stageresults/user/${userId}`);
    },

    /**
     * Get stage result for a specific stage
     * @param {string} userId - User ID
     * @param {string} stage - Stage key: 'T1', 'T2', 'T3', 'T4'
     * @returns {Promise} Stage result data
     */
    getStageResult: async (userId, stage) => {
        return apiCall(`/stageresults/user/${userId}/stage/${stage}`);
    },

    /**
     * Get completion status for all stages
     * @param {string} userId - User ID
     * @returns {Promise} Status map per stage
     */
    getStageStatus: async (userId) => {
        return apiCall(`/stageresults/user/${userId}/status`);
    },

    /**
     * Reset all stage results for a user (T1-T4)
     * @param {string} userId - User ID
     * @returns {Promise} Confirmation
     */
    resetAllStages: async (userId) => {
        return apiCall(`/stageresults/reset/${userId}/ALL`, {
            method: 'DELETE'
        });
    },
};
