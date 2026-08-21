/**
 * jobModerationEngine.js
 * API-free moderation for job postings: profanity, religion / caste bias,
 * gender / age / disability bias, scams, and spam heuristics.
 *
 * Every rule returns { category, severity, matchedPhrase }. A posting with any
 * flag is stored as moderationStatus 'flagged' and hidden from students until
 * an admin reviews it (see placementController / smaartJobController).
 *
 * Matching notes
 *  - Phrases and word lists match on WORD BOUNDARIES, so "class" never trips
 *    on "ass", "assess" never trips, "Scunthorpe"-style false positives are
 *    avoided.
 *  - Religion / caste use a WINDOW test: the community term must sit within a
 *    few words of preference / exclusion language ("only", "preferred", "need
 *    not apply", ...) to be a Hard Block. A bare mention of a religion or a
 *    reservation category is a Soft Flag (routes to human review). Caste names
 *    that double as common surnames (Reddy, Nair, Patel, ...) are flagged ONLY
 *    with preference language, so "Contact: Mr. Reddy" stays clean.
 */

const FLAG_SEVERITY = {
    HARD_BLOCK: 'Hard Block',
    SOFT_FLAG: 'Soft Flag'
};

// ─── 1. Legacy phrase blocklists (kept, exact-phrase, word-bounded) ─────────
const BANNED_PHRASES = {
    'Gendered job titles': ['waitress', 'salesman', 'foreman', 'chairman', 'stewardess', 'postman', 'watchman', 'office boy', 'peon', 'man friday', 'girl friday', 'lady secretary'],
    'Explicit sex preference': ['males only', 'females only', 'women need not apply', 'men only', 'male candidates only', 'female candidates only', 'only male', 'only female', 'boys only', 'girls only'],
    'Age-coded language': ['young and dynamic', 'digital native', 'youthful team', 'mature professionals', 'young blood', 'fresh young'],
    'Nationality/Passport': ['uk passport holders only', 'british passport only', 'indian passport only', 'us citizens only'],
    'Native speaker': ['native english speaker', 'mother tongue english', 'native speaker'],
    'Transgender exclusion': ['no transgender', 'cisgender only', 'no trans'],
    'HIV/AIDS exclusion': ['hiv-negative', 'hiv negative'],
    'Marital status': ['married candidates preferred', 'unmarried preferred', 'single only', 'bachelors only', 'unmarried only', 'married only'],
    'Family/pregnancy exclusion': ['no children', 'must not plan pregnancy', 'no recent mothers', 'not pregnant', 'no pregnant'],
    'Fee-charging scam': ['registration fee', 'processing fee', 'refundable deposit', 'kit fee', 'pay to apply', 'security deposit', 'training fee'],
    'Data theft scam': ['cvv', 'bank account number', 'credit card number', 'debit card', 'otp', 'net banking password', 'upi pin'],
    'Unofficial contact': ['whatsapp your resume to', 'whatsapp your cv', 'send resume on whatsapp'],
    'Skin tone preference': ['fair complexion preferred', 'good looks and fair skin', 'fair skin', 'light skin', 'fair complexion', 'wheatish', 'fair colour', 'fair color'],
    'Disability exclusion': ['able-bodied only', 'no disabilities', 'must be physically fit', 'no handicapped', 'physically handicapped need not apply'],
    'Appearance requirements': ['minimum height', 'slim build', 'attractive', 'good looking', 'smart looking girls', 'presentable females'],
    'Mental health stigma': ['emotionally stable', 'no history of mental illness'],
    'Religious dress restriction': ['no headscarves', 'no turbans', 'no hijab', 'no burqa', 'no beard', 'clean shaven only', 'no tilak', 'no bindi'],
    'Explicit orientation exclusion': ['no lgbtq', 'straight only', 'no gays', 'heterosexual only'],
    'Vague culture fit': ['culture fit', 'feel like family', 'vibe with us'],
    'Blanket extroversion': ['highly extroverted', 'outgoing personality essential'],
    'Overqualification framing': ['unchallenging', 'earlier in their career'],
    'Buzzwords': ['rockstar', 'ninja', 'guru', 'wizard']
};
const SOFT_CATEGORIES = new Set(['Vague culture fit', 'Blanket extroversion', 'Overqualification framing', 'Buzzwords', 'Unofficial contact']);

