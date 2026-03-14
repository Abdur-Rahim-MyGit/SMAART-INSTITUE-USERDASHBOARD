# 🤖 Career Intelligence Agent — Technical Documentation

> **Module:** SMAART Toolkit → Career Intelligence Agent (formerly "Career Data Fetcher")
> **Version:** 2.0
> **Last Updated:** March 2026

---

## 📌 Overview

The **Career Intelligence Agent** is a multi-step AI-powered pipeline that combines SMAART's verified **Excel career databases** with the **OpenRouter AI engine** to generate a fully personalized Career Intelligence Report for each student.

It collects the student's career goals, education, interests, and job preferences — then runs them through a 4-stage backend pipeline to produce a structured 10-section career report, saved in MongoDB and downloadable as a PDF.

---

## 🗂️ File Structure

| File | Location | Role |
|------|----------|------|
| `CareerDataFetcher.jsx` | `front-end/src/pages/` | Main UI component (form + report display) |
| `careerIntelligenceApi.js` | `front-end/src/services/` | Frontend API service |
| `careerIntelligenceController.js` | `back-end/controllers/` | Backend pipeline controller |
| `careerIntelligence.js` (routes) | `back-end/routes/` | Express route definitions |
| `CareerIntelligence.js` (model) | `back-end/models/` | MongoDB schema |
| `excelDataLoader.js` | `back-end/services/` | SMAART Excel database reader |
| `openRouterService.js` | `back-end/services/` | OpenRouter AI API wrapper |

---

## 🏗️ Architecture Flow

```
User fills 4-step form (Frontend)
          ↓
careerIntelligenceApi.generateReport()
          ↓
POST /api/career-intelligence/generate
          ↓
careerIntelligenceController.js — 4-Stage Pipeline
    Stage 1 → Load REAL Excel Data (excelDataLoader)
    Stage 2 → Build Excel-Only Report (guaranteed fallback)
    Stage 3 → Try AI Enhancement via OpenRouter (optional)
    Stage 4 → Merge Excel + AI → Save to MongoDB
          ↓
Response → Frontend renders 10-section report
          ↓
User can download PDF (html2canvas + jsPDF)
```

---

## 📋 Stage 1 — The 4-Step Form (Frontend)

The user fills out a multi-step form in `CareerDataFetcher.jsx`:

| Step | Title | Fields Collected |
|------|-------|-----------------|
| **Step 1** | Career Goals | Short-Term Goal (1-2 yrs), Long-Term Goal (5+ yrs) |
| **Step 2** | Education | Degree, Specialization, College Type, Year of Graduation, CGPA |
| **Step 3** | Interest Area | Clickable tiles: Technology, Business, Healthcare, Finance, Creative, Core Engineering, Education, Government, Others |
| **Step 4** | Job Preference | Interested Job Role (with live autocomplete), Job Sector, Preferred Location, Expected Salary Range |

### Interest Area Options
```
Technology | Business | Healthcare | Finance
Creative   | Core Engineering | Education | Government | Others
```

### Job Sector Options
```
IT | Core Engineering | Startup | MNC | Government | Freelance | Research | Others
```

### Salary Range Options
```
0-3 LPA | 3-6 LPA | 6-10 LPA | 10-15 LPA | 15-25 LPA | 25+ LPA
```

> **💡 Live Autocomplete:** The Job Role input field fetches suggestions in real-time from the SMAART Excel database as the user types (minimum 2 characters).

---

## ⚙️ Stage 2 — Backend Pipeline (4 Stages)

### 🔵 Stage 1 — Load Excel Data

`buildExcelContext(input)` is called, which queries **4 SMAART Excel databases (3000+ data points)**:

| Data Fetched | Excel Source | Purpose |
|-------------|-------------|---------|
| Core Technical Skills | Role table | Skills required for the job role |
| AI Tools | Role table | AI tools specific to the role (with FREE/PAID info) |
| AI Skills | Role table | AI competencies needed |
| Certifications | Role + Cert table | Recommended certifications with provider & cost |
| Human Intelligence Skills | HI Quotient table | Soft skill quotients with task applications |
| Existing Career Levels | Sector table | Entry / Mid / Senior / Leadership roles |
| Emerging Roles | Sector table | Future job titles in this sector |
| Automated Tasks | Job Family table | Tasks being replaced by AI |
| Human Tasks That Remain | Job Family table | Tasks AI cannot replace |
| Job Changes in AI Era | Job Family table | How the role is transforming |
| Qualifications | Job Family table | Degrees and credentials required |
| Salary & Demand | Role metadata | Market demand level and salary range |
| Free Certifications | Cert directory | Free online certifications with access URLs |

