const express = require('express');
const router = express.Router();
const { getRoles, getRole, getCategories } = require('../controllers/roleController');

router.get('/', getRoles);
router.get('/categories', getCategories);
router.get('/:id', getRole);

module.exports = router;
