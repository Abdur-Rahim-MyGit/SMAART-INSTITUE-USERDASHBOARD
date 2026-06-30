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
  // SECURITY: key on req.ip (which respects the configured `trust proxy` hop)
  // plus the email. The previous version read the raw X-Forwarded-For header,
  // which is fully attacker-controlled — sending a random XFF per request gave
  // each attempt a fresh bucket and completely bypassed the brute-force limit.
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
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

// AI / LLM rate limiter — caps calls to paid third-party LLM APIs (OpenRouter/
// OpenAI) to prevent runaway cost from abuse or runaway clients.
// 30 requests per 15 minutes per authenticated user (falls back to IP).
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    success: false,
    error: 'AI request limit reached. Please wait a few minutes before trying again.',
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => String(req.user?._id || req.ip || 'anonymous'),
});

// Upload limiter — caps the unauthenticated registration upload path (paid
// Cloudinary writes) to prevent denial-of-wallet abuse. 30 uploads / 15 min per IP.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many uploads. Please wait a few minutes and try again.', retryAfter: 15 },
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
  aiLimiter,
  uploadLimiter,
};