**Console logs during generation:**
```
📊 Excel Match: Role="Full Stack Developer" (exact: true)
📊 Sector Match: "Technology"
📊 Job Family: "Software Engineering"
📊 AI Tools Found: 12
📊 HI Skills Found: 25
📊 Certifications Found: 18
```

---

### 🟡 Stage 2 — Build Excel-Only Report

`buildExcelOnlyReport(input, excelContext)` constructs a **complete report using only Excel data** — this is the guaranteed fallback that always works even when AI is unavailable.

It generates all 10 report sections from the Excel data directly.

---

### 🟠 Stage 3 — AI Enhancement (Optional)

The backend tries **5 free AI models via OpenRouter** in priority order:

| Priority | Model |
|----------|-------|
| 1st | `meta-llama/llama-3.2-3b-instruct:free` |
| 2nd | `nousresearch/hermes-3-llama-3.1-405b:free` |
| 3rd | `meta-llama/llama-3.1-8b-instruct:free` |
| 4th | `google/gemma-2-9b-it:free` |
| 5th | `qwen/qwen-2.5-7b-instruct:free` |

The AI receives a **massive structured prompt** containing:
- Student's career profile (goals, education, interests, job preference)
- All matched Excel data (tech skills, AI tools, certifications, HI quotients, emerging roles, automated tasks, job changes)
- Strict JSON output format with CRITICAL RULES

**Prompt system instruction:**
```
"You are the SMAART Career Intelligence Engine.
Respond with ONLY valid JSON — no markdown, no code blocks, no extra text."
```

**AI call settings:**
- `temperature: 0.6` (balanced creativity)
- `max_tokens: 8000` (large structured response)
- `timeout: 120000ms` (2 minutes per model)
- `timeout: 150000ms` (frontend waits up to 2.5 minutes)

> ✅ **AI succeeds** → Enhances Excel report with intelligent, personalized insights
> ⚠️ **AI fails** → Excel-only report is used silently — no error shown to the user

---

### 🟢 Stage 4 — Merge & Save

`mergeExcelWithAI(excelReport, aiOutput, excelContext, careerInput)` intelligently merges both sources:

| Field | Priority |
|-------|----------|
| Technical Skills | AI output (if available) |
| AI Skills | AI output (if available) |
| **Human Intelligence Skills** | **Excel DB preferred** (has 15+ verified entries) |
| Suggested Jobs | AI output (if available) |
| Emerging Jobs | AI output if non-empty, else Excel |
| Career Path Roadmap | AI output if non-empty, else Excel |
| Future Scope | Merged — Excel for automated/human tasks, AI for narrative |
| Market Demand | AI output (if available) |
| Resource Map | AI where available, Excel as fallback per field |
| Qualifications | AI output (if available) |

The merged report is saved to MongoDB with `status: "completed"`.

---

## 📊 The Report — 10 Sections

| # | Section | What It Contains |
|---|---------|-----------------|
| 1 | **Technical Skills Required** | Core skills, tools & technologies, certifications with provider & cost |
| 2 | **AI Skills To Learn** | AI skills list, AI tools (with FREE/PAID badge), description paragraph |
| 3 | **Human Intelligence Skills (15+)** | HI Quotients with code, task application, priority (Critical/High/Medium) |
| 4 | **Jobs You Can Apply For** | Entry Level / Mid Level / Senior Level / Lateral opportunities with salary |
| 5 | **Emerging Future Jobs** | Future titles with growth potential & AI integration description |
| 6 | **Career Path Roadmap** | Timeline (Now → 0-2 yrs → 3-5 yrs → 6-10 yrs → 10+ yrs) with animated line |
| 7 | **Future Scope With AI** | AI Impact, AI Enhancement, Automation Risk, Stay Relevant Tips, Automated Tasks list, Human Tasks That Remain list, Job Change Summary |
| 8 | **Job Market Demand** | Demand level, salary range, growth prediction, geographic demand, industry trends |
| 9 | **Resource Map** | Free courses (with URLs), paid courses, tools list, learning roadmap, SMAART modules |
| 10 | **Qualifications Needed** | Required qualifications with relevance explanations |

### Score Metrics (displayed as Circular Progress indicators)

