const { Notification } = require('../models');
const { Op } = require('sequelize');

// Tab groups shown in the UI mapped to notification types.
const TYPE_GROUPS = {
    Alerts: ['Overdue Return', 'Audit Discrepancy'],
    Approvals: ['Maintenance Approved', 'Maintenance Rejected', 'Transfer Approved'],
    Bookings: ['Booking Confirmed', 'Booking Cancelled', 'Booking Reminder'],
};

exports.getNotifications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const offset = (page - 1) * limit;

        const where = { user_id: req.user.id };
        if (req.query.type && TYPE_GROUPS[req.query.type]) where.type = { [Op.in]: TYPE_GROUPS[req.query.type] };
        else if (req.query.type && req.query.type !== 'All') where.type = req.query.type;
        if (req.query.is_read !== undefined && req.query.is_read !== '') where.is_read = req.query.is_read === 'true';

        const { count, rows } = await Notification.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });
        res.json({ success: true, data: rows, meta: { total: count, page, limit } });
    } catch (error) { next(error); }
};

exports.getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.count({ where: { user_id: req.user.id, is_read: false } });
        res.json({ success: true, data: { count } });
    } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!notification) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
        await notification.update({ is_read: true });
        res.json({ success: true, data: notification });
    } catch (error) { next(error); }
};

exports.markAllRead = async (req, res, next) => {
    try {
        await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) { next(error); }
};
