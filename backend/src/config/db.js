const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'assetflow',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        port: process.env.DB_PORT || 3306,
        logging: false,
        define: {
            underscored: true,      // maps createdAt → created_at, updatedAt → updated_at
            freezeTableName: true,  // always use the explicit tableName from each model
        },
        dialectOptions: {
            ssl: {
                rejectUnauthorized: true,
                minVersion: 'TLSv1.2',
            },
        },
    }
);

module.exports = sequelize;
