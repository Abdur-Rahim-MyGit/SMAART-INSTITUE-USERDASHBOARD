import { useCallback, useEffect, useRef, useState } from 'react';
import { trackMediaStream } from '@/utils/mediaStreams';

/**
 * Entire-screen capture for secure assessments.
 *
 * `start()` asks for a display stream and accepts it only when the student
 * shared a whole monitor — a single window or tab is refused and the stream
 * is closed straight away. While active, `captureFrame()` returns a JPEG of
 * the current screen and `captureClip()` records a short WebM.
 *
 * The stream is registered with the shared media registry so
 * stopAllMediaStreams() (called when the exam ends) also releases it.
 */
const CLIP_MIME_CANDIDATES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

export default function useScreenCapture({ onStopped } = {}) {
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const manualStopRef = useRef(false);
  const clipInFlightRef = useRef(false);
  const onStoppedRef = useRef(onStopped);
  useEffect(() => { onStoppedRef.current = onStopped; }, [onStopped]);

  const [status, setStatus] = useState('idle'); // idle | requesting | active | stopped | error
  const [surface, setSurface] = useState('');
  const [error, setError] = useState('');   // unsupported | denied | wrong_surface | error

  const teardown = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch { /* already gone */ }
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch { /* ignore */ }
      videoRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    teardown();
    setStatus('stopped');
  }, [teardown]);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      setStatus('error'); setError('unsupported');
      return { ok: false, reason: 'unsupported' };
    }
    teardown();
    manualStopRef.current = false;
    setStatus('requesting'); setError('');

    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor', frameRate: { ideal: 5, max: 10 } },
        audio: false,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'exclude',
        monitorTypeSurfaces: 'include',
        systemAudio: 'exclude',
        preferCurrentTab: false
      });
    } catch (err) {
      const reason = err?.name === 'NotAllowedError' || err?.name === 'AbortError' ? 'denied' : 'error';
      setStatus('error'); setError(reason);
      return { ok: false, reason };
    }

    const track = stream.getVideoTracks()[0];
    const settings = (track && typeof track.getSettings === 'function') ? track.getSettings() : {};
    const shared = settings.displaySurface || '';

    if (shared && shared !== 'monitor') {
      try { stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      setStatus('error'); setError('wrong_surface'); setSurface(shared);
      return { ok: false, reason: 'wrong_surface', surface: shared };
    }

    trackMediaStream(stream);
    streamRef.current = stream;

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    try { await video.play(); } catch { /* autoplay policies do not apply to muted streams */ }
    videoRef.current = video;

    if (track) {
      track.addEventListener('ended', () => {
        if (streamRef.current !== stream) return;
        streamRef.current = null;
        videoRef.current = null;
        setStatus('stopped');
        if (!manualStopRef.current) onStoppedRef.current?.();
      });
    }

    const finalSurface = shared || 'unknown';
    setSurface(finalSurface);
    setStatus('active');
    return { ok: true, surface: finalSurface, stream };
  }, [teardown]);

  const captureFrame = useCallback(async ({ maxWidth = 1280, quality = 0.6 } = {}) => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    const scale = Math.min(1, maxWidth / w);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  }, []);

  const captureClip = useCallback(async ({ durationMs = 8000 } = {}) => {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === 'undefined' || clipInFlightRef.current) return null;
    const mimeType = CLIP_MIME_CANDIDATES.find((m) => {
      try { return MediaRecorder.isTypeSupported(m); } catch { return false; }
    });
    let recorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 600000 } : undefined);
    } catch {
      return null;
    }
    clipInFlightRef.current = true;
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const finished = new Promise((resolve) => {
      recorder.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: 'video/webm' }) : null);
      recorder.onerror = () => resolve(null);
    });
    try {
      recorder.start(1000);
      await new Promise((r) => setTimeout(r, durationMs));
      if (recorder.state !== 'inactive') recorder.stop();
    } catch {
      clipInFlightRef.current = false;
      return null;
    }
    const blob = await finished;
    clipInFlightRef.current = false;
    return blob;
  }, []);

  useEffect(() => () => { manualStopRef.current = true; teardown(); }, [teardown]);

  return {
    status,
    surface,
    error,
    isActive: status === 'active',
    start,
    stop,
    captureFrame,
    captureClip,
    getStream: () => streamRef.current
  };
}
