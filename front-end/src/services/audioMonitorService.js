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
// ── Gate 1: is there sound above this room's own noise floor? ───────────────
// This was an ABSOLUTE delta of 0.010 linear RMS, which quietly assumed a
// particular microphone sensitivity and seating distance. voiceBandRMS returns
// linear amplitude converted from dB, so ordinary speech lands around 0.01-0.04
// depending on the mic — on a quiet laptop mic the entire speech signal is
// SMALLER than the threshold it had to exceed, and no amount of talking could
// ever open the gate.
//
// A ratio against the room's own calibrated floor is scale-free: it means "half
// again as loud as this room normally is", which is true of speech on any mic.
// The tiny absolute floor only stops digital silence from qualifying.
const ENERGY_RATIO_THRESHOLD     = 1.5;
const ENERGY_ABSOLUTE_FLOOR      = 0.0015;
const ENERGY_DELTA_THRESHOLD     = 0.010;  // legacy, kept for the diagnostics readout
const SFM_VOICE_THRESHOLD        = 0.5;    // SFM below this → peaked spectrum → possible voice (speech usually 0.2-0.6)
// ── Gate 3: is the amplitude moving the way speech moves? ──────────────────
// Raw variance was the wrong statistic twice over. It is in SQUARED amplitude
// units, so for speech hovering near 0.03 RMS the variance is around 0.00005 —
// ten times below the 0.0005 it was asked to beat. Reaching that threshold
// would need the level to swing by more than the entire signal.
//
// It was also scale-dependent in the same way as gate 1: speak quietly, or sit
// further from the mic, and the variance falls even though the RHYTHM is
// identical. Rhythm is a shape, not a level.
//
// The coefficient of variation (standard deviation / mean) measures that shape
// directly and cancels the scale. Steady sources — a fan, an air conditioner,
// road hum — sit near 0.05. Speech, including continuous speech, modulates at
// the syllable rate and sits well above 0.2.
const SPEECH_CV_THRESHOLD        = 0.15;

// Ceiling on the calibrated noise floor. Above this the monitor is effectively
// deaf, and being slightly over-sensitive beats hearing nothing at all.
const NOISE_FLOOR_MAX            = 0.02;

// The room gets quieter than the calibration window suggested — someone stopped
// typing, the corridor emptied. Track the quietest level seen recently and let
// the floor follow it down, so one noisy moment at the start does not deafen
// the monitor for the whole exam.
const FLOOR_ADAPT_WINDOW         = 300;   // sub-frames (~30 s)
const FLOOR_ADAPT_RATE           = 0.1;   // how far to move toward the new low

// Below this the input is digital silence, not a quiet room.
const DEAD_MIC_RMS               = 0.00005;
const DEAD_MIC_FRAMES            = 30;    // ~3 s of it before we say so
const VARIANCE_VOICE_THRESHOLD   = 0.0005; // legacy, kept for the diagnostics readout
const SPEECH_SECONDS_TO_REPORT   = 5;      // Consecutive "speech" seconds before violation
const SILENCE_SECONDS_TO_REPORT  = 60;     // 1 minute of silence before violation

// ── Sampling cadence ─────────────────────────────────────────────────────────
// The monitor used to analyse ONE 2048-sample FFT frame per second. At 44.1 kHz
// that is 46 ms of audio out of every 1000 — it heard under 5% of the exam and
// then demanded five consecutive such seconds before reporting. Ordinary
// talking fell straight through the 954 ms gaps, which is why sustained speech
// was routinely missed.
//
// Now we sample ten times a second and fold the sub-frames into one decision
// per second, so a second is judged on ~50% of its audio instead of 4.6%.
const SUBFRAME_INTERVAL_MS       = 100;    // Sample the analyser this often
const SUBFRAMES_PER_SECOND       = 10;     // Sub-frames folded into one decision
// Fraction of a second's sub-frames that must look like speech for the second
// to count as speech. Speech is not continuous — it has gaps between words and
// stop consonants — so requiring every sub-frame would never fire.
const SPEECH_SUBFRAME_FRACTION   = 0.35;

