const { body, param } = require('express-validator');

const createDepartmentValidator = [
    body('name').trim().notEmpty().withMessage('Department name is required'),
    body('head_user_id').optional().isInt(),
    body('parent_department_id').optional().isInt()
];

const createCategoryValidator = [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('custom_fields').optional().isObject()
];

const updateRoleValidator = [
    param('id').isInt().withMessage('Invalid employee ID'),
    body('role').isIn(['admin', 'asset_manager', 'dept_head', 'employee']).withMessage('Invalid role')
];

module.exports = {
    createDepartmentValidator,
    createCategoryValidator,
    updateRoleValidator
};
