const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, notificationController.getNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/mark-all-read', authenticate, notificationController.markAllRead);
router.put('/:id/read', authenticate, notificationController.markAsRead);

module.exports = router;
