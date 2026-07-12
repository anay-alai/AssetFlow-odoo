const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/utilization', authenticate, reportController.getUtilization);
router.get('/maintenance-frequency', authenticate, reportController.getMaintenanceFrequency);

module.exports = router;