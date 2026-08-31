import pg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function runTests() {
  console.log('--- STARTING BACKEND CART API TESTS ---');

  // 1. Get a test user and a test product
  const userRes = await pool.query('SELECT id, email, role FROM users LIMIT 1');
  const user = userRes.rows[0];
  const prodRes = await pool.query('SELECT id, name, final_price, stock_quantity FROM products WHERE stock_quantity > 5 LIMIT 2');
  const product1 = prodRes.rows[0];
  const product2 = prodRes.rows[1];

  console.log(`Using test user: ID ${user.id} (${user.email})`);
  console.log(`Using test product 1: ID ${product1.id} "${product1.name}" (Stock: ${product1.stock_quantity}, Price: ${product1.final_price})`);

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1h' }
  );

  const baseUrl = 'http://localhost:5000/api/cart';

  // Test 1: Unauthorized access
  console.log('\n[Test 1] GET /api/cart without token...');
  const unauthRes = await fetch(baseUrl);
  const unauthData = await unauthRes.json();
  console.log('Status:', unauthRes.status, 'Body:', unauthData);
  if (unauthRes.status !== 401) throw new Error('Expected 401 Unauthorized');

  // Test 2: Authorized empty cart / initial cart
  console.log('\n[Test 2] GET /api/cart with valid token...');
  const getRes = await fetch(baseUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getData = await getRes.json();
  console.log('Status:', getRes.status, 'Items count:', getData.data?.items?.length, 'Subtotal:', getData.data?.subtotal);
  if (getRes.status !== 200) throw new Error('Expected 200 OK');

  // Test 3: Add invalid product ID
  console.log('\n[Test 3] POST /api/cart with non-existent productId 99999999...');
  const invalidAddRes = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId: 99999999, quantity: 1 }),
  });
  const invalidAddData = await invalidAddRes.json();
  console.log('Status:', invalidAddRes.status, 'Message:', invalidAddData.message);
  if (invalidAddRes.status !== 404) throw new Error('Expected 404 Not Found');

  // Test 4: Add valid product
  console.log(`\n[Test 4] POST /api/cart with product ${product1.id}, qty 2...`);
  const addRes1 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId: product1.id, quantity: 2 }),
  });
  const addData1 = await addRes1.json();
  console.log('Status:', addRes1.status, 'Items:', addData1.data?.items?.length, 'Total Items:', addData1.data?.totalItems, 'Subtotal:', addData1.data?.subtotal);
  if (addRes1.status !== 201) throw new Error('Expected 201 Created');

  // Test 5: Add another product
  console.log(`\n[Test 5] POST /api/cart with product ${product2.id}, qty 1...`);
  const addRes2 = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId: product2.id, quantity: 1 }),
  });
  const addData2 = await addRes2.json();
  console.log('Status:', addRes2.status, 'Items:', addData2.data?.items?.length, 'Total Items:', addData2.data?.totalItems, 'Subtotal:', addData2.data?.subtotal);

  // Test 6: Exceed stock quantity
  console.log(`\n[Test 6] POST /api/cart with excessive quantity (${product1.stock_quantity + 100})...`);
  const exceedRes = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId: product1.id, quantity: product1.stock_quantity + 100 }),
  });
  const exceedData = await exceedRes.json();
  console.log('Status:', exceedRes.status, 'Message:', exceedData.message);
  if (exceedRes.status !== 422) throw new Error('Expected 422 Unprocessable Entity');

  // Test 7: Update quantity
  console.log(`\n[Test 7] PUT /api/cart/${product1.id} set qty to 3...`);
  const updateRes = await fetch(`${baseUrl}/${product1.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ quantity: 3 }),
  });
  const updateData = await updateRes.json();
  console.log('Status:', updateRes.status, 'Updated total items:', updateData.data?.totalItems, 'Subtotal:', updateData.data?.subtotal);
  if (updateRes.status !== 200) throw new Error('Expected 200 OK');

  // Test 8: Remove single product
  console.log(`\n[Test 8] DELETE /api/cart/${product2.id}...`);
  const deleteItemRes = await fetch(`${baseUrl}/${product2.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const deleteItemData = await deleteItemRes.json();
  console.log('Status:', deleteItemRes.status, 'Remaining items:', deleteItemData.data?.items?.length);
  if (deleteItemRes.status !== 200) throw new Error('Expected 200 OK');

  // Test 9: Clear entire cart
  console.log('\n[Test 9] DELETE /api/cart (clear)...');
  const clearRes = await fetch(baseUrl, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const clearData = await clearRes.json();
  console.log('Status:', clearRes.status, 'Items count after clear:', clearData.data?.items?.length);
  if (clearRes.status !== 200) throw new Error('Expected 200 OK');

  console.log('\n>>> ALL BACKEND CART API TESTS PASSED SUCCESSFULLY! <<<\n');
  await pool.end();
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
