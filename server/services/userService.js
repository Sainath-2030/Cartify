import { UserModel } from '../models/userModel.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const UserService = {
  async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  },

  async updateProfile(userId, fields) {
    const camelToSnake = {
      fullName: 'full_name',
      mobile: 'mobile',
      address: 'address',
      city: 'city',
      state: 'state',
      postalCode: 'postal_code',
      dateOfBirth: 'date_of_birth',
      avatarUrl: 'avatar_url',
    };

    const snakeFields = {};
    for (const [camelKey, snakeKey] of Object.entries(camelToSnake)) {
      if (fields[camelKey] !== undefined) {
        snakeFields[snakeKey] = fields[camelKey];
      }
    }

    const updated = await UserModel.updateById(userId, snakeFields);
    if (!updated) {
      throw new AppError('User not found.', 404);
    }
    return updated;
  },

  async getRecommendations(userId, topK = 6) {
    const { pool } = await import('../config/db.js');

    let ncfRecs = [];
    try {
      const { AdminService } = await import('./adminService.js');
      const res = await AdminService.getNcfRecommendations({ userId, topK: topK * 2 });
      if (res && res.recommendations && res.recommendations.length > 0) {
        ncfRecs = res.recommendations;
      }
    } catch (err) {
      console.warn('NCF inference fallback in real-time pipeline:', err.message);
    }

    // 1. Fetch user's active in-session interactions (within the last 24 hours, up to 15 events)
    let recentRows = [];
    try {
      const recentRes = await pool.query(
        `SELECT i.product_id, i.interaction_type, i.created_at, p.category_id, p.brand, p.name
         FROM interactions i
         JOIN products p ON i.product_id = p.id
         WHERE i.user_id = $1 
           AND i.product_id IS NOT NULL
           AND i.created_at >= NOW() - INTERVAL '24 hours'
         ORDER BY i.created_at DESC
         LIMIT 15`,
        [userId]
      );
      recentRows = recentRes.rows;
    } catch (err) {
      console.warn('Failed to query recent interactions:', err.message);
    }

    // 2. If user has active recent browsing/cart signals, compute real-time category affinity & engagement depth
    if (recentRows.length > 0) {
      const categoryEventCount = {};
      const categoryScoreMap = {};
      const viewedProductIds = new Set();
      let hasHighIntentAction = false;

      for (let idx = 0; idx < recentRows.length; idx++) {
        const row = recentRows[idx];
        const pid = parseInt(row.product_id, 10);
        viewedProductIds.add(pid);

        const recencyMultiplier = Math.pow(0.70, idx);
        const t = (row.interaction_type || '').toUpperCase();
        let typeWeight = 2; // VIEW
        if (t === 'PURCHASE') {
          typeWeight = 8;
          if (idx <= 3) hasHighIntentAction = true;
        } else if (t === 'CART_ADD' || t === 'WISHLIST_ADD') {
          typeWeight = 5;
          if (idx <= 3) hasHighIntentAction = true;
        } else if (t === 'RATING' || t === 'REVIEW') {
          typeWeight = 6;
        }

        const cid = parseInt(row.category_id, 10);
        categoryScoreMap[cid] = (categoryScoreMap[cid] || 0) + typeWeight * recencyMultiplier;
        categoryEventCount[cid] = (categoryEventCount[cid] || 0) + 1;
      }

      // Identify primary active category
      const sortedCategories = Object.entries(categoryScoreMap)
        .sort((a, b) => b[1] - a[1])
        .map(([cid]) => parseInt(cid, 10));

      const primaryCatId = sortedCategories[0];
      const primaryCount = categoryEventCount[primaryCatId] || 1;

      // PROPORTIONAL SLATE ALLOCATION (Industry Standard e.g. Amazon / Netflix)
      // engagement depth determines how many slots in the recommendation basket change:
      // 1 view  -> exactly 1 slot  (25% of a 4-item slate, 12.5% of an 8-item slate)
      // 2 views -> exactly 2 slots (50% of a 4-item slate, 25% of an 8-item slate)
      // 3+ views or high-intent action (cart/purchase) -> up to 75% of the slate (retains at least 1 anchor)
      let sessionSlotQuota = 1;
      if (hasHighIntentAction) {
        sessionSlotQuota = Math.min(topK - 1, Math.max(2, Math.floor(topK * 0.75)));
      } else if (primaryCount >= 3) {
        sessionSlotQuota = Math.min(topK - 1, Math.max(2, Math.ceil(topK * 0.60)));
      } else if (primaryCount === 2) {
        sessionSlotQuota = Math.min(topK - 1, Math.max(2, Math.round(topK * 0.50)));
      } else {
        sessionSlotQuota = 1; // Exactly 1 item replaced on 1 casual browse click!
      }

      try {
        // Query high quality candidates for the active session category
        const catRes = await pool.query(
          `SELECT p.id, p.name, p.brand, p.price, p.final_price, p.rating, p.main_image, p.category_id
           FROM products p
           WHERE p.category_id = $1 AND p.is_active = true
           ORDER BY p.rating DESC, p.review_count DESC
           LIMIT 8`,
          [primaryCatId]
        );

        const sessionCandidates = catRes.rows;
        const slate = [];
        const seenIds = new Set();

        // 1. Fill allocated session slots with top active category candidates
        let sessionAdded = 0;
        for (const p of sessionCandidates) {
          if (sessionAdded >= sessionSlotQuota) break;
          const pid = parseInt(p.id, 10);
          if (!seenIds.has(pid)) {
            seenIds.add(pid);
            const score = 0.94 - sessionAdded * 0.02;
            slate.push({
              productId: pid,
              score: parseFloat(score.toFixed(4)),
              affinityPercentage: Math.round(score * 1000) / 10,
              name: p.name,
              price: parseFloat(p.price) || 0,
              finalPrice: parseFloat(p.final_price || p.price) || 0,
              mainImage: p.main_image,
              brand: p.brand || 'Cartify',
              rating: parseFloat(p.rating) || 0,
              categoryId: p.category_id,
              origin: 'realtime_session',
            });
            sessionAdded++;
          }
        }

        // 2. Fill the remaining basket slots with NCF long-term collaborative profile items
        for (const rec of ncfRecs) {
          if (slate.length >= topK) break;
          const pid = parseInt(rec.productId, 10);
          if (!seenIds.has(pid)) {
            seenIds.add(pid);
            slate.push({
              ...rec,
              origin: 'ncf_profile',
            });
          }
        }

        // 3. Fallback fill if NCF candidates are fewer than topK
        if (slate.length < topK) {
          const { ProductModel } = await import('../models/productModel.js');
          const fallback = await ProductModel.findAll({ sort: 'popular', limit: topK });
          for (const fb of fallback) {
            if (slate.length >= topK) break;
            const pid = parseInt(fb.id, 10);
            if (!seenIds.has(pid)) {
              seenIds.add(pid);
              slate.push({
                productId: pid,
                score: 0.80,
                affinityPercentage: 80,
                name: fb.name,
                price: parseFloat(fb.price) || 0,
                finalPrice: parseFloat(fb.final_price || fb.price) || 0,
                mainImage: fb.main_image,
                brand: fb.brand || 'Cartify',
                rating: parseFloat(fb.rating) || 0,
                categoryId: fb.category_id,
                origin: 'catalog_fallback',
              });
            }
          }
        }

        // Assign clean 1-based ranks
        return slate.slice(0, topK).map((item, idx) => ({
          ...item,
          rank: idx + 1,
        }));
      } catch (err) {
        console.warn('Proportional slate generation error:', err.message);
      }
    }

    // 3. If no recent real-time session bias, return pure NCF recommendations
    if (ncfRecs.length > 0) {
      return ncfRecs.slice(0, topK);
    }

    // 4. Fallback if user has no embedding history and no recent interactions
    const { ProductModel } = await import('../models/productModel.js');
    const fallback = await ProductModel.findAll({ sort: 'popular', limit: topK });
    return fallback.map((p, idx) => ({
      rank: idx + 1,
      productId: parseInt(p.id, 10),
      score: 0.85 - idx * 0.05,
      affinityPercentage: Math.round((0.85 - idx * 0.05) * 100),
      name: p.name,
      price: parseFloat(p.price) || 0,
      finalPrice: parseFloat(p.final_price || p.price) || 0,
      mainImage: p.main_image,
      brand: p.brand || 'Cartify',
      rating: parseFloat(p.rating) || 0,
      categoryId: p.category_id,
    }));
  },
};
