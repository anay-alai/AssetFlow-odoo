/**
 * Apply SQL migrations from database/migrations/ in filename order.
 * Non-destructive — runs ALTER-based migration files against the live DB.
 *
 *   node scripts/migrate.js            # run all migrations
 *   node scripts/migrate.js <file.sql> # run one specific migration
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'database', 'migrations');

async function run() {
    const only = process.argv[2];
    let files;
    if (only) {
        files = [path.isAbsolute(only) ? only : path.join(MIGRATIONS_DIR, only)];
    } else {
        files = fs.readdirSync(MIGRATIONS_DIR)
            .filter((f) => f.endsWith('.sql'))
            .sort()
            .map((f) => path.join(MIGRATIONS_DIR, f));
    }

    if (!files.length) { console.log('No migration files found.'); return; }

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
        for (const file of files) {
            const sql = fs.readFileSync(file, 'utf8').trim();
            if (!sql) continue;
            process.stdout.write(`Applying ${path.basename(file)} ... `);
            await conn.query(sql);
            console.log('done.');
        }
        console.log('All migrations applied.');
    } finally {
        await conn.end();
    }
}

run().catch((err) => { console.error('Migration failed:', err.message); process.exit(1); });
