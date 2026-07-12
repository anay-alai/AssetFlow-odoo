const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, assetController.getAssets);
router.post('/', authenticate, authorize('admin', 'asset_manager'), assetController.createAsset);
router.get('/search', authenticate, assetController.searchAssets);
router.get('/:id', authenticate, assetController.getAssetById);
router.get('/:id/history', authenticate, assetController.getAssetHistory);
router.put('/:id', authenticate, authorize('admin', 'asset_manager'), assetController.updateAsset);

module.exports = router;