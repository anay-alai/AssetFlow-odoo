const { Asset, Allocation, MaintenanceRequest, Department, sequelize } = require('../models');

exports.getUtilization = async (req, res, next) => {
    try {
        const stats = await Asset.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['status']
        });
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
};

exports.getMaintenanceFrequency = async (req, res, next) => {
    try {
        const stats = await MaintenanceRequest.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['status']
        });
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
};