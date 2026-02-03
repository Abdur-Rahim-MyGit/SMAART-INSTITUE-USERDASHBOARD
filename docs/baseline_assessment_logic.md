# Baseline Assessment (T1) - Technical Documentation

## Question Selection & Distribution
- **Total Pool**: ~300 Questions
- **Selection Size**: 36 Questions per user
- **Selection Method**: Stratified sampling across 6 quotients
  - CRQ (Cognitive Readiness Quotient): 7 questions
  - SRQ (Social Readiness Quotient): 6 questions
  - LQ (Learning Quotient): 6 questions
  - SIQ (Self-Identity Quotient): 6 questions
  - PEQ (Physical & Emotional Quotient): 7 questions
  - DAQ (Digital Age Quotient): 4 questions

## Shuffling Strategy
- **Method**: Seeded Fisher-Yates Shuffle
- **Seed**: User ID (ensures consistent question order for resumable sessions)
- **Result**: Each user gets a unique, reproducible set of 36 questions

## Scoring System
- **Grading**: Real-time, binary (Correct = 1 point, Incorrect = 0 points)
- **Quotient Scores**: Percentage calculated per quotient (earned/total × 100)
- **Baseline Score**: Average of all 6 quotient percentages
- **Banding Rules**:
  - **Strong**: ≥ 70%
  - **Moderate**: 60% – 69%
  - **Developing**: < 60%

## Results Display
Each quotient shows:
- **Level**: Strong/Moderate/Developing (based on banding rules)
- **Percentage**: Raw score percentage (0-100%)
- **Visual Bar**: Animated progress bar matching the level
2