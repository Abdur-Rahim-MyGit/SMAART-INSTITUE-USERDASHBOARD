/**
 * Career Agent Routes
 * Ported from Career-Agent/backend/index.js
 * All routes are prefixed with /api/career-agent
 * Auth is provided by the main dashboard's protect middleware (JWT).
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { processCareerIntelligence } = require('../engine/careerEngine');
const { enhanceWithAI } = require('../services/careerAIService');
const {
  CareerAnalysisModel,
  CareerAgentDataModel,
  CareerRoleModel,
  RoleProfileModel,
  RoleSkillModel,
  CareerDirectionModel
} = require('../models/careerAgentModels');
const Degree = require('../models/Degree');
// Auth middleware — optional auth (passes through without token, attaches user if token present)
const { optionalAuth } = require('../middleware/auth');

// Records directory for local caching of analyses
const RECORDS_DIR = path.join(__dirname, '..', 'records', 'careerAgent');
if (!fs.existsSync(RECORDS_DIR)) fs.mkdirSync(RECORDS_DIR, { recursive: true });

// ─── Profile hash helper ──────────────────────────────────────────────────────
function makeProfileHash(studentData) {
  const key = JSON.stringify({
    education: studentData.education,
    preferences: studentData.preferences,
    skills: (studentData.skills || []).map(s => s.name || s).sort()
  });
  return crypto.createHash('sha256').update(key).digest('hex');
}

function findCachedRecord(hash) {
  try {
    const files = fs.readdirSync(RECORDS_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(RECORDS_DIR, file), 'utf8'));
      if (data.profile_hash === hash) return data;
    }
  } catch (e) { }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE INTELLIGENCE ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/career-agent/career-role/:roleName
 * Dynamically fetches a role's career intelligence from MongoDB (careerroles collection).
 */
