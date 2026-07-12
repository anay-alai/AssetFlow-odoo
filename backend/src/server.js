require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');
const { registerJobs } = require('./jobs');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Register background cron jobs (guarded by ENABLE_CRON).
        registerJobs();

        const server = app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running on port ${PORT}`);
        });
        server.on('error', (err) => console.error('HTTP server error:', err.message));

        // Keep-alive safety net: on some non-standard Node builds the process can
        // exit right after binding the port. This no-op timer guarantees the event
        // loop stays alive so the server keeps serving.
        setInterval(() => {}, 1 << 30);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
