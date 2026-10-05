import { query } from '../../config/db.js';

/**
 * Cartify DWM Section 7 — Higher-Order Apriori Association Rule Mining Engine
 *
 * Replaces the original 2-itemset-only brute-force implementation with a
 * textbook Apriori algorithm that supports L1 through L_k (default k=3, max k=4):
 *
 *   1. Build L1 from per-item support counts (single database scan).
 *   2. Generate L_{k} candidates from L_{k-1} via the F_{k-1} × F_{k-1} join
 *      on a shared (k-2) prefix — the canonical "Apriori candidate generation" step.
 *   3. Prune any candidate whose (k-1)-subsets are not all frequent
 *      (anti-monotonicity / Apriori property).
 *   4. Count support for surviving candidates using a transaction inverted
 *      index (O(|T| × avgBasketSize) per level rather than O(|C_k| × |T|)).
 *   5. Generate rules from every frequent itemset at every level:
 *        X → Y  for all non-empty proper subsets X of the itemset.
 *      Filter on minSupport, minConfidence, minLift.
 *
 * Safety guards:
 *   - maxItemsetSize is clamped to [2, 4].
 *   - Candidate generation halts when the candidate count exceeds CANDIDATE_CAP
 *     (returns isTruncated: true in metadata so the caller can inform the UI).
 *   - A hard minSupport floor of 0.001 prevents runaway enumeration on dense
 *     baskets.
 *
 * Each rule carries itemsetSize and antecedentSize so the UI can badge
 * higher-order rules distinctly from 2-itemset rules.
 */

const CANDIDATE_CAP = 50_000;
const MIN_SUPPORT_FLOOR = 0.001;

