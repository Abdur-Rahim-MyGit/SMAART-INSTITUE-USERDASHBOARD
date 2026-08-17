/**
 * Password policy — an exact mirror of `validatePasswordPolicy` in
 * back-end/routes/auth.js (line ~103). Kept client-side so the user sees the
 * rules live as they type instead of round-tripping to get a 400 back.
 *
 * The server remains authoritative — this never replaces its check, it only
 * avoids a pointless failed request.
 */

export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p) => !!p && p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p || '') },
  { key: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p || '') },
  { key: 'number', label: 'One number', test: (p) => /[0-9]/.test(p || '') },
  {
    key: 'special',
    label: 'One special character (!@#$%^&*)',
    test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p || ''),
  },
];

/** @returns {{ isValid: boolean, errors: string[], passed: Record<string, boolean> }} */
export function validatePassword(password) {
  const passed = {};
  const errors = [];
  for (const rule of PASSWORD_RULES) {
    const ok = rule.test(password);
    passed[rule.key] = ok;
    if (!ok) errors.push(rule.label);
  }
  return { isValid: errors.length === 0, errors, passed };
}

/** 0–4 strength score, used only for the visual meter. */
export function passwordStrength(password) {
  if (!password) return 0;
  const { passed } = validatePassword(password);
  const met = Object.values(passed).filter(Boolean).length;
  // 5 rules → 4 buckets; a long password gets the top bucket sooner.
  if (met <= 1) return 0;
  if (met <= 2) return 1;
  if (met <= 3) return 2;
  if (met <= 4) return 3;
  return password.length >= 12 ? 4 : 3;
}

/**
 * The server returns policy failures as `err.data.requirements` (an array).
 * Screens use this so a 400 renders as a readable multi-line message.
 */
export function formatServerPasswordError(err) {
  const reqs = err?.data?.requirements;
  if (Array.isArray(reqs) && reqs.length) {
    return `${err.message}:\n• ${reqs.join('\n• ')}`;
  }
  return err?.message || 'Password does not meet requirements.';
}
