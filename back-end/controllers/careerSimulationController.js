const CareerIntelligence = require('../models/CareerIntelligence');
const excelDataLoader = require('../services/excelDataLoader');
const excelExportService = require('../services/excelExportService');

/**
 * Career Simulation Engine Controller — v1.0
 * ============================================
 * Generates realistic synthetic student career profiles for dataset creation.
 * Uses only Stage 1 (Excel context) + Stage 2 (Excel-only report).
 * Stage 3 AI enhancement is STRICTLY SKIPPED — zero external API cost.
 * Fully isolated from the normal career generation endpoint.
 */

// ─── Static profile pools for realistic variation ───
const DEGREES = ['B.Tech', 'B.E.', 'BCA', 'MCA', 'M.Tech', 'BBA', 'MBA', 'B.Sc', 'M.Sc', 'B.Com'];
const COLLEGE_TYPES = ['Government', 'Private', 'Deemed', 'Autonomous', 'IIT/NIT', 'Other'];
const AREAS_OF_INTEREST = ['Technology', 'Business', 'Healthcare', 'Finance', 'Creative', 'Core Engineering', 'Education', 'Government'];
const SALARY_RANGES = ['0-3 LPA', '3-6 LPA', '6-10 LPA', '10-15 LPA', '15-25 LPA', '25+ LPA'];
const LOCATIONS = ['Bangalore', 'Hyderabad', 'Chennai', 'Mumbai', 'Delhi NCR', 'Pune', 'Kolkata', 'Kochi', 'Ahmedabad', 'Remote', 'Hybrid'];
const CGPA_POOL = ['6.5 CGPA', '7.0 CGPA', '7.5 CGPA', '8.0 CGPA', '8.5 CGPA', '9.0 CGPA', '78%', '82%', '86%', '91%'];

// Role → Domain mapping (logical alignment)
const ROLE_DOMAIN_MAP = {
    'Software Engineer': 'Software Development',
    'Full Stack Developer': 'Web Development',
    'Frontend Developer': 'Web Development',
    'Backend Developer': 'Web Development',
    'Data Analyst': 'Data Analytics',
    'Data Scientist': 'Data Science & AI',
    'Machine Learning Engineer': 'Artificial Intelligence',
    'AI Engineer': 'Artificial Intelligence',
    'Cybersecurity Analyst': 'IT Security',
    'Security Engineer': 'IT Security',
    'Cloud Engineer': 'Cloud & DevOps',
    'DevOps Engineer': 'Cloud & DevOps',
    'Mobile App Developer': 'Mobile Development',
    'UI/UX Designer': 'Design & User Experience',
    'Product Manager': 'Product Management',
    'Business Analyst': 'Business Intelligence',
    'Digital Marketing Analyst': 'Digital Marketing',
    'Financial Analyst': 'Finance & FinTech',
    'Healthcare Analyst': 'Healthcare Technology',
    'HR Analyst': 'Human Resources',
    'Supply Chain Analyst': 'Operations & Supply Chain',
    'Embedded Systems Engineer': 'Embedded & IoT',
    'Network Engineer': 'Networking & Infrastructure',
    'Database Administrator': 'Database Management',
    'QA Engineer': 'Quality Assurance',
    'Blockchain Developer': 'Blockchain & Web3',
    'Game Developer': 'Game Development',
    'Robotics Engineer': 'Robotics & Automation',
    'Research Scientist': 'Research & Development',
};

// Area of Interest → Job Sector logical mapping
const INTEREST_SECTOR_MAP = {
    'Technology': ['IT', 'Startup', 'MNC'],
    'Business': ['MNC', 'Startup', 'Freelance'],
    'Healthcare': ['MNC', 'Government', 'Research'],
    'Finance': ['MNC', 'Startup', 'Government'],
    'Creative': ['Startup', 'Freelance', 'MNC'],
    'Core Engineering': ['Core Engineering', 'MNC', 'Government'],
    'Education': ['Government', 'MNC', 'Research'],
    'Government': ['Government', 'Core Engineering'],
};

// Degree → Specialization mapping
const DEGREE_SPEC_MAP = {
    'B.Tech': ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical Engineering', 'Civil Engineering'],
    'B.E.': ['Computer Science', 'Electronics & Communication', 'Mechanical', 'Electrical'],
    'BCA': ['Computer Applications', 'Software Development', 'Data Science'],
    'MCA': ['Computer Applications', 'Software Engineering', 'Data Analytics'],
    'M.Tech': ['Computer Science', 'Artificial Intelligence', 'Data Science', 'VLSI Design'],
    'BBA': ['Marketing', 'Finance', 'Human Resources', 'Operations'],
    'MBA': ['Marketing', 'Finance', 'HR Management', 'Operations Management', 'Business Analytics'],
    'B.Sc': ['Computer Science', 'Mathematics', 'Physics', 'Statistics', 'Data Science'],
    'M.Sc': ['Computer Science', 'Data Science', 'Statistics', 'Artificial Intelligence'],
    'B.Com': ['Finance', 'Accounting', 'Business Management'],
};

