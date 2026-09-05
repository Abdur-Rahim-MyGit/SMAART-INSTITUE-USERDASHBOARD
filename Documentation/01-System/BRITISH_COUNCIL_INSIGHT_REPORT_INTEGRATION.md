# British Council Insight Report — integration spec

_Drafted 2026-08-24 from the sample "Insight report" PDF (page 2 of 2, client name
redacted, cohort dated Nov–Dec 2024)._

This document turns that PDF into something buildable: what the report actually
contains, what SMAART has to build, what British Council has to supply, and the
three ways the data could reach us ranked by how much work it costs **them**.

---

## 1. What the report is

It is British Council's **partner analytics deliverable** — the periodic summary
they send an institution about that institution's students on a BC English
course. The sample is an Excel workbook exported to PDF: pivot tables plus five
charts, with a hand-written commentary block.

That last detail is the whole story. **This is a spreadsheet a person produces,
not an API.** Nothing in the artefact suggests a machine-readable feed exists
today. So the integration question is not "how do we call their API" — it is
"what is the cheapest way to get this data flowing, given they may have no API
at all".

### 1.1 What it reports on (sample figures)

| Block | Sample values |
|---|---|
| Onboarding | 1,501 total · 1,476 complete (98%) · 25 ongoing |
| Access suspended | 2 students |
| Engagement | 1,172 engaged · 304 not engaged. *Not engaged = has not started any online activity or attended any class* |
| Initial CEFR level | A1 38% · B1 13% · B2 19% · C1 31% |
| Live 25s attended | Histogram, 0–11 classes. **1,005 students attended zero** |
| Attendance banding | High 72% · Moderate 17% · Low 8% · Very low 3% |
| Attendance per level | Broken out for A1, A2, B1 |
| Progress on exercises | High achievers 66.19% · Moderate 23.71% · Low 3.93% · Very low 6.17% |
| Progress per level | Broken out for A1, A2, B1 |
| Average grades | 100%→665 · 90%→257 · 80%→107 · 70%→65 · 60%→16 · 50%→14 · 40%→10 · 30%→1 · 10%→1 · 0%→340 |
| Cohort dates | Start 21/11/2024 · expiries 27/12/2024, 30/12/2024, 27/08/2025 with "days left" |
| Commentary | Free text: what needs action, what is going well |

Both histograms sum to exactly 1,476 — the onboarded population — so the row
grain is confirmed as **one row per onboarded student**.

### 1.2 The banding thresholds, stated in the report

Printed in the legend, so we can reproduce them exactly rather than guess:

| Band | Threshold |
|---|---|
| 1. High | > 75% |
| 2. Moderate | 50–75% |
| 3. Low | 25–50% |
| 4. Very low | < 25% |

The same four bands are used for attendance and for exercise progress.

---

## 2. A discrepancy to resolve before building anything

**1,005 of 1,476 students — 68% — attended zero live classes.** The same page
reports "1. High attendees 72%" and comments that *"89% of the students are
booking and attending live classes actively."*

Those cannot both be true on the same denominator. The only reading that
reconciles them is that the attendance percentage is **attended ÷ booked**, and
students who booked nothing are either excluded from the denominator or land
somewhere that does not show. A student who booked one class and attended it
scores 100% and is filed as a "high attendee".

That is a defensible operational metric — it measures whether people honour
their bookings — but it is not what "89% are attending actively" says to a
college principal reading the summary.

**Do not reproduce this silently.** If SMAART rebuilds the dashboard, it should
show both denominators side by side:

- **Booking honour rate** — attended ÷ booked (BC's number, useful to a tutor)
- **Course participation** — attended ÷ classes available (the number a college
  actually wants, and the one that surfaces the 1,005)

Question 1 for British Council is therefore: *what exactly is the denominator of
the attendance percentage, and where do zero-booking students sit in it?*

---

## 3. What SMAART has to build

The platform already has the surfaces this plugs into. Nothing here is new
architecture.

| Piece | Where it goes | Notes |
|---|---|---|
| `BritishCouncilEnrolment` model | `back-end/models/` | One document per student per BC cohort — the row grain above |
| `BritishCouncilCohort` model | `back-end/models/` | Cohort, level, start date, expiry, class schedule |
| Ingestion endpoint | `back-end/routes/` | `POST /api/british-council/import` — accepts the agreed file, validates, upserts, returns a reconciliation summary |
| Identity matching | ingestion | Match BC rows to SMAART students. **This is the hard part** — see §5 |
| Metric derivation | `back-end/services/` | Bands, engagement flag, days-left, roll-ups. Derived by us, never taken on trust from the file |
| College dashboard | Admin panel, alongside `getCollegeAnalytics` | The report, live, filterable — replaces the PDF |
| Student view | `BritishCouncil.jsx` / mobile `LearningScreen` | The student's own attendance, progress and expiry. Today that page is a bare deep link |
| Scheduled refresh | `back-end/services/cronService.js` | Only for options B and C |

The entitlement plumbing already exists: `Student.plan.addons.britishCouncil`
gates the `British Council` course category (`back-end/routes/courses.js`), and
`BC01`–`BC05` are already a track in `courseProgression.js`. The reporting layer
hangs off the same flag.

---

## 4. What British Council has to give us

The field list below is reverse-engineered from the report — every column is
something the PDF demonstrably already computes, so BC holds all of it.

### 4.1 Required — one row per onboarded student

| Field | Type | Why we need it |
|---|---|---|
| `bc_learner_id` | string | Stable BC identifier. The join key we would prefer |
| `email` | string | Fallback join key to a SMAART student |
| `full_name` | string | Reconciliation and display |
| `cohort_id` | string | Groups students; drives cohort start and expiry |
| `onboarding_status` | enum | `complete` \| `ongoing` |
| `access_suspended` | boolean | Drives the suspended count |
| `initial_level` | enum | CEFR — `A1` `A2` `B1` `B2` `C1` `C2` |
| `current_level` | enum | Needed to show progression, which the sample report does **not** show |
| `live_classes_booked` | integer | Denominator for the honour rate |
| `live_classes_attended` | integer | The 0–11 histogram |
| `live_classes_available` | integer | Denominator for real participation — **the field the sample report is missing** |
| `exercises_completed` | integer | Progress numerator |
| `exercises_total` | integer | Progress denominator |
| `average_grade_pct` | number 0–100 | The grade histogram |
| `last_activity_at` | ISO 8601 date | Lets us compute engagement ourselves rather than trusting a flag |
| `access_start_date` | ISO 8601 date | Cohort start |
| `access_expiry_date` | ISO 8601 date | Drives "days left" |

### 4.2 Useful, not blocking

`class_schedule` (so we can compute availability ourselves), `tutor_name`,
`course_name`, `hours_studied`, `assessment_scores[]`, `certificate_issued`.

### 4.3 What we do NOT want them to send

Pre-computed bands, percentages and roll-ups. We derive those from the raw
counts using the published thresholds. If BC sends a band and we send a band and
they disagree, someone has to adjudicate — and the college will believe
whichever is worse. Send counts; we do the arithmetic.

### 4.4 The reconciliation rule

Every import returns, and stores, a summary: rows received, matched, unmatched,
and why. An unmatched row is never silently dropped — it lands in an exceptions
list a college admin can resolve by hand.

---

## 5. The identity problem, stated plainly

BC's system and ours have no shared key today. The current "integration" is a
hardcoded link to a British Council Azure AD B2C login
(`front-end/src/pages/BritishCouncil.jsx`) that carries **BC's own client id and
a captured single-use nonce and state** — a URL copied out of somebody's browser
mid-login. It authenticates nobody as *our* user, and it will stop working.

So matching is by email, with all the fragility that implies: a student who
registers with a college address on SMAART and a personal address on the BC
portal will not match.

Three fixes, in order of preference:

1. **BC issues us a `bc_learner_id` per student at enrolment**, and we store it
   on the SMAART student record. Clean, permanent, worth asking for.
2. **We supply the roster.** We send BC the enrolment list with our student ids;
   they echo the id back on every report row. Puts the key under our control.
3. **Email match with an exceptions queue.** Works today with no BC change, and
   is the right fallback regardless.

---

## 6. Three ways the data can reach us

Ranked by British Council engineering effort — which is the constraint that will
actually decide this.

### Option A — Manual CSV upload (build now, zero BC dependency)

A college admin uploads the file BC already emails them. We parse, match,
derive and render.

- **BC effort:** none. They send the same spreadsheet they send today.
- **Our effort:** ~1 week — model, importer, reconciliation UI, dashboard.
- **Cadence:** whenever the report arrives.
- **Why start here:** it is the only option that does not depend on a
  conversation going well. And every later option reuses the same model,
  derivation and dashboard — only the ingestion changes.

### Option B — Scheduled file drop (low BC effort)

BC pushes a CSV/JSON to an SFTP or S3 location on a schedule; a cron job picks
it up.

- **BC effort:** low — an export job and credentials, no API design.
- **Our effort:** ~2 days on top of Option A.
- **Cadence:** daily or weekly, automatic.

### Option C — API (best, highest BC effort)

We call a BC endpoint for cohort and learner progress.

- **BC effort:** high — they must design, secure and support a partner API.
- **Our effort:** ~3 days on top of Option A.
- **Cadence:** near real time.
- **Reality check:** the fact that partners receive an Excel export suggests no
  such API exists. Ask, but do not plan around it.

---

## 7. What to send British Council

> We would like to bring your Insight Report data into the SMAART Institute
> platform so our colleges see it live alongside the rest of their student
> analytics, rather than as a periodic PDF.
>
> 1. Do you offer a partner **API** for cohort and learner progress? If not, can
>    you provide the same data as a **CSV or JSON** file — either on a schedule
>    to an SFTP/S3 location we provide, or as the file we upload ourselves?
> 2. Please confirm you can include the per-student fields in the attached list.
>    Two we did not find in the sample report and specifically need:
>    **`live_classes_available`** and **`current_level`**.
> 3. Can you include a stable **learner identifier** on every row, and accept an
>    enrolment roster from us so that identifier can be mapped to our student
>    records?
> 4. **How is the attendance percentage calculated** — specifically, what is the
>    denominator, and where do students who booked no classes sit? In the sample
>    report 1,005 of 1,476 students attended zero live classes, while the summary
>    reports 72% high attendance.
> 5. What is the **reporting cadence**, and is the data as of a date we can read
>    from the file?
> 6. Is there a **deep link or LTI** launch so a student can go from SMAART
>    straight into their BC course without a second login?

Question 4 is the one to get in writing.

---

## 8. Suggested build order

1. **Fix the broken portal link first** (one hour). The current URL carries
   expired session parameters and will fail. Replace with the clean portal entry
   point. This is independent of everything above.
2. **Build Option A**, against the sample file, with the identity exceptions
   queue. Ships value with no BC dependency.
3. **Send the letter in §7.** Whatever comes back, the model and dashboard
   already exist.
4. **Add Option B or C** when BC agrees to one — a new ingestion path into the
   same pipeline.
5. **Feed the data outward**: BC attendance and grades into the student's skills
   passport and the college's readiness view, which is the point of having it
   inside SMAART rather than in an inbox.

---

## 9. Note on the sample

The PDF is page 2 of 2, headed `CLIENT: CLIENT NAME` with an empty report date,
and its dates are November–December 2024. It is a template or a redacted sample,
not a live client report. **Page 1 was not supplied** — it may carry the client
identifiers, the reporting period and the data dictionary. Worth obtaining before
finalising the field list.
