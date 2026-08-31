import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function verifyPhase1A() {
  console.log('====================================================');
  console.log('   CARTIFY PHASE 1A VERIFICATION TEST SUITE         ');
  console.log('====================================================\n');

  const client = await pool.connect();
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✓ [PASS ${total}] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL ${total}] ${testName}`);
    }
  }

  try {
    // 1. Table existence check
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    const expectedTables = ['users', 'categories', 'products', 'interactions', 'reviews', 'cart_items', 'wishlist_items', 'orders', 'order_items'];
    
    for (const t of expectedTables) {
      assert(tables.includes(t), `Table "${t}" exists in PostgreSQL`);
    }

    // 2. ENUM checks
    const enumsRes = await client.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      ORDER BY t.typname, e.enumsortorder
    `);
    const enums = {};
    for (const r of enumsRes.rows) {
      if (!enums[r.typname]) enums[r.typname] = [];
      enums[r.typname].push(r.enumlabel);
    }
    
    assert(enums.user_role && enums.user_role.includes('USER') && enums.user_role.includes('ADMIN') && enums.user_role.includes('CONTENT_MANAGER'), 'ENUM "user_role" contains USER, ADMIN, CONTENT_MANAGER');
    assert(enums.interaction_type && enums.interaction_type.includes('VIEW') && enums.interaction_type.includes('PURCHASE'), 'ENUM "interaction_type" contains telemetry action types');
    assert(enums.order_status && enums.order_status.includes('PENDING') && enums.order_status.includes('DELIVERED'), 'ENUM "order_status" contains order states');

    // 3. User accounts & bcrypt password verification
    const usersRes = await client.query('SELECT id, email, role, password_hash, full_name FROM users ORDER BY id');
    assert(usersRes.rowCount === 3, 'Exactly 3 default actor accounts created');
    
    const adminUser = usersRes.rows.find(u => u.email === 'admin@cartify.com');
    assert(adminUser && adminUser.role === 'ADMIN', 'admin@cartify.com has role ADMIN');
    const adminPassValid = adminUser ? await bcrypt.compare('AdminPassword123!', adminUser.password_hash) : false;
    assert(adminPassValid, 'admin@cartify.com password hash validates via bcrypt');

    const cmUser = usersRes.rows.find(u => u.email === 'manager@cartify.com');
    assert(cmUser && cmUser.role === 'CONTENT_MANAGER', 'manager@cartify.com has role CONTENT_MANAGER');
    const cmPassValid = cmUser ? await bcrypt.compare('ManagerPassword123!', cmUser.password_hash) : false;
    assert(cmPassValid, 'manager@cartify.com password hash validates via bcrypt');

    const shopperUser = usersRes.rows.find(u => u.email === 'shopper@cartify.com');
    assert(shopperUser && shopperUser.role === 'USER', 'shopper@cartify.com has role USER');
    const shopperPassValid = shopperUser ? await bcrypt.compare('ShopperPassword123!', shopperUser.password_hash) : false;
    assert(shopperPassValid, 'shopper@cartify.com password hash validates via bcrypt');

    // 4. Categories check
    const catRes = await client.query('SELECT count(*) FROM categories');
    assert(parseInt(catRes.rows[0].count) === 8, '8 standard categories seeded');

    // 5. Products schema columns check
    const prodColsRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    const prodCols = {};
    prodColsRes.rows.forEach(c => prodCols[c.column_name] = c);

    assert(prodCols.id && prodCols.id.data_type === 'bigint', 'products.id is BIGINT primary key');
    assert(prodCols.source && prodCols.source_id, 'products contains dataset-independent "source" & "source_id" columns');
    assert(prodCols.price && prodCols.final_price && prodCols.discount_percentage, 'products contains price (MRP), final_price, and discount_percentage');
    assert(prodCols.rating && prodCols.rating.is_nullable === 'YES', 'products.rating allows genuine NULL for unrated items (no fake ratings)');
    assert(prodCols.search_vector, 'products contains search_vector tsvector column for full-text search');

    // 6. Constraints check
    const constraintsRes = await client.query(`
      SELECT conname FROM pg_constraint WHERE conrelid = 'products'::regclass
    `);
    const constraints = constraintsRes.rows.map(r => r.conname);
    assert(constraints.includes('uq_product_source_id'), 'products has UNIQUE constraint on (source, source_id)');

    console.log(`\n====================================================`);
    console.log(`   PHASE 1A VERIFICATION SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log(`====================================================\n`);

    if (passed !== total) {
      throw new Error(`Phase 1A Verification Failed: ${total - passed} tests failed.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

verifyPhase1A().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
