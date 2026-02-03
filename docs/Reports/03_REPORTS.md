# SMAART Minds - Reports Documentation

**Version:** 1.0  
**Date:** January 2026  
**Platform:** SMAART Minds - Student Dashboard & Learning Management System

---

## 1. Overview

This document describes the reporting capabilities within the SMAART Minds platform, including available reports, data sources, and report generation procedures.

---

## 2. Assessment Reports

### 2.1 Base Line Test Report (ASM00001)

**Purpose:** Initial assessment to establish student baseline capabilities.

#### Report Components

| Component | Description | Data Source |
|-----------|-------------|-------------|
| Total Score | Points achieved out of 300 | `baselineresults.score` |
| Percentage | Overall accuracy percentage | `baselineresults.percentage` |
| Completion Date | When test was completed | `baselineresults.completedAt` |
| Question Analysis | Per-question response details | `results.responses` |

#### Sample Report Data Structure
```json
{
  "userId": "ObjectId",
  "assessmentCode": "ASM00001",
  "score": 235,
  "totalScore": 300,
  "percentage": 78.33,
  "completedAt": "2026-01-10T15:30:00Z",
  "responses": [
    {
      "questionId": "ObjectId",
      "selectedValue": "A",
      "isCorrect": true,
      "score": 1
    }
  ]
}
```

### 2.2 Emotional Quotient (EQ) Report

**Purpose:** Measure emotional intelligence levels.

#### Report Components

| Component | Description |
|-----------|-------------|
| Overall EQ Score | Composite emotional intelligence score |
| Self-Awareness | Recognition of own emotions |
| Self-Regulation | Managing emotional responses |
| Motivation | Internal drive and goal orientation |
| Empathy | Understanding others' emotions |
| Social Skills | Relationship management capabilities |

### 2.3 AI Quotient (AIQ) Report

**Purpose:** Assess aptitude for artificial intelligence concepts.

#### Report Components

| Component | Description |
|-----------|-------------|
| AIQ Score | Overall AI aptitude |
| Logical Reasoning | Problem-solving capabilities |
| Pattern Recognition | Identifying data patterns |
| Computational Thinking | Algorithm understanding |

### 2.4 Social Quotient (SQ) Report

**Purpose:** Evaluate social interaction skills.

#### Report Components

| Component | Description |
|-----------|-------------|
| SQ Score | Overall social aptitude |
| Communication | Verbal/non-verbal skills |
| Collaboration | Team working ability |
| Networking | Relationship building |

### 2.5 Creativity Quotient (CQ) Report

**Purpose:** Measure creative thinking abilities.

#### Report Components

| Component | Description |
|-----------|-------------|
| CQ Score | Overall creativity measure |
| Fluency | Idea generation volume |
| Flexibility | Diverse thinking patterns |
| Originality | Novel approach frequency |
| Elaboration | Idea development depth |

### 2.6 Adversity Response Quotient (ARQ) Report

**Purpose:** Assess resilience and stress management.

#### Report Components

| Component | Description |
|-----------|-------------|
| ARQ Score | Overall resilience measure |
| Control | Perceived influence over events |
| Ownership | Responsibility acceptance |
| Reach | Impact limitation ability |
| Endurance | Persistence duration |

### 2.7 VAK Learning Style Report

**Purpose:** Identify preferred learning modality.

#### Report Components

| Component | Percentage | Description |
|-----------|------------|-------------|
| Visual | X% | Learning through seeing |
| Auditory | Y% | Learning through hearing |
| Kinesthetic | Z% | Learning through doing |

### 2.8 Big Five Personality Report

**Purpose:** Comprehensive personality assessment based on OCEAN model.

#### Report Components

| Trait | Score Range | Description |
|-------|-------------|-------------|
| Openness | 1-100 | Creativity and curiosity |
| Conscientiousness | 1-100 | Organization and dependability |
| Extraversion | 1-100 | Social energy and assertiveness |
| Agreeableness | 1-100 | Cooperation and trust |
| Neuroticism | 1-100 | Emotional stability |

---

## 3. Course Progress Reports

### 3.1 Individual Course Report

#### Report Components

