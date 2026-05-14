<!-- converted from SMAART_Complete_Course_Architecture.docx -->

SMAART
COMPLETE COURSE ARCHITECTURE
Master Reference Document — April 2026




# SECTION 1 — THE BIG PICTURE: WHAT SMAART ACTUALLY IS
SMAART is not a conventional e-learning platform. It is a career readiness measurement and certification system — the difference matters enormously for how you build it. A conventional e-learning platform delivers content and tracks completion. SMAART delivers content, measures genuine behavioural capability through a rigorous psychometric engine, and produces a legally defensible, employer-readable credential called the Skills Passport.

The best analogy is a credit score. Just as a FICO credit score converts thousands of financial behaviours into one number a bank can act on, SMAART converts thousands of assessed workplace behaviours into one number — the SRI (300–900) — that an employer can act on. The SRI is not self-reported; it is earned through demonstrated judgment across 40 courses, 4 stage assessments, and daily micro-challenges over 2–4 years.

## 1.1 — The Three Problems It Solves
The entire architecture exists to solve three specific, research-documented problems in Indian and UK higher education. Understanding them helps you understand every design decision in the system.


## 1.2 — The One-Page Architecture
Everything in SMAART fits into one conceptual framework. There are four nested layers, and every feature in the product lives inside one of them.


## 1.3 — How It Differs From the Old Architecture
The previous SMAART specification (the old Flow Document and BRD v2) described a 75-skills framework across 15 modules using a 3-Day Learning Framework. The new architecture is a fundamental redesign. Here is what changed and why it matters.


# SECTION 2 — THE 25 HUMAN INTELLIGENCE COURSES
The 25 Human Intelligence courses are the heart of the SMAART programme. Each course teaches exactly one named framework in approximately 40 minutes of learning, followed by a 7-minute assessment. The courses are delivered in three sequential stages that mirror the developmental arc of a professional career: first you learn to manage yourself (Capacity), then to work with others (Capability), then to lead and influence (Leadership).

The naming convention is important. Every course has a dual name: a code (S01), a human-readable topic ('Analytical Thinking'), and a framework acronym ('CLEAR-5'). The framework acronym is what the student is expected to remember and use — in job interviews, on the job, and in further learning.

## 2.1 — Stage 1: CAPACITY (Courses S01–S10)
Ten courses. The question this stage answers is: 'Can I manage myself and think clearly?' These courses develop the CRQ, SRQ, and PEQ quotients — the foundational cognitive and self-management skills. A student CANNOT move to Stage 2 until all 10 Capacity courses are passed at 70% AND the T2 stage assessment is taken.
Domain emphasis: THINKING + ADAPTING. These are the McKinsey DELTA categories of Cognitive and Self-Leadership.



## 2.2 — Stage 2: CAPABILITY (Courses S11–S19)
Nine courses. The question is: 'Can I work with others and deliver results?' Domain emphasis shifts to CONNECTING and thinking applied to interpersonal contexts. The key gateway course is S15 GUARD-4, which unlocks the AIQ Track. PEQ and SIQ quotients deepen here; DAQ begins.



## 2.3 — Stage 3: LEADERSHIP (Courses S20–S25)
Six courses. The question: 'Can I influence, create and lead?' Domain emphasis shifts to CREATING and CONNECTING applied to organisational contexts. S21 LENS-4 unlocks the SQ Track. LQ and SEQ quotients activate here.



# SECTION 3 — INSIDE ONE COURSE: THE 8-STEP FRAMEWORK
This is where the new architecture differs most radically from the old one. Every one of the 40 courses uses exactly the same 8-step learning structure, followed by a 3-part assessment. The total time per course is approximately 47–50 minutes: 40 minutes of learning across 7 mandatory steps, plus an optional personal notes step, plus 7 minutes of formal assessment.
The design philosophy behind this structure is based on five learning science principles: narrative transportation (stories improve recall by 30–40%), schema theory (named frameworks organise knowledge for retrieval), deliberate practice (repeated ranking tasks build genuine judgment), spaced repetition (flash cards compress frameworks for long-term memory), and constructivism (reflection personalises learning for transfer to the workplace).

## 3.1 — The 7 Mandatory Learning Steps


## 3.2 — The 3-Part Course Assessment (7 minutes)
After the 7 mandatory learning steps, the student takes a 7-minute assessment. This is formally scored and determines whether the student passes the course. The formula is: course_score = (MCQ × 0.15) + (FIB × 0.10) + (SJT × 0.75). The pass threshold is 70%.
Notice the weighting: SJTs (Situational Judgment Tests) carry 75% of the score. This is deliberate. MCQ and fill-in-the-blank test recall. SJTs test judgment — whether the student can apply the framework to a real scenario they have not seen before.



## 3.3 — What Happens When a Student Fails

# SECTION 4 — HOW SJTS ARE SCORED: KENDALL'S TAU-B
The most important thing to understand about SMAART's assessment engine is that the primary question type — the Situational Judgment Test (SJT) — is NOT scored by marking one answer correct or incorrect. Instead, it is scored by comparing the student's RANKING of four options against an expert ranking, using a psychometric method called Kendall's tau-b pairwise concordance. This is the same method used in UK Civil Service Fast Stream recruitment and NHS graduate assessment centres.

Why this method? Professional judgment in real workplaces is almost never binary. There is rarely one 'right answer' and one 'wrong answer.' Instead, some responses are clearly better than others, and some options are only marginally better than others. Pairwise concordance rewards a student who gets the RELATIVE ORDER right — even if they did not pick the exact top option. This produces a more nuanced, fair, and defensible measure than simple correctness.

## 4.1 — The Formula in Plain English

## 4.2 — Worked Example
This example shows exactly how a student score of 83.3/100 is computed when they get most but not all of the ranking right.


