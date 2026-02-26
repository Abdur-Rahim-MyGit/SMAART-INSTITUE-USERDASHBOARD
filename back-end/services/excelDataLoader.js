/**
 * SMAART Excel Data Loader Service
 * =================================
 * Loads and processes all 4 Excel career intelligence databases:
 * 1. ABC_AI_Skills_Tools_Reference_Database_v1.xlsx
 * 2. ABC_Technical_Skills_Directory_v1.xlsx
 * 3. SMAART_Job_Families_Master.xlsx
 * 4. SMAART_Job_Family_Deep_Intelligence_Complete.xlsx
 *
 * Converts Excel → Structured JSON for the Career Intelligence Engine
 * Part of SMAART Toolkit - Career Data Fetcher
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_DIR = path.join(__dirname, '..', '..', 'front-end', 'AI DATASET EXCEL DATAS');

// Cache loaded data to avoid re-reading files on every request
let cachedData = null;
let lastLoadTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Load all Excel files and convert to structured JSON
 */
const loadAllExcelData = () => {
    if (cachedData && lastLoadTime && (Date.now() - lastLoadTime < CACHE_DURATION)) {
        return cachedData;
    }

    console.log('📊 Loading SMAART Excel Career Databases...');

    try {
        const data = {};

        // ══════════════════════════════════════════════════
        // FILE 1: AI Skills & Tools Reference Database
        // ══════════════════════════════════════════════════
        const wb1 = XLSX.readFile(path.join(EXCEL_DIR, 'ABC_AI_Skills_Tools_Reference_Database_v1.xlsx'));

        // AI Tools by Role
        data.aiTools = XLSX.utils.sheet_to_json(wb1.Sheets['AI_Tools']).map(row => ({
            sector: row['Sector'] || '',
            role: row['Role'] || '',
            salary: row['Salary'] || '',
            demand: row['Demand'] || '',
            toolName: row['AI Tool Name'] || '',
            toolDescription: row['Tool Description'] || '',
            costType: row['FREE / PAID'] || '',
        }));

        // AI Skills Required per Role
        data.aiSkillsRequired = XLSX.utils.sheet_to_json(wb1.Sheets['AI_Skills_Required']).map(row => ({
            sector: row['Sector'] || '',
            role: row['Role'] || '',
            salary: row['Salary'] || '',
            demand: row['Demand'] || '',
            aiSkill: row['AI Skill Required'] || '',
        }));

        // Core Technical Skills per Role
        data.coreTechSkills = XLSX.utils.sheet_to_json(wb1.Sheets['Core_Tech_Skills']).map(row => ({
            sector: row['Sector'] || '',
            role: row['Role'] || '',
            salary: row['Salary'] || '',
            demand: row['Demand'] || '',
            techSkill: row['Core Technical Skill'] || '',
        }));

        // Certifications per Role
        data.certificationsByRole = XLSX.utils.sheet_to_json(wb1.Sheets['Certifications']).map(row => ({
            sector: row['Sector'] || '',
            role: row['Role'] || '',
            salary: row['Salary'] || '',
            demand: row['Demand'] || '',
            certName: row['Certification Name'] || '',
            provider: row['Provider'] || '',
            cost: row['Cost / Access'] || '',
        }));

        // Human Intelligence Skills per Role
        data.humanIntelligenceSkills = XLSX.utils.sheet_to_json(wb1.Sheets['Human_Intelligence_Skills']).map(row => ({
            sector: row['Sector'] || '',
            role: row['Role'] || '',
            salary: row['Salary'] || '',
            demand: row['Demand'] || '',
            hiQuotient: row['HI Quotient'] || '',
            quotientCode: row['Quotient Code'] || '',
            taskApplication: row['Task / Application'] || '',
        }));

        // ══════════════════════════════════════════════════
        // FILE 2: Technical Skills / Certifications Directory
        // ══════════════════════════════════════════════════
        const wb2 = XLSX.readFile(path.join(EXCEL_DIR, 'ABC_Technical_Skills_Directory_v1.xlsx'));

        data.allCertifications = XLSX.utils.sheet_to_json(wb2.Sheets['All_Certifications']).map(row => ({
            domainNo: row['Domain No.'] || '',
            domainName: row['Domain Name'] || '',
            targetJobRoles: row['Target Job Roles (Domain)'] || '',
            company: row['Company / Issuer'] || '',
            certName: row['Certification / Course Name'] || '',
            level: row['Level'] || '',
            cost: row['Cost'] || '',
            costTier: row['FREE / PAID Tier'] || '',
            duration: row['Duration'] || '',
            jobTitlesTargeted: row['Job Titles It Targets'] || '',
            accessUrl: row['Where to Access'] || '',
        }));

        data.freeCertifications = XLSX.utils.sheet_to_json(wb2.Sheets['FREE_Certifications']).map(row => ({
            domainName: row['Domain Name'] || '',
            company: row['Company / Issuer'] || '',
            certName: row['Certification / Course Name'] || '',
            level: row['Level'] || '',
            duration: row['Duration'] || '',
            jobTitlesTargeted: row['Job Titles It Targets'] || '',
            accessUrl: row['Where to Access'] || '',
        }));

        // Certifications indexed by Job Title
        data.certsByJobTitle = XLSX.utils.sheet_to_json(wb2.Sheets['By_Job_Title']).map(row => ({
            jobTitle: row['Job Title'] || '',
            domain: row['Domain'] || '',
            company: row['Company / Issuer'] || '',
            certName: row['Certification / Course Name'] || '',
            level: row['Level'] || '',
            cost: row['Cost'] || '',
            costTier: row['FREE/PAID Tier'] || '',
            duration: row['Duration'] || '',
            accessUrl: row['Where to Access'] || '',
        }));

        // ══════════════════════════════════════════════════
        // FILE 3: Job Families Master
        // ══════════════════════════════════════════════════
        const wb3 = XLSX.readFile(path.join(EXCEL_DIR, 'SMAART_Job_Families_Master.xlsx'));

        // Existing Roles (756 roles with career levels)
        data.existingRoles = XLSX.utils.sheet_to_json(wb3.Sheets['Existing_Roles_One_Per_Row']).map(row => ({
            sectorNo: row['Sector No.'] || '',
            sectorName: row['Sector Name'] || '',
            jfCode: row['JF Code'] || '',
            jobFamilyName: row['Job Family Name'] || '',
            jfStatus: row['JF Status'] || '',
            careerLevel: row['Career Level'] || '',
            roleTitle: row['Role Title'] || '',
            industryContext: row['Industry Context'] || '',
        }));

        // Future/Emerging Roles
        data.emergingRoles = XLSX.utils.sheet_to_json(wb3.Sheets['Future_Emerging_One_Per_Row']).map(row => ({
            sectorNo: row['Sector No.'] || '',
            sectorName: row['Sector Name'] || '',
            jfCode: row['JF Code'] || '',
            jobFamilyName: row['Job Family Name'] || '',
            roleTitle: row['Role Title'] || '',
            roleStatus: row['Role Status'] || '',
            roleDescription: row['Role Description'] || '',
            industryContext: row['Industry Context'] || '',
            evidence: row['Evidence / Sources'] || '',
        }));

        // ══════════════════════════════════════════════════
        // FILE 4: Deep Intelligence (Qualifications, Skills, AI Impact)
        // ══════════════════════════════════════════════════
        const wb4 = XLSX.readFile(path.join(EXCEL_DIR, 'SMAART_Job_Family_Deep_Intelligence_Complete.xlsx'));

        // Qualifications per Job Family
        data.qualifications = XLSX.utils.sheet_to_json(wb4.Sheets['Qualifications']).map(row => ({
            jfCode: row['JF Code'] || '',
            jobFamilyName: row['Job Family Name'] || '',
            sector: row['Sector'] || '',
            qualification: row['Qualification / Degree'] || '',
            notes: row['Notes / Relevance'] || '',
        }));

        // Technical Skills by Job Family (with Priority & Proficiency)
        data.technicalSkillsByFamily = XLSX.utils.sheet_to_json(wb4.Sheets['Technical_Skills']).map(row => ({
            jfCode: row['JF Code'] || '',
            jobFamilyName: row['Job Family Name'] || '',
            sector: row['Sector'] || '',
            priority: row['Priority'] || '',
            technicalSkill: row['Technical Skill / Tool'] || '',
            proficiencyLevel: row['Proficiency Level'] || '',
        }));

        // Human Judgement Skills by Job Family
        data.humanJudgementSkills = XLSX.utils.sheet_to_json(wb4.Sheets['Human_Judgement_Skills']).map(row => ({
            jfCode: row['JF Code'] || '',
            jobFamilyName: row['Job Family Name'] || '',
            sector: row['Sector'] || '',
            humanSkill: row['Human Judgement Skill'] || '',
            taskApplications: row['Specific Job Tasks This Skill Applies To'] || '',
        }));

        // AI Tools Required by Job Family
        data.aiToolsByFamily = XLSX.utils.sheet_to_json(wb4.Sheets['AI_Tools_Required']).map(row => ({
            jfCode: row['JF Code'] || '',
            jobFamilyName: row['Job Family Name'] || '',
            sector: row['Sector'] || '',
            aiTool: row['AI Tool / Platform'] || '',
            useCase: row['Use Case / Purpose'] || '',
        }));

        // AI Automated Tasks (what AI will replace)
        data.aiAutomatedTasks = XLSX.utils.sheet_to_json(wb4.Sheets['AI_Automated_Tasks']).map(row => ({
            jfCode: row['JF Code'] || '',
            jobFamilyName: row['Job Family Name'] || '',
            sector: row['Sector'] || '',
            automatedTask: row['Task Being Automated by AI'] || '',
        }));

        // How Job Changes in AI Era
        data.howJobChanges = XLSX.utils.sheet_to_json(wb4.Sheets['How_Job_Changes']).map(row => ({
            jfCode: row['JF Code'] || '',
            jobFamilyName: row['Job Family Name'] || '',
            sector: row['Sector'] || '',
            changeDescription: row['How This Job Fundamentally Changes (AI Era)'] || '',
        }));

        // Human Tasks That Remain (cannot be automated)
        data.humanTasksRemain = XLSX.utils.sheet_to_json(wb4.Sheets['Human_Tasks_That_Remain']).map(row => ({
            jfCode: row['JF Code'] || '',
            jobFamilyName: row['Job Family Name'] || '',
            sector: row['Sector'] || '',
            humanTask: row['Human Judgement Task That Cannot Be Automated'] || '',
        }));

        // ══════════════════════════════════════════════════
        // Build lookup indexes for fast querying
        // ══════════════════════════════════════════════════

        // Unique sectors list
        data.sectors = [...new Set(data.existingRoles.map(r => r.sectorName).filter(Boolean))];

        // Unique roles list
        data.roles = [...new Set(data.aiTools.map(r => r.role).filter(Boolean))];

        // Unique job families
        data.jobFamilies = [...new Set(data.technicalSkillsByFamily.map(r => r.jobFamilyName).filter(Boolean))];

        // Role-to-sector mapping
        data.roleSectorMap = {};
        data.aiTools.forEach(item => {
            if (item.role && item.sector) {
                data.roleSectorMap[item.role] = {
                    sector: item.sector,
                    salary: item.salary,
                    demand: item.demand,
                };
            }
        });

        // Cache
        cachedData = data;
        lastLoadTime = Date.now();

        console.log(`✅ Excel Data Loaded Successfully!`);
        console.log(`   📋 AI Tools: ${data.aiTools.length} entries`);
        console.log(`   🎯 AI Skills: ${data.aiSkillsRequired.length} entries`);
        console.log(`   💻 Core Tech Skills: ${data.coreTechSkills.length} entries`);
        console.log(`   🏅 Certifications: ${data.allCertifications.length} entries`);
        console.log(`   🧠 Human Intelligence Skills: ${data.humanIntelligenceSkills.length} entries`);
        console.log(`   👔 Existing Roles: ${data.existingRoles.length} entries`);
        console.log(`   🚀 Emerging Roles: ${data.emergingRoles.length} entries`);
        console.log(`   📊 Technical Skills (Deep): ${data.technicalSkillsByFamily.length} entries`);
        console.log(`   🤝 Human Judgement Skills: ${data.humanJudgementSkills.length} entries`);
        console.log(`   🤖 AI Automated Tasks: ${data.aiAutomatedTasks.length} entries`);

        return data;
    } catch (error) {
        console.error('❌ Excel Data Loading Error:', error.message);
        throw error;
    }
};

