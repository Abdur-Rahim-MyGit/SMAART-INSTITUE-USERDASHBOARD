import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const {
  mockNavigate,
  mockVerifyFace,
  mockDetectFaces,
  mockDetectFacesFast,
  mockLoadModels,
  mockIsReady,
  mockResetGazeCalibration,
  mockDetectObjects,
  mockIsObjectDetectorReady,
  mockProctoringApi,
  mockStartAudioMonitoring,
  mockStopAudioMonitoring,
  mockGetLastGates,
  mockInitMediaPipeGaze,
  mockDetectMediaPipeGaze,
  mockIsMediaPipeGazeReady,
  mockRunEnvironmentChecks,
  mockWatchForDuplicateWindows,
  mockToast,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockVerifyFace: vi.fn(),
  mockDetectFaces: vi.fn(),
  mockDetectFacesFast: vi.fn(),
  mockLoadModels: vi.fn().mockReturnValue(Promise.resolve(true)),
  mockIsReady: vi.fn().mockReturnValue(true),
  mockResetGazeCalibration: vi.fn(),
  mockDetectObjects: vi.fn().mockReturnValue(Promise.resolve([])),
  mockIsObjectDetectorReady: vi.fn().mockReturnValue(true),
  mockProctoringApi: {
    startSession: vi.fn().mockReturnValue(Promise.resolve({
      success: true,
      data: { _id: 'session-test-123', totalViolations: 0 },
    })),
    logEvent: vi.fn().mockReturnValue(Promise.resolve({
      success: true,
      proctoring: { warnings: 1, tier: 'warn', maxWarnings: 5, riskFlagged: false },
    })),
    heartbeat: vi.fn().mockReturnValue(Promise.resolve({
      proctoring: { tier: 'ok', warnings: 0 },
    })),
    uploadSnapshot: vi.fn().mockReturnValue(Promise.resolve({
      success: true,
      snapshotId: 'snap-123',
    })),
    completeSession: vi.fn().mockReturnValue(Promise.resolve({ success: true })),
  },
  mockStartAudioMonitoring: vi.fn(),
  mockStopAudioMonitoring: vi.fn(),
  mockGetLastGates: vi.fn().mockReturnValue({ speech: false }),
  mockInitMediaPipeGaze: vi.fn().mockReturnValue(Promise.resolve(true)),
  mockDetectMediaPipeGaze: vi.fn().mockReturnValue(null),
  mockIsMediaPipeGazeReady: vi.fn().mockReturnValue(false),
  mockRunEnvironmentChecks: vi.fn().mockReturnValue(Promise.resolve([])),
  mockWatchForDuplicateWindows: vi.fn().mockReturnValue(vi.fn()),
  mockToast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/services/api', () => ({
  apiCall: vi.fn(),
}));

vi.mock('@/services/faceVerificationService', () => ({
  verifyFace: (...args) => mockVerifyFace(...args),
  detectFaces: (...args) => mockDetectFaces(...args),
  detectFacesFast: (...args) => mockDetectFacesFast(...args),
  VerificationStatus: {
    VERIFIED: 'verified',
    MISMATCH: 'mismatch',
    NO_FACE: 'no_face',
    MULTIPLE_FACES: 'multiple_faces',
    COVERED: 'covered',
  },
  loadModels: () => mockLoadModels(),
  isReady: () => mockIsReady(),
  resetGazeCalibration: () => mockResetGazeCalibration(),
  detectObjects: (...args) => mockDetectObjects(...args),
  isObjectDetectorReady: () => mockIsObjectDetectorReady(),
}));

vi.mock('@/services/proctoringApi', () => ({
  proctoringApi: mockProctoringApi,
}));

vi.mock('@/services/audioMonitorService', () => ({
  startAudioMonitoring: (...args) => mockStartAudioMonitoring(...args),
  stopAudioMonitoring: () => mockStopAudioMonitoring(),
  getLastGates: () => mockGetLastGates(),
}));

