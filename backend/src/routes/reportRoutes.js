const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const reportRoles = authorize('admin', 'asset_manager', 'dept_head');

router.get('/utilization', authenticate, reportRoles, reportController.getUtilization);
router.get('/maintenance-frequency', authenticate, reportRoles, reportController.getMaintenanceFrequency);
router.get('/most-used-idle', authenticate, reportRoles, reportController.getMostUsedIdle);
router.get('/maintenance-due', authenticate, reportRoles, reportController.getMaintenanceDue);
router.get('/department-allocation', authenticate, reportRoles, reportController.getDepartmentAllocation);
router.get('/booking-heatmap', authenticate, reportRoles, reportController.getBookingHeatmap);
router.get('/export', authenticate, reportRoles, reportController.exportReport);

module.exports = router;
