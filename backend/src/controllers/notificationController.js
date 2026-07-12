const { Notification } = require('../models');

exports.getNotifications = async (req, res, next) => {
    try {
        const where = { user_id: req.user.id };
        if (req.query.type) where.type = req.query.type;
        
        const notifications = await Notification.findAll({ where, order: [['created_at', 'DESC']] });
        res.json({ success: true, data: notifications });
    } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!notification) return res.status(404).json({ success: false, error: { message: 'Notification not found' } });
        
        await notification.update({ is_read: true });
        res.json({ success: true, data: notification });
    } catch (error) { next(error); }
};