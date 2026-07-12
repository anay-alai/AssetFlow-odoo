const { Asset, AssetCategory, Department, Allocation, MaintenanceRequest } = require('../models');
const { Op } = require('sequelize');

exports.getAssets = async (req, res, next) => {
    try {
        const assets = await Asset.findAll({ include: [AssetCategory, Department] });
        res.json({ success: true, data: assets });
    } catch (error) { next(error); }
};

exports.createAsset = async (req, res, next) => {
    try {
        const asset = await Asset.create(req.body);
        res.status(201).json({ success: true, data: asset });
    } catch (error) { next(error); }
};

exports.getAssetById = async (req, res, next) => {
    try {
        const asset = await Asset.findByPk(req.params.id, { include: [AssetCategory, Department] });
        if (!asset) return res.status(404).json({ success: false, error: { message: 'Asset not found' } });
        res.json({ success: true, data: asset });
    } catch (error) { next(error); }
};

exports.searchAssets = async (req, res, next) => {
    try {
        const { tag, serial, category, status, department, location } = req.query;
        const where = {};
        if (tag) where.asset_tag = { [Op.like]: `%${tag}%` };
        if (serial) where.serial_number = { [Op.like]: `%${serial}%` };
        if (category) where.category_id = category;
        if (status) where.status = status;
        if (department) where.department_id = department;
        if (location) where.location = { [Op.like]: `%${location}%` };
        
        const assets = await Asset.findAll({ where, include: [AssetCategory, Department] });
        res.json({ success: true, data: assets });
    } catch (error) { next(error); }
};

exports.updateAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findByPk(req.params.id);
        if (!asset) return res.status(404).json({ success: false, error: { message: 'Asset not found' } });
        await asset.update(req.body);
        res.json({ success: true, data: asset });
    } catch (error) { next(error); }
};

exports.getAssetHistory = async (req, res, next) => {
    try {
        const allocations = await Allocation.findAll({ where: { asset_id: req.params.id }, include: ['Employee', 'Department'] });
        const maintenance = await MaintenanceRequest.findAll({ where: { asset_id: req.params.id }, include: ['Raiser', 'Approver'] });
        res.json({ success: true, data: { allocations, maintenance } });
    } catch (error) { next(error); }
};