import { apiCall } from './api';

/**
 * Create a new grievance
 * @param {Object} grievanceData - Grievance data (title, description, category, isAnonymous)
 * @param {File[]} files - Optional file attachments
 */
export const createGrievance = async (grievanceData, files = []) => {
  const formData = new FormData();

  // Append data
  Object.keys(grievanceData).forEach(key => {
    formData.append(key, grievanceData[key]);
  });

  // Append files
  files.forEach(file => {
    formData.append('attachments', file);
  });

  return apiCall('/grievances', {
    method: 'POST',
    body: formData
  });
};

/**
 * Get grievances for the logged-in student
 */
export const getMyGrievances = async () => {
  return apiCall('/grievances');
};

/**
 * Get details of a specific grievance by ID
 * @param {string} id - Grievance ID
 */
export const getGrievanceById = async (id) => {
  return apiCall(`/grievances/${id}`);
};

/**
 * Respond to a grievance
 * @param {string} id - Grievance ID
 * @param {string} message - Reply content
 */
export const addGrievanceResponse = async (id, message) => {
  return apiCall(`/grievances/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ message })
  });
};

export default {
  createGrievance,
  getMyGrievances,
  getGrievanceById,
  addGrievanceResponse
};
