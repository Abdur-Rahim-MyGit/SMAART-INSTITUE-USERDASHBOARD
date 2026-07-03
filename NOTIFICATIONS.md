# SMAART Institute — Notification System Documentation

This document catalogs **every notification** in the project, split into the two
delivery channels requested:

1. **Email notifications** — sent to the user's inbox via SMTP.
2. **In-dashboard notifications** — shown inside the app (bell dropdown, toast,
   notifications page) and delivered in real time over WebSocket.

Many events fire on **both** channels at once.

---

## 1. Architecture Overview

### Email
| File | Purpose |
|---|---|
| `back-end/utils/emailService.js` | Basic SMTP transporter; login OTP + generic `sendEmail()`. |
| `back-end/services/emailService.js` | Rich, branded HTML email templates (welcome, badge, ticket, etc.). |

- **Transport:** Nodemailer SMTP. Host/port/user/pass from env (`SMTP_HOST`,
  `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`; defaults to `smtp.gmail.com:587`).
- **From:** `SMAART Institute <{SMTP_USER}>`
- **Delivery:** Pooled (max 5 connections), rate-limited to 1 email/sec (Gmail-safe).
- **Pattern:** Fire-and-forget — email failures do not block the request.
- **Disabled** when `NODE_ENV === 'test'`.

### In-Dashboard
| File | Purpose |
|---|---|
| `back-end/models/Notification.js` | Mongoose schema; `createNotification()` also emits the WebSocket event. Auto-deletes after 30 days (TTL). |
| `back-end/services/notificationService.js` | All `notify*()` functions — the single source that creates dashboard notifications (and triggers matching emails). |
| `back-end/routes/notifications.js` | REST API: list, unread-count, mark-read, delete, broadcast, push-subscribe. |
| `front-end/src/contexts/NotificationContext.jsx` | Socket.io client, global state, fetch/mark/delete methods. |
| `front-end/src/components/NotificationBell.jsx` | Header bell icon + unread badge + dropdown. |
| `front-end/src/components/NotificationToast.jsx` | Top-right auto-dismissing toast (5s) for new notifications. |
| `front-end/src/pages/Notifications.jsx` | Full notifications page with filters and pagination. |

- **Real-time:** Socket.io. Events: `notification`, `unread_count`,
  `notification_state`, `notifications_cleared`, `pong`.
- **Notification types (enum):** `badge`, `assessment`, `course`, `achievement`,
  `community`, `coaching`, `support`, `task`, `certificate`, `warning`,
  `suspension`, `system`.

---

## 2. Master Matrix — What fires where

| # | Notification | Trigger event | 📧 Email | 🔔 Dashboard | Recipient |
|---|---|---|:--:|:--:|---|
| 1 | Welcome | Account created | ✓ | ✓ | New user |
| 2 | Badge Earned | Badge awarded | ✓ | ✓ | User |
| 3 | Assessment Complete | Results ready | ✓ | ✓ | Student |
| 5 | Course Completed | 100% progress | ✓ | ✓ | Student |
| 8 | Level Up | Level threshold reached | ✗ | ✓ | User |
| 9 | Streak Milestone | 7/14/30/60/90/100/365 days | ✗ | ✓ | User |
| 13 | Ticket Response | Support replies | ✓ | ✓ | Ticket creator |
| 14 | Certificate Issued | Certificate generated | ✓ | ✓ | Student |
| 15 | Task Due Soon | Reminder | ✗ | ✓ | User |
| 16 | System Announcement | Admin broadcast | ✓ | ✓ | All / selected |
| 17 | New Course | Course published | ✗ | ✓ | All users |
| 20 | Career Path Lock Warning | 14-day lock deadline | ✗ | ✓ | User (injected) |
| 21 | Password Changed | Password change (security) | ✓ | ✗ | User |
| 22 | Login OTP | Login attempt | ✓ | ✗ | User |

---

## 3. Email Notifications (detail)

