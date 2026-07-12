const { Allocation, Asset, TransferRequest, User, sequelize } = require('../models');

exports.createAllocation = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { asset_id, employee_id, department_id, expected_return_date } = req.body;
        
        const existingAllocation = await Allocation.findOne({ where: { asset_id, status: 'active' }, include: ['Employee', 'Department'], transaction: t });
        
        if (existingAllocation) {
            await t.rollback();
            return res.status(409).json({ 
                success: false, 
                error: { 
                    code: 'ALREADY_ALLOCATED', 
                    message: 'Asset is already allocated',
                    currentHolder: existingAllocation.Employee || existingAllocation.Department,
                    suggestedAction: 'transfer_request'
                } 
            });
        }

        const allocation = await Allocation.create({ asset_id, employee_id, department_id, expected_return_date }, { transaction: t });
        await Asset.update({ status: 'Allocated' }, { where: { id: asset_id }, transaction: t });
        
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
            return res.status(404).json({ success: false, error: { message: 'Active allocation not found' } });
        }

        await allocation.update({ status: 'returned', actual_return_date: new Date(), return_condition_notes }, { transaction: t });
        await Asset.update({ status: 'Available' }, { where: { id: allocation.asset_id }, transaction: t });
        
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
        if (!activeAllocation) return res.status(400).json({ success: false, error: { message: 'Asset is not actively allocated' } });
        
        const from_user_id = activeAllocation.employee_id;
        
        const tr = await TransferRequest.create({ asset_id, from_user_id, to_user_id, requested_by, reason });
        res.status(201).json({ success: true, data: tr });
    } catch (error) { next(error); }
};

exports.approveTransferRequest = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const tr = await TransferRequest.findByPk(req.params.id, { transaction: t });
        if (!tr || tr.status !== 'Requested') {
            await t.rollback();
            return res.status(404).json({ success: false, error: { message: 'Pending transfer request not found' } });
        }
        
        const activeAllocation = await Allocation.findOne({ where: { asset_id: tr.asset_id, status: 'active' }, transaction: t });
        if (activeAllocation) {
            await activeAllocation.update({ status: 'returned', actual_return_date: new Date() }, { transaction: t });
        }
        
        const newAllocation = await Allocation.create({
            asset_id: tr.asset_id,
            employee_id: tr.to_user_id,
            allocated_date: new Date()
        }, { transaction: t });
        
        await tr.update({ status: 'Approved', approved_by: req.user.id }, { transaction: t });
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
        if (!tr || tr.status !== 'Requested') return res.status(404).json({ success: false, error: { message: 'Pending transfer request not found' } });
        
        await tr.update({ status: 'Rejected', approved_by: req.user.id });
        res.json({ success: true, data: tr });
    } catch (error) { next(error); }
};\n