// ─── 2. Profanity / abusive language (word-bounded) ─────────────────────────
// English core + common Hindi/Tamil transliterations seen in Indian job text.
// Kept as data so it can be extended without touching logic.
const PROFANITY = [
    // English
    'fuck', 'fucker', 'fucking', 'fucked', 'motherfucker', 'shit', 'bullshit', 'bitch', 'bitches', 'bastard',
    'asshole', 'arsehole', 'dick', 'dickhead', 'prick', 'cunt', 'pussy', 'cock', 'whore', 'slut', 'wanker',
    'twat', 'bollocks', 'douche', 'douchebag', 'jerkoff', 'jackass', 'dumbass', 'retard', 'retarded',
    'nigger', 'nigga', 'faggot', 'fag', 'chink', 'paki', 'kike', 'spic', 'wetback', 'tranny',
    'bloody hell', 'piss off', 'screw you', 'suck my', 'blowjob', 'handjob', 'porn', 'sex worker',
    // Hindi / Hinglish transliterations
    'chutiya', 'chutiye', 'chutia', 'madarchod', 'maderchod', 'behenchod', 'bhenchod', 'bhosdike', 'bhosdi',
    'gaandu', 'gandu', 'gaand', 'lund', 'lauda', 'loda', 'randi', 'randwa', 'harami', 'haramzada', 'haramkhor',
    'kutta', 'kutti', 'kamina', 'kamine', 'saala', 'saale', 'chinal', 'bakchod', 'bakchodi', 'jhaant', 'jhant',
    'tatti', 'chodu', 'chod', 'chodna', 'bsdk',
    // Tamil transliterations
    'punda', 'pundai', 'otha', 'oththa', 'thevidiya', 'thevdiya', 'koothi', 'sunni', 'ommala', 'thayoli',
    'poolu', 'kena', 'baadu', 'naaye', 'loosu'
];
// 'mc' / 'bc' are deliberately NOT listed: they collide with "300 BC", name
// initials, and the Backward Class reservation category (handled by the caste
// rules with window logic). 'bsdk' is unambiguous, so it stays — matched only
// as a stand-alone token.
const RISKY_ABBREVIATIONS = new Set(['bsdk']);

// ─── 3. Religion ─────────────────────────────────────────────────────────────
const RELIGION_TERMS = [
    'hindu', 'hindus', 'muslim', 'muslims', 'islamic', 'islam', 'christian', 'christians', 'catholic', 'catholics',
    'protestant', 'sikh', 'sikhs', 'jain', 'jains', 'buddhist', 'buddhists', 'parsi', 'parsis', 'zoroastrian',
    'jew', 'jews', 'jewish', 'atheist', 'atheists', 'brahmo', 'lingayat', 'lingayats'
];

// ─── 4. Caste ────────────────────────────────────────────────────────────────
// Category / varna / reservation terms — a bare mention is a Soft Flag.
const CASTE_CATEGORY_TERMS = [
    'caste', 'castes', 'jaati', 'jati', 'varna', 'upper caste', 'lower caste', 'forward caste', 'forward class',
    'backward caste', 'backward class', 'other backward class', 'other backward classes', 'scheduled caste',
    'scheduled castes', 'scheduled tribe', 'scheduled tribes', 'general category', 'general caste', 'reserved category',
    'brahmin', 'brahmins', 'kshatriya', 'kshatriyas', 'vaishya', 'vaishyas', 'shudra', 'shudras', 'dalit', 'dalits',
    'harijan', 'untouchable', 'untouchables', 'adivasi', 'adivasis', 'tribal candidates'
];
// Reservation abbreviations — only when written as stand-alone tokens.
const CASTE_ABBREVIATIONS = ['sc', 'st', 'obc', 'ews', 'sc/st', 'sc/st/obc', 'bc', 'mbc', 'dnc'];
// Community names that are also common surnames — flagged ONLY with
// preference / exclusion language nearby.
const CASTE_SURNAME_TERMS = [
    'iyengar', 'iyengars', 'iyer', 'iyers', 'reddy', 'reddys', 'reddies', 'nair', 'nairs', 'menon', 'pillai',
    'chettiar', 'chettiars', 'mudaliar', 'mudaliars', 'gounder', 'gounders', 'thevar', 'thevars', 'vanniyar', 'vanniyars',
    'nadar', 'nadars', 'vellalar', 'kamma', 'kammas', 'kapu', 'kapus', 'naidu', 'naidus', 'velama', 'gowda', 'gowdas',
    'vokkaliga', 'vokkaligas', 'ezhava', 'ezhavas', 'patel', 'patels', 'patidar', 'patidars', 'yadav', 'yadavs',
    'jat', 'jats', 'gujjar', 'gujjars', 'rajput', 'rajputs', 'maratha', 'marathas', 'kayastha', 'kayasthas',
    'bania', 'baniya', 'baniyas', 'agarwal', 'agrawal', 'marwari', 'marwaris', 'kurmi', 'kurmis', 'koli', 'kolis',
    'mahar', 'mahars', 'chamar', 'chamars', 'bhangi', 'valmiki', 'pasi', 'musahar', 'lingayat'
];

