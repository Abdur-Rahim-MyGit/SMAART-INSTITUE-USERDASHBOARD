import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import proctoringApiDefault, { proctoringApi } from '@/services/proctoringApi';
import { apiCall } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiCall: vi.fn(),
  default: vi.fn(),
}));

describe('proctoringApi service suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiCall.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports both named and default proctoringApi with identical references', () => {
    expect(proctoringApi).toBe(proctoringApiDefault);
    expect(typeof proctoringApi.startSession).toBe('function');
  });

  it('startSession sends POST request to /proctoring/session/start with JSON payload', async () => {
    const payload = { assessmentId: 'a100', candidateId: 'c200' };
    apiCall.mockResolvedValueOnce({ sessionId: 'sess_123' });

    const result = await proctoringApi.startSession(payload);

    expect(apiCall).toHaveBeenCalledWith('/proctoring/session/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(result).toEqual({ sessionId: 'sess_123' });
  });

  it('logEvent sends POST request to event logging endpoint with event payload', async () => {
    const eventData = { type: 'face_absent', severity: 'warning', timestamp: 12345678 };

    await proctoringApi.logEvent('sess_123', eventData);

    expect(apiCall).toHaveBeenCalledWith('/proctoring/session/sess_123/event', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  });

  it('completeSession sends POST request to /proctoring/session/:id/complete', async () => {
    await proctoringApi.completeSession('sess_123');

    expect(apiCall).toHaveBeenCalledWith('/proctoring/session/sess_123/complete', {
      method: 'POST',
    });
  });

  it('heartbeat sends POST request to /proctoring/session/:id/heartbeat', async () => {
    await proctoringApi.heartbeat('sess_123');

    expect(apiCall).toHaveBeenCalledWith('/proctoring/session/sess_123/heartbeat', {
      method: 'POST',
    });
  });

  it('triggerLock sends POST request with lockout reason and details', async () => {
    const lockData = { reason: 'multiple_violations', strikes: 3 };

    await proctoringApi.triggerLock('sess_123', lockData);

    expect(apiCall).toHaveBeenCalledWith('/proctoring/session/sess_123/lock', {
      method: 'POST',
      body: JSON.stringify(lockData),
    });
  });

  it('uploadSnapshot sends multipart FormData containing the snapshot blob', async () => {
    const fakeBlob = new Blob(['fake-image-bytes'], { type: 'image/jpeg' });

    await proctoringApi.uploadSnapshot('sess_123', fakeBlob);

    expect(apiCall).toHaveBeenCalledWith(
      '/proctoring/session/sess_123/upload-snapshot',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );

    const callArgs = apiCall.mock.calls[0][1];
    const formData = callArgs.body;
    expect(formData.get('snapshot')).toBeDefined();
  });

  it('getSessions sends GET query params when provided or default query when empty', async () => {
    await proctoringApi.getSessions({ page: 1, limit: 20 });
    expect(apiCall).toHaveBeenCalledWith('/proctoring/admin/sessions?page=1&limit=20');

    await proctoringApi.getSessions();
    expect(apiCall).toHaveBeenCalledWith('/proctoring/admin/sessions');
  });

  it('getSessionDetails calls /proctoring/admin/session/:id', async () => {
    await proctoringApi.getSessionDetails('sess_999');
    expect(apiCall).toHaveBeenCalledWith('/proctoring/admin/session/sess_999');
  });

  it('saveRegistration serializes Float32Array embeddings to plain JSON arrays', async () => {
    const embFloat = new Float32Array([0.1, 0.2, 0.3]);
    const allEmbs = [new Float32Array([0.1, 0.2, 0.3]), [0.4, 0.5, 0.6]];
    const registrationData = {
      embedding: embFloat,
      allEmbeddings: allEmbs,
      registrationImages: ['data:image/jpeg;base64,abc'],
      model: 'arcface-r50',
      qualityScore: 92,
      framesCaptured: 5,
      antispoofPassed: true,
      alignedCropUrl: 'http://example.com/crop.jpg',
    };

    await proctoringApi.saveRegistration('sess_123', registrationData);

    const callArgs = apiCall.mock.calls[0][1];
    const parsedBody = JSON.parse(callArgs.body);

    expect(Array.isArray(parsedBody.embedding)).toBe(true);
    expect(parsedBody.embedding).toEqual([0.10000000149011612, 0.20000000298023224, 0.30000001192092896]);
    expect(Array.isArray(parsedBody.allEmbeddings)).toBe(true);
    expect(parsedBody.qualityScore).toBe(92);
    expect(parsedBody.antispoofPassed).toBe(true);
  });

  it('saveRegistration handles missing optional fields gracefully', async () => {
    const registrationData = {
      embedding: [0.1, 0.2],
      model: 'arcface-r50',
      qualityScore: 80,
      framesCaptured: 3,
      antispoofPassed: false,
    };

    await proctoringApi.saveRegistration('sess_123', registrationData);

    const callArgs = apiCall.mock.calls[0][1];
    const parsedBody = JSON.parse(callArgs.body);

    expect(parsedBody.allEmbeddings).toBeNull();
    expect(parsedBody.registrationImages).toBeNull();
    expect(parsedBody.alignedCropUrl).toBeNull();
  });

  it('getEmbedding calls /proctoring/session/:id/embedding', async () => {
    await proctoringApi.getEmbedding('sess_123');
    expect(apiCall).toHaveBeenCalledWith('/proctoring/session/sess_123/embedding');
  });

  it('logVerification sends POST request with verification similarity and status', async () => {
    const verData = {
      similarity: 0.88,
      status: 'verified',
      framesCaptured: 5,
      warningIssued: false,
    };

    await proctoringApi.logVerification('sess_123', verData);

    expect(apiCall).toHaveBeenCalledWith('/proctoring/session/sess_123/verification', {
      method: 'POST',
      body: JSON.stringify(verData),
    });
  });

  it('propagates network or API errors when an endpoint call fails', async () => {
    apiCall.mockRejectedValueOnce(new Error('Network connection timeout'));

    await expect(proctoringApi.heartbeat('sess_123')).rejects.toThrow('Network connection timeout');
  });
});