This student scored 83.3/100 despite not getting the exact right answer — because they correctly identified that B and D were the two best options and only confused the 3rd and 4th positions. This is appropriate: confusing 3rd and 4th place is a minor judgment error; confusing 1st and 4th would be a major one.

## 4.3 — The SRI Formula: How the Single Score Is Computed
The SRI (SMAART Readiness Index, 300–900) is the headline credential score. It is computed from 5 legally compliant categories — none of which include any demographic information. The five categories and their weights are:




# SECTION 5 — THE THREE READINESS TRACKS
Alongside the 25 core HI courses, SMAART offers three specialist certification tracks: PIQ (Personal Intelligence), AIQ (AI Readiness), and SQ (Sustainability Readiness). Each track has 5 courses and ends with a 30-minute capstone assessment. Completing all 5 courses at ≥70% AND the capstone at ≥65% earns a 'SMAART [Track] Certified' credential that appears on the Skills Passport.
The tracks are stackable — a student can earn all three — and they run alongside the core programme, not instead of it. Which tracks are included in a student's subscription depends on their institutional tier (explained in Section 7). The tracks are sector-agnostic and role-agnostic for the same reason the HI courses are.

## 5.1 — PIQ: Personal Intelligence Track
Purpose: Build the self-awareness, emotional regulation, growth mindset, purpose, and confidence that make a professional effective under pressure. This is the 'inner game' of professional life. Prerequisite: S05 RESET-4. Available from Year 1 — the earliest of all three tracks. Feeds the PEQ quotient.

## 5.2 — AIQ: AI Readiness Track
Purpose: Not how to USE AI tools — how to WORK WITH AI as a colleague. The five competencies map directly to McKinsey's 5 human-AI lifecycle stages (instruct → evaluate → design → govern → evolve). Prerequisite: S15 GUARD-4 PLUS any one external AI literacy certificate (Anthropic AI Fluency for Students is free; Google and Microsoft certificates accepted). Available from Year 2 (Capability stage). Feeds the DAQ quotient.

## 5.3 — SQ: Sustainability Readiness Track
Purpose: Not environmentalism — how to make sustainable decisions in any job, any sector. How to factor sustainability into everyday professional choices in a way that is honest, defensible, and not 'greenwashing.' Prerequisite: S21 LENS-4 (Ethical Judgment). Available from Year 3 (Leadership stage). Feeds the SEQ quotient.

## 5.4 — The Track Capstone: Extended Multi-Stage SJT
Each track ends with a 30-minute capstone assessment — the most complex assessment in the system. In the old architecture, this was an open-ended written task. In the new architecture (Doc 8), it is a 5-Stage Extended Multi-Stage SJT where each stage adds new information and the student must re-rank their response. Crucially, there is a revision appropriateness bonus/penalty — if the expert ranking changes between stages and the student does NOT update their ranking, that is scored negatively. Real professional judgment requires revising when new information arrives.


# SECTION 6 — THE FOUR STAGE ASSESSMENTS (T1 TO T4)
Beyond the individual course assessments, SMAART has four major stage assessments that mark the transition between programme phases. These are 'validation gates' — a student cannot proceed to the next stage without taking the current gate assessment. They also produce the growth trajectory data that powers the SRI Growth Trajectory category.



# SECTION 7 — THE THREE PRODUCT TIERS
SMAART comes in three commercial tiers. The key insight — which changed significantly from the old architecture — is that ALL 25 HI courses are available on EVERY tier. Tiers differ in which TRACKS are included versus add-on, whether interview prep mode is available, and the depth of renewal and coaching support. No tier removes course content.



## 7.1 — English Proficiency: Completely Separate
English Proficiency by British Council is a standalone add-on that can be purchased alongside ANY tier or on its own. It has its own internal scoring system (Speaking, Writing, Reading, Listening — each 25% of the English Score 0–100, with a CEFR level A1–C2 and English Band). It appears as a dedicated section on the Skills Passport. Critically, it does NOT contribute to the SRI formula in any way. A student's English score never affects their readiness quotients.

# SECTION 8 — ENTRY POINTS & FOUR PATHWAYS
Not every student joins SMAART at Year 1 of their degree. The platform handles every possible entry point through a deterministic onboarding decision tree that runs once at registration. The key variable is SEMESTERS REMAINING — how many academic semesters does the student have before graduation?



The onboarding decision tree runs pseudocode at registration. It collects: programme_type, current_year, current_semester, work_experience_months, degree, and college_id. From these it derives semesters_remaining and assigns: track (A or B), pathway (STANDARD / ACCELERATED / FOUNDATION / CATCH_UP), and calendar alignment to the institution's actual semester dates.

# SECTION 9 — DAILY MICRO-CHALLENGES & LEARNING CONSISTENCY
The daily micro-challenge is a 2-minute task that every student receives every day. In the new architecture (Doc 8), these are mini-SJTs — one 60–100 word workplace scenario with four options to rank. They are scored by pairwise concordance (the same algorithm as course and stage assessments) and the student receives immediate expert-ranking feedback.
This is pedagogically significant. The student is doing the actual skill (structured judgment) rather than reading about the skill. Immediate feedback from a genuine expert ranking is, according to Hattie & Timperley (2007), the single strongest driver of learning. Two minutes fits into any schedule and sustains the daily habit that converts short-term learning into long-term retention.



# SECTION 10 — DEVELOPER CHEAT SHEET
This section consolidates everything a developer needs to know in one reference. It assumes familiarity with the architecture described in previous sections.

## 10.1 — Course Tracking Database Schema

