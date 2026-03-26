const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/report.controller');
router.get('/', ctrl.getByConfig);
router.get('/:id', ctrl.getOne);
router.delete('/:id', ctrl.remove);
module.exports = router;
