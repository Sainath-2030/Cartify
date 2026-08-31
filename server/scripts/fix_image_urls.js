import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function fixAllImages() {
  console.log('====================================================');
  console.log('   FIXING AMAZON CDN IMAGE URLS IN POSTGRESQL       ');
  console.log('====================================================\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Normalize IMAGERENDERING URLs directly in SQL using regex replace
    console.log('1. Normalizing /images/W/IMAGERENDERING_.../ paths...');
    const fixMainRes = await client.query(`
      UPDATE products
      SET main_image = REGEXP_REPLACE(main_image, '/images/W/IMAGERENDERING_[^/]+/images/', '/images/'),
          updated_at = NOW()
      WHERE main_image LIKE '%IMAGERENDERING%'
    `);
    console.log(`✓ Updated ${fixMainRes.rowCount} product main_image URLs.`);

    // 2. Also normalize in images JSON array
    const fixJsonRes = await client.query(`
      UPDATE products
      SET images = jsonb_build_array(main_image)
      WHERE images IS NOT NULL
    `);
    console.log(`✓ Updated ${fixJsonRes.rowCount} product image arrays.`);

    // 3. Purge any product whose image is still invalid or empty
    const purgeRes = await client.query(`
      DELETE FROM products
      WHERE main_image IS NULL
         OR main_image = ''
         OR NOT (main_image LIKE 'http%')
         OR main_image ILIKE '%01RmB9GQpdL%'
         OR main_image ILIKE '%transparent-pixel%'
    `);
    console.log(`✓ Purged ${purgeRes.rowCount} remaining invalid products.`);

    await client.query('COMMIT');
    console.log('\n✓ Transaction COMMITTED successfully!');

    // 4. Verify sample
    const sample = await client.query(`
      SELECT id, name, main_image FROM products
      WHERE name ILIKE '%Portronics Clean M%' OR name ILIKE '%Nik case 7 in 1%'
    `);
    console.log('\nVerified Sample Fixed Products:');
    for (const r of sample.rows) {
      console.log(`  - [ID ${r.id}] ${r.name.slice(0, 45)}... -> ${r.main_image}`);
    }

    const totalRes = await client.query('SELECT count(*) FROM products');
    console.log(`\nTotal Active Products in Database: ${totalRes.rows[0].count}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error fixing images:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllImages().catch(console.error);
