# T1 Baseline Assessment - Expected Results Format

## Example Output

When a user completes the T1 Baseline Assessment, they will see:

### Baseline Readiness Index
**Score**: 67/100 (average of all quotient percentages)

### Quotient Breakdown

| Quotient | Level | Percentage |
|----------|-------|------------|
| CRQ (Cognitive Readiness Quotient) | Moderate | 67% |
| SRQ (Social Readiness Quotient) | Developing | 50% |
| LQ (Learning Quotient) | Strong | 83% |
| SIQ (Self-Identity Quotient) | Moderate | 67% |
| PEQ (Physical & Emotional Quotient) | Strong | 86% |
| DAQ (Digital Age Quotient) | Developing | 50% |

## How It Works

### 1. Question Distribution (36 Total)
- **CRQ**: 7 questions
- **SRQ**: 6 questions
- **LQ**: 6 questions
- **SIQ**: 6 questions
- **PEQ**: 7 questions
- **DAQ**: 4 questions

### 2. Scoring Per Quotient
- Each correct answer = 1 point
- Percentage = (Points Earned / Total Questions) × 100
- Example: CRQ with 5 correct out of 7 = 71%

### 3. Level Classification
- **Strong**: ≥ 70%
- **Moderate**: 60% – 69%
- **Developing**: < 60%

### 4. Baseline Score Calculation
- Average of all 6 quotient percentages
- Example: (67 + 50 + 83 + 67 + 86 + 50) / 6 = 67%
- This ensures each quotient has equal weight regardless of question count

## Visual Display
Each quotient card shows:
- Quotient name (e.g., "CRQ")
- Level badge (color-coded: green for Strong, amber for Moderate, rose for Developing)
- Animated progress bar showing the percentage
- Percentage value displayed below the bar

## Backend Response Format
```json
{
  "success": true,
  "data": {
    "resultId": "...",
    "baselineScore": 67,
    "t1Profile": {
      "CRQ": {
        "rawScore": 67,
        "level": "Moderate",
        "earned": 5,
        "possible": 7
      },
      "SRQ": {
        "rawScore": 50,
        "level": "Developing",
        "earned": 3,
        "possible": 6
      },
      "LQ": {
        "rawScore": 83,
        "level": "Strong",
        "earned": 5,
        "possible": 6
      },
      "SIQ": {
        "rawScore": 67,
        "level": "Moderate",
        "earned": 4,
        "possible": 6
      },
      "PEQ": {
        "rawScore": 86,
        "level": "Strong",
        "earned": 6,
        "possible": 7
      },
      "DAQ": {
        "rawScore": 50,
        "level": "Developing",
        "earned": 2,
        "possible": 4
      }
    },
    "assessmentType": "T1_BASELINE"
  }
}
```
