import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { evaluateLiveness } from '@/services/livenessService';

describe('livenessService suite', () => {
  let mockVideo;
  let currentImageData;
  let drawImageCalls;
  let throwInGetImageData = false;

  // Stable delegate context that forwards calls to the current test's state
  beforeEach(() => {
    mockVideo = {
      readyState: 4, // HAVE_ENOUGH_DATA
      videoWidth: 640,
      videoHeight: 480,
    };
    throwInGetImageData = false;
    drawImageCalls = [];

    // Default dynamic/live face image data
    const pixels = 120 * 120 * 4;
    currentImageData = new Uint8ClampedArray(pixels);
    for (let i = 0; i < pixels; i += 4) {
      currentImageData[i] = (i * 7) % 256;
      currentImageData[i + 1] = (i * 13) % 256;
      currentImageData[i + 2] = (i * 23) % 256;
      currentImageData[i + 3] = 255;
    }

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
      drawImage: (...args) => {
        drawImageCalls.push(args);
      },
      getImageData: () => {
        if (throwInGetImageData) {
          throw new Error('Canvas security error (tainted)');
        }
        return { data: currentImageData };
      },
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default fallback when video element or bounding box is missing', () => {
    expect(evaluateLiveness(null, { x: 0, y: 0, width: 100, height: 100 })).toEqual({
      isLive: true,
      score: 0.85,
    });

    expect(evaluateLiveness(mockVideo, null)).toEqual({
      isLive: true,
      score: 0.85,
    });
  });

  it('returns default fallback when video readyState is less than 2 (not ready)', () => {
    mockVideo.readyState = 1;
    const result = evaluateLiveness(mockVideo, { x: 10, y: 10, width: 100, height: 100 });
    expect(result).toEqual({ isLive: true, score: 0.85 });
  });

  it('evaluates a live face with high texture detail and color variance as isLive: true', () => {
    const box = { x: 50, y: 50, width: 200, height: 200 };
    const result = evaluateLiveness(mockVideo, box);

    expect(result.isLive).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.30);
    expect(result.reason).toBeUndefined();
  });

  it('detects a static/flat presentation attack when image lacks texture and color variance', () => {
    // Fill with flat monochromatic grey pixels
    const pixels = 120 * 120 * 4;
    currentImageData = new Uint8ClampedArray(pixels);
    currentImageData.fill(128);

    const box = { x: 50, y: 50, width: 200, height: 200 };
    const result = evaluateLiveness(mockVideo, box);

    expect(result.isLive).toBe(false);
    expect(result.score).toBeLessThan(0.30);
    expect(result.reason).toContain('Potential presentation attack');
  });

  it('clamps bounding box coordinates to video dimensions without errors', () => {
    // Clear calls tracking from any earlier invocations
    drawImageCalls = [];
    const outOfBoundsBox = { x: -50, y: -20, width: 1000, height: 800 };
    const result = evaluateLiveness(mockVideo, outOfBoundsBox);

    expect(result).toHaveProperty('isLive');
    expect(result).toHaveProperty('score');
    expect(typeof result.isLive).toBe('boolean');
    expect(typeof result.score).toBe('number');
  });

  it('returns graceful fallback if canvas getImageData throws an exception', () => {
    throwInGetImageData = true;
    const box = { x: 10, y: 10, width: 100, height: 100 };
    const result = evaluateLiveness(mockVideo, box);

    expect(result).toEqual({ isLive: true, score: 0.80 });
  });
});
