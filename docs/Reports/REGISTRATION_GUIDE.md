# Registration & Data Persistence Guide

## ✅ What's Fixed

### **Backend Changes:**
1. **Optional Fields Handling** - Backend now properly handles optional fields (like upload fields)
2. **Better Error Messages** - Shows detailed error information
3. **Flexible Data Storage** - Only saves provided fields, doesn't require all optional fields
4. **Password Hashing** - Passwords are hashed before saving to MongoDB

### **Frontend Changes:**
1. **Profile Photo Upload** - Added to Step 6 with preview
2. **Password Validation** - Real-time matching indicator
3. **All Data Sent to Backend** - Form sends all filled data

---

## 🚀 How to Test

### **Step 1: Restart Backend**
```bash
cd d:\minds\v.0.1\back-end
npm start
```

### **Step 2: Go Through Registration**
1. Fill **Step 1-5** with mandatory fields:
   - Full Name ✓
   - Email ✓
   - Mobile Number ✓
   - Gender ✓
   - Course ✓
   - Department ✓

2. **Skip optional fields** like:
   - Student ID
   - DOB
   - Alternate Mobile
   - Address details
   - Marksheets upload
   - Certificates upload
   - ID Proof upload

3. On **Step 6 (Password)**:
   - Upload profile photo (optional)
   - Enter password (min 8 chars)
   - Confirm password
   - Click "Submit Registration"

### **Step 3: Check MongoDB**
```bash
mongosh
use minds_db
db.registrations.findOne()
```

You should see:
```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "email": "example@email.com",
  "fullName": "Your Name",
  "mobileNumber": "9876543210",
  "password": "hashed_password_here",
  "gender": "male",
  "course": "B.Tech",
  "department": "CSE",
  "studentId": "",
  "dob": null,
  "alternateMobile": "",
  "address": {
    "doorNo": "",
    "city": "",
    "state": "",
    "country": "",
    "pincode": ""
  },
  "status": "pending",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

---

## 📊 Data Flow

### **Frontend → Backend**
```
ComprehensiveSignup.jsx
  ↓
  Collects all form data (mandatory + optional)
  ↓
  Sends POST to /api/users/register-details
  ↓
  Backend receives data
```

### **Backend Processing**
```
/api/users/register-details (POST)
  ↓
  Validates required fields (email, fullName, mobileNumber, password)
  ↓
  Creates/Updates User in users collection
  ↓
  Creates/Updates Registration in registrations collection
  ↓
  Hashes password with bcryptjs
  ↓
  Marks registrationCompleted = true
  ↓
  Returns success response
```

### **Fetching Data**
```
GET /api/users/register-details/:email
  ↓
  Finds user by email
  ↓
  Fetches registration details
  ↓
  Returns complete registration data
```

---

## 🔍 API Endpoints

### **Save Registration**
```
POST /api/users/register-details

Request Body:
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "mobileNumber": "9876543210",
  "password": "securePassword123",
  "personalDetails": {
    "studentId": "STU001",
    "dob": "1995-05-15",
    "gender": "male",
    "alternateMobile": "",
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
    "admissionDate": "2022-07-15",
    "rollNumber": "CS2022001"
  },
  "marksheets": {...},
  "certificates": [...],
  "idProof": {...},
  "otherDetails": {...}
}

Response:
{
  "message": "Registration details saved successfully",
  "registration": {
    "id": "ObjectId",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "pending"
  }
}
```

### **Fetch Registration**
```
GET /api/users/register-details/user@example.com

Response:
{
  "_id": ObjectId,
  "userId": ObjectId,
  "email": "user@example.com",
  "fullName": "John Doe",
  "mobileNumber": "9876543210",
  "password": "hashed_password",
  "personalDetails": {...},
  "academicDetails": {...},
  "marksheets": {...},
  "certificates": [...],
  "idProof": {...},
  "otherDetails": {...},
  "status": "pending",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

---

## ✨ Key Features

✅ **Flexible Data Storage** - Save only what you fill
✅ **Optional Fields** - Skip upload fields if not needed
✅ **Password Hashing** - Secure password storage
✅ **Data Persistence** - All data saved to MongoDB
✅ **Easy Retrieval** - Fetch data by email
✅ **Profile Photo** - Upload and preview
✅ **Real-time Validation** - Password matching indicator

---

## 🐛 Troubleshooting

### **"Failed to save registration" Error**
- Check backend console for detailed error
- Ensure all mandatory fields are filled:
  - Full Name
  - Email
  - Mobile Number
  - Password (min 8 chars)
- Verify MongoDB is running

### **Data Not Saving**
- Check MongoDB connection: `mongosh`
- Verify database: `use minds_db`
- Check collections: `db.registrations.find()`

### **Password Not Hashing**
- Ensure bcryptjs is installed: `npm install bcryptjs`
- Restart backend: `npm start`

---

## 📝 MongoDB Collections

### **users**
- Stores user account information
- Fields: fullName, email, mobileNumber, password (hashed), role, registrationCompleted

### **registrations**
- Stores complete registration details
- Fields: All personal, academic, marksheet, certificate, ID proof data
- Status: pending/approved/rejected

---

**Status**: ✅ Ready to test! Fill mandatory fields, skip optional uploads, and submit.
