/**
 * Safe Exam Browser (SEB) configuration builder.
 *
 * Three things live here and they must agree with each other:
 *
 *   1. buildSebSettings   — the settings dictionary for one launch.
 *   2. serializeSebFile   — that dictionary as a .seb file (plist XML, gzip,
 *                           "plnd" prefix, gzip again — the format the SEB
 *                           Config Tool writes for an unencrypted file).
 *   3. computeConfigKey   — the SEB "Config Key": SHA-256 of the settings
 *                           serialised as compact JSON with keys sorted
 *                           case-insensitively and `originatorVersion`
 *                           removed. SEB derives the same key from the file
 *                           it loaded and sends
 *                           X-SafeExamBrowser-ConfigKeyHash =
 *                           SHA-256(requestUrl + configKey) on every request.
 *
 * Keep the dictionary to documented SEB keys only. The key is computed over
 * everything in the file, so an unknown key that one platform drops before
 * hashing would make the server and the browser disagree.
 */

const crypto = require('crypto');
const zlib = require('zlib');

const SEB_DOWNLOADS = {
  windows: 'https://safeexambrowser.org/download_en.html#Windows',
  mac: 'https://safeexambrowser.org/download_en.html#MacOSX',
  home: 'https://safeexambrowser.org/download_en.html'
};

const stripTrailingSlash = (s) => String(s || '').replace(/\/+$/, '');

/**
 * The public origin students reach the app on. Set SECURE_PUBLIC_URL when the
 * API is served on a different host from the front end (Vercel + Render);
 * otherwise FRONTEND_URL, then the origin of the current request.
 */
const publicAppOrigin = (req) => {
  const fromEnv = process.env.SECURE_PUBLIC_URL || process.env.FRONTEND_URL || process.env.APP_URL;
  if (fromEnv) return stripTrailingSlash(fromEnv.split(',')[0].trim());
  if (req) return `${req.protocol}://${req.get('host')}`;
  return 'http://localhost:8080';
};

/** The origin the API itself is reached on (where SEB downloads the .seb). */
const apiOrigin = (req) => {
  const fromEnv = process.env.SECURE_API_URL || process.env.BACKEND_URL;
  if (fromEnv) return stripTrailingSlash(fromEnv);
  if (req) return `${req.protocol}://${req.get('host')}`;
  return 'http://localhost:5000';
};

const hostOf = (url) => {
  try { return new URL(url).host; } catch { return ''; }
};

/** SHA-256, uppercase hex — the form SEB stores hashed passwords in. */
const hashPassword = (plain) =>
  crypto.createHash('sha256').update(String(plain), 'utf8').digest('hex').toUpperCase();

/**
 * @param {object} opts
 * @param {object} opts.assessment  Assessment document (with secure block)
 * @param {string} opts.startUrl    where SEB lands after loading the file
 * @param {string} opts.quitUrl     navigating here makes SEB quit
 * @param {string[]} [opts.allowedHosts] hosts SEB may open besides the app
 * @param {string} [opts.quitPassword]
 */
const buildSebSettings = ({ assessment, startUrl, quitUrl, allowedHosts = [], quitPassword = '' }) => {
  const hosts = new Set();
  [startUrl, quitUrl].forEach((u) => { const h = hostOf(u); if (h) hosts.add(h); });
  allowedHosts.forEach((h) => { const clean = String(h || '').trim(); if (clean) hosts.add(hostOf(clean) || clean); });

  // Only allow rules. With URLFilterEnable on, SEB blocks any URL that no
  // rule matches, and it evaluates BLOCK rules before ALLOW rules, so a
  // catch-all block rule would block our own pages as well.
  const filterRules = [...hosts].map((host) => ({
    action: 1, // allow
    active: true,
    expression: `${host}/*`,
    regex: false
  }));

  const settings = {
    // Launch behaviour
    startURL: startUrl,
    sebConfigPurpose: 0, // 0 = start an exam with this file, 1 = configure the client
    allowQuit: true,
    quitURL: quitUrl,
    quitURLConfirm: false,
    ignoreExitKeys: true,

    // One display, kiosk-style window
    browserViewMode: 1, // fullscreen
    allowedDisplaysMaxNumber: 1,
    allowDisplayMirroring: false,
    showTaskBar: true,
    showTime: true,
    showReloadButton: true,
    browserWindowAllowReload: true,
    allowBrowsingBackForward: false,
    enablePrintScreen: false,
    allowSpellCheck: false,

    // Media the proctoring engine needs
    browserMediaCaptureCamera: true,
    browserMediaCaptureMicrophone: true,
    browserMediaCaptureScreen: true,

    // Only the app itself may be opened
    URLFilterEnable: true,
    URLFilterEnableContentFilter: false,
    URLFilterRules: filterRules,

    // Send the Config Key hash with every request so the server can verify
    // that requests really come from SEB running this file.
    sendBrowserExamKey: true,

    originatorVersion: `SMAART Institute Secure Assessment ${assessment?.assessmentCode || ''}`.trim()
  };

  if (quitPassword) settings.hashedQuitPassword = hashPassword(quitPassword);

  return settings;
};