/**
 * Query data for a specific role
 */
const getDataForRole = (roleQuery) => {
    const data = loadAllExcelData();

    // Fuzzy match - find the best matching role
    const normalizedQuery = roleQuery.toLowerCase().trim();
    const matchedRole = data.roles.find(r =>
        r.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(r.toLowerCase().split('/')[0].trim())
    ) || data.roles.find(r =>
        normalizedQuery.split(' ').some(word =>
            word.length > 3 && r.toLowerCase().includes(word)
        )
    );

    const roleFilter = matchedRole || roleQuery;

    const result = {
        matchedRole: roleFilter,
        exactMatch: !!matchedRole,

        // AI Tools for this role
        aiTools: data.aiTools.filter(t => t.role === roleFilter),

        // AI Skills for this role
        aiSkills: data.aiSkillsRequired.filter(s => s.role === roleFilter),

        // Core Technical Skills for this role
        coreTechSkills: data.coreTechSkills.filter(s => s.role === roleFilter),

        // Certifications for this role
        certifications: data.certificationsByRole.filter(c => c.role === roleFilter),

        // Human Intelligence Skills for this role
        humanSkills: data.humanIntelligenceSkills.filter(h => h.role === roleFilter),

        // Role metadata
        roleMeta: data.roleSectorMap[roleFilter] || {},
    };

    return result;
};

