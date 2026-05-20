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
 * Auth is optional here to support the onboarding form before profile completion.
 */
router.post('/onboarding', async (req, res) => {
  try {
    const studentData = req.body;

    // If user is authenticated, inject their email from JWT
    if (req.user && !studentData.personalDetails?.email) {
      studentData.personalDetails = studentData.personalDetails || {};
      studentData.personalDetails.email = req.user.email;
      studentData.personalDetails.name = studentData.personalDetails.name || req.user.name;
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

    // Save to MongoDB (non-blocking)
    const studentName = studentData.personalDetails?.name || 'Unknown';
    const studentEmail = studentData.personalDetails?.email || req.user?.email || 'Unknown';
    const primaryRole = studentData.preferences?.primary?.role || 'Career Match';
    const preVerifiedData = analysis.preVerified || {};

    CareerAnalysisModel.create({
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
