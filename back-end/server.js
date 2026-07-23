const express = require('express');

const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const { startCronJobs } = require('./utils/cronJobs');
const { initWebSocket } = require('./services/websocketService');

// Import logger
const logger = require('./utils/logger');

// Global Console Override for Production
if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => logger.info(args.join(' '));
  console.info = (...args) => logger.info(args.join(' '));
  console.warn = (...args) => logger.warn(args.join(' '));
  console.error = (...args) => logger.error(args.join(' '));
  console.debug = () => { }; // Mute debug logs entirely in production
}

// Critical Environment Variable Check
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error(`❌ CRITICAL ERROR: Missing environment variables: ${missingEnv.join(', ')}`);
  logger.error('Please create a .env file based on .env.example');
  process.exit(1);
}

const app = express();

// Trace moderation requests early to confirm routing path
app.use((req, res, next) => {
  if (req.path.includes('moderation')) {
    console.log('[SERVER] moderation request:', req.method, req.originalUrl);
  }
  next();
});

// Security: Set standard HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resource loading (e.g., images) across origins if needed
}));

// PERF: gzip responses (shrinks large JSON payloads, e.g. course lists).
// In production CloudFront/ALB also compress, but this helps direct hits too.
app.use(compression());

app.use(cookieParser()); // Parse cookies
app.use(require('./middleware/deviceFingerprint')); // Capture device info

// HTTP Request Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Trust proxy for rate limiting (needed for IPv6/proxy setups)
app.set('trust proxy', 1);

// Middleware - Allow CORS from any origin for development (mobile access)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    const isProduction = process.env.NODE_ENV === 'production';
    const frontendUrl = process.env.FRONTEND_URL;

    // Production: Strict Domain Check
    if (isProduction) {
      if (origin === frontendUrl) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }

    // Development: Allow Localhost & Local Network IPs (Mobile Testing)
    const allowedDevPatterns = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,  // Local network IPs
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,   // Private network IPs
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/, // Private network IPs
    ];

    if (allowedDevPatterns.some(pattern => pattern.test(origin))) {
      return callback(null, true);
    }

    // Block unknown origins in Dev too (to be cleaner, or allow all?)
    // User complaint was "server talks to any IP". So we restrict to local networks.
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
// Increase payload size limit for base64 images (50MB)
// SECURITY (audit HIGH): lowered from 50mb. 50mb of JSON parsed concurrently on
// a 1GB task is an easy memory-exhaustion DoS. 16mb still comfortably covers
// base64 image payloads (vision board / OCR / avatars). Tighten further with
// per-route limits if a route inventory confirms smaller is safe.
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ limit: '16mb', extended: true }));
// SECURITY: strip MongoDB operator-injection keys ($ne, $gt, $where, dotted
// paths, ...) from all request input before it reaches any query. Must run
// AFTER the body parsers so req.body is populated.
app.use(require('./middleware/sanitizeMongo'));
// PRIVACY (proctoring): webcam stills of identifiable candidates live in
// uploads/proctoring. Both static mounts below would otherwise expose them to
// anyone who guessed a filename — the second mount serves the uploads folder at
// the site root, so /proctoring/<file>.jpg worked too. Deny both spellings and
// force callers through GET /api/proctoring/snapshot/:filename, which proves
// the requester is the candidate or an admin.
app.use((req, res, next) => {
  if (/^\/(uploads\/)?proctoring(\/|$)/i.test(req.path)) {
    return res.status(403).json({
      success: false,
      error: 'Proctoring snapshots are not publicly accessible.'
    });
  }
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'uploads')));

