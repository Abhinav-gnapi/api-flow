const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bug.controller');

router.get('/config', ctrl.getConfig);
router.post('/github', ctrl.createGitHubIssue);
router.post('/jira', ctrl.createJiraIssue);

module.exports = router;