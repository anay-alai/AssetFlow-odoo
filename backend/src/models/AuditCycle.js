const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const AuditCycle = sequelize.define('AuditCycle', {
    name: { type: DataTypes.STRING, allowNull: false },
    scope_location: { type: DataTypes.STRING },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM('Open', 'Closed'), defaultValue: 'Open' },
}, { tableName: 'AuditCycles', timestamps: true });
module.exports = AuditCycle;