## 10.2 — Course Completion Criteria
A course is marked COMPLETE — and the next course unlocks — ONLY when ALL five conditions are simultaneously true:
- step_a_viewed through step_g_viewed are all TRUE (all 7 mandatory steps completed)
- step_c_sections_expanded has TRUE for every accordion section (all framework steps opened)
- step_h_response submitted AND meets minimum word count (even though H is unscored)
- At least one assessment attempt has been made (assessment_attempts ≥ 1)
- assessment_passed = TRUE (course_score ≥ 70%)

## 10.3 — SJT Scoring Function (Must Implement Exactly)

## 10.4 — Per-Student Seeded Item Selection
Every student sees a deterministically selected but unique subset of questions. The seed for selection is: hash(user_id + '|' + assessment_id + '|' + attempt_number). This means the same student on the same assessment on attempt 1 always sees the same questions, but attempt 2 (different attempt_number) produces a different selection — ensuring retakes use fresh items while being reproducible for audit purposes.

## 10.5 — Stage Gate Logic

## 10.6 — Content Architecture (Build-Time vs Runtime)

## 10.7 — The 7 Quotients: Reference

## 10.8 — The 10 Professional Standards (Skills Passport Star Ratings)

# SECTION 11 — WHAT THIS MEANS FOR YOUR SYSTEM: SUMMARY
After reading all 8 specification documents and consolidating them into this guide, here is the simplest possible summary of what you are building and what makes it different from conventional LMS platforms.


