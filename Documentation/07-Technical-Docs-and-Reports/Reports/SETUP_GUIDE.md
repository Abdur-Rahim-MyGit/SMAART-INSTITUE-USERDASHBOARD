# SMAART Minds - Setup & Configuration Guide

## ✅ Changes Made

### **Frontend Updates**

#### 1. **ComprehensiveSignup.jsx** - Password Section
- ✅ Replaced "Additional Documents" section with "Password" section
- ✅ Added two password fields: "Password" and "Confirm Password"
- ✅ Real-time validation showing if passwords match
- ✅ Password must be at least 8 characters
- ✅ Form can only be submitted if passwords match
- ✅ All registration data is sent to backend with password

#### 2. **ModuleCard.jsx** - Week Labels
- ✅ Changed "Day 1, Day 2, Day 3, Day 4" to "Week 1, Week 2, Week 3, Week 4"

### **Backend Updates**

#### 1. **MongoDB Configuration**
- ✅ Database: `minds_db` (localhost:27017)
- ✅ Connection string: `mongodb://localhost:27017/minds_db`

#### 2. **User Model** (`models/User.js`)
- ✅ Added `password` field (required)
- ✅ Added `registrationCompleted` flag
- ✅ Password hashing with bcryptjs (pre-save hook)

#### 3. **Registration Model** (`models/Registration.js`)
- ✅ Changed from separate firstName/middleName/lastName to single `fullName` field
- ✅ Added `password` field to store user password

#### 4. **Users Routes** (`routes/users.js`)
- ✅ Updated `/api/users/register-details` endpoint
- ✅ Creates user if doesn't exist
- ✅ Hashes password before saving
- ✅ Saves all registration details to MongoDB
- ✅ Marks registration as completed

---

## 🚀 How to Run

### **Step 1: Start MongoDB**
```bash
# Open a new terminal and run:
mongod
```
MongoDB will start on `localhost:27017` and create `minds_db` database automatically.

### **Step 2: Start Backend Server**
```bash
cd d:\minds\v.0.1\back-end
npm install  # (if not already installed)
npm run dev  # or npm start
```
Backend runs on `http://localhost:5000`

### **Step 3: Start Frontend**
```bash
cd d:\minds\v.0.1\front-end
npm run dev
```
Frontend runs on `http://localhost:5173` (or your configured port)

---

## 📋 Registration Flow

### **Step 1: SignupInitial** (`/signup-initial`)
- User enters: Full Name, Email, Mobile Number
- Clicks "Sign Up"

### **Step 2-6: ComprehensiveSignup** (`/signup`)
- **Step 1**: Personal Details (Full Name, Email, Mobile, DOB, Gender, Address)
- **Step 2**: Academic Details (Course, Department, Year/Semester, Admission Date, Roll Number)
- **Step 3**: Marksheets (10th, 12th, UG up to 8 semesters, PG up to 4 semesters)
- **Step 4**: Certificates (Multiple certificates with upload)
- **Step 5**: ID Proof (ID Type, Number, Name on ID, Issue/Expiry Date, Upload)
- **Step 6**: Password (Set Password & Confirm Password) ⭐ NEW

### **Step 7: SignupSuccess** (`/signup-success`)
- Shows success message
- "Try logging in now!" button redirects to login

---

## 🔐 Password Requirements

- **Minimum 8 characters**
- **Must match confirmation password**
- **Hashed with bcryptjs before storing in MongoDB**
- **Cannot submit form if passwords don't match**

---

## 📊 MongoDB Collections

### **users** Collection
```json
{
  "_id": ObjectId,
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobileNumber": "9876543210",
  "password": "hashed_password_here",
  "role": "student",
  "registrationCompleted": true,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### **registrations** Collection
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobileNumber": "9876543210",
  "password": "hashed_password_here",
  "studentId": "STU001234",
  "dob": ISODate,
  "gender": "male",
  "address": {
    "doorNo": "123",
    "city": "Bangalore",
    "state": "Karnataka",
    "country": "India",
    "pincode": "560001"
  },
  "academicDetails": {
    "course": "B.Tech",
    "department": "CSE",
    "yearSemester": "3rd Year",
    "admissionDate": ISODate,
    "rollNumber": "CS2022001"
  },
  "marksheets": [...],
  "certificates": [...],
  "idProof": {...},
  "otherDetails": {...},
  "submissionDate": ISODate,
  "status": "pending",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

---

## 🔗 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Register user (with password)
- `POST /api/auth/login` - Login user

### **Registration**
- `POST /api/users/register-details` - Save complete registration with password
- `GET /api/users/register-details/:email` - Fetch registration details

---

## ✨ Key Features

✅ **Password Protection**: All passwords are hashed with bcryptjs
✅ **Real-time Validation**: Passwords match indicator on form
✅ **MongoDB Integration**: All data saved to `minds_db`
✅ **User Creation**: Automatically creates user account during registration
✅ **Registration Tracking**: `registrationCompleted` flag tracks completion status
✅ **Week-based Modules**: Courses now display as Week 1-4 instead of Day 1-4

---

## 🧪 Testing

### **Test Registration Flow**
1. Go to `http://localhost:5173`
2. Click "Sign Up" tab
3. Enter: Full Name, Email, Mobile Number
4. Click "Sign Up" button
5. Fill all 6 steps of registration
6. On Step 6 (Password):
   - Enter password (min 8 chars)
   - Confirm password
   - See real-time match indicator
7. Click "Submit Registration"
8. Check MongoDB Compass or mongosh:
   ```bash
   mongosh
   use minds_db
   db.users.find()
   db.registrations.find()
   ```

### **Test Login**
1. Go to `http://localhost:5173`
2. Click "Login" tab
3. Enter email and password from registration
4. Click "Login"

---

## 🐛 Troubleshooting

### **MongoDB Connection Error**
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`: `mongodb://localhost:27017/minds_db`

### **Password Not Saving**
- Ensure both password fields match
- Check browser console for errors
- Verify backend is running on port 5000

### **Registration Not Saving**
- Check backend logs for errors
- Verify MongoDB is connected
- Check network tab in browser DevTools

---

## 📝 Environment Variables

### **Backend (.env)**
```
MONGODB_URI=mongodb://localhost:27017/minds_db
PORT=5000
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

---

## ✅ Checklist

- [x] Password section replaces Additional Documents
- [x] Password validation (8+ characters)
- [x] Confirm password matching
- [x] Real-time match indicator
- [x] MongoDB connection to `minds_db`
- [x] Password hashing with bcryptjs
- [x] User creation during registration
- [x] All data saved to MongoDB
- [x] Week labels instead of Day labels
- [x] Backend routes updated
- [x] Models updated

---

**Status**: ✅ All changes completed and ready to test!
