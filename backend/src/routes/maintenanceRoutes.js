const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

router.get('/', authenticate, maintenanceController.getRequests);
router.post('/', authenticate, upload.single('photo'), maintenanceController.createRequest);
router.put('/:id/approve', authenticate, authorize('admin', 'asset_manager'), maintenanceController.approveRequest);
router.put('/:id/reject', authenticate, authorize('admin', 'asset_manager'), maintenanceController.rejectRequest);
router.put('/:id/assign-technician', authenticate, authorize('admin', 'asset_manager'), maintenanceController.assignTechnician);
router.put('/:id/start', authenticate, authorize('admin', 'asset_manager'), maintenanceController.startRequest);
router.put('/:id/resolve', authenticate, authorize('admin', 'asset_manager'), maintenanceController.resolveRequest);

module.exports = router;
