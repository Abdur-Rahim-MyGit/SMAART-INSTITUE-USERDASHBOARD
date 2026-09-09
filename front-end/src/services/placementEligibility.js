/**
 * Client-side eligibility check for placement postings.
 *
 * A posting's `eligibility` block (minCGPA, noBacklog, allowedBranches) is
 * compared against what we can prove about the student from two existing
 * endpoints: `/auth/me` (backlogs, branch) and `/cgpa` (the CGPA they saved
 * from the calculator). Anything we can't verify is reported as "unknown"
 * rather than guessed, so the badge never claims eligibility it can't back.
 */

export const normalizeText = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Pull { cgpa, backlogs, branch } out of the /auth/me and /cgpa responses.
 * Every field is null when the source doesn't have it.
 */
export const extractStudentProfile = (meResponse, cgpaResponse) => {
  const user = meResponse?.user || {};
  const reg = meResponse?.registration || {};

  let cgpa = null;
  const saved = cgpaResponse?.data?.cgpa;
  if (typeof saved === "number" && saved > 0) cgpa = saved;
  else if (typeof user.academic?.overallCgpa === "number" && user.academic.overallCgpa > 0) cgpa = user.academic.overallCgpa;
  else if (user.cgpa && !Number.isNaN(parseFloat(user.cgpa))) cgpa = parseFloat(user.cgpa);

  let backlogs = null;
  if (Array.isArray(user.activeArrears)) backlogs = user.activeArrears.length;
  else if (user.academic?.activeBacklogs != null) backlogs = Number(user.academic.activeBacklogs);
  else if (user.activeBacklogs != null) backlogs = Number(user.activeBacklogs);
  else if (reg.academic?.activeBacklogs != null) backlogs = Number(reg.academic.activeBacklogs);
  if (backlogs != null && Number.isNaN(backlogs)) backlogs = null;

  const branch =
    user.department?.specialization ||
    user.academic?.specialisation ||
    user.specialization ||
    (typeof user.department === "string" ? user.department : null) ||
    reg.department ||
    null;

  return { cgpa, backlogs, branch };
};

/**
 * Returns null when the posting has no checkable criteria, otherwise
 * { status: 'yes' | 'no' | 'unknown', checks: [...], failed: [...], unknown: [...] }.
 * Each check is { key, ok: true|false|null, label, detail }.
 */
export const evaluateEligibility = (job, profile) => {
  const e = job?.eligibility;
  if (!e || !profile) return null;
  const checks = [];

  if (e.minCGPA > 0) {
    if (profile.cgpa == null) {
      checks.push({ key: "cgpa", ok: null, label: `Minimum CGPA ${e.minCGPA}`, detail: "Save your CGPA in the calculator to verify" });
    } else {
      checks.push({ key: "cgpa", ok: profile.cgpa >= e.minCGPA, label: `Minimum CGPA ${e.minCGPA}`, detail: `You have ${profile.cgpa}` });
    }
  }

  if (e.noBacklog) {
    if (profile.backlogs == null) {
      checks.push({ key: "backlogs", ok: null, label: "No active backlogs", detail: "Backlog count isn't on your profile yet" });
    } else {
      checks.push({
        key: "backlogs",
        ok: profile.backlogs === 0,
        label: "No active backlogs",
        detail: profile.backlogs === 0 ? "You have none" : `You have ${profile.backlogs}`,
      });
    }
  }

  if (Array.isArray(e.allowedBranches) && e.allowedBranches.length > 0) {
    if (!profile.branch) {
      checks.push({ key: "branch", ok: null, label: "Eligible branches", detail: "Branch isn't on your profile yet" });
    } else {
      const mine = normalizeText(profile.branch);
      const ok = e.allowedBranches.some((b) => {
        const nb = normalizeText(b);
        return nb && (nb === mine || mine.includes(nb) || nb.includes(mine));
      });
      checks.push({ key: "branch", ok, label: "Eligible branches", detail: profile.branch });
    }
  }

  if (!checks.length) return null;
  const failed = checks.filter((c) => c.ok === false);
  const unknown = checks.filter((c) => c.ok === null);
  const status = failed.length ? "no" : unknown.length ? "unknown" : "yes";
  return { status, checks, failed, unknown };
};

/** Whole days until a deadline (negative = passed), or null when unset/invalid. */
export const daysUntil = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
};

/**
 * 0-100 skill-match score from the backend's `missedMustHaves` evaluation.
 * null when the backend didn't evaluate this posting or it lists no skills.
 */
export const getMatchScore = (job, skillCount) => {
  if (!Array.isArray(job?.missedMustHaves)) return null;
  const required = (job.structuredSkills?.length || 0) || skillCount || 0;
  if (!required) return null;
  const gaps = job.missedMustHaves.length;
  return Math.max(0, Math.round(100 * (1 - gaps / Math.max(required, gaps))));
};

/** True when a locked career-path role (e.g. "Cloud Engineer") matches a posting title. */
export const roleMatchesTitle = (role, title) => {
  const r = normalizeText(role);
  const t = normalizeText(title);
  if (!r || !t) return false;
  if (t.includes(r) || r.includes(t)) return true;
  const rw = r.split(" ").filter((w) => w.length > 3);
  const tw = new Set(t.split(" "));
  const hits = rw.filter((w) => tw.has(w)).length;
  return rw.length > 0 && hits >= Math.min(2, rw.length);
};
