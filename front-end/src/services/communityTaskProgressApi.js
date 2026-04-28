import { apiCall } from './api';

const API_ENDPOINT = '/community-tasks-progress';

/**
 * Fetch the user's community task progress
 * @returns {Promise<Object>} Map of completed tasks
 */
export const getCommunityTaskProgress = async () => {
    return apiCall(API_ENDPOINT, {
        method: 'GET'
    });
};

/**
 * Update the user's community task progress
 * @param {Object} completedTasks Map of completed tasks { "task1": true }
 * @returns {Promise<Object>} Updated map of completed tasks
 */
export const updateCommunityTaskProgress = async (completedTasks) => {
    return apiCall(API_ENDPOINT, {
        method: 'PUT',
        body: JSON.stringify({ completedTasks })
    });
};
