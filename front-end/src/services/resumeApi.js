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
    })
};

export default resumeApi;
