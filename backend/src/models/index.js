const sequelize = require('../config/db');
const User = require('./User');
const Department = require('./Department');
const AssetCategory = require('./AssetCategory');
const Asset = require('./Asset');
const Allocation = require('./Allocation');
const TransferRequest = require('./TransferRequest');
const Booking = require('./Booking');
const MaintenanceRequest = require('./MaintenanceRequest');
const AuditCycle = require('./AuditCycle');
const AuditItem = require('./AuditItem');
const Notification = require('./Notification');
const ActivityLog = require('./ActivityLog');

// Explicit join model so its table name stays PascalCase (schema: AuditAuditors),
// instead of being snake_cased to audit_auditors by the global `underscored` option.
const { DataTypes } = require('sequelize');
const AuditAuditors = sequelize.define('AuditAuditors', {
    audit_cycle_id: { type: DataTypes.INTEGER },
    user_id: { type: DataTypes.INTEGER },
}, { tableName: 'AuditAuditors', timestamps: false });

// Department & User (cyclic)
Department.belongsTo(User, { as: 'Head', foreignKey: 'head_user_id' });
User.hasMany(Department, { as: 'HeadedDepartments', foreignKey: 'head_user_id' });
User.belongsTo(Department, { foreignKey: 'department_id' });
Department.hasMany(User, { foreignKey: 'department_id' });
Department.belongsTo(Department, { as: 'Parent', foreignKey: 'parent_department_id' });

// Asset
Asset.belongsTo(AssetCategory, { foreignKey: 'category_id' });
Asset.belongsTo(Department, { foreignKey: 'department_id' });

// Allocation
Allocation.belongsTo(Asset, { foreignKey: 'asset_id' });
Allocation.belongsTo(User, { as: 'Employee', foreignKey: 'employee_id' });
Allocation.belongsTo(Department, { foreignKey: 'department_id' });
Asset.hasMany(Allocation, { foreignKey: 'asset_id' });

// TransferRequest
TransferRequest.belongsTo(Asset, { foreignKey: 'asset_id' });
TransferRequest.belongsTo(User, { as: 'FromUser', foreignKey: 'from_user_id' });
TransferRequest.belongsTo(User, { as: 'ToUser', foreignKey: 'to_user_id' });
TransferRequest.belongsTo(User, { as: 'Requester', foreignKey: 'requested_by' });
TransferRequest.belongsTo(User, { as: 'Approver', foreignKey: 'approved_by' });

// Booking
Booking.belongsTo(Asset, { as: 'Resource', foreignKey: 'resource_asset_id' });
Booking.belongsTo(User, { as: 'Booker', foreignKey: 'booked_by' });
Asset.hasMany(Booking, { foreignKey: 'resource_asset_id' });

// MaintenanceRequest
MaintenanceRequest.belongsTo(Asset, { foreignKey: 'asset_id' });
MaintenanceRequest.belongsTo(User, { as: 'Raiser', foreignKey: 'raised_by' });
MaintenanceRequest.belongsTo(User, { as: 'Approver', foreignKey: 'approved_by' });
Asset.hasMany(MaintenanceRequest, { foreignKey: 'asset_id' });

// Audit
AuditCycle.belongsTo(Department, { as: 'ScopeDepartment', foreignKey: 'scope_department_id' });
AuditCycle.belongsTo(User, { as: 'Creator', foreignKey: 'created_by' });
AuditCycle.belongsToMany(User, { as: 'Auditors', through: AuditAuditors, foreignKey: 'audit_cycle_id' });
User.belongsToMany(AuditCycle, { as: 'AssignedAudits', through: AuditAuditors, foreignKey: 'user_id' });

AuditItem.belongsTo(AuditCycle, { foreignKey: 'audit_cycle_id' });
AuditCycle.hasMany(AuditItem, { foreignKey: 'audit_cycle_id' });
AuditItem.belongsTo(Asset, { foreignKey: 'asset_id' });
AuditItem.belongsTo(User, { as: 'Auditor', foreignKey: 'auditor_id' });

// Notification & Log
Notification.belongsTo(User, { foreignKey: 'user_id' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User, Department, AssetCategory, Asset, Allocation, TransferRequest,
  Booking, MaintenanceRequest, AuditCycle, AuditItem, Notification, ActivityLog
};