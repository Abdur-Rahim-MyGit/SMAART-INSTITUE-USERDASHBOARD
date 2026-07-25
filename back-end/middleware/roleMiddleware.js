const crypto = require('crypto');

// Constant-time string comparison — avoids leaking the secret via response
// timing. Returns false on any type/length mismatch instead of throwing.
const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};

const requireRole = (...allowedRoles) => {
  const roles = allowedRoles.flat().filter(Boolean);

  return (req, res, next) => {
    // Bypass for the trusted admin system (the User<->Admin service interlink).
    // NOTE: this path is only as safe as ADMIN_SYSTEM_SECRET — it MUST be a
    // strong, rotated value that is never committed to the repo.
    if (req.headers['x-admin-bypass'] === 'true') {
      const adminSecret = process.env.ADMIN_SYSTEM_SECRET;
      // SECURITY: never allow the bypass when the secret is unset/empty,
      // otherwise `undefined === undefined` would grant admin to anyone.
      if (adminSecret && safeEqual(req.headers['x-admin-secret'], adminSecret)) {
        const mongoose = require('mongoose');
        req.user = {
          role: 'admin',
          roles: ['admin'],
          _id: new mongoose.Types.ObjectId(),
          id: 'admin-bypass'
        };
        return next();
      }
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userRoles = Array.isArray(user.roles)
      ? user.roles
      : user.role
        ? [user.role]
        : [];

    const hasRole = userRoles.some((role) => roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient role' });
    }

    return next();
  };
};

module.exports = { requireRole };