router.get('/career-role/:roleName', async (req, res) => {
  try {
    const { roleName } = req.params;
    const escapedRoleName = roleName
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/-/g, '[-–—]')
      .replace(/ /g, '\\s+');
    const role = await CareerRoleModel.findOne({
      role_name: { $regex: new RegExp(`^${escapedRoleName}$`, 'i') }
    }).lean();

    if (!role) {
      return res.status(404).json({ error: 'Role not found in Career Agent Database' });
    }
    res.json(role);
  } catch (error) {
    console.error('[career-agent] Error fetching role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/role-skills/:roleTitle
 * Fetches skills and certifications for a specific role from the roleSkills collection.
 */
router.get('/role-skills/:roleTitle', async (req, res) => {
  try {
    const { roleTitle } = req.params;
    const escapedRoleTitle = roleTitle
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/-/g, '[-–—]')
      .replace(/ /g, '\\s+');
    const skillsData = await RoleSkillModel.findOne({
      roleTitle: { $regex: new RegExp(`^${escapedRoleTitle}$`, 'i') }
    }).lean();

    if (!skillsData) {
      return res.status(404).json({ error: 'Role skills not found for this role' });
    }
    res.json(skillsData);
  } catch (error) {
    console.error('[career-agent] Error fetching role skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/role-skills/family/:jobFamily
 * Lists all available roles within a specific job family from the roleSkills collection.
 * NOTE: must be registered before /role-skills/:roleTitle to avoid "family" being captured as :roleTitle
 */
router.get('/role-skills/family/:jobFamily', async (req, res) => {
  try {
    const { jobFamily } = req.params;
    const keywords = jobFamily
      .replace(/[&*()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['and', 'analytics', 'engineering', 'development'].includes(w.toLowerCase()));

    const searchWord = keywords.length > 0 ? keywords[0] : jobFamily.split(' ')[0];
    const regex = new RegExp(searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const roles = await RoleSkillModel.find({ jobFamily: { $regex: regex } }, 'roleTitle').lean();
    const titles = [...new Set(roles.map(r => r.roleTitle))].sort();
    res.json(titles);
  } catch (error) {
    console.error('[career-agent] Error fetching roles in family:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/role-skills/roadmap/:jobFamily
 * Aggregates all skills within a job family, sorted by frequency.
 */
router.get('/role-skills/roadmap/:jobFamily', async (req, res) => {
  try {
    const { jobFamily } = req.params;
    const keywords = jobFamily
      .replace(/[&*()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['and', 'analytics', 'engineering', 'development'].includes(w.toLowerCase()));

    const searchWord = keywords.length > 0 ? keywords[0] : jobFamily.split(' ')[0];
    const regex = new RegExp(searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const allRoles = await RoleSkillModel.find({ jobFamily: { $regex: regex } }).lean();
    if (!allRoles.length) return res.json([]);

    const totalRoles = allRoles.length;
    const skillMap = {};
    allRoles.forEach(roleDoc => {
      if (!roleDoc.skills) return;
      roleDoc.skills.forEach(s => {
        const name = s.skillName;
        if (!skillMap[name]) {
          skillMap[name] = {
            skillName: name,
            occurrenceCount: 0,
            categories: new Set(),
            certifications: new Set(),
            platforms: new Set(),
            maxImportance: 'Low'
          };
        }
        const entry = skillMap[name];
        entry.occurrenceCount += 1;
        if (s.skillCategory) entry.categories.add(s.skillCategory);
        if (s.certificationName) entry.certifications.add(s.certificationName);
        if (s.platform) entry.platforms.add(s.platform);
        const imp = s.importance || 'Medium';
        if (imp === 'High') entry.maxImportance = 'High';
        else if (imp === 'Medium' && entry.maxImportance === 'Low') entry.maxImportance = 'Medium';
      });
    });

    const aggregated = Object.values(skillMap).map(s => ({
      ...s,
      categories: [...s.categories],
      certifications: [...s.certifications],
      platforms: [...s.platforms],
      overlapPercentage: Math.round((s.occurrenceCount / totalRoles) * 100)
    }));

    aggregated.sort((a, b) => b.overlapPercentage - a.overlapPercentage || b.occurrenceCount - a.occurrenceCount);
    res.json(aggregated);
  } catch (error) {
    console.error('[career-agent] Error generating aggregated roadmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/career-roles/names
 * Fetches a list of all role names for the onboarding selector.
 */
router.get('/career-roles/names', async (req, res) => {
  try {
    const roles = await CareerRoleModel.find({}, 'role_name').lean();
    const names = roles.map(r => r.role_name).sort();
    res.json(names);
  } catch (error) {
    console.error('[career-agent] Error fetching role names:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/career-agent/direction-roles/:directionName
 * Returns the job roles for a career direction from careerdirections collection.
 * Only returns what is actually in the DB — no fallbacks or invented data.
 */
router.get('/direction-roles/:directionName', async (req, res) => {
  try {
    const { directionName } = req.params;
    const db = require('mongoose').connection.db;

    const cleanName = directionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const doc = await db.collection('careerdirections').findOne({
      'Career Direction': { $regex: cleanName, $options: 'i' }
    });

    if (!doc) return res.json({ directionName, roles: [], found: false });

    // Extract only non-null roles as stored in DB
    const roles = [];
    for (let i = 1; i <= 10; i++) {
      const role = doc[`Job Role ${i}`];
      const id   = doc[`Role ID ${i}`];
      if (role && typeof role === 'string' && role.trim()) {
        roles.push({ role: role.trim(), id: id || '' });
      }
    }

    res.json({
      directionName: doc['Career Direction'],
      directionId:   doc['Direction ID'],
      overview:      doc['Overview / Description'] || '',
      roles,
      found: true
    });
  } catch (err) {
    console.error('[career-agent] Error in /direction-roles:', err.message);
    res.status(500).json({ error: 'Failed to fetch direction roles', details: err.message });
  }
});




/**
 * GET /api/career-agent/role-profile/:roleTitle
 * Unified endpoint — fetches detailed role data for a specific role.
 * Priority 1: roles-profile-data collection (has "What This Role Actually Does" etc.)
 * Priority 2: careerroles collection (has narrative_para1/2/3)
 * Returns a normalized object with unified field names.
 */
router.get('/role-profile/:roleTitle', async (req, res) => {
  try {
    const { roleTitle } = req.params;
    const escTitle = roleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleRegex = new RegExp(`^${escTitle}$`, 'i');

    // ── Priority 1: roles-profile-data collection ──────────────────────────────
    // Field names in this collection use special characters and newlines
    const db = require('mongoose').connection.db;
    const rawDoc = await db.collection('roles-profile-data').findOne({
      'Role Title': { $regex: titleRegex }
    });

    if (rawDoc) {
      // Helper: find a key by normalized prefix match
      const keys = Object.keys(rawDoc);
      const findKey = (search) => keys.find(k =>
        k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(search.toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
      const getVal = (search) => { const k = findKey(search); return k ? rawDoc[k] : ''; };

      // Extract salary fields (keys have literal \n)
      const salaryKey0 = keys.find(k => k.includes('Year 0'));
      const salaryKey2 = keys.find(k => k.includes('Year 2'));
      const salaryKey4 = keys.find(k => k.includes('Year 4'));
      const salaryKey6 = keys.find(k => k.includes('Year 6'));
      const englishKey = keys.find(k => k.includes('Requirement'));

      const pctStr = String(getVal('aiexposure') || '0').replace('%', '');
      const aiPct = parseFloat(pctStr) || 0;

      return res.json({
        source: 'roles-profile-data',
        roleTitle: rawDoc['Role Title'],
        jobFamily: rawDoc['Job Family'] || '',
        roleId: rawDoc['Role ID'] || '',
        aiExposurePct: aiPct,
        aiExposureLevel: rawDoc['AI Exposure Level'] || '',
        humanValueTasks: rawDoc['Human Value — What AI Cannot Do'] || '',
        salaryYear0_1: salaryKey0 ? rawDoc[salaryKey0] : '',
        salaryYear2_3: salaryKey2 ? rawDoc[salaryKey2] : '',
        salaryYear4_5: salaryKey4 ? rawDoc[salaryKey4] : '',
        salaryYear6plus: salaryKey6 ? rawDoc[salaryKey6] : '',
        englishRequirement: englishKey ? rawDoc[englishKey] : '',
        englishContext: rawDoc['English — Context'] || '',
        whatRoleDoes: rawDoc['What This Role Actually Does'] || '',
        howAiChanging: rawDoc['How AI Is Changing This Role'] || '',
        whoShouldConsider: rawDoc['Who Should Consider This Role'] || '',
        careerGrowthPath: rawDoc['Career Growth Path'] || rawDoc['Career Growth'] || ''
      });
    }

    // ── Priority 2: careerroles collection (narrative_para1/2/3) ──────────────
    const careerRoleDoc = await CareerRoleModel.findOne({
      $or: [
        { role_name: { $regex: titleRegex } },
        { 'Job Role': { $regex: titleRegex } }
      ]
    }).lean();

    if (careerRoleDoc) {
      const salaryLow = careerRoleDoc.salary_range_low
        ? `₹${Math.round(Number(careerRoleDoc.salary_range_low) / 100000)} L`
        : '';
      const salaryHigh = careerRoleDoc.salary_range_high
        ? `₹${Math.round(Number(careerRoleDoc.salary_range_high) / 100000)} L`
        : '';
      const salaryRange = salaryLow && salaryHigh ? `${salaryLow} – ${salaryHigh}` : salaryLow || salaryHigh || '';
      const salaryProg = careerRoleDoc.salary_progression || {};

      return res.json({
        source: 'careerroles',
        roleTitle: careerRoleDoc.role_name || careerRoleDoc['Job Role'],
        jobFamily: careerRoleDoc.job_family || careerRoleDoc['Job Family'] || '',
        roleId: careerRoleDoc['Role ID'] || '',
        aiExposurePct: parseFloat(String(careerRoleDoc.ai_exposure_pct || '0')) || 0,
        aiExposureLevel: careerRoleDoc.ai_exposure_level || '',
        humanValueTasks: careerRoleDoc.human_value_tasks || '',
        salaryYear0_1: salaryProg['year_0_1'] || salaryProg['Year 0–1'] || salaryRange,
        salaryYear2_3: salaryProg['year_2_3'] || salaryProg['Year 2–3'] || '',
        salaryYear4_5: salaryProg['year_4_5'] || salaryProg['Year 4–5'] || '',
        salaryYear6plus: salaryProg['year_6plus'] || salaryProg['Year 6+'] || '',
        englishRequirement: careerRoleDoc.english_requirement || '',
        englishContext: careerRoleDoc.english_explanation || careerRoleDoc.english_context || '',
        whatRoleDoes: careerRoleDoc.narrative_para1 || '',
        howAiChanging: careerRoleDoc.narrative_para2 || '',
        whoShouldConsider: careerRoleDoc.narrative_para3 || '',
        careerGrowthPath: careerRoleDoc.career_growth_path || careerRoleDoc.path_text || ''
      });
    }

    // ── Not found in either collection ────────────────────────────────────────
    return res.status(404).json({ error: `No role data found for "${roleTitle}"` });

  } catch (err) {
    console.error('[career-agent] Error in /role-profile/:roleTitle:', err.message);
    res.status(500).json({ error: 'Failed to fetch role profile', details: err.message });
  }
});

/**
 * GET /api/career-agent/role-profiles
 * Fetches all role profiles from the roles-profile-data collection.
 */
router.get('/role-profiles', async (req, res) => {
  try {
    const rawData = await RoleProfileModel.find({}).lean();
    const profiles = rawData.map(doc => {
      if (doc.roleId && doc.roleTitle) return doc;
      const keys = Object.keys(doc);
      const findK = (prefix) => keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(prefix.toLowerCase().replace(/[^a-z0-9]/g, '')));
      const getV = (prefix) => { const k = findK(prefix); return k ? doc[k] : ''; };
      const pctStr = getV('aiexposure%') || getV('Aiexposure');
      const aiPct = parseFloat(String(pctStr).replace('%', ''));
      return {
        _id: doc._id,
        jobFamily: getV('jobfamily'),
        roleId: getV('roleid'),
        roleTitle: getV('roletitle'),
        aiExposurePct: isNaN(aiPct) ? 0 : aiPct,
        aiExposureLevel: getV('aiexposurelevel'),
        humanValueTasks: getV('humanvalue'),
        salaryYear0_1: getV('salaryyear0'),
        salaryYear2_3: getV('salaryyear2'),
        salaryYear4_5: getV('salaryyear4'),
        salaryYear6plus: getV('salaryyear6'),
        englishRequirement: getV('englishreq'),
        englishContext: getV('englishcontext') || getV('english'),
        whatRoleDoes: getV('whatthisrole'),
        howAiChanging: getV('howaiis'),
        whoShouldConsider: getV('whoshould'),
        careerGrowthPath: getV('careergrowth')
      };
    }).filter(p => p.roleId);
    profiles.sort((a, b) => (a.jobFamily || '').localeCompare(b.jobFamily || ''));
    res.json(profiles);
  } catch (err) {
    console.error('[career-agent] Failed to fetch role profiles:', err.message);
    res.status(500).json({ error: 'Failed to fetch role profiles' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CAREER AGENT DIRECTION ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/career-agent/unique-id
 * Query: level, domain, degreeFullName, specialisation
 * Returns the Unique ID (e.g. UG-006-001) for a given degree combination.
 */
router.get('/unique-id', async (req, res) => {
  try {
    const { level, domain, degreeFullName, specialisation } = req.query;
    console.log(`[career-agent/unique-id] Request received for level: "${level}", domain: "${domain}", fullName: "${degreeFullName}", spec: "${specialisation}"`);
    
    if (!level || !domain || !degreeFullName) {
      return res.status(400).json({ error: 'level, domain, and degreeFullName are required' });
    }

    // Query the new Degree model
    const query = {
      level: level,
      domain: domain,
      fullName: degreeFullName
    };

    if (specialisation && specialisation.trim() !== '' && specialisation !== 'General') {
      query.specialization = specialisation;
    } else {
      // If specialisation is 'General' or empty, try finding 'General' or the first one available
      query.specialization = 'General';
    }

    let doc = await Degree.findOne(query);

    // Fallback: if no match with 'General', try without specialization filter to find ANY record for this degree
    if (!doc) {
      const fallbackQuery = { level, domain, fullName: degreeFullName };
      doc = await Degree.findOne(fallbackQuery);
    }

    if (!doc) {
      console.warn(`[career-agent/unique-id] No degree found for:`, { level, domain, degreeFullName, specialisation });
      return res.json({ uniqueId: null, found: false });
    }

    res.json({ uniqueId: doc.uniqueId, found: true });
  } catch (err) {
    console.error('[career-agent/unique-id] Error:', err.message);
    res.status(500).json({ error: 'Failed to lookup career directions', details: err.message });
  }
});

/**
 * GET /api/career-agent/directions/:uniqueId
 * Returns all Career Directions for a given Unique ID.
 */
router.get('/directions/:uniqueId', async (req, res) => {
  try {
    const { uniqueId } = req.params;
    console.log(`[career-agent/directions] Request received for uniqueId: "${uniqueId}"`);
    
    if (!uniqueId) {
      return res.status(400).json({ error: 'uniqueId is required' });
    }

    const docs = await CareerAgentDataModel.find({ 'Spec ID': uniqueId }).lean();

    if (!docs || docs.length === 0) {
      return res.json({ uniqueId, directions: [], found: false });
    }

    const directions = docs.map(doc => ({
      directionId: doc['Direction ID'],
      directionName: doc['Career Direction'],
      directionDescription: doc['Overview / Description'],
      directionOverview: doc['Overview / Description'], // Mapping both for compatibility
      type: doc['Type'] || 'Primary', // Default to Primary if type not in Excel
      uniqueId: doc['Spec ID'],
      roles: [
        { role: doc['Job Role 1'], id: doc['Role ID 1'] },
        { role: doc['Job Role 2'], id: doc['Role ID 2'] },
        { role: doc['Job Role 3'], id: doc['Role ID 3'] },
        { role: doc['Job Role 4'], id: doc['Role ID 4'] },
        { role: doc['Job Role 5'], id: doc['Role ID 5'] },
        { role: doc['Job Role 6'], id: doc['Role ID 6'] },
        { role: doc['Job Role 7'], id: doc['Role ID 7'] },
        { role: doc['Job Role 8'], id: doc['Role ID 8'] },
        { role: doc['Job Role 9'], id: doc['Role ID 9'] },
        { role: doc['Job Role 10'], id: doc['Role ID 10'] }
      ].filter(r => r.role && typeof r.role === 'string' && r.role.trim() !== '')
    }));

    const typeOrder = { 'Primary': 0, 'Secondary': 1, 'Alternative': 2, 'Alternate': 2 };
    directions.sort((a, b) => (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3));

    res.json({ uniqueId, directions, found: true, total: directions.length });
  } catch (err) {
    console.error('[career-agent/directions] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch career directions', details: err.message });
  }
});

/**
 * POST /api/career-agent/career-direction
 * Fetches the career direction mapping for a specific degree/specialisation and role.
 */
router.post('/career-direction', async (req, res) => {
  try {
    const { degree, specialisation, roleName } = req.body;
    const degreeDoc = await CareerDirectionModel.findOne({
      degree_name: { $regex: new RegExp(degree, 'i') }
    }).lean();

    if (!degreeDoc) {
      return res.status(404).json({ error: 'Degree mapping not found' });
    }

    const foundDirection = degreeDoc.directions.find(dir =>
      dir.roles.some(r => r.toLowerCase() === roleName.toLowerCase() || roleName.toLowerCase().includes(r.toLowerCase()))
    );

    if (!foundDirection) {
      return res.status(404).json({ error: 'No matching direction for this role' });
    }

    res.json({ degree_name: degreeDoc.degree_name, direction: foundDirection });
  } catch (error) {
    console.error('[career-agent] Error fetching career direction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/career-agent/onboarding
 * Main career intelligence processing endpoint.
 * Uses the same engine from Career-Agent/backend/engine.js.
 */
router.post('/onboarding', optionalAuth, async (req, res) => {
  try {
    const studentData = req.body;

    // Inject user identity from JWT if authenticated
    const loggedInUser = req.user || null;
    if (loggedInUser && !studentData.personalDetails?.email) {
      studentData.personalDetails = studentData.personalDetails || {};
      studentData.personalDetails.email = loggedInUser.email;
      studentData.personalDetails.name = studentData.personalDetails.name || loggedInUser.name;
    }

    // Normalize skills upfront (objects vs strings)
    if (Array.isArray(studentData.skills)) {
      studentData.skills = studentData.skills.map(s => (typeof s === 'string' ? s : s.name || '')).filter(Boolean);
    } else {
      studentData.skills = [];
    }

    const profileHash = makeProfileHash(studentData);

    // Cache check — return cached result if profile hasn't changed
    const cached = findCachedRecord(profileHash);
    if (cached) {
      const cachedAnalysis = cached.output_generated_report || cached.analysis || cached;
      return res.json({ success: true, cached: true, analysis: cachedAnalysis, id: cached.id || profileHash });
    }

    const traceId = Date.now();
    const recordFilename = `analysis_${traceId}_${(studentData.personalDetails?.name || 'unknown').replace(/\s+/g, '_')}.json`;
    const recordPath = path.join(RECORDS_DIR, recordFilename);

    // Save initial draft
    const initialRecord = {
      id: String(traceId),
      timestamp: new Date().toISOString(),
      status: 'pending_analysis',
      profile_hash: profileHash,
      input_user_data: studentData,
      output_generated_report: null
    };
    try {
      fs.writeFileSync(recordPath, JSON.stringify(initialRecord, null, 2));
    } catch (fsErr) {
      console.error('[career-agent] Failed to save draft:', fsErr.message);
    }

    // Run the engine
    let analysis;
    try {
      analysis = await processCareerIntelligence(studentData);
      analysis = await enhanceWithAI(studentData, analysis);

      const finalRecord = { ...initialRecord, status: 'completed', output_generated_report: analysis };
      fs.writeFileSync(recordPath, JSON.stringify(finalRecord, null, 2));
    } catch (procErr) {
      console.error(`[career-agent] Engine failed:`, procErr.message);
      const errorRecord = { ...initialRecord, status: 'failed', error: procErr.message };
      try { fs.writeFileSync(recordPath, JSON.stringify(errorRecord, null, 2)); } catch (e) { }
      throw procErr;
    }

    // Save to MongoDB with userId for per-user retrieval
    const studentName = studentData.personalDetails?.name || 'Unknown';
    const studentEmail = studentData.personalDetails?.email || loggedInUser?.email || 'Unknown';
    const primaryRole = studentData.preferences?.primary?.role || 'Career Match';
    const preVerifiedData = analysis.preVerified || {};

    CareerAnalysisModel.create({
      userId: loggedInUser?._id || loggedInUser?.id || null,
      student_name: studentName,
      student_email: studentEmail,
      primary_role: primaryRole,
      input_data: studentData,
      output_data: analysis,
      profile_hash: profileHash,
      zone_primary: preVerifiedData?.primaryZone?.employer_zone || 'Unknown',
      zone_secondary: preVerifiedData?.secondaryZone?.employer_zone || 'Unknown',
      zone_tertiary: preVerifiedData?.tertiaryZone?.employer_zone || 'Unknown',
      missing_skills: preVerifiedData?.primarySkillGap?.missing || [],
      matched_skills: preVerifiedData?.primarySkillGap?.matched || [],
      skill_coverage_pct: preVerifiedData?.primarySkillGap?.coveragePct || 0
    }).catch(err => console.warn('[career-agent] MongoDB save warning:', err.message));

    res.json({
      status: 'success',
      id: String(traceId),
      recommendations: {
        primary: primaryRole,
        secondary: studentData.preferences?.secondary?.role || 'Secondary Path',
        tertiary: studentData.preferences?.tertiary?.role || 'Alternative Option'
      },
      analysis
    });
  } catch (err) {
    console.error('[career-agent] Onboarding error:', err);
    res.status(500).json({ error: 'Career analysis failed', details: err.message });
  }
});

/**
 * GET /api/career-agent/my-analysis
 * Fetches the most recent career analysis for the logged-in user from MongoDB.
 * Requires authentication (JWT).
 */
router.get('/my-analysis', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to fetch your analysis.' });
    }
    const userId = req.user._id || req.user.id;
    const email  = req.user.email;

    // Try by userId first, fall back to email
    let record = await CareerAnalysisModel.findOne({ userId })
      .sort({ created_at: -1 })
      .lean();

    if (!record && email) {
      record = await CareerAnalysisModel.findOne({ student_email: email })
        .sort({ created_at: -1 })
        .lean();
    }

    if (!record) {
      return res.status(404).json({ found: false, message: 'No analysis found for this user.' });
    }

    return res.json({
      found: true,
      id: String(record._id),
      created_at: record.created_at,
      primary_role: record.primary_role,
      analysis: record.output_data,
      input_data: record.input_data
    });
  } catch (err) {
    console.error('[career-agent] my-analysis error:', err);
    res.status(500).json({ error: 'Failed to fetch analysis', details: err.message });
  }
});

/**
 * GET /api/career-agent/my-analysis/all
 * Returns all analyses for the logged-in user (for history/new analysis).
 */
router.get('/my-analysis/all', optionalAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    const userId = req.user._id || req.user.id;
    const email  = req.user.email;

    const records = await CareerAnalysisModel.find(
      userId ? { $or: [{ userId }, { student_email: email }] } : { student_email: email }
    ).sort({ created_at: -1 }).select('_id created_at primary_role').lean();

    res.json({ found: records.length > 0, count: records.length, analyses: records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

/**
 * POST /api/career-agent/student/profile
 * Pre-save personal details during onboarding step 1.
 */
router.post('/student/profile', async (req, res) => {
  try {
    const { personalDetails } = req.body;
    // Just acknowledge — the main user profile is managed by the main backend
    res.json({ success: true, message: 'Profile acknowledged' });
  } catch (err) {
    res.status(500).json({ error: 'Profile save failed' });
  }
});

/**
 * GET /api/career-agent/dashboard/:id
 * Retrieve a specific analysis record by trace ID.
 */
router.get('/dashboard/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const files = fs.readdirSync(RECORDS_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(RECORDS_DIR, file), 'utf8'));
      if (data.id === id || file.includes(id)) {
        return res.json({ success: true, source: 'local', data });
      }
    }

    // Fallback to MongoDB
    const mongoResult = await CareerAnalysisModel.findOne({ profile_hash: id }).lean();
    if (mongoResult) {
      return res.json({ success: true, source: 'mongodb', data: mongoResult });
    }

    return res.status(404).json({ success: false, message: 'Analysis not found' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/career-agent/feedback
 * Save user feedback on analysis quality.
 */
router.post('/feedback', async (req, res) => {
  try {
    const { analysisId, rating, comment } = req.body;
    if (!analysisId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'analysisId and rating (1-5) required' });
    }
    const feedbackFile = path.join(RECORDS_DIR, 'feedback.json');
    let feedbacks = [];
    if (fs.existsSync(feedbackFile)) {
      try { feedbacks = JSON.parse(fs.readFileSync(feedbackFile, 'utf8')); } catch (e) { }
    }
    feedbacks.push({ analysisId, rating, comment: comment || '', timestamp: new Date().toISOString() });
    fs.writeFileSync(feedbackFile, JSON.stringify(feedbacks, null, 2));
    res.json({ success: true, message: 'Feedback saved' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/career-agent/health
 */
router.get('/health', (req, res) => {
  res.json({ status: 'Career Agent routes active', timestamp: new Date().toISOString() });
});

module.exports = router;
