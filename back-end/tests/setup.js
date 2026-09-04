// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-testing-32-chars';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smaart_test_unit';
process.env.PORT = '5001';
process.env.ADMIN_SYSTEM_SECRET = 'test-admin-secret';
process.env.USERDASHBOARD_SYNC_TOKEN = 'test-sync-token';
process.env.FRONTEND_URL = 'http://localhost:8080';

// Mock winston file writing during tests to avoid log spam
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn()
  }
}));

// Global safety stubs for third-party network services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-mail-id' })
  })
}), { virtual: true });

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'https://mock.cloudinary.com/img.png' }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
  }
}), { virtual: true });

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({})
}), { virtual: true });

