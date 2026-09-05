import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiCall, {
  API_BASE_URL,
  getBackendUrl,
  startTokenRenewal,
  stopTokenRenewal,
  coursesAPI,
  courseEnrollmentAPI,
  notesAPI,
  todosAPI,
  placementsAPI,
  usersAPI,
  visionBoardAPI,
} from '@/services/api';

describe('api.js service suite', () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    delete window.location;
    window.location = {
      hostname: 'localhost',
      origin: 'http://localhost:5173',
      pathname: '/dashboard',
      search: '',
      href: 'http://localhost:5173/dashboard',
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.location = originalLocation;
    stopTokenRenewal();
    vi.useRealTimers();
  });

  describe('URL resolution and configuration', () => {
    it('provides API_BASE_URL defaulting to localhost:5000/api when on localhost', () => {
      expect(API_BASE_URL).toBe('http://localhost:5000/api');
    });

    it('resolves getBackendUrl() correctly on localhost without trailing path', () => {
      expect(getBackendUrl()).toBe('http://localhost:5000');
    });
  });

  describe('Headers and request configuration', () => {
    it('attaches Bearer token in Authorization header when token exists in sessionStorage', async () => {
      sessionStorage.setItem('token', 'sample_test_token_xyz');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      });

      await apiCall('/test-endpoint');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, requestOptions] = global.fetch.mock.calls[0];
      expect(url).toContain('/test-endpoint');
      expect(requestOptions.credentials).toBe('include');
      expect(requestOptions.headers.Authorization).toBe('Bearer sample_test_token_xyz');
      expect(requestOptions.headers['Content-Type']).toBe('application/json');
    });

    it('omits Authorization header when token is not present', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ data: 'ok' })),
      });

      await apiCall('/public-endpoint');

      const [, requestOptions] = global.fetch.mock.calls[0];
      expect(requestOptions.headers.Authorization).toBeUndefined();
    });

    it('does not set Content-Type to application/json when body is FormData', async () => {
      const formData = new FormData();
      formData.append('key', 'value');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ uploaded: true })),
      });

      await apiCall('/upload', { method: 'POST', body: formData });

      const [, requestOptions] = global.fetch.mock.calls[0];
      expect(requestOptions.headers['Content-Type']).toBeUndefined();
    });

    it('merges custom headers provided in options', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ custom: true })),
      });

      await apiCall('/custom-headers', {
        headers: {
          'X-Custom-Header': 'CustomVal',
        },
      });

      const [, requestOptions] = global.fetch.mock.calls[0];
      expect(requestOptions.headers['X-Custom-Header']).toBe('CustomVal');
      expect(requestOptions.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Successful API responses and parsing', () => {
    it('returns parsed JSON response data when API call succeeds', async () => {
      const mockData = { id: 101, name: 'Data Structures' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockData)),
      });

      const result = await apiCall('/courses/101');
      expect(result).toEqual(mockData);
    });

    it('handles non-JSON response text gracefully without crashing', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('PLAIN_TEXT_RESPONSE'),
      });

      const result = await apiCall('/plain');
      expect(result).toEqual({});
    });
  });

  describe('Non-401 HTTP errors', () => {
    it('throws an Error with status and error message from JSON error response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve(JSON.stringify({ error: 'Course not found' })),
      });

      await expect(apiCall('/courses/999')).rejects.toThrow('Course not found');
    });

    it('extracts error.message if error is an object', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'Bad request parameters' })),
      });

      await expect(apiCall('/bad-request')).rejects.toThrow('Bad request parameters');
    });

    it('defaults to API Error: <status> when no error text or message is present', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({})),
      });

      await expect(apiCall('/server-error')).rejects.toThrow('API Error: 500');
    });
  });

  describe('401 Unauthorized handling and session clearing', () => {
    it('clears token, user, sessionExpiresAt, stops renewal and redirects on 401', async () => {
      sessionStorage.setItem('token', 'active_token');
      sessionStorage.setItem('user', JSON.stringify({ email: 'student@smaart.edu' }));
      sessionStorage.setItem('sessionExpiresAt', '2026-09-05T15:00:00.000Z');
      localStorage.setItem('user', JSON.stringify({ email: 'student@smaart.edu' }));

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        clone: () => ({
          json: () => Promise.resolve({ expired: true }),
        }),
        text: () => Promise.resolve(JSON.stringify({ expired: true })),
      });

      await expect(apiCall('/protected')).rejects.toThrow('Unauthorized: Session expired');

      expect(sessionStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('user')).toBeNull();
      expect(sessionStorage.getItem('sessionExpiresAt')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(sessionStorage.getItem('session_expired')).toBe('true');
      expect(sessionStorage.getItem('redirect_after_login')).toBe('/dashboard');
      expect(window.location.href).toBe('/');
    });

    it('sets kicked_out flag when 401 indicates session was kicked/invalidated on another device', async () => {
      sessionStorage.setItem('token', 'active_token');

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        clone: () => ({
          json: () => Promise.resolve({ kicked: true, message: 'Session invalid: logged out from another device' }),
        }),
        text: () => Promise.resolve(JSON.stringify({ kicked: true })),
      });

      await expect(apiCall('/protected')).rejects.toThrow('Unauthorized: Session expired');
      expect(sessionStorage.getItem('kicked_out')).toBe('true');
    });

    it('does NOT redirect to / if the user is already on a public route', async () => {
      window.location.pathname = '/verify-certificate';
      window.location.href = 'http://localhost:5173/verify-certificate';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        clone: () => ({
          json: () => Promise.resolve({ message: 'No token' }),
        }),
        text: () => Promise.resolve(JSON.stringify({ message: 'No token' })),
      });

      await expect(apiCall('/verify-cert')).rejects.toThrow('Unauthorized: Session expired');
      expect(window.location.href).toBe('http://localhost:5173/verify-certificate');
    });

    it('does NOT redirect if the path includes /login', async () => {
      window.location.pathname = '/login';
      window.location.href = 'http://localhost:5173/login';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        clone: () => ({
          json: () => Promise.resolve({ message: 'Bad credentials' }),
        }),
        text: () => Promise.resolve(JSON.stringify({ message: 'Bad credentials' })),
      });

      await expect(apiCall('/auth/login')).rejects.toThrow('Unauthorized: Session expired');
      expect(window.location.href).toBe('http://localhost:5173/login');
    });
  });

  describe('Silent token renewal mechanics', () => {
    it('does not crash when starting or stopping token renewal', () => {
      expect(() => startTokenRenewal()).not.toThrow();
      expect(() => stopTokenRenewal()).not.toThrow();
    });

    it('starts periodic renewal interval when token exists', () => {
      sessionStorage.setItem('token', 'dummy.jwt.token');
      vi.useFakeTimers();
      startTokenRenewal();
      stopTokenRenewal();
    });
  });

  describe('Timeout and AbortController handling', () => {
    it('throws timeout error message when request is aborted due to timeout', async () => {
      global.fetch = vi.fn().mockImplementation(() => {
        const err = new Error('The user aborted a request.');
        err.name = 'AbortError';
        return Promise.reject(err);
      });

      await expect(apiCall('/slow-endpoint', { timeout: 1000 })).rejects.toThrow('Request timed out after 1 seconds');
    });
  });

  describe('Sub-API wrappers verification', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ ok: true })),
      });
    });

    it('coursesAPI makes correct requests for getAll, getById, and getPublished', async () => {
      await coursesAPI.getAll({ limit: 10 });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/courses?limit=10'), expect.any(Object));

      await coursesAPI.getById('c123');
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/courses/c123'), expect.any(Object));

      await coursesAPI.getPublished();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/courses?status=active&limit=100'), expect.any(Object));
    });

    it('courseEnrollmentAPI makes correct requests', async () => {
      await courseEnrollmentAPI.getByStudentAndCourse('s1', 'c1');
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/courseEnrollments?student=s1&course=c1'), expect.any(Object));

      await courseEnrollmentAPI.updateTaskProgress({ taskId: 't1', done: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/courseEnrollments/task-progress'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('notesAPI and todosAPI make correct requests', async () => {
      await notesAPI.getAll();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/notes'), expect.any(Object));

      await todosAPI.create('Study React', '2026-09-10');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/todos'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('placementsAPI, usersAPI, and visionBoardAPI make correct requests', async () => {
      await placementsAPI.getJobs();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/placements/jobs'), expect.any(Object));

      await usersAPI.getProfile();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/me'), expect.objectContaining({ method: 'GET' }));

      await visionBoardAPI.getByUserId('user123');
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/visionBoards?userId=user123'), expect.any(Object));
    });
  });
});