// Short/Long goal templates
const SHORT_TERM_GOALS = [
    'Secure a full-time position in a reputed company and build core technical skills',
    'Complete relevant certifications and land my first job in the chosen domain',
    'Get hands-on project experience and contribute to real-world products',
    'Build a strong professional network and join a high-growth startup',
    'Upskill in AI and data tools to become job-ready in the next 12 months',
    'Develop a strong portfolio and get placed in a product-based company',
    'Master foundational technologies and crack campus placements successfully',
];
const LONG_TERM_GOALS = [
    'Become a technical lead managing a team of engineers and driving product strategy',
    'Build and lead my own technology startup solving real-world problems',
    'Reach a senior architect or CTO-level position in a Fortune 500 company',
    'Become a recognized AI/ML researcher and publish impactful papers',
    'Lead large-scale digital transformation projects as a principal consultant',
    'Build expertise in system design and move into senior engineering management',
    'Establish myself as a domain expert and transition into advisory or teaching roles',
];

// ─── Utility: pick random item from array ───
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Utility: pick N unique random items ───
const pickUnique = (arr, n) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
};

// ─── Utility: get domain from role ───
const getDomainForRole = (role) => {
    const key = Object.keys(ROLE_DOMAIN_MAP).find(k =>
        role.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(role.toLowerCase().split(' ')[0])
    );
    return ROLE_DOMAIN_MAP[key] || 'Information Technology';
};

// ─── Utility: get matching job sector for interest area ───
const getSectorForInterest = (interest) => {
    const sectors = INTEREST_SECTOR_MAP[interest] || ['IT', 'MNC'];
    return pick(sectors);
};

// ─── Utility: generate batch ID ───
const generateBatchId = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const ts = Date.now();
    return `SIM_${yyyy}_${mm}_${dd}_${ts}`;
};

// ─── Utility: generate graduation year (1-4 years ago or current year) ───
const genGraduationYear = () => {
    const base = new Date().getFullYear();
    return base - Math.floor(Math.random() * 4); // 0-3 years ago
};

// ─── Copy of buildExcelContext from careerIntelligenceController (Stage 1) ───
const buildExcelContext = (input) => {
    const { areaOfInterest, interestedJobRole, jobSector } = input;
    const roleData = excelDataLoader.getDataForRole(interestedJobRole);
    const sectorData = excelDataLoader.getDataForSector(areaOfInterest);
    const jobFamilyData = excelDataLoader.getDataForJobFamily(interestedJobRole);
    const certData = excelDataLoader.getCertificationsForRole(interestedJobRole, areaOfInterest);
    return { roleData, sectorData, jobFamilyData, certData };
};