// 2 s of amplitude history at the sub-frame rate. The header describes a
// "2-second window"; at the old 1 Hz cadence these 8 samples actually spanned
// 8 seconds, far too long to see syllabic rhythm (~200 ms per syllable).
const VARIANCE_WINDOW_SAMPLES    = 20;

// ─── Multiple-speaker heuristic ──────────────────────────────────────────────
// Two people in a room speak at different fundamental pitches. We track the
// dominant pitch of each speech second and look for two clusters that are far
// enough apart that one throat cannot produce both.
//
// Deliberately conservative: accusing a candidate of having someone else in the
// room is a serious claim, so the separation and the evidence count are both
// set well beyond normal intonation. A single voice moving up and down a
// sentence does not clear this bar; two alternating voices do.
const PITCH_MIN_HZ               = 85;    // Below this is not a human fundamental
const PITCH_MAX_HZ               = 320;   // Above this is not a fundamental either
const PITCH_CLUSTER_SEPARATION_HZ = 60;   // Two clusters must differ by at least this
const PITCH_SAMPLES_PER_CLUSTER  = 3;     // Each cluster needs this many seconds of speech
const PITCH_WINDOW_SAMPLES       = 20;    // Rolling window of recent speech pitches
const PITCH_MIN_MAGNITUDE        = 90;   // Byte-spectrum magnitude below this is room noise

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

// Sub-frame buffers, flushed once per second by analyse().
let subFrameSpeech = [];
let subFrameRms    = [];

// Diagnostics state — see __proctorAudio at the bottom of this file.
let audioDebug      = false;
let lastDebugLogAt  = 0;
let lastGates       = null;
let calibratedAt    = 0;
let floorWindow     = [];
let silentFrames    = 0;
let micHealthy      = true;

// How long after calibration the gates log without being asked.
const AUTO_DIAGNOSTIC_MS = 30 * 1000;

// Streak counters
let speechStreak    = 0;
let silenceStreak   = 0;
let pitchHistory    = [];
let multiVoiceReported = false;

// External callbacks
let onVoiceCb       = null;
let onVoicesCb      = null;
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
 * RMS of the actual WAVEFORM over the analyser's current window.
 *
 * Amplitude was previously derived from getFloatFrequencyData — the FFT
 * magnitudes — which is wrong for this job in two ways.
 *
 * First, those magnitudes pass through `smoothingTimeConstant`, which blends
 * each reading into the ones before it. The rhythm gate exists precisely to
 * measure how much the level moves between readings, so smoothing it first
 * removes the very signal being tested; continuous speech came out looking as
 * steady as a fan.
 *
 * Second, averaging magnitude across ~700 bins of an 8192-point FFT is
 * dominated by the near-empty bins between formants, which crushes the dynamic
 * range: real speech landed only just above the noise floor instead of well
 * clear of it.
 *
 * Time-domain RMS is the true signal level, is untouched by smoothing, and is
 * what an amplitude envelope actually means.
 */
