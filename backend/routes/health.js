// backend/routes/health.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getHealthProfile,
  updateHealthProfile,
  logActivity,
  getActivityStats,
  getLeaderboard
} = require('../controllers/healthController');

router.use(authMiddleware);

router.get('/profile', getHealthProfile);
router.put('/profile', updateHealthProfile);
router.post('/activity', logActivity);
router.get('/stats', getActivityStats);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
