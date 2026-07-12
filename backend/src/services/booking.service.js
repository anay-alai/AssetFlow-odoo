const { Op } = require('sequelize');

/**
 * Pure overlap predicate — no DB, fully unit-testable.
 * Two intervals overlap iff existing.start < new.end AND existing.end > new.start.
 * Back-to-back (existing.end === new.start OR existing.start === new.end) is NOT a conflict.
 *
 * @returns {boolean} true when the two ranges conflict
 */
function rangesOverlap(existingStart, existingEnd, newStart, newEnd) {
    const es = new Date(existingStart).getTime();
    const ee = new Date(existingEnd).getTime();
    const ns = new Date(newStart).getTime();
    const ne = new Date(newEnd).getTime();
    return es < ne && ee > ns;
}

/**
 * Build the Sequelize where-clause that finds any conflicting live booking.
 * @param {number} resourceAssetId
 * @param {Date|string} startTime
 * @param {Date|string} endTime
 * @param {number|null} excludeBookingId - booking id to ignore (used on reschedule)
 */
function conflictWhere(resourceAssetId, startTime, endTime, excludeBookingId = null) {
    const where = {
        resource_asset_id: resourceAssetId,
        status: { [Op.in]: ['Upcoming', 'Ongoing'] },
        start_time: { [Op.lt]: new Date(endTime) },
        end_time: { [Op.gt]: new Date(startTime) },
    };
    if (excludeBookingId) where.id = { [Op.ne]: excludeBookingId };
    return where;
}

/**
 * Validate a proposed booking window. Returns { valid, reason } — the caller owns the transaction.
 */
function validateWindow(startTime, endTime) {
    if (!startTime || !endTime) return { valid: false, reason: 'start_time and end_time are required' };
    if (new Date(endTime) <= new Date(startTime)) return { valid: false, reason: 'end_time must be after start_time' };
    return { valid: true };
}

module.exports = { rangesOverlap, conflictWhere, validateWindow };
