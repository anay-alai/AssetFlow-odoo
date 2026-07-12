const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, authorize('admin', 'asset_manager', 'dept_head'), activityLogController.getActivityLogs);

module.exports = router;
