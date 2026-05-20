const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');

// Use a data directory relative to the engine file's location
// The engine will look for optional local JSON data files but gracefully falls back to MongoDB
const ENGINE_DATA_DIR = path.join(__dirname, '..', 'data', 'careerAgent');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Lazily get MongoDB models (avoids circular deps at startup)
function getCareerRolesModel() {
  return mongoose.models['CareerRoles'] || mongoose.model('CareerRoles', new mongoose.Schema({}, { strict: false }), 'careerroles');
}
function getCareerAgentModel() {
  return mongoose.models['CareerAgentData'] || mongoose.model('CareerAgentData', new mongoose.Schema({}, { strict: false }), 'careerdirections');
}
function getMarketIntelModel() {
  return mongoose.models['CareerAgentIntel'] || mongoose.model('CareerAgentIntel', new mongoose.Schema({}, { strict: false }), 'career_agent_data');
}

// Fetch role data from MongoDB careerroles by name
async function fetchRoleFromDB(roleName) {
  try {
    if (!roleName || mongoose.connection.readyState !== 1) return null;
    const Model = getCareerRolesModel();
    const escaped = roleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[-–—]');
    const doc = await Model.findOne({ role_name: new RegExp(`^${escaped}$`, 'i') }).lean();
    return doc || null;
  } catch (e) {
    console.warn('[engine] fetchRoleFromDB failed:', e.message);
    return null;
  }
}

// Fetch career direction doc from careerdirections by Direction ID
async function fetchDirectionFromDB(directionId) {
  try {
    if (!directionId || mongoose.connection.readyState !== 1) return null;
    const Model = getCareerAgentModel();
    return await Model.findOne({ 'Direction ID': directionId }).lean();
  } catch (e) {
    return null;
  }
}

// Fetch market intel doc from career_agent_data by Role Name
async function fetchIntelFromDB(roleName) {
  try {
    if (!roleName || mongoose.connection.readyState !== 1) return null;
    const Model = getMarketIntelModel();
    const escaped = roleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[-–—]');
    const doc = await Model.findOne({ 'Role Name': new RegExp(`^${escaped}$`, 'i') }).lean();
    return doc || null;
  } catch (e) {
    console.warn('[engine] fetchIntelFromDB failed:', e.message);
    return null;
  }
}

async function getMLEnrichment(studentData, roleName, roleData) {
  try {
    // Step 1: Use extracted skills from resume text if available, else join skills array
    const skillText = (studentData.skills || []).join(', ');

    let semanticSkills = studentData.skills || [];
    try {
      const parseRes = await axios.post(`${ML_URL}/parse-resume`, { text: skillText }, { timeout: 6000 });
      if (parseRes.data?.extracted_skills?.length > 0) {
        semanticSkills = parseRes.data.extracted_skills;
      }
    } catch (e) {
      console.warn('[ML /parse-resume] Unavailable:', e.message);
    }

    // Step 2: Build features for success prediction
    // features = [skill_match_count, degree_relevance_score (0-10), market_demand_score (0-10)]
    const requiredSkills = (roleData?.tech_skills || []).map(s => s.skill_name.toLowerCase());
    const skillMatchCount = semanticSkills.filter(ss =>
      requiredSkills.some(rs => rs.includes(ss.toLowerCase()) || ss.toLowerCase().includes(rs))
    ).length;
    const degreeScore = 5; // default middle score — can be refined later
    const demandScore = 7; // default — will be replaced when market_data.json exists

    let successProbability = null;
    try {
      const predRes = await axios.post(`${ML_URL}/predict-success`,
        { features: [skillMatchCount, degreeScore, demandScore] },
        { timeout: 6000 }
      );
      successProbability = predRes.data?.success_probability || null;
    } catch (e) {
      console.warn('[ML /predict-success] Unavailable:', e.message);
    }

    return { semanticSkills, successProbability };
  } catch (e) {
    console.warn('[ML ENRICHMENT] Failed gracefully:', e.message);
    return { semanticSkills: studentData.skills || [], successProbability: null };
  }
}


