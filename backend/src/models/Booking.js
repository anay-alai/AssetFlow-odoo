const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Booking = sequelize.define('Booking', {
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled'), defaultValue: 'Upcoming' },
    purpose: { type: DataTypes.TEXT },
}, { timestamps: true });
module.exports = Booking;