/**
 * Query data for a specific sector
 */
const getDataForSector = (sectorQuery) => {
    const data = loadAllExcelData();

    // Fuzzy match sector
    const normalizedQuery = sectorQuery.toLowerCase().trim();
    const matchedSector = data.sectors.find(s =>
        s.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(s.toLowerCase().split('&')[0].trim())
    );

    // Also match in the AI dataset sectors
    const aiSectors = [...new Set(data.aiTools.map(t => t.sector).filter(Boolean))];
    const matchedAISector = aiSectors.find(s =>
        s.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.split(' ').some(word =>
            word.length > 3 && s.toLowerCase().includes(word)
        )
    );

    const sectorFilter = matchedSector || sectorQuery;
    const aiSectorFilter = matchedAISector || sectorQuery;

    return {
        matchedSector: sectorFilter,
        matchedAISector: aiSectorFilter,

        // Existing roles in this sector
        existingRoles: data.existingRoles.filter(r =>
            r.sectorName === sectorFilter ||
            r.sectorName?.toLowerCase().includes(normalizedQuery)
        ),

        // Emerging roles in this sector
        emergingRoles: data.emergingRoles.filter(r =>
            r.sectorName === sectorFilter ||
            r.sectorName?.toLowerCase().includes(normalizedQuery)
        ),

        // All roles available in AI dataset for this sector
        aiRoles: [...new Set(data.aiTools.filter(t =>
            t.sector === aiSectorFilter ||
            t.sector?.toLowerCase().includes(normalizedQuery)
        ).map(t => t.role))],
    };
};

