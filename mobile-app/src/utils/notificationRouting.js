/**
 * Maps the web route a push notification carries onto a mobile screen.
 *
 * The backend attaches `data.link` (and sometimes `data.courseId`) to every
 * push, but those links are web paths — '/tickets', '/assessments',
 * '/dashboard/career-agent/dashboard'. The app has no route by those names, so
 * without a translation a tap could only ever resume the last screen, which is
 * exactly what it used to do.
 *
 * Longest prefix wins, so '/dashboard/career-agent' is matched before
 * '/dashboard'. Anything unrecognised falls back to the notifications list —
 * never a dead end, and always somewhere the notification is visible.
 */

/** Web path prefix → [mobile route name, params]. Order does not matter; the
 *  longest matching prefix is chosen. */
const ROUTE_MAP = [
  ['/dashboard/career-agent', ['CareerDirections', undefined]],
  ['/assessments', ['Assessments', undefined]],
  ['/certificates', ['Certificates', undefined]],
  ['/tickets', ['Support', undefined]],
  ['/community', ['MainTabs', { screen: 'Community' }]],
  ['/courses', ['MainTabs', { screen: 'Learning' }]],
  ['/placements', ['MainTabs', { screen: 'Career' }]],
  ['/jobs', ['MainTabs', { screen: 'Career' }]],
  ['/avatar', ['MainTabs', { screen: 'Profile' }]],
  ['/profile', ['MainTabs', { screen: 'Profile' }]],
  ['/dashboard', ['MainTabs', { screen: 'Home' }]],
];

const FALLBACK = ['Notifications', undefined];

/**
 * @param {object} data the push payload's `data` object
 * @returns {[string, object|undefined]} `navigate(...)` arguments
 */
export function resolveNotificationTarget(data) {
  if (!data || typeof data !== 'object') return FALLBACK;

  // A course push carries the id directly rather than a link.
  if (data.courseId) return ['MainTabs', { screen: 'Learning', params: { courseId: data.courseId } }];

  const link = typeof data.link === 'string' ? data.link.trim() : '';
  if (!link) return FALLBACK;

  // Strip any origin so both '/tickets' and 'https://app…/tickets' resolve.
  const path = link.replace(/^https?:\/\/[^/]+/i, '') || '/';

  const match = ROUTE_MAP.filter(([prefix]) => path === prefix || path.startsWith(`${prefix}/`)).sort(
    (a, b) => b[0].length - a[0].length
  )[0];

  return match ? match[1] : FALLBACK;
}
