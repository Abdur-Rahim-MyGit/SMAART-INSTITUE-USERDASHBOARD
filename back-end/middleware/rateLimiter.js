/**
 * Rate Limiting Middleware for Security-Sensitive Endpoints
 * Protects against brute-force attacks on login, OTP, and password reset flows
 */
const rateLimit = require('express-rate-limit');

// Login rate limiter - 15 attempts per 15 minutes per IP+email
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 15 : 200,
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  // Use X-Forwarded-For (set by proxy) when available, fall back to direct IP
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.ip
      || req.connection.remoteAddress
      || 'unknown';
    const email = req.body?.email?.toLowerCase() || 'unknown';
    return `${ip}-${email}`;
  }
});

// OTP verification rate limiter - 15 attempts per 5 minutes
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'production' ? 15 : 200,
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
  max: process.env.NODE_ENV === 'production' ? 3 : 200,
  message: {
    error: 'Too many password reset requests. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// College search rate limiter - 100 requests per minute (increased for development)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Too many search requests. Please slow down.',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter - 1000 requests per minute (increased for development)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Resume PDF export — 3 exports per hour per authenticated user
const resumeExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: 'Resume export limit reached. You can generate up to 3 PDFs per hour.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => String(req.user?._id || req.ip || 'anonymous'),
});

module.exports = {
  loginLimiter,
  otpLimiter,
  passwordResetLimiter,
  searchLimiter,
  generalLimiter,
  resumeExportLimiter,
};
