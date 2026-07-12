const cron = require('node-cron');
const { Booking } = require('../models');
const { Op } = require('sequelize');
const { notifyOncePerDay } = require('../services/notification.service');

// Notify bookers of bookings starting within the next 30 minutes.
async function runBookingReminder() {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 60 * 1000);

    const upcoming = await Booking.findAll({
        where: { status: 'Upcoming', start_time: { [Op.between]: [now, soon] } },
    });

    let created = 0;
    for (const b of upcoming) {
        const notif = await notifyOncePerDay({
            user_id: b.booked_by,
            type: 'Booking Reminder',
            message: `Reminder: your booking #${b.id} starts at ${new Date(b.start_time).toLocaleTimeString()}.`,
            related_entity_type: 'Booking',
            related_entity_id: b.id,
        });
        if (notif) created += 1;
    }
    return { checked: upcoming.length, created };
}

function register() {
    cron.schedule('*/15 * * * *', async () => {
        try {
            const r = await runBookingReminder();
            console.log(`[cron] bookingReminder: ${r.checked} upcoming, ${r.created} reminders`);
        } catch (err) {
            console.error('[cron] bookingReminder error:', err.message);
        }
    });
}

module.exports = { register, runBookingReminder };
