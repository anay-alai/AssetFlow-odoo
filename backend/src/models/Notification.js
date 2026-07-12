const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Notification = sequelize.define('Notification', {
    type: { type: DataTypes.ENUM('Asset Assigned', 'Maintenance Approved', 'Maintenance Rejected', 'Booking Confirmed', 'Booking Cancelled', 'Booking Reminder', 'Transfer Approved', 'Overdue Return', 'Audit Discrepancy'), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    related_entity_type: { type: DataTypes.STRING(100) },
    related_entity_id: { type: DataTypes.INTEGER },
}, { timestamps: true });
module.exports = Notification;