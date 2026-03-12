# SMAART Institute: Ultimate Registration Field Database

This document contains a 100% complete, non-abbreviated listing of every field, dropdown selection, and validation rule in the SMAART Institute registration system.

---

## Part 1: Initial Account Registration

### 1.1 Signup Foundation
*   **Full Name Field**:
    *   Type: Text Input
    *   Purpose: Captures the student's legal name for database identification and future certificate generation.
    *   Requirement: Mandatory.
*   **Email Address Field**:
    *   Type: Email Input
    *   Purpose: Primary contact for One-Time Password (OTP) delivery and system notifications.
    *   Requirement: Mandatory. Validation for standard email format (`user@domain.com`).

### 1.2 Access Verification
*   **OTP Input**:
    *   Type: 6-Digit Number Input
    *   Purpose: Verifies ownership of the email address.
    *   Technical Detail: Triggers the generation of a temporary security token.

---

## Part 2: Comprehensive Profile Documentation (12 Sections)

### Step 1: Bio-Identity Profile Photo
*   **Field Name**: Profile Photo
*   **Type**: File Upload (via SMAART FileUpload Component)
*   **Requirement**: Mandatory.
*   **Constraints**: Maximum file size 5MB. Supported formats: JPG, JPEG, PNG.

### Step 2: In-Depth Personal Details
*   **Full Name**:
    *   Type: Restricted Text (Pre-filled from Signup).
*   **Nick Name**:
    *   Type: Text Input.
    *   Validation: Mandatory.
*   **Date of Birth**:
    *   Type: Date Picker.
    *   Validation: Mandatory. Minimum age requirement: 16 years. Future dates are strictly prohibited.
*   **Gender Selection Dropdown**:
    *   Option 1: `Male`
    *   Option 2: `Female`
    *   Option 3: `Other`
*   **Current Year of Study Dropdown**:
    *   Options: `2010`, `2011`, `2012`, `2013`, `2014`, `2015`, `2016`, `2017`, `2018`, `2019`, `2020`, `2021`, `2022`, `2023`, `2024`, `2025`, `2026`, `2027`, `2028`, `2029`, `2030`, `2031`, `2032`, `2033`, `2034`, `2035`, `2036`, `2037`, `2038`, `2039`, `2040`.
*   **Expected Year of Passing Dropdown**:
    *   Options: `2010`, `2011`, `2012`, `2013`, `2014`, `2015`, `2016`, `2017`, `2018`, `2019`, `2020`, `2021`, `2022`, `2023`, `2024`, `2025`, `2026`, `2027`, `2028`, `2029`, `2030`, `2031`, `2032`, `2033`, `2034`, `2035`, `2036`, `2037`, `2038`, `2039`, `2040`.
    *   Validation: Must be greater than the Current Year of Study.
*   **Mobile Number**:
    *   Type: Number Input (10 Digits).
*   **Institution Name**:
    *   Type: Text Input (Pre-filled based on landing page selection).
*   **Chosen Career Domain (Education Level) Dropdown**:
    *   Option 1: `Information Technology & Digital Services`
    *   Option 2: `Artificial Intelligence & Data Science`
    *   Option 3: `Renewable Energy & Clean Technology`
    *   Option 4: `Healthcare & Digital Health`
    *   Option 5: `Pharmaceuticals & Biotechnology`
    *   Option 6: `Financial Technology (FinTech)`
    *   Option 7: `E-commerce & Digital Retail`
    *   Option 8: `Professional & Consulting Services`
    *   Option 9: `Manufacturing & Advanced Manufacturing`
    *   Option 10: `Logistics, Supply Chain & E-Mobility`
    *   Option 11: `Cybersecurity & Information Security`
    *   Option 12: `EdTech & Online Learning`
    *   Option 13: `Media, Gaming & Digital Content`
    *   Option 14: `AgriTech & Food Technology`
    *   Option 15: `Sustainability, ESG & Environmental Services`
    *   Option 16: `Other` (Triggers "Specify your domain" text field)
*   **Specify your domain**:
    *   Type: Text Input (Visible only if 'Other' is selected above).
*   **Department**:
    *   Type: Text Input.
    *   Example: `Computer Science Engi neering`, `Business Administration`.

