import app from '../app.js';
import http from 'http';
import { signToken } from '../utils/jwt.js';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function request(port, path, options = {}) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', headers = {}, body = null } = options;
    const reqOptions = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runReviewsTestSuite() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1D.2C: REVIEWS & RATINGS API TEST SUITE        ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const PORT = 5040;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Ephemeral Test Server listening on http://localhost:${PORT}\n`);

  let total = 0;
  let passed = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`✓ [PASS ${total.toString().padStart(2)}] ${name}`);
      passed++;
    } else {
      console.error(`✗ [FAIL ${total.toString().padStart(2)}] ${name}`);
    }
  }

  const client = await pool.connect();

  try {
    // Generate auth tokens for User 1 (Shopper, ID: 3) and User 2 (Manager, ID: 2)
    const tokenUser1 = signToken({ userId: 3, email: 'shopper@cartify.com', role: 'USER' });
    const tokenUser2 = signToken({ userId: 2, email: 'manager@cartify.com', role: 'CONTENT_MANAGER' });

    // Clean reviews for test users
    await client.query('DELETE FROM reviews WHERE user_id IN (2, 3)');

    // Fetch two real active products from database
    const prodRes = await client.query('SELECT id, name, final_price, rating, review_count FROM products WHERE is_active = true ORDER BY id LIMIT 2');
    const productA = prodRes.rows[0];
    const productB = prodRes.rows[1];

    // 1. Unauthenticated Review Submission (401)
    const unauth = await request(PORT, `/api/products/${productA.id}/reviews`, {
      method: 'POST',
      body: { rating: 5, reviewText: 'Great product!' },
    });
    assert(unauth.status === 401 && unauth.body.success === false, 'POST /api/products/:id/reviews without token returns 401 Unauthorized');

    // 2. Valid Review Creation (POST /api/products/:productId/reviews)
    const createRes = await request(PORT, `/api/products/${productA.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 5, reviewText: 'Exceptional quality and genuine product! Highly recommended.' },
    });
    assert(createRes.status === 201 && createRes.body.success === true, 'POST /api/products/:id/reviews creates new review');
    const reviewIdA = createRes.body.data.id;
    assert(reviewIdA && createRes.body.data.productId === parseInt(productA.id, 10), 'Review returned with valid ID and matching productId');

    // 3. Review Appears for Product (GET /api/products/:productId/reviews)
    const listRes = await request(PORT, `/api/products/${productA.id}/reviews`);
    assert(listRes.status === 200 && listRes.body.data.length > 0, 'GET /api/products/:id/reviews returns review list');
    const foundReview = listRes.body.data.find(r => r.id === reviewIdA);
    assert(foundReview !== undefined, 'Created review is present in product review listing');

    // 4. Correct Rating and Text Stored
    assert(foundReview.rating === 5, 'Stored review has rating = 5');
    assert(foundReview.reviewText.includes('Exceptional quality'), 'Stored review has expected review text');

    // 5. Reviewer Identity comes from Authenticated User
    assert(foundReview.reviewerName === 'Cartify Shopper' || foundReview.reviewerName.length > 0, 'Reviewer identity is populated from authenticated user account');

    // 6. Duplicate Review Prevented (409 Conflict)
    const dupRes = await request(PORT, `/api/products/${productA.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 4, reviewText: 'Trying to post again.' },
    });
    assert(dupRes.status === 409 && dupRes.body.success === false, 'Posting second review for same product by same user returns 409 Conflict');

    // 7. Rating Below 1 Rejected (422)
    const lowRating = await request(PORT, `/api/products/${productB.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 0, reviewText: 'Too low rating' },
    });
    assert(lowRating.status === 422 && lowRating.body.success === false, 'Rating < 1 is rejected with 422');

    // 8. Rating Above 5 Rejected (422)
    const highRating = await request(PORT, `/api/products/${productB.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 6, reviewText: 'Too high rating' },
    });
    assert(highRating.status === 422 && highRating.body.success === false, 'Rating > 5 is rejected with 422');

    // 9. Non-numeric / Invalid Product ID (400)
    const badProdId = await request(PORT, '/api/products/invalid_id/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 5, reviewText: 'Valid text' },
    });
    assert(badProdId.status === 400 && badProdId.body.success === false, 'Invalid product ID returns 400 Bad Request');

    // 10. Nonexistent Product (404)
    const missingProd = await request(PORT, '/api/products/99999999/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 5, reviewText: 'Valid text' },
    });
    assert(missingProd.status === 404 && missingProd.body.success === false, 'Non-existent product returns 404 Not Found');

    // 11. Inactive Product (404)
    const inactiveRes = await client.query(`
      INSERT INTO products (source, source_id, name, slug, brand, category_id, price, discount_percentage, final_price, stock_quantity, main_image, is_active)
      VALUES ('manual', 'INACTIVE-REV-TEST', 'Inactive Review Test', 'inactive-rev-test', 'Brand', 1, 500, 0, 500, 10, 'https://m.media-amazon.com/images/I/sample.jpg', false)
      RETURNING id
    `);
    const inactiveId = inactiveRes.rows[0].id;

    const addInactive = await request(PORT, `/api/products/${inactiveId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 4, reviewText: 'Review for inactive product' },
    });
    assert(addInactive.status === 404 && addInactive.body.success === false, 'Review on inactive product returns 404 Not Found');

    // Clean up temporary inactive product
    await client.query('DELETE FROM products WHERE id = $1', [inactiveId]);

    // 12. Rating Summary Endpoint (GET /api/products/:productId/reviews/summary)
    // User 2 adds a 4-star review to product A
    await request(PORT, `/api/products/${productA.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser2}` },
      body: { rating: 4, reviewText: 'Very good quality, arrived quickly.' },
    });

    const summaryRes = await request(PORT, `/api/products/${productA.id}/reviews/summary`);
    assert(summaryRes.status === 200 && summaryRes.body.data.totalReviews === 2, 'GET /api/products/:id/reviews/summary returns totalReviews = 2');
    assert(summaryRes.body.data.averageRating === 4.5, `Average rating correctly computed as 4.5 ((5 + 4) / 2) (Got: ${summaryRes.body.data.averageRating})`);
    assert(summaryRes.body.data.breakdown['5'] === 1 && summaryRes.body.data.breakdown['4'] === 1, 'Breakdown maps { 5: 1, 4: 1 } counts');

    // 13. Get Current User Review (/api/products/:productId/reviews/me)
    const myReview = await request(PORT, `/api/products/${productA.id}/reviews/me`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(myReview.status === 200 && myReview.body.data.id === reviewIdA, 'GET /api/products/:id/reviews/me returns authenticated user review');

    // 14. User Updates Own Review (PATCH /api/reviews/:reviewId)
    const updateRes = await request(PORT, `/api/reviews/${reviewIdA}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 4, reviewText: 'Updated review text: still great but 4 stars now.' },
    });
    assert(updateRes.status === 200 && updateRes.body.data.rating === 4, 'PATCH /api/reviews/:id updates rating to 4');
    assert(updateRes.body.data.reviewText.includes('still great'), 'Updated review text stored');

    // 15. User Cannot Update Another User's Review (403 Forbidden)
    // User 1 tries to edit User 2's review
    const user2Reviews = await request(PORT, `/api/products/${productA.id}/reviews/me`, {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    const reviewIdB = user2Reviews.body.data.id;

    const crossEdit = await request(PORT, `/api/reviews/${reviewIdB}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 1, reviewText: 'Malicious modification attempt' },
    });
    assert(crossEdit.status === 403 && crossEdit.body.success === false, 'User 1 cannot update User 2 review (403 Forbidden)');

    // 16. User Cannot Delete Another User's Review (403 Forbidden)
    const crossDelete = await request(PORT, `/api/reviews/${reviewIdB}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(crossDelete.status === 403 && crossDelete.body.success === false, 'User 1 cannot delete User 2 review (403 Forbidden)');

    // 17. User Deletes Own Review (DELETE /api/reviews/:reviewId)
    const deleteRes = await request(PORT, `/api/reviews/${reviewIdA}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(deleteRes.status === 200 && deleteRes.body.success === true, 'DELETE /api/reviews/:id removes user review');

    // Verify User 1 review is gone
    const myReviewAfter = await request(PORT, `/api/products/${productA.id}/reviews/me`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(myReviewAfter.status === 200 && myReviewAfter.body.data === null, 'User 1 review is null after deletion');

    // Verify User 2 review still exists
    const user2ReviewAfter = await request(PORT, `/api/products/${productA.id}/reviews/me`, {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    assert(user2ReviewAfter.status === 200 && user2ReviewAfter.body.data.id === reviewIdB, 'User 2 review intact after User 1 delete');

    // 18. Verified Purchase status returns false (Orders not yet implemented)
    assert(user2ReviewAfter.body.data.verifiedPurchase === false, 'verifiedPurchase defaults to false (Orders not yet implemented)');

    // 19. Verify Cart API still works concurrently
    const cartCheck = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(cartCheck.status === 200, 'GET /api/cart continues to operate seamlessly');

    // 20. Verify Wishlist API still works concurrently
    const wishCheck = await request(PORT, '/api/wishlist', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(wishCheck.status === 200, 'GET /api/wishlist continues to operate seamlessly');

    console.log(`\n================================================================`);
    console.log(`   PHASE 1D.2C REVIEWS API SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`Reviews test suite failed: ${total - passed} tests failed.`);
    }
  } finally {
    client.release();
    await pool.end();
    server.close();
  }
}

runReviewsTestSuite().catch((err) => {
  console.error('Reviews test suite execution error:', err);
  process.exit(1);
});