| Field | Description | Data Source |
|-------|-------------|-------------|
| Course Name | Title of enrolled course | `courses.title` |
| Enrollment Date | When student enrolled | `courseenrollments.enrolledAt` |
| Progress | Completion percentage | `courseenrollments.progress` |
| Modules Completed | List of finished modules | `courseenrollments.modulesCompleted` |
| Current Module | Active learning module | Calculated |
| Time Spent | Total learning time | Activity logs |
| Tasks Completed | Quiz/assignment status | `courseenrollments.tasksStatus` |

#### Sample Report Data
```json
{
  "userId": "ObjectId",
  "courseId": "ObjectId",
  "courseName": "Machine Learning Fundamentals",
  "enrolledAt": "2025-12-01T10:00:00Z",
  "progress": 65,
  "modulesCompleted": ["module1", "module2"],
  "currentModule": "module3",
  "tasksStatus": {
    "module1": { "completed": true, "score": 85 },
    "module2": { "completed": true, "score": 92 },
    "module3": { "completed": false }
  }
}
```

### 3.2 Overall Learning Progress Report

**Purpose:** Aggregate view of all course enrollments.

#### Report Components

| Field | Description |
|-------|-------------|
| Total Courses Enrolled | Count of all enrollments |
| Courses Completed | Finished courses count |
| Courses In Progress | Active course count |
| Average Progress | Mean completion rate |
| Certificates Earned | Total certificates awarded |

---

## 4. User Activity Reports

### 4.1 Activity Log Report

**Purpose:** Track user engagement and platform usage.

#### Tracked Activities

| Activity Type | Description | Logged Data |
|---------------|-------------|-------------|
| LOGIN | User login events | timestamp, device, IP |
| LOGOUT | User logout events | timestamp, session duration |
| PAGE_VIEW | Page navigation | page path, duration |
| ASSESSMENT_START | Test initiation | assessment ID, timestamp |
| ASSESSMENT_COMPLETE | Test submission | score, time taken |
| COURSE_ACCESS | Course viewing | course ID, module |
| VIDEO_WATCH | Video playback | video ID, watch time |
| POST_CREATE | Community posting | post ID, content type |

#### Sample Activity Log
```json
{
  "userId": "ObjectId",
  "sessionId": "uuid",
  "activities": [
    {
      "type": "LOGIN",
      "timestamp": "2026-01-10T09:00:00Z",
      "details": {
        "device": "Desktop Chrome",
        "ip": "192.168.1.1"
      }
    },
    {
      "type": "ASSESSMENT_START",
      "timestamp": "2026-01-10T09:05:00Z",
      "details": {
        "assessmentId": "ASM00001"
      }
    }
  ]
}
```

### 4.2 Engagement Metrics Report

| Metric | Calculation | Purpose |
|--------|-------------|---------|
| Daily Active Users | Unique logins/day | Usage tracking |
| Session Duration | Avg time per visit | Engagement depth |
| Assessment Completion Rate | Completed/Started | Content effectiveness |
| Course Completion Rate | Finished/Enrolled | Learning success |
| Community Engagement | Posts + Comments + Likes | Social activity |

---

## 5. Support Ticket Reports

### 5.1 Ticket Statistics Report

**Purpose:** Overview of support ticket system performance.

#### Report Components

| Metric | Description | Query |
|--------|-------------|-------|
| Total Tickets | All tickets created | `support.count()` |
| Open Tickets | Pending resolution | `status: 'open'` |
| In Progress | Being handled | `status: 'in-progress'` |
| Resolved | Successfully closed | `status: 'resolved'` |
| Closed | Verified complete | `status: 'closed'` |

#### By Category Breakdown
```json
{
  "technical": 45,
  "account": 23,
  "content": 18,
  "billing": 12,
  "feedback": 8,
  "other": 5
}
```

#### By Priority Breakdown
```json
{
  "high": 15,
  "medium": 65,
  "low": 31
}
```

### 5.2 Resolution Time Report

| Metric | Description |
|--------|-------------|
| Average Resolution Time | Time from creation to resolved |
| Fastest Resolution | Minimum resolution time |
| Slowest Resolution | Maximum resolution time |
| Response Time | Time to first admin response |

---