### Step 3: Secondary Schooling (Grade 10)
*   **School Name**:
    *   Type: Text Input.
*   **Year of Passing Dropdown**:
    *   Options: `2010` through `2040`.
*   **Percentage / CGPA**:
    *   Type: Number Input.
    *   Validation: Must be between 0.0 and 100.0.
*   **Marksheet Upload**:
    *   Type: Digital File Upload (Required).

### Step 4: Higher Secondary Schooling (Grade 12)
*   **School/College Name**:
    *   Type: Text Input.
*   **Group / Stream Dropdown**:
    *   Option 1: `Science`
    *   Option 2: `Commerce`
    *   Option 3: `Arts`
    *   Option 4: `Others` (Triggers "Specify your group" field)
*   **Year of Passing Dropdown**:
    *   Options: `2010` through `2040`.
*   **Percentage / CGPA**:
    *   Type: Number Input.
*   **Marksheet Upload**:
    *   Type: Digital File Upload (Required).

### Step 5: Advanced Higher Education (Multi-Degree Tracking)
*   **Additional Higher Education Degree Entry (Can add multiple)**:
    *   **Qualification Level Dropdown**:
        *   Option 1: `Undergraduate Diploma (UG Diploma)`
        *   Option 2: `Postgraduate Diploma (PG Diploma)`
        *   Option 3: `Undergraduate Degree (UG)`
        *   Option 4: `Postgraduate Degree (PG)`
        *   Option 5: `MPhil (Master of Philosophy)`
        *   Option 6: `Doctoral Degree (PhD / Doctorate)`
        *   Option 7: `Post-Doctoral Level`
    *   **Academic Qualification Name (Degree)**:
        *   Type: Text Input (Example: `B.E, B.Sc, BBA, BA, BCA, B.Com`).
    *   **Specialization**:
        *   Type: Text Input (Example: `Finance`, `Cybersecurity`).
    *   **Institution Name**:
        *   Type: Text Input.
    *   **University Name**:
        *   Type: Text Input.
    *   **Year of Passing Dropdown**:
        *   Options: `2010` through `2040`.
    *   **CGPA / Percentage**:
        *   Type: Number Input.
    *   **Degree Status Dropdown**:
        *   Option 1: `pursuing`
        *   Option 2: `completed`
    *   **Certificate Upload**:
        *   Type: Digital File Upload (Required for each degree).

### Step 6: Extracurricular Activities & Accomplishments
*   **Applicability Toggle**: Options for `Applicable` or `Not Applicable`.
*   **Activity Type Dropdown**:
    *   Option 1: `Sports`
    *   Option 2: `Arts`
    *   Option 3: `Volunteering`
    *   Option 4: `Leadership roles`
    *   Option 5: `Others` (Triggers "Specify Activity Type" field)
*   **Participation Level Dropdown**:
    *   Option 1: `School`
    *   Option 2: `College`
    *   Option 3: `District`
    *   Option 4: `State`
    *   Option 5: `National`
    *   Option 6: `International`
*   **Achievements Field**:
    *   Type: Text Input (Highlight specific awards or ranks).
*   **Description Field**:
    *   Type: Textarea (Describe the role and activity in detail).

### Step 7: Professional Job Preferences
*   **Preferred Job Role / Position**:
    *   Type: Searchable Searchbox (Linked to 3000+ SMAART dataset roles).
*   **Job Type Dropdown**:
    *   Option 1: `full-time`
    *   Option 2: `part-time`
    *   Option 3: `internship-full` (Internship Full-Time)
    *   Option 4: `internship-part` (Internship Part-Time)
    *   Option 5: `freelance` (Freelance / Gig Work)
    *   Option 6: `remote` (Fully Remote / Distributed)
*   **Location Preference 1**:
    *   Type: Text Input (Mandatory).
*   **Location Preference 2**:
    *   Type: Text Input.
*   **Location Preference 3**:
    *   Type: Text Input.
*   **Willing to Relocate Dropdown**:
    *   Option 1: `yes`
    *   Option 2: `no`
