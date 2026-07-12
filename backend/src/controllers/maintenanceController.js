const { MaintenanceRequest, Asset, sequelize } = require('../models');

exports.createRequest = async (req, res, next) => {
    try {
        const { asset_id, issue_description, priority, photo_url } = req.body;
        const reqs = await MaintenanceRequest.create({
            asset_id, raised_by: req.user.id, issue_description, priority, photo_url
        });
        // Note: Asset status does NOT flip to Under Maintenance on creation (Pending)
        res.status(201).json({ success: true, data: reqs });
    } catch (error) { next(error); }
};

exports.approveRequest = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const reqs = await MaintenanceRequest.findByPk(req.params.id, { transaction: t });
        if (!reqs || reqs.status !== 'Pending') {
            await t.rollback();
            return res.status(404).json({ success: false, error: { message: 'Pending request not found' } });
        }
        
        await reqs.update({ status: 'Approved', approved_by: req.user.id }, { transaction: t });
        await Asset.update({ status: 'Under Maintenance' }, { where: { id: reqs.asset_id }, transaction: t });
        
        await t.commit();
        res.json({ success: true, data: reqs });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.rejectRequest = async (req, res, next) => {
    try {
        const reqs = await MaintenanceRequest.findByPk(req.params.id);
        if (!reqs) return res.status(404).json({ success: false, error: { message: 'Request not found' } });
        await reqs.update({ status: 'Rejected', approved_by: req.user.id });
        res.json({ success: true, data: reqs });
    } catch (error) { next(error); }
};

exports.resolveRequest = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const reqs = await MaintenanceRequest.findByPk(req.params.id, { transaction: t });
        if (!reqs) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { message: 'Request not found' } });
        }
        
        const { resolution_notes } = req.body;
        await reqs.update({ status: 'Resolved', resolution_notes }, { transaction: t });
        
        // Revert asset status. Simplified: Available.
        await Asset.update({ status: 'Available' }, { where: { id: reqs.asset_id }, transaction: t });
        
        await t.commit();
        res.json({ success: true, data: reqs });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};\n