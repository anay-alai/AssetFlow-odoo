const { MaintenanceRequest, Asset, Allocation, sequelize } = require('../models');
const { notify } = require('../services/notification.service');
const { logActivity } = require('../utils/activityLogger');

// List — supports ?groupBy=status for the Kanban board and ?status= / ?priority= filters.
exports.getRequests = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.priority) where.priority = req.query.priority;
        if (req.query.asset_id) where.asset_id = req.query.asset_id;

        const requests = await MaintenanceRequest.findAll({
            where,
            include: ['Asset', 'Raiser', 'Approver'],
            order: [['created_at', 'DESC']],
        });

        if (req.query.groupBy === 'status') {
            const columns = ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved', 'Rejected'];
            const grouped = Object.fromEntries(columns.map((c) => [c, []]));
            for (const r of requests) (grouped[r.status] = grouped[r.status] || []).push(r);
            return res.json({ success: true, data: grouped });
        }
        res.json({ success: true, data: requests });
    } catch (error) { next(error); }
};

exports.createRequest = async (req, res, next) => {
    try {
        const { asset_id, issue_description, priority } = req.body;
        const photo_url = req.file ? `/uploads/${req.file.filename}` : req.body.photo_url;
        // Rule: creating a request does NOT change asset.status.
        const reqs = await MaintenanceRequest.create({ asset_id, raised_by: req.user.id, issue_description, priority, photo_url });
        await logActivity({ user_id: req.user.id, action: 'maintenance.raised', entity_type: 'MaintenanceRequest', entity_id: reqs.id, metadata: { asset_id } });
        res.status(201).json({ success: true, data: reqs });
    } catch (error) { next(error); }
};

exports.approveRequest = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const reqs = await MaintenanceRequest.findByPk(req.params.id, { transaction: t });
        if (!reqs || reqs.status !== 'Pending') {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pending request not found' } });
        }

        const asset = await Asset.findByPk(reqs.asset_id, { lock: t.LOCK.UPDATE, transaction: t });
        // Snapshot the current status so resolve can restore it (Available vs Allocated).
        await asset.update({ prior_status: asset.status, status: 'Under Maintenance' }, { transaction: t });
        await reqs.update({ status: 'Approved', approved_by: req.user.id }, { transaction: t });

        await logActivity({ user_id: req.user.id, action: 'maintenance.approved', entity_type: 'MaintenanceRequest', entity_id: reqs.id }, t);
        await notify({ user_id: reqs.raised_by, type: 'Maintenance Approved', message: `Your maintenance request for ${asset.asset_tag} was approved.`, related_entity_type: 'MaintenanceRequest', related_entity_id: reqs.id }, t);

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
        if (!reqs) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
        await reqs.update({ status: 'Rejected', approved_by: req.user.id });
        await logActivity({ user_id: req.user.id, action: 'maintenance.rejected', entity_type: 'MaintenanceRequest', entity_id: reqs.id });
        await notify({ user_id: reqs.raised_by, type: 'Maintenance Rejected', message: `Your maintenance request #${reqs.id} was rejected.`, related_entity_type: 'MaintenanceRequest', related_entity_id: reqs.id });
        res.json({ success: true, data: reqs });
    } catch (error) { next(error); }
};

exports.assignTechnician = async (req, res, next) => {
    try {
        const { technician_name } = req.body;
        const reqs = await MaintenanceRequest.findByPk(req.params.id);
        if (!reqs) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
        await reqs.update({ technician_name, status: 'Technician Assigned' });
        await logActivity({ user_id: req.user.id, action: 'maintenance.technician_assigned', entity_type: 'MaintenanceRequest', entity_id: reqs.id, metadata: { technician_name } });
        res.json({ success: true, data: reqs });
    } catch (error) { next(error); }
};

exports.startRequest = async (req, res, next) => {
    try {
        const reqs = await MaintenanceRequest.findByPk(req.params.id);
        if (!reqs) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
        await reqs.update({ status: 'In Progress' });
        await logActivity({ user_id: req.user.id, action: 'maintenance.started', entity_type: 'MaintenanceRequest', entity_id: reqs.id });
        res.json({ success: true, data: reqs });
    } catch (error) { next(error); }
};

exports.resolveRequest = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const reqs = await MaintenanceRequest.findByPk(req.params.id, { transaction: t });
        if (!reqs) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
        }

        const { resolution_notes } = req.body;
        await reqs.update({ status: 'Resolved', resolution_notes }, { transaction: t });

        // Restore the asset to its pre-maintenance state using the snapshot.
        const asset = await Asset.findByPk(reqs.asset_id, { lock: t.LOCK.UPDATE, transaction: t });
        if (asset && asset.status === 'Under Maintenance') {
            let restore = asset.prior_status || 'Available';
            // Safety: if there is still an active allocation, it must show Allocated.
            const active = await Allocation.findOne({ where: { asset_id: asset.id, status: 'active' }, transaction: t });
            if (active) restore = 'Allocated';
            else if (restore === 'Under Maintenance') restore = 'Available';
            await asset.update({ status: restore, prior_status: null }, { transaction: t });
        }

        await logActivity({ user_id: req.user.id, action: 'maintenance.resolved', entity_type: 'MaintenanceRequest', entity_id: reqs.id }, t);
        await notify({ user_id: reqs.raised_by, type: 'Maintenance Approved', message: `Maintenance for request #${reqs.id} is resolved.`, related_entity_type: 'MaintenanceRequest', related_entity_id: reqs.id }, t);

        await t.commit();
        res.json({ success: true, data: reqs });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};
