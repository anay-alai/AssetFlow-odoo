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

        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use by another process.`);
                console.error(`Free it with:  lsof -ti:${PORT} | xargs kill -9`);
            } else {
                console.error('HTTP server error:', err.message);
            }
            process.exit(1);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
