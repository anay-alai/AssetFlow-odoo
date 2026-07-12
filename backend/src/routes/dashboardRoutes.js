const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/kpis', authenticate, dashboardController.getKPIs);
router.get('/recent-activity', authenticate, dashboardController.getRecentActivity);
router.get('/overdue', authenticate, dashboardController.getOverdue);

module.exports = router;