/**
 * Query data for a specific job family
 */
const getDataForJobFamily = (jobFamilyQuery) => {
    const data = loadAllExcelData();

    const normalizedQuery = jobFamilyQuery.toLowerCase().trim();
    const matchedFamily = data.jobFamilies.find(jf =>
        jf.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(jf.toLowerCase().split('&')[0].trim())
    ) || data.jobFamilies.find(jf =>
        normalizedQuery.split(' ').some(word =>
            word.length > 3 && jf.toLowerCase().includes(word)
        )
    );

    const familyFilter = matchedFamily || jobFamilyQuery;

    return {
        matchedFamily: familyFilter,

        // Qualifications
        qualifications: data.qualifications.filter(q => q.jobFamilyName === familyFilter),

        // Technical skills with priority
        technicalSkills: data.technicalSkillsByFamily.filter(t => t.jobFamilyName === familyFilter),

        // Human judgement skills
        humanJudgementSkills: data.humanJudgementSkills.filter(h => h.jobFamilyName === familyFilter),

        // AI tools
        aiTools: data.aiToolsByFamily.filter(a => a.jobFamilyName === familyFilter),

        // Automated tasks
        automatedTasks: data.aiAutomatedTasks.filter(a => a.jobFamilyName === familyFilter),

        // How job changes
        jobChanges: data.howJobChanges.filter(h => h.jobFamilyName === familyFilter),

        // Human tasks that remain
        humanTasksRemain: data.humanTasksRemain.filter(h => h.jobFamilyName === familyFilter),
    };
};