// ── Plist XML ──────────────────────────────────────────────────────────────

const xmlEscape = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const plistValue = (value, indent) => {
  const pad = '  '.repeat(indent);
  if (value === true) return `${pad}<true/>`;
  if (value === false) return `${pad}<false/>`;
  if (typeof value === 'number') {
    return Number.isInteger(value) ? `${pad}<integer>${value}</integer>` : `${pad}<real>${value}</real>`;
  }
  if (typeof value === 'string') return `${pad}<string>${xmlEscape(value)}</string>`;
  if (value instanceof Date) return `${pad}<date>${value.toISOString().replace(/\.\d{3}Z$/, 'Z')}</date>`;
  if (Buffer.isBuffer(value)) return `${pad}<data>${value.toString('base64')}</data>`;
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}<array/>`;
    return `${pad}<array>\n${value.map((v) => plistValue(v, indent + 1)).join('\n')}\n${pad}</array>`;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    if (keys.length === 0) return `${pad}<dict/>`;
    const body = keys.map((k) => `${pad}  <key>${xmlEscape(k)}</key>\n${plistValue(value[k], indent + 1)}`).join('\n');
    return `${pad}<dict>\n${body}\n${pad}</dict>`;
  }
  return `${pad}<string></string>`;
};

const toPlistXml = (settings) =>
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
  '<plist version="1.0">\n' +
  plistValue(settings, 0) + '\n' +
  '</plist>\n';

/**
 * Unencrypted .seb file: gzip( "plnd" + gzip(plist) ).
 */
const serializeSebFile = (settings) => {
  const xml = Buffer.from(toPlistXml(settings), 'utf8');
  const inner = zlib.gzipSync(xml);
  return zlib.gzipSync(Buffer.concat([Buffer.from('plnd', 'ascii'), inner]));
};

/** Inverse of serializeSebFile, used by tests and the diagnostics endpoint. */
const parseSebFile = (buffer) => {
  const outer = zlib.gunzipSync(buffer);
  const prefix = outer.subarray(0, 4).toString('ascii');
  if (prefix !== 'plnd') throw new Error(`Unsupported .seb prefix "${prefix}"`);
  return zlib.gunzipSync(outer.subarray(4)).toString('utf8');
};

// ── Config Key ─────────────────────────────────────────────────────────────

const ciCompare = (a, b) => {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la < lb) return -1;
  if (la > lb) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
};

const configKeyJson = (value) => {
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (value === null || value === undefined) return '""';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Buffer.isBuffer(value)) return JSON.stringify(value.toString('base64'));
  if (Array.isArray(value)) return `[${value.map(configKeyJson).join(',')}]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value).filter((k) => k !== 'originatorVersion').sort(ciCompare);
    return `{${keys.map((k) => `${JSON.stringify(k)}:${configKeyJson(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
};

const computeConfigKey = (settings) =>
  crypto.createHash('sha256').update(configKeyJson(settings), 'utf8').digest('hex');

/** What SEB puts in X-SafeExamBrowser-ConfigKeyHash for a given URL. */
const expectedRequestHash = (absoluteUrl, configKey) =>
  crypto.createHash('sha256').update(String(absoluteUrl) + String(configKey), 'utf8').digest('hex');

/**
 * The URL SEB hashed: absolute, as requested, without the fragment. Behind a
 * proxy this relies on `trust proxy` (set in server.js) so protocol and host
 * are the public ones.
 */
const absoluteRequestUrl = (req) => {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl || req.url || ''}`;
  return url.split('#')[0];
};

/** https://… → sebs://…  (http → seb) */
const toSebsUrl = (httpsUrl) => String(httpsUrl).replace(/^https:\/\//i, 'sebs://').replace(/^http:\/\//i, 'seb://');

module.exports = {
  SEB_DOWNLOADS,
  publicAppOrigin,
  apiOrigin,
  buildSebSettings,
  toPlistXml,
  serializeSebFile,
  parseSebFile,
  configKeyJson,
  computeConfigKey,
  expectedRequestHash,
  absoluteRequestUrl,
  toSebsUrl,
  hashPassword
};
