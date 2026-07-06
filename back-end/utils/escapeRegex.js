/**
 * escapeRegex — build a SAFE value for a Mongo `$regex` search from user input.
 *
 * Mongo `$regex` uses a backtracking engine, so raw user input enables ReDoS
 * (catastrophic backtracking) and regex injection (e.g. `.*` to match all).
 * This escapes every regex metacharacter and caps length so a search term can
 * only ever be a literal substring match.
 */
module.exports = function escapeRegex(input, maxLen = 80) {
  return String(input == null ? '' : input)
    .slice(0, maxLen)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
