// Ticket API service for support ticketing system
import { apiCall } from './api';

/**
 * Create a new support ticket
 * @param {Object} ticketData - Ticket data (title, description, category, priority)
 * @param {File[]} files - Optional file attachments
 */
export const createTicket = async (ticketData, files = []) => {
  const formData = new FormData();

  // Append ticket data
  Object.keys(ticketData).forEach(key => {
    formData.append(key, ticketData[key]);
  });

  // Append files
  files.forEach(file => {
    formData.append('attachments', file);
  });

  return apiCall('/tickets', {
    method: 'POST',
    body: formData
    // Content-Type header will be automatically omitted by apiCall for FormData
  });
};

/**
 * Get tickets for the authenticated user
 * @param {Object} filters - Optional filters (status, priority, category, page, limit)
 */
export const getMyTickets = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  });

  const queryString = params.toString();
  return apiCall(`/tickets${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a specific ticket by ID
 * @param {string} ticketId - Ticket ID (MongoDB ObjectId)
 */
export const getTicketById = async (ticketId) => {
  return apiCall(`/tickets/${ticketId}`);
};

/**
 * Get all tickets (Admin only)
 * @param {Object} filters - Optional filters (status, priority, category, search, page, limit)
 */
export const getAllTickets = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  });

  const queryString = params.toString();
  return apiCall(`/tickets/all${queryString ? `?${queryString}` : ''}`);
};

/**
 * Update a ticket (Admin only)
 * @param {string} ticketId - Ticket ID
 * @param {Object} updates - Updates (status, response)
 */
export const updateTicket = async (ticketId, updates) => {
  return apiCall(`/tickets/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
};

/**
 * Add a response to a ticket (Admin only)
 * @param {string} ticketId - Ticket ID
 * @param {string} message - Response message
 */
export const addTicketResponse = async (ticketId, message) => {
  return apiCall(`/tickets/${ticketId}/response`, {
    method: 'POST',
    body: JSON.stringify({ message })
  });
};

/**
 * Delete a ticket (Admin only)
 * @param {string} ticketId - Ticket ID
 */
export const deleteTicket = async (ticketId) => {
  return apiCall(`/tickets/${ticketId}`, {
    method: 'DELETE'
  });
};

/**
 * Get ticket statistics (Admin only)
 */
export const getTicketStats = async () => {
  return apiCall('/tickets/stats/summary');
};

export default {
  createTicket,
  getMyTickets,
  getTicketById,
  getAllTickets,
  updateTicket,
  addTicketResponse,
  deleteTicket,
  getTicketStats
};
