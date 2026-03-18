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
  // DEBUG - remove after fixing
  console.log('[AUTH] headers:', {
    bypass: req.headers['x-admin-bypass'],
    secret: req.headers['x-admin-secret'],
    secretMatch: req.headers['x-admin-secret'] === process.env.ADMIN_SYSTEM_SECRET
  });

  // ADMIN BYPASS - must be first
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

  // Honor pre-populated admin bypass user (e.g., set by upstream middleware)
  if (req.user && req.user.id === 'admin-bypass') {
    return next();
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
        UserModel = require('../models/Registration');
      }

      // Attach user to request (excluding password)
      req.user = await UserModel.findById(decoded.userId || decoded.id).select('-password');

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
            message: 'Session invalid or expired. You have been logged out because of a login on another device.'
          });
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
      else if (userType === 'registration') UserModel = require('../models/Registration');

      req.user = await UserModel.findById(decoded.userId || decoded.id).select('-password');

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

module.exports = { protect, optionalAuth, authorize };
