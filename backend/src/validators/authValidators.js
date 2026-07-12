const { body } = require('express-validator');

const signupValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('department_id').optional().isInt().withMessage('Department ID must be an integer')
];

const loginValidator = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
    signupValidator,
    loginValidator
};
