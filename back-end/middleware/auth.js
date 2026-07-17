/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Protect middleware - verifies JWT and attaches user to request
 */
const protect = async (req, res, next) => {
  // ADMIN BYPASS - DEV ONLY (disabled in production)
  if (process.env.NODE_ENV !== 'production') {
    if (
      req.headers['x-admin-bypass'] === 'true' &&
      req.headers['x-admin-secret'] === process.env.ADMIN_SYSTEM_SECRET
    ) {
      req.user = {
        role: 'admin',
        _id: new mongoose.Types.ObjectId(),
        id: 'admin-bypass'
      };
      return next();
    }
  }

  let token;

  // Check for token in Cookie (Preferred) or Authorization header
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Determine which model to use based on userType in token
      let UserModel = User;
      const userType = decoded.userType || 'user';

      if (userType === 'student') {
        UserModel = require('../models/Student');
      } else if (userType === 'teacher') {
        UserModel = require('../models/Teacher');
      } else if (userType === 'registration') {
        // Legacy 'registration' tokens now resolve against the merged Student model.
        UserModel = require('../models/Student');
      }

      // Attach user to request (excluding password)
      req.user = await UserModel.findById(decoded.userId || decoded.id).populate('college', 'logo collegeName subscriptionPlan').select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User account not found'
        });
      }

      // SECURITY: Check if password was changed after this token was issued
      if (req.user.passwordChangedAt) {
        const changedTimestamp = parseInt(req.user.passwordChangedAt.getTime() / 1000, 10);
        if (decoded.iat < changedTimestamp) {
          return res.status(401).json({
            success: false,
            message: 'Your password was recently changed. Please login again.'
          });
        }
      }

      // SECURITY: Single Session Enforcement
      // If token has a session ID, verify it matches the user's active session
      if (decoded.sessionId) {
        if (!req.user.currentSessionId || req.user.currentSessionId !== decoded.sessionId) {
          return res.status(401).json({
            success: false,
            kicked: true,
            message: 'Session invalid or expired. You have been logged out because of a login on another device.'
          });
        }

        // SECURITY: Hard 3-hour session expiry enforcement
        if (req.user.sessionExpiresAt && new Date(req.user.sessionExpiresAt) < new Date()) {
          // Invalidate session in DB
          req.user.currentSessionId = null;
          await req.user.updateOne({ currentSessionId: null, sessionExpiresAt: null });
          return res.status(401).json({
            success: false,
            expired: true,
            message: 'Your session has expired after 3 hours. Please log in again.'
          });
        }

        // FIX: Auto-extend session if it expires within the next 30 minutes and user is active.
        // This prevents unexpected logouts when users are actively filling long forms
        // (like the Career Intelligence form which requires time to complete all 9 steps).
        const SESSION_EXTEND_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
        const SESSION_EXTENSION_MS = 3 * 60 * 60 * 1000; // extend by 3 hours
        if (req.user.sessionExpiresAt) {
          const timeUntilExpiry = new Date(req.user.sessionExpiresAt) - new Date();
          if (timeUntilExpiry > 0 && timeUntilExpiry < SESSION_EXTEND_THRESHOLD_MS) {
            // Silently extend session in the background (don't await to avoid slowing request)
            const newExpiry = new Date(Date.now() + SESSION_EXTENSION_MS);
            req.user.updateOne({ sessionExpiresAt: newExpiry }).catch(err =>
              console.warn('Session auto-extend failed (non-critical):', err.message)
            );
          }
        }
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

/**
 * Optional auth - attaches user if token present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Determine which model to use
      let UserModel = User;
      const userType = decoded.userType || 'user';
      if (userType === 'student') UserModel = require('../models/Student');
      else if (userType === 'teacher') UserModel = require('../models/Teacher');
      // Legacy 'registration' tokens now resolve against the merged Student model.
      else if (userType === 'registration') UserModel = require('../models/Student');

      req.user = await UserModel.findById(decoded.userId || decoded.id).populate('college', 'logo collegeName').select('-password');

      // SECURITY: Session Check for Optional Auth
      if (req.user && decoded.sessionId) {
        if (!req.user.currentSessionId || req.user.currentSessionId !== decoded.sessionId) {
          req.user = null; // Session invalid, treat as unauthenticated
        }
      }
    } catch (error) {
      // Token invalid, but continue without user
      req.user = null;
    }
  }

  next();
};

/**
 * protectOrBypass - allows either the trusted external admin dashboard
 * (x-admin-bypass + matching x-admin-secret) OR a normal authenticated
 * session (cookie / Bearer token via `protect`). Blocks anonymous callers.
 * Used to secure routers that are consumed by BOTH the admin dashboard and
 * logged-in users.
 */
const protectOrBypass = (req, res, next) => {
  const adminSecret = process.env.ADMIN_SYSTEM_SECRET;
  if (
    req.headers['x-admin-bypass'] === 'true' &&
    adminSecret &&
    req.headers['x-admin-secret'] === adminSecret
  ) {
    req.user = {
      role: 'admin',
      roles: ['admin'],
      _id: new mongoose.Types.ObjectId(),
      id: 'admin-bypass'
    };
    return next();
  }
  return protect(req, res, next);
};

/**
 * Role-based access control
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = { protect, optionalAuth, authorize, protectOrBypass };
