const requireRole = (...allowedRoles) => {
  const roles = allowedRoles.flat().filter(Boolean);

  return (req, res, next) => {
    // Bypass for trusted admin system (used by external dashboard)
    if (req.headers['x-admin-bypass'] === 'true') {
      const adminSecret = process.env.ADMIN_SYSTEM_SECRET;
      // SECURITY: never allow the bypass when the secret is unset/empty,
      // otherwise `undefined === undefined` would grant admin to anyone.
      if (adminSecret && req.headers['x-admin-secret'] === adminSecret) {
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
