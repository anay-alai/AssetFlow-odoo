const app = require('./app');
const sequelize = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Initialize Cron Jobs
require('./jobs/overdueJob');

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
