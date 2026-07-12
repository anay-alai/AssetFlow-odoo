const { Asset, Allocation, Booking, MaintenanceRequest, ActivityLog, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getKPIs = async (req, res, next) => {
    try {
        const totalAssets = await Asset.count();
        const allocatedAssets = await Asset.count({ where: { status: 'Allocated' } });
        const maintenanceAssets = await Asset.count({ where: { status: 'Under Maintenance' } });
        const availableAssets = await Asset.count({ where: { status: 'Available' } });
        
        res.json({ success: true, data: { totalAssets, allocatedAssets, maintenanceAssets, availableAssets } });
    } catch (error) { next(error); }
};

exports.getRecentActivity = async (req, res, next) => {
    try {
        const activities = await ActivityLog.findAll({ limit: 10, order: [['created_at', 'DESC']], include: ['User'] });
        res.json({ success: true, data: activities });
    } catch (error) { next(error); }
};

exports.getOverdue = async (req, res, next) => {
    try {
        const overdueAllocations = await Allocation.findAll({
            where: { status: 'active', expected_return_date: { [Op.lt]: new Date() } },
            include: ['Asset', 'Employee']
        });
        res.json({ success: true, data: overdueAllocations });
    } catch (error) { next(error); }
};