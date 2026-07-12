const { Allocation, Asset, TransferRequest, User, Department, sequelize } = require('../models');
const { notify } = require('../services/notification.service');
const { logActivity } = require('../utils/activityLogger');

exports.createAllocation = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { asset_id, employee_id, department_id, expected_return_date } = req.body;

        if (!employee_id && !department_id) {
            await t.rollback();
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Either employee_id or department_id is required' } });
        }

        // Lock the asset row so concurrent allocations serialize.
        const asset = await Asset.findByPk(asset_id, { lock: t.LOCK.UPDATE, transaction: t });
        if (!asset) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Asset not found' } });
        }

        const existingAllocation = await Allocation.findOne({
            where: { asset_id, status: 'active' },
            include: ['Employee', 'Department'],
            transaction: t,
        });

        if (existingAllocation) {
            await t.rollback();
            return res.status(409).json({
                success: false,
                error: {
                    code: 'ALREADY_ALLOCATED',
                    message: 'Asset is already allocated',
                    details: {
                        currentHolder: existingAllocation.Employee
                            ? { type: 'employee', id: existingAllocation.Employee.id, name: existingAllocation.Employee.name }
                            : existingAllocation.Department
                                ? { type: 'department', id: existingAllocation.Department.id, name: existingAllocation.Department.name }
                                : null,
                        suggestedAction: 'transfer_request',
                    },
                },
            });
        }

        const allocation = await Allocation.create(
            { asset_id, employee_id, department_id, allocated_date: new Date(), expected_return_date },
            { transaction: t }
        );
        await asset.update({ status: 'Allocated' }, { transaction: t });

        await logActivity({ user_id: req.user.id, action: 'asset.allocated', entity_type: 'Allocation', entity_id: allocation.id, metadata: { asset_id, employee_id, department_id } }, t);
        await notify({
            user_id: employee_id,
            type: 'Asset Assigned',
            message: `Asset ${asset.asset_tag} has been assigned to you.`,
            related_entity_type: 'Allocation',
            related_entity_id: allocation.id,
        }, t);

        await t.commit();
        res.status(201).json({ success: true, data: allocation });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.returnAllocation = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { return_condition_notes } = req.body;

        const allocation = await Allocation.findByPk(id, { transaction: t });
        if (!allocation || allocation.status === 'returned') {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Active allocation not found' } });
        }

        await allocation.update({ status: 'returned', actual_return_date: new Date(), return_condition_notes }, { transaction: t });

        // Edge case: if the asset is Under Maintenance (pending maintenance reconciliation),
        // do NOT force it back to Available — leave the maintenance module to restore state.
        const asset = await Asset.findByPk(allocation.asset_id, { transaction: t });
        if (asset && asset.status !== 'Under Maintenance') {
            await asset.update({ status: 'Available' }, { transaction: t });
        }

        await logActivity({ user_id: req.user.id, action: 'asset.returned', entity_type: 'Allocation', entity_id: allocation.id }, t);

        await t.commit();
        res.json({ success: true, data: allocation });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.createTransferRequest = async (req, res, next) => {
    try {
        const { asset_id, to_user_id, reason } = req.body;
        const requested_by = req.user.id;

        const activeAllocation = await Allocation.findOne({ where: { asset_id, status: 'active' } });
        if (!activeAllocation) {
            return res.status(400).json({ success: false, error: { code: 'NOT_ALLOCATED', message: 'Asset is not actively allocated; allocate it directly instead.' } });
        }

        const from_user_id = activeAllocation.employee_id;
        const tr = await TransferRequest.create({ asset_id, from_user_id, to_user_id, requested_by, reason });

        await logActivity({ user_id: req.user.id, action: 'transfer.requested', entity_type: 'TransferRequest', entity_id: tr.id, metadata: { asset_id, to_user_id } });
        res.status(201).json({ success: true, data: tr });
    } catch (error) { next(error); }
};

exports.approveTransferRequest = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const tr = await TransferRequest.findByPk(req.params.id, { transaction: t });
        if (!tr || tr.status !== 'Requested') {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pending transfer request not found' } });
        }

        const asset = await Asset.findByPk(tr.asset_id, { lock: t.LOCK.UPDATE, transaction: t });

        const activeAllocation = await Allocation.findOne({ where: { asset_id: tr.asset_id, status: 'active' }, transaction: t });
        if (activeAllocation) {
            await activeAllocation.update({ status: 'returned', actual_return_date: new Date() }, { transaction: t });
        }

        const newAllocation = await Allocation.create(
            { asset_id: tr.asset_id, employee_id: tr.to_user_id, allocated_date: new Date() },
            { transaction: t }
        );
        if (asset) await asset.update({ status: 'Allocated' }, { transaction: t });

        await tr.update({ status: 'Reallocated', approved_by: req.user.id }, { transaction: t });

        await logActivity({ user_id: req.user.id, action: 'transfer.approved', entity_type: 'TransferRequest', entity_id: tr.id }, t);
        // Notify both parties.
        await notify({ user_id: tr.to_user_id, type: 'Transfer Approved', message: `A transfer of asset #${tr.asset_id} to you was approved.`, related_entity_type: 'Allocation', related_entity_id: newAllocation.id }, t);
        if (tr.from_user_id) {
            await notify({ user_id: tr.from_user_id, type: 'Transfer Approved', message: `Asset #${tr.asset_id} has been transferred away from you.`, related_entity_type: 'TransferRequest', related_entity_id: tr.id }, t);
        }

        await t.commit();
        res.json({ success: true, data: { transfer: tr, allocation: newAllocation } });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.rejectTransferRequest = async (req, res, next) => {
    try {
        const tr = await TransferRequest.findByPk(req.params.id);
        if (!tr || tr.status !== 'Requested') {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pending transfer request not found' } });
        }

        await tr.update({ status: 'Rejected', approved_by: req.user.id });
        await logActivity({ user_id: req.user.id, action: 'transfer.rejected', entity_type: 'TransferRequest', entity_id: tr.id });
        if (tr.requested_by) {
            await notify({ user_id: tr.requested_by, type: 'Transfer Approved', message: `Your transfer request for asset #${tr.asset_id} was rejected.`, related_entity_type: 'TransferRequest', related_entity_id: tr.id });
        }
        res.json({ success: true, data: tr });
    } catch (error) { next(error); }
};

exports.getAllocationHistory = async (req, res, next) => {
    try {
        const history = await Allocation.findAll({
            where: { asset_id: req.params.id },
            include: ['Employee', 'Department'],
            order: [['allocated_date', 'DESC']],
        });
        res.json({ success: true, data: history });
    } catch (error) { next(error); }
};