| Metric | What it means | Score Logic |
|--------|--------------|-------------|
| **Skill Gap %** | How much the user needs to grow | Fixed at 45% (from Excel) |
| **Career Match %** | Profile match to the role | 82% if exact Excel match, 65% if fuzzy |
| **AI Confidence Score** | System confidence in the report | 90% if exact match, 75% if approximate |

---

## 💾 MongoDB Schema — `CareerIntelligence`

```
CareerIntelligence {
  userId          → ref: User (required, indexed)
  studentId       → ref: Student (optional)
  careerInput     → { shortTermGoal, longTermGoal, degree, specialization,
                      collegeType, yearOfGraduation, academicPerformance,
                      areaOfInterest, areaOfInterestOther, interestedJobRole,
                      jobSector, preferredLocation, expectedSalaryRange }
  careerOutput    → { technicalSkills, aiSkills, humanIntelligenceSkills,
                      suggestedJobs, emergingJobs, careerPathRoadmap,
                      futureScope, marketDemand, resourceMap,
                      qualificationsNeeded, skillGapPercentage,
                      careerMatchPercentage, aiConfidenceScore, dataSource }
  status          → "pending" | "processing" | "completed" | "failed"
  errorMessage    → String (if failed)
  version         → Number (increments per new report per user)
  generatedDate   → Date
  createdAt/updatedAt → timestamps
}
```

---

## 🌐 API Endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `POST` | `/api/career-intelligence/generate` | Generate a new report (main flow) |
| `GET` | `/api/career-intelligence/reports` | Get all reports for logged-in user |
| `GET` | `/api/career-intelligence/latest` | Get the latest completed report |
| `GET` | `/api/career-intelligence/reports/:id` | Get one specific report |
| `DELETE` | `/api/career-intelligence/reports/:id` | Delete a report |
| `GET` | `/api/career-intelligence/excel-data` | Get all sectors & roles from Excel DB |
| `POST` | `/api/career-intelligence/refresh-cache` | Admin: Force reload Excel cache |

> **Auth:** All routes require `authMiddleware` (JWT token in session)

---

## 🔄 Frontend State Flow

```
User loads page
    ↓
loadReports() → fetches all previous reports
    ↓
If reports exist → shows latest completed report (report view)
If no reports   → shows the 4-step form
    ↓
User submits form → handleSubmit()
    ↓
setIsGenerating(true) → shows loading spinner
    ↓
careerIntelligenceApi.generateReport(formData)
    ↓
On success → setReport(data.report) → setShowForm(false) → scroll to top
On error   → setError(message) → user can retry
    ↓
Report rendered → user can Download PDF / Generate New / View Form
```

### Session Storage Tracking
- `generating_report_id` — tracks an in-progress report ID across page refreshes
- If the user refreshes mid-generation → the app checks this ID on reload and resumes polling/displaying

---

## 📄 PDF Download

Uses `html2canvas` + `jsPDF`:
- Captures the full report div at **scale: 2** (high resolution)
- Saves as: `SMAART-Career-Report-{interestedJobRole}.pdf`
- Background forced to white (`#ffffff`) for clean output

---

## ⚠️ Two Separate AI Systems — Do NOT Confuse

| System | Controller | Purpose |
|--------|-----------|---------|
| **Career Intelligence Agent** ← (this doc) | `careerIntelligenceController.js` | Generates structured 10-section career report from Excel + AI |
| **AI Career Coach** | `aiCareerCoachController.js` | Profile analysis, skill gap, learning plan, resume generation, live AI chat |

Both are separate features with separate routes, models, and API services.

---

## 🐛 Known Bug

In `CareerDataFetcher.jsx` at **line 298**, the function `fetchExcelData()` calls `apiCall('/career-intelligence/excel-data')` directly — but `apiCall` is **not imported** in that file. Only `careerIntelligenceApi` is imported.

**Impact:** The Job Role autocomplete suggestions dropdown may be **empty** because `excelData.roles` never gets populated.

**Fix:**
```js
// WRONG (line 298 currently)
const data = await apiCall('/career-intelligence/excel-data');

// CORRECT — replace with:
const data = await careerIntelligenceApi.getExcelData();
```

---

## ✅ Summary

The Career Intelligence Agent is a **robust, fault-tolerant** system. Even if all 5 AI models are unavailable, students still get a complete, data-rich career report from the SMAART Excel database. When AI works, it adds a layer of personalized, narrative-style intelligence on top of the verified database — making the report both accurate and insightful.
