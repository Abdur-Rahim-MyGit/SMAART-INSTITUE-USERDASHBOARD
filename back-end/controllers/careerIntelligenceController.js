const CareerIntelligence = require('../models/CareerIntelligence');
const openRouterService = require('../services/openRouterService');
const excelDataLoader = require('../services/excelDataLoader');

/**
 * Career Data Fetcher Controller — v2.0
 * ======================================
 * REAL Excel Data Integration + AI GPT Engine
 * Uses 4 SMAART Excel databases (3000+ data points)
 * Part of SMAART Toolkit
 */

// ─── Helper: Build structured context from REAL Excel data ───
const buildExcelContext = (input) => {
  const { areaOfInterest, interestedJobRole, jobSector } = input;

  // 1. Get role-specific data from Excel
  const roleData = excelDataLoader.getDataForRole(interestedJobRole);

  // 2. Get sector-specific data
  const sectorData = excelDataLoader.getDataForSector(areaOfInterest);

  // 3. Try to find matching job family
  const jobFamilyData = excelDataLoader.getDataForJobFamily(interestedJobRole);

  // 4. Get certifications
  const certData = excelDataLoader.getCertificationsForRole(interestedJobRole, areaOfInterest);

  return { roleData, sectorData, jobFamilyData, certData };
};

