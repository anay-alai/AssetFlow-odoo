const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const allocationController = require('../controllers/allocationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

const assetUploads = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'documents', maxCount: 5 },
]);

router.get('/', authenticate, assetController.getAssets);
router.get('/search', authenticate, assetController.searchAssets);
router.post('/', authenticate, authorize('admin', 'asset_manager'), assetUploads, assetController.createAsset);
router.get('/:id', authenticate, assetController.getAssetById);
router.get('/:id/history', authenticate, assetController.getAssetHistory);
router.get('/:id/allocation-history', authenticate, allocationController.getAllocationHistory);
router.put('/:id', authenticate, authorize('admin', 'asset_manager'), assetController.updateAsset);

module.exports = router;
