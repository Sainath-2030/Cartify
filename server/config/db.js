import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment variables. Check your .env file.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Max concurrent clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error on idle connection:', err);
});

export const query = (text, params) => pool.query(text, params);

// Graceful pool shutdown on termination signals
const closePool = async () => {
  try {
    await pool.end();
    console.log('PostgreSQL pool closed successfully.');
  } catch (err) {
    console.error('Error closing PostgreSQL pool:', err);
  }
};

process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);
