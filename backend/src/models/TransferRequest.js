const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const TransferRequest = sequelize.define('TransferRequest', {
    reason: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('Requested', 'Approved', 'Rejected', 'Reallocated'), defaultValue: 'Requested' },
}, { timestamps: true });
module.exports = TransferRequest;\n