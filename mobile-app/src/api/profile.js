import { apiClient } from './client';

/**
 * FR-AUTH-12 — Onboarding profile completion.
 *
 * Mirrors the web's ComprehensiveSignup flow (back-end/routes/users.js), with
 * one behaviour worth knowing before touching this file:
 *
 *   • PATCH /users/register-section MERGES into the embedded `registration`
 *     subdoc and deliberately does NOT set `isRegistered` (see the comment at
 *     users.js ~line 620). Safe to call per step.
 *   • POST /users/register-details REPLACES the whole subdoc and IS what flips
 *     `isRegistered = true` (users.js ~line 370).
 *
 * Because the final submit replaces rather than merges, `completeRegistration`
 * below reads the existing record first and layers the mobile answers on top —
 * otherwise finishing onboarding on the phone would wipe sections the student
 * had already filled in on the web.
 */

/** Existing (flattened) registration record, or a mostly-null stub if none. */
export const getRegistration = (email) =>
  apiClient.get(`/users/register-details/${encodeURIComponent(email)}`).then((r) => r.data);

/** Progressive per-step save. Merge semantics — safe to call repeatedly. */
export const saveRegistrationSection = (email, section, data) =>
  apiClient.patch('/users/register-section', { email, section, data }).then((r) => r.data);

/**
 * Final submit — flips `isRegistered` to true.
 *
 * Sent as multipart/form-data because the endpoint sits behind multer's
 * `upload.fields(...)`; it parses section objects out of string fields, so we
 * JSON-stringify each one. No files are attached from mobile yet (profile photo
 * upload is a Phase 4+ concern), which the endpoint tolerates.
 */
export async function completeRegistration({ email, fullName, mobileNumber, personalDetails, sections = {} }) {
  // Read-modify-write so we don't clobber web-entered sections.
  let existing = {};
  try {
    existing = (await getRegistration(email)) || {};
  } catch {
    existing = {};
  }

  const form = new FormData();
  form.append('email', email);
  form.append('fullName', fullName);
  form.append('mobileNumber', mobileNumber);

  // GET /register-details returns the personal fields FLAT (nickname, bio,
  // address, … spread from the registration subdoc), not under a
  // `personalDetails` key — while POST expects them re-nested under
  // `personalDetails`. Rebuild the merge base from the flat record, otherwise
  // web-entered values are blanked by the POST's `|| ''` defaults.
  const existingPersonalDetails = {
    nickname: existing.nickname,
    dob: existing.dob,
    gender: existing.gender,
    institution: existing.institution,
    department: existing.department,
    cgpa: existing.cgpa,
    yearOfStudy: existing.yearOfStudy,
    yearOfPassing: existing.yearOfPassing,
    alternateMobile: existing.alternateMobile,
    bio: existing.bio,
    batch: existing.batch,
    educationLevel: existing.educationLevel,
    profilePhoto: existing.profilePhoto,
  };
  // Drop undefineds so they don't shadow anything during the spread below.
  Object.keys(existingPersonalDetails).forEach((k) => {
    if (existingPersonalDetails[k] === undefined || existingPersonalDetails[k] === null) {
      delete existingPersonalDetails[k];
    }
  });

  // The wizard prefills from the existing record, so an empty value it sends
  // (e.g. its hardcoded `street: ''`) is never a deliberate clear — only
  // non-empty mobile answers may override what the web already has.
  const incomingPersonalDetails = {};
  Object.entries(personalDetails || {}).forEach(([k, v]) => {
    if (k === 'address') return;
    if (v !== undefined && v !== null && v !== '') incomingPersonalDetails[k] = v;
  });

  const mergedAddress = { ...(existing.address || {}) };
  Object.entries(personalDetails?.address || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') mergedAddress[k] = v;
  });

  const merged = {
    personalDetails: {
      ...existingPersonalDetails,
      ...incomingPersonalDetails,
      address: mergedAddress,
    },
    tenthDetails: sections.tenthDetails ?? existing.tenthDetails ?? {},
    twelfthDetails: sections.twelfthDetails ?? existing.twelfthDetails ?? {},
    higherEducation: sections.higherEducation ?? existing.higherEducation ?? [],
    extracurricular: sections.extracurricular ?? existing.extracurricular ?? [],
    jobPreferences: sections.jobPreferences ?? existing.jobPreferences ?? [],
    sectorPreferences: sections.sectorPreferences ?? existing.sectorPreferences ?? {},
    careerGoals: sections.careerGoals ?? existing.careerGoals ?? {},
    workExperience: sections.workExperience ?? existing.workExperience ?? [],
    projects: sections.projects ?? existing.projects ?? [],
    certificates: sections.certificates ?? existing.certificates ?? [],
  };

  Object.entries(merged).forEach(([key, value]) => {
    form.append(key, JSON.stringify(value));
  });

  const res = await apiClient.post('/users/register-details', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
