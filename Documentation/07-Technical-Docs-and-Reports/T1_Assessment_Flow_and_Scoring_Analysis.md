# T1 Baseline Assessment - Complete Flow & Scoring Analysis

**Document Version:** 1.0  
**Date:** February 4, 2026  
**Assessment Code:** ASM00001  
**Assessment Type:** T1 Baseline (S_baseline)

---

## 📋 Executive Summary

The T1 Baseline Assessment is a **36-question stratified assessment** designed to measure a student's readiness across **6 key quotients**. The system uses deterministic question selection, real-time answer saving, and multi-level scoring to provide comprehensive baseline profiling.

---

## 🎯 Assessment Flow

### **1. Initialization Phase**

#### Frontend (`BaseLineTest.jsx`)
```javascript
// Step 1: User authentication check
const userData = sessionStorage.getItem("user");
const userId = parsedUser.id || parsedUser._id;

// Step 2: Fetch assessment by code
const assessmentResponse = await assessmentApi.getByCode("ASM00001");

// Step 3: Start assessment session
const startResponse = await assessmentApi.startAssessment(assessmentId, userId);
```

#### Backend (`routes/results.js`)
```javascript
// Route: GET /assessment/:assessmentId/start

// Check for existing in-progress attempt
const existingResult = await Result.findOne({
    userId,
    assessmentId,
    completionStatus: 'in-progress'
});

// If exists → Resume session
// If not → Create new session
```

---

### **2. Question Selection Strategy**

#### **T1-Specific Logic** (Stratified Sampling)

**Target Distribution:**
| Quotient | Code | Questions |
|----------|------|-----------|
| Cognitive Readiness Quotient | CRQ | 7 |
| Self-Regulation & Drive Quotient | SRQ | 6 |
| Learning Agility Quotient | LQ | 6 |
| Social Interaction Quotient | SIQ | 6 |
| Professional Execution Quotient | PEQ | 7 |
| Digital & AI Literacy Quotient | DAQ | 4 |
| **TOTAL** | | **36** |

**Implementation:**
```javascript
// From: utils/questionShuffler.js
const selectedQuestions = selectStratifiedQuestions(assessment.questions, userId);

// Uses deterministic shuffle based on userId
// Ensures same user gets same questions on resume
shuffledQuestionIds = selectedQuestions.map(q => q._id);
totalQuestions = 36; // Fixed for T1
```

**Key Features:**
- ✅ **Deterministic**: Same user always gets same question set
- ✅ **Resumable**: User can leave and return to same questions
- ✅ **Stratified**: Maintains exact quotient distribution
- ✅ **Seeded**: Uses userId as seed for Fisher-Yates shuffle

---

### **3. Answer Saving (Real-Time)**

#### Frontend Behavior
```javascript
// Optimistic UI update
setSelectedAnswers(prev => ({
    ...prev,
    [currentQuestionId]: optionValue
}));

// Fire-and-forget backend save
await assessmentApi.saveAnswer(
    resultId,
    currentQuestionId,
    optionValue,
    questionText
);
```

#### Backend Processing
```javascript
// Route: POST /:resultId/answer

// 1. Fetch question to check correct answer
const question = assessment.questions.id(questionId);
const isCorrect = question.correctAnswer === selectedValue;
const score = isCorrect ? 1 : 0;

// 2. Update or add response
if (existingAnswerIndex !== -1) {
    // Update existing
    result.responses[existingAnswerIndex].selectedValue = selectedValue;
    result.responses[existingAnswerIndex].isCorrect = isCorrect;
    result.responses[existingAnswerIndex].score = score;
} else {
    // Add new
    result.responses.push({
        questionId,
        questionText,
        selectedValue,
        isCorrect,
        score
    });
}

// 3. Update progress
result.updateAnsweredCount();
await result.save();
```

**Response Structure:**
```javascript
{
    questionId: ObjectId,
    questionText: String,
    selectedValue: "A" | "B" | "C" | "D",
    isCorrect: Boolean,
    score: 0 | 1,
    answeredAt: Date
}
```

---

### **4. Submission & Scoring**

#### Validation Checks
```javascript
// Route: POST /:resultId/submit

// 1. T1-specific fix for legacy data
if (result.totalQuestions === 300 && result.responses.length === 36) {
    result.totalQuestions = 36; // Correct the mismatch
}

// 2. Ensure all questions answered
if (result.responses.length < result.totalQuestions) {
    return error: "Please answer all questions";
}

// 3. Calculate time taken
const timeTaken = Math.floor((Date.now() - result.startedAt) / 1000);
```

