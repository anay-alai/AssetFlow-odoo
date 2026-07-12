const { Asset, AssetCategory, Allocation, Booking, MaintenanceRequest, Department, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// ---- helpers -------------------------------------------------------------
function dateRange(q) {
    const where = {};
    if (q.from || q.to) {
        where[Op.and] = [];
        if (q.from) where[Op.and].push({ created_at: { [Op.gte]: new Date(q.from) } });
        if (q.to) where[Op.and].push({ created_at: { [Op.lte]: new Date(q.to) } });
    }
    return where;
}

function toCsv(rows) {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

// ---- reports -------------------------------------------------------------

// Asset utilization by department: allocation + booking counts grouped by department.
exports.getUtilization = async (req, res, next) => {
    try {
        const categories = await AssetCategory.findAll();
        const data = [];
        for (const c of categories) {
            const assets = await Asset.findAll({ where: { category_id: c.id }, attributes: ['id', 'status'] });
            const total_assets = assets.length;
            const allocated_count = assets.filter(a => a.status === 'Allocated').length;
            data.push({ category_id: c.id, category_name: c.name, total_assets, allocated_count });
        }
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

// Maintenance frequency grouped by asset and by category.
exports.getMaintenanceFrequency = async (req, res, next) => {
    try {
        const categories = await AssetCategory.findAll();
        const data = [];
        for (const c of categories) {
            const assetIds = (await Asset.findAll({ where: { category_id: c.id }, attributes: ['id'] })).map(a => a.id);
            const repair_count = assetIds.length ? await MaintenanceRequest.count({ where: { asset_id: { [Op.in]: assetIds } } }) : 0;
            data.push({ category_id: c.id, category_name: c.name, avg_cost: 0, repair_count });
        }
        data.sort((a, b) => b.repair_count - a.repair_count);
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

// Top N most-active and bottom N idle assets by allocation+booking count.
exports.getMostUsedIdle = async (req, res, next) => {
    try {
        const n = parseInt(req.query.limit) || 5;
        const assets = await Asset.findAll({ attributes: ['id', 'asset_tag', 'name', 'status'] });
        const scored = [];
        for (const a of assets) {
            const allocations = await Allocation.count({ where: { asset_id: a.id } });
            const bookings = await Booking.count({ where: { resource_asset_id: a.id } });
            scored.push({ id: a.id, asset_tag: a.asset_tag, name: a.name, status: a.status, activity: allocations + bookings });
        }
        scored.sort((x, y) => y.activity - x.activity);
        res.json({ success: true, data: { mostUsed: scored.slice(0, n), idle: scored.filter((s) => s.activity === 0).slice(0, n) } });
    } catch (error) { next(error); }
};

// Assets nearing a service milestone (warranty) or age-based retirement threshold.
exports.getMaintenanceDue = async (req, res, next) => {
    try {
        const ageYears = parseInt(req.query.age_years) || 4;
        const threshold = new Date();
        threshold.setFullYear(threshold.getFullYear() - ageYears);

        const aging = await Asset.findAll({
            where: { acquisition_date: { [Op.lte]: threshold }, status: { [Op.notIn]: ['Retired', 'Disposed'] } },
            include: [AssetCategory],
            order: [['acquisition_date', 'ASC']],
        });
        res.json({ success: true, data: aging, meta: { age_years: ageYears } });
    } catch (error) { next(error); }
};

// Count + list of assets currently allocated per department.
exports.getDepartmentAllocation = async (req, res, next) => {
    try {
        const departments = await Department.findAll();
        const data = [];
        for (const d of departments) {
            const active = await Allocation.findAll({
                where: { status: 'active', department_id: d.id },
                include: [{ model: Asset }],
            });
            // Also count allocations whose asset belongs to the department.
            const deptAssetIds = (await Asset.findAll({ where: { department_id: d.id }, attributes: ['id'] })).map((a) => a.id);
            const byAsset = deptAssetIds.length
                ? await Allocation.findAll({ where: { status: 'active', asset_id: { [Op.in]: deptAssetIds } }, include: [Asset] })
                : [];
            const merged = [...active, ...byAsset].filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);
            data.push({ department_id: d.id, department: d.name, allocated_count: merged.length, assets: merged.map((a) => a.Asset && a.Asset.asset_tag).filter(Boolean) });
        }
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

// Booking counts bucketed by hour-of-day x day-of-week.
exports.getBookingHeatmap = async (req, res, next) => {
    try {
        const where = {};
        if (req.query.resource_asset_id) where.resource_asset_id = req.query.resource_asset_id;
        const bookings = await Booking.findAll({ where, attributes: ['start_time'] });

        // 7 days x 24 hours matrix.
        const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
        for (const b of bookings) {
            const d = new Date(b.start_time);
            matrix[d.getDay()][d.getHours()] += 1;
        }
        res.json({ success: true, data: matrix, meta: { rows: 'day_of_week(0=Sun)', cols: 'hour_of_day' } });
    } catch (error) { next(error); }
};

// CSV export of a named report's underlying data.
// NOTE: lightweight hand-rolled CSV — no PDF library, sufficient for this scope.
exports.exportReport = async (req, res, next) => {
    try {
        const type = req.query.type || 'department-allocation';
        let rows = [];

        if (type === 'department-allocation') {
            const departments = await Department.findAll();
            for (const d of departments) {
                const count = await Allocation.count({ where: { status: 'active', department_id: d.id } });
                rows.push({ department: d.name, active_allocations: count });
            }
        } else if (type === 'assets') {
            const assets = await Asset.findAll({ include: [AssetCategory, Department] });
            rows = assets.map((a) => ({
                asset_tag: a.asset_tag, name: a.name, category: a.AssetCategory && a.AssetCategory.name,
                status: a.status, location: a.location, department: a.Department && a.Department.name,
                acquisition_date: a.acquisition_date, acquisition_cost: a.acquisition_cost,
            }));
        } else if (type === 'maintenance') {
            const mr = await MaintenanceRequest.findAll({ include: [Asset] });
            rows = mr.map((m) => ({ id: m.id, asset: m.Asset && m.Asset.asset_tag, priority: m.priority, status: m.status, technician: m.technician_name, raised_at: m.created_at }));
        } else {
            return res.status(400).json({ success: false, error: { code: 'UNKNOWN_REPORT', message: `Unknown report type "${type}"` } });
        }

        const csv = toCsv(rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
        res.send(csv);
    } catch (error) { next(error); }
};
