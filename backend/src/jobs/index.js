const overdueJob = require('./overdueJob');
const bookingReminder = require('./bookingReminder');
const overdueBookingsCheck = require('./overdueBookingsCheck');

/**
 * Register all cron jobs. Guarded by ENABLE_CRON so tests / CI can disable them.
 */
function registerJobs() {
    if (process.env.ENABLE_CRON !== 'true') {
        console.log('[cron] ENABLE_CRON is not "true" — background jobs disabled.');
        return;
    }
    overdueJob.register();
    bookingReminder.register();
    overdueBookingsCheck.register();
    console.log('[cron] Background jobs registered.');
}

module.exports = { registerJobs };
