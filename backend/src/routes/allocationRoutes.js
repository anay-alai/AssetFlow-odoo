const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/', authenticate, authorize('admin', 'asset_manager', 'dept_head'), allocationController.createAllocation);
router.post('/:id/return', authenticate, authorize('admin', 'asset_manager', 'dept_head'), allocationController.returnAllocation);

router.get('/transfer-requests', authenticate, allocationController.listTransferRequests);
router.post('/transfer-requests', authenticate, authorize('admin', 'asset_manager', 'dept_head'), allocationController.createTransferRequest);
router.put('/transfer-requests/:id/approve', authenticate, authorize('admin', 'asset_manager', 'dept_head'), allocationController.approveTransferRequest);
router.put('/transfer-requests/:id/reject', authenticate, authorize('admin', 'asset_manager', 'dept_head'), allocationController.rejectTransferRequest);

module.exports = router;