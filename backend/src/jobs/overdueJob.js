const cron = require('node-cron');
const { Allocation, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

cron.schedule('0 * * * *', async () => {
    try {
        const overdueAllocations = await Allocation.findAll({
            where: { status: 'active', expected_return_date: { [Op.lt]: new Date() } },
            include: ['Employee']
        });
        
        for (const alloc of overdueAllocations) {
            if (alloc.Employee) {
                // Upsert logic or check if already notified
                const existingNotif = await Notification.findOne({
                    where: { type: 'Overdue Return', related_entity_id: alloc.id, user_id: alloc.employee_id }
                });
                
                if (!existingNotif) {
                    await Notification.create({
                        user_id: alloc.employee_id,
                        type: 'Overdue Return',
                        message: `Your allocation for asset ${alloc.asset_id} is overdue.`,
                        related_entity_type: 'Allocation',
                        related_entity_id: alloc.id
                    });
                }
            }
        }
        console.log('Overdue job completed');
    } catch (error) {
        console.error('Overdue job error:', error);
    }
});\n