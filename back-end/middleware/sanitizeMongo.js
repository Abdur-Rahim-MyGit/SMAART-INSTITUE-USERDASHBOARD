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

// SECURITY (audit): bound recursion depth so a deeply-nested JSON body cannot
// blow the call stack (RangeError → 500 DoS). Real inputs are shallow; anything
// past the limit is left as-is (it still can't reach a query as an operator key
// because parents were already sanitized).
const MAX_DEPTH = 32;

function sanitizeValue(value, depth) {
  if (depth > MAX_DEPTH) return;
  if (Array.isArray(value)) {
    value.forEach((v) => sanitizeValue(v, depth + 1));
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        // Drop the dangerous key entirely.
        delete value[key];
        continue;
      }
      sanitizeValue(value[key], depth + 1);
    }
  }
}

module.exports = function sanitizeMongo(req, res, next) {
  if (req.body) sanitizeValue(req.body, 0);
  if (req.query) sanitizeValue(req.query, 0);
  if (req.params) sanitizeValue(req.params, 0);
  next();
};
