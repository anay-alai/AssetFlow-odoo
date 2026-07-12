const { Asset, Allocation, Booking, MaintenanceRequest, TransferRequest, ActivityLog } = require('../models');
const { Op } = require('sequelize');

exports.getKPIs = async (req, res, next) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [
            available, allocated, underMaintenance, totalAssets, maintenanceToday, activeBookings, pendingTransfers, upcomingReturns,
        ] = await Promise.all([
            Asset.count({ where: { status: 'Available' } }),
            Asset.count({ where: { status: 'Allocated' } }),
            Asset.count({ where: { status: 'Under Maintenance' } }),
            Asset.count(),
            MaintenanceRequest.count({
                where: {
                    status: { [Op.in]: ['Approved', 'Technician Assigned', 'In Progress'] },
                    updatedAt: { [Op.between]: [startOfToday, endOfToday] },
                },
            }),
            Booking.count({ where: { status: { [Op.in]: ['Upcoming', 'Ongoing'] } } }),
            TransferRequest.count({ where: { status: 'Requested' } }),
            Allocation.count({ where: { status: 'active', expected_return_date: { [Op.between]: [now, in7Days] } } }),
        ]);

        res.json({
            success: true,
            data: {
                assetsAvailable: available,
                assetsAllocated: allocated,
                assetsUnderMaintenance: underMaintenance,
                totalAssets,
                maintenanceToday,
                activeBookings,
                pendingTransfers,
                upcomingReturns,
            },
        });
    } catch (error) { next(error); }
};

exports.getRecentActivity = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 15;
        const activities = await ActivityLog.findAll({ limit, order: [['created_at', 'DESC']], include: ['User'] });
        res.json({ success: true, data: activities });
    } catch (error) { next(error); }
};

exports.getOverdue = async (req, res, next) => {
    try {
        const overdue = await Allocation.findAll({
            where: { status: 'active', expected_return_date: { [Op.lt]: new Date() } },
            include: ['Asset', 'Employee'],
            order: [['expected_return_date', 'ASC']],
        });
        res.json({ success: true, data: overdue });
    } catch (error) { next(error); }
};
