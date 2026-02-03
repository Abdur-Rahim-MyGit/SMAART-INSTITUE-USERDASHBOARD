const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import logger
const logger = require('./utils/logger');

// Critical Environment Variable Check
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error(`❌ CRITICAL ERROR: Missing environment variables: ${missingEnv.join(', ')}`);
  logger.error('Please create a .env file based on .env.example');
  process.exit(1);
}

const app = express();

// Security: Set standard HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resource loading (e.g., images) across origins if needed
}));

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minds';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => logger.info('✅ MongoDB connected successfully'))
  .catch((err) => {
    logger.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Existing Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/registrations', require('./routes/registrations'));

// Academic Routes
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/results', require('./routes/results'));
app.use('/api/big5results', require('./routes/big5results'));
app.use('/api/vakresults', require('./routes/vakresults'));
app.use('/api/eqresults', require('./routes/eqresults'));
app.use('/api/cqresults', require('./routes/cqresults'));
app.use('/api/arqresults', require('./routes/arqresults'));
app.use('/api/aiqresults', require('./routes/aiqresults'));
app.use('/api/sqresults', require('./routes/sqresults'));
app.use('/api/baselineresults', require('./routes/baselineresults'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/courseEnrollments', require('./routes/courseEnrollments'));
app.use('/api/questionBanks', require('./routes/questionBanks'));


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

// Avatar System Routes (3D Level-Based Unlock System)
app.use('/api/avatar', require('./routes/avatar'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
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


// Error Handling Middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

const PORT = parseInt(process.env.PORT, 10) || 5000;
const FALLBACK_PORT = parseInt(process.env.FALLBACK_PORT, 10) || (PORT + 1);
const HOST = '0.0.0.0'; // Listen on all network interfaces for mobile access

const startServer = (port) => {
  const server = app.listen(port, HOST, () => {
    console.log('\x1b[36m%s\x1b[0m', `\n🚀 Server running: http://localhost:${port}`);
    console.log('\x1b[32m%s\x1b[0m', `   Mode: ${process.env.NODE_ENV || 'development'}\n`);
    // logger.info not used here to avoid double formatting if possible, or just use logger.info with new clean format
  });
  server.on('error', (err) => {
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

