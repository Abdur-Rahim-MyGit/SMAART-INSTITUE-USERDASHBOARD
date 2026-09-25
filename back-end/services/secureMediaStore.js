/**
 * Storage for secure-mode evidence: periodic screen frames and short clips.
 *
 * This is the one place that knows where captures live. Today that is the
 * local disk under uploads/proctoring/screens/<sessionId>/, which is fine for
 * a pilot. Moving to object storage later means replacing the four functions
 * below and nothing else.
 *
 * Files are never served statically (server.js blocks /uploads/proctoring);
 * admins read them through GET /api/proctoring/screen/:sessionId/:filename.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '../uploads/proctoring/screens');

const DEFAULT_RETENTION_DAYS = parseInt(process.env.SECURE_MEDIA_RETENTION_DAYS || '90', 10);

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/webm': 'webm',
  'video/mp4': 'mp4'
};

const safeId = (id) => String(id || '').replace(/[^a-zA-Z0-9_-]/g, '');

const sessionDir = (sessionId) => path.join(ROOT, safeId(sessionId));

/**
 * @returns {{ filename: string, url: string, absolutePath: string }}
 */
const save = async (sessionId, kind, buffer, mimeType) => {
  const ext = EXT_BY_MIME[mimeType];
  if (!ext) throw new Error(`Unsupported media type ${mimeType}`);
  const dir = sessionDir(sessionId);
  await fs.promises.mkdir(dir, { recursive: true });
  const filename = `${kind}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const absolutePath = path.join(dir, filename);
  await fs.promises.writeFile(absolutePath, buffer);
  return {
    filename,
    absolutePath,
    url: `/api/proctoring/screen/${safeId(sessionId)}/${filename}`
  };
};

/** Absolute path for a stored file, or null when it does not exist. */
const resolve = (sessionId, filename) => {
  const file = path.basename(String(filename || ''));
  const abs = path.join(sessionDir(sessionId), file);
  if (!abs.startsWith(ROOT)) return null;
  return fs.existsSync(abs) ? abs : null;
};

/** Remove every capture for one session. */
const removeSession = async (sessionId) => {
  const dir = sessionDir(sessionId);
  if (!dir.startsWith(ROOT) || dir === ROOT) return false;
  await fs.promises.rm(dir, { recursive: true, force: true });
  return true;
};

/**
 * Delete session folders whose newest file is older than `days`.
 * Runs from the nightly job; returns how many folders were removed.
 */
const purgeOlderThan = async (days = DEFAULT_RETENTION_DAYS) => {
  if (!fs.existsSync(ROOT)) return { removed: 0, checked: 0 };
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const entries = await fs.promises.readdir(ROOT, { withFileTypes: true });
  let removed = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(ROOT, entry.name);
    let newest = 0;
    try {
      const files = await fs.promises.readdir(dir);
      for (const f of files) {
        const st = await fs.promises.stat(path.join(dir, f));
        newest = Math.max(newest, st.mtimeMs);
      }
      if (files.length === 0) newest = (await fs.promises.stat(dir)).mtimeMs;
    } catch {
      continue;
    }
    if (newest < cutoff) {
      await fs.promises.rm(dir, { recursive: true, force: true });
      removed += 1;
    }
  }
  return { removed, checked: entries.length };
};

const stats = async (sessionId) => {
  const dir = sessionDir(sessionId);
  if (!fs.existsSync(dir)) return { files: 0, bytes: 0 };
  const files = await fs.promises.readdir(dir);
  let bytes = 0;
  for (const f of files) {
    try { bytes += (await fs.promises.stat(path.join(dir, f))).size; } catch { /* removed meanwhile */ }
  }
  return { files: files.length, bytes };
};

module.exports = {
  ROOT,
  DEFAULT_RETENTION_DAYS,
  EXT_BY_MIME,
  save,
  resolve,
  removeSession,
  purgeOlderThan,
  stats
};
