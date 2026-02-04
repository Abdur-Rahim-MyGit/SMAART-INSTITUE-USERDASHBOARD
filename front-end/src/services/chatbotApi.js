import { apiCall } from './api';

/**
 * Send a message to the chatbot
 * @param {string} message - User's message
 * @param {string} conversationId - Optional conversation ID
 * @param {string} token - Auth token (optional, defaults to sessionStorage)
 * @returns {Promise<Object>} - Bot response
 */
export const sendChatMessage = async (message, conversationId = null, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiCall('/chatbot/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, conversationId })
    });
};

/**
 * Get conversation history
 * @param {string} conversationId - Conversation ID
 * @param {string} token - Auth token (optional)
 * @returns {Promise<Object>} - Conversation history
 */
export const getConversation = async (conversationId, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiCall(`/chatbot/conversation/${conversationId}`, {
        headers
    });
};

/**
 * Escalate conversation to support ticket
 * @param {string} conversationId - Conversation ID
 * @param {string} additionalInfo - Additional information for the ticket
 * @param {string} token - Auth token (optional)
 * @returns {Promise<Object>} - Escalation result
 */
export const escalateToTicket = async (conversationId, additionalInfo, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiCall('/chatbot/escalate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversationId, additionalInfo })
    });
};

/**
 * Clear conversation history
 * @param {string} conversationId - Conversation ID
 * @param {string} token - Auth token (optional)
 * @returns {Promise<Object>} - Clear result
 */
export const clearConversation = async (conversationId, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return apiCall(`/chatbot/conversation/${conversationId}`, {
        method: 'DELETE',
        headers
    });
};
