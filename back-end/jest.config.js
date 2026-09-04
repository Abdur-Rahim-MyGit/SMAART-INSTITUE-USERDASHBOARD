module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'utils/escapeRegex.js',
    'utils/retry.js',
    'utils/response.js',
    'utils/activeDays.js',
    'utils/plvi.js',
    'utils/resumeSecurity.js',
    'utils/errors.js',
    'utils/courseStageDefaults.js',
    'utils/baselineUtils.js',
    'middleware/auth.js',
    'middleware/errorHandler.js',
    'middleware/sanitizeMongo.js',
    'middleware/deviceFingerprint.js',
    'middleware/roleMiddleware.js',
    'middleware/assessmentAuth.js',
    'controllers/degreeController.js',
    'controllers/streakController.js',
    'models/Badge.js',
    'models/Degree.js',
    'models/UserStreak.js',
    'models/UserAchievement.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/scripts/',
    '/logs/',
    '/uploads/',
    '/loadtest/',
    '/scratch/',
    '/testsprite_tests/',
    '/config/'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFiles: ['<rootDir>/tests/setup.js'],
  verbose: true,
  testTimeout: 10000,
  clearMocks: true
};
