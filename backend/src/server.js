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

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