const waveformRMS = (analyser) => {
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);

  let sumSq = 0;
  for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
  return Math.sqrt(sumSq / buf.length);
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

  // Measure flatness ACROSS THE VOICE BAND ONLY.
  //
  // This previously ran over every bin up to Nyquist — around 22 kHz. Almost
  // all of that is empty air well above anything a human throat produces, and
  // those thousands of near-silent bins swamped the statistic, so the number
  // described the room's high-frequency emptiness rather than whether the sound
  // in front of the mic had the peaked structure of speech. Restricted to
  // 85-4000 Hz it measures what its name claims.
  const nyquist = analyser.context.sampleRate / 2;
  const minBin = Math.max(1, Math.floor((VOICE_BAND_MIN_HZ / nyquist) * buf.length));
  const maxBin = Math.min(buf.length - 1, Math.ceil((VOICE_BAND_MAX_HZ / nyquist) * buf.length));

  let logSum = 0, linSum = 0, count = 0;
  for (let i = minBin; i <= maxBin; i++) {
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
const rollingStats = (newSample) => {
  amplitudeHistory.push(newSample);
  if (amplitudeHistory.length > VARIANCE_WINDOW_SAMPLES) {
    amplitudeHistory.shift();
  }
  if (amplitudeHistory.length < 3) return { variance: 0, cv: 0 };

  const n = amplitudeHistory.length;
  const mean = amplitudeHistory.reduce((a, b) => a + b, 0) / n;
  const variance = amplitudeHistory.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;

  // Coefficient of variation — spread expressed as a fraction of the level, so
  // it says the same thing whether the speaker is loud or quiet.
  const cv = mean > 1e-9 ? Math.sqrt(variance) / mean : 0;
  return { variance, cv };
};

/**
 * Dominant fundamental frequency of the current frame, or null when the peak
 * does not sit in the range a human fundamental can occupy.
 */
const HPS_HARMONICS = 4;   // Number of downsampled copies multiplied together

const dominantPitchHz = (analyser) => {
  const bins = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(bins);

  const nyquist = (audioCtx?.sampleRate || 44100) / 2;
  const hzPerBin = nyquist / bins.length;
  const first = Math.max(1, Math.floor(PITCH_MIN_HZ / hzPerBin));
  const last = Math.min(bins.length - 1, Math.ceil(PITCH_MAX_HZ / hzPerBin));
  if (last <= first) return null;

  // ── Harmonic Product Spectrum ────────────────────────────────────────────
  // Picking the loudest bin in the 85–320 Hz band is not pitch detection. On a
  // voiced sound the fundamental is frequently WEAKER than its own harmonics —
  // laptop and headset mics roll off hard below 200 Hz, so the second harmonic
  // usually wins the peak contest. The old detector therefore reported roughly
  // 2*F0 for some speakers and F0 for others, and the "two distinct voices"
  // clustering was really clustering that inconsistency, not two people.
  //
  // HPS multiplies the spectrum by decimated copies of itself. Every harmonic
  // of the true fundamental lands on the fundamental's bin in some copy, so the
  // product reinforces F0 and suppresses everything else.
  let bestBin = -1;
  let bestScore = 0;
  let peakMagnitude = 0;

  for (let i = first; i <= last; i++) {
    let product = 1;
    for (let h = 1; h <= HPS_HARMONICS; h++) {
      const bin = i * h;
      if (bin >= bins.length) { product = 0; break; }
      // +1 keeps a single quiet harmonic from zeroing the whole product.
      product *= (bins[bin] + 1);
    }
    if (product > bestScore) {
      bestScore = product;
      bestBin = i;
      peakMagnitude = bins[i];
    }
  }

  if (bestBin < 0) return null;

  // A weak peak is room noise, not a voiced sound. Compared against the raw
  // magnitude at the chosen bin, not the HPS product, so the meaning of the
  // threshold does not change with HPS_HARMONICS.
  if (peakMagnitude < PITCH_MIN_MAGNITUDE) return null;

  return bestBin * hzPerBin;
};

/**
 * True when recent speech pitches fall into two well-separated groups, each
 * with enough samples to rule out a single speaker's intonation.
 */
const hasTwoDistinctVoices = () => {
  if (pitchHistory.length < PITCH_SAMPLES_PER_CLUSTER * 2) return false;

  const sorted = [...pitchHistory].sort((a, b) => a - b);

  // Find the widest gap between consecutive pitches; that is the only place
  // two clusters could split.
  let splitIndex = -1;
  let widestGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > widestGap) {
      widestGap = gap;
      splitIndex = i;
    }
  }

  if (widestGap < PITCH_CLUSTER_SEPARATION_HZ) return false;

  const lower = sorted.slice(0, splitIndex);
  const upper = sorted.slice(splitIndex);
  return lower.length >= PITCH_SAMPLES_PER_CLUSTER && upper.length >= PITCH_SAMPLES_PER_CLUSTER;
};

// ─── Core Analysis Loop ──────────────────────────────────────────────────────

