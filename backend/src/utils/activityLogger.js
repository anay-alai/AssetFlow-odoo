const { ActivityLog } = require('../models');

/**
 * Write an activity-log entry. Safe to call from inside a service transaction.
 * Never throws — logging failures must not break the primary mutation.
 *
 * @param {Object} params
 * @param {number} params.user_id     - actor performing the action
 * @param {string} params.action      - short verb, e.g. 'asset.allocated'
 * @param {string} params.entity_type - e.g. 'Asset', 'Allocation'
 * @param {number} params.entity_id   - id of the affected entity
 * @param {Object} [params.metadata]  - arbitrary JSON context
 * @param {import('sequelize').Transaction} [transaction]
 */
async function logActivity({ user_id, action, entity_type, entity_id, metadata = null }, transaction = null) {
    try {
        await ActivityLog.create(
            { user_id, action, entity_type, entity_id, metadata },
            transaction ? { transaction } : {}
        );
    } catch (err) {
        // Deliberately swallow — an audit-trail write should never abort business logic.
        console.error('[activityLogger] failed to write log:', err.message);
    }
}

module.exports = { logActivity };
