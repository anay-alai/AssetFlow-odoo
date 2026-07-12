const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { User, Department } = require('../models');

const signup = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() } });
        }

        // Specifically ignoring the role from body and explicitly setting to employee
        const { name, email, password, department_id } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ success: false, error: { code: 'EMAIL_IN_USE', message: 'Email already registered' } });
        }

        if (department_id) {
            const dept = await Department.findByPk(department_id);
            if (!dept) {
                return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password_hash,
            role: 'employee', // Hardcoded as per requirement
            department_id
        });

        res.status(201).json({
            success: true,
            data: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() } });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user || user.status !== 'active') {
            return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '1d' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role, department_id: user.department_id }
            }
        });
    } catch (error) {
        next(error);
    }
};

const me = async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, department_id: req.user.department_id }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { signup, login, me };
