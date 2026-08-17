const express = require('express');
const router = express.Router();
const LoginMedia = require('../models/LoginMedia');

// Public: the login page shows this slideshow before any authentication.
router.get('/', async (req, res) => {
  try {
    const doc = await LoginMedia.findOne({ key: 'global' });
    res.json({ success: true, data: doc ? doc.items : [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch login media' });
  }
});

module.exports = router;
