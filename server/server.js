import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { pool } from './config/db.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Verify the DB connection before accepting traffic.
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL.');

    app.listen(PORT, () => {
      console.log(`Cartify API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
};

start();