function transformMongoRole(rData) {
  if (!rData) return null;
  const transformed = {
    tech_skills: [],
    ai_tools: [],
    compiled: rData
  };

  // Support both 'domain_skills' and 'technical_skills'
  const incomingSkills = rData.domain_skills || rData.technical_skills;
  if (incomingSkills) {
    transformed.tech_skills = incomingSkills.map(ts => ({
      skill_name: ts.skill_name || ts.name,
      priority: ts.importance || ts.priority || "High"
    }));
  }

  // Support 'ai_skills' or 'ai_tools'
  const incomingAI = rData.ai_skills || rData.ai_tools;
  if (incomingAI) {
    transformed.ai_tools = incomingAI.map(as => ({
      tool_name: as.skill_name || as.tool_name || as.name,
      priority: as.importance || as.priority || "Medium",
      used_for: as.used_for || "Task Acceleration"
    }));
  }
  return transformed;
}


let roleSkillsDB = {};
try {
  const skillsPath = path.join(ENGINE_DATA_DIR, 'role_skills_db.json');
  if (fs.existsSync(skillsPath)) {
    roleSkillsDB = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
  }

  const compiledPath = path.join(ENGINE_DATA_DIR, 'compiled_roles.json');
  if (fs.existsSync(compiledPath)) {
    const compiledRoles = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
    for (const [rName, rData] of Object.entries(compiledRoles)) {
      roleSkillsDB[rName] = transformMongoRole(rData);
    }
  }
} catch (err) {
  console.warn('[careerEngine] Could not load local role databases — will use MongoDB:', err.message);
}

let zoneMatrix = {};
try {
  const zmPath = path.join(ENGINE_DATA_DIR, 'zone_matrix.json');
  if (fs.existsSync(zmPath)) zoneMatrix = JSON.parse(fs.readFileSync(zmPath, 'utf8'));
} catch (err) { /* graceful — zone_matrix.json optional */ }

let marketData = {};
try {
  const mdPath = path.join(ENGINE_DATA_DIR, 'market_data.json');
  if (fs.existsSync(mdPath)) marketData = JSON.parse(fs.readFileSync(mdPath, 'utf8'));
} catch (err) { /* graceful — market_data.json optional */ }

function getZoneFromMatrix(degreeGroup, roleName) {
  if (!zoneMatrix || !zoneMatrix[degreeGroup]) return null;
  return zoneMatrix[degreeGroup][roleName] || null;
}

function getMarketFromData(roleName) {
  if (!marketData) return null;
  return marketData[roleName] || null;
}

// Helper: Count matching keywords
const countKeywordMatches = (text, keywords) => {
  if (!text || !keywords || !keywords.length) return 0;
  const lowerText = text.toLowerCase();
  return keywords.filter(kw => lowerText.includes(kw.toLowerCase())).length;
};

// ALGORITHM 1: Direction Scoring
// Scores how well a student's profile matches a Specific Role (0.0 to 1.0)
const calculateDirectionScore = (studentData, roleName, roleData) => {
  let score = 0;

  // 1. Degree Match (Weight: 35%)
  const eduArray = Array.isArray(studentData.education) ? studentData.education : (studentData.education ? [studentData.education] : []);
  const studentDegreesText = eduArray.map(e => {
    if (!e) return "";
    const group = (e.degreeGroup || "").toLowerCase();
    const specs = Array.isArray(e.specialisation) ? e.specialisation.join(" ") : (e.specialisation || "");
    return `${group} ${specs.toLowerCase()}`;
  }).join(" ");

  const roleKeywords = (roleName || "").split(' ');
  const degreeMatches = countKeywordMatches(studentDegreesText, roleKeywords);
  score += Math.min(degreeMatches * 0.15, 0.35); // Max 35%

  // 2. Skill Match (Weight: 45%) - Heaviest Weight
  const requiredTechSkills = (roleData.tech_skills || []).map(s => s.skill_name.toLowerCase());
  const studentSkills = Array.isArray(studentData.skills) ? studentData.skills : [];

  const skillMatches = studentSkills.filter(s => {
    const sName = (typeof s === 'string' ? s : s.name || "").toLowerCase();
    return requiredTechSkills.some(rs => rs.includes(sName) || sName.includes(rs));
  }).length;

  const skillMatchRatio = requiredTechSkills.length > 0 ? (skillMatches / requiredTechSkills.length) : 0;
  score += Math.min(skillMatchRatio * 0.45, 0.45);

  // 3. Experience Match (Weight: 20%)
  const expArray = Array.isArray(studentData.experience) ? studentData.experience : [];
  if (expArray.length > 0) {
    const expText = expArray.map(ex => `${(ex.designation || "").toLowerCase()} ${(ex.sector || "").toLowerCase()}`).join(" ");
    const expMatches = countKeywordMatches(expText, roleKeywords);
    score += Math.min(expMatches * 0.1, 0.20);
  }

  return score;
};

