import { apiClient } from './client';

export const getColleges = () => apiClient.get('/colleges').then((r) => r.data);
