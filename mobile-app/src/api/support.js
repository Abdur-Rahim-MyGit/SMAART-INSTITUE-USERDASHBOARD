/**
 * Support API client — two separate backend systems behind one screen.
 *
 *   Tickets     `back-end/routes/tickets.js`     — technical/account help,
 *               auto-assigned to IT support and bridged to the ITSM platform.
 *   Grievances  `back-end/routes/grievances.js`  — formal complaints, student
 *               only, optionally anonymous, with their own audit trail.
 *
 * They are deliberately NOT merged: a grievance is a formal record with
 * different handling and different confidentiality rules to a help request.
 * The screen shows them as two tabs for exactly that reason.
 *
 * Response envelopes differ between the two — tickets return `{ data, pagination }`
 * and use `error` for failures; grievances return `{ data, count }`. The
 * unwrap helpers below absorb that so screens see plain arrays and objects.
 */
import { apiClient } from './client';

/* ── Shared vocabulary (mirrors the model enums — keep in step) ─────────── */

// back-end/models/SupportTicket.js. The backend accepts a longer legacy list;
// these are the ones worth offering a student on a phone.
export const TICKET_CATEGORIES = [
  { value: 'technical', label: 'Technical problem' },
  { value: 'account', label: 'Account & login' },
  { value: 'course', label: 'Course' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'placement issue', label: 'Placement' },
  { value: 'certificates & badges issue', label: 'Certificates & badges' },
  { value: 'career Direction', label: 'Career direction' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Something else' },
];

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// back-end/models/Grievance.js
export const GRIEVANCE_CATEGORIES = [
  { value: 'placement', label: 'Placement' },
  { value: 'course', label: 'Course' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'badges', label: 'Badges' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'career-direction', label: 'Career direction' },
  { value: 'skill-passport', label: 'Skills passport' },
  { value: 'other', label: 'Other' },
  { value: 'other-suggestion', label: 'A suggestion' },
];

/** Server-side length rules, duplicated so the form can fail fast and kindly. */
export const LIMITS = {
  ticket: { title: [5, 100], description: [10, 2000] },
  grievance: { title: [5, 100], description: [10, 3000] },
};

/* ── Tickets ────────────────────────────────────────────────────────────── */

export const getTickets = ({ page = 1, limit = 50, status } = {}) =>
  apiClient
    .get('/tickets', { params: { page, limit, ...(status ? { status } : {}) } })
    .then((r) => (Array.isArray(r.data?.data) ? r.data.data : []));

export const getTicket = (id) =>
  apiClient.get(`/tickets/${id}`).then((r) => r.data?.data ?? r.data);

export const createTicket = ({ title, description, category, priority = 'medium' }) =>
  apiClient
    .post('/tickets', { title, description, category, priority })
    .then((r) => r.data?.data ?? r.data);

export const replyToTicket = (id, message) =>
  apiClient
    .post(`/tickets/${id}/user-response`, { message })
    .then((r) => r.data?.data ?? r.data);

/* ── Grievances ─────────────────────────────────────────────────────────── */

export const getGrievances = () =>
  apiClient.get('/grievances').then((r) => (Array.isArray(r.data?.data) ? r.data.data : []));

export const getGrievance = (id) =>
  apiClient.get(`/grievances/${id}`).then((r) => r.data?.data ?? r.data);

export const createGrievance = ({ title, description, category, isAnonymous = false }) =>
  apiClient
    .post('/grievances', { title, description, category, isAnonymous })
    .then((r) => r.data?.data ?? r.data);

export const replyToGrievance = (id, message) =>
  apiClient.post(`/grievances/${id}/respond`, { message }).then((r) => r.data?.data ?? r.data);

/* ── Presentation helpers ───────────────────────────────────────────────── */

/**
 * Both systems use overlapping but not identical status vocabularies —
 * tickets open/in-progress/resolved/closed, grievances pending/in-progress/
 * resolved/closed. One map covers both so a status chip looks the same
 * wherever it appears.
 */
export const STATUS_META = {
  open: { label: 'Open', tone: 'info' },
  pending: { label: 'Pending', tone: 'warn' },
  'in-progress': { label: 'In progress', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'good' },
  closed: { label: 'Closed', tone: 'muted' },
};

/** A closed or resolved item accepts no further replies — the server rejects them. */
export const isConversationClosed = (status) => status === 'closed' || status === 'resolved';

export const labelFor = (list, value) =>
  list.find((o) => o.value === value)?.label || value || '—';
