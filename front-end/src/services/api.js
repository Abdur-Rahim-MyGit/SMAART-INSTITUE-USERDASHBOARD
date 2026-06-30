// API service for backend communication
// Dynamically detect API URL based on current hostname (for mobile/network access)
import { clearAssessmentTimerStorage } from '@/utils/assessmentTimerStorage';

const getApiBaseUrl = () => {
  // If an API base is configured at build time (e.g. "/api" for same-origin
  // behind a load balancer / CDN), ALWAYS honor it — on every host. This is the
  // production pattern (one domain, the LB routes /api to the backend).
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname;
  // If accessing from localhost, use localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return "http://localhost:5000/api";
  }
  // LAN/mobile dev fallback: talk to the backend on the same host, port 5000.
  return `http://${hostname}:5000/api`;
};

export let API_BASE_URL = getApiBaseUrl();

// Clear stale cached port on every page load so we always re-probe
sessionStorage.removeItem("workingApiPort");
let workingBaseUrl = null; // Will be discovered on first API call

// Export for use in other files
export const getBackendUrl = () => {
  // When the API is configured same-origin (VITE_API_URL is a relative path
  // like "/api"), WebSockets and /uploads also go through the same origin — the
  // load balancer proxies /socket.io and /uploads to the backend.
  const apiBase = import.meta.env.VITE_API_URL;
  if (apiBase && apiBase.startsWith('/')) {
    return window.location.origin;
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return "http://localhost:5000";
  }
  return `http://${hostname}:5000`;
};

// Helper to get auth header
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

// === SECURITY FIX #10: Silent token renewal ===
// Decode JWT payload (without verification — backend validates)
const decodeTokenPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

// Renew token if it expires within the next hour
let renewalInProgress = false;
const TOKEN_RENEWAL_THRESHOLD = 60 * 60 * 1000; // 1 hour before expiry