// Preference / exclusion language that turns a mention into discrimination.
const PREFERENCE_WORDS = [
    'only', 'preferred', 'prefer', 'preferably', 'must be', 'should be', 'need not apply', 'not allowed', 'not eligible',
    'no ', 'exclud', 'restricted to', 'reserved for', 'required', 'mandatory', 'compulsory', 'strictly', 'exclusively',
    'we hire', 'we want', 'looking for', 'seeking', 'candidates from', 'belonging to', 'from the', 'community only',
    'avoid', 'not from', 'except', 'apart from', 'other than'
];
const WINDOW_WORDS = 7; // how far (in words) preference language may sit from the community term

// ─── helpers ─────────────────────────────────────────────────────────────────
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (phrase) => new RegExp(`(^|[^a-z0-9])${escapeRe(phrase)}(?=$|[^a-z0-9])`, 'i');

const normalize = (t) => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();

// Words around every occurrence of `term`, as a lowercase string window.
const windowsAround = (text, term) => {
    const words = text.split(/\s+/);
    const out = [];
    const termWords = term.split(' ');
    for (let i = 0; i <= words.length - termWords.length; i++) {
        let hit = true;
        for (let k = 0; k < termWords.length; k++) {
            if (words[i + k].replace(/[^a-z0-9/]/g, '') !== termWords[k]) { hit = false; break; }
        }
        if (hit) {
            const from = Math.max(0, i - WINDOW_WORDS);
            const to = Math.min(words.length, i + termWords.length + WINDOW_WORDS);
            out.push(words.slice(from, to).join(' '));
        }
    }
    return out;
};

const hasPreference = (window) => PREFERENCE_WORDS.some(p => window.includes(p));

// ─── rule groups ─────────────────────────────────────────────────────────────
function checkPhraseLists(text, flags) {
    for (const [category, phrases] of Object.entries(BANNED_PHRASES)) {
        for (const phrase of phrases) {
            if (wordRe(phrase).test(text)) {
                flags.push({
                    category,
                    severity: SOFT_CATEGORIES.has(category) ? FLAG_SEVERITY.SOFT_FLAG : FLAG_SEVERITY.HARD_BLOCK,
                    matchedPhrase: phrase
                });
            }
        }
    }
}

function checkProfanity(text, flags) {
    const seen = new Set();
    for (const word of PROFANITY) {
        if (RISKY_ABBREVIATIONS.has(word)) {
            // stand-alone token only, and only when the whole token is that abbreviation
            const re = new RegExp(`(^|\\s)${escapeRe(word)}(?=\\s|[.,!?]|$)`, 'i');
            if (re.test(text) && !seen.has(word)) {
                seen.add(word);
                flags.push({ category: 'Profanity / abusive language', severity: FLAG_SEVERITY.HARD_BLOCK, matchedPhrase: word });
            }
            continue;
        }
        if (!seen.has(word) && wordRe(word).test(text)) {
            seen.add(word);
            flags.push({ category: 'Profanity / abusive language', severity: FLAG_SEVERITY.HARD_BLOCK, matchedPhrase: word });
        }
    }
}

