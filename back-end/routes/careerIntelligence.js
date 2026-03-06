const express = require('express');
const router = express.Router();
const careerIntelligenceController = require('../controllers/careerIntelligenceController');
const careerSimulationController = require('../controllers/careerSimulationController');

/**
 * Career Intelligence Routes
 * Part of SMAART Toolkit - Career Data Fetcher
 * All routes require authentication (middleware applied in server.js)
 */

// Generate new career intelligence report
router.post('/generate', careerIntelligenceController.generateCareerReport);

// Get all reports for the current user
router.get('/reports', careerIntelligenceController.getReports);

// Get latest completed report
router.get('/latest', careerIntelligenceController.getLatestReport);

// Get structured Excel data (sectors, roles, job families)
router.get('/excel-data', careerIntelligenceController.getExcelData);

// Get specific report by ID
router.get('/reports/:id', careerIntelligenceController.getReportById);

// Delete a report
router.delete('/reports/:id', careerIntelligenceController.deleteReport);

// Admin: Force refresh Excel data cache
router.post('/refresh-cache', careerIntelligenceController.refreshExcelCache);

// ── Career Simulation Engine (isolated, no AI cost) ──
router.post('/simulate', careerSimulationController.runSimulation);
router.get('/simulate/batches', careerSimulationController.getSimulationBatches);

module.exports = router;
