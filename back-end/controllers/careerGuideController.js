const CareerGuide = require('../models/CareerGuide');
const openRouterService = require('../services/openRouterService');
const excelDataLoader = require('../services/excelDataLoader');

/**
 * Career Guide Agent Controller
 * ======================================
 * Multifactor Career Intelligence with 3 Job Preferences
 * Implements Career Zone Logic (Green/Amber/Red)
 */

// Helper: Build context for multiple roles
const buildMultiRoleContext = (input) => {
    const { primary, secondary, tertiary } = input.jobPreferences;
    const roles = [primary, secondary, tertiary].filter(r => r && r.jobRole);

    const context = {};
    roles.forEach((pref, idx) => {
        const key = idx === 0 ? 'primary' : (idx === 1 ? 'secondary' : 'tertiary');
        context[key] = {
            roleData: excelDataLoader.getDataForRole(pref.jobRole),
            sectorData: excelDataLoader.getDataForSector(pref.sector),
            jobFamilyData: excelDataLoader.getDataForJobFamily(pref.jobRole),
            certData: excelDataLoader.getCertificationsForRole(pref.jobRole, pref.sector)
        };
    });

    return context;
};

// POST /api/career-guide/generate
const generateGuideReport = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const inputData = req.body;

        // Create initial record
        const guideRecord = new CareerGuide({
            userId,
            education: inputData.education,
            jobPreferences: inputData.jobPreferences,
            aspirations: inputData.aspirations,
            workExperience: inputData.workExperience,
            skillsAndCertifications: inputData.skillsAndCertifications,
            status: 'processing'
        });
        await guideRecord.save();

        console.log(`🧠 Generating Career Guide Report for user ${userId}...`);

        // 1. Load Excel Data for all 3 preferences
        let excelContext;
        try {
            excelContext = buildMultiRoleContext(inputData);
        } catch (err) {
            console.error('Excel Loading Error:', err);
            guideRecord.status = 'failed';
            await guideRecord.save();
            return res.status(500).json({ error: 'Failed to access career databases' });
        }

        // 2. Call AI with Structured Prompt
        try {
            const result = await openRouterService.generateCareerGuide(inputData, excelContext);

            if (result.success) {
                let aiOutput = result.message;

                // Parse JSON if returned as string
                if (typeof aiOutput === 'string') {
                    try {
                        const jsonMatch = aiOutput.match(/\{[\s\S]*\}/);
                        aiOutput = JSON.parse(jsonMatch ? jsonMatch[0] : aiOutput);
                    } catch (e) {
                        console.error('AI JSON Parse Error:', e);
                    }
                }

                guideRecord.output = aiOutput;
                guideRecord.status = 'completed';
                guideRecord.generatedDate = new Date();
                await guideRecord.save();

                return res.status(200).json({
                    success: true,
                    report: guideRecord
                });
            } else {
                throw new Error(result.error);
            }
        } catch (aiErr) {
            console.error('AI Generation Error:', aiErr);
            guideRecord.status = 'failed';
            await guideRecord.save();
            return res.status(500).json({ error: 'AI processing failed' });
        }

    } catch (error) {
        console.error('Career Guide Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getReports = async (req, res) => {
    try {
        const reports = await CareerGuide.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};

const getLatestReport = async (req, res) => {
    try {
        const report = await CareerGuide.findOne({ userId: req.user.id, status: 'completed' }).sort({ createdAt: -1 });
        if (!report) return res.status(404).json({ error: 'No report found' });
        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch latest report' });
    }
};

module.exports = {
    generateGuideReport,
    getReports,
    getLatestReport
};
