import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  VerificationStatus,
  loadModels,
  isReady,
  getModelLoadError,
  detectObjects,
  isObjectDetectorReady,
  getBackendInfo,
  getMatchThreshold,
  resetTrackingState,
  distanceToSimilarity,
  filterToPeople,
  detectFaces,
  registerFace,
  verifyFace,
  verifyFaceBatch,
  computeAverageDescriptor,
  calibration,
} from '@/services/faceVerificationService';
import * as onnxPipeline from '@/services/onnxPipeline';
import * as faceQualityService from '@/services/faceQualityService';
import * as gazeTrackingService from '@/services/gazeTrackingService';

vi.mock('@/services/onnxPipeline', () => ({
  initPipeline: vi.fn(),
  detectAndEmbed: vi.fn(),
  detectOnly: vi.fn(),
  cosineSimilarity: vi.fn(),
  isReady: vi.fn(),
  getInitError: vi.fn(),
  detectObjects: vi.fn(),
  isObjectDetectorReady: vi.fn(),
}));

vi.mock('@/services/faceQualityService', () => ({
  evaluateFrameQuality: vi.fn(),
  checkBrightness: vi.fn(),
}));

vi.mock('@/services/gazeTrackingService', () => ({
  calculateGazeAndPose: vi.fn(),
}));

