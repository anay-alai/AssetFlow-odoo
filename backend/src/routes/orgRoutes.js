const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const { createDepartmentValidator, createCategoryValidator, updateRoleValidator } = require('../validators/orgValidators');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Departments
router.get('/departments', authenticate, orgController.getDepartments);
router.post('/departments', authenticate, authorize('admin'), createDepartmentValidator, orgController.createDepartment);

// Categories
router.get('/categories', authenticate, orgController.getCategories);
router.post('/categories', authenticate, authorize('admin'), createCategoryValidator, orgController.createCategory);

// Employees
router.get('/employees', authenticate, authorize('admin', 'asset_manager', 'dept_head'), orgController.getEmployees);
router.put('/employees/:id/role', authenticate, authorize('admin'), updateRoleValidator, orgController.updateEmployeeRole);

module.exports = router;
