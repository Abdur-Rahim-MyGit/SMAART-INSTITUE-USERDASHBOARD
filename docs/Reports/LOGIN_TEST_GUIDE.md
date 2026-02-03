# Login System - Testing Guide

## ✅ How Login Works

### **Step 1: User Registers**
- Fills all registration steps
- Sets password (min 8 characters)
- Data saved to `registrations` collection
- User created in `users` collection with hashed password
- `registrationCompleted` set to `true`

### **Step 2: User Logs In**
- Enters email and password on Login tab
- Frontend sends to: `POST /api/users/login`
- Backend checks:
  1. User exists in `users` collection
  2. Password matches (bcrypt comparison)
  3. `registrationCompleted` is `true`
- Returns user data and redirects to dashboard

---

## 🧪 Testing Steps

### **Step 1: Verify Backend is Running**
```bash
cd d:\minds\v.0.1\back-end
npm start
```
Should show: `✅ MongoDB connected successfully`

### **Step 2: Verify Frontend is Running**
```bash
cd d:\minds\v.0.1\front-end
npm run dev
```
Should show: `http://localhost:5173`

### **Step 3: Register a Test User**
1. Go to `http://localhost:5173`
2. Click "Sign Up" tab
3. Fill registration:
   - **Full Name:** Test User
   - **Email:** test@example.com
   - **Mobile:** 9876543210
   - **Gender:** Male
   - **Course:** B.Tech
   - **Department:** CSE
4. On Step 6 (Password):
   - **Password:** TestPassword123
   - **Confirm:** TestPassword123
5. Click "Submit Registration"
6. Should see success message

### **Step 4: Check MongoDB**
```bash
mongosh
use minds_db
db.users.findOne({ email: "test@example.com" })
```

Should see:
```json
{
  "_id": ObjectId,
  "fullName": "Test User",
  "email": "test@example.com",
  "mobileNumber": "9876543210",
  "password": "hashed_password_here",
  "registrationCompleted": true,
  "role": "student"
}
```

### **Step 5: Login with Registered Credentials**
1. Go to `http://localhost:5173`
2. Click "Login" tab
3. Enter:
   - **Email:** test@example.com
   - **Password:** TestPassword123
4. Click "Login"
5. Should see "Login successful!" and redirect to dashboard

---

## 🔍 Backend Login Flow

### **Endpoint:** `POST /api/users/login`

**Request:**
```json
{
  "email": "test@example.com",
  "password": "TestPassword123"
}
```

**Response (Success):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "ObjectId",
    "fullName": "Test User",
    "email": "test@example.com",
    "mobileNumber": "9876543210",
    "role": "student",
    "registrationCompleted": true
  },
  "registration": {
    "id": "ObjectId",
    "studentId": "STU001",
    "course": "B.Tech",
    "department": "CSE"
  }
}
```

**Response (Error - Invalid Password):**
```json
{
  "error": "Invalid email or password"
}
```

**Response (Error - Registration Not Completed):**
```json
{
  "error": "Registration not completed. Please complete your registration."
}
```

---

## 🐛 Troubleshooting

### **"Invalid email or password" Error**
- Check if user exists: `db.users.findOne({ email: "test@example.com" })`
- Verify password is correct (case-sensitive)
- Ensure registration was completed

### **"Registration not completed" Error**
- User exists but didn't complete registration
- Need to complete all 6 steps and submit
- Check: `db.users.findOne({ email: "test@example.com" }).registrationCompleted`

### **Backend Connection Error**
- Ensure backend is running: `npm start` in back-end folder
- Check MongoDB is running: `mongod`
- Verify connection string in `.env`

### **Frontend Can't Connect to Backend**
- Check backend is on `http://localhost:5000`
- Check CORS is enabled
- Look at browser console for errors

---

## 📊 Database Collections

### **users Collection**
```json
{
  "_id": ObjectId,
  "fullName": "Test User",
  "email": "test@example.com",
  "mobileNumber": "9876543210",
  "password": "hashed_password",
  "role": "student",
  "registrationCompleted": true,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### **registrations Collection**
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "fullName": "Test User",
  "email": "test@example.com",
  "mobileNumber": "9876543210",
  "password": "hashed_password",
  "gender": "male",
  "course": "B.Tech",
  "department": "CSE",
  "status": "pending",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

---

## ✨ Key Points

✅ **Passwords are hashed** - Never stored as plain text
✅ **Email validation** - Must be valid format
✅ **Registration check** - Must complete all steps
✅ **Secure comparison** - Uses bcrypt.compare()
✅ **User data stored** - In sessionStorage after login
✅ **Dashboard redirect** - Automatic after successful login

---

**Status:** ✅ Login system ready to test!

Try registering and logging in now. If you encounter any issues, check the troubleshooting section.