// ─── Helper: Build a COMPLETE report from Excel data only (no AI needed) ───
const buildExcelOnlyReport = (input, excelContext) => {
  const { roleData, sectorData, jobFamilyData, certData } = excelContext;

  // Human Intelligence Skills from Excel
  const excelHISkills = roleData.humanSkills;
  const uniqueHIQuotients = [...new Set(excelHISkills.map(h => h.hiQuotient))];
  const hiSkills = uniqueHIQuotients.map((quotient, idx) => {
    const matching = excelHISkills.filter(h => h.hiQuotient === quotient);
    return {
      name: quotient,
      code: matching[0]?.quotientCode || '',
      taskApplication: matching.map(m => m.taskApplication).filter(Boolean).join('; '),
      priority: idx < 5 ? 'Critical' : idx < 10 ? 'High' : 'Medium',
    };
  });

  // Career levels from sector data
  const careerLevels = {
    'Entry Level (0-2 yrs)': [],
    'Mid Level (3-7 yrs)': [],
    'Senior Level (7-15 yrs)': [],
    'Leadership (15+ yrs)': [],
  };
  sectorData.existingRoles.forEach(r => {
    if (careerLevels[r.careerLevel] && careerLevels[r.careerLevel].length < 5) {
      careerLevels[r.careerLevel].push(r.roleTitle);
    }
  });

  // Emerging jobs
  const emergingJobs = sectorData.emergingRoles.slice(0, 8).map(r => ({
    title: r.roleTitle,
    description: r.roleDescription || `Emerging role in ${input.areaOfInterest}`,
    growthPotential: 'Emerging',
    aiIntegration: r.roleDescription || 'AI-integrated role',
    source: 'SMAART Database',
  }));

  // Career path roadmap from career levels
  const roadmap = [
    { stage: 'Current', role: `${input.degree} Student / Fresh Graduate`, timeline: 'Now', skills: roleData.coreTechSkills.slice(0, 3).map(s => s.techSkill).join(', ') || 'Foundational skills', description: 'Building academic foundation and exploring career interests' },
    { stage: 'Entry Level', role: careerLevels['Entry Level (0-2 yrs)']?.[0] || input.interestedJobRole, timeline: '0-2 years', skills: roleData.coreTechSkills.slice(0, 4).map(s => s.techSkill).join(', ') || 'Core technical skills', description: `Starting career in ${input.areaOfInterest}` },
    { stage: 'Mid Level', role: careerLevels['Mid Level (3-7 yrs)']?.[0] || `Senior ${input.interestedJobRole}`, timeline: '3-5 years', skills: roleData.coreTechSkills.slice(2, 6).map(s => s.techSkill).join(', ') || 'Advanced technical skills', description: 'Growing expertise and taking on larger projects' },
    { stage: 'Senior Level', role: careerLevels['Senior Level (7-15 yrs)']?.[0] || `Lead ${input.interestedJobRole}`, timeline: '6-10 years', skills: 'Leadership, Architecture, Strategy', description: 'Leading teams and driving strategic initiatives' },
    { stage: 'Leadership', role: careerLevels['Leadership (15+ yrs)']?.[0] || `Director / VP`, timeline: '10+ years', skills: 'Executive leadership, Business strategy', description: 'Executive leadership and industry thought leadership' },
  ];

  return {
    technicalSkills: {
      coreSkills: roleData.coreTechSkills.slice(0, 8).map(s => s.techSkill),
      toolsAndTechnologies: roleData.aiTools.slice(0, 7).map(t => t.toolName),
      certifications: roleData.certifications.slice(0, 6).map(c => ({
        name: c.certName, provider: c.provider, cost: c.cost,
      })),
    },
    aiSkills: {
      skills: roleData.aiSkills.slice(0, 7).map(s => s.aiSkill),
      tools: roleData.aiTools.slice(0, 6).map(t => ({
        name: t.toolName, description: t.toolDescription, costType: t.costType,
      })),
      description: `AI skills are increasingly critical for ${input.interestedJobRole} professionals. Mastering AI tools like ${roleData.aiTools.slice(0, 3).map(t => t.toolName).join(', ')} will provide significant career advantages in ${input.areaOfInterest}.`,
    },
    humanIntelligenceSkills: hiSkills,
    suggestedJobs: {
      entryLevel: (careerLevels['Entry Level (0-2 yrs)'] || []).slice(0, 4).map(r => ({ title: r, description: `Entry-level opportunity in ${input.areaOfInterest}`, salaryRange: '3-6 LPA' })),
      midLevel: (careerLevels['Mid Level (3-7 yrs)'] || []).slice(0, 4).map(r => ({ title: r, description: `Mid-level role requiring 3-7 years experience`, salaryRange: '8-15 LPA' })),
      seniorLevel: (careerLevels['Senior Level (7-15 yrs)'] || []).slice(0, 4).map(r => ({ title: r, description: `Senior role with leadership responsibilities`, salaryRange: '15-30 LPA' })),
      lateralOpportunities: [],
    },
    emergingJobs: emergingJobs,
    careerPathRoadmap: roadmap,
    futureScope: {
      aiImpact: `The ${input.interestedJobRole} role is being significantly shaped by AI advancements. ${jobFamilyData.jobChanges[0]?.changeDescription || 'AI is transforming workflows and creating new opportunities.'}`,
      aiEnhancement: `AI tools like ${roleData.aiTools.slice(0, 3).map(t => t.toolName).join(', ')} are enhancing productivity and capabilities for professionals in this field.`,
      automationRisk: `Some routine tasks are being automated, but human judgment and creativity remain essential. Focus on ${roleData.humanSkills.slice(0, 3).map(h => h.hiQuotient).join(', ')} to stay relevant.`,
      stayRelevantTips: `Continuously upgrade AI literacy, build strong human intelligence quotients especially ${roleData.humanSkills.slice(0, 3).map(h => h.hiQuotient).join(', ')}, and pursue relevant certifications.`,
      automatedTasks: jobFamilyData.automatedTasks.slice(0, 8).map(a => a.automatedTask),
      humanTasksThatRemain: jobFamilyData.humanTasksRemain.slice(0, 8).map(h => h.humanTask),
      jobChangeSummary: jobFamilyData.jobChanges[0]?.changeDescription || '',
    },
    marketDemand: {
      demandLevel: roleData.roleMeta.demand || 'Growing',
      salaryRange: roleData.roleMeta.salary || '5-25 LPA (varies by experience)',
      salaryGrowthPrediction: 'Expected 10-15% annual growth in compensation for skilled professionals',
      geographicDemand: 'Bangalore, Hyderabad, Pune, Mumbai, Delhi NCR, Chennai — strong global demand',
      industryTrends: `${input.areaOfInterest} sector showing strong growth with increasing AI integration and digital transformation initiatives`,
    },
    resourceMap: {
      freeCourses: certData.freeCerts.slice(0, 6).map(c => `${c.certName} by ${c.company} (${c.duration}) — ${c.accessUrl || 'Available online'}`),
      paidCourses: certData.byJobTitle.filter(c => c.costTier === 'Paid' || c.costTier === 'Premium').slice(0, 6).map(c => `${c.certName} by ${c.company} (${c.level}) — ${c.accessUrl || 'Available online'}`),
      tools: roleData.aiTools.slice(0, 6).map(t => t.toolName),
      learningRoadmap: `Start with foundational skills (${roleData.coreTechSkills.slice(0, 2).map(s => s.techSkill).join(', ')}), then progress to AI tools (${roleData.aiTools.slice(0, 2).map(t => t.toolName).join(', ')}), and pursue certifications (${roleData.certifications.slice(0, 2).map(c => c.certName).join(', ')}).`,
      smaartModules: ['Communication Mastery', 'Strategic Thinking', 'AI Literacy', 'Data Analytics Fundamentals', 'Leadership Development'],
    },
    qualificationsNeeded: jobFamilyData.qualifications.slice(0, 6).map(q => ({
      qualification: q.qualification, relevance: q.notes || 'Relevant for career progression',
    })),
    skillGapPercentage: 45,
    careerMatchPercentage: roleData.exactMatch ? 82 : 65,
    aiConfidenceScore: roleData.exactMatch ? 90 : 75,
    dataSource: {
      excelRoleMatch: roleData.matchedRole,
      excelExactMatch: roleData.exactMatch,
      excelSectorMatch: sectorData.matchedSector,
      excelJobFamily: jobFamilyData.matchedFamily,
      aiToolsFromDB: roleData.aiTools.length,
      hiSkillsFromDB: excelHISkills.length,
      certificationsFromDB: certData.byJobTitle.length + certData.byDomain.length,
      emergingRolesFromDB: sectorData.emergingRoles.length,
      aiEnhanced: false,
    },
  };
};

