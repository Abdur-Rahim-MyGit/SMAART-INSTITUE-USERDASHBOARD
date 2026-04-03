const Degree = require('../models/Degree');

/**
 * Degree Controller
 * Handles hierarchical degree data fetching for registration dropdowns
 */

// Get all unique levels
exports.getLevels = async (req, res) => {
  try {
    const levels = await Degree.distinct('level');
    res.json({ success: true, data: levels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get unique domains for a level
exports.getDomains = async (req, res) => {
  try {
    const { level } = req.query;
    if (!level) return res.status(400).json({ success: false, message: 'Level is required' });
    
    const domains = await Degree.distinct('domain', { level });
    res.json({ success: true, data: domains });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get unique full Names for a domain and level
exports.getFullNames = async (req, res) => {
  try {
    const { level, domain } = req.query;
    if (!level || !domain) return res.status(400).json({ success: false, message: 'Level and Domain are required' });
    
    const fullNames = await Degree.distinct('fullName', { level, domain });
    res.json({ success: true, data: fullNames });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get unique specializations for a full name, domain, and level
exports.getSpecializations = async (req, res) => {
  try {
    const { level, domain, fullName } = req.query;
    if (!level || !domain || !fullName) return res.status(400).json({ success: false, message: 'Level, Domain, and Full Name are required' });
    
    const specializations = await Degree.distinct('specialization', { level, domain, fullName });
    res.json({ success: true, data: specializations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
