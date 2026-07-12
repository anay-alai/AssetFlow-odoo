const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { User, Department } = require('../models');

// Stubbed mail sender — logs in dev; swap in a real provider later.
function sendResetEmail(email, token) {
    console.log(`[mail:stub] Password reset for ${email}. Token: ${token}`);
}

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

        const password_hash = await bcrypt.hash(password, 12);

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

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        // Always respond 200 to avoid leaking which emails exist.
        if (user) {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            user.reset_token_hash = tokenHash;
            user.reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await user.save();
            sendResetEmail(email, rawToken);
        }
        res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    } catch (error) { next(error); }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'token and password are required' } });
        }
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: { reset_token_hash: tokenHash, reset_token_expires: { [Op.gt]: new Date() } },
        });
        if (!user) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Reset token is invalid or expired' } });
        }
        user.password_hash = await bcrypt.hash(password, 12);
        user.reset_token_hash = null;
        user.reset_token_expires = null;
        await user.save();
        res.json({ success: true, message: 'Password has been reset. You may now log in.' });
    } catch (error) { next(error); }
};

module.exports = { signup, login, me, forgotPassword, resetPassword };
