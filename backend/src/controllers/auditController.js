const { AuditCycle, AuditItem, Asset, sequelize } = require('../models');

exports.createCycle = async (req, res, next) => {
    try {
        const { name, scope_department_id, scope_location, start_date, end_date } = req.body;
        const cycle = await AuditCycle.create({
            name, scope_department_id, scope_location, start_date, end_date, created_by: req.user.id
        });
        res.status(201).json({ success: true, data: cycle });
    } catch (error) { next(error); }
};

exports.assignAuditors = async (req, res, next) => {
    try {
        const cycle = await AuditCycle.findByPk(req.params.id);
        if (!cycle) return res.status(404).json({ success: false, error: { message: 'Audit cycle not found' } });
        
        const { auditor_ids } = req.body;
        await cycle.addAuditors(auditor_ids);
        res.json({ success: true, message: 'Auditors assigned' });
    } catch (error) { next(error); }
};

exports.verifyItem = async (req, res, next) => {
    try {
        const { verification_status, notes } = req.body;
        const item = await AuditItem.findByPk(req.params.id);
        if (!item) return res.status(404).json({ success: false, error: { message: 'Audit item not found' } });
        
        await item.update({ verification_status, notes, verified_at: new Date(), auditor_id: req.user.id });
        res.json({ success: true, data: item });
    } catch (error) { next(error); }
};

exports.closeCycle = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const cycle = await AuditCycle.findByPk(req.params.id, { transaction: t });
        if (!cycle || cycle.status === 'Closed') {
            await t.rollback();
            return res.status(400).json({ success: false, error: { message: 'Cycle not open or not found' } });
        }
        
        await cycle.update({ status: 'Closed' }, { transaction: t });
        
        const missingItems = await AuditItem.findAll({ where: { audit_cycle_id: cycle.id, verification_status: 'Missing' }, transaction: t });
        for (const item of missingItems) {
            await Asset.update({ status: 'Lost' }, { where: { id: item.asset_id }, transaction: t });
        }
        
        await t.commit();
        res.json({ success: true, message: 'Cycle closed successfully' });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};\n