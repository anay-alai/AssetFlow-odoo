const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/', authenticate, authorize('admin', 'asset_manager'), auditController.createCycle);
router.post('/:id/auditors', authenticate, authorize('admin', 'asset_manager'), auditController.assignAuditors);
router.put('/items/:id/verify', authenticate, auditController.verifyItem);
router.put('/:id/close', authenticate, authorize('admin', 'asset_manager'), auditController.closeCycle);

module.exports = router;