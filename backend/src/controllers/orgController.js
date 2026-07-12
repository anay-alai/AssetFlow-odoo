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
        const dept = await Department.create({
            name,
            head_user_id: head_user_id || null,
            parent_department_id: parent_department_id || null,
            status: status ? String(status).toLowerCase() : 'active', // ENUM is lowercase
        });
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

// Edit / deactivate a department (soft status flip, plus head/parent/name edits).
const updateDepartment = async (req, res, next) => {
    try {
        const dept = await Department.findByPk(req.params.id);
        if (!dept) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });

        const { name, head_user_id, parent_department_id, status } = req.body;
        if (name !== undefined) dept.name = name;
        if (head_user_id !== undefined) dept.head_user_id = head_user_id || null;
        if (parent_department_id !== undefined) {
            if (String(parent_department_id) === String(dept.id)) {
                return res.status(400).json({ success: false, error: { code: 'INVALID_PARENT', message: 'A department cannot be its own parent.' } });
            }
            dept.parent_department_id = parent_department_id || null;
        }
        if (status !== undefined) dept.status = String(status).toLowerCase();
        await dept.save();
        res.json({ success: true, data: dept });
    } catch (error) { next(error); }
};

// Activate / deactivate an employee.
const updateEmployeeStatus = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
        const { status } = req.body;
        user.status = String(status).toLowerCase() === 'inactive' ? 'inactive' : 'active';
        await user.save();
        res.json({ success: true, data: { id: user.id, status: user.status } });
    } catch (error) { next(error); }
};

// Edit a category (name + custom fields).
const updateCategory = async (req, res, next) => {
    try {
        const cat = await AssetCategory.findByPk(req.params.id);
        if (!cat) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
        const { name, custom_fields } = req.body;
        if (name !== undefined) cat.name = name;
        if (custom_fields !== undefined) cat.custom_fields = custom_fields;
        await cat.save();
        res.json({ success: true, data: cat });
    } catch (error) { next(error); }
};

module.exports = {
    getDepartments, createDepartment, updateDepartment,
    getCategories, createCategory, updateCategory,
    getEmployees, updateEmployeeRole, updateEmployeeStatus,
};
