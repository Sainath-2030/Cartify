import pg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function verifyAll() {
  console.log('====================================================');
  console.log('   CARTIFY CHUNK 3.1 FULL VERIFICATION SUITE       ');
  console.log('====================================================\n');

  // Fetch test users & products
  const userRes = await pool.query("SELECT id, email, role, password_hash FROM users WHERE role = 'USER' LIMIT 1");
  const user = userRes.rows[0];
  const prodRes = await pool.query('SELECT id, name, slug, final_price, stock_quantity FROM products WHERE stock_quantity >= 10 LIMIT 3');
  const [p1, p2, p3] = prodRes.rows;

  console.log(`[Setup] Test Shopper: ${user.email} (ID: ${user.id})`);
  console.log(`[Setup] Test Product 1: ${p1.name} (ID: ${p1.id}, Stock: ${p1.stock_quantity})`);
  console.log(`[Setup] Test Product 2: ${p2.name} (ID: ${p2.id}, Stock: ${p2.stock_quantity})`);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '2h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 1. Test Existing Product Browsing & Catalogue APIs
  console.log('\n[1/7] Testing Existing Product Browsing & Catalogue APIs...');
  const productsRes = await fetch('http://localhost:5000/api/products?limit=5');
  const productsData = await productsRes.json();
  if (productsRes.status !== 200 || !productsData.success || productsData.data.length === 0) {
    throw new Error('Products API failed');
  }
  console.log(`✓ GET /api/products returns 200 OK (${productsData.pagination.total} total products)`);

  const catRes = await fetch('http://localhost:5000/api/categories');
  const catData = await catRes.json();
  if (catRes.status !== 200 || !catData.success || catData.data.length !== 8) {
    throw new Error('Categories API failed');
  }
  console.log(`✓ GET /api/categories returns 200 OK (8 categories)`);

  const slugRes = await fetch(`http://localhost:5000/api/products/slug/${p1.slug}`);
  const slugData = await slugRes.json();
  if (slugRes.status !== 200 || !slugData.success) {
    throw new Error('Product slug API failed');
  }
  console.log(`✓ GET /api/products/slug/${p1.slug} returns 200 OK`);

  // 2. Test Unauthorized Access
  console.log('\n[2/7] Testing Unauthorized Access...');
  const unauthGet = await fetch('http://localhost:5000/api/cart');
  if (unauthGet.status !== 401) throw new Error('Expected 401 Unauthorized for GET /api/cart');
  const unauthPost = await fetch('http://localhost:5000/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: p1.id, quantity: 1 }),
  });
  if (unauthPost.status !== 401) throw new Error('Expected 401 Unauthorized for POST /api/cart');
  console.log('✓ Unauthorized requests properly rejected with 401');

  // 3. Test Invalid Product IDs
  console.log('\n[3/7] Testing Invalid Product IDs...');
  const badIdRes = await fetch('http://localhost:5000/api/cart', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: 88888888, quantity: 1 }),
  });
  if (badIdRes.status !== 404) throw new Error('Expected 404 Not Found for non-existent product');
  console.log('✓ Invalid product IDs properly rejected with 404');

  // 4. Test Adding Products to Cart
  console.log('\n[4/7] Testing Adding Products to Cart...');
  // Clear any existing cart items first
  await fetch('http://localhost:5000/api/cart', { method: 'DELETE', headers: authHeaders });

  const add1 = await fetch('http://localhost:5000/api/cart', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: p1.id, quantity: 2 }),
  });
  const add1Data = await add1.json();
  if (add1.status !== 201 || add1Data.data.totalItems !== 2) throw new Error('Failed to add product 1');
  console.log(`✓ Added 2 units of "${p1.name}" (Cart Total: ${add1Data.data.totalItems} items, Subtotal: ₹${add1Data.data.subtotal})`);

  const add2 = await fetch('http://localhost:5000/api/cart', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: p2.id, quantity: 1 }),
  });
  const add2Data = await add2.json();
  if (add2.status !== 201 || add2Data.data.totalItems !== 3) throw new Error('Failed to add product 2');
  console.log(`✓ Added 1 unit of "${p2.name}" (Cart Total: ${add2Data.data.totalItems} items, Subtotal: ₹${add2Data.data.subtotal})`);

  // 5. Test Stock & Quantity Validations
  console.log('\n[5/7] Testing Stock & Quantity Limits...');
  const exceedStock = await fetch('http://localhost:5000/api/cart', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: p1.id, quantity: p1.stock_quantity + 100 }),
  });
  if (exceedStock.status !== 422) throw new Error('Expected 422 for exceeding stock quantity');
  console.log('✓ Quantity exceeding available stock properly rejected with 422');

  // 6. Test Updating Quantity and Removing Items
  console.log('\n[6/7] Testing Quantity Updates and Item Removal...');
  const updateRes = await fetch(`http://localhost:5000/api/cart/${p1.id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ quantity: 4 }),
  });
  const updateData = await updateRes.json();
  if (updateRes.status !== 200 || updateData.data.items.find(i => i.productId == p1.id).quantity !== 4) {
    throw new Error('Failed to update quantity');
  }
  console.log(`✓ Updated quantity to 4 (Subtotal recalculated: ₹${updateData.data.subtotal})`);

  const deleteItemRes = await fetch(`http://localhost:5000/api/cart/${p2.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteItemData = await deleteItemRes.json();
  if (deleteItemRes.status !== 200 || deleteItemData.data.items.length !== 1) {
    throw new Error('Failed to delete item from cart');
  }
  console.log(`✓ Removed product 2 from cart (Remaining lines: ${deleteItemData.data.items.length})`);

  // 7. Test Clear Cart and Persistence
  console.log('\n[7/7] Testing Cart Clear & Persistence...');
  const clearRes = await fetch('http://localhost:5000/api/cart', {
    method: 'DELETE',
    headers: authHeaders,
  });
  const clearData = await clearRes.json();
  if (clearRes.status !== 200 || clearData.data.items.length !== 0) {
    throw new Error('Failed to clear cart');
  }
  console.log('✓ Cart cleared successfully');

  // Verify DB is clean
  const dbCheck = await pool.query('SELECT count(*) FROM cart_items WHERE user_id = $1', [user.id]);
  if (parseInt(dbCheck.rows[0].count, 10) !== 0) throw new Error('DB cart_items not empty');
  console.log('✓ PostgreSQL cart_items verified 0 rows in database');

  console.log('\n====================================================');
  console.log('   ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!   ');
  console.log('====================================================\n');

  await pool.end();
}

verifyAll().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
