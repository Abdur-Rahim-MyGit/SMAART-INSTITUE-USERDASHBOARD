# T1 Assessment Testing Checklist

## ✅ Pre-Test Verification

- [x] Backend syntax error fixed (results.js line 380)
- [x] Frontend syntax error fixed (BaseLineTest.jsx line 520)
- [x] Documentation cleaned up (baseline_assessment_logic.md)
- [x] Frontend server is running (npm run dev)

## 🧪 Testing Steps

### Step 1: Start the Assessment
1. Navigate to the dashboard
2. Go to Assessments section
3. Click on "Base Line Test (T1)" or "ASM00001"
4. Verify the assessment starts correctly

**Expected**: 
- Assessment loads with 36 questions
- Question counter shows "Question 1 / 36"
- Progress bar starts at 0%

### Step 2: Answer Questions
1. Answer at least a few questions from each quotient category
2. Verify answers are being saved (check progress bar updates)
3. Navigate through questions using "Next Question" button

**Expected**:
- Progress bar updates after each answer
- Question map shows answered questions in teal/blue
- Can navigate forward but not backward

### Step 3: Submit Assessment
1. Answer all 36 questions (or use the "Auto-Fill (Dev)" button for testing)
2. Click "Submit Test" button
3. Wait for processing

**Expected**:
- Submission processes successfully
- No console errors
- Results page loads

### Step 4: Verify Results Display

#### A. Baseline Score
- [ ] Baseline Readiness Index displays (0-100)
- [ ] Score is an integer (no decimals)
- [ ] Score is the average of the 6 quotient percentages

#### B. Quotient Cards (Check all 6)

**CRQ (Cognitive Readiness Quotient)**
- [ ] Quotient name displays: "CRQ"
- [ ] Level badge shows: Strong/Moderate/Developing
- [ ] Percentage displays correctly (0-100%)
- [ ] Progress bar animates to the correct percentage
- [ ] Color matches level (Green=Strong, Amber=Moderate, Red=Developing)

**SRQ (Social Readiness Quotient)**
- [ ] Quotient name displays: "SRQ"
- [ ] Level badge shows: Strong/Moderate/Developing
- [ ] Percentage displays correctly (0-100%)
- [ ] Progress bar animates to the correct percentage
- [ ] Color matches level

**LQ (Learning Quotient)**
- [ ] Quotient name displays: "LQ"
- [ ] Level badge shows: Strong/Moderate/Developing
- [ ] Percentage displays correctly (0-100%)
- [ ] Progress bar animates to the correct percentage
- [ ] Color matches level

**SIQ (Self-Identity Quotient)**
- [ ] Quotient name displays: "SIQ"
- [ ] Level badge shows: Strong/Moderate/Developing
- [ ] Percentage displays correctly (0-100%)
- [ ] Progress bar animates to the correct percentage
- [ ] Color matches level

**PEQ (Physical & Emotional Quotient)**
- [ ] Quotient name displays: "PEQ"
- [ ] Level badge shows: Strong/Moderate/Developing
- [ ] Percentage displays correctly (0-100%)
- [ ] Progress bar animates to the correct percentage
- [ ] Color matches level

**DAQ (Digital Age Quotient)**
- [ ] Quotient name displays: "DAQ"
- [ ] Level badge shows: Strong/Moderate/Developing
- [ ] Percentage displays correctly (0-100%)
- [ ] Progress bar animates to the correct percentage
- [ ] Color matches level

### Step 5: Verify Scoring Logic

**Manual Calculation Check:**
1. Note down the percentage for each quotient
2. Calculate average: (CRQ% + SRQ% + LQ% + SIQ% + PEQ% + DAQ%) / 6
3. Compare with displayed Baseline Score

**Example:**
```
CRQ: 71%
SRQ: 50%
LQ: 83%
SIQ: 67%
PEQ: 86%
DAQ: 50%

Average = (71 + 50 + 83 + 67 + 86 + 50) / 6 = 67.83% → 68%
Baseline Score should display: 68
```

- [ ] Baseline score matches manual calculation (±1 due to rounding)

### Step 6: Verify Level Banding

Check that each quotient's level matches the banding rules:

**Banding Rules:**
- Strong: ≥ 70%
- Moderate: 60% – 69%
- Developing: < 60%

**Examples to verify:**
- [ ] 85% → Strong (Green)
- [ ] 70% → Strong (Green)
- [ ] 69% → Moderate (Amber)
- [ ] 60% → Moderate (Amber)
- [ ] 59% → Developing (Red)
- [ ] 30% → Developing (Red)

## 🐛 Common Issues to Check

### Issue 1: Results Not Displaying
**Symptoms**: Blank page or "Processing Profile Data..." stuck
**Check**:
- Open browser console (F12)
- Look for JavaScript errors
- Check Network tab for failed API calls
- Verify backend is running

### Issue 2: Incorrect Percentages
**Symptoms**: Percentages don't match expected values
**Check**:
- Verify question quotient tags in database
- Check that all 36 questions have quotient tags
- Verify distribution: CRQ=7, SRQ=6, LQ=6, SIQ=6, PEQ=7, DAQ=4

### Issue 3: Wrong Level Classification
**Symptoms**: 75% showing as "Moderate" instead of "Strong"
**Check**:
- Backend code: `determineLevel` function in results.js (line 428-432)
- Should be: `>= 70` for Strong, `>= 60` for Moderate

### Issue 4: Baseline Score Mismatch
**Symptoms**: Baseline score doesn't match average of quotients
**Check**:
- Backend code: line 450 in results.js
- Should calculate: `totalPercentageSum / quotientCount`
- Not: `totalScore / totalQuestions`

## 📊 Sample Test Data

### Test Case 1: All Perfect Scores
**Input**: All 36 questions answered correctly
**Expected Output**:
- All quotients: 100%, Strong
- Baseline Score: 100

### Test Case 2: All Wrong Answers
**Input**: All 36 questions answered incorrectly
**Expected Output**:
- All quotients: 0%, Developing
- Baseline Score: 0

### Test Case 3: Mixed Results (Target Example)
**Input**: Strategic answers to achieve:
- CRQ: 5/7 correct (71%)
- SRQ: 3/6 correct (50%)
- LQ: 5/6 correct (83%)
- SIQ: 4/6 correct (67%)
- PEQ: 6/7 correct (86%)
- DAQ: 2/4 correct (50%)

**Expected Output**:
- CRQ: 71%, Strong
- SRQ: 50%, Developing
- LQ: 83%, Strong
- SIQ: 67%, Moderate
- PEQ: 86%, Strong
- DAQ: 50%, Developing
- Baseline Score: 68

## ✅ Verification Checklist

Once all items are checked:
- [ ] All 6 quotients display correctly
- [ ] Percentages are accurate
- [ ] Level badges match banding rules
- [ ] Baseline score is correct average
- [ ] Visual design looks professional
- [ ] No console errors
- [ ] Animations work smoothly
- [ ] All results saved to database correctly

**Tested by**: _________________
**Date**: _________________

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
