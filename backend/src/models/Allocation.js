const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Allocation = sequelize.define('Allocation', {
    allocated_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
    expected_return_date: { type: DataTypes.DATE },
    actual_return_date: { type: DataTypes.DATE },
    return_condition_notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('active', 'returned'), defaultValue: 'active' },
}, { timestamps: true });
module.exports = Allocation;\n