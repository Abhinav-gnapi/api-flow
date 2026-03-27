const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postman.controller');

router.post('/parse', ctrl.parsePostman);
router.post('/import', ctrl.importEndpoints);

module.exports = router;
