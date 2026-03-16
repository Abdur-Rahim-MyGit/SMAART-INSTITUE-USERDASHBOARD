const requireRole = (...allowedRoles) => {
  const roles = allowedRoles.flat().filter(Boolean);

  return (req, res, next) => {
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