## 6. Administrative Reports

### 6.1 User Registration Report

**Purpose:** Track new user registrations.

#### Report Components

| Field | Description |
|-------|-------------|
| Total Registrations | All registered users |
| Pending Approvals | Status: pending |
| Approved Users | Status: approved |
| Rejected Users | Status: rejected |
| Registrations by Date | Daily/weekly/monthly counts |
| Registrations by Institution | By college/organization |

### 6.2 Institution Report

**Purpose:** Multi-tenant institution statistics.

#### Report Components

| Field | Description |
|-------|-------------|
| Institution Name | College/organization name |
| Total Students | Registered students count |
| Active Users | Users with recent activity |
| Course Enrollments | Total course enrollments |
| Assessment Completions | Tests completed |

---

## 7. Skills Passport Report

### 7.1 Individual Skills Report

**Purpose:** Comprehensive skill assessment overview.

#### Report Components

| Section | Data Included |
|---------|---------------|
| Assessment Scores | All quotient test results |
| Learning Style | VAK preferences |
| Personality Profile | Big Five traits |
| Course Skills | Acquired competencies |
| Certificates | Earned certifications |
| Activity Summary | Engagement metrics |

#### Visual Representation
- Radar chart for quotient scores
- Progress bars for course completion
- Timeline for achievements
- Badge display for certificates

---

## 8. Report Generation

### 8.1 API Endpoints for Reports

| Endpoint | Report Type | Access Level |
|----------|-------------|--------------|
| `GET /api/results/user/:id` | Assessment results | User/Admin |
| `GET /api/courseenrollments/user/:id` | Course progress | User/Admin |
| `GET /api/tickets/stats/summary` | Ticket statistics | Admin |
| `GET /api/activitylogs/user/:id` | Activity logs | Admin |
| `GET /api/students/stats` | Student statistics | Admin |

### 8.2 Export Formats

| Format | Use Case | Implementation |
|--------|----------|----------------|
| JSON | API response | Native |
| PDF | Printable reports | Future enhancement |
| CSV | Data analysis | Future enhancement |
| Excel | Spreadsheet analysis | Future enhancement |

---

## 9. Data Visualization

### 9.1 Available Charts

| Chart Type | Use Case | Component |
|------------|----------|-----------|
| Radar Chart | Big Five personality | `Big5RadarChart.jsx` |
| Progress Bar | Course completion | Built-in |
| Pie Chart | Category distribution | Various |
| Line Chart | Trend analysis | Future |
| Bar Chart | Comparison | Future |

### 9.2 Dashboard Widgets

| Widget | Data Displayed |
|--------|----------------|
| Assessment Status | Completed/Pending tests |
| Course Progress | Enrolled courses status |
| Vision Board | Personal goals display |
| Activity Feed | Recent activities |

---

## 10. Report Access Control

### 10.1 Permission Matrix

| Report Type | Student | Teacher | Admin |
|-------------|---------|---------|-------|
| Own Assessment Results | ✓ | - | ✓ |
| Own Course Progress | ✓ | - | ✓ |
| Own Activity Log | ✓ | - | ✓ |
| Class Reports | - | ✓ | ✓ |
| All User Reports | - | - | ✓ |
| Ticket Statistics | - | - | ✓ |
| System Analytics | - | - | ✓ |

### 10.2 Data Privacy

- Users can only view their own data
- Teachers can view assigned class data
- Admins have full access with audit logging
- All report access is logged

---

## 11. Future Enhancements

### 11.1 Planned Reports

| Report | Description | Priority |
|--------|-------------|----------|
| Comparative Analysis | User vs. cohort comparison | High |
| Trend Analysis | Progress over time | High |
| Predictive Analytics | Success prediction | Medium |
| Export to PDF | Downloadable reports | High |
| Scheduled Reports | Automatic generation | Medium |
| Custom Reports | User-defined parameters | Low |

### 11.2 Analytics Dashboard

- Real-time user activity monitoring
- Automated anomaly detection
- Performance benchmarking
- Cohort analysis

---

**Document End**

*This document outlines all reporting capabilities within the SMAART Minds platform. For technical implementation details, refer to the Technical Functionalities Document.*
