import { apiClient } from './client';

export const grievancesAPI = {
  createGrievance: (data) => apiClient.post('/grievances', data).then((r) => r.data),
  getMyGrievances: () => apiClient.get('/grievances').then((r) => r.data),
  respond: (id, message) => apiClient.post(`/grievances/${id}/respond`, { message }).then((r) => r.data),
};
