# SMAARTHire Implementation Plan

Based on the **SMAART HIRE** planning document, here is the technical roadmap and implementation plan to build out **Year 1** of the SMAARTHire platform.

## Proposed Architecture (Modular Monolith)
As outlined in the document, we will build SMAARTHire as a **Modular Monolith** using the existing SMAART tech stack. This allows us to move fast in Year 1 while keeping clear boundaries for future extraction into microservices.

### Tech Stack Alignment
* **Frontend:** Next.js + React + TypeScript (Styling: Tailwind CSS + shadcn/ui)
* **Backend:** Python + FastAPI
* **Database:** PostgreSQL (with Redis for caching & queues)
* **Background Jobs:** Celery (Emails, bulk offer generation, reporting)
* **Storage & Hosting:** AWS S3 (CVs, photos, offers) & AWS Mumbai (Data residency)

## Module Breakdown & Implementation Phases

We will structure the initial implementation into **4 distinct portals** and their supporting backend modules:

### 1. Student Portal & Skills Integration
* **Skills Passport Sync:** Integrate via SSO with the existing SMAART ecosystem to import the student's verified Skills Passport and SRI score.
* **Candidate Discovery:** Job matching dashboard based on SRI and verified skills.
* **One-Click Apply:** Seamless application process using the student's verified profile as their resume.

### 2. Recruiter / Employer Portal
* **Job Posting Engine:** Allow companies to create Tier 1 (All SMAART students) and Tier 2 (Institution-specific) job postings.
* **Candidate Search & Filters:** Search tools for recruiters utilizing SRI scores and specific skills.
* **Hiring Workflow Tracking:** A Kanban-style pipeline (Shortlist → Interview → Offer → Accept/Decline).
* **Offer Generation:** Digital offer letter creation and tracking.

### 3. Placement Officer (PO) Portal
* **Campus Drives & Job Fairs:** The 8-phase lifecycle engine (Planning → Employer Onboarding → Student Announcement → Registration → Preparation → Event Live → Wrap-Up → Outcomes).
* **Reporting:** Accreditation-ready analytics and placement data tracking.

### 4. Admin Portal
* **Platform Management:** Employer approvals, dispute handling, and system-wide monitoring.

## User Review Required

> [!IMPORTANT]  
> **Tech Stack Clarification:** The planning document specifies **Next.js** for the frontend, but the current `SMAART-INSTITUE-USERDASHBOARD` repository is built using **Vite + React**. 
> 
> * Do you want to build SMAARTHire as a completely separate **Next.js** repository?
> * Or do you want to integrate the SMAARTHire features directly into the existing **Vite + React** dashboard?

## Next Steps to Start Coding

Once you approve the stack approach (Vite vs. Next.js), we can begin Phase 1:
1. **Set up the Database Schema** for Employers, Jobs, and Job Applications in the FastAPI backend.
2. **Build the SSO/Auth bridge** to import Skills Passports from the core SMAART platform.
3. **Develop the UI Components** using `shadcn/ui` for the Job Board and Recruiter Dashboard.

Let me know how you'd like to proceed!