const analyse = () => {
  if (!analyserNode) return;

  const rms = waveformRMS(analyserNode);
  const now = Date.now();

  // ── Phase 1: Calibration ────────────────────────────────────────────────
  if (!isCalibrated) {
    calibSamples.push(rms);
    if (now - calibStartTime >= CALIBRATION_DURATION_MS) {
      // Use 80th percentile of calibration samples as noise floor
      // (ignores brief spikes during the calibration window)
      // The noise floor is meant to be the room's QUIET baseline, so it must
      // come from a LOW percentile. This took the 80th — a near-maximum — so a
      // single loud moment in the calibration window (a click, a chair, someone
      // speaking, the exam starting) set the bar at that level and speech could
      // never beat 1.5x it afterwards. Observed in the field at 0.0523, which
      // demanded 0.0785 to register: louder than shouting.
      const sorted     = [...calibSamples].sort((a, b) => a - b);
      const p20index   = Math.floor(sorted.length * 0.2);
      const measured   = sorted[p20index] || 0;

      // A hard ceiling as well. If calibration still lands somewhere silly, an
      // over-sensitive monitor is a far better failure than a deaf one.
      noiseFloorRMS    = Math.min(measured, NOISE_FLOOR_MAX);
      isCalibrated     = true;
      calibratedAt     = now;
      console.log(
        `[AudioMonitor] ✅ Noise floor calibrated: ${noiseFloorRMS.toFixed(5)} RMS ` +
        `from ${calibSamples.length} samples. Speech must exceed ` +
        `${Math.max(noiseFloorRMS * ENERGY_RATIO_THRESHOLD, ENERGY_ABSOLUTE_FLOOR).toFixed(5)}. ` +
        `Logging gates for the next ${AUTO_DIAGNOSTIC_MS / 1000}s — say something.`
      );
      onReadyCb?.();
    }
    return; // Do not start flagging until calibration is complete
  }

  // ── Phase 2: Triple-gate voice detection ────────────────────────────────

  // ── Adapt the floor downward ────────────────────────────────────────────
  // Follow the room if it turns out to be quieter than calibration suggested.
  // Only ever downward: letting it rise would let a talking candidate raise the
  // bar until they could not be heard.
  floorWindow.push(rms);
  if (floorWindow.length > FLOOR_ADAPT_WINDOW) floorWindow.shift();
  if (floorWindow.length >= FLOOR_ADAPT_WINDOW) {
    const quietest = Math.min(...floorWindow);
    if (quietest < noiseFloorRMS) {
      noiseFloorRMS += (quietest - noiseFloorRMS) * FLOOR_ADAPT_RATE;
    }
  }

  // ── Is the microphone actually delivering audio? ────────────────────────
  // A live mic always carries some room tone. Sustained digital silence means
  // the track died, another application took the device exclusively, or the
  // default input changed under us (plugging in a headset mid-exam does this).
  // Without this the panel reported a healthy "listening" mic that was in fact
  // sending nothing at all.
  if (rms < DEAD_MIC_RMS) silentFrames++; else silentFrames = 0;
  const track = micStream?.getAudioTracks?.()[0];
  micHealthy = !!track && track.readyState === 'live' && !track.muted
    && silentFrames < DEAD_MIC_FRAMES;

  // Gate 1: Is there sound clearly above THIS room's own noise floor?
  const energyAboveFloor =
    rms > Math.max(noiseFloorRMS * ENERGY_RATIO_THRESHOLD, ENERGY_ABSOLUTE_FLOOR);

  // Gate 2: Is the spectrum peaked (voice formants) rather than flat (fan)?
  const sfm              = spectralFlatness(analyserNode);
  const isSpectrallyPeaked = sfm < SFM_VOICE_THRESHOLD;

  // Gate 3: Is the level moving the way speech moves, at any volume?
  const { variance, cv } = rollingStats(rms);
  const isRhythmic       = cv > SPEECH_CV_THRESHOLD;

  const isSpeechFrame = energyAboveFloor && isSpectrallyPeaked && isRhythmic;

  // ── Diagnostics ─────────────────────────────────────────────────────────
  // Three gates must agree before a sub-frame counts as speech, and when voice
  // detection "doesn't work" the only useful question is WHICH gate is saying
  // no. Turn this on from the console with __proctorAudio.debug(true), talk
  // normally, and read which column stays false.
  lastGates = {
    rms, noiseFloor: noiseFloorRMS, sfm, variance, cv,
    energyRequired: Math.max(noiseFloorRMS * ENERGY_RATIO_THRESHOLD, ENERGY_ABSOLUTE_FLOOR),
    energyAboveFloor, isSpectrallyPeaked, isRhythmic, isSpeechFrame,
  };
  // For the first stretch after calibration the gates are logged unconditionally.
  // "Voice detection doesn't work" is impossible to act on; "energy PASS, sfm
  // PASS, cv fail" is a one-line fix. Requiring someone to know a console
  // incantation before they can see that is a bad trade during setup.
  const inAutoWindow = now - (calibratedAt || now) < AUTO_DIAGNOSTIC_MS;

  if ((audioDebug || inAutoWindow) && now - lastDebugLogAt >= 1000) {
    lastDebugLogAt = now;
    console.log(
      `[AudioMonitor] rms=${rms.toFixed(4)} (floor ${noiseFloorRMS.toFixed(4)}) ` +
      `| energy ${energyAboveFloor ? 'PASS' : 'fail'} ` +
      `| sfm=${sfm.toFixed(3)} ${isSpectrallyPeaked ? 'PASS' : 'fail'} (<${SFM_VOICE_THRESHOLD}) ` +
      `| cv=${cv.toFixed(3)} ${isRhythmic ? 'PASS' : 'fail'} (>${SPEECH_CV_THRESHOLD}) ` +
      `| speech=${isSpeechFrame} streak=${speechStreak}/${SPEECH_SECONDS_TO_REPORT}`
    );
  }

  // ── Fold sub-frames into one decision per second ────────────────────────
  // Each sub-frame is a 100 ms observation; a second is judged on all ten.
  subFrameSpeech.push(isSpeechFrame);
  subFrameRms.push(rms);
  if (subFrameSpeech.length < SUBFRAMES_PER_SECOND) return;

  const speechFrames = subFrameSpeech.filter(Boolean).length;
  const isSpeech = (speechFrames / subFrameSpeech.length) >= SPEECH_SUBFRAME_FRACTION;
  // Represent the second by its median energy so one door-slam cannot make an
  // otherwise silent second look occupied.
  const secondRms = [...subFrameRms].sort((a, b) => a - b)[Math.floor(subFrameRms.length / 2)] ?? rms;
  subFrameSpeech = [];
  subFrameRms = [];

  if (isSpeech) {
    speechStreak++;
    silenceStreak = 0;

    // Collect the pitch of each speech second and test for a second speaker.
    const pitch = dominantPitchHz(analyserNode);
    if (pitch) {
      pitchHistory.push(pitch);
      if (pitchHistory.length > PITCH_WINDOW_SAMPLES) pitchHistory.shift();

      if (!multiVoiceReported && hasTwoDistinctVoices()) {
        multiVoiceReported = true;
        console.log('[AudioMonitor] 🗣️🗣️ Two distinct speaker pitches detected.');
        onVoicesCb?.();
      }
    }
    if (speechStreak >= SPEECH_SECONDS_TO_REPORT) {
      speechStreak = 0;
      onVoiceCb?.();
    }
  } else if (secondRms < (noiseFloorRMS + 0.005)) {
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
 *   onMultipleVoices: Function,  – called once two distinct speaker pitches are heard
 *   onProlongedSilence: Function, – called after SILENCE_SECONDS_TO_REPORT of near-silence
 *   onCalibrated: Function,     – called once baseline noise calibration is done
 * }} callbacks
 * @returns {Promise<boolean>} true if started, false if mic permission denied
 */
