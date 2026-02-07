/**
 * Vision Board API Service
 * Handles all API calls for the Vision Board Creator module
 */

// Dynamic API URL based on hostname for mobile/network access
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Get user ID from session storage
 */
const getUserId = () => {
  try {
    let userData = sessionStorage.getItem("user");
    if (!userData) {
      userData = null;
    }
    if (userData) {
      const user = JSON.parse(userData);
      return user._id || user.id;
    }
  } catch (e) {
    console.error("Error getting user ID:", e);
  }
  return null;
};

/**
 * Create a new vision board
 */
export const createVisionBoard = async (data) => {
  const userId = getUserId();
  if (!userId) throw new Error("User not authenticated");

  const response = await fetch(`${API_BASE_URL}/vision-board`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, userId }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to create vision board");
  }
  return result;
};

/**
 * Get all vision boards for the current user
 */
export const getAllVisionBoards = async () => {
  const userId = getUserId();
  if (!userId) throw new Error("User not authenticated");

  const response = await fetch(`${API_BASE_URL}/vision-board?userId=${userId}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch vision boards");
  }
  return result;
};

/**
 * Get a single vision board by ID
 */
export const getVisionBoard = async (id) => {
  const response = await fetch(`${API_BASE_URL}/vision-board/${id}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to fetch vision board");
  }
  return result;
};

/**
 * Update a vision board
 */
export const updateVisionBoard = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/vision-board/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to update vision board");
  }
  return result;
};

/**
 * Delete a vision board
 */
export const deleteVisionBoard = async (id) => {
  const response = await fetch(`${API_BASE_URL}/vision-board/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to delete vision board");
  }
  return result;
};

/**
 * Duplicate a vision board
 */
export const duplicateVisionBoard = async (id) => {
  const response = await fetch(`${API_BASE_URL}/vision-board/${id}/duplicate`, {
    method: "POST",
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to duplicate vision board");
  }
  return result;
};

export default {
  createVisionBoard,
  getAllVisionBoards,
  getVisionBoard,
  updateVisionBoard,
  deleteVisionBoard,
  duplicateVisionBoard,
  getUserId,
};
