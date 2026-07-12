/**
 * Reset ALL seeded demo accounts to a known password so every role can log in.
 *   node scripts/resetDemoPasswords.js [password]
 * Default password: password123
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const PASSWORD = process.argv[2] || 'password123';
const EMAILS = [
    'admin@example.com',
    'manager1@example.com', 'manager2@example.com',
    'headeng@example.com', 'headhr@example.com',
    'emp1@example.com', 'emp2@example.com', 'emp3@example.com', 'emp4@example.com', 'emp5@example.com',
];

async function run() {
    const hash = await bcrypt.hash(PASSWORD, 12);
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    });
    console.log(`Connected to ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    try {
        const [res] = await conn.query(
            "UPDATE Users SET password_hash = ?, status = 'active' WHERE email IN (?)",
            [hash, EMAILS]
        );
        console.log(`Reset ${res.affectedRows} demo account(s) to "${PASSWORD}".`);
        console.log('All roles can now log in with that password.');
    } finally {
        await conn.end();
    }
}

run().catch((err) => { console.error('reset-demo failed:', err.message); process.exit(1); });
