const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const AssetCategory = sequelize.define('AssetCategory', {
    name: { type: DataTypes.STRING, allowNull: false },
    custom_fields: { type: DataTypes.JSON },
}, { timestamps: true });
module.exports = AssetCategory;\n