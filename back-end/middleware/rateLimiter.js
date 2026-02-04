/**
 * Rate Limiting Middleware for Security-Sensitive Endpoints
 * Protects against brute-force attacks on login, OTP, and password reset flows
 */
const rateLimit = require('express-rate-limit');

// Login rate limiter - 15 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login requests per windowMs
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + email for more granular limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const email = req.body?.email?.toLowerCase() || 'unknown';
    return `${ip}-${email}`;
  },
  validate: {
    xForwardedForHeader: false,
    trustProxy: false,
    ip: false,
    keyGeneratorIpFallback: false
  }
});

// OTP verification rate limiter - 15 attempts per 5 minutes
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15,
  message: {
    error: 'Too many OTP attempts. Please try again in 5 minutes.',
    retryAfter: 5
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset rate limiter - 3 attempts per hour
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many password reset requests. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// College search rate limiter - 30 requests per minute (anti-enumeration)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: 'Too many search requests. Please slow down.',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter - 100 requests per minute
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  otpLimiter,
  passwordResetLimiter,
  searchLimiter,
  generalLimiter
};
