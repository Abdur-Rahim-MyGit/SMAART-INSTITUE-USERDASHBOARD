const express = require('express');
const router = express.Router();
const Cgpa = require('../models/Cgpa');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const cgpaData = await Cgpa.findOne({ userId: req.user._id });
    if (!cgpaData) {
      return res.json({ success: true, data: null });
    }
    
    // Format back to semestersData object shape for frontend
    const semestersData = {};
    cgpaData.semesters.forEach(sem => {
      semestersData[sem.semester] = sem.subjects;
    });

    res.json({ 
      success: true, 
      data: {
        activeMethod: cgpaData.activeMethod,
        semestersData,
        cgpa: cgpaData.cgpa,
        percentage: cgpaData.percentage
      } 
    });
  } catch (error) {
    console.error('Error fetching CGPA:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

router.post('/save', async (req, res) => {
  try {
    const { activeMethod, semestersData, cgpa, percentage, totalPoints, totalCredits, totalSubjects } = req.body;
    
    const semesters = [];
    if (semestersData) {
      Object.keys(semestersData).forEach(semKey => {
        semesters.push({
          semester: parseInt(semKey, 10),
          subjects: semestersData[semKey] || []
        });
      });
    }

    const payload = {
      activeMethod,
      semesters,
      cgpa,
      percentage,
      totalPoints,
      totalCredits,
      totalSubjects
    };

    let cgpaRecord = await Cgpa.findOne({ userId: req.user._id });
    if (cgpaRecord) {
      cgpaRecord = await Cgpa.findOneAndUpdate(
        { userId: req.user._id },
        { $set: payload },
        { new: true }
      );
    } else {
      payload.userId = req.user._id;
      cgpaRecord = new Cgpa(payload);
      await cgpaRecord.save();
    }

    res.json({ success: true, message: 'CGPA data saved successfully' });
  } catch (error) {
    console.error('Error saving CGPA:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