function checkCommunityBias(text, flags) {
    // Religion
    for (const term of RELIGION_TERMS) {
        const wins = windowsAround(text, term);
        if (!wins.length) continue;
        const biased = wins.some(hasPreference);
        flags.push({
            category: biased ? 'Religion preference/exclusion' : 'Religion mentioned',
            severity: biased ? FLAG_SEVERITY.HARD_BLOCK : FLAG_SEVERITY.SOFT_FLAG,
            matchedPhrase: term
        });
    }
    // Caste — categories & varna: mention = soft, with preference = hard
    for (const term of CASTE_CATEGORY_TERMS) {
        const wins = windowsAround(text, term);
        if (!wins.length) continue;
        const biased = wins.some(hasPreference);
        flags.push({
            category: biased ? 'Caste preference/exclusion' : 'Caste mentioned',
            severity: biased ? FLAG_SEVERITY.HARD_BLOCK : FLAG_SEVERITY.SOFT_FLAG,
            matchedPhrase: term
        });
    }
    // Caste — reservation abbreviations: stand-alone tokens; mention = soft, with preference = hard
    for (const abbr of CASTE_ABBREVIATIONS) {
        const wins = windowsAround(text, abbr);
        if (!wins.length) continue;
        const biased = wins.some(hasPreference);
        flags.push({
            category: biased ? 'Caste preference/exclusion' : 'Reservation category mentioned',
            severity: biased ? FLAG_SEVERITY.HARD_BLOCK : FLAG_SEVERITY.SOFT_FLAG,
            matchedPhrase: abbr
        });
    }
    // Caste — surname-like community names: ONLY with preference language
    for (const term of CASTE_SURNAME_TERMS) {
        const wins = windowsAround(text, term);
        if (wins.length && wins.some(hasPreference)) {
            flags.push({ category: 'Caste preference/exclusion', severity: FLAG_SEVERITY.HARD_BLOCK, matchedPhrase: term });
        }
    }
}

function checkRegexPatterns(rawText, flags) {
    // Explicit age brackets: "age 21-25", "age limit: 30", "below 25 years", "under 30"
    if (/\bage\s*(limit)?\s*[:\-]?\s*\d{2}\b/i.test(rawText) || /\b(below|under|above|over|max(imum)?|min(imum)?)\s+\d{2}\s*(years|yrs)?\s*(of age|old)?\b/i.test(rawText) && /\b(age|years old|yrs old|of age)\b/i.test(rawText)) {
        flags.push({ category: 'Explicit age brackets', severity: FLAG_SEVERITY.HARD_BLOCK, matchedPhrase: 'Age bracket pattern detected' });
    }
    // ALL-CAPS ratio
    const letters = rawText.replace(/[^a-zA-Z]/g, '');
    const caps = rawText.replace(/[^A-Z]/g, '');
    if (letters.length > 50 && caps.length / letters.length > 0.4) {
        flags.push({ category: 'ALL-CAPS/Spam', severity: FLAG_SEVERITY.SOFT_FLAG, matchedPhrase: 'Excessive capital letters' });
    }
    // Personal phone number pasted in (unofficial contact)
    if (/(\+91[\s-]?)?[6-9]\d{9}\b/.test(rawText.replace(/\s/g, ' '))) {
        flags.push({ category: 'Unofficial contact', severity: FLAG_SEVERITY.SOFT_FLAG, matchedPhrase: 'Personal phone number in posting' });
    }
}

function checkPronounRatio(rawText, flags) {
    const words = rawText.toLowerCase().split(/[\s,.-]+/);
    const male = words.filter(w => ['he', 'him', 'his'].includes(w)).length;
    const female = words.filter(w => ['she', 'her', 'hers'].includes(w)).length;
    const neutral = words.filter(w => ['they', 'them', 'their', 'he/she'].includes(w)).length;
    if (male > 3 && female === 0 && neutral === 0) flags.push({ category: 'Gendered pronouns (Male)', severity: FLAG_SEVERITY.SOFT_FLAG, matchedPhrase: 'Exclusive use of male pronouns' });
    if (female > 3 && male === 0 && neutral === 0) flags.push({ category: 'Gendered pronouns (Female)', severity: FLAG_SEVERITY.SOFT_FLAG, matchedPhrase: 'Exclusive use of female pronouns' });
}

/**
 * runModeration(title, description, ...extraTexts)
 * Extra texts (benefits & perks, etc.) are scanned too.
 * Returns { isFlagged, hasHardBlock, flags[] } — flags are de-duplicated by
 * (category, matchedPhrase).
 */
const runModeration = (title, description, ...extraTexts) => {
    const rawText = [title, description, ...extraTexts].filter(Boolean).join(' \n ');
    const text = normalize(rawText);
    const flags = [];

    checkPhraseLists(text, flags);
    checkProfanity(text, flags);
    checkCommunityBias(text, flags);
    checkRegexPatterns(rawText, flags);
    checkPronounRatio(rawText, flags);

    // de-dupe
    const seen = new Set();
    const unique = flags.filter(f => {
        const k = `${f.category}|${f.matchedPhrase}`;
        if (seen.has(k)) return false;
        seen.add(k); return true;
    });

    return {
        isFlagged: unique.length > 0,
        hasHardBlock: unique.some(f => f.severity === FLAG_SEVERITY.HARD_BLOCK),
        flags: unique
    };
};

module.exports = {
    runModeration,
    FLAG_SEVERITY
};