Templates live in `back-end/services/emailService.js` unless noted otherwise.

### 3.1 Login OTP — `sendOTPEmail()`
`back-end/utils/emailService.js`
- **Trigger:** Login OTP verification flow.
- **Subject:** `Your Login Verification Code - SMAART Minds`
- **Body:** 6-digit OTP, expires in 5 minutes.

### 3.2 Welcome — `sendWelcomeEmail()`
- **Trigger:** New student account created (`auth.js`).
- **Subject:** `Welcome to SMAART Institute, {FirstName}! 🎉`
- **Body:** Links to Baseline Assessment, Course Library, Badges, Community. CTA: *Go to My Dashboard →*

### 3.3 Badge Earned — `sendBadgeEarnedEmail()`
- **Trigger:** Badge awarded (`notifyBadgeEarned`).
- **Subject:** `🏆 Badge Earned: "{BadgeTitle}" – SMAART Institute`
- **Body:** Tier color (gold/silver/bronze), XP earned. CTA: *View My Badges →*

### 3.5 Course Completed — `sendCourseCompletedEmail()`
- **Trigger:** Course reaches 100% (`notifyCourseCompleted`).
- **Subject:** `🎓 Course Completed: "{CourseTitle}" – SMAART Institute`
- **Body:** Completion date + certificate-ready note. CTA: *Download My Certificate →*

### 3.6 Certificate Ready — `sendCertificateEmail()`
- **Trigger:** Certificate issued (`notifyCertificateIssued`).
- **Subject:** `📜 Certificate Ready: "{CourseName}" – SMAART Institute`
- **Body:** Type, course name, Certificate ID, LinkedIn share prompt. CTA: *View & Download Certificate →*

### 3.7 Assessment Results — `sendAssessmentResultsEmail()`
- **Trigger:** Assessment results available (`notifyAssessmentComplete`).
- **Subject:** `📊 Results Ready: {AssessmentName} – SMAART Institute`
- **Body:** Score % circle + performance label (Excellent / Good / Satisfactory / Needs Improvement). CTA: *View Full Results →*

### 3.8 Ticket Update — `sendTicketUpdateEmail()`
- **Trigger:** Support ticket gets a reply (`notifyTicketResponse`, `tickets.js`).
- **Subject:** `📩 Ticket Update: "{TicketSubject}" – SMAART Institute`
- **Body:** Reply notice; asks user to log in to view full response. CTA: *View Ticket →*

### 3.11 Password Changed — `sendPasswordChangedEmail()`
- **Trigger:** Password change (`auth.js`). **(Email only — no dashboard notice.)**
- **Subject:** `🔒 Password Changed – SMAART Institute`
- **Body:** Timestamp, IP address, device/user-agent; urgent action if unauthorized. CTA: *Contact Support →*

### 3.12 System Announcement — `sendSystemAnnouncementEmail()`
- **Trigger:** Admin broadcast (`POST /notifications/broadcast`).
- **Subject:** `📣 {Title} – SMAART Institute`
- **Body:** Admin message; customizable CTA (default *Go to Dashboard →*).

> `resolveUserEmail(userId)` looks up the recipient's address from the Student/User collections before sending.

---

## 4. In-Dashboard Notifications (detail)

Created by `notify*()` functions in `back-end/services/notificationService.js`.
Each creates a `Notification` doc **and** emits it live via WebSocket.

