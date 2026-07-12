const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'asset_manager', 'dept_head', 'employee'), defaultValue: 'employee' },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { timestamps: true });
module.exports = User;\n