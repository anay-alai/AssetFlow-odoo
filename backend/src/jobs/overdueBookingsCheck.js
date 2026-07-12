const cron = require('node-cron');
const { Booking } = require('../models');
const { Op } = require('sequelize');

// Auto-transition bookings whose end_time has passed but are still live.
async function runOverdueBookingsCheck() {
    const now = new Date();
    const [count] = await Booking.update(
        { status: 'Completed' },
        { where: { status: { [Op.in]: ['Upcoming', 'Ongoing'] }, end_time: { [Op.lt]: now } } }
    );
    return { completed: count };
}

function register() {
    cron.schedule('*/15 * * * *', async () => {
        try {
            const r = await runOverdueBookingsCheck();
            console.log(`[cron] overdueBookingsCheck: ${r.completed} bookings auto-completed`);
        } catch (err) {
            console.error('[cron] overdueBookingsCheck error:', err.message);
        }
    });
}

module.exports = { register, runOverdueBookingsCheck };
