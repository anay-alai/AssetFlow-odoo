const cron = require('node-cron');
const { Allocation, Asset } = require('../models');
const { Op } = require('sequelize');
const { notifyOncePerDay } = require('../services/notification.service');

// Core logic exported for testability. Idempotent per allocation per day.
async function runOverdueReturnsCheck() {
    const overdue = await Allocation.findAll({
        where: { status: 'active', expected_return_date: { [Op.lt]: new Date() } },
        include: ['Employee', 'Asset'],
    });

    let created = 0;
    for (const alloc of overdue) {
        if (!alloc.employee_id) continue;
        const tag = alloc.Asset ? alloc.Asset.asset_tag : `#${alloc.asset_id}`;
        const notif = await notifyOncePerDay({
            user_id: alloc.employee_id,
            type: 'Overdue Return',
            message: `Your allocation for asset ${tag} is overdue.`,
            related_entity_type: 'Allocation',
            related_entity_id: alloc.id,
        });
        if (notif) created += 1;
    }
    return { checked: overdue.length, created };
}

function register() {
    cron.schedule('0 * * * *', async () => {
        try {
            const r = await runOverdueReturnsCheck();
            console.log(`[cron] overdueReturnsCheck: ${r.checked} overdue, ${r.created} new notifications`);
        } catch (err) {
            console.error('[cron] overdueReturnsCheck error:', err.message);
        }
    });
}

module.exports = { register, runOverdueReturnsCheck };
