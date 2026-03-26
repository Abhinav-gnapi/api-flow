const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/runner.controller');
router.post('/run-one', ctrl.runOne);
router.post('/run-all', ctrl.runAll);
module.exports = router;
