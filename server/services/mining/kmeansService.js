import { query } from '../../config/db.js';

export const kmeansService = {
  /**
   * Generates RFM (Recency, Frequency, Monetary) metrics for all users.
   */
  async extractRFM() {
    const text = `
      SELECT 
        u.id AS customer_id,
        u.full_name,
        COALESCE(
          CURRENT_DATE - MAX(COALESCE(o.created_at, u.created_at))::date,
          0
        ) AS recency,
        COUNT(o.id) AS frequency,
        COALESCE(SUM(o.total_amount), 0) AS monetary
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status IN ('DELIVERED', 'SHIPPED')
      GROUP BY u.id, u.full_name
    `;
    const res = await query(text);
    return res.rows.map(row => ({
      ...row,
      recency: Math.max(0, parseFloat(row.recency) || 0),
      frequency: parseInt(row.frequency, 10) || 0,
      monetary: Math.max(0, parseFloat(row.monetary) || 0)
    }));
  },

  /**
   * Normalize data using Min-Max scaling
   */
  normalize(data, key) {
    if (data.length === 0) return [];
    let min = data[0][key];
    let max = data[0][key];
    for (let i = 1; i < data.length; i++) {
      if (data[i][key] < min) min = data[i][key];
      if (data[i][key] > max) max = data[i][key];
    }
    
    if (max === min) {
      return data.map(() => 0.5); // avoid division by zero
    }
    
    return data.map(item => (item[key] - min) / (max - min));
  },

  /**
   * Euclidean distance between two points
   */
  distance(p1, p2) {
    return Math.sqrt(
      Math.pow(p1.r - p2.r, 2) +
      Math.pow(p1.f - p2.f, 2) +
      Math.pow(p1.m - p2.m, 2)
    );
  },

  /**
   * Main K-Means Algorithm to cluster customers based on RFM
   */
  async clusterCustomers() {
    const customers = await this.extractRFM();
    if (customers.length === 0) return { centroids: [], clusters: [] };

    // 1. Normalize
    const rNorm = this.normalize(customers, 'recency');
    const fNorm = this.normalize(customers, 'frequency');
    const mNorm = this.normalize(customers, 'monetary');

    // Create normalized point list
    const points = customers.map((c, i) => ({
      ...c,
      norm: { r: rNorm[i], f: fNorm[i], m: mNorm[i] }
    }));

    // 2. Initialize Centroids (K = 4)
    // We strategically place initial centroids to match semantic clusters:
    // Cluster 1: Champions (Low R, High F, High M) -> norm: r:0, f:1, m:1
    // Cluster 2: Loyal (Mod R, Mod F, Mod M) -> norm: r:0.3, f:0.5, m:0.5
    // Cluster 3: At-Risk (High R, Mod F, Mod M) -> norm: r:0.8, f:0.5, m:0.5
    // Cluster 4: New/Inactive (High R, Low F, Low M) -> norm: r:1, f:0, m:0
    
    let centroids = [
      {
        id: 'champions',
        r: 0.0,
        f: 1.0,
        m: 1.0,
        label: 'Champions / High-Value',
        strategy: 'Reward with VIP loyalty perks, exclusive early access, and dedicated support.'
      },
      {
        id: 'loyal',
        r: 0.3,
        f: 0.5,
        m: 0.5,
        label: 'Loyal Customers',
        strategy: 'Upsell premium collections, introduce tiered bundle discounts, and referral programs.'
      },
      {
        id: 'at_risk',
        r: 0.8,
        f: 0.5,
        m: 0.5,
        label: 'At-Risk / Potential Churn',
        strategy: 'Trigger automated win-back emails with limited-time coupons and feedback forms.'
      },
      {
        id: 'new_inactive',
        r: 1.0,
        f: 0.0,
        m: 0.0,
        label: 'New / Inactive Explorers',
        strategy: 'Deliver curated welcome guides, entry-order vouchers, and trending recommendations.'
      }
    ];

    let assignments = new Array(points.length).fill(-1);
    let changed = true;
    const MAX_ITER = 100;
    let iter = 0;

    // 3. K-Means Loop
    while (changed && iter < MAX_ITER) {
      changed = false;
      iter++;

      // Assign points to nearest centroid
      for (let i = 0; i < points.length; i++) {
        let minDist = Infinity;
        let bestCluster = -1;

        for (let k = 0; k < centroids.length; k++) {
          const dist = this.distance(points[i].norm, centroids[k]);
          if (dist < minDist) {
            minDist = dist;
            bestCluster = k;
          }
        }

        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      // Update centroids
      const sums = centroids.map(() => ({ r: 0, f: 0, m: 0, count: 0 }));
      
      for (let i = 0; i < points.length; i++) {
        const cluster = assignments[i];
        sums[cluster].r += points[i].norm.r;
        sums[cluster].f += points[i].norm.f;
        sums[cluster].m += points[i].norm.m;
        sums[cluster].count++;
      }

      for (let k = 0; k < centroids.length; k++) {
        if (sums[k].count > 0) {
          centroids[k].r = sums[k].r / sums[k].count;
          centroids[k].f = sums[k].f / sums[k].count;
          centroids[k].m = sums[k].m / sums[k].count;
        }
      }
    }

    // 4. Format Results
    const clusterResults = centroids.map((c, k) => {
      const clusterPoints = points.filter((_, i) => assignments[i] === k);
      
      const avgR = clusterPoints.length ? clusterPoints.reduce((acc, p) => acc + p.recency, 0) / clusterPoints.length : 0;
      const avgF = clusterPoints.length ? clusterPoints.reduce((acc, p) => acc + p.frequency, 0) / clusterPoints.length : 0;
      const avgM = clusterPoints.length ? clusterPoints.reduce((acc, p) => acc + p.monetary, 0) / clusterPoints.length : 0;
      const aov = avgF > 0 ? parseFloat((avgM / avgF).toFixed(2)) : 0;
      
      return {
        id: c.id,
        label: c.label,
        strategy: c.strategy,
        customerCount: clusterPoints.length,
        averageRecency: Math.round(avgR),
        averageFrequency: parseFloat(avgF.toFixed(2)),
        averageMonetary: parseFloat(avgM.toFixed(2)),
        averageOrderValue: aov,
        customers: clusterPoints.map(p => ({
          id: p.customer_id,
          name: p.full_name || `Customer #${p.customer_id}`,
          recency: p.recency,
          frequency: p.frequency,
          monetary: p.monetary,
          clusterId: c.id
        }))
      };
    });

    return {
      centroids: centroids.map(c => ({ id: c.id, label: c.label, strategy: c.strategy, normR: c.r, normF: c.f, normM: c.m })),
      clusters: clusterResults
    };
  }
};
