const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findByPk(decoded.id);
        if (!user || user.status !== 'active') {
            return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' } });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token', details: error.message } });
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: insufficient permissions' } });
        }
        next();
    };
};

module.exports = {
    authenticate,
    authorize
};
