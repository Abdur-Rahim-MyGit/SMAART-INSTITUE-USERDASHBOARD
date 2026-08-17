import { apiClient } from './client';

export const placementsAPI = {
  getJobs: (params = {}) => apiClient.get('/placements/jobs', { params }).then(r => r.data),
  getJob: (source, id) => apiClient.get(`/placements/jobs/${encodeURIComponent(source)}/${encodeURIComponent(id)}`).then(r => r.data),
  getCompanies: () => apiClient.get('/placements/companies').then(r => r.data),
  hasApplied: (source, id) => apiClient.get('/placements/applications', { params: { job: id, jobSource: source } }).then(r => r.data),
  listApplications: (params = {}) => apiClient.get('/placements/applications', { params }).then(r => r.data),
  deleteApplication: (applicationId) => apiClient.delete(`/placements/applications/${encodeURIComponent(applicationId)}`).then(r => r.data),
  updateApplicationStatus: (applicationId, status, eSignature = null, declineReason = null) =>
    apiClient.post(`/placements/applications/${encodeURIComponent(applicationId)}/respond-offer`, { status, eSignature, declineReason }).then(r => r.data),
  applyJob: (source, id, payload) => {
    const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return apiClient.post(`/placements/jobs/${encodeURIComponent(source)}/${encodeURIComponent(id)}/apply`, payload, { headers }).then(r => r.data);
  },
  getSavedJobs: () => apiClient.get('/placements/saved-jobs').then(r => r.data),
  toggleSavedJob: (source, id) => apiClient.post('/placements/saved-jobs', { source, jobId: id }).then(r => r.data),
  getJobFairs: () => apiClient.get('/placements/job-fairs').then(r => r.data),
  getJobFair: (id) => apiClient.get(`/placements/job-fairs/${encodeURIComponent(id)}`).then(r => r.data),
  registerJobFair: (id) => apiClient.post(`/placements/job-fairs/${encodeURIComponent(id)}/register`).then(r => r.data),
  getJobFairPass: (id) => apiClient.get(`/placements/job-fairs/${encodeURIComponent(id)}/pass`).then(r => r.data),
};
