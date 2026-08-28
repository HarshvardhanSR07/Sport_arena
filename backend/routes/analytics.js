const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/weekly-traffic', analyticsController.getWeeklyTraffic);
router.get('/sport-popularity', analyticsController.getSportPopularity);

module.exports = router;
