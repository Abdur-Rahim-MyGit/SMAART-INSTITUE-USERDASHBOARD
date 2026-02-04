/**
 * Vision Board Pro API Service
 * Stores ONE merged collage image per vision board
 * Maximum 3 vision boards per user
 */

import { apiCall as globalApiCall } from "@/services/api";

// Cache for fetched user ID to avoid repeated API calls
let cachedUserId = null;

// Function to reset the cached user ID (call when user logs in/out)
export const resetUserIdCache = () => {
  cachedUserId = null;
  console.log('[VisionBoardProApi] User ID cache cleared');
};

// Helper to get user ID - fetches from backend if missing
const getUserId = async () => {
  try {
    // Return cached ID if available
    if (cachedUserId) {
      return cachedUserId;
    }

    // Try sessionStorage first, then localStorage
    let userStr = sessionStorage.getItem("user");
    let source = 'sessionStorage';

    if (!userStr || userStr === '{}' || userStr === 'undefined') {
      userStr = localStorage.getItem("user");
      source = 'localStorage';
    }

    if (!userStr || userStr === '{}' || userStr === 'undefined' || userStr === 'null') {
      console.log('[VisionBoardProApi] No user found in storage');
      return null;
    }

    const user = JSON.parse(userStr);
    let userId = user._id || user.id || null;

    if (userId) {
      console.log('[VisionBoardProApi] Found userId:', userId, 'from', source);
      cachedUserId = userId;
      return userId;
    }

    // If no ID but we have email, fetch real ID from backend
    if (user.email && !userId) {
      console.warn('[VisionBoardProApi] User session missing ID - fetching from backend by email');

      try {
        const data = await globalApiCall(`/students/by-email/${encodeURIComponent(user.email)}`);

        if (data.success && data.data && data.data._id) {
          userId = data.data._id;
          console.log('[VisionBoardProApi] Fetched real userId from backend:', userId);

          // Update the user object with the real ID
          user.id = userId;
          sessionStorage.setItem("user", JSON.stringify(user));
          cachedUserId = userId;

          return userId;
        }
      } catch (fetchError) {
        console.error('[VisionBoardProApi] Failed to fetch user ID from backend:', fetchError);
      }
    }

    return null;
  } catch (e) {
    console.error('[VisionBoardProApi] Error parsing user from storage:', e);
    return null;
  }
};

// Helper for API calls
const apiCall = async (endpoint, options = {}) => {
  const userId = await getUserId();

  // Validate userId exists - this is expected when user isn't logged in
  if (!userId) {
    console.log('[VisionBoardProApi] No userId found, storage:', {
      session: sessionStorage.getItem("user"),
      local: localStorage.getItem("user")
    });
    throw new Error("User not authenticated. Please log in to access vision boards.");
  }

  // Add userId as query parameter for all VisionBoardPro calls
  const separator = endpoint.includes("?") ? "&" : "?";
  const processedEndpoint = `/vision-board-pro${endpoint}${separator}userId=${userId}`;

  // Add userId to body for POST/PUT requests
  if (options.body && (options.method === "POST" || options.method === "PUT")) {
    try {
      const body = JSON.parse(options.body);
      body.userId = userId;
      options.body = JSON.stringify(body);
    } catch (e) {
      // If body is not JSON (e.g. FormData, though unlikely here), skips
    }
  }

  return globalApiCall(processedEndpoint, options);
};

/**
 * Create a new vision board
 */
export const createVisionBoard = async (boardData) => {
  return apiCall("/", {
    method: "POST",
    body: JSON.stringify(boardData),
  });
};

/**
 * Get all vision boards
 */
export const getAllVisionBoards = async () => {
  return apiCall("/");
};

/**
 * Get user's vision board count and limit status
 */
export const getBoardCount = async () => {
  return apiCall("/count");
};

/**
 * Get a single vision board
 */
export const getVisionBoard = async (id) => {
  return apiCall(`/${id}`);
};

/**
 * Update a vision board
 */
export const updateVisionBoard = async (id, boardData) => {
  return apiCall(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(boardData),
  });
};

/**
 * Delete a vision board
 */
export const deleteVisionBoard = async (id) => {
  return apiCall(`/${id}`, {
    method: "DELETE",
  });
};

/**
 * Duplicate a vision board
 */
export const duplicateVisionBoard = async (id) => {
  return apiCall(`/${id}/duplicate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
};

/**
 * Get the currently active vision board for dashboard display
 */
export const getActiveVision = async () => {
  return apiCall("/active");
};

/**
 * Set a vision board as the active vision for dashboard display
 */
export const setActiveVision = async (boardId) => {
  return apiCall(`/active/${boardId}`, {
    method: "PUT",
    body: JSON.stringify({}),
  });
};

/**
 * Clear the active vision board
 */
export const clearActiveVision = async () => {
  return apiCall("/active", {
    method: "DELETE",
  });
};
