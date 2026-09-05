# T1 Assessment - Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         T1 BASELINE ASSESSMENT                          │
│                            Complete Data Flow                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   STUDENT    │
│   STARTS     │
│  ASSESSMENT  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: QUESTION SELECTION                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  • Stratified sampling across 6 quotients                               │
│  • CRQ: 7 questions                                                     │
│  • SRQ: 6 questions                                                     │
│  • LQ: 6 questions                                                      │
│  • SIQ: 6 questions                                                     │
│  • PEQ: 7 questions                                                     │
│  • DAQ: 4 questions                                                     │
│  • Total: 36 questions                                                  │
│  • Seeded shuffle (deterministic per user)                             │
└─────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: ANSWERING QUESTIONS                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  • Student answers each question (A, B, C, or D)                        │
│  • Real-time grading (Correct = 1 point, Incorrect = 0 points)         │
│  • Answers saved immediately to database                                │
│  • Progress tracked (answered/total)                                    │
│  • Session resumable if interrupted                                     │
└─────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: SUBMISSION                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  • Student clicks "Submit Test"                                         │
│  • POST /api/results/:resultId/submit                                   │
│  • Backend validates all 36 questions answered                          │
└─────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: SCORE CALCULATION                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  FOR EACH QUOTIENT:                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 1. Count earned points (correct answers)                         │  │
│  │ 2. Calculate percentage: (earned / possible) × 100              │  │
│  │ 3. Determine level:                                              │  │
│  │    • ≥ 70% → Strong                                              │  │
│  │    • 60-69% → Moderate                                           │  │
│  │    • < 60% → Developing                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  EXAMPLE:                                                                │
│  ┌──────────┬─────────┬──────────┬────────────┬──────────┐             │
│  │ Quotient │ Earned  │ Possible │ Percentage │  Level   │             │
│  ├──────────┼─────────┼──────────┼────────────┼──────────┤             │
│  │   CRQ    │   5     │    7     │    71%     │  Strong  │             │
│  │   SRQ    │   3     │    6     │    50%     │ Develop  │             │
│  │   LQ     │   5     │    6     │    83%     │  Strong  │             │
│  │   SIQ    │   4     │    6     │    67%     │ Moderate │             │
│  │   PEQ    │   6     │    7     │    86%     │  Strong  │             │
│  │   DAQ    │   2     │    4     │    50%     │ Develop  │             │
│  └──────────┴─────────┴──────────┴────────────┴──────────┘             │
│                                                                           │
│  BASELINE SCORE:                                                         │
│  (71 + 50 + 83 + 67 + 86 + 50) / 6 = 67.83% → 68                       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: DATABASE STORAGE                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  COLLECTION 1: results                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ • Session data                                                    │  │
│  │ • All 36 responses                                                │  │
│  │ • Question order                                                  │  │
│  │ • Completion status: "completed"                                  │  │
│  │ • Time taken                                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  COLLECTION 2: baselineresults ✨ NEW                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ {                                                                 │  │
│  │   userId: ObjectId("..."),                                        │  │
│  │   resultId: ObjectId("..."),                                      │  │
│  │   baselineScore: 68,                                              │  │
│  │   t1Profile: {                                                    │  │
│  │     CRQ: { rawScore: 71, level: "Strong", ... },                 │  │
│  │     SRQ: { rawScore: 50, level: "Developing", ... },             │  │
│  │     LQ: { rawScore: 83, level: "Strong", ... },                  │  │
│  │     SIQ: { rawScore: 67, level: "Moderate", ... },               │  │
│  │     PEQ: { rawScore: 86, level: "Strong", ... },                 │  │
│  │     DAQ: { rawScore: 50, level: "Developing", ... }              │  │
│  │   },                                                              │  │
│  │   createdAt: ISODate("..."),                                      │  │
│  │   updatedAt: ISODate("...")                                       │  │
│  │ }                                                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: FRONTEND DISPLAY                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                  BASELINE READINESS INDEX                       │    │
│  │                          68 / 100                               │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │ QUOTIENT                │  │ QUOTIENT                │              │
│  │ CRQ                     │  │ SRQ                     │              │
│  │         [Strong] 71%    │  │    [Developing] 50%     │              │
│  │ ████████████████░░░░    │  │ ██████████░░░░░░░░░░    │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
│                                                                           │
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │ QUOTIENT                │  │ QUOTIENT                │              │
│  │ LQ                      │  │ SIQ                     │              │
│  │         [Strong] 83%    │  │       [Moderate] 67%    │              │
│  │ ████████████████░░░░    │  │ █████████████░░░░░░░    │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
│                                                                           │
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │ QUOTIENT                │  │ QUOTIENT                │              │
│  │ PEQ                     │  │ DAQ                     │              │
│  │         [Strong] 86%    │  │    [Developing] 50%     │              │
│  │ █████████████████░░░    │  │ ██████████░░░░░░░░░░    │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  FUTURE ACCESS                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  • GET /api/baselineresults/user/:userId                                │
│  • Retrieve complete T1 profile anytime                                 │
│  • View historical results                                              │
│  • Track progress over time                                             │
│  • Generate reports and analytics                                       │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                              KEY FEATURES
═══════════════════════════════════════════════════════════════════════════

✅ STRATIFIED SAMPLING
   → Ensures balanced coverage across all 6 quotients
   → Each user gets exactly 36 questions (7/6/6/6/7/4 distribution)

✅ REAL-TIME GRADING
   → Immediate feedback on correct/incorrect answers
   → Points calculated as questions are answered

✅ DETERMINISTIC SHUFFLING
   → Same user always gets same question order
   → Enables session resumption
   → Different users get different questions

✅ COMPREHENSIVE SCORING
   → Individual quotient percentages (0-100%)
   → Level classification (Strong/Moderate/Developing)
   → Overall baseline score (average of quotients)

✅ COMPLETE DATABASE PERSISTENCE
   → All results saved to MongoDB
   → Retrievable via API
   → Timestamped for historical tracking

✅ PROFESSIONAL UI
   → Animated progress bars
   → Color-coded levels (Green/Amber/Red)
   → Responsive design
   → Dark mode support

═══════════════════════════════════════════════════════════════════════════