export const aprioriService = {
  /**
   * Extract transactional baskets from order_items.
   * Returns rows with item_ids (array of BigInt product IDs) and item_names.
   */
  async extractTransactions() {
    const text = `
      SELECT
        oi.order_id,
        array_agg(oi.product_id::bigint ORDER BY oi.product_id) AS item_ids,
        array_agg(p.name ORDER BY oi.product_id)                AS item_names
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      GROUP BY oi.order_id
      HAVING COUNT(oi.product_id) > 1
    `;
    const res = await query(text);
    return res.rows;
  },

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Canonical sorted string key for an itemset (numbers, ascending).
   * @param {number[]} itemset
   * @returns {string}
   */
  _key(itemset) {
    return itemset.slice().sort((a, b) => a - b).join(',');
  },

  /**
   * Generate all (k)-itemset candidates from a list of frequent (k-1)-itemsets
   * using the textbook F_{k-1} × F_{k-1} join on shared prefix of length k-2.
   *
   * Both itemsets must be stored sorted.  A pair (p, q) joins when:
   *   p[0..k-3] === q[0..k-3]  &&  p[k-2] < q[k-2]
   *
   * @param {number[][]} prevFrequent  sorted (k-1)-itemsets
   * @returns {{ candidates: number[][], truncated: boolean }}
   */
  _generateCandidates(prevFrequent) {
    const candidates = [];
    const n = prevFrequent.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const p = prevFrequent[i];
        const q = prevFrequent[j];
        const k1 = p.length; // length of previous level (k-1)

        // Check shared prefix of length k-2
        let prefixMatch = true;
        for (let m = 0; m < k1 - 1; m++) {
          if (p[m] !== q[m]) { prefixMatch = false; break; }
        }
        if (!prefixMatch) break; // sorted order means no more matches for this i

        // The last elements must be different (guaranteed by i < j and sorted)
        candidates.push([...p, q[k1 - 1]]);

        if (candidates.length >= CANDIDATE_CAP) {
          return { candidates, truncated: true };
        }
      }
    }
    return { candidates, truncated: false };
  },

  /**
   * Prune candidates whose (k-1)-subsets are not all in the frequent set.
   *
   * @param {number[][]} candidates
   * @param {Set<string>} frequentKeys  canonical keys of the (k-1)-frequent itemsets
   * @returns {number[][]}
   */
  _pruneByAntiMonotonicity(candidates, frequentKeys) {
    return candidates.filter(candidate => {
      // Generate all (k-1)-subsets and verify each is frequent
      const k = candidate.length;
      for (let drop = 0; drop < k; drop++) {
        const subset = candidate.filter((_, idx) => idx !== drop);
        if (!frequentKeys.has(this._key(subset))) return false;
      }
      return true;
    });
  },

  /**
   * Count support for each candidate using a transaction inverted index.
   *
   * Builds a Map<productId, Set<txIndex>> once per call (reused across
   * candidates).  Each candidate is evaluated by intersecting the transaction
   * sets of all its items.
   *
   * @param {number[][]} candidates
   * @param {Map<number, Set<number>>} invertedIndex  item → set of tx indices
   * @param {number} totalTransactions
   * @param {number} minSupportCount  absolute count threshold
   * @returns {{ frequent: number[][], supportMap: Map<string, number> }}
   */
  _countSupportViaIndex(candidates, invertedIndex, totalTransactions, minSupportCount) {
    const frequent = [];
    const supportMap = new Map();

    for (const candidate of candidates) {
      // Intersection: start with the smallest set for speed
      const sets = candidate
        .map(item => invertedIndex.get(item) || new Set())
        .sort((a, b) => a.size - b.size);

      let intersection = sets[0];
      for (let i = 1; i < sets.length; i++) {
        const next = new Set();
        for (const txIdx of intersection) {
          if (sets[i].has(txIdx)) next.add(txIdx);
        }
        intersection = next;
        if (intersection.size < minSupportCount) break;
      }

      if (intersection.size >= minSupportCount) {
        frequent.push(candidate);
        supportMap.set(this._key(candidate), intersection.size);
      }
    }

    return { frequent, supportMap };
  },

  /**
   * Generate all non-empty proper subsets of an array.
   * Used for rule extraction: each subset becomes a potential antecedent.
   *
   * @param {number[]} itemset
   * @returns {Array<{ antecedent: number[], consequent: number[] }>}
   */
  _generateRuleSplits(itemset) {
    const splits = [];
    const k = itemset.length;
    // Iterate through all non-empty subsets except the full set itself
    const limit = (1 << k) - 1;
    for (let mask = 1; mask < limit; mask++) {
      const antecedent = [];
      const consequent = [];
      for (let bit = 0; bit < k; bit++) {
        if (mask & (1 << bit)) antecedent.push(itemset[bit]);
        else consequent.push(itemset[bit]);
      }
      if (consequent.length > 0) splits.push({ antecedent, consequent });
    }
    return splits;
  },

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Mine higher-order association rules using the full Apriori algorithm.
   *
   * @param {object} options
   * @param {number} [options.minSupport=0.01]       Minimum relative support [0,1]
   * @param {number} [options.minConfidence=0.2]     Minimum confidence [0,1]
   * @param {number} [options.minLift=1.0]           Minimum lift
   * @param {number} [options.maxItemsetSize=3]      Maximum itemset size (2..4)
   * @returns {Promise<{
   *   rules: object[],
   *   meta: {
   *     totalTransactions: number,
   *     frequentItemsetCounts: object,
   *     isTruncated: boolean,
   *     maxItemsetSize: number,
   *     effectiveMinSupport: number
   *   }
   * }>}
   */
  async mineAssociationRules({
    minSupport = 0.01,
    minConfidence = 0.2,
    minLift = 1.0,
    maxItemsetSize = 3
  } = {}) {
    // Guard inputs
    const effectiveMinSupport = Math.max(MIN_SUPPORT_FLOOR, Math.min(1, minSupport));
    const effectiveMaxK = Math.max(2, Math.min(4, Math.round(maxItemsetSize)));

    // ---- 1. Extract transactions -------------------------------------------
    const txData = await this.extractTransactions();
    const transactions = txData.map(t => t.item_ids.map(Number));
    const totalTransactions = transactions.length;

    if (totalTransactions === 0) {
      return {
        rules: [],
        meta: { totalTransactions: 0, frequentItemsetCounts: {}, isTruncated: false, maxItemsetSize: effectiveMaxK, effectiveMinSupport }
      };
    }

    // Build id → name map
    const idToName = {};
    txData.forEach(t => {
      t.item_ids.map(Number).forEach((id, i) => { idToName[id] = t.item_names[i]; });
    });

    const minSupportCount = Math.ceil(effectiveMinSupport * totalTransactions);

    // ---- 2. Build inverted index: item → Set<txIndex> ----------------------
    const invertedIndex = new Map();
    transactions.forEach((basket, txIdx) => {
      const unique = new Set(basket);
      for (const item of unique) {
        if (!invertedIndex.has(item)) invertedIndex.set(item, new Set());
        invertedIndex.get(item).add(txIdx);
      }
    });

    // ---- 3. L1: frequent 1-itemsets ----------------------------------------
    const l1Frequent = [];
    const globalSupportMap = new Map(); // key → absolute count (all levels)

    for (const [item, txSet] of invertedIndex) {
      if (txSet.size >= minSupportCount) {
        l1Frequent.push([item]);
        globalSupportMap.set(String(item), txSet.size);
      }
    }

    // Sort for deterministic candidate generation
    l1Frequent.sort((a, b) => a[0] - b[0]);

    const frequentByLevel = { 1: l1Frequent };
    const frequentItemsetCounts = { 1: l1Frequent.length };
    let isTruncated = false;

    // ---- 4. Iterative Apriori for k = 2 … maxK ----------------------------
    let prevFrequent = l1Frequent;
    let prevKeys = new Set(l1Frequent.map(s => this._key(s)));

    for (let k = 2; k <= effectiveMaxK; k++) {
      if (prevFrequent.length < k) break; // can't form k-itemsets from fewer than k items

      // 4a. Generate candidates
      const { candidates, truncated } = this._generateCandidates(prevFrequent);
      if (truncated) { isTruncated = true; }

      if (candidates.length === 0) break;

      // 4b. Prune by anti-monotonicity (skip for k=2 since all L1 subsets are
      //     already guaranteed frequent — saves one redundant pass)
      const pruned = k === 2
        ? candidates
        : this._pruneByAntiMonotonicity(candidates, prevKeys);

      if (pruned.length === 0) break;

      // 4c. Count support
      const { frequent, supportMap } = this._countSupportViaIndex(
        pruned, invertedIndex, totalTransactions, minSupportCount
      );

      if (frequent.length === 0) break;

      // Merge into global support map
      for (const [key, cnt] of supportMap) globalSupportMap.set(key, cnt);

      // Sort for next iteration's candidate join
      frequent.sort((a, b) => {
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return a[i] - b[i];
        }
        return 0;
      });

      frequentByLevel[k] = frequent;
      frequentItemsetCounts[k] = frequent.length;

      prevFrequent = frequent;
      prevKeys = new Set(frequent.map(s => this._key(s)));
    }

    // ---- 5. Rule generation ------------------------------------------------
    const rules = [];

    for (const [level, itemsets] of Object.entries(frequentByLevel)) {
      const k = parseInt(level, 10);
      if (k < 2) continue; // no rules from 1-itemsets

      for (const itemset of itemsets) {
        const suppXY = globalSupportMap.get(this._key(itemset)) / totalTransactions;

        for (const { antecedent, consequent } of this._generateRuleSplits(itemset)) {
          const suppX = globalSupportMap.get(this._key(antecedent)) / totalTransactions;
          const suppY = globalSupportMap.get(this._key(consequent)) / totalTransactions;

          if (!suppX || !suppY) continue; // safety — should never happen

          const confidence = suppXY / suppX;
          const lift = confidence / suppY;

          if (confidence < minConfidence || lift < minLift) continue;

          rules.push({
            antecedent: antecedent.slice().sort((a, b) => a - b),
            antecedentNames: antecedent.slice().sort((a, b) => a - b).map(id => idToName[id] || `Product #${id}`),
            consequent: consequent.slice().sort((a, b) => a - b),
            consequentNames: consequent.slice().sort((a, b) => a - b).map(id => idToName[id] || `Product #${id}`),
            support: parseFloat(suppXY.toFixed(4)),
            confidence: parseFloat(confidence.toFixed(4)),
            lift: parseFloat(lift.toFixed(4)),
            // Section 7 additions: itemset size metadata for UI badging
            itemsetSize: k,
            antecedentSize: antecedent.length,
            consequentSize: consequent.length
          });
        }
      }
    }

    // Sort by Lift desc, then Confidence desc, then itemsetSize desc
    rules.sort((a, b) =>
      b.lift - a.lift ||
      b.confidence - a.confidence ||
      b.itemsetSize - a.itemsetSize
    );

    return {
      rules,
      meta: {
        totalTransactions,
        frequentItemsetCounts,
        isTruncated,
        maxItemsetSize: effectiveMaxK,
        effectiveMinSupport
      }
    };
  }
};
