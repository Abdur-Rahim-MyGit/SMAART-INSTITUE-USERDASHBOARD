/**
 * Environment integrity signals.
 *
 * These catch setups the face camera cannot see: a second monitor holding the
 * answers, a virtual camera replaying a recorded loop, or the exam opened in
 * two windows at once.
 *
 * Be clear about the limits. A browser can tell that a second screen EXISTS;
 * it can never tell what is displayed on it. And none of this can see a phone
 * in someone's hand — no browser API can. These raise the cost of cheating and
 * produce evidence; they are not proof, and they are not a wall.
 *
 * Every check degrades silently: unsupported APIs return "not detected" rather
 * than throwing or, worse, falsely accusing someone on a browser that simply
 * lacks the feature.
 */

// Substrings that appear in the device label of common virtual cameras. A
// virtual camera is a strong signal: there is no innocent reason to route a
// synthetic video source into a proctored exam.
const VIRTUAL_CAMERA_PATTERNS = [
  'obs',
  'virtual',
  'manycam',
  'snap camera',
  'xsplit',
  'droidcam',
  'epoccam',
  'iriun',
  'ndi',
  'v4l2loopback',
  'fake'
];

/**
 * Is the candidate running more than one screen?
 *
 * Uses the Multi-Screen Window Placement API. `screen.isExtended` is readable
 * without a permission prompt in Chromium browsers; Firefox and Safari do not
 * implement it, and there we simply report unsupported.
 *
 * @returns {{ supported: boolean, detected: boolean, screenCount: number|null }}
 */
export const detectSecondScreen = () => {
  try {
    if (typeof window === 'undefined' || !window.screen) {
      return { supported: false, detected: false, screenCount: null };
    }
    if (typeof window.screen.isExtended !== 'boolean') {
      return { supported: false, detected: false, screenCount: null };
    }
    return {
      supported: true,
      detected: window.screen.isExtended === true,
      screenCount: null // Exact count needs getScreenDetails() + permission
    };
  } catch {
    return { supported: false, detected: false, screenCount: null };
  }
};

/**
 * Is the webcam a real device, or a synthetic feed?
 *
 * Device labels are only populated once camera permission has been granted,
 * which it has by the time the exam runs. We report the ACTIVE device where we
 * can determine it, so an unused virtual camera sitting in the device list
 * does not flag someone who is genuinely on their built-in webcam.
 *
 * @param {MediaStream|null} activeStream - the live proctoring stream
 * @returns {Promise<{ supported: boolean, detected: boolean, label: string, videoInputs: number }>}
 */
export const detectVirtualCamera = async (activeStream = null) => {
  const miss = { supported: false, detected: false, label: '', videoInputs: 0 };

  try {
    if (!navigator.mediaDevices?.enumerateDevices) return miss;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');

    // Prefer the label of the device actually feeding the exam.
    let activeLabel = '';
    const track = activeStream?.getVideoTracks?.()[0];
    if (track?.label) activeLabel = track.label;

    const looksVirtual = (label) =>
      VIRTUAL_CAMERA_PATTERNS.some((p) => label.toLowerCase().includes(p));

    // If we know the active device, judge only that. Otherwise fall back to
    // "any virtual camera present", which is weaker and noted as such.
    const detected = activeLabel
      ? looksVirtual(activeLabel)
      : videoInputs.some((d) => d.label && looksVirtual(d.label));

    return {
      supported: true,
      detected,
      label: activeLabel || '',
      videoInputs: videoInputs.length
    };
  } catch {
    return miss;
  }
};

/**
 * Guard against the same assessment being open in more than one window.
 *
 * Two tabs means one can hold the questions while the other is worked on
 * elsewhere, and it also splits the proctoring signal in half. Uses
 * BroadcastChannel, which is same-origin and needs no server round trip.
 *
 * @param {string} resultId - scopes the channel to this attempt
 * @param {Function} onDuplicate - called when another window announces itself
 * @returns {Function} cleanup
 */
export const watchForDuplicateWindows = (resultId, onDuplicate) => {
  if (typeof BroadcastChannel === 'undefined' || !resultId) return () => {};

  let channel;
  try {
    channel = new BroadcastChannel(`smaart-exam-${resultId}`);
  } catch {
    return () => {};
  }

  // A unique id per window, so we ignore our own broadcasts.
  const selfId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const handleMessage = (event) => {
    const data = event?.data;
    if (!data || data.from === selfId) return;

    if (data.type === 'hello') {
      // Someone else just opened this attempt. Tell them we were here first,
      // then report it.
      channel.postMessage({ type: 'already-open', from: selfId });
      onDuplicate?.();
    } else if (data.type === 'already-open') {
      // We are the duplicate.
      onDuplicate?.();
    }
  };

  channel.addEventListener('message', handleMessage);
  channel.postMessage({ type: 'hello', from: selfId });

  return () => {
    try {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    } catch {
      /* already closed */
    }
  };
};

/**
 * Run the one-shot environment checks.
 *
 * @param {MediaStream|null} activeStream
 * @returns {Promise<Array<{eventType: string, details: string}>>} events to report
 */
export const runEnvironmentChecks = async (activeStream = null) => {
  const findings = [];

  const screens = detectSecondScreen();
  if (screens.supported && screens.detected) {
    findings.push({
      eventType: 'second_screen_detected',
      details: 'More than one display is connected to this device.'
    });
  }

  const camera = await detectVirtualCamera(activeStream);
  if (camera.supported && camera.detected) {
    findings.push({
      eventType: 'virtual_camera_detected',
      details: `Camera source appears to be virtual${camera.label ? `: ${camera.label}` : ''}.`
    });
  }

  return findings;
};

export default runEnvironmentChecks;
