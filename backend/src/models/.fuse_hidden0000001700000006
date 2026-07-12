const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
    issue_description: { type: DataTypes.TEXT, allowNull: false },
    priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
    photo_url: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'), defaultValue: 'Pending' },
    technician_name: { type: DataTypes.STRING },
    resolution_notes: { type: DataTypes.TEXT },
}, { timestamps: true });
module.exports = MaintenanceRequest;