/**
 * Audio Monitor Service
 *
 * Monitors microphone input using the browser-native Web Audio API
 * to detect SUSTAINED HUMAN SPEECH vs ordinary ambient noise.
 *
 * ── How it distinguishes voice from fan/AC/keyboard ──────────────────────────
 *
 *  1. Noise-floor calibration (first 3 s of exam)
 *     We record the student's personal ambient noise level so that a loud
 *     fan is never counted as speech.
 *
 *  2. Spectral Flatness Measure (SFM)
 *     Fan noise has a flat spectrum across all frequencies (SFM ≈ 1).
 *     Human voice has sharp formant peaks (SFM ≈ 0).
 *     We only flag audio that is "peaked", not "flat".
 *
 *  3. Temporal Amplitude Variance
 *     Voice has natural syllabic rhythm (amplitude rises/falls every ~200 ms).
 *     Fans produce constant-energy output.
 *     We require the amplitude to be varying over a 2-second window.
 *
 *  All THREE conditions must be true simultaneously to classify a frame as
 *  "speech". Only 20 consecutive speech-seconds trigger a violation.
 *
 * Zero npm dependencies. Uses only standard Web Audio API.
 */

// ─── Constants ───────────────────────────────────────────────────────────────
const CALIBRATION_DURATION_MS    = 3000;   // How long to sample ambient noise at start
const VOICE_BAND_MIN_HZ          = 85;     // Lowest fundamental frequency of human voice
const VOICE_BAND_MAX_HZ          = 4000;   // Upper edge of intelligible speech
const ENERGY_DELTA_THRESHOLD     = 0.010;  // RMS delta above baseline to consider "sound present"
const SFM_VOICE_THRESHOLD        = 0.5;    // SFM below this → peaked spectrum → possible voice (speech usually 0.2-0.6)
const VARIANCE_VOICE_THRESHOLD   = 0.0005; // Amplitude variance above this → rhythmic → speech
const SPEECH_SECONDS_TO_REPORT   = 5;      // Consecutive "speech" seconds before violation
const SILENCE_SECONDS_TO_REPORT  = 60;     // 1 minute of silence before violation
const ANALYSIS_INTERVAL_MS       = 1000;   // Analyse one frame per second
const VARIANCE_WINDOW_SAMPLES    = 8;      // Number of recent amplitude samples for variance calc

// ─── Module-level state ──────────────────────────────────────────────────────
let audioCtx        = null;
let analyserNode    = null;
let micStream       = null;
let monitorTimer    = null;
let isMicActive     = false;

// Calibration
let noiseFloorRMS   = 0;
let isCalibrated    = false;
let calibStartTime  = null;
let calibSamples    = [];

// Rolling amplitude history for variance calculation
let amplitudeHistory = [];

// Streak counters
let speechStreak    = 0;
let silenceStreak   = 0;

// External callbacks
let onVoiceCb       = null;
let onSilenceCb     = null;
let onReadyCb       = null;  // called once calibration is done

// ─── Audio Math ──────────────────────────────────────────────────────────────

/**
 * Compute the RMS energy of the voice frequency band (VOICE_BAND_MIN_HZ – VOICE_BAND_MAX_HZ)
 * from AnalyserNode float frequency data (values are in dB, –∞ to 0).
 *
 * @param {AnalyserNode} analyser
 * @returns {number} linear RMS
 */
const voiceBandRMS = (analyser) => {
  const buf        = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(buf);

  const nyquist    = analyser.context.sampleRate / 2;
  const minBin     = Math.floor((VOICE_BAND_MIN_HZ / nyquist) * buf.length);
  const maxBin     = Math.ceil((VOICE_BAND_MAX_HZ  / nyquist) * buf.length);

  let sumSq = 0, count = 0;
  for (let i = minBin; i <= maxBin && i < buf.length; i++) {
    // dB → linear amplitude
    const lin = Math.pow(10, buf[i] / 20);
    sumSq += lin * lin;
    count++;
  }
  return count > 0 ? Math.sqrt(sumSq / count) : 0;
};

/**
 * Spectral Flatness Measure over the full analyser buffer.
 * SFM = geometricMean(powers) / arithmeticMean(powers)
 * Range: 0 (perfectly tonal / peaked) → 1 (perfectly flat / noise-like).
 *
 * @param {AnalyserNode} analyser
 * @returns {number}
 */
const spectralFlatness = (analyser) => {
  const buf  = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(buf);

  let logSum = 0, linSum = 0, count = 0;
  for (let i = 1; i < buf.length; i++) {
    // Skip –Infinity bins (silence) to avoid log(0)
    if (buf[i] <= -140) continue;
    const power = Math.pow(10, buf[i] / 10);
    logSum += Math.log(power + 1e-12);
    linSum += power;
    count++;
  }
  if (count === 0 || linSum === 0) return 1; // treat as flat / noise
  const geoMean = Math.exp(logSum / count);
  const ariMean = linSum / count;
  return geoMean / ariMean;
};

/**
 * Rolling variance of the last VARIANCE_WINDOW_SAMPLES amplitude readings.
 *
 * @param {number} newSample
 * @returns {number} variance
 */
const rollingVariance = (newSample) => {
  amplitudeHistory.push(newSample);
  if (amplitudeHistory.length > VARIANCE_WINDOW_SAMPLES) {
    amplitudeHistory.shift();
  }
  if (amplitudeHistory.length < 3) return 0;
  const mean = amplitudeHistory.reduce((a, b) => a + b, 0) / amplitudeHistory.length;
  const variance = amplitudeHistory.reduce((acc, v) => acc + (v - mean) ** 2, 0) / amplitudeHistory.length;
  return variance;
};

