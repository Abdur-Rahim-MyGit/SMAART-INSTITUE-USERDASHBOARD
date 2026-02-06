# AI Career Coach - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890",
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "careerStage": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer TOKEN
```

---

## 👤 Profile Endpoints

### Get Profile
```http
GET /profile
Authorization: Bearer TOKEN
```

### Create/Update Profile
```http
POST /profile
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "education": [
    {
      "degree": "Bachelor of Science",
      "institution": "Stanford University",
      "fieldOfStudy": "Computer Science",
      "startYear": 2018,
      "endYear": 2022,
      "grade": "3.8 GPA"
    }
  ],
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Software Engineer",
      "startDate": "2022-06-01",
      "current": true,
      "description": "Building web applications",
      "achievements": ["Increased performance by 40%"],
      "skills": ["React", "Node.js"]
    }
  ],
  "skills": [
    {
      "name": "JavaScript",
      "level": 8,
      "category": "technical"
    },
    {
      "name": "React",
      "level": 7,
      "category": "technical"
    }
  ],
  "interests": ["Web Development", "AI", "Cloud Computing"],
  "careerGoals": {
    "shortTerm": "Become a senior developer",
    "longTerm": "Lead a tech team",
    "targetRoles": ["Full Stack Developer", "Tech Lead"],
    "targetIndustries": ["Tech", "Startups"]
  },
  "constraints": {
    "preferredLocations": ["San Francisco", "Remote"],
    "salaryExpectation": {
      "min": 100000,
      "max": 150000,
      "currency": "USD"
    },
    "workType": "hybrid",
    "availability": "immediate"
  }
}
```

### Analyze Profile with AI
```http
POST /profile/analyze
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "careerStage": "junior",
    "analysis": {
      "strengths": [
        {
          "skill": "JavaScript",
          "evidence": "Strong proficiency demonstrated",
          "score": 8
        }
      ],
      "weaknesses": [
        {
          "skill": "System Design",
          "severity": "moderate",
          "recommendation": "Take a system design course"
        }
      ],
      "recommendedPaths": [
        {
          "role": "Full Stack Developer",
          "matchScore": 85,
          "reasoning": "Your skills align well with this role"
        }
      ]
    }
  }
}
```

---

## 🤖 AI Endpoints

### Chat with AI Coach
```http
POST /ai/chat
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "message": "How do I transition into data science?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "To transition into data science, I recommend...",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Get Career Recommendations
```http
GET /ai/recommendations
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "role": "Data Scientist",
        "matchScore": 78,
        "reasoning": "Your analytical skills are strong",
        "timeline": "8-12 months",
        "nextSteps": ["Learn Python", "Study statistics"]
      }
    ]
  }
}
```

### Generate Learning Plan
```http
POST /ai/learning-plan
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "targetRole": "Backend Developer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": [
      {
        "month": 1,
        "focus": "Node.js Fundamentals",
        "skills": ["JavaScript", "Node.js", "Express"],
        "courses": [
          {
            "title": "Node.js Complete Guide",
            "platform": "Udemy",
            "duration": "40 hours"
          }
        ],
        "projects": [
          {
            "title": "Build a REST API",
            "description": "Create a full CRUD API"
          }
        ],
        "milestones": ["Complete Node.js basics", "Build first API"]
      }
    ],
    "estimatedTimeToReady": "6 months",
    "keyPriorities": ["Master Node.js", "Learn databases"]
  }
}
```

### Analyze Skill Gap
```http
POST /ai/skill-gap
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "roleId": "role_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "Full Stack Developer",
    "analysis": {
      "overallMatch": 75,
      "strengths": [
        {
          "skill": "React",
          "userLevel": 8,
          "required": 7
        }
      ],
      "gaps": [
        {
          "skill": "Docker",
          "userLevel": 3,
          "required": 8,
          "priority": "high"
        }
      ],
      "recommendations": ["Focus on containerization", "Learn Kubernetes"]
    }
  }
}
```

### Generate Resume Content
```http
POST /ai/resume
Authorization: Bearer TOKEN
```

**Request Body:**
```json
{
  "targetRole": "Frontend Developer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "targetRole": "Frontend Developer",
    "content": {
      "summary": "Passionate frontend developer with 2+ years of experience...",
      "experienceBullets": [
        {
          "company": "Tech Corp",
          "role": "Software Engineer",
          "bullets": [
            "Developed responsive web applications using React, improving user engagement by 45%",
            "Optimized application performance, reducing load time by 60%"
          ]
        }
      ],
      "skillsHighlight": ["React", "JavaScript", "CSS", "TypeScript"],
      "keywords": ["Frontend", "React", "UI/UX", "Responsive Design"]
    }
  }
}
```

---

## 💼 Roles Endpoints

### Get All Roles
```http
GET /roles?category=software&seniority=junior&search=developer
```

**Query Parameters:**
- `category` (optional): software, data, design, product, marketing, sales, business
- `seniority` (optional): entry, junior, mid, senior, lead, principal
- `search` (optional): Search in title and description

**Response:**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "_id": "...",
      "title": "Frontend Developer",
      "category": "software",
      "seniority": "junior",
      "description": "Build responsive user interfaces...",
      "requiredSkills": [
        {
          "name": "JavaScript",
          "importance": 10,
          "category": "technical"
        }
      ],
      "salary": {
        "min": 50000,
        "max": 80000,
        "currency": "USD"
      },
      "marketData": {
        "demand": "very-high",
        "growth": 15,
        "openings": 12000
      }
    }
  ]
}
```

### Get Single Role
```http
GET /roles/:id
```

### Get Categories
```http
GET /roles/categories
```

---

## ❌ Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Server Error

---

## 🔒 Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response when exceeded**:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later"
}
```

---

## 📝 Notes

1. All timestamps are in ISO 8601 format
2. Passwords must be at least 6 characters with uppercase, lowercase, and number
3. JWT tokens expire after 7 days
4. Profile must be completed before using AI analysis features
5. AI responses may take 2-5 seconds depending on model

---

**For more details, see the full README.md**
