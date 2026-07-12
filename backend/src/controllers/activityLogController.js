const { ActivityLog } = require('../models');
const { Op } = require('sequelize');

exports.getActivityLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const offset = (page - 1) * limit;

        const where = {};
        if (req.query.entity_type) where.entity_type = req.query.entity_type;
        if (req.query.user_id) where.user_id = req.query.user_id;
        if (req.query.from || req.query.to) {
            where.created_at = {};
            if (req.query.from) where.created_at[Op.gte] = new Date(req.query.from);
            if (req.query.to) where.created_at[Op.lte] = new Date(req.query.to);
        }

        const { count, rows } = await ActivityLog.findAndCountAll({
            where,
            include: ['User'],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        res.json({ success: true, data: rows, meta: { total: count, page, limit, pages: Math.ceil(count / limit) } });
    } catch (error) { next(error); }
};
