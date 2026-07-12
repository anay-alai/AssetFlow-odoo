const { Notification } = require('../models');

/**
 * Create a single notification for a user. Safe inside a transaction.
 * @param {Object} params
 * @param {number} params.user_id
 * @param {string} params.type   - must match the Notification type ENUM
 * @param {string} params.message
 * @param {string} [params.related_entity_type]
 * @param {number} [params.related_entity_id]
 * @param {import('sequelize').Transaction} [transaction]
 */
async function notify(
    { user_id, type, message, related_entity_type = null, related_entity_id = null },
    transaction = null
) {
    if (!user_id) return null; // e.g. department-only allocation with no employee holder
    return Notification.create(
        { user_id, type, message, related_entity_type, related_entity_id, is_read: false },
        transaction ? { transaction } : {}
    );
}

/**
 * Idempotent notification: only creates one if an identical (user, type, entity) row
 * does not already exist for the current day. Used by cron jobs to avoid duplicates.
 */
async function notifyOncePerDay({ user_id, type, message, related_entity_type, related_entity_id }) {
    const { Op } = require('sequelize');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existing = await Notification.findOne({
        where: {
            user_id,
            type,
            related_entity_type: related_entity_type || null,
            related_entity_id: related_entity_id || null,
            created_at: { [Op.gte]: startOfDay },
        },
    });
    if (existing) return null;
    return notify({ user_id, type, message, related_entity_type, related_entity_id });
}

module.exports = { notify, notifyOncePerDay };