vi.mock('@/services/onnxPipeline', () => ({
  getPipelineStatus: vi.fn().mockReturnValue({ ready: true }),
}));

vi.mock('@/workers/proctoringWorkerClient', () => ({
  default: {
    setReference: vi.fn(),
    processFrame: vi.fn(),
  },
}));

vi.mock('@/services/mediapipeGaze', () => ({
  initGaze: () => mockInitMediaPipeGaze(),
  detectGaze: (...args) => mockDetectMediaPipeGaze(...args),
  isGazeReady: () => mockIsMediaPipeGazeReady(),
}));

vi.mock('@/services/environmentSignals', () => ({
  runEnvironmentChecks: (...args) => mockRunEnvironmentChecks(...args),
  watchForDuplicateWindows: (...args) => mockWatchForDuplicateWindows(...args),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

import { useProctoringEngine } from '@/hooks/useProctoringEngine';

describe('useProctoringEngine', () => {
  let mockTrack;
  let mockStream;
  let audioCallbacks = {};

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockLoadModels.mockImplementation(() => Promise.resolve(true));
    mockIsReady.mockReturnValue(true);
    mockInitMediaPipeGaze.mockImplementation(() => Promise.resolve(true));
    mockDetectMediaPipeGaze.mockReturnValue(null);
    mockIsMediaPipeGazeReady.mockReturnValue(false);
    mockDetectObjects.mockImplementation(() => Promise.resolve([]));
    mockIsObjectDetectorReady.mockReturnValue(true);
    mockRunEnvironmentChecks.mockImplementation(() => Promise.resolve([]));
    mockWatchForDuplicateWindows.mockReturnValue(vi.fn());
    mockGetLastGates.mockReturnValue({ speech: false });

    mockVerifyFace.mockImplementation(() =>
      Promise.resolve({
        status: 'verified',
        similarity: 0.9,
        faceCount: 1,
        gaze: { gazeDirection: 'center' },
      })
    );

    mockDetectFacesFast.mockImplementation(() =>
      Promise.resolve({
        faceCount: 1,
        isFacePresent: true,
        gaze: { gazeDirection: 'center' },
      })
    );

    mockProctoringApi.startSession.mockImplementation(() =>
      Promise.resolve({
        success: true,
        data: {
          _id: 'session-test-123',
          totalViolations: 0,
        },
      })
    );
    mockProctoringApi.logEvent.mockImplementation(() =>
      Promise.resolve({
        success: true,
        proctoring: {
          warnings: 1,
          tier: 'warn',
          maxWarnings: 5,
          riskFlagged: false,
        },
      })
    );
    mockProctoringApi.heartbeat.mockImplementation(() =>
      Promise.resolve({
        proctoring: { tier: 'ok', warnings: 0 },
      })
    );
    mockProctoringApi.uploadSnapshot.mockImplementation(() =>
      Promise.resolve({
        success: true,
        snapshotId: 'snap-123',
      })
    );
    mockProctoringApi.completeSession.mockImplementation(() =>
      Promise.resolve({ success: true })
    );

    mockTrack = {
      stop: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'ended') mockTrack._onended = handler;
      }),
      removeEventListener: vi.fn(),
      readyState: 'live',
      onended: null,
    };

    mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
      getVideoTracks: vi.fn(() => [mockTrack]),
    };

    // Navigator mocks
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: {
        query: vi.fn().mockResolvedValue({ state: 'granted' }),
      },
    });

    // Default: in fullscreen to prevent countdown from firing during unrelated tests
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: document.documentElement,
      writable: true,
    });
    document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined);

    // Visibility / focus
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
      writable: true,
    });
    document.hasFocus = vi.fn().mockReturnValue(true);

    // Audio monitor mock captures callbacks
    mockStartAudioMonitoring.mockImplementation(async (opts) => {
      audioCallbacks = opts || {};
      return true;
    });

    // HTMLVideoElement prototype mocks for jsdom
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();

    // Configure onloadedmetadata and readyState on HTMLMediaElement prototype
    Object.defineProperty(HTMLMediaElement.prototype, 'onloadedmetadata', {
      configurable: true,
      set(fn) {
        if (fn) {
          Object.defineProperty(this, 'readyState', {
            value: 2,
            writable: true,
            configurable: true,
          });
          setTimeout(() => {
            try { fn.call(this); } catch (e) { /* ignore */ }
          }, 0);
        }
      },
    });

    // Canvas toBlob and getContext
    HTMLCanvasElement.prototype.toBlob = function (cb) {
      cb(new Blob(['fake-img'], { type: 'image/jpeg' }));
    };
    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === 'webgl' || type === 'experimental-webgl') {
        return {
          getExtension: vi.fn().mockReturnValue({ UNMASKED_RENDERER_WEBGL: 1 }),
          getParameter: vi.fn().mockReturnValue('Intel Iris'),
        };
      }
      return {
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
      };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. Initialization and Inactive State', () => {
    it('returns default initial values when inactive', () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: false,
        })
      );

      expect(result.current.isCameraActive).toBe(false);
      expect(result.current.isCameraWarmingUp).toBe(false);
      expect(result.current.isFaceDetected).toBe(false);
      expect(result.current.faceCount).toBe(0);
      expect(result.current.cameraError).toBeNull();
      expect(result.current.warningsCount).toBe(0);
      expect(result.current.maxWarnings).toBe(3);
      expect(result.current.riskFlagged).toBe(false);
      expect(result.current.isWarningVisible).toBe(false);
      expect(result.current.isLockedOut).toBe(false);
      expect(result.current.tier).toBe('ok');
      expect(result.current.nudgeMessage).toBe('');
      expect(result.current.isPaused).toBe(false);
      expect(result.current.verificationStatus).toBe('no_face');
      expect(result.current.similarityScore).toBe(0);
      expect(result.current.gazeDirection).toBe('center');
      expect(result.current.isMicActive).toBe(false);
      expect(result.current.isAudioCalibrated).toBe(false);
      expect(result.current.showAttentionCheck).toBe(false);
      expect(result.current.showInactivityOverlay).toBe(false);
      expect(result.current.proctoringSessionId).toBeNull();

      expect(mockProctoringApi.startSession).not.toHaveBeenCalled();
      expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    });

    it('loads face models on mount if not ready', () => {
      mockIsReady.mockReturnValue(false);
      renderHook(() => useProctoringEngine({ isActive: false }));

      expect(mockLoadModels).toHaveBeenCalled();
    });
  });

  describe('2. Active Mount & Session Startup', () => {
    it('starts proctoring session, initializes camera, and starts audio monitoring', async () => {
      const descriptor = new Float32Array([0.1, 0.2, 0.3]);
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-abc',
          assessmentId: 'asm-xyz',
          isActive: true,
          registeredFaceDescriptor: descriptor,
        })
      );

      await act(async () => {
        await Promise.resolve();
        vi.advanceTimersByTime(200);
      });

      expect(mockProctoringApi.startSession).toHaveBeenCalledWith(
        expect.objectContaining({
          resultId: 'res-abc',
          assessmentId: 'asm-xyz',
          environmentCheck: expect.objectContaining({
            cameraGranted: true,
          }),
        })
      );

      expect(result.current.proctoringSessionId).toBe('session-test-123');
      expect(result.current.isCameraActive).toBe(true);
      expect(result.current.isMicActive).toBe(true);
      expect(mockResetGazeCalibration).toHaveBeenCalled();
      expect(mockRunEnvironmentChecks).toHaveBeenCalled();
      expect(mockWatchForDuplicateWindows).toHaveBeenCalledWith('res-abc', expect.any(Function));

      // Face registered event logged
      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'face_registered',
          severity: 'info',
        })
      );
    });

    it('handles session start failure gracefully', async () => {
      mockProctoringApi.startSession.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(result.current.proctoringSessionId).toBeNull();
      expect(result.current.diagnostics.sessionError).toContain('Session failed to start');
    });

    it('redirects to /assessment-held if session start returns isLocked error', async () => {
      const lockedError = new Error('Session locked');
      lockedError.data = { isLocked: true, activeTicketId: 'ticket-999' };
      mockProctoringApi.startSession.mockRejectedValueOnce(lockedError);

      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/assessment-held', {
        replace: true,
        state: { reference: 'ticket-999' },
      });
    });
  });

  describe('3. Camera Handling and Failures', () => {
    it('handles getUserMedia failure and displays toast warning', async () => {
      const deniedErr = new Error('Permission denied');
      deniedErr.name = 'NotAllowedError';
      navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(deniedErr);

      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(result.current.isCameraActive).toBe(false);
      expect(result.current.cameraError).toBe('NotAllowedError');
      expect(mockToast.warning).toHaveBeenCalledWith(
        expect.stringContaining('Camera permissions are required')
      );
    });

    it('reports violation when camera track ends unexpectedly during exam', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Camera video track ended
      await act(async () => {
        if (mockTrack.onended) {
          mockTrack.onended();
        }
      });

      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'camera_disabled',
        })
      );
    });
  });

  describe('4. Audio Monitoring Callbacks', () => {
    it('reports violation on sustained speech', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        audioCallbacks.onVoiceDetected();
      });

      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'voice_detected',
        })
      );
    });

    it('reports violation on multiple voices detected', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        audioCallbacks.onMultipleVoices();
      });

      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'multiple_voices',
        })
      );
    });

    it('reports violation on prolonged silence alert', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        audioCallbacks.onProlongedSilence();
      });

      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'prolonged_silence',
        })
      );
    });

    it('updates isAudioCalibrated when audio noise floor calibrates', async () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        audioCallbacks.onCalibrated();
      });

      expect(result.current.isAudioCalibrated).toBe(true);
    });

    it('reports microphone_disabled when audio monitor returns false', async () => {
      let resolveAudio;
      mockStartAudioMonitoring.mockImplementationOnce(() => new Promise((res) => {
        resolveAudio = res;
      }));

      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
        })
      );

      // Advance timers so startSession resolves and sets proctoringSessionId
      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Now audio monitor resolves to false
      await act(async () => {
        resolveAudio(false);
      });

      expect(result.current.isMicActive).toBe(false);
      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'microphone_disabled',
        })
      );
    });
  });

  describe('5. Face Verification Ticks & Detection States', () => {
    it('sets model_unavailable if models are not ready when face verification tick runs', async () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Set ready to false before tick
      mockIsReady.mockReturnValue(false);

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.verificationStatus).toBe('model_unavailable');
      expect(result.current.isFaceDetected).toBe(false);
    });

    it('handles verified face detection and clears violations', async () => {
      mockIsReady.mockReturnValue(true);
      mockVerifyFace.mockResolvedValue({
        status: 'verified',
        similarity: 0.85,
        faceCount: 1,
        gaze: { gazeDirection: 'center' },
      });

      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockVerifyFace).toHaveBeenCalled();
      expect(result.current.verificationStatus).toBe('verified');
      expect(result.current.similarityScore).toBe(0.85);
      expect(result.current.isFaceDetected).toBe(true);
      expect(result.current.faceCount).toBe(1);
    });

    it('handles face absent condition through ladder', async () => {
      mockIsReady.mockReturnValue(true);
      mockVerifyFace.mockResolvedValue({
        status: 'no_face',
        similarity: 0,
        faceCount: 0,
      });

      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.verificationStatus).toBe('no_face');
      expect(result.current.isFaceDetected).toBe(false);
    });

    it('handles fast presence detection when identity tick is skipped', async () => {
      mockIsReady.mockReturnValue(true);
      mockVerifyFace.mockResolvedValue({
        status: 'verified',
        similarity: 0.9,
        faceCount: 1,
      });
      mockDetectFacesFast.mockResolvedValue({
        faceCount: 1,
        gaze: { gazeDirection: 'center' },
      });

      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // Tick 0: verifyFace runs
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(mockVerifyFace).toHaveBeenCalledTimes(1);

      // Tick 1: detectFacesFast runs
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(mockDetectFacesFast).toHaveBeenCalled();
      expect(result.current.isFaceDetected).toBe(true);
    });

    it('reports face_mismatch when no registered face is provided (unregistered)', async () => {
      mockIsReady.mockReturnValue(true);
      mockDetectFacesFast.mockResolvedValue({
        faceCount: 1,
        isFacePresent: true,
        gaze: { gazeDirection: 'center' },
      });

      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: null,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.verificationStatus).toBe('unregistered');
      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'face_mismatch',
          details: expect.stringContaining('registered face could not be loaded'),
        })
      );
    });
  });

  describe('6. Object Detection & Prohibited Items', () => {
    it('observes phone_detected when phone is found in frame', async () => {
      mockDetectObjects.mockResolvedValue([
        { label: 'phone', score: 0.88 },
      ]);

      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockDetectObjects).toHaveBeenCalled();
    });
  });

  describe('7. User Activity and Inactivity Overlays', () => {
    it('shows inactivity overlay after 30 seconds of inactivity', async () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });
      expect(result.current.showInactivityOverlay).toBe(false);

      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      expect(result.current.showInactivityOverlay).toBe(true);
    });

    it('dismisses inactivity overlay via dismissInactivityOverlay()', async () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(30050);
      });
      expect(result.current.showInactivityOverlay).toBe(true);

      act(() => {
        result.current.dismissInactivityOverlay();
      });

      expect(result.current.showInactivityOverlay).toBe(false);
    });

    it('reports violation when failInactivityCheck() is called', async () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(30050);
      });

      await act(async () => {
        result.current.failInactivityCheck();
      });

      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'inactivity',
        })
      );
    });

    it('resets inactivity timer on user activity event', async () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(25000);
      });

      act(() => {
        window.dispatchEvent(new Event('mousemove'));
      });

      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.showInactivityOverlay).toBe(false);
    });
  });

  describe('8. Attention Check Flow', () => {
    it('passes attention check and shows success toast', async () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        result.current.passAttentionCheck();
      });

      expect(result.current.showAttentionCheck).toBe(false);
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('Liveness verification successful')
      );
    });

    it('fails attention check and reports violation', async () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        result.current.failAttentionCheck();
      });

      expect(result.current.showAttentionCheck).toBe(false);
      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'attention_check_fail',
        })
      );
    });
  });

  describe('9. Fullscreen Behavior & Countdown', () => {
    it('requests fullscreen on requestFullscreen()', () => {
      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      act(() => {
        result.current.requestFullscreen();
      });

      expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
    });

    it('counts down and reports fullscreen_exit if exiting fullscreen', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      // User exits fullscreen after grace window (>8s from mount)
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      await act(async () => {
        Object.defineProperty(document, 'fullscreenElement', { value: null });
        document.dispatchEvent(new Event('fullscreenchange'));
      });

      // Countdown runs (15s)
      await act(async () => {
        vi.advanceTimersByTime(16000);
      });

      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'fullscreen_exit',
        })
      );
    });
  });

  describe('10. Visibility and Focus/Blur Handling', () => {
    it('reports tab_switch violation immediately on document visibilitychange to hidden', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        Object.defineProperty(document, 'hidden', { value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'tab_switch',
        })
      );
    });

    it('cancels blur violation if focus returns within grace period', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        window.dispatchEvent(new Event('blur'));
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
        window.dispatchEvent(new Event('focus'));
      });

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockProctoringApi.logEvent).not.toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'minimize',
        })
      );
    });

    it('reports minimize violation if window stays blurred past 2500ms', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        document.hasFocus.mockReturnValue(false);
        window.dispatchEvent(new Event('blur'));
      });

      await act(async () => {
        vi.advanceTimersByTime(2600);
      });

      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'minimize',
        })
      );
    });
  });

  describe('11. Security Restrictions (Keys, Copy/Paste, Context Menu)', () => {
    it('blocks and reports context menu (right-click)', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const event = new MouseEvent('contextmenu', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      await act(async () => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'context_menu',
        })
      );
    });

    it('blocks and reports copy event', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const event = new Event('copy', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      await act(async () => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'copy_detected',
        })
      );
    });

    it('blocks and reports paste event', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const event = new Event('paste', { cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      await act(async () => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'paste_detected',
        })
      );
    });

    it('blocks F12 developer tools shortcut', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const event = new KeyboardEvent('keydown', { key: 'F12', cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      await act(async () => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'restricted_shortcut',
        })
      );
    });

    it('blocks Ctrl+P (Print) shortcut', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const event = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      await act(async () => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockProctoringApi.logEvent).toHaveBeenCalledWith(
        'session-test-123',
        expect.objectContaining({
          eventType: 'restricted_shortcut',
        })
      );
    });

    it('does not block ordinary keys', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('12. Escalation, Warnings, and Lockout', () => {
    it('applies server decision and displays warning card on new warning', async () => {
      mockProctoringApi.logEvent.mockResolvedValueOnce({
        success: true,
        proctoring: {
          tier: 'warn',
          warnings: 1,
          maxWarnings: 3,
          riskFlagged: false,
        },
      });

      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        Object.defineProperty(document, 'hidden', { value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(result.current.tier).toBe('warn');
      expect(result.current.warningsCount).toBe(1);
      expect(result.current.isWarningVisible).toBe(true);

      act(() => {
        result.current.acknowledgeWarning();
      });

      expect(result.current.isWarningVisible).toBe(false);
    });

    it('handles lockout/held state when server returns tier: held', async () => {
      const mockOnLockout = vi.fn().mockResolvedValue({
        reference: 'TICKET-777',
        answersRecorded: 20,
        totalQuestions: 20,
      });

      mockProctoringApi.logEvent.mockImplementation((sid, payload) => {
        if (payload?.eventType === 'tab_switch') {
          return Promise.resolve({
            success: true,
            proctoring: {
              tier: 'held',
              held: true,
              warnings: 3,
              maxWarnings: 3,
              riskFlagged: true,
            },
          });
        }
        return Promise.resolve({ success: true, proctoring: { tier: 'ok', warnings: 0 } });
      });

      const { result } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
          onLockout: mockOnLockout,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        Object.defineProperty(document, 'hidden', { value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(result.current.isLockedOut).toBe(true);
      expect(result.current.tier).toBe('held');
      expect(mockOnLockout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/assessment-held', {
        replace: true,
        state: {
          reference: 'TICKET-777',
          answersRecorded: 20,
          totalQuestions: 20,
        },
      });
    });
  });

  describe('13. Heartbeat & Teardown Cleanup', () => {
    it('sends periodic heartbeats every 10 seconds', async () => {
      renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockProctoringApi.heartbeat).toHaveBeenCalledWith('session-test-123');
    });

    it('cleans up all intervals, stops camera/audio, and completes session on unmount', async () => {
      const { unmount } = renderHook(() =>
        useProctoringEngine({
          resultId: 'res-1',
          assessmentId: 'asm-1',
          isActive: true,
          registeredFaceDescriptor: new Float32Array([0.1, 0.2]),
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        unmount();
      });

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(mockStopAudioMonitoring).toHaveBeenCalled();
      expect(mockProctoringApi.completeSession).toHaveBeenCalledWith('session-test-123');
    });
  });
});