// ALGORITHM 2 & 3: Role Distance & Skill Priority Ranking
const calculateSkillGaps = (studentSkillsArr, roleData) => {
  const studentSkillsLower = studentSkillsArr.map(s => (typeof s === 'string' ? s : s.name || "").toLowerCase());

  const missingSkills = [];
  const mathingSkills = [];

  (roleData.tech_skills || []).forEach(skill => {
    const sName = skill.skill_name.toLowerCase();
    const isMatched = studentSkillsLower.some(ss => ss.includes(sName) || sName.includes(ss));
    if (isMatched) {
      mathingSkills.push(skill.skill_name);
    } else {
      missingSkills.push(skill);
    }
  });

  return { missingSkills, mathingSkills };
};

const determineZone = (score) => {
  if (score >= 0.6) return { zone: "Green", msg: "Strong alignment based on current skills and education." };
  if (score >= 0.3) return { zone: "Amber", msg: "Moderate alignment. You need to bridge specific skill gaps." };
  return { zone: "Red", msg: "This role usually requires a different background. Extra preparation required." };
};

const generateRoleTab = (roleName, studentData, mongoRoleData = null) => {
  // Use passed mongoRoleData if available, fallback to local roleSkillsDB
  const keys = Object.keys(roleSkillsDB);
  const matchedKey = keys.find(k => k.toLowerCase() === roleName.toLowerCase() && roleSkillsDB[k].compiled)
    || keys.find(k => k.toLowerCase() === roleName.toLowerCase());

  const roleData = mongoRoleData || (matchedKey ? roleSkillsDB[matchedKey] : {
    tech_skills: [{ skill_name: "Domain Knowledge", priority: "High" }],
    ai_tools: [{ tool_name: "ChatGPT", priority: "Medium", used_for: "General Assistance" }]
  });

  const score = calculateDirectionScore(studentData, roleName, roleData);
  const { zone, msg } = determineZone(score);

  const { missingSkills, mathingSkills } = calculateSkillGaps(studentData.skills, roleData);

  // Format Must Have / Nice to have
  const mustHave = roleData.tech_skills
    .filter(s => s.priority === "High" || s.priority === "Critical")
    .map(s => ({ skill: s.skill_name, priority: s.priority, description: "Essential core skill." }));

  const niceToHave = roleData.tech_skills
    .filter(s => s.priority === "Medium" || s.priority === "Low")
    .map(s => s.skill_name);

  const aiTools = roleData.ai_tools.map(t => ({
    name: t.tool_name,
    category: "AI-Powered",
    usage: t.used_for,
    adoption_level: "Growing"
  }));

  const compiled = roleData.compiled || {};

  // ─── Build richer data from audited compiled fields ──────────────────────
  // Salary range: prefer salary_progression, fallback to low/high
  let salaryDisplay = "3-8 LPA";
  if (compiled.salary_progression) {
    const sp = compiled.salary_progression;
    salaryDisplay = sp.year_0_1 || salaryDisplay;
  } else if (compiled.salary_range_low) {
    salaryDisplay = `₹${(compiled.salary_range_low / 100000).toFixed(1)}L - ₹${(compiled.salary_range_high / 100000).toFixed(1)}L`;
  }

  // Typical employers: build from job_family if available
  const jobFamily = compiled.job_family || compiled.job_family_name || "";
  let typicalEmployers = "MNCs, Startups, Consultancies";
  if (jobFamily.toLowerCase().includes("finance") || jobFamily.toLowerCase().includes("bank")) {
    typicalEmployers = "Banks, NBFCs, Audit Firms, Fintech Companies";
  } else if (jobFamily.toLowerCase().includes("technology") || jobFamily.toLowerCase().includes("software")) {
    typicalEmployers = "MNCs, IT Product Companies, Startups, IT Services";
  } else if (jobFamily.toLowerCase().includes("healthcare")) {
    typicalEmployers = "Hospitals, Pharma Companies, Diagnostics Chains";
  } else if (jobFamily.toLowerCase().includes("hr") || jobFamily.toLowerCase().includes("people")) {
    typicalEmployers = "Corporates, Consulting Firms, BPOs, MNCs";
  } else if (jobFamily.toLowerCase().includes("sales") || jobFamily.toLowerCase().includes("marketing")) {
    typicalEmployers = "FMCG, D2C Brands, Agencies, E-Commerce Companies";
  } else if (jobFamily.toLowerCase().includes("engineering") || jobFamily.toLowerCase().includes("manufacturing")) {
    typicalEmployers = "Manufacturing Plants, PSUs, EPC Companies, Auto OEMs";
  }

  // Common entry paths: based on programme levels
  const progLevels = compiled.programme_levels || "";
  let entryPaths = "Campus Placements, Internships";
  if (progLevels.includes("MBA")) {
    entryPaths = "Campus Placements, MBA Internships, Lateral Hiring";
  } else if (progLevels.includes("PG")) {
    entryPaths = "Campus Placements, Postgraduate Internships";
  }

  // AI exposure label
  const aiPct = compiled.ai_exposure_pct || 40;
  let aiDemandLabel = "Moderate Growth";
  if (aiPct >= 70) aiDemandLabel = "High AI-Disruption Zone";
  else if (aiPct >= 50) aiDemandLabel = "Actively AI-Evolving";
  else aiDemandLabel = "Stable with AI Augmentation";

  return {
    zone: zone,
    zone_message: msg,
    preparation_time: zone === "Green" ? "1-2 months" : zone === "Amber" ? "3-5 months" : "6+ months",
    match_explanation: `Your alignment score is ${(score * 100).toFixed(0)}%. You have ${mathingSkills.length} matching skills.`,
    tab1: {
      role_name: compiled.role_name || roleName,
      job_family: jobFamily,
      role_description: compiled.narrative_para1 || `Responsible for core operations within the ${roleName} domain.`,
      narrative_para1: compiled.narrative_para1 || `Responsible for core operations within the ${roleName} domain.`,
      narrative_para2: compiled.narrative_para2 || `AI systems are augmenting ${roleName} roles significantly.`,
      narrative_para3: compiled.narrative_para3 || `${roleName} professionals are entering a high-growth phase. Those with AI tool proficiency and cross-functional skills will thrive. Eligible programme levels: ${progLevels || "UG, PG"}.`,
      typical_employers_india: typicalEmployers,
      common_entry_paths: entryPaths,
      job_demand: aiDemandLabel,
      salary_range: salaryDisplay,
      salary_progression: compiled.salary_progression || null,
      english_requirement: compiled.english_requirement || "Important",
      remote_friendly: compiled.remote_friendly || "Office-Based",
      emerging_role_flag: compiled.emerging_role_flag || false,
      programme_levels: progLevels,
      ai_exposure_pct: aiPct,
      ai_impact: compiled.narrative_para2 || `AI tools are reshaping ${roleName} roles. ${aiPct}% of routine tasks are now AI-assisted.`,
      emerging_roles: [{ name: `AI-Enhanced ${roleName}`, description: `Uses ${aiPct >= 55 ? 'GitHub Copilot, ChatGPT' : 'AI productivity tools'} daily.` }]
    },
    tab2: { must_have: mustHave, nice_to_have: niceToHave },
    tab3: {
      ai_tools: aiTools.length ? aiTools : [{ name: "ChatGPT", category: "AI-Powered", usage: "General Assistance", adoption_level: "High" }],
      ai_exposure: {
        percentage: aiPct + "%",
        level: compiled.ai_exposure_level || (aiPct >= 60 ? "High" : aiPct >= 40 ? "Medium" : "Low"),
        tasks_assisted: compiled.ai_exposure_detail || "Repetitive and structured tasks",
        human_value: compiled.human_value_tasks || "Strategic judgment, stakeholder communication, creative problem-solving"
      },
      human_skills: compiled.foundational_skills
        ? compiled.foundational_skills.map(f => f.skill_name)
        : ["Analytical Thinking", "Communication", "Problem Solving", "Continuous Learning"]
    },
    tab4: {
      skill_gap: {
        current_skills: studentData.skills.length ? (studentData.skills.map(s => s.name || s)) : ["Basic Academics", "Communication"],
        missing_skills: missingSkills.map(m => m.skill_name)
      },
      learning_roadmap: [
        { step: "Step 1 - Foundation Skills", description: `Master the prerequisites for ${roleName}.` },
        { step: "Step 2 - Core Technical Skills", description: `Learn ${missingSkills[0]?.skill_name || 'essential technologies'} for this role.` },
        { step: "Step 3 - Advanced Applications", description: `Deep dive into ${missingSkills[1]?.skill_name || 'advanced specialisations'}.` },
        { step: "Step 4 - Projects & Portfolio", description: `Build a ${roleName} portfolio.` }
      ],
      certifications: [
        { name: `Industry Certified ${roleName}`, issuer: "Accredited Provider", difficulty: "Intermediate", duration: "3-4 months" }
      ],
      projects: [
        { project_name: `${roleName} Capstone`, description: `Complete ${roleName} end-to-end project.`, skills_demonstrated: missingSkills.slice(0, 3).map(s => s.skill_name).join(', ') }
      ]
    },
    tab5: {
      future_scope: compiled.narrative_para3 || `${roleName} is evolving with AI integration across ${jobFamily || "the industry"}.`,
      target_audience: `${progLevels || "UG/PG"} graduates with interest in ${jobFamily || roleName}.`,
      growth_trajectory: compiled.salary_progression
        ? `Entry: ${compiled.salary_progression.year_0_1 || "3-6 LPA"} → Mid: ${compiled.salary_progression.year_2_3 || "7-12 LPA"} → Senior: ${compiled.salary_progression.year_4_5 || "12-20 LPA"} → Lead: ${compiled.salary_progression.year_6_plus || "20+ LPA"}`
        : "Steady upward growth trajectory with specialisation."
    },
    raw: compiled
  };
};

