import { apiCall } from './api';

export const groupsAPI = {
    // Create a new group
    createGroup: async (data) => {
        return apiCall('/groups/student', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Get my groups
    getMyGroups: async () => {
        return apiCall('/groups/my');
    },

    // Get group details
    getGroup: async (id) => {
        return apiCall(`/groups/${id}`);
    },

    // Add member
    addMember: async (groupId, studentId) => {
        return apiCall(`/groups/${groupId}/members`, {
            method: 'POST',
            body: JSON.stringify({ studentId })
        });
    },

    // Leave group
    leaveGroup: async (groupId) => {
        return apiCall(`/groups/${groupId}/members`, {
            method: 'DELETE'
        });
    },

    sendMessage: async (groupId, content, image, video, poll) => {
        return apiCall(`/groups/${groupId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content, image, video, poll })
        });
    },

    // Vote in poll
    voteInPoll: async (groupId, messageId, optionIndex) => {
        return apiCall(`/groups/${groupId}/messages/${messageId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ optionIndex })
        });
    },

    // Search students
    searchStudents: async (query) => {
        return apiCall(`/groups/search/students?query=${encodeURIComponent(query)}`);
    },

    // Remove member (admin only)
    removeMember: async (groupId, memberId) => {
        return apiCall(`/groups/${groupId}/members/${memberId}`, {
            method: 'DELETE'
        });
    },

    // Promote to admin (admin only)
    promoteToAdmin: async (groupId, memberId) => {
        return apiCall(`/groups/${groupId}/admins/${memberId}`, {
            method: 'POST'
        });
    },

    // Demote from admin (admin only)
    demoteFromAdmin: async (groupId, memberId) => {
        return apiCall(`/groups/${groupId}/admins/${memberId}`, {
            method: 'DELETE'
        });
    },

    // Share community post to group
    sharePostToGroup: async (groupId, postData) => {
        return apiCall(`/groups/${groupId}/share-post`, {
            method: 'POST',
            body: JSON.stringify({ postData })
        });
    },

    // Channel management
    createChannel: async (groupId, channelData) => {
        return apiCall(`/groups/${groupId}/channels`, {
            method: 'POST',
            body: JSON.stringify(channelData)
        });
    },

    getChannels: async (groupId) => {
        return apiCall(`/groups/${groupId}/channels`);
    },

    updateChannel: async (groupId, channelId, channelData) => {
        return apiCall(`/groups/${groupId}/channels/${channelId}`, {
            method: 'PUT',
            body: JSON.stringify(channelData)
        });
    },

    deleteChannel: async (groupId, channelId) => {
        return apiCall(`/groups/${groupId}/channels/${channelId}`, {
            method: 'DELETE'
        });
    },

    // Pinned messages
    pinMessage: async (groupId, messageId) => {
        return apiCall(`/groups/${groupId}/messages/${messageId}/pin`, {
            method: 'POST'
        });
    },

    unpinMessage: async (groupId, messageId) => {
        return apiCall(`/groups/${groupId}/messages/${messageId}/pin`, {
            method: 'POST'
        });
    },

    // Message reactions
    addReaction: async (groupId, messageId, emoji) => {
        return apiCall(`/groups/${groupId}/messages/${messageId}/react`, {
            method: 'POST',
            body: JSON.stringify({ emoji })
        });
    },

    removeReaction: async (groupId, messageId, emoji) => {
        return apiCall(`/groups/${groupId}/messages/${messageId}/react`, {
            method: 'DELETE',
            body: JSON.stringify({ emoji })
        });
    }
};