// ─── Helper: Merge Excel report with AI output (AI is optional overlay) ───
const mergeExcelWithAI = (excelReport, aiOutput, excelContext, careerInput) => {
  if (!aiOutput) {
    // No AI available, use pure Excel report
    return excelReport;
  }

  // AI is available — overlay AI insights onto Excel base
  return {
    technicalSkills: aiOutput.technicalSkills || excelReport.technicalSkills,
    aiSkills: aiOutput.aiSkills || excelReport.aiSkills,
    humanIntelligenceSkills: excelReport.humanIntelligenceSkills.length >= 15
      ? excelReport.humanIntelligenceSkills  // Excel has rich HI data, prefer it
      : (aiOutput.humanIntelligenceSkills?.length >= 15 ? aiOutput.humanIntelligenceSkills : excelReport.humanIntelligenceSkills),
    suggestedJobs: aiOutput.suggestedJobs || excelReport.suggestedJobs,
    emergingJobs: aiOutput.emergingJobs?.length > 0 ? aiOutput.emergingJobs : excelReport.emergingJobs,
    careerPathRoadmap: aiOutput.careerPathRoadmap?.length > 0 ? aiOutput.careerPathRoadmap : excelReport.careerPathRoadmap,
    futureScope: {
      ...(aiOutput.futureScope || excelReport.futureScope),
      automatedTasks: aiOutput.futureScope?.automatedTasks || excelReport.futureScope.automatedTasks,
      humanTasksThatRemain: aiOutput.futureScope?.humanTasksThatRemain || excelReport.futureScope.humanTasksThatRemain,
      jobChangeSummary: excelReport.futureScope.jobChangeSummary,
    },
    marketDemand: aiOutput.marketDemand || excelReport.marketDemand,
    resourceMap: {
      freeCourses: aiOutput.resourceMap?.freeCourses || excelReport.resourceMap.freeCourses,
      paidCourses: aiOutput.resourceMap?.paidCourses?.length > 0 ? aiOutput.resourceMap.paidCourses : excelReport.resourceMap.paidCourses,
      tools: aiOutput.resourceMap?.tools || excelReport.resourceMap.tools,
      learningRoadmap: aiOutput.resourceMap?.learningRoadmap || excelReport.resourceMap.learningRoadmap,
      smaartModules: aiOutput.resourceMap?.smaartModules || excelReport.resourceMap.smaartModules,
    },
    qualificationsNeeded: aiOutput.qualificationsNeeded || excelReport.qualificationsNeeded,
    skillGapPercentage: aiOutput.skillGapPercentage ?? excelReport.skillGapPercentage,
    careerMatchPercentage: aiOutput.careerMatchPercentage ?? excelReport.careerMatchPercentage,
    aiConfidenceScore: aiOutput.aiConfidenceScore ?? excelReport.aiConfidenceScore,
    dataSource: {
      ...excelReport.dataSource,
      aiEnhanced: true,
    },
  };
};