const tryRenewToken = async () => {
  if (renewalInProgress) return;
  const token = sessionStorage.getItem("token");
  if (!token) return;

  const payload = decodeTokenPayload(token);
  if (!payload || !payload.exp) return;

  const expiresAt = payload.exp * 1000; // convert to ms
  const timeUntilExpiry = expiresAt - Date.now();

  // Only renew if within the threshold window (but still valid)
  if (timeUntilExpiry > TOKEN_RENEWAL_THRESHOLD || timeUntilExpiry <= 0) return;

  renewalInProgress = true;
  try {
    const baseUrl = workingBaseUrl || API_BASE_URL;
    const response = await fetch(`${baseUrl}/auth/renew-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        sessionStorage.setItem("token", data.token);
        console.log('🔄 Token renewed silently');
      }
    }
  } catch (err) {
    // Silent failure — next API call will trigger 401 flow if token truly expired
    console.warn('Token renewal failed silently:', err.message);
  } finally {
    renewalInProgress = false;
  }
};

// Check for renewal every 5 minutes
setInterval(tryRenewToken, 5 * 60 * 1000);
// Also check on page visibility restore
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tryRenewToken();
  });
}

export const apiCall = async (endpoint, options = {}) => {
  const timeout = options.timeout || 30000; // Default 30s, allow custom timeout for long operations
  delete options.timeout; // Remove from fetch options

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
        // Distinguish between session types for user-facing messages
        try {
          const errorBody = await response.clone().json();
          if (errorBody.expired) {
            // Hard 3-hour session wall reached
            sessionStorage.setItem("session_expired", "true");
          } else if (errorBody.kicked || (errorBody.message &&
            (errorBody.message.includes("Session invalid") || errorBody.message.includes("logged out")))) {
            // Logged in from another device — this session was killed
            sessionStorage.setItem("kicked_out", "true");
          }
        } catch (e) {
          // Ignore parsing errors for 401
        }

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("sessionExpiresAt");
        localStorage.removeItem("user"); // FIX #4: Clear localStorage too
        clearAssessmentTimerStorage();

        // Use window.location to force redirect and UI reset
        // FIXED: Only redirect if NOT on a public route where 401 is expected/allowed
        const publicRoutes = [
          '/verify-certificate',
          '/verify-badge',
          '/verify-resume',
          '/signup-initial',
          '/verify-otp',
          '/signup',
          '/complete-registration',
          '/signup-success',
        ];
        const isPublicRoute = publicRoutes.some(route =>
          window.location.pathname === route || window.location.pathname.startsWith(`${route}/`)
        );

        if (!window.location.pathname.includes('/login') && !isPublicRoute) {
          // FIX: Save the current page so the user can return after re-login
          // This prevents silent data loss when the 3-hour session expires mid-form
          const currentPath = window.location.pathname + window.location.search;
          if (currentPath && currentPath !== '/') {
            sessionStorage.setItem("redirect_after_login", currentPath);
          }
          window.location.href = '/';
        }

        throw new Error("Unauthorized: Session expired");
      }

      const responseText = await response.text();
      let responseData = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log("Response parsing info (non-JSON):", responseText.slice(0, 100));
      }

      if (!response.ok) {
        const errorMsg = (typeof responseData.error === 'string' ? responseData.error : null) || responseData.message || (responseData.error && responseData.error.message) || `API Error: ${response.status}`;
        const error = new Error(errorMsg);
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

    // PERF: a 404 means the server REPLIED — it is reachable, the resource just
    // doesn't exist. It must NOT trigger fallback-port probing. The old code
    // re-issued every dev 404 against ports 5001 and 5002 (up to 3s timeout each,
    // ~6s added latency) and replayed the request — the main cause of pages that
    // "sometimes take 5-10s". Only genuine connection failures probe for the port.
    const isErrorThatTriggersFallback = isNetworkError;

    if (isErrorThatTriggersFallback) {
      console.warn("⚠️ API connection failed, searching for backend on fallback ports (5001, 5002)...");

      const hostname = window.location.hostname;
      const fallbacks = [
        `http://${hostname}:5001/api`,
        `http://${hostname}:5002/api`,
      ];

      for (const fallbackUrl of fallbacks) {
        try {
          // Use a short timeout for fallback discovery (1s)
          const result = await performCall(fallbackUrl, 1000);
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
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(query ? `/courses?${query}` : '/courses');
  },

  // Published courses for user dashboard
  getPublished: async () => {
    return apiCall('/courses?status=active&limit=100');
  },

  // Get course by code
  getByCode: async (courseCode) => {
    return apiCall(`/courses/code/${courseCode}`);
  },

  // Catalogue id (S01) or Mongo id — resolves admin builder course + quiz sync
  getByCatalog: async (catalogId) => {
    return apiCall(`/courses/catalog/${encodeURIComponent(catalogId)}`);
  },

  // Get course by ID
  getById: async (id) => {
    return apiCall(`/courses/${id}`);
  },

  // Get seven dynamic stages for a course
  getStages: async (courseIdOrCode) => {
    return apiCall(`/courses/${courseIdOrCode}/stages`);
  },

  // Get modules for a course
  getModules: async (courseId) => {
    return apiCall(`/courses/${courseId}/modules`);
  },

  create: async (payload) => {
    return apiCall('/courses', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  update: async (id, payload) => {
    return apiCall(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  publish: async (id, payload = {}) => {
    return apiCall(`/courses/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  delete: async (id) => {
    return apiCall(`/courses/${id}`, { method: 'DELETE' });
  },

  syncDefaults: async () => {
    return apiCall('/courses/sync-defaults', { method: 'POST' });
  },

  transcribeVideo: async (videoUrl, courseCode) => {
    return apiCall('/courses/transcribe-video', {
      method: 'POST',
      body: JSON.stringify({ videoUrl, courseCode })
    });
  },
};

// Course Enrollment API Functions
export const courseEnrollmentAPI = {
  // Get enrollment by student and course
  getByStudentAndCourse: async (studentId, courseId) => {
    return apiCall(`/courseEnrollments?student=${studentId}&course=${courseId}`);
  },

  // Get all enrollments for a student
  getByStudent: async (studentId) => {
    return apiCall(`/courseEnrollments/student/${studentId}`);
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

  // Update task result (with score)
  updateTaskResult: async (data) => {
    return apiCall('/courseEnrollments/task-result', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all user progress items for a course
  getUserProgress: async (courseCode) => {
    return apiCall(`/courseEnrollments/user-progress/${courseCode}`);
  },

  // Save user progress item
  saveUserProgress: async (data) => {
    return apiCall('/courseEnrollments/user-progress/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Notes API Functions
export const notesAPI = {
  // Get all notes for the current user
  getAll: async () => {
    return apiCall('/notes');
  },

  // Get notes for a course
  getByCourse: async (courseId) => {
    return apiCall(`/notes/${courseId}`);
  },

  // Upsert notes for a course or personal note
  upsert: async (courseId, content, title = "") => {
    return apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify({ courseId, content, title }),
    });
  },

  // Delete a note
  delete: async (courseId) => {
    return apiCall(`/notes/${courseId}`, {
      method: 'DELETE',
    });
  },
};

// Todos API Functions
export const todosAPI = {
  // Get all todos for the current user
  getAll: async () => {
    return apiCall('/todos');
  },

  // Create a new todo task
  create: async (title, dueDate, priority = 'medium') => {
    return apiCall('/todos', {
      method: 'POST',
      body: JSON.stringify({ title, dueDate, priority }),
    });
  },

  // Update a todo task (toggle complete, rename, change due date)
  update: async (id, updates) => {
    return apiCall(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete a todo task
  delete: async (id) => {
    return apiCall(`/todos/${id}`, {
      method: 'DELETE',
    });
  },
};

// Placement API Functions
export const placementsAPI = {
  getJobs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(query ? `/placements/jobs?${query}` : '/placements/jobs');
  },
  getJob: async (source, id) => {
    return apiCall(`/placements/jobs/${encodeURIComponent(source)}/${encodeURIComponent(id)}`, {
      timeout: 12000,
    });
  },
  // Check if current user has applied for this job
  // Use the placements applications endpoint which is the source used by the placements apply flow
  hasApplied: async (source, id) => {
    const query = new URLSearchParams({ job: id, jobSource: source }).toString();
    return apiCall(`/placements/applications?${query}`);
  },
  listApplications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(query ? `/placements/applications?${query}` : '/placements/applications');
  },
  deleteApplication: async (applicationId) => {
    return apiCall(`/placements/applications/${encodeURIComponent(applicationId)}`, { method: 'DELETE' });
  },
  applyJob: async (source, id, payload) => {
    // If payload is FormData (file upload), pass it through directly so apiCall can omit JSON headers
    const body = payload instanceof FormData ? payload : JSON.stringify(payload);
    return apiCall(`/placements/jobs/${encodeURIComponent(source)}/${encodeURIComponent(id)}/apply`, {
      method: 'POST',
      body,
    });
  },
};

// Users API
export const usersAPI = {
  // Get profile for current authenticated user
  getProfile: async () => {
    // Prefer server session validation endpoint which returns up-to-date user+registration
    return apiCall('/auth/me', { method: 'GET' });
  }
};

export default apiCall;
