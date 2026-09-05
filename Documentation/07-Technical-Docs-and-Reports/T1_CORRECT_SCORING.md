# T1 Baseline Assessment - Correct Scoring Logic

## Band System (5 Levels)

| Percentage | Level | Description |
|------------|-------|-------------|
| 81-100 | **Advanced** | Exceptional mastery |
| 61-80 | **Strong** | Solid competence |
| 41-60 | **Progressing** | Developing skills |
| 21-40 | **Developing** | Early stage |
| 0-20 | **Emerging** | Beginning journey |

## Quotient Calculation

For each quotient (CRQ, SRQ, LQ, SIQ, PEQ, DAQ):

```javascript
// 1. Count correct answers
correct_answers = count(responses where isCorrect === true)
total_questions = count(all questions for this quotient)

// 2. Calculate percentage
quotient_percentage = (correct_answers / total_questions) × 100

// 3. Determine band
if (quotient_percentage >= 81) level = "Advanced"
else if (quotient_percentage >= 61) level = "Strong"
else if (quotient_percentage >= 41) level = "Progressing"
else if (quotient_percentage >= 21) level = "Developing"
else level = "Emerging"
```

## Baseline Score Calculation

```javascript
// Average of all 6 quotient percentages
baseline_score = (CRQ% + SRQ% + LQ% + SIQ% + PEQ% + DAQ%) / 6

// Apply same band system
baseline_band = determineBand(baseline_score)
```

## Example Output

```json
{
  "baselineScore": 54,
  "stageBand": "Progressing",
  "t1Profile": {
    "CRQ": {
      "rawScore": 71,
      "level": "Strong",
      "earned": 5,
      "possible": 7
    },
    "SRQ": {
      "rawScore": 50,
      "level": "Progressing",
      "earned": 3,
      "possible": 6
    },
    "LQ": {
      "rawScore": 33,
      "level": "Developing",
      "earned": 2,
      "possible": 6
    },
    "SIQ": {
      "rawScore": 67,
      "level": "Strong",
      "earned": 4,
      "possible": 6
    },
    "PEQ": {
      "rawScore": 43,
      "level": "Progressing",
      "earned": 3,
      "possible": 7
    },
    "DAQ": {
      "rawScore": 75,
      "level": "Strong",
      "earned": 3,
      "possible": 4
    }
  }
}
```

## What Gets Removed

❌ No more VAK, EQ, CQ, ARQ, AIQ checks
❌ No more Big5 logic in T1
❌ No more 3-band system (Strong/Moderate/Developing)

✅ Only T1 baseline logic
✅ Clean 5-band system
✅ Simple, defensible scoring
