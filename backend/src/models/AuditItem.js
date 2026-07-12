const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const AuditItem = sequelize.define('AuditItem', {
    verification_status: { type: DataTypes.ENUM('Verified', 'Missing', 'Damaged') },
    notes: { type: DataTypes.TEXT },
    verified_at: { type: DataTypes.DATE },
}, { timestamps: true });
module.exports = AuditItem;