*   **Expected Salary Dropdown**:
    *   Option 1: `0-3 LPA`
    *   Option 2: `3-5 LPA`
    *   Option 3: `5-8 LPA`
    *   Option 4: `8-12 LPA`
    *   Option 5: `12-18 LPA`
    *   Option 6: `18-25 LPA`
    *   Option 7: `25-35 LPA`
    *   Option 8: `35-50 LPA`
    *   Option 9: `50+ LPA`
    *   Option 10: `Negotiable`

### Step 8: Industry Sector Alignments (Max 3 Selections)
*   **Selectable Sector Buttons**:
    *   `Information Technology & Digital Services`
    *   `Artificial Intelligence & Data Science`
    *   `Renewable Energy & Clean Technology`
    *   `Healthcare & Digital Health`
    *   `Pharmaceuticals & Biotechnology`
    *   `Financial Technology (FinTech)`
    *   `E-commerce & Digital Retail`
    *   `Professional & Consulting Services`
    *   `Manufacturing & Advanced Manufacturing`
    *   `Logistics, Supply Chain & E-Mobility`
    *   `Cybersecurity & Information Security`
    *   `EdTech & Online Learning`
    *   `Media, Gaming & Digital Content`
    *   `AgriTech & Food Technology`
    *   `Sustainability, ESG & Environmental Services`
    *   `Other` (Triggers text input for custom sector)

### Step 9: Vision & Goals Tracking

#### 9.1 Professional Career Goals
*   **Short-term Goal (0-1 year)**: Textarea. Focus on immediate career starts and internships.
*   **Medium-term Goal (1-5 years)**: Textarea. Focus on progression and role-specific mastery.
*   **Long-term Goal (5+ years)**: Textarea. Focus on leadership, specialization, and industry impact.

#### 9.2 Personal Development Goals
*   **Short term (0–1 year)**: Textarea. Communication, time management, and routines.
*   **Medium term (1–5 years)**: Textarea. Decision making, stress management, and leadership presence.
*   **Long term (5+ years)**: Textarea. Emotional intelligence, resilience, and lifelong learning habits.

### Step 10: Professional Work Experience
*   **Experience Type Dropdown**:
    *   Option 1: `full-time`
    *   Option 2: `part-time`
    *   Option 3: `internship`
    *   Option 4: `freelance`
    *   Option 5: `volunteering`
*   **Organization Name**: Text Input.
*   **Designation / Role**: Text Input.
*   **Industry / Sector**: Text Input.
*   **Start Date**: Date Picker.
*   **End Date**: Date Picker (Visible if "Currently working" is unchecked).
*   **Currently Working**: Checkbox Toggle.
*   **Key Responsibilities**: Textarea (Outline primary duties).
*   **Significant Accomplishments**: Textarea (Highlight major achievements and impact).
*   **Required Documents (Checklist Selection)**:
    *   `Offer Letter`
    *   `Appointment Letter`
    *   `Appreciation Letter`
    *   `Experience Letter`
    *   *Note: Each selected checkbox triggers a required File Upload field.*

### Step 11: Real-World Projects
*   **Project Title**: Text Input.
*   **Project Developed In (Context) Dropdown**:
    *   Option 1: `Institution` (Triggers "College / University Name" field)
    *   Option 2: `Organization` (Triggers "Company / Organization Name" field)
    *   Option 3: `Others`
*   **Team Type Dropdown**:
    *   Option 1: `Individual`
    *   Option 2: `Team`
*   **Start & End Dates**: Date Pickers.
*   **Project Description**: Textarea (Focus on role and technologies used).
*   **Significant Achievements**: Textarea (Focus on performance wins and results).
*   **Professional Project Link**:
    *   Type: URL Input.
    *   Validation: Must strictly be `github.com` or `docs.google.com`.

### Step 12: External Certifications
*   **Certificate Name / Title**: Text Input.
*   **Issuing Organization**: Text Input.
*   **Year of Completion Dropdown**:
    *   Options: `2010` through `2040`.
*   **Verification Mode Dropdown**:
    *   Option 1: `url` (Link / URL) - Triggers "Verification Link" field.
    *   Option 2: `qr` (QR Code).
    *   Option 3: `none`.
*   **Certificate File Upload**: Mandatory file upload for every certificate entry.

---
*End of Documentation - SMAART Minds Comprehensive Database v2.5*