SMAART — Complete Course Architecture Reference
Confidential — Internal Use Only  |  April 2026  |  Version 3.0
| Field | Details |
| --- | --- |
| Document Version | 3.0 — New Architecture (8 Documents Consolidated) |
| Source Documents | Doc 1, 1B, 2, 2A, 3, 4, 5, 6, 7, 8 |
| Programme Scale | 25 HI Courses + 15 Track Courses + 4 Stage Assessments |
| Audience | Development, Product, Academic, Institutional Leaders |
| Classification | Confidential — Internal Use Only |
| WHAT THIS DOCUMENT IS:  A complete, consolidated explanation of the new SMAART course architecture across all 8 specification documents. It explains WHAT the system is, HOW it works, WHY it is designed this way, and WHAT developers need to build. Read this first before opening any individual spec document. |
| --- |
| Problem | Scale of Evidence | What SMAART Does About It |
| --- | --- | --- |
| Students graduate without understanding their own strengths and skill gaps | McKinsey DELTAs study: self-leadership is the single strongest predictor of employment across 18,000 respondents | T1 baseline assessment on Day 1 — 21 SJTs across 7 quotients — gives every student a verified starting profile |
| Academic curricula teach domain knowledge but not workplace behavioural skills | WEF Future of Jobs 2025: 39% of current skills obsolete by 2030; NASSCOM: communication, critical thinking, AI fluency are the 3 biggest gaps in Indian graduates | 25 Human Intelligence courses each teaching one named, reusable workplace framework. Skills are sector-agnostic and role-portable |
| Students have no credible, tamper-proof way to prove growth beyond a paper degree | No Indian degree programme currently teaches or certifies these capabilities in a measurable way (Doc 1) | Skills Passport with SRI score, 10 Standards ratings, track certifications, technical skills — scannable by QR code, verifiable by any employer |
| Layer | What It Is | What It Produces |
| --- | --- | --- |
| CORE PROGRAMME | 25 Human Intelligence (HI) courses, delivered in 3 developmental stages (Capacity → Capability → Leadership) | Named frameworks (CLEAR-5, RESET-4, etc.) the student can use from Day 1 of employment |
| READINESS TRACKS | 3 specialist certifications that run alongside the core: PIQ (Personal Intelligence), AIQ (AI Readiness), SQ (Sustainability Readiness) | Stackable certifications ('SMAART AIQ Certified') on top of the core credential |
| ASSESSMENT ENGINE | 4 stage assessments (T1–T4) + daily micro-challenges + course assessments. All mathematically scored using Kendall's tau-b | 7 Quotient scores that update as the student progresses; growth trajectory from T1 to T4 |
| SKILLS PASSPORT | The credential layer: SRI 300–900, 10 Standards with star ratings, track certifications, technical skills, CEFR English (optional) | One shareable document an employer can verify by scanning a QR code |
| Dimension | OLD Architecture (BRD v2 / Flow Doc) | NEW Architecture (Docs 1–8) | Impact for Developers |
| --- | --- | --- | --- |
| Course count | 75 skills across 15 modules | 25 HI courses (S01–S25) + 15 track courses = 40 total | Significantly fewer courses to build — but each is more sophisticated |
| Course structure | 3-Day Framework (Steps 0–9): video → framework → evidence task → reflection | 8-Step Framework (A–H): text-based story → framework accordion → ranked practice → flash card → extended practice → case study → optional notes | No video hosting required. All content is text-based. Assessment is SJT ranking, not MCQ-only |
| Assessment method | Multiple-choice only, binary scoring (correct/incorrect) | Primarily Situational Judgment Tests (SJTs) scored by Kendall's tau-b pairwise concordance — a psychometric ranking method | Assessment scoring engine is fundamentally different — not a simple right/wrong checker |
| SRI / Score | PPI and PLVI only — both relatively simple formulas | SRI 300–900 with 5 weighted categories (TC, PC, LC, BR, GT), plus 7 quotient scores, plus 10 Standards star ratings | More complex aggregation engine; requires understanding the SRI formula |
| Content generation | Human SME-created content | Claude-first pipeline at BUILD TIME — runtime is fully deterministic and AI-free | No runtime Claude API calls in the student-facing platform |
| Assessment integrity | Proctoring, tab-switch detection | Per-student seeded selection (no two students see same questions), variant generation for retakes, 4-layer anti-gaming | Item selection must use seeded randomisation per student+assessment+attempt |
| Daily activity | No daily challenge system | Daily 2-minute mini-SJT micro-challenges feeding the Learning Consistency category of SRI | New component to build: daily challenge selection, scoring, and streak tracking |
| Track capstone | Evidence task / artefact submitted by student | 5-Stage Extended Multi-Stage SJT — student re-ranks as new information arrives across 5 stages | Complex capstone engine with revision bonus/penalty scoring |
| Code | Course Name | Framework | Quotient | Time | What the Graduate Can Do |
| --- | --- | --- | --- | --- | --- |
| S01 | Analytical Thinking: Structured Decision-Making | CLEAR-5 | CRQ | 30 min | Classify the problem, List constraints, Examine options, Act defensibly, Record rationale. Use for every significant decision. |
| S02 | Problem-Solving: Decomposition | BREAK-4 | CRQ | 25 min | Break complex problems into parts, sequence them, start with the highest-leverage piece first. |
| S03 | Critical Thinking: Evidence-Based Judgment | READ-3 | CRQ | 20 min | Read evidence, check sources, separate claim from argument, form a defensible view. |
| S04 | Data Literacy | COUNT-3 | CRQ | 25 min | Read charts and tables, understand averages/ranges/outliers, avoid common misreadings. |
| S05 | Resilience & Adaptability | RESET-4 | SRQ | 25 min | Recognise setback, regulate emotion, extract lesson, set next action. PIQ Track unlocks here. |
| S06 | Curiosity & Accelerated Learning | SPRINT-4 | SRQ | 25 min | Scan for the 20% that covers 80%, practise immediately, record what works, iterate with feedback. |
| S07 | Priority & Energy Management | OWN-4 | PEQ | 30 min | Observe energy patterns, write weekly top-3 priorities, negotiate time, review every Friday. |
| S08 | Quality Consciousness | CHECK-3 | PEQ | 20 min | Check work against the brief, examine edge cases, confirm with requestor before submitting. |
| S09 | Commercial Awareness | VALUE-4 | PEQ | 25 min | See how money is made, understand cost vs. value, speak the language of the business. |
| S10 | Professional Networking | LINK-4 | SIQ | 25 min | Make first connection, maintain relationship, ask for help credibly, give before taking. |
| STAGE 1 GATE:  To proceed to Stage 2 (Capability), the student must have PASSED all 10 courses (S01–S10) at ≥70% AND taken the T2 stage assessment. No partial completion. ALL 10 means ALL 10. |
| --- |
| Code | Course Name | Framework | Quotient | Time | What the Graduate Can Do |
| --- | --- | --- | --- | --- | --- |
| S11 | Professional Communication | SIGNAL-3 | SIQ | 25 min | Set context, inform clearly, gain alignment. No jargon, short sentences, one recommendation. |
| S12 | Empathy & Active Listening | MIRROR-3 | SIQ | 25 min | Reflect what you heard, ask one clarifying question, name the emotion before responding. |
| S13 | Team Collaboration | TEAM-4 | SIQ | 25 min | Agree roles, set norms, manage progress, close loops — the habits of a team that delivers. |
| S14 | Constructive Disagreement | BRIDGE-3 | SIQ | 25 min | Separate issue from person, state interest beneath position, propose a next step. |
| S15 ★ | AI-Augmented Work (AI Safety Foundation) | GUARD-4 | DAQ | 35 min | Ground the task, Understand the risk, Audit the output, Record verification. AIQ Track unlocks here. |
| S16 | Systems Thinking | ZOOM-3 | DAQ | 20 min | See the whole before the part, map relationships, spot the lever point. |
| S17 | Professional Presentation | STAGE-4 | SIQ | 25 min | Structure the talk, tailor to audience, anticipate questions, end with the ask. |
| S18 | Stakeholder Orientation | SERVE-4 | SIQ | 25 min | Identify real stakeholder, understand their measure of success, deliver against that standard. |
| S19 | Negotiation | DEAL-4 | SIQ | 25 min | Know your BATNA, open with interests, trade variables, close with commitment. |
| STAGE 2 GATE:  To proceed to Stage 3 (Leadership), the student must pass ALL 9 courses (S11–S19) at ≥70% AND take the T3 stage assessment. |
| --- |
| Code | Course Name | Framework | Quotient | Time | What the Graduate Can Do |
| --- | --- | --- | --- | --- | --- |
| S20 | Uncertainty Decision-Making | EDGE-4 | LQ | 25 min | Decide with incomplete information: identify what you know, must assume, and the reversibility of the choice. |
| S21 ★ | Ethical Judgment | LENS-4 | SEQ | 25 min | Look at who is affected, Examine harms and benefits, Note duties, Stand transparent. SQ Track unlocks here. |
| S22 | Developing Others | GROW-4 | SEQ | 25 min | Goals, Reality, Options, Will. Coach a colleague without telling them what to do. |
| S23 | Effective Delegation | HAND-4 | SEQ | 25 min | Hand over the outcome not the task, agree check-in, remain accountable, resist reclaiming. |
| S24 | Leading Change | MOVE-4 | SEQ | 25 min | Make the case, acknowledge resistance, demonstrate early wins, embed the new behaviour. |
| S25 | Creative Thinking | FLIP-3 | LQ | 25 min | Reframe the question, invert the constraint, steal a structure from a different domain. |
| STAGE 3 GATE:  After ALL 6 Leadership courses + T4 stage assessment: the student receives their Verified Skills Passport with complete T1–T4 growth trajectory and full SRI score. |
| --- |
| Step | Name | Duration | Format | What It Does | Completion Rule |
| --- | --- | --- | --- | --- | --- |
| A | WHY THIS MATTERS | 4 min | Read-only text (200–250 words) | Establishes RELEVANCE before teaching. Cites one external workplace statistic, one career consequence, one course preview. Student must understand WHY before learning HOW. | Scroll to bottom + 60 seconds minimum on screen |
| B | STORY | 6 min | Narrative text (300–350 words) | A named character faces a real workplace problem. Arc: situation → struggle → hint at resolution (but NOT the resolution — that comes in Step C). Narrative transportation: the reader is emotionally invested before the framework is taught. | Scroll to bottom + 90 seconds minimum |
| C | FRAMEWORK | 7 min | Expandable accordion UI | The named framework is taught step-by-step. Each accordion section has exactly three blocks: Explanation (50–80 words), Example (60–100 words), Common Mistake (30–50 words). Student MUST expand every section. | All accordion sections expanded = TRUE |
| D | PRACTICE | 8 min | 2 × drag-and-drop SJT | Two moderate-difficulty scenarios where the student ranks 4 response options. IMMEDIATE model-answer feedback explains WHY the expert ranking is what it is. NOT scored in the final course grade — pure learning. | At least 1 of 2 scenarios submitted |
| E | FLASH CARD | 2 min | Flip card UI | Front: framework name + 1-sentence summary. Back: 3 'interview-ready phrases' the student can use in conversation. Spaced repetition design — compresses the framework into memorable language. | Card flipped at least once |
| F | EXTENDED PRACTICE | 6 min | 2 × drag-and-drop SJT (harder) | Same mechanics as Step D but scenarios add constraints: time pressure, conflicting stakeholders, incomplete information. Tests DEEPER application, not just recall. Separate question pool from Step D. | At least 1 of 2 scenarios submitted |
| G | CASE STUDY | 5 min | Long narrative (350–400 words) + MCQ | Shows the framework applied across a full work week (Mon–Fri). Ends with one comprehension MCQ. Tests whether the student understands which framework step applied in which situation. MCQ not scored in course grade. | MCQ answered |
| STEP H (OPTIONAL):  Step H is a Personal Notes box — unscored, private, never visible to institutions or employers. The student writes how THEY would apply the framework in their career. It has no minimum word count and does not affect the course grade. Whether the student uses it at all is recorded as an engagement signal (0 or 1 per course) that contributes a small amount to Learning Consistency. |
| --- |
| Part | Type | Questions | Time | Scoring | Pool Size |
| --- | --- | --- | --- | --- | --- |
| Part A | Multiple Choice Questions (MCQ) | 3 MCQs | 2 min (45 sec each) | Exact correct answer. MCQ_pct = (correct / 3) × 100. Weight: 15% of course_score. | 50 MCQs per course |
| Part B | Fill in the Blank (FIB) | 1 FIB with 2–3 blanks | 1 min | Fuzzy string match (Levenshtein ≤2 for words ≥5 chars). FIB_pct = (correct_blanks / total_blanks) × 100. Weight: 10%. | 24 FIB variants per course |
| Part C | Situational Judgment Tests (SJT) | 3 SJTs — rank 4 options each | 4 min total (timer hidden — anti-gaming) | Pairwise concordance (Kendall's tau-b). Averaged across 3 SJTs. Weight: 75% of course_score. | 15 SJTs per course (separate from practice pools) |
| ANTI-GAMING RULE:  The Part C SJT pool (15 items) is COMPLETELY SEPARATE from the Step D practice pool (10 items) and the Step F extended practice pool (10 items). No question ever appears in more than one pool. This prevents students from treating practice as a preview of the assessment. |
| --- |
| Score | Category | What Happens |
| --- | --- | --- |
| ≥70% | PASSED | Next course unlocks immediately. course_score saved. assessment_passed = TRUE. |
| 50–69% | Partial | 10-minute targeted review prompt. Student retakes with FRESH variant set (new seed = different questions from same pools). |
| <50% | Failed | 20-minute full review prompt. Retake with fresh variant. Maximum 3 attempts per cycle before entering Targeted Remediation. |
| 3 attempts, still <70% | Remediation | PO configures support plan. 30-day cooling period. Retake with fresh variant. Course stays UNPASSED and stage gate stays locked until 70% is reached. |
| THE ALGORITHM:  For each SJT: (1) The student ranks 4 options from most to least effective. (2) The system compares this ranking to the stored expert ranking using all 6 possible PAIRS of options. (3) Each pair is either CONCORDANT (student order matches expert) or DISCORDANT (student order is reversed). (4) tau_b = (concordant - discordant) / 6. (5) sjt_score = ((tau_b + 1) / 2) × 100, which normalises the result to 0–100. |
| --- |
| Step | Detail |
| --- | --- |
| Expert ranking | B > D > C > A (stored in database) |
| Student ranking | B > D > A > C (what the student submitted) |
| Pair B vs D | Student: B > D. Expert: B > D. CONCORDANT ✓ |
| Pair B vs A | Student: B > A. Expert: B > A. CONCORDANT ✓ |
| Pair B vs C | Student: B > C. Expert: B > C. CONCORDANT ✓ |
| Pair D vs A | Student: D > A. Expert: D > A. CONCORDANT ✓ |
| Pair D vs C | Student: D > C. Expert: D > C. CONCORDANT ✓ |
| Pair A vs C | Student: A > C. Expert: C > A. DISCORDANT ✗ (student swapped 3rd and 4th) |
| Calculation | concordant=5, discordant=1, total=6. tau_b = (5-1)/6 = 0.667 |
| Final SJT score | ((0.667 + 1) / 2) × 100 = 83.3/100 |
| Category | Code | Weight | What It Measures | Data Source |
| --- | --- | --- | --- | --- |
| Track Completion | TC | 30% | How many courses has the student completed in their chosen career direction? Rewards sustained effort over the full programme. | course completion records, calibrated against chosen direction |
| Performance Calibration | PC | 30% | Quality of assessed work: course SJT scores + stage assessment scores + track competency scores averaged and weighted. | assessment results database |
| Learning Consistency | LC | 20% | Daily micro-challenge engagement, streak maintenance, monthly fitness checks (Tier 2/3), and reflection engagement signal. | daily challenge completion, streak data, Tier-specific engagement |
| Behavioural Range | BR | 10% | Breadth of quotients covered — has the student demonstrated capability across all 7 quotients or only in a narrow range? | per-quotient score coverage |
| Growth Trajectory | GT | 10% | How much did the student improve from T1 baseline to T4 final? Rewards genuine learning, not starting advantage. | T1 and T4 stage assessment comparison |
| KEY DESIGN PRINCIPLE:  Growth (GT) is floored at ZERO — a student can never be penalised for improvement. If their T4 score is lower than T1 (theoretically possible with harder SJTs), GT = 0, not negative. Time taken is NEVER a scoring input. Demographics are NEVER a scoring input. |
| --- |
| SRI Band | Score Range | Meaning for Employers |
| --- | --- | --- |
| Emerging | 300–449 | Early stage of development — building foundational competencies. Not yet placement-ready. |
| Developing | 450–549 | Building capability — progressing through core skills. Emerging placement potential. |
| Capable | 550–649 | Ready for first job with mentorship and support. Most graduates at programme mid-point land here. |
| Proficient | 650–749 | Ready for placement — strong core employability demonstrated. Target band for programme completion. |
| Advanced | 750–900 | Highly employable — exceptional readiness across all quotients. Top-tier graduates and fast learners. |
| Code | Competency | Framework | What the Graduate Can Do |
| --- | --- | --- | --- |
| PIQ-1 | Self-Awareness | REFLECT-3 | Notice patterns in your behaviour, name feelings accurately, see yourself as others see you. |
| PIQ-2 | Emotional Regulation | STEADY-4 | Stay composed under pressure, recover quickly, choose response over reaction. |
| PIQ-3 | Growth Mindset | EVOLVE-3 | Treat setbacks as data, seek feedback actively, keep trying when it is hard. |
| PIQ-4 | Purpose & Motivation | DRIVE-4 | Articulate what you work for, align daily effort with it, replenish energy when it drops. |
| PIQ-5 (+ capstone) | Professional Confidence | STAND-3 | Speak up credibly, hold your view under challenge, know when to change it. |
| Code | Competency | Framework | Lifecycle Stage | What the Graduate Can Do |
| --- | --- | --- | --- | --- |
| AIQ-1 | Orchestrating AI Partners | DIRECT-4 | INSTRUCT | Define outcome, instruct with context, review against brief, integrate own judgment. |
| AIQ-2 | Judging AI Work | VERIFY-4 | EVALUATE | Spot hallucinations, check facts, document verification, calibrate trust by output type. |
| AIQ-3 | Designing the Human-AI Split | SPLIT-3 | DESIGN | Decide which tasks go to AI, which stay human, which are shared; measure time saved. |
| AIQ-4 | Governing AI Responsibly | TRUST-4 | GOVERN | Follow policy, protect sensitive data, raise concerns, explain AI decisions to stakeholders. |
| AIQ-5 (+ capstone) | Evolving With AI | FUTURE-3 | EVOLVE | Assess which skills AI can replicate, develop complementary skills, update career plan quarterly. |
| Code | Competency | Framework | What the Graduate Can Do |
| --- | --- | --- | --- |
| SQ-1 | Sustainability Literacy | PLANET-3 | Understand how YOUR industry connects to environmental challenges. Specific, not generic. |
| SQ-2 | Sustainable Decision-Making | GREEN-4 | Factor environmental impact into everyday decisions, with trade-offs stated honestly. |
| SQ-3 | Circular Thinking | CYCLE-3 | Redesign a process to reduce waste and close the resource loop. |
| SQ-4 | Impact Communication | REPORT-4 | Communicate sustainability performance honestly — avoid greenwashing, meet CSRD/BRSR standards. |
| SQ-5 (+ capstone) | Green Innovation | SEED-3 | Spot sustainability improvements in your own role and drive adoption in your team. |
| Stage | Duration | What Happens | Scoring |
| --- | --- | --- | --- |
| Stage 1 | 5 min | Initial scenario (200–300 words). Student ranks 4 options from most to least effective. | Pairwise concordance × 15% of final score |
| Stage 2 | 5 min | Twist: new stakeholder or constraint added (80–120 words). Student RE-RANKS the same options. | Pairwise concordance × 20% |
| Stage 3 | 5 min | Twist: timeline compressed (time pressure added). Student re-ranks. | Pairwise concordance × 20% |
| Stage 4 | 5 min | Twist: ethical dimension or resource constraint introduced. Student re-ranks. | Pairwise concordance × 20% |
| Stage 5 (track-specific) | 5 min | AIQ: timeline sequencing (8 actions in correct order). PIQ: weighted concern ranking. SQ: stakeholder response matrix. | Track-specific scoring × 25% |
| Revision bonus | Calculated across stages 2–5 | If expert ranking changed between stages AND student updated their ranking: bonus points. If not updated: penalty. | Added to final capstone_score (clamped 0–100) |
| CAPSTONE PASS THRESHOLD:  capstone_score ≥ 65%. If below 65%, one retake allowed after 30 days, using a different capstone from the pool (6 capstones per track at launch). certification = SMAART [Track] Certified. |
| --- |
| Assessment | Timing | Questions | Quotients | What It Measures | Output |
| --- | --- | --- | --- | --- | --- |
| T1 Baseline | Day 1 — before any courses | 21 SJTs (Track A standard). 14 SJTs for CATCH_UP early stage. | All 7 quotients | Starting profile across all 7 quotients. Not a grade — a baseline for measuring growth. | S_baseline score per quotient. Dashboard unlocked. |
| T2 Capacity | After ALL 10 Capacity courses (S01–S10) | 21 SJTs — harder pool than T1 | CRQ, SRQ, PEQ primary focus | Validates Capacity stage. Measures foundational cognitive and self-management readiness. | Growth vs T1. If all Capacity courses passed + T2 taken: Capability stage unlocks. |
| T3 Capability | After ALL 9 Capability courses (S11–S19) | 21 SJTs — harder pool than T2 | SIQ, DAQ primary. SEQ introduced. | Validates Capability stage. Measures ability to work with others and deliver results. | Growth vs T2. Leadership stage unlocks. |
| T4 Leadership | After ALL 6 Leadership courses (S20–S25) | 21 SJTs — hardest pool. All 7 quotients active. | All 7 quotients including full SEQ weight | Full holistic leadership readiness. Final programme validation. | Final SRI computed. Verified Skills Passport generated. Full credential issued. |
| IMPORTANT — Stage Assessment vs Course Assessment:  Stage assessments (T1–T4) use 21 SJTs drawn from a separate stage assessment pool — NOT the same SJTs as individual course assessments. Stage assessments test GENERAL professional judgment across multiple quotients. Course assessments test SPECIFIC framework application for one particular skill. |
| --- |
| Feature | Tier 1: SMAART Core | Tier 2: SMAART Standard | Tier 3: SMAART Complete |
| --- | --- | --- | --- |
| All 25 HI Courses | ✓ Included | ✓ Included | ✓ Included |
| AIQ Track | ✓ Included | ✓ Included | ✓ Included |
| SQ Track | Add-on (extra cost) | ✓ Included | ✓ Included |
| PIQ Track | Add-on (extra cost) | Add-on (extra cost) | ✓ Included |
| Interview Prep Mode | ✗ Not included | ✓ Included | ✓ Included |
| Monthly Fitness Checks | ✗ Not included | ✓ Included | ✓ Included |
| Dedicated Coach | ✗ Not included | ✗ Not included | ✓ Included |
| Framework Retention Tracking | ✗ Not included | ✗ Not included | ✓ Included |
| Annual Renewal Duration | 1 year | 1 year | 2 years |
| Skills Passport Mode | Foundation | Standard | Complete |
| Typical SRI Range | 500–700 | 550–800 | 600–900 |
| Best For | Budget-conscious institutions; non-placement programmes | Most institutions — the default institutional offering | Top institutions; IIMs; placement-competitive programmes |
| NAMING NOTE:  The old names (Professional, etc.) were replaced in v2.0 because 'Professional' is a legally regulated term in India (medical, legal, engineering) and in the UK (Chartered Professional status requires royal charter). The new names — Core, Standard, Complete — are legally neutral. |
| --- |
| Pathway | Who Gets This | Timeline | SJT Difficulty |
| --- | --- | --- | --- |
| STANDARD | UG students joining in Year 1, Semester 1 | 3–4 years. Full programme. All courses in order. | Track A: graduate-level SJTs |
| ACCELERATED | PG/MBA students with 12+ months work experience | 2 years, 4 semesters. Same 25 courses, compressed timeline. | Track B: professional-level SJTs (harder scenarios with team leadership, budget constraints, organisational politics) |
| FOUNDATION | PG/MBA students with <12 months work experience (fresh graduates entering MBA) | 2 years. Same content. Lighter T1–T3 SJTs; only T4 tests professional-level judgment. | Mixed: foundational early stages, professional-level at T4 |
| CATCH_UP | UG students joining in Year 2, 3, or 4 (late joiners) | Remaining semesters only. Priority Pathway algorithm determines which courses to prioritise. | Track A, but with lighter T1 baseline (14 SJTs instead of 21) |
| IMPORTANT — T1 Is ALWAYS First:  Regardless of when a student joins, T1 is always the FIRST assessment. There is no back-dated T1. A student who joins in Year 3 takes T1 in their first week, and all growth is measured from that actual baseline. This is intentional: it is fair, transparent, and avoids any inference about who the student 'would have been' had they joined earlier. |
| --- |
| Component | Formula | Weight in SRI-LC |
| --- | --- | --- |
| Streak | Daily consecutive completion days (maintains retention rhythm) | 30% of LC category |
| Challenge Rate | challenges_completed / challenges_sent × 100 (engagement metric) | 25% of LC category |
| Challenge Quality | Mean pairwise concordance score across last 90 days (actual judgment quality) | 20% of LC category |
| Active Rate | Days active / days since registration × 100 (consistency signal) | 25% of LC category |
| SMART TARGETING:  The daily selection algorithm adapts to the student's weak areas. If a student is weak in SRQ, 70% of their challenges will target SRQ; 30% will target other quotients to maintain breadth. No student sees the same challenge as another on the same day (per-student seeded selection). Pool size: 1,400 mini-SJTs (200 per quotient × 7 quotients). |
| --- |
| KEY TABLE: course_progress (per user per course):  user_id, course_code, started_at, completed_at | STEP FLAGS (all boolean): step_a_viewed, step_b_viewed, step_c_viewed, step_c_sections_expanded (JSONB), step_d_viewed, step_d_responses (JSONB), step_e_viewed, step_f_viewed, step_f_responses (JSONB), step_g_viewed, step_g_mcq_answer, step_h_viewed, step_h_response (TEXT) | ASSESSMENT: assessment_attempts, course_score (0-100), assessment_passed (bool), mcq_pct, fib_pct, sjt_score | TIME: total_time_seconds (NEVER used in scoring) |
| --- |
| Step | Code Logic |
| --- | --- |
| Generate pairs | For 4 options [A,B,C,D]: generate all 6 pairs: (A,B), (A,C), (A,D), (B,C), (B,D), (C,D) |
| Compare each pair | For each pair (X,Y): if student_ranking.indexOf(X) < student_ranking.indexOf(Y) AND expert_ranking.indexOf(X) < expert_ranking.indexOf(Y) → concordant. If reversed → discordant. |
| Compute tau_b | tau_b = (concordant - discordant) / 6 |
| Normalise | sjt_score = ((tau_b + 1) / 2) × 100 |
| Aggregate (3 SJTs) | course_sjt_score = average(sjt_score_1, sjt_score_2, sjt_score_3) |
| Final course score | course_score = (mcq_pct × 0.15) + (fib_pct × 0.10) + (sjt_score × 0.75) |
| Gate | Condition (BOTH must hold) | Unlocks |
| --- | --- | --- |
| Capacity → Capability | ALL 10 Capacity courses (S01–S10) at ≥70% PASSED. T2 stage assessment taken (even if score is low). | S11 and sequential Capability courses. AIQ Track separately unlocks after S15. |
| Capability → Leadership | ALL 9 Capability courses (S11–S19) at ≥70% PASSED. T3 taken. | S20 and Leadership courses. SQ Track separately unlocks after S21. |
| Leadership → Programme Complete | ALL 6 Leadership courses (S20–S25) at ≥70% PASSED. T4 taken. | Verified Skills Passport generated. Full SRI computed. |
| Within-semester | Course N+1 only unlocks after Course N is PASSED at ≥70% | Next course in semester sequence |
| Between-semester | Semester N+1 courses ONLY available after institution calendar says Semester N+1 has started | Prevents binge-learning without proper retention spacing |
| Concern | Build Time (content creation) | Runtime (student platform) |
| --- | --- | --- |
| Content creation | Claude generates courses, SJTs, MCQs, FIBs, capstones, micro-challenges. Critic-Claude validates each item. | NONE. Zero runtime Claude calls. All content served from static pools. |
| Item selection | N/A — pools are created | Deterministic seeded selection: hash(user_id + assessment_id + attempt_number) |
| Scoring | N/A | Pairwise concordance for SJTs, exact match for MCQs, fuzzy match (Levenshtein ≤2) for FIBs |
| Capstone scoring | N/A | Mathematical: pairwise concordance across 5 stages + revision bonus/penalty formula |
| Validity | Critic-Claude checks each item against authoring rubric before release | Item analysis runs in aggregate after deployment to flag poor-performing items for future regeneration |
| Code | Full Name | Stage Active | WEF Alignment | Courses That Build It |
| --- | --- | --- | --- | --- |
| CRQ | Cognitive Readiness | Capacity | #1 Analytical Thinking | S01, S02, S03, S04 |
| SRQ | Self-Recovery Readiness | Capacity | #2 Resilience + #8 Curiosity | S05, S06 |
| PEQ | Personal Effectiveness | Capacity | #5 Motivation & Self-Awareness | S07, S08, S09 |
| SIQ | Social Intelligence | Capability | #3 Leadership + #7 Empathy | S10, S11, S12, S13, S14, S17, S18, S19 |
| DAQ | Digital & AI Readiness | Capability | #6 Tech Literacy + AI & Big Data | S15, S16, AIQ Track |
| LQ | Innovation & Learning | Leadership | #4 Creative Thinking | S20, S25 |
| SEQ | Stewardship & Ethics | Leadership | #10 Environmental Stewardship | S21, S22, S23, S24, SQ Track |
| # | Standard | What It Means | Courses That Evidence It |
| --- | --- | --- | --- |
| 1 | UNDERSTAND | Can interpret information, read a system, translate data into insight | S04, S12, S16 |
| 2 | STRUCTURE | Can break a problem down, organise a decision, build a logical case | S01, S02, S20 |
| 3 | VERIFY | Can evaluate evidence, check quality, catch errors, identify bias | S03, S08 |
| 4 | ADAPT | Can recover from setbacks, change course, learn new tools fast | S05, S06 |
| 5 | COMMUNICATE | Can convey ideas clearly, present with confidence, serve a stakeholder | S11, S17, S18 |
| 6 | CONNECT | Can build networks, collaborate, resolve conflict, negotiate | S10, S13, S14, S19 |
| 7 | OWN | Can manage priorities, hold quality, delegate effectively, take accountability | S07, S08, S23 |
| 8 | CREATE | Can think divergently, reframe problems, innovate within constraints | S09, S25 |
| 9 | LEAD | Can reason ethically, develop others, drive change through small wins | S21, S22, S24 |
| 10 | GROW | Can learn from feedback, build growth mindset, evolve with the role | S06, PIQ Track |
| What You Are Building | What Makes It Different |
| --- | --- |
| A course delivery system for 40 courses (25 HI + 15 track) | Every course is text-based (no video hosting). 8 learning steps, all with specific completion rules. |
| A psychometric assessment engine | Primary method is Kendall's tau-b pairwise concordance on SJT ranking — NOT simple MCQ right/wrong |
| A seeded item selection system | No two students see the same questions. Seeds are hash(user_id + assessment_id + attempt_number) |
| A daily challenge engine | Mini-SJTs served daily, targeting weak quotients 70% of time, broad coverage 30% |
| An SRI aggregation engine | 5-category weighted formula (TC 30%, PC 30%, LC 20%, BR 10%, GT 10%) producing 300–900 score |
| A Skills Passport credential layer | 10 Standards with star ratings, SRI, track certifications, technical skills, QR-scannable |
| A stage gate enforcement system | Strictly sequential: no course N+1 until course N passes at 70%. No next stage until ALL prior courses pass. |
| A build-time content pipeline | Claude generates content at build time only. Runtime is 100% deterministic — no runtime AI calls. |