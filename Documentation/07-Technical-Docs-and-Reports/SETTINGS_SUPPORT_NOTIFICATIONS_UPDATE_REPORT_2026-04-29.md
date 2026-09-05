# Settings, Support, and Notifications Update Report

Date: 2026-04-29

## Scope Completed

This update closes the requested work across:

- `Settings.jsx`
- `SupportTicketsPage.jsx`
- `Help.jsx`
- `Notifications.jsx`
- topbar notification bell syncing
- backend support for user settings persistence
- backend support for ticket attachments and realtime support notifications

## 1. Settings Completion

### Frontend

Files:

- `front-end/src/pages/Settings.jsx`
- `front-end/src/contexts/ThemeContext.jsx`

What is now implemented:

- Settings page loads user settings from `GET /api/users/settings` using the shared `apiCall` utility.
- Settings page saves all tab state through `PUT /api/users/settings`.
- Profile, notification, privacy, appearance, and language data are all driven from persisted backend state instead of mock-only state.
- Theme changes are applied immediately in the UI and also persisted to the backend.
- Saved profile name and phone updates are reflected back into the user context after a successful save.

### Backend

Files:

- `back-end/routes/users.js`
- `back-end/models/User.js`
- `back-end/models/Student.js`
- `back-end/models/schemas/userSettings.js`

What is now implemented:

- Added and used a normalized settings schema for:
  - `profile`
  - `notifications`
  - `privacy`
  - `appearance`
  - `language`
- `GET /api/users/settings` now returns merged defaults plus persisted user values.
- `PUT /api/users/settings` now:
  - merges partial updates safely
  - saves settings on the authenticated account
  - updates `fullName` and `mobile` on the main user record
  - syncs registration `fullName` and `mobileNumber` where a registration record exists

### Dark Mode / Light Mode Persistence

- Theme persistence is implemented in both the settings page and `ThemeContext`.
- The app first applies the local theme quickly for UI responsiveness.
- If an authenticated user exists, the persisted database theme is fetched and becomes the source of truth.
- Theme saves now survive reloads and login sessions.

## 2. Help & Support Completion

### Frontend API Refactor

Files:

- `front-end/src/pages/SupportTicketsPage.jsx`
- `front-end/src/pages/Help.jsx`
- `front-end/src/services/ticketApi.js`
- `front-end/src/components/tickets/TicketForm.jsx`
- `front-end/src/components/tickets/TicketDetail.jsx`

What is now implemented:

- Support flows now use the centralized `apiCall` wrapper through `ticketApi.js`.
- No hardcoded `http://localhost:5000/api/tickets` calls remain in the target support pages.
- Token injection and backend host/port selection now come from the shared API layer.

### File Attachment Uploads

Files:

- `back-end/middleware/upload.js`
- `back-end/routes/tickets.js`
- `back-end/server.js`
- `front-end/src/components/tickets/TicketForm.jsx`
- `front-end/src/components/tickets/TicketDetail.jsx`

What was added/fixed:

- Added a dedicated `uploadSupportAttachments` multer configuration for support tickets.
- Support ticket attachments now accept:
  - images
  - PDF
  - DOC
  - DOCX
  - TXT
- Attachments are stored with a public URL field: `publicUrl`.
- Backend now exposes uploaded files through `/uploads/...`.
- Ticket detail modal now builds correct downloadable attachment URLs instead of relying on raw filesystem paths.

### Resolved / Closed Filters

Files:

- `front-end/src/pages/SupportTicketsPage.jsx`
- `front-end/src/pages/Help.jsx`

Status:

- Completed.
- Both ticket history views include status filters for:
  - `open`
  - `in-progress`
  - `resolved`
  - `closed`

## 3. Notifications Completion

### Realtime Socket.io

Files:

- `back-end/services/websocketService.js`
- `back-end/routes/notifications.js`
- `front-end/src/contexts/NotificationContext.jsx`
- `front-end/src/pages/Notifications.jsx`

What is implemented:

- Socket.io server is attached on the backend.
- Authenticated clients connect with the existing JWT token.
- Frontend notification context subscribes to:
  - `notification`
  - `unread_count`
  - `notification_state`
  - `notifications_cleared`
- Notifications page now works against shared realtime state instead of manual-only refresh logic.
- Unread counts update instantly when read state changes.

### Topbar Bell Sync

Files:

- `front-end/src/components/DashboardHeader.jsx`
- `front-end/src/components/NotificationBell.jsx`

What was changed:

- Re-enabled the notification bell inside the dashboard header.
- Bell unread count is now driven directly from `NotificationContext`.
- Bell connection indicator reflects realtime socket state.
- Clicking a notification in the bell now marks it as read immediately through `markRead(...)`.
- Bell dropdown and notifications page now stay in sync because both use the same shared context state.
- Added a consistent "View all notifications" action from the bell dropdown.

## 4. Support Notifications Added

Files:

- `back-end/routes/tickets.js`
- `back-end/services/notificationService.js`

What was added:

- When an admin replies to a ticket, the ticket owner now receives a support notification.
- When ticket status changes to `in-progress`, `resolved`, or `closed`, the ticket owner now receives a support notification.
- ITSM worknote sync now also creates an in-app support notification for the affected user.
- Support notification links were corrected to route users to `/tickets`, which exists in the frontend.

## 5. Important Behavioral Outcome

After this update:

- Settings are no longer mock-only.
- Theme choice persists properly.
- Support pages no longer rely on localhost-only fetch calls.
- Ticket attachments upload and download correctly.
- Resolved and closed ticket filtering is available.
- Notifications update in realtime through Socket.io.
- The dashboard topbar bell now reflects unread/read state instantly.

## 6. Files Touched In This Completion Pass

- `back-end/middleware/upload.js`
- `back-end/routes/tickets.js`
- `back-end/server.js`
- `back-end/services/notificationService.js`
- `front-end/src/components/DashboardHeader.jsx`
- `front-end/src/components/NotificationBell.jsx`
- `front-end/src/components/tickets/TicketDetail.jsx`

## 7. Notes

- Several requested pieces were already partially implemented in the working tree before this completion pass, especially:
  - settings API wiring
  - notification context with Socket.io
  - support page migration to `ticketApi`
- This pass focused on finishing the missing integration gaps and making the feature set behave correctly end to end.
