/**
 * One-shot database setup: runs database/schema.sql then database/seed.sql
 * against the DB defined in backend/.env. Use for a fresh/reset dev database.
 *
 *   node scripts/setupDb.js            # schema + seed
 *   node scripts/setupDb.js --schema   # schema only
 *   node scripts/setupDb.js --seed     # seed only
 *
 * TiDB Cloud requires TLS; this connects with ssl enabled.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ROOT = path.join(__dirname, '..', '..');
const SCHEMA = path.join(ROOT, 'database', 'schema.sql');
const SEED = path.join(ROOT, 'database', 'seed.sql');

async function run() {
    const only = process.argv.slice(2);
    const doSchema = only.length === 0 || only.includes('--schema');
    const doSeed = only.length === 0 || only.includes('--seed');

    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    });
    console.log(`Connected to ${process.env.DB_HOST}/${process.env.DB_NAME}`);

    try {
        if (doSchema) {
            console.log('Applying schema.sql ...');
            await conn.query(fs.readFileSync(SCHEMA, 'utf8'));
            console.log('  schema applied.');
        }
        if (doSeed) {
            console.log('Applying seed.sql ...');
            await conn.query(fs.readFileSync(SEED, 'utf8'));
            console.log('  seed applied.');
        }
        const [[{ n }]] = await conn.query('SELECT COUNT(*) n FROM Users');
        console.log(`Done. Users in DB: ${n}`);
    } finally {
        await conn.end();
    }
}

run().catch((err) => {
    console.error('DB setup failed:', err.message);
    process.exit(1);
});
