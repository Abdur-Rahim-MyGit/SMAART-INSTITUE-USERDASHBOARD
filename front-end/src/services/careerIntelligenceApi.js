import apiCall from './api';

/**
 * Career Intelligence API Service
 * Part of SMAART Toolkit - Career Data Fetcher
 * Integrates with REAL Excel databases + AI Engine
 * Note: apiCall already prepends /api, so endpoints start without /api
 */

const careerIntelligenceApi = {
    // Generate a new career intelligence report
    generateReport: (careerInput) =>
        apiCall('/career-intelligence/generate', {
            method: 'POST',
            body: JSON.stringify(careerInput),
            timeout: 150000, // 2.5 min — Excel loading + AI generation takes time
        }),

    // Get all reports for current user
    getReports: () =>
        apiCall('/career-intelligence/reports'),

    // Get latest completed report
    getLatestReport: () =>
        apiCall('/career-intelligence/latest'),

    // Get specific report by ID
    getReportById: (id) =>
        apiCall(`/career-intelligence/reports/${id}`),

    // Delete a report
    deleteReport: (id) =>
        apiCall(`/career-intelligence/reports/${id}`, {
            method: 'DELETE',
        }),

    // Get structured Excel data (sectors, roles, job families)
    getExcelData: () =>
        apiCall('/career-intelligence/excel-data'),

    // Admin: Force refresh Excel cache
    refreshExcelCache: () =>
        apiCall('/career-intelligence/refresh-cache', {
            method: 'POST',
        }),
};

export default careerIntelligenceApi;
