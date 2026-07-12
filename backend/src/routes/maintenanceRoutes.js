const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/', authenticate, maintenanceController.createRequest);
router.put('/:id/approve', authenticate, authorize('admin', 'asset_manager'), maintenanceController.approveRequest);
router.put('/:id/reject', authenticate, authorize('admin', 'asset_manager'), maintenanceController.rejectRequest);
router.put('/:id/resolve', authenticate, authorize('admin', 'asset_manager'), maintenanceController.resolveRequest);

module.exports = router;