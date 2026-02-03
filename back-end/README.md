# SMAART Minds Backend

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally on port 27017)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following:
```
MONGODB_URI=mongodb://localhost:27017/minds
PORT=5000
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

3. Start MongoDB locally:
```bash
mongod
```

4. Run the server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

#### Users
- `POST /api/users/create` - Create user without password
- `POST /api/users/register-details` - Save registration details
- `GET /api/users/register-details/:email` - Get registration details

### MongoDB Setup

To create a local MongoDB cluster named "minds":

1. Start MongoDB:
```bash
mongod
```

2. The database "minds" will be created automatically when the first document is inserted.

### Database Structure

**Collections:**
- `users` - Stores user account information
- `registrations` - Stores detailed registration information (personal, academic, documents, etc.)
