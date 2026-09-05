# T1 Baseline Assessment - Database Storage

## ✅ Database Persistence Implemented

All T1 Baseline Assessment results are now automatically saved to the database after submission.

## 📊 Data Stored in Database

### Collection: `baselineresults`

Each T1 assessment submission creates a document with the following structure:

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),           // Reference to User
  resultId: ObjectId("..."),         // Reference to Result (assessment session)
  
  // Overall Score
  baselineScore: 67,                 // 0-100, average of all quotients
  
  // Detailed T1 Profile
  t1Profile: {
    CRQ: {                           // Cognitive Readiness Quotient
      rawScore: 71,                  // Percentage (0-100)
      level: "Strong",               // Strong/Moderate/Developing
      earned: 5,                     // Points earned
      possible: 7                    // Total possible points
    },
    SRQ: {                           // Social Readiness Quotient
      rawScore: 50,
      level: "Developing",
      earned: 3,
      possible: 6
    },
    LQ: {                            // Learning Quotient
      rawScore: 83,
      level: "Strong",
      earned: 5,
      possible: 6
    },
    SIQ: {                           // Self-Identity Quotient
      rawScore: 67,
      level: "Moderate",
      earned: 4,
      possible: 6
    },
    PEQ: {                           // Physical & Emotional Quotient
      rawScore: 86,
      level: "Strong",
      earned: 6,
      possible: 7
    },
    DAQ: {                           // Digital Age Quotient
      rawScore: 50,
      level: "Developing",
      earned: 2,
      possible: 4
    }
  },
  
  // Legacy fields (for backward compatibility)
  score: 24,                         // Total points earned (out of 36)
  totalScore: 36,                    // Total possible points
  percentage: 67,                    // Overall percentage
  
  // Metadata
  assessmentType: "T1_BASELINE",
  createdAt: ISODate("2026-01-27T06:19:35.000Z"),
  updatedAt: ISODate("2026-01-27T06:19:35.000Z")
}
```

## 🔍 Querying T1 Results

### Get Latest Result for a User

**Endpoint**: `GET /api/baselineresults/user/:userId`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "resultId": "...",
    "baselineScore": 67,
    "t1Profile": {
      "CRQ": { "rawScore": 71, "level": "Strong", "earned": 5, "possible": 7 },
      "SRQ": { "rawScore": 50, "level": "Developing", "earned": 3, "possible": 6 },
      "LQ": { "rawScore": 83, "level": "Strong", "earned": 5, "possible": 6 },
      "SIQ": { "rawScore": 67, "level": "Moderate", "earned": 4, "possible": 6 },
      "PEQ": { "rawScore": 86, "level": "Strong", "earned": 6, "possible": 7 },
      "DAQ": { "rawScore": 50, "level": "Developing", "earned": 2, "possible": 4 }
    },
    "score": 24,
    "totalScore": 36,
    "percentage": 67,
    "assessmentType": "T1_BASELINE",
    "createdAt": "2026-01-27T06:19:35.000Z",
    "updatedAt": "2026-01-27T06:19:35.000Z"
  }
}
```

### Using the Static Method

```javascript
const BaseLineResult = require('./models/BaseLineResult');

// Get latest result for a user
const latestResult = await BaseLineResult.getLatestForUser(userId);

if (latestResult) {
  console.log('Baseline Score:', latestResult.baselineScore);
  console.log('CRQ Level:', latestResult.t1Profile.CRQ.level);
  console.log('CRQ Percentage:', latestResult.t1Profile.CRQ.rawScore);
}
```

## 🗄️ Database Schema

### BaseLineResult Model

**File**: `back-end/models/BaseLineResult.js`

**Schema Features**:
- ✅ Stores complete T1 profile with all 6 quotients
- ✅ Each quotient includes: rawScore, level, earned, possible
- ✅ Baseline score (average of quotients)
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Indexed for fast queries (userId, resultId, createdAt)
- ✅ Static method for getting latest result

**Validation**:
- `baselineScore`: 0-100
- `rawScore`: 0-100 for each quotient
- `level`: Must be "Strong", "Moderate", or "Developing"
- `earned`: Must be ≥ 0
- `possible`: Must be ≥ 0

