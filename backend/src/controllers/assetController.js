const { Asset, AssetCategory, Department, Allocation, MaintenanceRequest, sequelize } = require('../models');
const { Op } = require('sequelize');
const { generateAssetTag } = require('../utils/assetTagGenerator');
const { generateQrCode } = require('../utils/qrCodeGenerator');
const { logActivity } = require('../utils/activityLogger');

// Build a Sequelize where-clause from query filters shared by list + search.
function buildAssetFilter(q) {
    const where = {};
    if (q.tag) where.asset_tag = { [Op.like]: `%${q.tag}%` };
    if (q.serial_number || q.serial) where.serial_number = { [Op.like]: `%${q.serial_number || q.serial}%` };
    if (q.category_id || q.category) where.category_id = q.category_id || q.category;
    if (q.status) where.status = q.status;
    if (q.department_id || q.department) where.department_id = q.department_id || q.department;
    if (q.location) where.location = { [Op.like]: `%${q.location}%` };
    return where;
}

exports.getAssets = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows } = await Asset.findAndCountAll({
            where: buildAssetFilter(req.query),
            include: [AssetCategory, Department],
            order: [['id', 'DESC']],
            limit,
            offset,
        });

        res.json({
            success: true,
            data: rows,
            meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
        });
    } catch (error) { next(error); }
};

exports.createAsset = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const body = { ...req.body };
        // Client must never set the tag or status directly.
        delete body.asset_tag;
        delete body.status;
        delete body.prior_status;

        // multer uploads (fields: photo, documents[])
        if (req.files && req.files.photo && req.files.photo[0]) {
            body.photo_url = `/uploads/${req.files.photo[0].filename}`;
        } else if (req.file) {
            body.photo_url = `/uploads/${req.file.filename}`;
        }
        if (req.files && req.files.documents) {
            body.documents = req.files.documents.map((f) => `/uploads/${f.filename}`);
        }

        const asset_tag = await generateAssetTag(t);
        const asset = await Asset.create(
            { ...body, asset_tag, status: 'Available' },
            { transaction: t }
        );

        // Attach a QR payload once we know the id.
        asset.qr_code = await generateQrCode({ asset_tag, id: asset.id });
        await asset.save({ transaction: t });

        await logActivity(
            { user_id: req.user.id, action: 'asset.registered', entity_type: 'Asset', entity_id: asset.id, metadata: { asset_tag } },
            t
        );

        await t.commit();
        res.status(201).json({ success: true, data: asset });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

// Return the asset's QR code data URI, generating + backfilling it if missing
// (seeded assets don't have one until first requested).
exports.getAssetQr = async (req, res, next) => {
    try {
        const asset = await Asset.findByPk(req.params.id);
        if (!asset) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Asset not found' } });
        let qr = asset.qr_code;
        if (!qr) {
            qr = await generateQrCode({ asset_tag: asset.asset_tag, id: asset.id });
            await asset.update({ qr_code: qr });
        }
        res.json({ success: true, data: { qr, asset_tag: asset.asset_tag } });
    } catch (error) { next(error); }
};

exports.getAssetById = async (req, res, next) => {
    try {
        const asset = await Asset.findByPk(req.params.id, { include: [AssetCategory, Department] });
        if (!asset) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Asset not found' } });
        res.json({ success: true, data: asset });
    } catch (error) { next(error); }
};

exports.searchAssets = async (req, res, next) => {
    try {
        const q = (req.query.q || '').trim();
        let where;
        if (q) {
            where = {
                [Op.or]: [
                    { asset_tag: { [Op.like]: `%${q}%` } },
                    { serial_number: { [Op.like]: `%${q}%` } },
                    { name: { [Op.like]: `%${q}%` } },
                ],
            };
        } else {
            where = buildAssetFilter(req.query);
        }
        const assets = await Asset.findAll({ where, include: [AssetCategory, Department], limit: 50 });
        res.json({ success: true, data: assets });
    } catch (error) { next(error); }
};

exports.updateAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findByPk(req.params.id);
        if (!asset) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Asset not found' } });

        const body = { ...req.body };
        // Status transitions go through allocation/maintenance/audit endpoints only.
        delete body.status;
        delete body.prior_status;
        delete body.asset_tag;

        await asset.update(body);
        await logActivity({ user_id: req.user.id, action: 'asset.updated', entity_type: 'Asset', entity_id: asset.id });
        res.json({ success: true, data: asset });
    } catch (error) { next(error); }
};

// Merged, time-ordered history combining allocation + maintenance events.
exports.getAssetHistory = async (req, res, next) => {
    try {
        const assetId = req.params.id;
        const allocations = await Allocation.findAll({ where: { asset_id: assetId }, include: ['Employee', 'Department'] });
        const maintenance = await MaintenanceRequest.findAll({ where: { asset_id: assetId }, include: ['Raiser', 'Approver'] });

        const events = [];
        for (const a of allocations) {
            const who = a.Employee ? a.Employee.name : (a.Department ? a.Department.name : 'unassigned');
            events.push({ type: 'allocation', date: a.allocated_date, description: `Allocated to ${who}` });
            if (a.actual_return_date) {
                events.push({ type: 'return', date: a.actual_return_date, description: `Returned by ${who}` });
            }
        }
        for (const m of maintenance) {
            events.push({ type: 'maintenance_raised', date: m.created_at, description: `Maintenance raised: ${m.issue_description}` });
            if (m.status === 'Resolved') {
                events.push({ type: 'maintenance_resolved', date: m.updated_at, description: `Maintenance resolved${m.resolution_notes ? ': ' + m.resolution_notes : ''}` });
            }
        }
        events.sort((x, y) => new Date(x.date) - new Date(y.date));

        res.json({ success: true, data: events });
    } catch (error) { next(error); }
};