// ─── Helper: Build the AI prompt with REAL Excel data ───
const buildCareerIntelligencePrompt = (input, excelContext) => {
  const { roleData, sectorData, jobFamilyData, certData } = excelContext;

  // Prepare Excel context strings
  const aiToolsList = roleData.aiTools.slice(0, 10).map(t => `${t.toolName} (${t.costType}) — ${t.toolDescription}`).join('\n  ');
  const aiSkillsList = roleData.aiSkills.slice(0, 10).map(s => s.aiSkill).join('\n  ');
  const techSkillsList = roleData.coreTechSkills.slice(0, 10).map(s => s.techSkill).join('\n  ');
  const certsList = roleData.certifications.slice(0, 8).map(c => `${c.certName} (${c.provider}) — ${c.cost}`).join('\n  ');
  const hiSkillsList = roleData.humanSkills.slice(0, 20).map(h => `${h.hiQuotient} [${h.quotientCode}] — ${h.taskApplication}`).join('\n  ');

  // Job family deep intelligence
  const deepTechSkills = jobFamilyData.technicalSkills.slice(0, 12).map(t => `[${t.priority}] ${t.technicalSkill} (${t.proficiencyLevel})`).join('\n  ');
  const deepHumanSkills = jobFamilyData.humanJudgementSkills.slice(0, 10).map(h => `${h.humanSkill} — ${h.taskApplications}`).join('\n  ');
  const aiToolsDeep = jobFamilyData.aiTools.slice(0, 8).map(a => `${a.aiTool} → ${a.useCase}`).join('\n  ');
  const automatedTasks = jobFamilyData.automatedTasks.slice(0, 8).map(a => a.automatedTask).join('\n  ');
  const jobChanges = jobFamilyData.jobChanges.map(j => j.changeDescription).join('\n  ');
  const humanTasksRemain = jobFamilyData.humanTasksRemain.slice(0, 8).map(h => h.humanTask).join('\n  ');
  const qualifications = jobFamilyData.qualifications.slice(0, 6).map(q => `${q.qualification} — ${q.notes}`).join('\n  ');

  // Existing career progression roles
  const existingByLevel = {};
  sectorData.existingRoles.forEach(r => {
    if (!existingByLevel[r.careerLevel]) existingByLevel[r.careerLevel] = [];
    if (existingByLevel[r.careerLevel].length < 6) existingByLevel[r.careerLevel].push(r.roleTitle);
  });
  const careerProgression = Object.entries(existingByLevel).map(([level, roles]) => `${level}: ${roles.join(', ')}`).join('\n  ');

  // Emerging roles
  const emergingRolesList = sectorData.emergingRoles.slice(0, 8).map(r => `${r.roleTitle} — ${r.roleDescription}`).join('\n  ');

  // Certifications (additional from directory)
  const freeCertsList = certData.freeCerts.slice(0, 6).map(c => `${c.certName} by ${c.company} (${c.duration}) — ${c.accessUrl}`).join('\n  ');
  const jobTitleCerts = certData.byJobTitle.slice(0, 6).map(c => `${c.certName} by ${c.company} (${c.level}, ${c.costTier}) — ${c.accessUrl}`).join('\n  ');

  // Role metadata
  const roleMeta = roleData.roleMeta;

  return `You are the SMAART Career Intelligence Engine — an enterprise-grade career advisor powered by verified career databases and AI intelligence.

A student has submitted their career profile. Using the VERIFIED STRUCTURED DATA below AND your knowledge, generate a comprehensive Career Intelligence Report.

═══════════════════════════════════════════════════════
STUDENT CAREER PROFILE
═══════════════════════════════════════════════════════
• Short-Term Goal (1-2 years): ${input.shortTermGoal}
• Long-Term Goal (5+ years): ${input.longTermGoal}
• Degree: ${input.degree}
• Specialization: ${input.specialization}
• College Type: ${input.collegeType || 'Not specified'}
• Year of Graduation: ${input.yearOfGraduation || 'Not specified'}
• Academic Performance: ${input.academicPerformance || 'Not specified'}
• Area of Interest: ${input.areaOfInterest}
• Interested Job Role: ${input.interestedJobRole}
• Job Sector: ${input.jobSector}
• Preferred Location: ${input.preferredLocation || 'Flexible'}
• Expected Salary: ${input.expectedSalaryRange || 'Not specified'}

═══════════════════════════════════════════════════════
VERIFIED DATA FROM SMAART CAREER DATABASE
═══════════════════════════════════════════════════════
Matched Role: ${roleData.matchedRole} (Exact Match: ${roleData.exactMatch})
Salary Range: ${roleMeta.salary || 'N/A'}
Market Demand: ${roleMeta.demand || 'N/A'}

── AI TOOLS FOR THIS ROLE (from database) ──
  ${aiToolsList || 'No specific tools found for this role'}

── AI SKILLS REQUIRED (from database) ──
  ${aiSkillsList || 'No specific AI skills found'}

── CORE TECHNICAL SKILLS (from database) ──
  ${techSkillsList || 'No specific tech skills found'}

── CERTIFICATIONS FOR THIS ROLE (from database) ──
  ${certsList || 'No specific certifications found'}

── HUMAN INTELLIGENCE SKILLS REQUIRED (from database) ──
  ${hiSkillsList || 'No specific HI skills found'}

═══════════════════════════════════════════════════════
DEEP INTELLIGENCE — JOB FAMILY: ${jobFamilyData.matchedFamily}
═══════════════════════════════════════════════════════

── QUALIFICATIONS REQUIRED ──
  ${qualifications || 'Not available'}

── TECHNICAL SKILLS (PRIORITIZED) ──
  ${deepTechSkills || 'Not available'}

── HUMAN JUDGEMENT SKILLS ──
  ${deepHumanSkills || 'Not available'}

── AI TOOLS USED IN THIS FIELD ──
  ${aiToolsDeep || 'Not available'}

── TASKS BEING AUTOMATED BY AI ──
  ${automatedTasks || 'Not available'}

── HOW THIS JOB CHANGES IN THE AI ERA ──
  ${jobChanges || 'Not available'}

── HUMAN TASKS THAT CANNOT BE AUTOMATED ──
  ${humanTasksRemain || 'Not available'}

═══════════════════════════════════════════════════════
CAREER LEVEL PROGRESSION (from database)
═══════════════════════════════════════════════════════
  ${careerProgression || 'Not available'}

═══════════════════════════════════════════════════════
EMERGING / FUTURE ROLES IN THIS SECTOR
═══════════════════════════════════════════════════════
  ${emergingRolesList || 'No emerging roles found'}

═══════════════════════════════════════════════════════
CERTIFICATION RECOMMENDATIONS
═══════════════════════════════════════════════════════
FREE Certifications:
  ${freeCertsList || 'None found'}

Role-Targeted Certifications:
  ${jobTitleCerts || 'None found'}

═══════════════════════════════════════════════════════
INSTRUCTIONS — GENERATE CAREER INTELLIGENCE REPORT
═══════════════════════════════════════════════════════

Using ALL the verified data above plus your intelligence, generate a complete report in this JSON structure. Use the ACTUAL data from our database — don't invent generic skills. Fill gaps with your knowledge.

{
  "technicalSkills": {
    "coreSkills": ["6-8 specific technical skills — USE the database skills above plus any additional ones needed"],
    "toolsAndTechnologies": ["5-7 tools/platforms — prioritize tools from our database above"],
    "certifications": [
      {"name": "Certification name from our database", "provider": "Provider", "cost": "Cost", "duration": "Duration", "level": "Level"}
    ]
  },
  "aiSkills": {
    "skills": ["5-7 AI skills — USE the exact skills from our AI_Skills_Required database above"],
    "tools": [
      {"name": "AI Tool from our database", "description": "Description", "costType": "FREE/PAID"}
    ],
    "description": "Paragraph explaining how AI integrates into this career and why these skills matter"
  },
  "humanIntelligenceSkills": [
    {"name": "HI Quotient Name from our database", "code": "Quotient Code", "taskApplication": "Specific task from database", "priority": "Critical/High/Medium"},
    ... (MUST include 15+ skills from our Human_Intelligence_Skills database above)
  ],
  "suggestedJobs": {
    "entryLevel": [{"title": "Real job title from our database", "description": "Brief description", "salaryRange": "Range"}],
    "midLevel": [{"title": "Real mid-level role", "description": "Brief", "salaryRange": "Range"}],
    "seniorLevel": [{"title": "Real senior role", "description": "Brief", "salaryRange": "Range"}],
    "lateralOpportunities": [{"title": "Lateral role", "description": "Brief"}]
  },
  "emergingJobs": [
    {"title": "Emerging role from our database", "description": "Description from database", "growthPotential": "% or qualitative", "aiIntegration": "How AI is integrated"},
    ... (USE the emerging roles from our database above)
  ],
  "careerPathRoadmap": [
    {"stage": "Current", "role": "Student/Fresher", "timeline": "Now", "skills": "Key skills to build now", "description": "Current status"},
    {"stage": "Entry Level", "role": "Specific role from database", "timeline": "0-2 years", "skills": "Skills needed", "description": "Description"},
    {"stage": "Mid Level", "role": "Specific role", "timeline": "3-5 years", "skills": "Skills needed", "description": "Description"},
    {"stage": "Senior Level", "role": "Specific role", "timeline": "6-10 years", "skills": "Skills needed", "description": "Description"},
    {"stage": "Leadership", "role": "Specific role", "timeline": "10+ years", "skills": "Skills needed", "description": "Description"}
  ],
  "futureScope": {
    "aiImpact": "USE the 'How This Job Changes in AI Era' data from our database above — 3-4 sentences",
    "aiEnhancement": "How AI enhances their work — reference actual AI tools from our database",
    "automationRisk": "USE the 'Tasks Being Automated' data — what's safe per our 'Human Tasks That Remain' data",
    "stayRelevantTips": "Actionable advice based on the human judgement skills from our database",
    "automatedTasks": ["List 5-8 tasks from our AI_Automated_Tasks database"],
    "humanTasksThatRemain": ["List 5-8 tasks from our Human_Tasks_That_Remain database"]
  },
  "marketDemand": {
    "demandLevel": "USE the demand level from our database: ${roleMeta.demand || 'N/A'}",
    "salaryRange": "${roleMeta.salary || 'N/A'}",
    "salaryGrowthPrediction": "Predicted salary growth over 5 years",
    "geographicDemand": "Top Indian cities + global demand centers",
    "industryTrends": "Key trends affecting this career in India"
  },
  "resourceMap": {
    "freeCourses": ["List FREE certifications from our database above with access URLs"],
    "paidCourses": ["List PAID certifications from our database"],
    "tools": ["Tools they should learn — from our AI_Tools database"],
    "learningRoadmap": "Step-by-step learning roadmap (3-4 sentences)",
    "smaartModules": ["Communication Mastery", "Strategic Thinking", "AI Literacy", "Data Analytics", "Leadership Development"]
  },
  "qualificationsNeeded": [
    {"qualification": "From our Qualifications database", "relevance": "Why it matters"}
  ],
  "skillGapPercentage": 45,
  "careerMatchPercentage": 72,
  "aiConfidenceScore": 85
}

CRITICAL RULES:
- Return ONLY valid JSON — no markdown, no extra text
- USE the REAL data from our SMAART database wherever available — this is verified data
- humanIntelligenceSkills MUST have at least 15 entries using our HI Quotient data
- All percentages: realistic 0-100
- Be SPECIFIC to their exact role, industry, and goals
- Reference their education and background in recommendations
- For emerging jobs, use ACTUAL emerging roles from our database
- For career path, use ACTUAL role titles from our career levels database`;
};