// ─── Copy of buildExcelOnlyReport from careerIntelligenceController (Stage 2) ───
const buildExcelOnlyReport = (input, excelContext) => {
    const { roleData, sectorData, jobFamilyData, certData } = excelContext;

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

    const emergingJobs = sectorData.emergingRoles.slice(0, 8).map(r => ({
        title: r.roleTitle,
        description: r.roleDescription || `Emerging role in ${input.areaOfInterest}`,
        growthPotential: 'Emerging',
        aiIntegration: r.roleDescription || 'AI-integrated role',
        source: 'SMAART Database',
    }));

    const roadmap = [
        { stage: 'Current', role: `${input.degree} Student / Fresh Graduate`, timeline: 'Now', skills: roleData.coreTechSkills.slice(0, 3).map(s => s.techSkill).join(', ') || 'Foundational skills', description: 'Building academic foundation and exploring career interests' },
        { stage: 'Entry Level', role: careerLevels['Entry Level (0-2 yrs)']?.[0] || input.interestedJobRole, timeline: '0-2 years', skills: roleData.coreTechSkills.slice(0, 4).map(s => s.techSkill).join(', ') || 'Core technical skills', description: `Starting career in ${input.areaOfInterest}` },
        { stage: 'Mid Level', role: careerLevels['Mid Level (3-7 yrs)']?.[0] || `Senior ${input.interestedJobRole}`, timeline: '3-5 years', skills: roleData.coreTechSkills.slice(2, 6).map(s => s.techSkill).join(', ') || 'Advanced technical skills', description: 'Growing expertise and taking on larger projects' },
        { stage: 'Senior Level', role: careerLevels['Senior Level (7-15 yrs)']?.[0] || `Lead ${input.interestedJobRole}`, timeline: '6-10 years', skills: 'Leadership, Architecture, Strategy', description: 'Leading teams and driving strategic initiatives' },
        { stage: 'Leadership', role: careerLevels['Leadership (15+ yrs)']?.[0] || 'Director / VP', timeline: '10+ years', skills: 'Executive leadership, Business strategy', description: 'Executive leadership and industry thought leadership' },
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
            description: `AI skills are increasingly critical for ${input.interestedJobRole} professionals.`,
        },
        humanIntelligenceSkills: hiSkills,
        suggestedJobs: {
            entryLevel: (careerLevels['Entry Level (0-2 yrs)'] || []).slice(0, 4).map(r => ({ title: r, description: `Entry-level opportunity in ${input.areaOfInterest}`, salaryRange: '3-6 LPA' })),
            midLevel: (careerLevels['Mid Level (3-7 yrs)'] || []).slice(0, 4).map(r => ({ title: r, description: `Mid-level role requiring 3-7 years experience`, salaryRange: '8-15 LPA' })),
            seniorLevel: (careerLevels['Senior Level (7-15 yrs)'] || []).slice(0, 4).map(r => ({ title: r, description: `Senior role with leadership responsibilities`, salaryRange: '15-30 LPA' })),
            lateralOpportunities: [],
        },
        emergingJobs,
        careerPathRoadmap: roadmap,
        futureScope: {
            aiImpact: `The ${input.interestedJobRole} role is being significantly shaped by AI advancements.`,
            aiEnhancement: `AI tools are enhancing productivity for professionals in this field.`,
            automationRisk: `Some routine tasks are being automated, but human judgment and creativity remain essential.`,
            stayRelevantTips: `Continuously upgrade AI literacy and build strong human intelligence quotients.`,
            automatedTasks: jobFamilyData.automatedTasks.slice(0, 8).map(a => a.automatedTask),
            humanTasksThatRemain: jobFamilyData.humanTasksRemain.slice(0, 8).map(h => h.humanTask),
            jobChangeSummary: jobFamilyData.jobChanges[0]?.changeDescription || '',
        },
        marketDemand: {
            demandLevel: roleData.roleMeta.demand || 'Growing',
            salaryRange: roleData.roleMeta.salary || '5-25 LPA (varies by experience)',
            salaryGrowthPrediction: 'Expected 10-15% annual growth in compensation for skilled professionals',
            geographicDemand: 'Bangalore, Hyderabad, Pune, Mumbai, Delhi NCR, Chennai',
            industryTrends: `${input.areaOfInterest} sector showing strong growth with increasing AI integration`,
        },
        resourceMap: {
            freeCourses: certData.freeCerts.slice(0, 6).map(c => `${c.certName} by ${c.company} (${c.duration})`),
            paidCourses: certData.byJobTitle.filter(c => c.costTier === 'Paid' || c.costTier === 'Premium').slice(0, 6).map(c => `${c.certName} by ${c.company}`),
            tools: roleData.aiTools.slice(0, 6).map(t => t.toolName),
            learningRoadmap: `Start with foundational skills, then progress to AI tools, and pursue certifications.`,
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
            isSimulated: true,
        },
    };
};

// ─── Generate one synthetic careerInput ───
const generateSyntheticInput = (availableRoles, usedCombinations) => {
    let attempts = 0;
    while (attempts < 30) {
        attempts++;

        const areaOfInterest = pick(AREAS_OF_INTEREST);
        const interestedJobRole = pick(availableRoles);
        const jobSector = getSectorForInterest(areaOfInterest);
        const degree = pick(DEGREES);
        const specialization = pick(DEGREE_SPEC_MAP[degree] || ['Computer Science']);
        const domain = getDomainForRole(interestedJobRole);

        // Build a fingerprint to avoid duplicate combinations
        const fingerprint = `${interestedJobRole}|${areaOfInterest}|${degree}`;
        if (usedCombinations.has(fingerprint)) continue;

        usedCombinations.add(fingerprint);

        return {
            shortTermGoal: pick(SHORT_TERM_GOALS),
            longTermGoal: pick(LONG_TERM_GOALS),
            degree,
            specialization,
            collegeType: pick(COLLEGE_TYPES),
            yearOfGraduation: genGraduationYear(),
            academicPerformance: pick(CGPA_POOL),
            areaOfInterest,
            areaOfInterestOther: '',
            interestedJobRole,
            jobSector,
            preferredLocation: pick(LOCATIONS),
            expectedSalaryRange: pick(SALARY_RANGES),
            domain,
        };
    }
    return null; // Could not generate unique profile after max attempts
};

