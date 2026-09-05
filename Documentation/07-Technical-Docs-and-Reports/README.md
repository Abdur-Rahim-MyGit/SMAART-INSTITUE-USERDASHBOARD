# SMAART Minds Dashboard

A comprehensive learning management and assessment platform for educational institutions, featuring multi-quotient assessments, course management, and personalized learning paths.

## 🚀 Features

- **Multi-Quotient Assessment System**: IQ, EQ, SQ, AQ, CQ, PQ, FQ, LQ assessments
- **Course Management**: Create and manage courses with modules, videos, quizzes, and assignments
- **Student Dashboard**: Personalized learning experience with progress tracking
- **Teacher Portal**: Manage students, courses, and view analytics
- **College Administration**: Multi-college support with role-based access control
- **Certificate Generation**: Automated certificate generation with QR code verification
- **Vision Board**: Interactive goal-setting and visualization tools
- **AI-Powered Support**: Chatbot assistance and personalized recommendations
- **Content Moderation**: NSFW detection and text moderation

## 📋 Tech Stack

### Frontend
- **Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **3D Graphics**: Three.js + React Three Fiber

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT + OTP-based login
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Express Rate Limit
- **Logging**: Winston + Morgan

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v7.0 or higher (local or Atlas)
- **Git**: Latest version

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/minds-dashboard-v1.git
cd minds-dashboard-v1
```

### 2. Backend Setup

```bash
cd back-end

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# Required: MONGODB_URI, JWT_SECRET, SMTP credentials, Cloudinary keys
```

### 3. Frontend Setup

```bash
cd ../front-end

# Install dependencies
npm install

# Create environment file (if needed)
# VITE_API_URL=http://localhost:5000/api
```

### 4. Environment Variables

Edit `back-end/.env` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/minds
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Server
PORT=5000
NODE_ENV=development

# JWT (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google AI
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd back-end
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd front-end
npm run dev
# App runs on http://localhost:5173
```

### Production Build

**Backend:**
```bash
cd back-end
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd front-end
npm run build
npm run preview
```

## 📁 Project Structure

```
minds-dashboard-v1/
├── back-end/
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Auth, error handling, rate limiting
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── utils/             # Helper functions, logger, errors
│   ├── uploads/           # File uploads (gitignored)
│   ├── logs/              # Application logs (gitignored)
│   ├── .env.example       # Environment template
│   ├── server.js          # Entry point
│   └── package.json
│
├── front-end/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Helper functions
│   │   ├── assets/        # Images, fonts, etc.
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── public/            # Static assets
│   ├── index.html
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **OTP Verification**: Email-based OTP for login
- **Session Management**: Single-device login enforcement
- **Rate Limiting**: Protect against brute force attacks
- **Input Validation**: Express-validator for all inputs
- **Password Hashing**: Bcrypt with salt rounds
- **CORS Protection**: Configured for specific origins
- **Helmet**: Security headers
- **Account Locking**: Automatic lockout after failed attempts

## 📊 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/ID
- `POST /api/auth/verify-login-otp` - Verify OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

#### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

#### Assessments
- `GET /api/assessments` - Get all assessments
- `POST /api/results/start` - Start assessment
- `POST /api/results/submit` - Submit assessment

*For complete API documentation, see [API_DOCS.md](./API_DOCS.md)*

## 🧪 Testing

```bash
# Backend tests
cd back-end
npm test

# Frontend tests
cd front-end
npm test

# E2E tests
npm run test:e2e
```

## 📝 Logging

Application logs are stored in `back-end/logs/`:
- `error.log` - Error level logs
- `combined.log` - All logs

Log levels: `error`, `warn`, `info`, `debug`

Set log level via environment variable:
```env
LOG_LEVEL=info
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Issues
- Verify MongoDB is running: `mongod --version`
- Check connection string in `.env`
- Ensure network access if using MongoDB Atlas

### Frontend Not Connecting to Backend
- Verify backend is running on port 5000
- Check CORS configuration in `server.js`
- Verify API_URL in frontend

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Use ESLint configuration
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

- **Development Team**: SMAART Minds Development Team
- **Contact**: support@smaartminds.com

## 🔄 Version History

- **v1.0.0** (Jan 2026) - Initial release
  - Multi-quotient assessment system
  - Course management
  - Student and teacher portals
  - Certificate generation

## 📞 Support

For support, email support@smaartminds.com or create an issue in the repository.

## 🙏 Acknowledgments

- Radix UI for component primitives
- TensorFlow.js for ML capabilities
- Cloudinary for media management
- MongoDB for database
- All open-source contributors