/**
 * Get certifications recommendations for a role/domain
 */
const getCertificationsForRole = (roleQuery, domainQuery) => {
    const data = loadAllExcelData();

    const normalizedRole = roleQuery?.toLowerCase().trim() || '';
    const normalizedDomain = domainQuery?.toLowerCase().trim() || '';

    // By job title
    const byJobTitle = data.certsByJobTitle.filter(c =>
        c.jobTitle?.toLowerCase().includes(normalizedRole) ||
        normalizedRole.split(' ').some(word =>
            word.length > 3 && c.jobTitle?.toLowerCase().includes(word)
        )
    );

    // By domain
    const byDomain = data.allCertifications.filter(c =>
        c.domainName?.toLowerCase().includes(normalizedDomain) ||
        normalizedDomain.split(' ').some(word =>
            word.length > 3 && c.domainName?.toLowerCase().includes(word)
        )
    );

    // Free certifications in domain
    const freeCerts = data.freeCertifications.filter(c =>
        c.domainName?.toLowerCase().includes(normalizedDomain) ||
        normalizedDomain.split(' ').some(word =>
            word.length > 3 && c.domainName?.toLowerCase().includes(word)
        )
    );

    return { byJobTitle, byDomain, freeCerts };
};

const getAllSectors = () => {
    const data = loadAllExcelData();

    // Combine sectors from existing roles and AI datasets
    const allSectorsRaw = [
        ...(data.sectors || []),
        ...new Set(data.aiTools.map(t => t.sector).filter(Boolean))
    ];

    // Normalize: Trim, Title Case, and Unique
    const toTitleCase = (str) => {
        return str.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const uniqueSectors = [...new Set(allSectorsRaw.map(s => toTitleCase(s.trim())))].sort();

    return {
        masterSectors: uniqueSectors,
        jobFamilies: data.jobFamilies,
        allRoles: data.roles.sort(),
    };
};

/**
 * Clear cache (for admin data refresh)
 */
const clearCache = () => {
    cachedData = null;
    lastLoadTime = null;
    console.log('🔄 Excel data cache cleared');
};

module.exports = {
    loadAllExcelData,
    getDataForRole,
    getDataForSector,
    getDataForJobFamily,
    getCertificationsForRole,
    getAllSectors,
    clearCache,
};