#### Scoring Algorithm

**Step 1: Quotient Aggregation**
```javascript
// Map questionId → quotient
const questionQuotientMap = {};
fullAssessment.questions.forEach(q => {
    questionQuotientMap[q._id.toString()] = q.quotient.toUpperCase();
});

// Initialize buckets
const quotientScores = {
    'CRQ': { earned: 0, total: 0 },
    'SRQ': { earned: 0, total: 0 },
    'LQ': { earned: 0, total: 0 },
    'SIQ': { earned: 0, total: 0 },
    'PEQ': { earned: 0, total: 0 },
    'DAQ': { earned: 0, total: 0 }
};

// Aggregate scores
result.responses.forEach(r => {
    const quotient = questionQuotientMap[r.questionId.toString()];
    if (quotient && quotientScores[quotient]) {
        quotientScores[quotient].total += 1;
        quotientScores[quotient].earned += (r.score || 0);
    }
});
```

**Step 2: Calculate Percentages & Levels**
```javascript
const determineLevel = (pct) => {
    if (pct >= 81) return 'Advanced';
    if (pct >= 61) return 'Strong';
    if (pct >= 41) return 'Progressing';
    if (pct >= 21) return 'Developing';
    return 'Emerging';
};

const finalProfile = {};
let totalPercentageSum = 0;
let quotientCount = 0;

for (const [key, data] of Object.entries(quotientScores)) {
    if (data.total > 0) {
        const pct = Math.round((data.earned / data.total) * 100);
        finalProfile[key] = {
            rawScore: pct,
            level: determineLevel(pct),
            earned: data.earned,
            possible: data.total
        };
        totalPercentageSum += pct;
        quotientCount++;
    }
}
```

**Step 3: Calculate Baseline Score**
```javascript
// Average of all quotient percentages
// This prevents larger quotients from dominating the score
const baselineScore = quotientCount > 0 
    ? Math.round(totalPercentageSum / quotientCount) 
    : 0;

const stageBand = determineLevel(baselineScore);
```

---

## 📊 Scoring Breakdown

### **Level Banding System**

| Level | Score Range | Description |
|-------|-------------|-------------|
| **Advanced** | 81-100% | Exceptional proficiency |
| **Strong** | 61-80% | Solid competency |
| **Progressing** | 41-60% | Developing skills |
| **Developing** | 21-40% | Early stages |
| **Emerging** | 0-20% | Foundational |

### **Example Calculation**

**Scenario:** User answers 36 questions

| Quotient | Earned | Total | Percentage | Level |
|----------|--------|-------|------------|-------|
| CRQ | 5 | 7 | 71% | Strong |
| SRQ | 4 | 6 | 67% | Strong |
| LQ | 3 | 6 | 50% | Progressing |
| SIQ | 5 | 6 | 83% | Advanced |
| PEQ | 6 | 7 | 86% | Advanced |
| DAQ | 2 | 4 | 50% | Progressing |

**Baseline Score Calculation:**
```
(71 + 67 + 50 + 83 + 86 + 50) / 6 = 407 / 6 = 67.83 ≈ 68%
Stage Band: Strong
```

---

## 💾 Data Persistence

### **Result Model** (`models/Result.js`)
```javascript
{
    userId: ObjectId,
    assessmentId: ObjectId,
    assessmentCode: "ASM00001",
    assessmentName: "Base Line Test",
    questionOrder: [ObjectId], // 36 question IDs
    responses: [ResponseSchema],
    startedAt: Date,
    submittedAt: Date,
    timeTaken: Number, // seconds
    completionStatus: "in-progress" | "completed",
    totalQuestions: 36,
    answeredQuestions: Number
}
```

### **BaseLineResult Model** (`models/BaseLineResult.js`)
```javascript
{
    userId: ObjectId,
    resultId: ObjectId,
    baselineScore: Number, // 0-100
    stageBand: String, // "Advanced" | "Strong" | etc.
    t1Profile: {
        CRQ: { rawScore, level, earned, possible },
        SRQ: { rawScore, level, earned, possible },
        LQ: { rawScore, level, earned, possible },
        SIQ: { rawScore, level, earned, possible },
        PEQ: { rawScore, level, earned, possible },
        DAQ: { rawScore, level, earned, possible }
    },
    score: Number, // Total correct
    totalScore: 36,
    percentage: Number,
    assessmentType: "T1_BASELINE",
    createdAt: Date
}
```