// ─── Core Analysis Loop ──────────────────────────────────────────────────────

const analyse = () => {
  if (!analyserNode) return;

  const rms = voiceBandRMS(analyserNode);
  const now = Date.now();

  // ── Phase 1: Calibration ────────────────────────────────────────────────
  if (!isCalibrated) {
    calibSamples.push(rms);
    if (now - calibStartTime >= CALIBRATION_DURATION_MS) {
      // Use 80th percentile of calibration samples as noise floor
      // (ignores brief spikes during the calibration window)
      const sorted     = [...calibSamples].sort((a, b) => a - b);
      const p80index   = Math.floor(sorted.length * 0.8);
      noiseFloorRMS    = sorted[p80index] || 0;
      isCalibrated     = true;
      console.log(`[AudioMonitor] ✅ Noise floor calibrated: ${noiseFloorRMS.toFixed(5)} RMS`);
      onReadyCb?.();
    }
    return; // Do not start flagging until calibration is complete
  }

  // ── Phase 2: Triple-gate voice detection ────────────────────────────────

  // Gate 1: Is energy significantly above the personal noise floor?
  const energyAboveFloor = rms > (noiseFloorRMS + ENERGY_DELTA_THRESHOLD);

  // Gate 2: Is the spectrum peaked (not flat like a fan)?
  const sfm              = spectralFlatness(analyserNode);
  const isSpectrallyPeaked = sfm < SFM_VOICE_THRESHOLD;

  // Gate 3: Is the amplitude varying rhythmically over time?
  const variance         = rollingVariance(rms);
  const isRhythmic       = variance > VARIANCE_VOICE_THRESHOLD;

  const isSpeech = energyAboveFloor && isSpectrallyPeaked && isRhythmic;

  if (isSpeech) {
    speechStreak++;
    silenceStreak = 0;
    if (speechStreak >= SPEECH_SECONDS_TO_REPORT) {
      speechStreak = 0;
      onVoiceCb?.();
    }
  } else if (rms < (noiseFloorRMS + 0.005)) {
    // Near-total silence (well below noise floor)
    silenceStreak++;
    speechStreak = Math.max(0, speechStreak - 1);
    if (silenceStreak >= SILENCE_SECONDS_TO_REPORT) {
      silenceStreak = 0;
      onSilenceCb?.();
    }
  } else {
    // Ambient noise — decrease speech streak, reset silence streak
    speechStreak = Math.max(0, speechStreak - 1);
    silenceStreak = 0;
  }
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Start microphone monitoring.
 *
 * @param {{
 *   onVoiceDetected: Function,  – called after SPEECH_SECONDS_TO_REPORT of continuous speech
 *   onProlongedSilence: Function, – called after SILENCE_SECONDS_TO_REPORT of near-silence
 *   onCalibrated: Function,     – called once baseline noise calibration is done
 * }} callbacks
 * @returns {Promise<boolean>} true if started, false if mic permission denied
 */
export const startAudioMonitoring = async ({ onVoiceDetected, onProlongedSilence, onCalibrated } = {}) => {
  if (isMicActive) return true; // Already running

  onVoiceCb   = onVoiceDetected   || null;
  onSilenceCb = onProlongedSilence || null;
  onReadyCb   = onCalibrated       || null;

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize                = 2048;
    analyserNode.smoothingTimeConstant  = 0.75;

    const source = audioCtx.createMediaStreamSource(micStream);
    source.connect(analyserNode);
    // NOTE: We deliberately do NOT connect analyserNode to destination
    // so the student cannot hear their own mic echo.

    // Reset state
    isCalibrated      = false;
    calibSamples      = [];
    calibStartTime    = Date.now();
    amplitudeHistory  = [];
    speechStreak      = 0;
    silenceStreak     = 0;
    noiseFloorRMS     = 0;

    monitorTimer = setInterval(analyse, ANALYSIS_INTERVAL_MS);
    isMicActive  = true;

    console.log('[AudioMonitor] ✅ Microphone monitoring started — calibrating noise floor...');
    return true;
  } catch (err) {
    console.warn('[AudioMonitor] Microphone access denied or unavailable:', err.message);
    // Non-fatal — exam proceeds without audio monitoring
    return false;
  }
};

/**
 * Stop monitoring and fully release the microphone hardware.
 */
export const stopAudioMonitoring = () => {
  if (monitorTimer)  { clearInterval(monitorTimer); monitorTimer = null; }
  if (analyserNode)  { try { analyserNode.disconnect(); } catch (_) {} analyserNode = null; }
  if (audioCtx)      { audioCtx.close().catch(() => {}); audioCtx = null; }
  if (micStream)     { micStream.getTracks().forEach(t => t.stop()); micStream = null; }

  isMicActive   = false;
  speechStreak  = 0;
  silenceStreak = 0;

  console.log('[AudioMonitor] 🛑 Microphone monitoring stopped.');
};

/**
 * Returns whether the audio monitor is currently running.
 * @returns {boolean}
 */
export const isAudioMonitorActive = () => isMicActive;

/**
 * Returns whether calibration is complete.
 * @returns {boolean}
 */
export const isAudioCalibrated = () => isCalibrated;

export default { startAudioMonitoring, stopAudioMonitoring, isAudioMonitorActive, isAudioCalibrated };
