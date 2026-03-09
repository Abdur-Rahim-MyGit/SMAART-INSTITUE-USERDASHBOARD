import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const careerGuideApi = {
    generateReport: async (data) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/career-guide/generate`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
            throw error.response?.data || { error: 'Failed to generate career guide' };
        }
    },

    getReports: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/career-guide/reports`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to fetch reports' };
        }
    },

    getLatestReport: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/career-guide/latest`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to fetch latest report' };
        }
    }
};

export default careerGuideApi;