| Function | Title | Message | Link | Icon / Color |
|---|---|---|---|---|
| `notifyWelcome` | 🎉 Welcome to SMAART Minds! | Hi {name}! … Start by taking your baseline assessment. | `/assessments` | — |
| `notifyBadgeEarned` | 🏆 New Badge Earned! | Congratulations! You've earned the "{badge}" badge. | badges | (dedup per badge) |
| `notifyAssessmentComplete` | 📊 Assessment Results Ready | Your {name} results are now available… | `/assessments/results/{id}` | — |
| `notifyCourseCompleted` | 🎓 Course Completed! | Amazing! You've completed "{course}". Your certificate is ready! | — | graduation-cap / #10B981 |
| `notifyLevelUp` | 🎉 Level Up! | You've reached Level {n}! New items unlocked: … | `/avatar` | trending-up / #F59E0B |
| `notifyStreakMilestone` | 🔥 {n}-Day Streak! | Milestone message (see below). | `/dashboard` | flame / #EF4444 |
| `notifyTicketResponse` | 📩 Ticket Update | New response on your ticket: "{subject}…" | `/tickets` | — |
| `notifyCertificateIssued` | 📜 Certificate Issued! | Your {type} certificate for "{course}" is ready to download! | `/certificates` | award / #8B5CF6 |
| `notifyTaskDue` | ⏰ Task Due Soon | "{task}" is due in {n} hours. | `/tasks` | clock / #EF4444 |
| `notifySystemAnnouncement` | (admin title) | (admin message) | (admin link) | megaphone / #64748B |
| `notifyNewCourse` | 📚 New Course Available! | "{course}" is now available. Enroll now to start learning! | `/courses/{id}` | book-open / #4F46E5 |

**Streak milestone messages** (`notifyStreakMilestone`): 7d "One week strong! 🔥",
14d "Two weeks of dedication! 🌟", 30d "A month of consistency! 🏆",
60d "Two months unstoppable! 💪", 90d "Quarter-year champion! 👑",
100d "100 days legend! 🎖️", 365d "A whole year! You're amazing! 🏅".

### 4.1 Career Path Lock Warning (dynamically injected)
`back-end/routes/notifications.js` (in the `GET /notifications` handler)
- **Trigger:** User hasn't locked their career path; injected relative to a 14-day
  window from registration (not stored via `notify*`).
- **Title:** `Lock Career Path Warning` (<14 days) / `Career Path Alert` (≥14 days).
- **Message:** Remaining days, or "You have exceeded the 14-day limit".
- **Link:** `/dashboard/career-agent/dashboard`. Deduplicated to one per user.

---

## 5. Dashboard Notification REST API
`back-end/routes/notifications.js`

| Method & Path | Description |
|---|---|
| `GET /notifications` | Paginated list; filters `unreadOnly`, `startDate`/`endDate`; injects career-path warning. |
| `GET /notifications/unread-count` | Current unread count. |
| `PATCH /notifications/:id/read` | Mark one read (emits WS update). |
| `PATCH /notifications/read-all` | Mark all read. |
| `DELETE /notifications/clear-all` | Delete all for user. |
| `DELETE /notifications/:id` | Delete one. |
| `POST /notifications/test` | Create test notification (dev only, off in prod). |
| `GET /notifications/summary` | Dashboard stats (name, logins, badges, sessions, enrollments). |
| `POST /notifications/broadcast` | **Admin:** create + WS-broadcast to all active students **and email them**. |
| `POST /notifications/subscribe` | Register a Web Push subscription (`user.pushSubscriptions`). |

---

## 6. Front-End Delivery Surfaces

- **`NotificationContext.jsx`** — Socket.io client + global state; methods
  `fetchNotifications`, `markRead`, `markAllRead`, `deleteNotification`,
  `clearAll`, `refresh`. Tracks `wsStatus` and unread count.
- **`NotificationBell.jsx`** — Header bell with red unread badge ("99+" cap),
  dropdown of latest 5, WS status dot (green/yellow/red), "View all →" link.
- **`NotificationToast.jsx`** — Top-right toast, auto-dismiss 5s with progress
  bar, max 3 at once, only for newly-arrived unread; click navigates to link.
- **`Notifications.jsx`** — Full page with status filter (All/Unread), date
  filter (All/Today/7d/30d), pagination, mark-all-read, clear-all, per-item delete.

---

*Generated 2026-07-02. Excludes `node_modules`. Line numbers may drift as code changes.*
