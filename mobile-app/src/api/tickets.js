import { apiClient } from './client';

export const ticketsAPI = {
  createTicket: (data) => apiClient.post('/tickets', data).then((r) => r.data),
  getMyTickets: (params = {}) => apiClient.get('/tickets', { params }).then((r) => r.data),
  addResponse: (id, message) => apiClient.post(`/tickets/${id}/user-response`, { message }).then((r) => r.data),
};
