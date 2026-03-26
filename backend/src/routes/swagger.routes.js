const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/swagger.controller');
router.post('/parse', ctrl.parseSwagger);
router.post('/import', ctrl.importEndpoints);
module.exports = router;
