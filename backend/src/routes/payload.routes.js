const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payload.controller');

router.get('/', ctrl.getByConfig);
router.post('/', ctrl.create);
router.post('/bulk', ctrl.bulkCreate);
router.put('/:id', ctrl.update);
router.delete('/config/:configId', ctrl.removeByConfig);
router.delete('/:id', ctrl.remove);

module.exports = router;
