/**
 * Deterministically ensure admin@example.com can log in with a known password.
 * Updates the hash if the user exists; inserts the user if it doesn't.
 *
 *   node scripts/resetAdminPassword.js [password]
 *
 * Default password: password123
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const EMAIL = 'admin@example.com';
const PASSWORD = process.argv[2] || 'password123';

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
        // How many rows currently exist for this email?
        const [rows] = await conn.query('SELECT id FROM Users WHERE email = ?', [EMAIL]);
        if (rows.length) {
            const [res] = await conn.query(
                "UPDATE Users SET password_hash = ?, status = 'active' WHERE email = ?",
                [hash, EMAIL]
            );
            console.log(`Updated existing admin. Rows affected: ${res.affectedRows}`);
        } else {
            await conn.query(
                "INSERT INTO Users (name, email, password_hash, role, status) VALUES ('Admin User', ?, ?, 'admin', 'active')",
                [EMAIL, hash]
            );
            console.log('Admin user did not exist — inserted a new one.');
        }

        // Verify the hash we just wrote actually matches the password.
        const [check] = await conn.query('SELECT password_hash FROM Users WHERE email = ?', [EMAIL]);
        const ok = await bcrypt.compare(PASSWORD, check[0].password_hash);
        console.log(`Verify login for ${EMAIL} / ${PASSWORD}: ${ok ? 'OK ✅' : 'FAILED ❌'}`);
    } finally {
        await conn.end();
    }
}

run().catch((err) => {
    console.error('reset-admin failed:', err.message);
    process.exit(1);
});
