import { apiCall } from './api';

export const getTasks = async (params) => {
    try {
        let queryString = '';
        if (params && Object.keys(params).length > 0) {
            queryString = '?' + new URLSearchParams(params).toString();
        }
        // apiCall returns the parsed JSON response body directly
        return await apiCall(`/tasks${queryString}`, { method: 'GET' });
    } catch (err) {
        console.error("Error fetching tasks:", err);
        throw err;
    }
};

export const createTask = async (taskData) => {
    try {
        return await apiCall('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    } catch (err) {
        console.error("Error creating task:", err);
        throw err;
    }
};

export const updateTask = async (id, taskData) => {
    try {
        return await apiCall(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    } catch (err) {
        console.error("Error updating task:", err);
        throw err;
    }
};

export const deleteTask = async (id) => {
    try {
        return await apiCall(`/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
        console.error("Error deleting task:", err);
        throw err;
    }
};
