const { Asset } = require('../models');
const { Sequelize } = require('sequelize');

/**
 * Generate the next sequential asset tag (AF-0001, AF-0002, ...).
 *
 * MUST be called inside a transaction. It locks the current max-tag row
 * (SELECT ... FOR UPDATE) so two concurrent registrations cannot read the
 * same max value and produce a duplicate tag.
 *
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<string>} the next unique asset tag
 */
async function generateAssetTag(transaction) {
    // Lock the highest-id asset row for the duration of the transaction.
    const last = await Asset.findOne({
        order: [['id', 'DESC']],
        lock: transaction.LOCK.UPDATE,
        transaction,
    });

    let nextNum = 1;
    if (last && last.asset_tag) {
        const match = /^AF-(\d+)$/.exec(last.asset_tag);
        if (match) nextNum = parseInt(match[1], 10) + 1;
        else nextNum = (last.id || 0) + 1;
    }

    return `AF-${String(nextNum).padStart(4, '0')}`;
}

module.exports = { generateAssetTag };
