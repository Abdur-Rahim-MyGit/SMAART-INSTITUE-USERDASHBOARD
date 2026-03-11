# 🎯 SMAART Career AI — System Flow & Visual Roadmap

This document provides a high-level visual and descriptive breakdown of the **SMAART Career Intelligence System**, as outlined in the `aiagent.pdf` Developer Build Guide.

---

## 1. System Flow Overview (Visual)

The diagram below illustrates the two-stage architecture: the **Build Phase** (one-time intelligence generation) and the **Runtime Phase** (cost-efficient, ultra-fast student experience).

![System Flow Diagram](file:///C:/Users/Abdur%20Rahim%20V%20A/.gemini/antigravity/brain/172238c5-dbda-468f-8e45-d0324f28c3c1/ai_agent_system_flow_diagram_1773135927312.png)

---

## 2. What the PDF Explains (Step-by-Step)

The PDF describes a system that automates career guidance for students at massive scale (50,000+ users). It is broken down into 10 key phases:

1.  **AI Data Generation:** Using Claude 3.5 Sonnet to generate high-quality data for 250 roles (skills, tools, salaries).
2.  **Verification:** A human-in-the-loop check to ensure AI didn't hallucinate tools or salaries.
3.  **Student Onboarding:** Capturing a student's Degree, Specialisation, and Interests.
4.  **Matching Engine:** A pre-built database table suggesting 3 roles (Primary, Secondary, Alternative) in <200ms.
5.  **Role Selection:** Students pick their target role.
6.  **Learning Path:** A dynamic engine calculating which skills to learn next based on a "Priority Formula".
7.  **Skill Tracking:** Recording completions via assessments or self-reports.
8.  **Role Change System:** Allowing students to switch roles instantly while archiving old progress.
9.  **Skills Passport:** An AI-generated professional summary of a student's verified capabilities.
10. **Engagement Scoring:** A metrics-based score (Green/Amber/Red) for placement officers to monitor student activity.

---

## 3. Implementation Plan

To start the project today, follow this 4-week roadmap:

### 🗓️ Week 1: Foundation & Data
- **Goal:** Get your AI data loaded and verified.
- **Action:** Set up the Claude API script and process the 250 role profiles.
- **Milestone:** Database is populated with verified roles, skills, and course mappings.

### 🗓️ Week 2: Suggestion Engine
- **Goal:** Build the onboarding and matching system.
- **Action:** Generate the matching table for all degree/specialisation combinations using AI.
- **Milestone:** Students can sign up and receive instant role recommendations.

### 🗓️ Week 3: Skill & Passport Engine
- **Goal:** Implement the learning logic and passport generation.
- **Action:** Code the Priority Sorting Formula and the Skills Passport eligibility logic.
- **Milestone:** Students can track progress and generate their verified resumes.

### 🗓️ Week 4: Scale & Pilot
- **Goal:** Performance testing and launch.
- **Action:** Sync with 2-3 pilot colleges and fix bugs based on real usage.
- **Milestone:** Full launch to all 25 colleges.

---

## 4. Key Implementation Logic (Code Snippets)

### The Priority Factor
To keep the dashboard updated, use this priority logic for the learning path:
- **High Importance:** +10 points
- **Tool Shared with Secondary Role:** +5 points
- **Prerequisite Completed:** +8 points

### The "Build-Once, Run-Many" Rule
- **Build Phase:** Spend ~$32 (₹2,670) on AI to generate 250 roles.
- **Runtime:** Costs **₹0** for role suggestions because it's a simple SQL query, not an expensive AI call.

---

> [!TIP]
> **Pro-Tip for Starting:** Begin with Section 2.4 of the build guide. Do not ask the AI for everything at once. Use the **Two-Step Prompting** method (JSON first, then Narrative) to ensure the highest quality data.

---
*Created for SMAART Institute by Antigravity AI — March 2026*
