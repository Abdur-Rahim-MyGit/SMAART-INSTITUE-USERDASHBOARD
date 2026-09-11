export const ORG_NAME = 'SMAART Institute';

export const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

export const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    // Mongo-only noise (subdocument _id, document __v) must never affect the
    // fingerprint: the client computes it from a plain payload with neither,
    // the server from a hydrated Mongoose document with both, so leaving
    // them in makes every export a false content-tamper mismatch.
    return `{${Object.keys(value)
      .filter((key) => key !== '_id' && key !== '__v')
      .sort()
      .map((key) => `${key}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(normalizeText(value));
};

export const hashString = (input) => {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, '0');
};

export const buildResumeFingerprint = (resumePayload = {}) =>
  hashString(
    stableStringify({
      personalInfo: resumePayload.personalInfo,
      summary: resumePayload.summary,
      experience: resumePayload.experience,
      education: resumePayload.education,
      skills: resumePayload.skills,
      projects: resumePayload.projects,
      achievements: resumePayload.achievements,
      certifications: resumePayload.certifications,
      positions: resumePayload.positions,
      publications: resumePayload.publications,
      objective: resumePayload.objective,
      summaryMode: resumePayload.summaryMode,
      personalDetails: resumePayload.personalDetails,
    })
  );

export const createResumePublicId = (fingerprint) => {
  const randomPart =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().split('-')[0]
      : Math.random().toString(36).slice(2, 10);
  return `SMR-${new Date().getFullYear()}-${fingerprint.slice(0, 4)}-${randomPart.toUpperCase()}`;
};

export const buildVerificationUrl = (resumePublicId, fingerprint) => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/verify-resume/${encodeURIComponent(resumePublicId)}?h=${encodeURIComponent(fingerprint)}`;
};
