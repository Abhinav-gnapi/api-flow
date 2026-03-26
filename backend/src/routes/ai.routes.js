const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ai.controller');
router.post('/generate-edge-cases', ctrl.generateEdgeCases);
router.post('/analyze-flow', ctrl.analyzeFlow);
module.exports = router;
