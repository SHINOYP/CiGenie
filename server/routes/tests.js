const express = require('express');
const router = express.Router();
const { runTests } = require('../controllers/testsController');

router.post('/run', runTests);

module.exports = router;
