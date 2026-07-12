const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Department = sequelize.define('Department', {
    name: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { timestamps: true });
module.exports = Department;\n