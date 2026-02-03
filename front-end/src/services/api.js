// API service for backend communication
// Dynamically detect API URL based on current hostname (for mobile/network access)
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  // If accessing from localhost, use localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  }
  // If accessing from network IP, use the same IP for backend
  return `http://${hostname}:5000/api`;
};

let API_BASE_URL = getApiBaseUrl();
let workingBaseUrl = sessionStorage.getItem("workingApiPort"); // Cache for the discovered working port

// Export for use in other files
export const getBackendUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return "http://localhost:5000";
  }
  return `http://${hostname}:5000`;
};

export { API_BASE_URL };

// Helper to get auth header
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const apiCall = async (endpoint, options = {}) => {
  const timeout = 30000; // 30 seconds timeout - increased to prevent "signal aborted" on slow operations like sending emails

  const performCall = async (baseUrl, customTimeout = timeout) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), customTimeout);

    try {
      const headers = {
        ...getAuthHeaders(),
        ...options.headers,
      };

      if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      console.log(`🚀 API Call: ${baseUrl}${endpoint} (Timeout: ${customTimeout}ms)`);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        credentials: 'include', // Enable Cookies for HttpOnly Auth
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(id);

      if (response.status === 401) {
        // Check if it's a "kicked out" scenario
        try {
          const errorBody = await response.clone().json();
          if (errorBody.message && (errorBody.message.includes("Session invalid") || errorBody.message.includes("logged out"))) {
            sessionStorage.setItem("kicked_out", "true");
          }
        } catch (e) {
          // Ignore parsing errors for 401
        }

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        // Use window.location to force redirect and UI reset
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/';
        }

        throw new Error("Unauthorized: Session expired");
      }

      const responseText = await response.text();
      let responseData = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response JSON:", responseText.slice(0, 100));
      }

      if (!response.ok) {
        const error = new Error(responseData.error || responseData.message || `API Error: ${response.status}`);
        error.data = responseData;
        error.status = response.status;
        throw error;
      }

      return responseData;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        console.warn(`⏱️ API Timeout (${customTimeout}ms): ${baseUrl}${endpoint}`);
        throw new Error(`Request timed out after ${customTimeout / 1000} seconds. Please check your connection.`);
      }
      throw error;
    }
  };

  try {
    const baseUrl = workingBaseUrl || API_BASE_URL;
    // For regular calls, use the full timeout
    const result = await performCall(baseUrl);

    // If successful and we didn't have a workingBaseUrl, cache it
    if (!workingBaseUrl && baseUrl !== API_BASE_URL) {
      workingBaseUrl = baseUrl;
      sessionStorage.setItem("workingApiPort", baseUrl);
    } else if (!workingBaseUrl && baseUrl === API_BASE_URL) {
      workingBaseUrl = API_BASE_URL;
      sessionStorage.setItem("workingApiPort", API_BASE_URL);
    }

    return result;
  } catch (error) {
    // If it's a network error or timeout, and we haven't confirmed a working port yet, try fallbacks
    const isNetworkError = error.message.includes('timed out') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('ERR_CONNECTION_REFUSED');

    if (isNetworkError && !workingBaseUrl) {
      console.warn("⚠️ API connection failed, searching for backend fallbacks...");

      const fallbacks = [
        API_BASE_URL.replace(":5000", ":5001"),
        API_BASE_URL.replace(":5000", ":50001")
      ];

      for (const fallbackUrl of fallbacks) {
        try {
          // Use a VERY short timeout for fallback discovery (2s)
          const result = await performCall(fallbackUrl, 2000);
          console.log(`✅ Backend discovered on ${fallbackUrl}`);
          workingBaseUrl = fallbackUrl;
          sessionStorage.setItem("workingApiPort", fallbackUrl);
          return result;
        } catch (err) {
          continue;
        }
      }
    }

    // If we already had a working port but it failed, or no fallbacks worked
    throw error;
  }
};

// Vision Board API Functions
export const visionBoardAPI = {
  // Create a new vision board
  create: async (formData) => {
    return apiCall('/visionBoards', {
      method: 'POST',
      body: formData,
    });
  },

  // Get all vision boards for a user
  getByUserId: async (userId) => {
    return apiCall(`/visionBoards?userId=${userId}`);
  },

  // Update custom layout for a vision board (including sticky note positions)
  updateLayout: async (id, layoutIndex, imageOrder, notePositions) => {
    const body = { layoutIndex, imageOrder };
    if (Array.isArray(notePositions)) {
      body.notePositions = notePositions;
    }
    return apiCall(`/visionBoards/${id}/layout`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // Delete a vision board
  delete: async (id) => {
    return apiCall(`/visionBoards/${id}`, {
      method: 'DELETE',
    });
  },
};

// Courses API Functions
export const coursesAPI = {
  // Get all courses
  getAll: async () => {
    return apiCall('/courses');
  },

  // Get course by code
  getByCode: async (courseCode) => {
    return apiCall(`/courses/code/${courseCode}`);
  },

  // Get course by ID
  getById: async (id) => {
    return apiCall(`/courses/${id}`);
  },

  // Get modules for a course
  getModules: async (courseId) => {
    return apiCall(`/courses/${courseId}/modules`);
  },
};

// Course Enrollment API Functions
export const courseEnrollmentAPI = {
  // Get enrollment by student and course
  getByStudentAndCourse: async (studentId, courseId) => {
    return apiCall(`/courseEnrollments?student=${studentId}&course=${courseId}`);
  },

  // Update task progress
  updateTaskProgress: async (data) => {
    return apiCall('/courseEnrollments/task-progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update video progress
  updateVideoProgress: async (data) => {
    return apiCall('/courseEnrollments/video-progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default apiCall;
