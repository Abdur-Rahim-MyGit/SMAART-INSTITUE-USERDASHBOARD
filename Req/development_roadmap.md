# SMAART INSTITUTE - Development Roadmap & Plan

This document outlines the strategic plan and detailed task list for the SMAART Institute platform development. Based on the current state of the codebase (April 2026) and the requirements in the Master BRD and FSS, here is the path to production-readiness.

## Team Structure (4 Developers)

To maximize efficiency, the team is divided into four specialized "Squads," each owning a critical pillar of the platform.

---

### Squad 1: Core Infrastructure & Security (Gatekeepers)
**Focus:** Scalability, Multi-tenancy, and Security.

| Task ID | Component | Task Description | Priority |
| :--- | :--- | :--- | :--- |
| **SYS-01** | Architecture | **Centralize Login Architecture:** Move from `/institution/:id` logic to a centralized `/login` route that reads institutional context from session storage as per FSS STU-002. | High |
| **SYS-02** | Security | **RBAC Implementation:** Finalize Role-Based Access Control on the backend. Ensure Super Admin, College Admin, and Student roles cannot access each other's data. | High |
| **SYS-03** | Auth | **"Remember Me" Fix:** Shift "Remember Me" logic from `sessionStorage` to `localStorage` (Fixing TASK-16). | Medium |
| **SYS-04** | Performance | **Lazy Loading Optimization:** Optimize the `AnimatedRoutes.jsx` Suspense boundaries to ensure a smooth 60fps transition between pages. | Medium |

---

### Squad 2: Onboarding & Assessment Engine (DNA Builders)
**Focus:** The "Diagnosis" phase of the platform.

| Task ID | Component | Task Description | Priority |
| :--- | :--- | :--- | :--- |
| **DNA-01** | Onboarding | **Complete 12-Step Wizard:** The current `AddDetails.jsx` only has 4/12 functional steps. Implement the UI forms for Steps 2, 3, 5, 6, 7, 8, 9, 10 (Sectors, Goals, Experience, etc.). | High |
| **DNA-02** | Assessment | **T1 Baseline Engine:** Implement the 36-question stratified sampling engine. Ensure exact question distribution per quotient (CRQ, SRQ, LQ, etc.). | High |
| **DNA-03** | Security | **Anti-Cheat Logic:** Implement the proctoring requirements: Disable right-click/copy-paste, and add tab-switch monitoring (3 warnings = auto-submit). | High |
| **DNA-04** | Reports | **Result Visualization:** Create the post-assessment report page showing score bands (Advanced to Emerging) and spider charts of quotients. | Medium |

---

### Squad 3: AI Career Agent & Learning (Career Architects)
**Focus:** The "Prescription" and "Treatment" phases.

| Task ID | Component | Task Description | Priority |
| :--- | :--- | :--- | :--- |
| **AI-01** | Career Agent | **AI Career Chat:** Integrate Deepseek r1058 and NVIDIA Nemotron-3-Nano for the 24/7 intelligent career strategist. | High |
| **AI-02** | Tools | **ATS Resume Builder:** Develop the "Action + Task + Result" based resume generator. | High |
| **AI-03** | Analysis | **Skill-Gap Visualizer:** Use the Career Intelligence Engine to generate the personalized learning path based on T1 results. | Medium |
| **LMS-01** | LMS | **Video Tracking:** Implement precise watch-time tracking for course modules to gate progress (cannot skip videos). | Medium |

---

### Squad 4: Admin Dashboards & Certification (Overseers)
**Focus:** Institutional management and verifiable credentials.

| Task ID | Component | Task Description | Priority |
| :--- | :--- | :--- | :--- |
| **ADM-01** | Super Admin | **Super Admin Dashboard:** Build the global control center for college onboarding and content management. | High |
| **ADM-02** | College Admin | **College Portal:** Build the dashboard for institutional admins to manage student rosters and track engagement metrics (PLVI). | High |
| **CERT-01** | Credentials | **Certification Engine:** Implement C1, C2, C3 diploma generation with integrated QR codes for verification. | Medium |
| **SUP-01** | Support | **Escalation Workflow:** Build the ticketing and Mind Care escalation system for mentors and coaches. | Low |

---

## Technical Debt & Polish (Current Sprint)

1. **Route Alignment**: Rename `/verify-otp` to `/otp-verify` and `/add-details` to `/onboarding` to match FSS naming conventions perfectly.
2. **Component Cleanup**: Remove redundant placeholder components in `front-end/src/pages` that are no longer used.
3. **API Resilience**: Ensure all backend routes use the `apiCall` wrapper's retry logic and handle `5001` vs `5000` port discovery gracefully.

---
**Status:** Initial Plan Created | **Version:** 1.0 | **Author:** Antigravity (AI)
