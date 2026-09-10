const jwt = require('jsonwebtoken');

// Roles that may read or edit any student's registration (support/admin tooling).
const ADMIN_ROLES = new Set(['admin', 'moderator', 'consultant', 'college_admin']);

const bearerOrCookieToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

/**
 * Registration reads and writes are addressed by student email, so without a
 * check anyone could read or rewrite any student's record just by knowing
 * their address. Allow the request only when the caller proves they own that
 * email:
 *   - a signed-in user whose token email matches (or an admin-type role), or
 *   - the short-lived `signupToken` issued by POST /auth/verify-signup-otp,
 *     which is how the not-yet-logged-in web signup creates the record.
 *
 * `getEmail` picks the address out of the request (params, body, or query).
 * Must run after any body/multipart parser so `req.body` is populated.
 */
const registrationIdentity = (getEmail) => (req, res, next) => {
  const email = String(getEmail(req) || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const secret = process.env.JWT_SECRET;

  const signupToken = req.body?.signupToken || req.headers['x-signup-token'];
  if (signupToken) {
    try {
      const claims = jwt.verify(signupToken, secret);
      if (claims.purpose === 'signup' && String(claims.email || '').toLowerCase() === email) {
        return next();
      }
    } catch {
      // Expired or forged — fall through to the auth-token check.
    }
  }

  const authToken = bearerOrCookieToken(req);
  if (authToken) {
    try {
      const claims = jwt.verify(authToken, secret);
      if (ADMIN_ROLES.has(claims.role) || ADMIN_ROLES.has(claims.userType)) return next();
      if (String(claims.email || '').toLowerCase() === email) return next();
    } catch {
      // Invalid token — fall through.
    }
  }

  return res.status(401).json({ error: 'You are not authorised to access this registration.' });
};

module.exports = { registrationIdentity };