export const startAudioMonitoring = async ({ onVoiceDetected, onMultipleVoices, onProlongedSilence, onCalibrated } = {}) => {
  if (isMicActive) return true; // Already running

  onVoiceCb   = onVoiceDetected   || null;
  onSilenceCb = onProlongedSilence || null;
  onReadyCb   = onCalibrated       || null;
  onVoicesCb  = onMultipleVoices   || null;

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
    analyserNode = audioCtx.createAnalyser();
    // 8192-point FFT → ~5.4 Hz bins at 44.1 kHz. At the previous 2048 the bins
    // were ~21.5 Hz wide, so the entire 85–320 Hz fundamental range spanned
    // about eleven of them while PITCH_CLUSTER_SEPARATION_HZ asks for a 60 Hz
    // gap — under three bins. Two speakers could not be resolved even in
    // principle. This is the single change that makes multiple_voices possible.
    analyserNode.fftSize                = 8192;
    // Heavy smoothing (0.75) averaged each reading into the ones before it,
    // blurring exactly the short-term spectral change that separates speech
    // from steady fan noise. Light smoothing keeps sub-frames independent.
    // No smoothing. It only affects the frequency data (used for spectral
    // flatness and pitch), and both want the current frame rather than a blend
    // with previous ones.
    analyserNode.smoothingTimeConstant  = 0;

    const source = audioCtx.createMediaStreamSource(micStream);
    source.connect(analyserNode);
    // NOTE: We deliberately do NOT connect analyserNode to destination
    // so the student cannot hear their own mic echo.

    // Reset state
    isCalibrated      = false;
    calibSamples      = [];
    calibStartTime    = Date.now();
    amplitudeHistory  = [];
    subFrameSpeech    = [];
    subFrameRms       = [];
    floorWindow       = [];
    silentFrames      = 0;
    micHealthy        = true;
    speechStreak      = 0;
    silenceStreak     = 0;
    noiseFloorRMS     = 0;
    pitchHistory      = [];
    multiVoiceReported = false;

    monitorTimer = setInterval(analyse, SUBFRAME_INTERVAL_MS);
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
  pitchHistory  = [];
  multiVoiceReported = false;

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

// ─── Console diagnostics ─────────────────────────────────────────────────────
/**
 * Why voice detection is or is not firing, readable from the browser console.
 *
 *   __proctorAudio.debug(true)   // stream the three gates once a second
 *   __proctorAudio.state()       // one snapshot, plus the current thresholds
 *   __proctorAudio.recalibrate() // redo the noise floor (use in a QUIET room)
 *
 * The most common cause of "it never fires" is a noise floor calibrated while
 * someone was talking: the first three seconds set the bar, and if they were
 * noisy the bar ends up above normal speech. recalibrate() in silence fixes it.
 */
/** Latest gate readings without logging — for the on-screen diagnostics panel. */
export const getLastGates = () => (lastGates ? { ...lastGates, calibrated: isCalibrated, micActive: isMicActive, micHealthy, speechStreak, speechSecondsToReport: SPEECH_SECONDS_TO_REPORT } : { calibrated: isCalibrated, micActive: isMicActive, micHealthy, speechStreak, speechSecondsToReport: SPEECH_SECONDS_TO_REPORT });

export const audioDiagnostics = {
  debug(on = true) {
    audioDebug = !!on;
    console.log(`[AudioMonitor] Gate logging ${audioDebug ? 'ON' : 'OFF'}.`);
  },
  state() {
    const snapshot = {
      micActive: isMicActive,
      calibrated: isCalibrated,
      noiseFloorRMS,
      speechStreak,
      silenceStreak,
      pitchesCollected: pitchHistory.length,
      thresholds: {
        energyRatioAboveFloor: ENERGY_RATIO_THRESHOLD,
        energyAbsoluteFloor: ENERGY_ABSOLUTE_FLOOR,
        sfmBelow: SFM_VOICE_THRESHOLD,
        cvAbove: SPEECH_CV_THRESHOLD,
        speechSecondsToReport: SPEECH_SECONDS_TO_REPORT,
        subframeFraction: SPEECH_SUBFRAME_FRACTION,
      },
      lastFrame: lastGates,
    };
    console.log(snapshot);
    return snapshot;
  },
  recalibrate() {
    if (!isMicActive) {
      console.warn('[AudioMonitor] Microphone is not active.');
      return;
    }
    isCalibrated   = false;
    calibSamples   = [];
    calibStartTime = Date.now();
    console.log(`[AudioMonitor] Recalibrating noise floor — stay quiet for ${CALIBRATION_DURATION_MS / 1000}s.`);
  },
};

if (typeof window !== 'undefined') {
  window.__proctorAudio = audioDiagnostics;
}
