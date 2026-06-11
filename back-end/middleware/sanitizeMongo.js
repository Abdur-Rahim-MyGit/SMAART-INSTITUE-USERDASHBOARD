/**
 * sanitizeMongo — strips MongoDB operator-injection vectors from request input.
 *
 * Express parses `?status[$ne]=x` (or a JSON body `{ "status": { "$gt": "" } }`)
 * into a nested object. If that object is passed straight into a Mongoose query
 * filter, an attacker can inject query operators ($ne, $gt, $where, $regex, ...)
 * to bypass intended filters or exfiltrate data. This is the NoSQL analogue of
 * SQL injection.
 *
 * This middleware recursively removes any object key that begins with `$` or
 * contains a `.` from req.body, req.query, and req.params — in place — before
 * the request reaches any route handler. It is intentionally dependency-free
 * (no external package / supply-chain surface) and behaviour-preserving:
 * legitimate string/array/number values are untouched; only operator-shaped keys
 * are dropped. Safe on Express 4 where req.query/body are mutable plain objects.
 */

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    value.forEach(sanitizeValue);
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        // Drop the dangerous key entirely.
        delete value[key];
        continue;
      }
      sanitizeValue(value[key]);
    }
  }
}

module.exports = function sanitizeMongo(req, res, next) {
  if (req.body) sanitizeValue(req.body);
  if (req.query) sanitizeValue(req.query);
  if (req.params) sanitizeValue(req.params);
  next();
};