const connectWithFallback = async () => {
  const primaryURI = process.env.MONGODB_URI;
  const fallbackURI = process.env.MONGODB_URI;

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true
  };

  try {
    await mongoose.connect(primaryURI, options);
    logger.info('✅ MongoDB connected successfully');
  } catch (err) {
    logger.error('❌ Primary MongoDB connection error:', err.message);
    if (primaryURI !== fallbackURI) {
      logger.info(`🔄 Attempting to connect to fallback MongoDB at ${fallbackURI}`);
      try {
        await mongoose.connect(fallbackURI, options);
        logger.info('✅ Fallback MongoDB connected successfully');
      } catch (fallbackErr) {
        logger.error('❌ Fallback MongoDB connection error:', fallbackErr.message);
        // Don't exit process if we can run without DB, or exit if DB is strictly required.
        // As per plan, we keep process.exit(1) if both fail.
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

connectWithFallback();

// Existing Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/security', require('./routes/security'));
app.use('/api/proctoring', require('./routes/proctoring'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/degrees', require('./routes/degrees'));
app.use('/api/resumes', require('./routes/resumes'));

// Academic Routes
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/results', require('./routes/results'));
app.use('/api/baselineresults', require('./routes/baselineresults'));
app.use('/api/stageresults', require('./routes/stageresults'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/courseEnrollments', require('./routes/courseEnrollments'));
app.use('/api/questionBanks', require('./routes/questionBanks'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/placements', require('./routes/placements'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/cgpa', require('./routes/cgpaRoutes'));

// Job Applications
app.use('/api/job-applications', require('./routes/jobApplications'));


// People Management Routes
app.use('/api/certificates', require('./routes/certificates')); // Certificate verification system
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));

// Coaching Routes
app.use('/api/coaches', require('./routes/coaches'));
app.use('/api/coachSessions', require('./routes/coachSessions'));

// Support Routes
app.use('/api/escalations', require('./routes/escalations'));
app.use('/api/tickets', require('./routes/tickets')); // Support Ticketing System
app.use('/api/chatbot', require('./routes/chatbot')); // AI Chatbot Support

// Community Routes
app.use('/api/community', require('./routes/community'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/announcements', require('./routes/announcements')); // Role-based announcements
app.use('/api/moderation', require('./routes/moderationQueue'));
app.use('/api/moderation/actions', require('./routes/moderation'));
app.use('/api/ppi', require('./routes/ppiRoutes'));
app.use('/api/user-certificates', require('./routes/userCertificates'));
app.use('/api/community-tasks-progress', require('./routes/communityTaskProgressRoutes'));

// Avatar System Routes (3D Level-Based Unlock System)
app.use('/api/avatar', require('./routes/avatar'));

// AI Career Coach Routes - Inline to avoid module loading issues
const aiCareerCoachController = require('./controllers/aiCareerCoachController');
const { protect: authMiddleware } = require('./middleware/auth');
// Cost guard for paid-LLM endpoints (OpenRouter/Anthropic). Keyed per user/IP.
const { aiLimiter } = require('./middleware/rateLimiter');

// Profile Management
app.get('/api/ai-career-coach/profile', authMiddleware, aiCareerCoachController.getProfile);
app.put('/api/ai-career-coach/profile', authMiddleware, aiCareerCoachController.updateProfile);
app.post('/api/ai-career-coach/profile/analyze', authMiddleware, aiLimiter, aiCareerCoachController.analyzeProfile);

// Career Features
app.get('/api/ai-career-coach/recommendations', authMiddleware, aiCareerCoachController.getCareerRecommendations);
app.post('/api/ai-career-coach/skill-gap', authMiddleware, aiLimiter, aiCareerCoachController.analyzeSkillGap);
app.post('/api/ai-career-coach/learning-plan', authMiddleware, aiLimiter, aiCareerCoachController.generateLearningPlan);
app.post('/api/ai-career-coach/resume', authMiddleware, aiLimiter, aiCareerCoachController.generateResume);

// Chat Features
app.post('/api/ai-career-coach/chat', authMiddleware, aiLimiter, aiCareerCoachController.chat);
app.get('/api/ai-career-coach/chat/sessions', authMiddleware, aiCareerCoachController.getChatSessions);
app.get('/api/ai-career-coach/chat/:sessionId', authMiddleware, aiCareerCoachController.getChatHistory);

logger.info('✅ AI Career Coach Routes Loaded (Inline)');

// Career Intelligence Routes (Career Data Fetcher)
const careerIntelligenceController = require('./controllers/careerIntelligenceController');
app.post('/api/career-intelligence/generate', authMiddleware, aiLimiter, careerIntelligenceController.generateCareerReport);
app.get('/api/career-intelligence/reports', authMiddleware, careerIntelligenceController.getReports);
app.get('/api/career-intelligence/latest', authMiddleware, careerIntelligenceController.getLatestReport);
app.get('/api/career-intelligence/excel-data', authMiddleware, careerIntelligenceController.getExcelData);
app.get('/api/career-intelligence/reports/:id', authMiddleware, careerIntelligenceController.getReportById);
app.delete('/api/career-intelligence/reports/:id', authMiddleware, careerIntelligenceController.deleteReport);
app.post('/api/career-intelligence/refresh-cache', authMiddleware, careerIntelligenceController.refreshExcelCache);

// Career Simulation Engine Routes (isolated, no AI cost)
const careerSimulationController = require('./controllers/careerSimulationController');
app.post('/api/career-intelligence/simulate', authMiddleware, careerSimulationController.runSimulation);
app.get('/api/career-intelligence/simulate/batches', authMiddleware, careerSimulationController.getSimulationBatches);
app.post('/api/career-intelligence/export-excel', authMiddleware, careerSimulationController.exportToExcel);

logger.info('✅ Career Intelligence Routes Loaded (Excel + AI Engine + Simulation Engine)');

// Career Agent Routes (Integrated from Career-Agent standalone system)
app.use('/api/career-agent', require('./routes/careerAgent'));
logger.info('✅ Career Agent Routes Loaded (/api/career-agent)');
// DEEP health check: report 503 if the DB is not connected, so the load
// balancer pulls an unhealthy task out of rotation instead of sending it
// traffic. mongoose.connection.readyState === 1 means "connected".
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  if (!dbConnected) {
    return res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
  res.json({ status: 'Server is running', db: 'connected' });
});

// Vision Boards Routes
app.use('/api/visionBoards', require('./routes/visionBoards'));
app.use('/api/vision-boards', require('./routes/visionBoards')); // Alternative route with hyphen
app.use('/api/vision-board', require('./routes/visionBoardRoutes')); // Basic vision board routes
app.use('/api/vision-board-pro', require('./routes/visionBoardProRoutes')); // Pro vision board routes
app.use('/api/user-vision-boards', require('./routes/userVisionBoardRoutes')); // User vision board routes

// Content Moderation Routes
app.use('/api/nsfw', require('./routes/nsfwRoutes')); // NSFW image moderation (placeholder for API)
app.use('/api/ocr', require('./routes/ocrRoutes')); // OCR text extraction using OCR.space

// Contact Form Route
app.use('/api/contact', require('./routes/contact'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/upload', require('./routes/uploadRoutes')); // New upload route
app.use('/api/badges', require('./routes/badges')); // Badges & Achievement System
app.use('/api/notifications', require('./routes/notifications')); // Notification System
app.use('/api/streaks', require('./routes/streaks')); // Streaks & Vouchers System




// Error Handling Middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

const PORT = parseInt(process.env.PORT, 10) || 5000;
const FALLBACK_PORT = parseInt(process.env.FALLBACK_PORT, 10) || (PORT + 1);
const HOST = '0.0.0.0'; // Listen on all network interfaces for mobile access

// Wrap Express in a native HTTP server so we can attach WebSockets
const httpServer = http.createServer(app);

// Attach WebSocket server (same port, path = /ws/notifications)
initWebSocket(httpServer);

const startServer = (port) => {
  httpServer.listen(port, HOST, () => {
    console.log('\x1b[36m%s\x1b[0m', `\n🚀 Server running: http://localhost:${port}`);
    console.log('\x1b[32m%s\x1b[0m', `   🔌 WebSocket: ws://localhost:${port}/ws/notifications`);
    console.log('\x1b[32m%s\x1b[0m', `   Mode: ${process.env.NODE_ENV || 'development'}\n`);
  });
  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`⚠️  Port ${port} in use, attempting fallback port ${FALLBACK_PORT}`);
      startServer(FALLBACK_PORT);
    } else {
      logger.error('❌ Server error:', err);
      process.exit(1);
    }
  });
};

startServer(PORT);
startCronJobs();

// GRACEFUL SHUTDOWN: on deploy, ECS/Docker sends SIGTERM. Stop accepting new
// connections, finish in-flight requests, close DB, then exit — so a rolling
// deploy never drops a student mid-request.
const shutdown = (signal) => {
  logger.info(`\n${signal} received — shutting down gracefully...`);
  httpServer.close(() => {
    logger.info('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      logger.info('MongoDB connection closed. Bye.');
      process.exit(0);
    }).catch(() => process.exit(0));
  });
  // Safety net: force-exit if cleanup hangs beyond 30s.
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 30000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// RESILIENCE (audit): without these, an escaped promise rejection crashes the
// whole process (Node default), and an uncaught exception leaves it dead with
// no log. Log rejections (keep serving); on a truly uncaught exception the
// state is unknown, so log and exit non-zero — ECS/Docker restarts a clean one.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection: ' + (reason && reason.stack ? reason.stack : reason));
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception: ' + (err && err.stack ? err.stack : err));
  process.exit(1);
});


