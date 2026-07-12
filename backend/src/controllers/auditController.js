const { AuditCycle, AuditItem, Asset, sequelize } = require('../models');
const { Op } = require('sequelize');
const { notify } = require('../services/notification.service');
const { logActivity } = require('../utils/activityLogger');

exports.getCycles = async (req, res, next) => {
    try {
        const cycles = await AuditCycle.findAll({ include: ['Creator', 'ScopeDepartment', 'Auditors'], order: [['id', 'DESC']] });
        res.json({ success: true, data: cycles });
    } catch (error) { next(error); }
};

exports.getCycleItems = async (req, res, next) => {
    try {
        const items = await AuditItem.findAll({ where: { audit_cycle_id: req.params.id }, include: ['Asset', 'Auditor'] });
        res.json({ success: true, data: items });
    } catch (error) { next(error); }
};

exports.createCycle = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { name, scope_department_id, scope_location, start_date, end_date } = req.body;
        const cycle = await AuditCycle.create(
            { name, scope_department_id, scope_location, start_date, end_date, created_by: req.user.id },
            { transaction: t }
        );

        // Auto-populate audit_items for every asset matching the scope.
        const where = {};
        if (scope_department_id) where.department_id = scope_department_id;
        if (scope_location) where.location = { [Op.like]: `%${scope_location}%` };
        const assets = await Asset.findAll({ where, transaction: t });

        if (assets.length) {
            await AuditItem.bulkCreate(
                assets.map((a) => ({ audit_cycle_id: cycle.id, asset_id: a.id, verification_status: 'Pending' })),
                { transaction: t }
            );
        }

        await logActivity({ user_id: req.user.id, action: 'audit.cycle_created', entity_type: 'AuditCycle', entity_id: cycle.id, metadata: { items: assets.length } }, t);
        await t.commit();
        res.status(201).json({ success: true, data: cycle, meta: { items_created: assets.length } });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

exports.assignAuditors = async (req, res, next) => {
    try {
        const cycle = await AuditCycle.findByPk(req.params.id);
        if (!cycle) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Audit cycle not found' } });

        const { auditor_ids } = req.body;
        await cycle.addAuditors(auditor_ids);
        for (const uid of auditor_ids) {
            await notify({ user_id: uid, type: 'Audit Discrepancy', message: `You have been assigned as an auditor on "${cycle.name}".`, related_entity_type: 'AuditCycle', related_entity_id: cycle.id });
        }
        res.json({ success: true, message: 'Auditors assigned' });
    } catch (error) { next(error); }
};

exports.verifyItem = async (req, res, next) => {
    try {
        const { verification_status, notes } = req.body;
        const item = await AuditItem.findByPk(req.params.id, { include: [{ model: AuditCycle }] });
        if (!item) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Audit item not found' } });

        const cycle = item.AuditCycle || (await AuditCycle.findByPk(item.audit_cycle_id));
        if (cycle.status === 'Closed') {
            return res.status(409).json({ success: false, error: { code: 'CYCLE_CLOSED', message: 'This audit cycle is closed; items can no longer be edited.' } });
        }

        // Gate to assigned auditors (admin / asset_manager may override).
        if (!['admin', 'asset_manager'].includes(req.user.role)) {
            const isAuditor = await cycle.hasAuditor(req.user.id);
            if (!isAuditor) {
                return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not an assigned auditor on this cycle.' } });
            }
        }

        await item.update({ verification_status, notes, verified_at: new Date(), auditor_id: req.user.id });
        await logActivity({ user_id: req.user.id, action: 'audit.item_verified', entity_type: 'AuditItem', entity_id: item.id, metadata: { verification_status } });
        res.json({ success: true, data: item });
    } catch (error) { next(error); }
};

exports.discrepancyReport = async (req, res, next) => {
    try {
        const items = await AuditItem.findAll({
            where: { audit_cycle_id: req.params.id, verification_status: { [Op.in]: ['Missing', 'Damaged'] } },
            include: ['Asset', 'Auditor'],
        });
        res.json({ success: true, data: items, meta: { count: items.length } });
    } catch (error) { next(error); }
};

exports.closeCycle = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const cycle = await AuditCycle.findByPk(req.params.id, { transaction: t });
        if (!cycle) {
            await t.rollback();
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Audit cycle not found' } });
        }
        // Idempotency guard.
        if (cycle.status === 'Closed') {
            await t.rollback();
            return res.status(409).json({ success: false, error: { code: 'ALREADY_CLOSED', message: 'Audit cycle is already closed.' } });
        }

        // Missing -> asset.status = 'Lost'. Damaged -> untouched (needs a maintenance request).
        const missingItems = await AuditItem.findAll({ where: { audit_cycle_id: cycle.id, verification_status: 'Missing' }, transaction: t });
        for (const item of missingItems) {
            await Asset.update({ status: 'Lost' }, { where: { id: item.asset_id }, transaction: t });
            await notify({ user_id: cycle.created_by, type: 'Audit Discrepancy', message: `Asset #${item.asset_id} marked Lost after audit "${cycle.name}".`, related_entity_type: 'Asset', related_entity_id: item.asset_id }, t);
        }

        await cycle.update({ status: 'Closed' }, { transaction: t });
        await logActivity({ user_id: req.user.id, action: 'audit.cycle_closed', entity_type: 'AuditCycle', entity_id: cycle.id, metadata: { lost: missingItems.length } }, t);

        await t.commit();
        res.json({ success: true, message: 'Cycle closed successfully', meta: { assets_marked_lost: missingItems.length } });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};
