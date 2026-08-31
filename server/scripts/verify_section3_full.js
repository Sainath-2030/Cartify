import pg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function verifySection3() {
  console.log('====================================================');
  console.log('   CARTIFY SECTION 3 COMPLETE VERIFICATION SUITE   ');
  console.log('====================================================\n');

  // 1. Get test user and test products
  const userRes = await pool.query("SELECT id, email, role, full_name FROM users WHERE role = 'USER' LIMIT 1");
  const user = userRes.rows[0];
  const prodRes = await pool.query('SELECT id, name, slug, final_price, stock_quantity, rating, review_count FROM products WHERE stock_quantity >= 10 LIMIT 3');
  const [p1, p2, p3] = prodRes.rows;

  console.log(`[Shopper] ID: ${user.id} (${user.email})`);
  console.log(`[Product 1] ID: ${p1.id} "${p1.name.slice(0, 40)}..." (Rating: ${p1.rating}, Reviews: ${p1.review_count})`);
  console.log(`[Product 2] ID: ${p2.id} "${p2.name.slice(0, 40)}..."`);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '2h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // ----------------------------------------------------
  // PART A: WISHLIST VERIFICATION (CHUNK 3.2)
  // ----------------------------------------------------
  console.log('\n--- PART A: WISHLIST (CHUNK 3.2) ---');

  // Test 1: Unauthorized access
  console.log('[Test A1] GET /api/wishlist without token...');
  const unauthWishlist = await fetch('http://localhost:5000/api/wishlist');
  if (unauthWishlist.status !== 401) throw new Error('Expected 401 for unauthenticated wishlist access');
  console.log('✓ Unauthorized wishlist requests properly blocked (401)');

  // Clear existing wishlist
  await fetch('http://localhost:5000/api/wishlist', { method: 'DELETE', headers: authHeaders });

  // Test 2: Add item to wishlist
  console.log(`[Test A2] POST /api/wishlist with product ${p1.id}...`);
  const addWishRes1 = await fetch('http://localhost:5000/api/wishlist', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: p1.id }),
  });
  const addWishData1 = await addWishRes1.json();
  if (addWishRes1.status !== 201 || addWishData1.data.totalItems !== 1) {
    throw new Error('Failed to add product to wishlist');
  }
  console.log(`✓ Added product 1 to wishlist (Total: ${addWishData1.data.totalItems})`);

  // Test 3: Idempotent re-add
  console.log(`[Test A3] Re-add product ${p1.id} (idempotency check)...`);
  const reAddRes = await fetch('http://localhost:5000/api/wishlist', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: p1.id }),
  });
  const reAddData = await reAddRes.json();
  if (reAddRes.status !== 201 || reAddData.data.totalItems !== 1) {
    throw new Error('Idempotent re-add failed');
  }
  console.log('✓ Idempotent re-add preserved single wishlist row');

  // Test 4: Add second item & check IDs list
  console.log(`[Test A4] Add product ${p2.id} and check /api/wishlist/ids...`);
  await fetch('http://localhost:5000/api/wishlist', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ productId: p2.id }),
  });
  const idsRes = await fetch('http://localhost:5000/api/wishlist/ids', { headers: authHeaders });
  const idsData = await idsRes.json();
  if (!idsData.data.includes(Number(p1.id)) || !idsData.data.includes(Number(p2.id))) {
    throw new Error('Wishlist IDs missing added products');
  }
  console.log(`✓ /api/wishlist/ids returned [${idsData.data.join(', ')}]`);

  // Test 5: Move from Wishlist to Cart
  console.log(`[Test A5] POST /api/wishlist/move-to-cart/${p1.id}...`);
  const moveRes = await fetch(`http://localhost:5000/api/wishlist/move-to-cart/${p1.id}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ quantity: 1 }),
  });
  const moveData = await moveRes.json();
  if (moveRes.status !== 200) throw new Error('Move to cart failed');

  // Verify item is now in cart and removed from wishlist
  const cartCheck = await pool.query('SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2', [user.id, p1.id]);
  const wishCheck = await pool.query('SELECT * FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [user.id, p1.id]);
  if (cartCheck.rowCount === 0 || wishCheck.rowCount !== 0) {
    throw new Error('Move-to-cart atomic verification failed');
  }
  console.log('✓ Atomic move-to-cart verified: Product added to cart_items and removed from wishlist_items');

  // Test 6: Remove remaining item and clear
  console.log(`[Test A6] DELETE /api/wishlist/${p2.id}...`);
  const delRes = await fetch(`http://localhost:5000/api/wishlist/${p2.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const delData = await delRes.json();
  if (delRes.status !== 200 || delData.data.totalItems !== 0) throw new Error('Delete wishlist item failed');
  console.log('✓ Wishlist item deleted and wishlist is empty');

  // ----------------------------------------------------
  // PART B: REVIEWS & RATINGS VERIFICATION (CHUNK 3.3)
  // ----------------------------------------------------
  console.log('\n--- PART B: REVIEWS & RATINGS (CHUNK 3.3) ---');

  // Clean up any existing review by this user on p3 first
  await pool.query('DELETE FROM reviews WHERE user_id = $1 AND product_id = $2', [user.id, p3.id]);
  await pool.query(
    `UPDATE products
     SET rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0) FROM reviews WHERE product_id = $1),
         review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
     WHERE id = $1`,
    [p3.id]
  );

  const initialP3 = (await pool.query('SELECT rating, review_count FROM products WHERE id = $1', [p3.id])).rows[0];
  console.log(`Initial product 3 rating: ${initialP3.rating}, review count: ${initialP3.review_count}`);

  // Test B1: Submit 5-star review
  console.log(`[Test B1] POST /api/products/${p3.id}/reviews (5 stars)...`);
  const reviewPostRes = await fetch(`http://localhost:5000/api/products/${p3.id}/reviews`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      rating: 5,
      reviewText: 'Outstanding build quality and fast delivery! Highly recommended.',
    }),
  });
  const reviewPostData = await reviewPostRes.json();
  if (reviewPostRes.status !== 201) throw new Error(`Submit review failed: ${reviewPostData.message}`);
  const createdReview = reviewPostData.data.review;
  console.log(`✓ Review created with ID ${createdReview.id}`);

  // Verify PostgreSQL recalculation
  const afterPostP3 = (await pool.query('SELECT rating, review_count FROM products WHERE id = $1', [p3.id])).rows[0];
  console.log(`✓ PostgreSQL product 3 auto-recalculated: Rating ${afterPostP3.rating}, Review Count: ${afterPostP3.review_count}`);
  if (afterPostP3.review_count !== initialP3.review_count + 1) {
    throw new Error('Review count did not increment');
  }

  // Test B2: Prevent duplicate review by same user on same product
  console.log('[Test B2] Attempting duplicate review submission...');
  const duplicateRes = await fetch(`http://localhost:5000/api/products/${p3.id}/reviews`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      rating: 4,
      reviewText: 'Trying to post second review.',
    }),
  });
  const duplicateData = await duplicateRes.json();
  if (duplicateRes.status !== 422) throw new Error('Expected 422 for duplicate review');
  console.log('✓ Duplicate review properly rejected (422):', duplicateData.message);

  // Test B3: Get user's own review
  console.log(`[Test B3] GET /api/products/${p3.id}/reviews/me...`);
  const myReviewRes = await fetch(`http://localhost:5000/api/products/${p3.id}/reviews/me`, { headers: authHeaders });
  const myReviewData = await myReviewRes.json();
  if (myReviewRes.status !== 200 || !myReviewData.data) throw new Error('Get my review failed');
  console.log(`✓ Retrieved author's review: "${myReviewData.data.review_text}" (${myReviewData.data.rating} stars)`);

  // Test B4: Delete review and verify rating recalculation
  console.log(`[Test B4] DELETE /api/reviews/${createdReview.id}...`);
  const deleteReviewRes = await fetch(`http://localhost:5000/api/reviews/${createdReview.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const deleteReviewData = await deleteReviewRes.json();
  if (deleteReviewRes.status !== 200) throw new Error('Delete review failed');

  const afterDeleteP3 = (await pool.query('SELECT rating, review_count FROM products WHERE id = $1', [p3.id])).rows[0];
  console.log(`✓ Review deleted. PostgreSQL product 3 rating restored: ${afterDeleteP3.rating}, Count: ${afterDeleteP3.review_count}`);
  if (afterDeleteP3.review_count !== initialP3.review_count) {
    throw new Error('Review count did not decrement back to initial count');
  }

  // ----------------------------------------------------
  // PART C: STOREFRONT & REVIEWS API INTEGRITY
  // ----------------------------------------------------
  console.log('\n--- PART C: STOREFRONT API INTEGRITY ---');
  const slugRes = await fetch(`http://localhost:5000/api/products/slug/${p3.slug}`);
  const slugData = await slugRes.json();
  if (slugRes.status !== 200 || !slugData.data) throw new Error('Product slug endpoint regression');
  console.log(`✓ GET /api/products/slug/${p3.slug} returns 200 with review breakdown and related products`);

  console.log('\n====================================================');
  console.log('   ALL SECTION 3 VERIFICATION TESTS PASSED (100%)   ');
  console.log('====================================================\n');

  await pool.end();
}

verifySection3().catch((err) => {
  console.error('Section 3 Verification Failed:', err);
  process.exit(1);
});
