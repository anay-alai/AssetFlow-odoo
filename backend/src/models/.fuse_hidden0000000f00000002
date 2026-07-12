const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Asset = sequelize.define('Asset', {
    asset_tag: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    serial_number: { type: DataTypes.STRING(100) },
    acquisition_date: { type: DataTypes.DATEONLY },
    acquisition_cost: { type: DataTypes.DECIMAL(10, 2) },
    condition: { type: DataTypes.STRING(100) },
    location: { type: DataTypes.STRING },
    is_bookable: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: { type: DataTypes.ENUM('Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'), defaultValue: 'Available' },
    prior_status: { type: DataTypes.ENUM('Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed') },
    photo_url: { type: DataTypes.STRING },
    qr_code: { type: DataTypes.TEXT },
    documents: { type: DataTypes.JSON },
}, { timestamps: true });
module.exports = Asset;