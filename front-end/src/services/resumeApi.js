import { apiCall } from './api';

const resumeApi = {
    // Create new resume
    createResume: (resumeData) => apiCall('/resumes', {
        method: 'POST',
        body: JSON.stringify(resumeData)
    }),

    // Get all resumes for user
    getMyResumes: () => apiCall('/resumes', { 
        method: 'GET' 
    }),

    // Get single resume
    getResumeById: (id) => apiCall(`/resumes/${id}`, { 
        method: 'GET' 
    }),

    // Update resume
    updateResume: (id, resumeData) => apiCall(`/resumes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(resumeData)
    }),

    // Delete resume
    deleteResume: (id) => apiCall(`/resumes/${id}`, { 
        method: 'DELETE' 
    }),

    // Duplicate a resume (server-side copy)
    duplicateResume: (id) => apiCall(`/resumes/${id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({}),
    }),

    // Register secure export (rate limited server-side)
    issueExport: (id) => apiCall(`/resumes/${id}/export`, {
        method: 'POST',
        body: JSON.stringify({}),
    }),

    // Public verification lookup
    verifyResume: (resumePublicId, fingerprint) => {
        const query = fingerprint ? `?h=${encodeURIComponent(fingerprint)}` : '';
        return apiCall(`/resumes/verify/${encodeURIComponent(resumePublicId)}${query}`, {
            method: 'GET',
        });
    },
};

export default resumeApi;