// ═══════════════════════════════════════════
// CONTROLLER: POST /api/career-intelligence/simulate
// ═══════════════════════════════════════════
const runSimulation = async (req, res) => {
    const startTime = Date.now();
    const count = Math.min(Math.max(parseInt(req.body.count) || 50, 1), 50);
    const batchId = generateBatchId();
    const userId = req.user.id || req.user._id;

    console.log(`\n🚀 Career Simulation Engine started`);
    console.log(`   Batch ID: ${batchId}`);
    console.log(`   Requested profiles: ${count}`);

    try {
        // ── Load Excel data once (cached) ──
        let availableRoles;
        try {
            const excelMeta = excelDataLoader.getAllSectors();
            availableRoles = excelMeta.allRoles;
            if (!availableRoles || availableRoles.length === 0) {
                throw new Error('No roles found in Excel database');
            }
        } catch (excelErr) {
            console.error('❌ Excel load failed:', excelErr.message);
            return res.status(500).json({ error: 'Career database unavailable. Please try again.' });
        }

        // ── Generate synthetic profiles ──
        const usedCombinations = new Set();
        const records = [];
        let skipped = 0;

        for (let i = 0; i < count; i++) {
            const careerInput = generateSyntheticInput(availableRoles, usedCombinations);

            if (!careerInput) {
                skipped++;
                console.log(`  ⚠️ Skipped profile ${i + 1} — could not find unique combination`);
                continue;
            }

            try {
                // Stage 1: Build Excel context
                const excelContext = buildExcelContext(careerInput);

                // Stage 2: Build Excel-only report (AI strictly skipped)
                const careerOutput = buildExcelOnlyReport(careerInput, excelContext);

                records.push({
                    userId,
                    careerInput,
                    careerOutput,
                    status: 'completed',
                    isSimulated: true,
                    simulationBatchId: batchId,
                    domain: careerInput.domain,
                    version: 1,
                    generatedDate: new Date(),
                });
            } catch (profileErr) {
                skipped++;
                console.log(`  ⚠️ Profile ${i + 1} failed: ${profileErr.message}`);
            }
        }

        if (records.length === 0) {
            return res.status(400).json({ error: 'No profiles could be generated. Check Excel database.' });
        }

        // ── Bulk insert into MongoDB ──
        const inserted = await CareerIntelligence.insertMany(records, { ordered: false });

        const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Simulation complete!`);
        console.log(`   Profiles generated: ${inserted.length}`);
        console.log(`   Profiles skipped: ${skipped}`);
        console.log(`   Batch ID: ${batchId}`);
        console.log(`   Execution time: ${executionTime}s`);

        return res.status(200).json({
            message: 'Career Simulation Engine completed successfully',
            batchId,
            totalRequested: count,
            totalGenerated: inserted.length,
            skipped,
            executionTimeSeconds: parseFloat(executionTime),
            sampleProfile: records[0]?.careerInput || null,
        });

    } catch (error) {
        console.error('❌ Simulation Engine Error:', error);
        return res.status(500).json({ error: 'Simulation failed', details: error.message });
    }
};

// ═══════════════════════════════════════════
// CONTROLLER: GET /api/career-intelligence/simulate/batches
// Returns all simulation batch metadata for the user
// ═══════════════════════════════════════════
const getSimulationBatches = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const mongoose = require('mongoose');

        const batches = await CareerIntelligence.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), isSimulated: true } },
            {
                $group: {
                    _id: '$simulationBatchId',
                    count: { $sum: 1 },
                    createdAt: { $first: '$generatedDate' },
                    domains: { $addToSet: '$domain' },
                    roles: { $addToSet: '$careerInput.interestedJobRole' },
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
        ]);

        return res.status(200).json({ batches });
    } catch (error) {
        console.error('❌ Get Batches Error:', error);
        return res.status(500).json({ error: 'Failed to fetch simulation batches' });
    }
};

// ═══════════════════════════════════════════
// CONTROLLER: POST /api/career-intelligence/export-excel
// Appends reports to the AI AGNEENT OUTPUT.xlsx file
// ═══════════════════════════════════════════
const exportToExcel = async (req, res) => {
    try {
        const { reportId, batchId } = req.body;
        const userId = req.user.id || req.user._id;

        let query = { userId: new (require('mongoose').Types.ObjectId)(userId) };
        if (batchId) {
            query.simulationBatchId = batchId;
        } else if (reportId) {
            query._id = reportId;
        } else {
            return res.status(400).json({ error: 'Either reportId or batchId is required' });
        }

        const reports = await CareerIntelligence.find(query).lean();

        if (!reports || reports.length === 0) {
            return res.status(404).json({ error: 'No reports found matching criteria' });
        }

        const result = excelExportService.exportToExcel(reports);

        return res.status(200).json({
            message: `Successfully exported ${result.count} reports to Excel`,
            count: result.count,
            path: 'AI AGNEENT OUTPUT.xlsx'
        });
    } catch (error) {
        console.error('❌ Excel Export Error:', error);
        return res.status(500).json({ error: 'Failed to export to Excel', details: error.message });
    }
};

module.exports = { runSimulation, getSimulationBatches, exportToExcel };
