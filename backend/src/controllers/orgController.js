const { validationResult } = require('express-validator');
const { Department, AssetCategory, User } = require('../models');

const getDepartments = async (req, res, next) => {
    try {
        const departments = await Department.findAll({ include: ['Head', 'Parent'] });
        res.json({ success: true, data: departments });
    } catch (error) { next(error); }
};

const createDepartment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });

        const { name, head_user_id, parent_department_id, status } = req.body;
        const dept = await Department.create({ name, head_user_id, parent_department_id, status });
        res.status(201).json({ success: true, data: dept });
    } catch (error) { next(error); }
};

const getCategories = async (req, res, next) => {
    try {
        const categories = await AssetCategory.findAll();
        res.json({ success: true, data: categories });
    } catch (error) { next(error); }
};

const createCategory = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });

        const { name, custom_fields } = req.body;
        const category = await AssetCategory.create({ name, custom_fields });
        res.status(201).json({ success: true, data: category });
    } catch (error) { next(error); }
};

const getEmployees = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, department_id, role, status } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (department_id) where.department_id = department_id;
        if (role) where.role = role;
        if (status) where.status = status;

        const { count, rows } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password_hash', 'reset_token_hash', 'reset_token_expires'] },
            include: [Department],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        res.json({ success: true, data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit) } });
    } catch (error) { next(error); }
};

const updateEmployeeRole = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: errors.array() } });

        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });

        user.role = role;
        await user.save();

        res.json({ success: true, data: { id: user.id, role: user.role } });
    } catch (error) { next(error); }
};

module.exports = {
    getDepartments, createDepartment, getCategories, createCategory, getEmployees, updateEmployeeRole
};