## 📈 Data Flow

### 1. User Takes Assessment
```
User answers 36 questions → Responses saved to Result collection
```

### 2. User Submits Assessment
```
Submit button clicked → POST /api/results/:resultId/submit
```

### 3. Backend Processing
```
1. Calculate quotient scores (CRQ, SRQ, LQ, SIQ, PEQ, DAQ)
2. Determine levels (Strong/Moderate/Developing)
3. Calculate baseline score (average of quotients)
4. Save to Result collection (mark as completed)
5. Save to BaseLineResult collection (T1 profile data)
6. Return results to frontend
```

### 4. Frontend Display
```
Results page shows:
- Baseline Readiness Index (overall score)
- 6 Quotient cards with levels and percentages
- Animated progress bars
```

### 5. Future Retrieval
```
GET /api/baselineresults/user/:userId → Returns saved T1 profile
```

## 🔧 Database Operations

### Save T1 Results (Automatic)
Happens automatically when user submits T1 assessment.

**Code Location**: `back-end/routes/results.js` (lines 461-481)

```javascript
const baselineResult = new BaseLineResult({
    userId: result.userId,
    resultId: result._id,
    baselineScore: baselineScore,
    t1Profile: finalProfile,
    score: calculatedScore,
    totalScore: maxScore,
    percentage: percentage,
    assessmentType: 'T1_BASELINE'
});

await baselineResult.save();
```

### Retrieve T1 Results
```javascript
// Get latest result
const result = await BaseLineResult.findOne({ userId })
    .sort({ createdAt: -1 });

// Get all results for a user
const allResults = await BaseLineResult.find({ userId })
    .sort({ createdAt: -1 });

// Get specific result by ID
const result = await BaseLineResult.findById(resultId);
```

### Delete T1 Results (Dev/Testing)
**Endpoint**: `DELETE /api/baselineresults/reset/:userId`

Deletes all baseline results for a user (useful for testing).

## 📊 Example Queries

### MongoDB Shell

```javascript
// Find all T1 results
db.baselineresults.find({ assessmentType: "T1_BASELINE" })

// Find user's latest result
db.baselineresults.find({ userId: ObjectId("...") })
    .sort({ createdAt: -1 })
    .limit(1)

// Find all users with Strong CRQ
db.baselineresults.find({ "t1Profile.CRQ.level": "Strong" })

// Find users with baseline score >= 70
db.baselineresults.find({ baselineScore: { $gte: 70 } })

// Get average baseline score across all users
db.baselineresults.aggregate([
    { $group: { _id: null, avgScore: { $avg: "$baselineScore" } } }
])
```

## ✅ Verification Steps

After a user completes the T1 assessment:

1. **Check Result Collection**:
   ```javascript
   db.results.findOne({ _id: ObjectId("resultId") })
   // Should show completionStatus: "completed"
   ```

2. **Check BaseLineResult Collection**:
   ```javascript
   db.baselineresults.findOne({ resultId: ObjectId("resultId") })
   // Should show complete T1 profile data
   ```

3. **Verify Data Integrity**:
   - ✅ baselineScore matches average of quotient rawScores
   - ✅ Each quotient has rawScore, level, earned, possible
   - ✅ Levels match banding rules (≥70=Strong, 60-69=Moderate, <60=Developing)
   - ✅ earned ≤ possible for each quotient
   - ✅ userId and resultId are valid ObjectIds

## 🎯 Summary

**What Gets Saved**:
- ✅ Overall baseline score (0-100)
- ✅ All 6 quotient scores with percentages
- ✅ All 6 quotient levels (Strong/Moderate/Developing)
- ✅ Points earned and possible for each quotient
- ✅ Timestamps (when assessment was completed)
- ✅ References to user and result documents

**Where It's Saved**:
- ✅ MongoDB collection: `baselineresults`
- ✅ Model: `BaseLineResult`
- ✅ Automatically saved on assessment submission

**How to Access**:
- ✅ API endpoint: `GET /api/baselineresults/user/:userId`
- ✅ Static method: `BaseLineResult.getLatestForUser(userId)`
- ✅ Direct MongoDB queries

All T1 assessment data is now permanently stored and can be retrieved at any time! 🎉