describe('faceVerificationService suite', () => {
  let mockVideo;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVideo = {
      readyState: 4,
      videoWidth: 640,
      videoHeight: 480,
    };

    onnxPipeline.isReady.mockReturnValue(true);
    onnxPipeline.getInitError.mockReturnValue(null);
    faceQualityService.checkBrightness.mockReturnValue({ passed: true, brightness: 120 });
    faceQualityService.evaluateFrameQuality.mockReturnValue({ passed: true, overallScore: 85, issues: [] });
    gazeTrackingService.calculateGazeAndPose.mockReturnValue({ direction: 'center', yaw: 0, pitch: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Enums, constants, and utilities', () => {
    it('exports VerificationStatus enum with all standard states', () => {
      expect(VerificationStatus).toEqual({
        VERIFIED: 'verified',
        MISMATCH: 'mismatch',
        NO_FACE: 'no_face',
        MULTIPLE_FACES: 'multiple_faces',
        COVERED: 'covered',
        SPOOF_DETECTED: 'spoof_detected',
        ERROR: 'error',
      });
    });

    it('getBackendInfo returns ONNX-WASM + WebGL configuration info', () => {
      expect(getBackendInfo()).toEqual({
        backend: 'onnx-wasm+webgl',
        isWebGL: true,
        isCPU: false,
      });
    });

    it('getMatchThreshold returns 0.32', () => {
      expect(getMatchThreshold()).toBe(0.32);
    });

    it('distanceToSimilarity converts distance to exponential similarity', () => {
      expect(distanceToSimilarity(0)).toBe(1);
      expect(distanceToSimilarity(1)).toBeCloseTo(Math.exp(-3));
    });

    it('resetTrackingState resets internal timer without throwing', () => {
      expect(() => resetTrackingState()).not.toThrow();
    });

    it('computeAverageDescriptor averages Float32Array descriptors', () => {
      const d1 = new Float32Array([0.2, 0.4]);
      const d2 = new Float32Array([0.4, 0.8]);

      const avg = computeAverageDescriptor([d1, d2]);
      expect(avg[0]).toBeCloseTo(0.3);
      expect(avg[1]).toBeCloseTo(0.6);
    });

    it('computeAverageDescriptor throws if given empty descriptors array', () => {
      expect(() => computeAverageDescriptor([])).toThrow('No descriptors');
    });
  });

  describe('Model initialization and readiness', () => {
    it('loadModels initializes pipeline and reports progress percentage', async () => {
      onnxPipeline.initPipeline.mockImplementation(async (cb) => {
        cb(50);
        cb(100);
      });

      const onProgress = vi.fn();
      const ready = await loadModels(onProgress);

      expect(onnxPipeline.initPipeline).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(5);
      expect(onProgress).toHaveBeenCalledWith(100);
      expect(ready).toBe(true);
    });

    it('loadModels catches errors gracefully and returns false if unready', async () => {
      onnxPipeline.initPipeline.mockRejectedValueOnce(new Error('WASM compilation failed'));
      onnxPipeline.isReady.mockReturnValue(false);

      const ready = await loadModels();

      expect(ready).toBe(false);
    });

    it('isReady and getModelLoadError delegate to onnxPipeline', () => {
      expect(isReady()).toBe(true);
      expect(getModelLoadError()).toBeNull();
    });

    it('detectObjects delegates to onnxPipeline', () => {
      detectObjects(mockVideo);
      expect(onnxPipeline.detectObjects).toHaveBeenCalledWith(mockVideo);
    });
  });

  describe('filterToPeople', () => {
    it('returns original array if 0 or 1 face detected', () => {
      expect(filterToPeople([])).toEqual([]);
      const oneFace = [{ score: 0.9, box: { width: 100, height: 100 } }];
      expect(filterToPeople(oneFace)).toEqual(oneFace);
    });

    it('filters out low-confidence background artefacts while keeping true second person', () => {
      const primaryFace = { score: 0.95, box: { width: 200, height: 200 } }; // area = 40000
      const lowScoreArtefact = { score: 0.40, box: { width: 150, height: 150 } }; // score < 0.62
      const smallAreaArtefact = { score: 0.80, box: { width: 40, height: 40 } }; // area 1600 / 40000 = 0.04 (< 0.22)
      const realSecondPerson = { score: 0.85, box: { width: 160, height: 160 } }; // area 25600 (> 0.22) & score >= 0.62

      const filtered = filterToPeople([primaryFace, lowScoreArtefact, smallAreaArtefact, realSecondPerson]);
      expect(filtered).toHaveLength(2);
      expect(filtered[0]).toBe(primaryFace);
      expect(filtered[1]).toBe(realSecondPerson);
    });
  });

  describe('detectFaces', () => {
    it('returns error if video is missing or not ready', async () => {
      const resNull = await detectFaces(null);
      expect(resNull.isFacePresent).toBe(false);
      expect(resNull.error).toBe('No input');

      mockVideo.readyState = 1;
      const resNotReady = await detectFaces(mockVideo);
      expect(resNotReady.isFacePresent).toBe(false);
      expect(resNotReady.error).toBe('Video not ready');
    });

    it('detects faces and calculates gaze when faces are present', async () => {
      const mockRawFaces = [
        {
          score: 0.9,
          box: { x: 10, y: 10, width: 100, height: 100 },
          landmarks: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]],
        },
      ];
      onnxPipeline.detectOnly.mockResolvedValueOnce(mockRawFaces);

      const result = await detectFaces(mockVideo);

      expect(result.faceCount).toBe(1);
      expect(result.isFacePresent).toBe(true);
      expect(result.faces[0].score).toBe(0.9);
      expect(result.gaze.gazeDirection).toBe('center');
      expect(result.timings).toHaveProperty('detect');
    });

    it('catches detectOnly exceptions and returns formatted error object', async () => {
      onnxPipeline.detectOnly.mockRejectedValueOnce(new Error('WebGL context lost'));

      const result = await detectFaces(mockVideo);

      expect(result.faceCount).toBe(0);
      expect(result.isFacePresent).toBe(false);
      expect(result.error).toBe('WebGL context lost');
    });
  });

  describe('verifyFace', () => {
    const valid512Ref = new Float32Array(512).fill(0.1);

    it('returns ERROR when referenceDescriptor is missing or invalid length', async () => {
      const resMissing = await verifyFace(mockVideo, null);
      expect(resMissing.status).toBe(VerificationStatus.ERROR);
      expect(resMissing.error).toContain('No valid reference');

      const resBadLen = await verifyFace(mockVideo, new Float32Array(128));
      expect(resBadLen.status).toBe(VerificationStatus.ERROR);
    });

    it('returns NO_FACE when camera is covered or too dark (< 20 brightness)', async () => {
      faceQualityService.checkBrightness.mockReturnValueOnce({ passed: false, brightness: 10 });

      const result = await verifyFace(mockVideo, valid512Ref);

      expect(result.status).toBe(VerificationStatus.NO_FACE);
      expect(result.faceCount).toBe(0);
    });

    it('returns NO_FACE when detectAndEmbed returns 0 faces', async () => {
      onnxPipeline.detectAndEmbed.mockResolvedValueOnce([]);

      const result = await verifyFace(mockVideo, valid512Ref);

      expect(result.status).toBe(VerificationStatus.NO_FACE);
      expect(result.faceCount).toBe(0);
    });

    it('returns MULTIPLE_FACES when multiple distinct persons are detected', async () => {
      onnxPipeline.detectAndEmbed.mockResolvedValueOnce([
        { score: 0.95, box: { width: 200, height: 200 } },
        { score: 0.90, box: { width: 180, height: 180 } },
      ]);

      const result = await verifyFace(mockVideo, valid512Ref);

      expect(result.status).toBe(VerificationStatus.MULTIPLE_FACES);
      expect(result.faceCount).toBe(2);
    });

    it('returns COVERED when detected face is missing embedding', async () => {
      onnxPipeline.detectAndEmbed.mockResolvedValueOnce([
        { score: 0.90, box: { width: 200, height: 200 }, embedding: null },
      ]);

      const result = await verifyFace(mockVideo, valid512Ref);

      expect(result.status).toBe(VerificationStatus.COVERED);
    });

    it('returns VERIFIED when cosine similarity meets or exceeds threshold (>= 0.32)', async () => {
      const liveEmb = new Float32Array(512).fill(0.2);
      onnxPipeline.detectAndEmbed.mockResolvedValueOnce([
        { score: 0.92, box: { width: 200, height: 200 }, embedding: liveEmb },
      ]);
      onnxPipeline.cosineSimilarity.mockReturnValueOnce(0.75); // >= 0.32

      const result = await verifyFace(mockVideo, valid512Ref);

      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.similarity).toBe(0.75);
      expect(result.distance).toBeCloseTo(0.25);
    });

    it('returns COVERED when similarity is low but frame quality is poor (< 55)', async () => {
      const liveEmb = new Float32Array(512).fill(0.2);
      onnxPipeline.detectAndEmbed.mockResolvedValueOnce([
        { score: 0.90, box: { width: 200, height: 200 }, embedding: liveEmb },
      ]);
      onnxPipeline.cosineSimilarity.mockReturnValueOnce(0.20); // < 0.32
      faceQualityService.evaluateFrameQuality.mockReturnValueOnce({
        passed: false,
        overallScore: 40, // < 55
        issues: ['Face partially obscured'],
      });

      const result = await verifyFace(mockVideo, valid512Ref);

      expect(result.status).toBe(VerificationStatus.COVERED);
      expect(result.similarity).toBe(0.20);
    });

    it('returns MISMATCH when similarity is low and frame quality is clear (>= 55)', async () => {
      const liveEmb = new Float32Array(512).fill(0.2);
      onnxPipeline.detectAndEmbed.mockResolvedValueOnce([
        { score: 0.90, box: { width: 200, height: 200 }, embedding: liveEmb },
      ]);
      onnxPipeline.cosineSimilarity.mockReturnValueOnce(0.18); // < 0.32
      faceQualityService.evaluateFrameQuality.mockReturnValueOnce({
        passed: true,
        overallScore: 80, // >= 55
        issues: [],
      });

      const result = await verifyFace(mockVideo, valid512Ref);

      expect(result.status).toBe(VerificationStatus.MISMATCH);
      expect(result.similarity).toBe(0.18);
    });
  });

  describe('verifyFaceBatch', () => {
    const refEmbeddings = [new Float32Array(512).fill(0.1)];

    it('returns ERROR when referenceEmbeddings or video is invalid', async () => {
      const resNoRef = await verifyFaceBatch(mockVideo, []);
      expect(resNoRef.status).toBe(VerificationStatus.ERROR);

      mockVideo.readyState = 1;
      const resUnready = await verifyFaceBatch(mockVideo, refEmbeddings);
      expect(resUnready.status).toBe(VerificationStatus.ERROR);
    });

    it('aggregates multi-frame verification and returns VERIFIED when >= 60% frames pass', async () => {
      const liveEmb = new Float32Array(512).fill(0.1);
      onnxPipeline.detectAndEmbed.mockResolvedValue([
        { score: 0.9, box: { width: 100, height: 100 }, embedding: liveEmb },
      ]);
      onnxPipeline.cosineSimilarity.mockReturnValue(0.80);

      const result = await verifyFaceBatch(mockVideo, refEmbeddings, { frameCount: 3, intervalMs: 0 });

      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.framesCaptured).toBe(3);
      expect(result.bestSimilarity).toBe(0.80);
    });

    it('prioritizes MULTIPLE_FACES if any frame detects multiple faces', async () => {
      onnxPipeline.detectAndEmbed.mockResolvedValue([
        { score: 0.9, box: { width: 100, height: 100 } },
        { score: 0.9, box: { width: 100, height: 100 } },
      ]);

      const result = await verifyFaceBatch(mockVideo, refEmbeddings, { frameCount: 2, intervalMs: 0 });

      expect(result.status).toBe(VerificationStatus.MULTIPLE_FACES);
    });
  });

  describe('registerFace', () => {
    it('throws error if video element is unready', async () => {
      mockVideo.readyState = 1;
      await expect(registerFace(mockVideo)).rejects.toThrow('Video element not ready.');
    });

    it('captures frames and returns median-pooled embedding on success', async () => {
      const emb1 = new Float32Array(512).fill(0.1);
      const emb2 = new Float32Array(512).fill(0.12);
      const emb3 = new Float32Array(512).fill(0.11);

      let callCount = 0;
      onnxPipeline.detectAndEmbed.mockImplementation(async () => {
        callCount++;
        const embs = [emb1, emb2, emb3];
        return [{ score: 0.95, box: { x: 10, y: 10, width: 100, height: 100 }, embedding: embs[callCount - 1] || emb1 }];
      });
      onnxPipeline.cosineSimilarity.mockReturnValue(0.95);

      const onFrameCaptured = vi.fn();
      const result = await registerFace(mockVideo, {
        frameCount: 3,
        intervalMs: 0,
        onFrameCaptured,
      });

      expect(result.embedding).toBeDefined();
      expect(result.embedding.length).toBe(512);
      expect(result.framesCaptured).toBe(3);
      expect(result.model).toBe('arcface-r50-onnx');
      expect(onFrameCaptured).toHaveBeenCalledTimes(3);
    });

    it('throws error if fewer than 2 valid frames could be captured', async () => {
      onnxPipeline.detectAndEmbed.mockResolvedValue([]); // No face

      await expect(registerFace(mockVideo, { frameCount: 3, intervalMs: 0 })).rejects.toThrow(
        /Face registration failed/
      );
    });
  });

  describe('calibration tool', () => {
    it('starts, records, summarizes and clears calibration entries', () => {
      calibration.clear();
      expect(calibration.rows()).toHaveLength(0);

      calibration.start('genuine');
      // verifyFace records score when calibrationLabel is active
      calibration.start('impostor');
      calibration.stop();

      expect(() => calibration.summary()).not.toThrow();
      calibration.clear();
      expect(calibration.rows()).toHaveLength(0);
    });
  });
});
