import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const schemaPath = path.resolve(__dirname, '../../database/schema_rebuild.sql');

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', desc: 'Smartphones, laptops, smart TVs, audio, and personal gadgets.', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop' },
  { name: 'Fashion', slug: 'fashion', desc: 'Apparel, footwear, luxury watches, and contemporary accessories.', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', desc: 'Furniture, kitchen essentials, cookware, and home décor.', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=400&fit=crop' },
  { name: 'Beauty', slug: 'beauty', desc: 'Makeup, skincare, personal grooming, and luxury fragrances.', img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=400&fit=crop' },
  { name: 'Sports', slug: 'sports', desc: 'Fitness equipment, athletic gear, outdoor sports, and yoga.', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop' },
  { name: 'Grocery', slug: 'grocery', desc: 'Gourmet coffee, tea, chocolates, snacks, and daily essentials.', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop' },
  { name: 'Gaming', slug: 'gaming', desc: 'Gaming consoles, accessories, mechanical keyboards, and mice.', img: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=800&h=400&fit=crop' },
  { name: 'Books', slug: 'books', desc: 'Bestselling fiction, non-fiction, finance, technology, and science.', img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop' },
];

async function runPhase1A() {
  console.log('====================================================');
  console.log('   CARTIFY REBUILD — PHASE 1A: DATABASE FOUNDATION  ');
  console.log('====================================================\n');

  const client = await pool.connect();

  try {
    console.log('1. Executing schema_rebuild.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✓ All 9 tables, 3 ENUMs, constraints, and indexes created successfully.');

    console.log('\n2. Seeding default actor accounts with bcrypt...');
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('AdminPassword123!', saltRounds);
    const cmHash = await bcrypt.hash('ManagerPassword123!', saltRounds);
    const shopperHash = await bcrypt.hash('ShopperPassword123!', saltRounds);

    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role) VALUES
      ('admin@cartify.com', $1, 'System Administrator', 'ADMIN'),
      ('manager@cartify.com', $2, 'Lead Content Manager', 'CONTENT_MANAGER'),
      ('shopper@cartify.com', $3, 'Demo Shopper', 'USER')
    `, [adminHash, cmHash, shopperHash]);
    console.log('✓ Seeded Administrator (admin@cartify.com), Content Manager (manager@cartify.com), and Shopper (shopper@cartify.com).');

    console.log('\n3. Seeding 8 top-level standard categories...');
    for (const c of CATEGORIES) {
      await client.query(
        `INSERT INTO categories (name, slug, description, image_url) VALUES ($1, $2, $3, $4)`,
        [c.name, c.slug, c.desc, c.img]
      );
    }
    console.log(`✓ Seeded ${CATEGORIES.length} standard categories.`);

    console.log('\n====================================================');
    console.log('   PHASE 1A DATABASE FOUNDATION READY FOR PHASE 1B  ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Phase 1A migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runPhase1A().catch((err) => {
  console.error('Fatal error in Phase 1A:', err);
  process.exit(1);
});