/**
 * processCareerIntelligence: Now MongoDB-first.
 * 1. Looks up direction from career_agent_data using careerDirectionId
 * 2. Gets role list from that direction record
 * 3. Fetches role details from careerroles collection
 * 4. Falls back to static JSON if no DB match
 */
const processCareerIntelligence = async (studentData) => {
  const { preferences } = studentData;

  // ── Normalize skills: accept [{name,status,cert}] or plain strings ──
  const rawSkills = studentData.skills || [];
  const skills = rawSkills.map(s => (typeof s === 'string' ? s : s.name || '')).filter(Boolean);
  // Mutate studentData.skills so all downstream helpers see normalized skills
  studentData = { ...studentData, skills };

  // ── Resolve Primary ──
  const pDirId = preferences.primary?.careerDirectionId || '';
  const pDirName = preferences.primary?.careerDirectionName || 'Target Direction';
  const pRole = preferences.primary?.role || pDirName;

  const sDirId = preferences.secondary?.careerDirectionId || '';
  const sDirName = preferences.secondary?.careerDirectionName || 'Secondary Direction';
  const sRole = preferences.secondary?.role || sDirName;

  const tDirId = preferences.tertiary?.careerDirectionId || '';
  const tDirName = preferences.tertiary?.careerDirectionName || 'Tertiary Direction';
  const tRole = preferences.tertiary?.role || tDirName;

  // ── Fetch direction docs and first role data from MongoDB ──
  async function resolveRoleData(dirId, dirName, specificRole) {
    // Step 1: get direction record
    let dirDoc = dirId ? await fetchDirectionFromDB(dirId) : null;
    // Step 2: identify target role name (priority: specificRole > Job Role 1 > dirName)
    const targetRoleName = specificRole || dirDoc?.['Job Role 1'] || dirDoc?.['Role 1'] || dirName;
    
    // Step 3: fetch role from careerroles
    let baseRoleDoc = await fetchRoleFromDB(targetRoleName);
    if (!baseRoleDoc && targetRoleName !== dirName) baseRoleDoc = await fetchRoleFromDB(dirName);
    
    // Step 4: fetch intel from career_agent_data
    let intelDoc = await fetchIntelFromDB(targetRoleName);
    if (!intelDoc && targetRoleName !== dirName) intelDoc = await fetchIntelFromDB(dirName);
    
    // Merge base data with intel data
    let mergedRoleDoc = null;
    if (baseRoleDoc || intelDoc) {
      mergedRoleDoc = { ...(baseRoleDoc || {}), ...(intelDoc || {}) };
    }
    
    return { dirDoc, roleDoc: mergedRoleDoc, resolvedRoleName: targetRoleName };
  }

  // ── Map a raw career_agent_data doc → clean direction structure ──
  function mapDirectionDoc(dirDoc) {
    if (!dirDoc) return null;
    const roles = [];
    for (let i = 1; i <= 10; i++) {
      const role = dirDoc[`Job Role ${i}`] || dirDoc[`Role ${i}`];
      const id = dirDoc[`Role ID ${i}`] || dirDoc[`ID ${i}`];
      if (role && role.trim()) roles.push({ role, id: id || '' });
    }
    let rawOverview = dirDoc['Overview / Description'] || '';
    let desc = dirDoc['Direction Description'] || '';
    let overview = dirDoc['Direction Overview'] || '';

    // If we only have the combined field, split it nicely so the UI doesn't duplicate text
    if (rawOverview && !desc && !overview) {
      const match = rawOverview.match(/^([^.]+?\.)\s+(.*)$/);
      if (match) {
        desc = match[1].trim();
        overview = match[2].trim();
      } else {
        desc = rawOverview;
        overview = rawOverview;
      }
    }

    return {
      directionId: dirDoc['Direction ID'] || '',
      directionName: dirDoc['Career Direction'] || dirDoc['Direction Name'] || '',
      directionDescription: desc,
      directionOverview: overview,
      type: dirDoc['Type'] || 'Primary',
      uniqueId: dirDoc['Spec ID'] || dirDoc['Unique ID'] || '',
      degreeLevel: dirDoc['Degree'] || dirDoc['Degree Level'] || '',
      domainField: dirDoc['Domain / Field'] || '',
      degreeFullName: dirDoc['Degree'] || dirDoc['Degree Full Name'] || '',
      specialisation: dirDoc['Specialisation'] || '',
      roles,
    };
  }

  const [pResolved, sResolved, tResolved] = await Promise.all([
    resolveRoleData(pDirId, pDirName, pRole),
    resolveRoleData(sDirId, sDirName, sRole),
    resolveRoleData(tDirId, tDirName, tRole)
  ]);

  // ── Build compiled data from MongoDB doc ──
  function buildCompiledFromDB(roleDoc) {
    if (!roleDoc) return null;
    return {
      role_name: roleDoc.role_name || roleDoc['Role Name'] || roleDoc['Job Role'],
      job_family: roleDoc.job_family || roleDoc['Job Family'],
      narrative_para1: roleDoc.narrative_para1 || roleDoc['Para 1: What This Role Actually Does'],
      narrative_para2: roleDoc.narrative_para2 || roleDoc['Para 2: How AI Is Changing This Role'],
      narrative_para3: roleDoc.narrative_para3 || roleDoc['Para 3: Who Should Consider This Role'],
      salary_progression: roleDoc.salary_progression,
      salary_range_low: roleDoc.salary_range_low || roleDoc['Salary Low (INR)'],
      salary_range_high: roleDoc.salary_range_high || roleDoc['Salary High (INR)'],
      ai_exposure_pct: roleDoc.ai_exposure_pct || roleDoc['AI Exposure '],
      ai_exposure_level: roleDoc.ai_exposure_level || roleDoc['AI Exposure Level'],
      ai_exposure_detail: roleDoc.ai_exposure_detail || roleDoc['AI Exposure Detail'],
      human_value_tasks: roleDoc.human_value_tasks || roleDoc['Human Value Tasks'],
      english_requirement: roleDoc.english_requirement || roleDoc['English Requirement'],
      remote_friendly: roleDoc.remote_friendly,
      emerging_role_flag: roleDoc.emerging_role_flag,
      programme_levels: roleDoc.programme_levels,
      foundational_skills: roleDoc.foundational_skills,
      ai_skills: roleDoc.ai_skills,
      domain_skills: roleDoc.domain_skills,
      technical_skills: roleDoc.technical_skills
    };
  }

  // ── Inject MongoDB data into roleSkillsDB so generateRoleTab can use it ──
  function injectDBRole(roleName, roleDoc) {
    if (!roleDoc) return;
    const skills = (roleDoc.technical_skills || roleDoc.domain_skills || []);
    const aiTools = (roleDoc.ai_skills || []).map(s => ({ tool_name: s.skill_name, priority: s.importance || 'Medium', used_for: 'Task Acceleration' }));
    if (!roleSkillsDB[roleName]) roleSkillsDB[roleName] = { tech_skills: [], ai_tools: [] };
    roleSkillsDB[roleName].compiled = buildCompiledFromDB(roleDoc);
    roleSkillsDB[roleName].tech_skills = skills.map(s => ({ skill_name: s.skill_name, priority: s.importance || 'High' }));
    roleSkillsDB[roleName].ai_tools = aiTools;
  }

  // Inject all three resolved roles
  injectDBRole(pResolved.resolvedRoleName, pResolved.roleDoc);
  injectDBRole(sResolved.resolvedRoleName, sResolved.roleDoc);
  injectDBRole(tResolved.resolvedRoleName, tResolved.roleDoc);

  // Also inject under the direction name (so lookup by directionName works)
  injectDBRole(pDirName, pResolved.roleDoc);
  injectDBRole(sDirName, sResolved.roleDoc);
  injectDBRole(tDirName, tResolved.roleDoc);

  const primaryTab = generateRoleTab(pResolved.resolvedRoleName, studentData);
  const secondaryTab = generateRoleTab(sResolved.resolvedRoleName, studentData);
  const tertiaryTab = generateRoleTab(tResolved.resolvedRoleName, studentData);

  // Log DB source
  console.log(`[engine] Primary: "${pDirName}" → DB role: "${pResolved.resolvedRoleName}" (${pResolved.roleDoc ? 'DB ✅' : 'fallback ⚠️'})`);

  let mlEnrichment = { semanticSkills: [], successProbability: null };
  try {
    const pRoleDataForML = roleSkillsDB[pResolved.resolvedRoleName] || { tech_skills: [] };
    mlEnrichment = await getMLEnrichment(studentData, pResolved.resolvedRoleName, pRoleDataForML);
  } catch (e) { }

  // Calculate missing skills across the primary role for the roadmap
  const pRoleData = roleSkillsDB[pResolved.resolvedRoleName] || { tech_skills: [] };
  const { missingSkills, mathingSkills } = calculateSkillGaps(skills, pRoleData);

  const degreeGroup = studentData.education?.[0]?.degreeGroup || studentData.education?.degreeGroup || '';

  const zoneFromMatrix = getZoneFromMatrix(degreeGroup, pResolved.resolvedRoleName);
  const marketFromData = getMarketFromData(pResolved.resolvedRoleName);

  const preVerified = {
    dataFilesReady: Object.keys(zoneMatrix).length > 0,
    primaryZone: zoneFromMatrix || { employer_zone: primaryTab.zone, skill_coverage_pct: 0 },
    secondaryZone: getZoneFromMatrix(degreeGroup, sResolved.resolvedRoleName) || { employer_zone: secondaryTab.zone },
    tertiaryZone: getZoneFromMatrix(degreeGroup, tResolved.resolvedRoleName) || { employer_zone: tertiaryTab.zone },
    primaryMarket: marketFromData || null,
    primarySkillGap: {
      missing: missingSkills.map(m => m.skill_name),
      matched: mathingSkills,
      coveragePct: (missingSkills.length + mathingSkills.length) > 0
        ? Math.round((mathingSkills.length / (missingSkills.length + mathingSkills.length)) * 100)
        : 0,
      dataReady: true,
      source: 'local'
    }
  };

  // Calculate skill coverage % for fallback zone
  const preVerified_skillCoverage = preVerified.primarySkillGap.coveragePct;
  // Fix: update fallback primaryZone with real coverage now that we have it
  if (!zoneFromMatrix) {
    preVerified.primaryZone.skill_coverage_pct = preVerified_skillCoverage;
  }

  const probStr = mlEnrichment.successProbability ? Math.round(mlEnrichment.successProbability * 100) + '%' : 'Calculating';

  // ── Map direction docs for each path ──
  const primaryDirection = mapDirectionDoc(pResolved.dirDoc);
  const secondaryDirection = mapDirectionDoc(sResolved.dirDoc);
  const tertiaryDirection = mapDirectionDoc(tResolved.dirDoc);

  // Attach direction data onto each role tab for easy access in the frontend
  if (primaryDirection) primaryTab.direction = primaryDirection;
  if (secondaryDirection) secondaryTab.direction = secondaryDirection;
  if (tertiaryDirection) tertiaryTab.direction = tertiaryDirection;

  return {
    status: mlEnrichment.semanticSkills.length > 0 ? 'success_ml_assisted' : 'success_deterministic',
    generated_at: new Date().toISOString(),
    preVerified,
    primary: primaryTab,
    secondary: secondaryTab,
    tertiary: tertiaryTab,
    ml_success_probability: mlEnrichment.successProbability,
    ml_semantic_skills: mlEnrichment.semanticSkills,
    combined_tab4: {
      combined_pathway_summary: `Your immediate focus must be learning the missing fundamentals for ${pResolved.resolvedRoleName} (${pDirName}). Role success probability: ${probStr}`,
      skill_gap: {
        current_skills: skills.length ? skills : ["Basic Academics", "Communication"],
        missing_skills: preVerified.primarySkillGap.missing
      },
      learning_roadmap: [
        { step: "Step 1 - Foundation Skills", description: "Master prerequisites and theoretical fundamentals." },
        { step: "Step 2 - Core Technical Skills", description: `Learn ${missingSkills[0]?.skill_name || 'core technologies'}.` },
        { step: "Step 3 - Advanced Applications", description: "Apply skills in complex scenarios." },
        { step: "Step 4 - Projects & Portfolio", description: "Deploy market-ready portfolios demonstrating these skills." }
      ],
      certifications: [
        { name: `Certified ${pResolved.resolvedRoleName} Professional`, issuer: "Industry Standard Provider", difficulty: "Intermediate", duration: "3 months" }
      ],
      courses: [
        { course_name: `${pResolved.resolvedRoleName} Crash Course`, platform: "YouTube / Coursera", link_status: "Free" }
      ],
      projects: [
        { project_name: `${pResolved.resolvedRoleName} Capstone`, description: "A complete end-to-end implementation.", skills_demonstrated: missingSkills.slice(0, 3).map(s => s.skill_name).join(', ') }
      ]
    }
  };
};

module.exports = { processCareerIntelligence, calculateDirectionScore, calculateSkillGaps, determineZone };
