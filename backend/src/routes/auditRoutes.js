const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, auditController.getCycles);
router.post('/', authenticate, authorize('admin', 'asset_manager'), auditController.createCycle);
router.get('/:id/items', authenticate, auditController.getCycleItems);
router.get('/:id/discrepancy-report', authenticate, auditController.discrepancyReport);
// Verify by cycle + asset id (frontend sends cycleId and assetId)
router.put('/:cycleId/items/:assetId/verify', authenticate, auditController.verifyItemByAsset);
router.post('/:id/auditors', authenticate, authorize('admin', 'asset_manager'), auditController.assignAuditors);
router.put('/items/:id/verify', authenticate, auditController.verifyItem);
router.put('/:cycle_id/verify-asset', authenticate, auditController.verifyItemByAsset);
router.put('/:id/close', authenticate, authorize('admin', 'asset_manager'), auditController.closeCycle);

module.exports = router;