// ═══════════════════════════════════════════════════════
// CONTROLLER METHODS
// ═══════════════════════════════════════════════════════

/**
 * POST /api/career-intelligence/generate
 * Generate career intelligence report using Excel + AI
 */
const generateCareerReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const careerInput = req.body;

    // Validate required fields
    const required = ['shortTermGoal', 'longTermGoal', 'degree', 'specialization', 'areaOfInterest', 'interestedJobRole', 'jobSector'];
    const missing = required.filter(field => !careerInput[field]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Check for existing processing report
    const existingProcessing = await CareerIntelligence.findOne({ userId, status: 'processing' });
    if (existingProcessing) {
      // Clear stale processing records (older than 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (existingProcessing.createdAt < fiveMinutesAgo) {
        existingProcessing.status = 'failed';
        existingProcessing.errorMessage = 'Timed out';
        await existingProcessing.save();
      } else {
        return res.status(409).json({ error: 'A report is already being generated. Please wait.' });
      }
    }

    // Version tracking
    const existingCount = await CareerIntelligence.countDocuments({ userId });

    // Create initial record
    const careerRecord = new CareerIntelligence({
      userId,
      careerInput,
      status: 'processing',
      version: existingCount + 1,
    });
    await careerRecord.save();

    console.log(`🧠 Generating Career Intelligence Report for user ${userId}...`);

    // ── STEP 1: Load REAL Excel data ──
    let excelContext;
    try {
      excelContext = buildExcelContext(careerInput);
      console.log(`  📊 Excel Match: Role="${excelContext.roleData.matchedRole}" (exact: ${excelContext.roleData.exactMatch})`);
      console.log(`  📊 Sector Match: "${excelContext.sectorData.matchedSector}"`);
      console.log(`  📊 Job Family: "${excelContext.jobFamilyData.matchedFamily}"`);
      console.log(`  📊 AI Tools Found: ${excelContext.roleData.aiTools.length}`);
      console.log(`  📊 HI Skills Found: ${excelContext.roleData.humanSkills.length}`);
      console.log(`  📊 Certifications Found: ${excelContext.certData.byJobTitle.length + excelContext.certData.byDomain.length}`);
    } catch (excelError) {
      console.error('⚠️ Excel loading error:', excelError.message);
      careerRecord.status = 'failed';
      careerRecord.errorMessage = 'Failed to load career database: ' + excelError.message;
      await careerRecord.save();
      return res.status(500).json({ error: 'Career database unavailable. Please try again.' });
    }

    // ── STEP 2: Build Excel-based report FIRST (always works) ──
    const excelReport = buildExcelOnlyReport(careerInput, excelContext);
    console.log(`  📋 Excel-only report built successfully`);

    // ── STEP 3: Try AI enhancement (optional — fails gracefully) ──
    let aiOutput = null;
    try {
      const prompt = buildCareerIntelligencePrompt(careerInput, excelContext);
      const axios = require('axios');
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

      // Try multiple models in priority order
      const modelsToTry = [
        'meta-llama/llama-3.2-3b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
        'meta-llama/llama-3.1-8b-instruct:free',
        'google/gemma-2-9b-it:free',
        'qwen/qwen-2.5-7b-instruct:free',
      ];

      const systemPrompt = 'You are the SMAART Career Intelligence Engine. Respond with ONLY valid JSON — no markdown, no code blocks, no extra text. Generate career intelligence using the verified data provided.';

      for (const model of modelsToTry) {
        try {
          console.log(`  🤖 Trying AI model: ${model}...`);
          const apiResult = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 8000,
          }, {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://smaartminds.com',
              'X-Title': 'SMAART Career Intelligence Engine'
            },
            timeout: 120000
          });

          const content = apiResult.data.choices?.[0]?.message?.content?.trim();
          console.log(`  📨 AI response: ${content ? content.length + ' chars' : 'EMPTY'}`);

          if (content && content.length > 100) {
            // Parse AI JSON
            let cleanJson = content;
            if (cleanJson.startsWith('```')) {
              cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }
            try {
              aiOutput = JSON.parse(cleanJson);
              console.log(`  ✅ AI JSON parsed successfully from ${model}`);
            } catch (parseErr) {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try { aiOutput = JSON.parse(jsonMatch[0]); console.log(`  ✅ AI JSON extracted from ${model}`); } catch (e) { }
              }
            }
            if (aiOutput) break;
          }
        } catch (modelErr) {
          console.log(`  ⚠️ Model ${model} unavailable: ${modelErr.response?.status || modelErr.message}`);
        }
      }
    } catch (aiErr) {
      console.log(`  ⚠️ AI enhancement skipped: ${aiErr.message}`);
    }

    // ── STEP 4: Merge Excel data with AI output (if available) ──
    const mergedOutput = mergeExcelWithAI(excelReport, aiOutput, excelContext, careerInput);

    if (!aiOutput) {
      console.log(`  ℹ️ Report generated from Excel database only (AI models unavailable)`);
    }

    // ── STEP 5: Save ──
    careerRecord.careerOutput = mergedOutput;
    careerRecord.status = 'completed';
    careerRecord.generatedDate = new Date();
    await careerRecord.save();

    console.log(`✅ Career Intelligence Report v${careerRecord.version} generated for user ${userId}`);
    console.log(`   Data Sources: ${mergedOutput.dataSource.aiToolsFromDB} AI tools, ${mergedOutput.dataSource.hiSkillsFromDB} HI skills, ${mergedOutput.dataSource.certificationsFromDB} certifications from Excel DB`);

    return res.status(200).json({
      message: 'Career Intelligence Report generated successfully',
      report: {
        _id: careerRecord._id,
        version: careerRecord.version,
        input: careerRecord.careerInput,
        output: mergedOutput,
        generatedDate: careerRecord.generatedDate,
        status: careerRecord.status,
      },
    });

  } catch (error) {
    console.error('❌ Career Intelligence Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

/**
 * GET /api/career-intelligence/reports
 */
const getReports = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const reports = await CareerIntelligence.find({ userId })
      .sort({ createdAt: -1 })
      .select('-careerOutput.rawAIResponse')
      .lean();
    return res.status(200).json({ reports });
  } catch (error) {
    console.error('❌ Get Reports Error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

/**
 * GET /api/career-intelligence/reports/:id
 */
const getReportById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const report = await CareerIntelligence.findOne({ _id: req.params.id, userId }).lean();
    if (!report) return res.status(404).json({ error: 'Report not found' });
    return res.status(200).json({ report });
  } catch (error) {
    console.error('❌ Get Report Error:', error);
    return res.status(500).json({ error: 'Failed to fetch report' });
  }
};

/**
 * GET /api/career-intelligence/latest
 */
const getLatestReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const report = await CareerIntelligence.findOne({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .select('-careerOutput.rawAIResponse')
      .lean();
    if (!report) return res.status(404).json({ error: 'No completed report found' });
    return res.status(200).json({ report });
  } catch (error) {
    console.error('❌ Get Latest Report Error:', error);
    return res.status(500).json({ error: 'Failed to fetch report' });
  }
};

/**
 * DELETE /api/career-intelligence/reports/:id
 */
const deleteReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const report = await CareerIntelligence.findOneAndDelete({ _id: req.params.id, userId });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    return res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('❌ Delete Report Error:', error);
    return res.status(500).json({ error: 'Failed to delete report' });
  }
};

/**
 * GET /api/career-intelligence/excel-data
 * Returns available sectors, roles, and job families from Excel
 */
const getExcelData = async (req, res) => {
  try {
    const sectors = excelDataLoader.getAllSectors();
    return res.status(200).json(sectors);
  } catch (error) {
    console.error('❌ Excel Data Error:', error);
    return res.status(500).json({ error: 'Failed to fetch career data' });
  }
};

/**
 * POST /api/career-intelligence/refresh-cache
 * Admin: Force reload Excel data
 */
const refreshExcelCache = async (req, res) => {
  try {
    excelDataLoader.clearCache();
    excelDataLoader.loadAllExcelData();
    return res.status(200).json({ message: 'Excel cache refreshed successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to refresh cache' });
  }
};

module.exports = {
  generateCareerReport,
  getReports,
  getReportById,
  getLatestReport,
  deleteReport,
  getExcelData,
  refreshExcelCache,
};
