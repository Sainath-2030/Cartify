import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
dotenv.config({ path: envPath });

const { pool } = await import('../config/db.js');

async function seedChurnTelemetry() {
  const client = await pool.connect();
  try {
    console.log('🚀 Enriching dataset with realistic churn lifecycle patterns...');

    // 1. Get standard shopper users (id > 4)
    const usersRes = await client.query(`
      SELECT id, full_name, email 
      FROM users 
      WHERE role = 'USER' AND id > 4 
      ORDER BY id ASC
    `);

    const users = usersRes.rows;
    console.log(`Found ${users.length} shopper users.`);

    // Fetch sample products to attach to reviews and carts
    const prodRes = await client.query('SELECT id FROM products LIMIT 5');
    const sampleProductIds = prodRes.rows.map(r => r.id);
    if (sampleProductIds.length === 0) {
      throw new Error('No products available for seeding churn telemetry.');
    }

    // Begin transaction for all cohort updates
    await client.query('BEGIN');

    // Segment cohorts for diverse churn distribution:
    // Cohort A (Dormant / High Risk): Users 35 to 44 (~10 users)
    //   - Account created 80-100 days ago
    //   - Last interaction / order 50-75 days ago
    // Cohort B (Friction / High Risk): Users 45 to 48 (~4 users)
    //   - Account created 60 days ago
    //   - Negative 1-2 star reviews + 25-40 days inactive
    // Cohort C (At-Risk / Cart Abandoners): Users 25 to 34 (~10 users)
    //   - Account created 45 days ago
    //   - Last interaction 25-35 days ago, high cart abandonment
    // Cohort D (Active / Safe): Remaining users (Users 5 to 24, 49, 50)
    //   - Recent interactions (1-10 days ago), repeat purchases

    // Cohort A: Dormant / Lapsed users
    const dormantUsers = users.slice(30, 40); // 10 users
    for (const u of dormantUsers) {
      const daysBack = Math.floor(Math.random() * 25) + 55; // 55 - 80 days ago
      const regDaysBack = daysBack + Math.floor(Math.random() * 30) + 15; // 70 - 110 days ago

      await client.query(`
        UPDATE users 
        SET created_at = NOW() - INTERVAL '${regDaysBack} days'
        WHERE id = $1
      `, [u.id]);

      await client.query(`
        UPDATE interactions 
        SET created_at = NOW() - INTERVAL '${daysBack} days' - (RANDOM() * INTERVAL '10 days')
        WHERE user_id = $1
      `, [u.id]);

      await client.query(`
        UPDATE orders 
        SET created_at = NOW() - INTERVAL '${daysBack + 5} days'
        WHERE user_id = $1
      `, [u.id]);
    }
    console.log(`✓ Updated ${dormantUsers.length} dormant users (Cohort A: 55-80 days inactive).`);

    // Cohort B: Dissatisfied friction users (Negative Reviews + 25-45 days inactive)
    const frictionUsers = users.slice(40, 44); // 4 users

    const complaints = [
      { rating: 1, text: 'Product arrived damaged with broken packaging. Customer support took 4 days to respond.' },
      { rating: 2, text: 'Material quality is vastly inferior to the product photos. Sizing ran much too small.' },
      { rating: 1, text: 'Defective power button right out of the box. Extremely disappointing experience.' },
      { rating: 2, text: 'Shipping was delayed by over two weeks with no tracking updates provided.' }
    ];

    for (let i = 0; i < frictionUsers.length; i++) {
      const u = frictionUsers[i];
      const daysBack = Math.floor(Math.random() * 20) + 25; // 25 - 45 days ago
      const regDaysBack = daysBack + 20;

      await client.query(`
        UPDATE users 
        SET created_at = NOW() - INTERVAL '${regDaysBack} days'
        WHERE id = $1
      `, [u.id]);

      await client.query(`
        UPDATE interactions 
        SET created_at = NOW() - INTERVAL '${daysBack} days' - (RANDOM() * INTERVAL '5 days')
        WHERE user_id = $1
      `, [u.id]);

      // Insert negative review
      const prodId = sampleProductIds[i % sampleProductIds.length];
      const comp = complaints[i % complaints.length];
      await client.query(`
        INSERT INTO reviews (product_id, user_id, reviewer_name, rating, review_text, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${daysBack} days')
        ON CONFLICT (product_id, user_id) 
        DO UPDATE SET rating = $4, review_text = $5, created_at = NOW() - INTERVAL '${daysBack} days'
      `, [prodId, u.id, u.full_name, comp.rating, comp.text]);
    }
    console.log(`✓ Updated ${frictionUsers.length} friction users with 1-2 star reviews (Cohort B).`);

    // Cohort C: Cart Abandoners (25-35 days inactive)
    const cartAbandoners = users.slice(20, 28); // 8 users
    for (const u of cartAbandoners) {
      const daysBack = Math.floor(Math.random() * 12) + 24; // 24 - 36 days ago
      const regDaysBack = daysBack + 15;

      await client.query(`
        UPDATE users 
        SET created_at = NOW() - INTERVAL '${regDaysBack} days'
        WHERE id = $1
      `, [u.id]);

      await client.query(`
        UPDATE interactions 
        SET created_at = NOW() - INTERVAL '${daysBack} days' - (RANDOM() * INTERVAL '6 days')
        WHERE user_id = $1
      `, [u.id]);

      // Seed an active cart item for some friction; update timestamps on conflict
      const prodId = sampleProductIds[Math.floor(Math.random() * sampleProductIds.length)];
      await client.query(`
        INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at)
        VALUES ($1, $2, 2, NOW() - INTERVAL '${daysBack} days', NOW() - INTERVAL '${daysBack} days')
        ON CONFLICT (user_id, product_id) 
        DO UPDATE SET created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at
      `, [u.id, prodId]);
    }
    console.log(`✓ Updated ${cartAbandoners.length} cart abandoners with open cart items (Cohort C).`);

    await client.query('COMMIT');
    console.log('✅ Realistic churn telemetry seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error seeding churn telemetry:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedChurnTelemetry();
