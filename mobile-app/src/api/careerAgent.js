/**
 * Career Agent API client — `back-end/routes/careerAgent.js`.
 *
 * The agent is a gated flow, not a free-for-all screen set:
 *
 *   1. `getDirectionLockStatus` — has the student already committed to a
 *      career direction? The web checks this before showing anything else.
 *   2. `submitOnboarding` / `setCareerDirection` — the one-time intake.
 *   3. `getFinalPathway` + `lockFinalPathway` — the chosen pathway, then a
 *      deliberate lock so it stops changing under them.
 *   4. `getMyAnalysis` / `getDashboard` — the ongoing view.
 *
 * Respect the lock check first. Rendering the dashboard for a student who has
 * not onboarded shows empty panels rather than the intake they actually need.
 */
import { apiClient } from './client';

const base = '/career-agent';

// ── Gate ────────────────────────────────────────────────────────────────────

export const getDirectionLockStatus = () =>
  apiClient.get(`${base}/direction-lock/status`).then((r) => r.data);

export const markDirectionModalShown = () =>
  apiClient.put(`${base}/direction-lock/mark-modal-shown`).then((r) => r.data);

// ── Intake ──────────────────────────────────────────────────────────────────

export const submitOnboarding = (payload) =>
  apiClient.post(`${base}/onboarding`, payload).then((r) => r.data);

export const setCareerDirection = (payload) =>
  apiClient.post(`${base}/career-direction`, payload).then((r) => r.data);

export const saveStudentProfile = (payload) =>
  apiClient.post(`${base}/student/profile`, payload).then((r) => r.data);

// ── Pathway ─────────────────────────────────────────────────────────────────

export const getFinalPathway = () => apiClient.get(`${base}/final-pathway`).then((r) => r.data);

export const lockFinalPathway = (payload = {}) =>
  apiClient.put(`${base}/final-pathway/lock`, payload).then((r) => r.data);

// ── Analysis & dashboard ────────────────────────────────────────────────────

export const getMyAnalysis = () => apiClient.get(`${base}/my-analysis`).then((r) => r.data);

export const getAllMyAnalysis = () => apiClient.get(`${base}/my-analysis/all`).then((r) => r.data);

export const getAgentDashboard = (id) => apiClient.get(`${base}/dashboard/${id}`).then((r) => r.data);

// ── Roles & skills reference data ───────────────────────────────────────────

export const getCareerRoleNames = () => apiClient.get(`${base}/career-roles/names`).then((r) => r.data);

export const getCareerRole = (roleName) =>
  apiClient.get(`${base}/career-role/${encodeURIComponent(roleName)}`).then((r) => r.data);

export const getRoleSkills = (roleTitle) =>
  apiClient.get(`${base}/role-skills/${encodeURIComponent(roleTitle)}`).then((r) => r.data);

export const getRoleSkillsByFamily = (jobFamily) =>
  apiClient.get(`${base}/role-skills/family/${encodeURIComponent(jobFamily)}`).then((r) => r.data);

export const getRoadmap = (jobFamily) =>
  apiClient.get(`${base}/role-skills/roadmap/${encodeURIComponent(jobFamily)}`).then((r) => r.data);

export const getRoleProfile = (roleTitle) =>
  apiClient.get(`${base}/role-profile/${encodeURIComponent(roleTitle)}`).then((r) => r.data);

export const getRoleProfiles = () => apiClient.get(`${base}/role-profiles`).then((r) => r.data);

export const getDirectionRoles = (directionName) =>
  apiClient.get(`${base}/direction-roles/${encodeURIComponent(directionName)}`).then((r) => r.data);

export const getCertifications = (roleTitle) =>
  apiClient.get(`${base}/certifications/${encodeURIComponent(roleTitle)}`).then((r) => r.data);

// ── Skills progress ─────────────────────────────────────────────────────────

export const getUserSkills = (email) =>
  apiClient.get(`${base}/user-skills/${encodeURIComponent(email)}`).then((r) => r.data);

export const saveUserSkillProgress = (payload) =>
  apiClient.post(`${base}/user-skills/progress`, payload).then((r) => r.data);

export const submitFeedback = (payload) =>
  apiClient.post(`${base}/feedback`, payload).then((r) => r.data);
