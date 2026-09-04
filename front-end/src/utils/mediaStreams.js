/**
 * Registry of every MediaStream the app opens.
 *
 * Camera and microphone streams are opened in several places (the proctoring
 * setup screen, the exam engine, the audio monitor) and each closes its own.
 * When an attempt is held mid-exam the page is swapped out from under them,
 * and one missed teardown leaves the camera light on while the candidate is
 * reading the "under review" screen. Wrapping getUserMedia once, here, means a
 * single call can stop everything that is still open, whoever opened it.
 */
const openStreams = new Set();
let installed = false;

const forget = (stream) => openStreams.delete(stream);

export const trackMediaStream = (stream) => {
  if (!stream || typeof stream.getTracks !== 'function') return stream;
  openStreams.add(stream);
  stream.getTracks().forEach((track) => {
    track.addEventListener('ended', () => {
      if (stream.getTracks().every((t) => t.readyState === 'ended')) forget(stream);
    });
  });
  return stream;
};

/** Stop every open camera/microphone track. Safe to call repeatedly. */
export const stopAllMediaStreams = () => {
  let stopped = 0;
  openStreams.forEach((stream) => {
    try {
      stream.getTracks().forEach((track) => {
        if (track.readyState !== 'ended') {
          track.stop();
          stopped += 1;
        }
      });
    } catch (err) {
      console.warn('[MediaStreams] Failed to stop a track:', err);
    }
  });
  openStreams.clear();
  if (stopped) console.log(`[MediaStreams] Stopped ${stopped} open media track(s).`);
  return stopped;
};

/** Wrap navigator.mediaDevices.getUserMedia so every stream is registered. */
export const installMediaStreamRegistry = () => {
  if (installed) return;
  const devices = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
  if (!devices || typeof devices.getUserMedia !== 'function') return;
  const original = devices.getUserMedia.bind(devices);
  devices.getUserMedia = async (...args) => trackMediaStream(await original(...args));
  installed = true;
};
