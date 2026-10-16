/* const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
    console.error('Database pool error:', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
}; */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    // Mengutamakan DATABASE_URL jika ada, atau merakit manual dari variabel lain
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: {
        rejectUnauthorized: false // WAJIB ADA untuk menghubungkan Vercel ke Supabase
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};