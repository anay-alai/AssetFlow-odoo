const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const ActivityLog = sequelize.define('ActivityLog', {
    action: { type: DataTypes.STRING, allowNull: false },
    entity_type: { type: DataTypes.STRING(100), allowNull: false },
    entity_id: { type: DataTypes.INTEGER, allowNull: false },
    metadata: { type: DataTypes.JSON },
}, { timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = ActivityLog;