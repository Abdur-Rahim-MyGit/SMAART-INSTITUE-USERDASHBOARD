export const ORG_NAME = 'SMAART Institute';

export const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

export const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
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
