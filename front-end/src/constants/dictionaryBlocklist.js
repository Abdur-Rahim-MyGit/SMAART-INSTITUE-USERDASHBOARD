// Words the General Dictionary tool refuses to look up. This is a student
// product, so profanity, slurs and sexual vulgarity are blocked outright
// rather than shown with a definition -- matching the intent of common
// client-side profanity filters (e.g. the "bad-words" package's list),
// kept local here instead of adding a dependency for a short, static list.
export const BLOCKED_WORDS = new Set([
  // Slurs
  "chink", "coon", "dyke", "fag", "faggot", "gook", "homo", "kike", "kraut",
  "negro", "nigga", "nigger", "paki", "retard", "retarded", "spic",
  // Profanity / vulgar insults
  "arse", "arsehole", "ass", "asshole", "bastard", "bitch", "bitches",
  "bollocks", "bugger", "bullshit", "crap", "cunt", "dick", "dickhead",
  "douche", "douchebag", "fuck", "fucked", "fucker", "fucking", "hoe",
  "jackass", "jerkoff", "motherfucker", "piss", "pissed", "prick", "shit",
  "shitty", "slut", "twat", "wank", "wanker", "whore",
  // Crude sexual slang (clinical anatomy/health terms are intentionally left
  // lookup-able -- this list targets vulgarity, not biology homework)
  "blowjob", "boner", "boob", "boobs", "cock", "cum", "dildo", "handjob",
  "jizz", "pussy", "tits", "titties",
  // Explicit-content / abuse terms schools commonly filter out of a
  // student-facing dictionary
  "milf", "molest", "porn", "porno", "pornography", "rape", "raped",
  "raping", "rapist",
]);

export const isBlockedWord = (word) => {
  if (!word) return false;
  const cleaned = word.toLowerCase().trim().replace(/[^a-z]/g, "");
  return BLOCKED_WORDS.has(cleaned);
};