---

## 🔒 Anti-Cheat Measures

### **Proctoring Features** (Frontend)

1. **Right-click disabled**
2. **Copy/paste blocked**
3. **Screenshot detection** (PrintScreen, Cmd+Shift+3/4)
4. **Tab switching detection** (visibilitychange event)
5. **Warning system**: 3 strikes → Auto-submit
6. **Exit prevention**: Browser back button blocked
7. **Minimum time per question**: 5 seconds

```javascript
// Warning handler
const handleViolation = (message) => {
    setWarnings(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_WARNINGS) {
            submit(); // Force submit
            toast.error("Test terminated due to multiple violations.");
        }
        return newCount;
    });
};
```

---

## 🐛 Known Issues & Fixes

### **Issue 1: Legacy 300-Question Bug**
**Problem:** Old T1 sessions had `totalQuestions: 300` instead of `36`

**Fix Applied:**
```javascript
// Auto-correction on submit
if (result.totalQuestions === 300 && result.responses.length === 36) {
    result.totalQuestions = 36;
}
```

### **Issue 2: Resume Session Question Mismatch**
**Problem:** Resumed sessions sometimes showed 0 questions

**Fix Applied:**
```javascript
// Failsafe cascade in start route
// 1. Try questionOrder
// 2. Fallback to assessment.questions
// 3. Re-fetch from DB if needed
// 4. Clean orphaned responses
```

---

## 🎨 Frontend Display

### **Results Screen Components**

1. **Overall Score Card**
   - Baseline Score (0-100)
   - Stage Band (Advanced/Strong/etc.)

2. **Quotient Breakdown Grid**
   - 6 cards (one per quotient)
   - Each shows:
     - Icon & name
     - Percentage score
     - Level badge
     - Earned/Possible ratio
     - Animated progress bar

3. **Action Buttons**
   - Download PDF Report
   - Go to Dashboard
   - View All Assessments

---

## ✅ Validation Checklist

- [x] **Question Selection**: Stratified sampling working (36 questions)
- [x] **Deterministic Shuffle**: Same user gets same questions
- [x] **Real-time Saving**: Answers persist on each selection
- [x] **Resume Capability**: Users can leave and return
- [x] **Scoring Accuracy**: Quotient-wise calculation correct
- [x] **Baseline Score**: Average of quotient percentages
- [x] **Level Banding**: 5-tier system (Emerging → Advanced)
- [x] **Data Persistence**: Both Result and BaseLineResult saved
- [x] **Anti-Cheat**: Proctoring measures active
- [x] **Legacy Fix**: 300-question bug corrected

---

## 📈 Recommendations

### **Immediate Actions**
1. ✅ **Verify Question Bank**: Ensure all 300+ questions are properly tagged with quotients
2. ✅ **Test Distribution**: Confirm stratified selection gives exact 7/6/6/6/7/4 split
3. ✅ **Data Migration**: Run script to fix any legacy results with `totalQuestions: 300`

### **Future Enhancements**
1. **Adaptive Difficulty**: Adjust question difficulty based on performance
2. **Time Analytics**: Track time per question for insights
3. **Retry Logic**: Allow users to retake after X days
4. **Comparison Reports**: Show progress over multiple attempts
5. **Admin Dashboard**: View aggregate statistics across all users

---

## 🔗 Related Files

### **Backend**
- `routes/results.js` - Main assessment flow
- `routes/baselineresults.js` - T1 results retrieval
- `models/Result.js` - Generic result schema
- `models/BaseLineResult.js` - T1-specific result schema
- `utils/baselineUtils.js` - Scoring calculation
- `utils/questionShuffler.js` - Stratified selection

### **Frontend**
- `pages/BaseLineTest.jsx` - Main assessment UI
- `services/assessmentApi.js` - API calls
- `utils/reportGenerator.js` - PDF generation

### **Documentation**
- `docs/baseline_assessment_logic.md` - Original logic doc
- `docs/Assesment Complete Document T1 Flow.pdf` - Design document

---

## 📞 Support

For questions or issues with the T1 assessment flow:
1. Check console logs (both frontend and backend)
2. Verify question bank tagging in MongoDB
3. Review this document for expected behavior
4. Contact development team with Result ID for debugging

---

**End of Document**
