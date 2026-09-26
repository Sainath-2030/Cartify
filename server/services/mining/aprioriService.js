import { query } from '../../config/db.js';

export const aprioriService = {
  /**
   * Extracts transactional baskets from order_items table.
   * Also fetches product titles from products table for visualization.
   */
  async extractTransactions() {
    const text = `
      SELECT 
        oi.order_id, 
        array_agg(oi.product_id) as item_ids,
        array_agg(p.name) as item_names
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      GROUP BY oi.order_id
      HAVING COUNT(oi.product_id) > 1
    `;
    const res = await query(text);
    return res.rows;
  },

  /**
   * Get all unique combinations of size k from an array
   */
  getCombinations(arr, size) {
    const result = [];
    const f = (prefix, remainingArr) => {
      for (let i = 0; i < remainingArr.length; i++) {
        const newPrefix = [...prefix, remainingArr[i]];
        if (newPrefix.length === size) {
          result.push(newPrefix);
        } else {
          f(newPrefix, remainingArr.slice(i + 1));
        }
      }
    };
    f([], arr);
    return result;
  },

  /**
   * Main Apriori Algorithm to mine association rules
   */
  async mineAssociationRules({ minSupport = 0.01, minConfidence = 0.2, minLift = 1.0 } = {}) {
    const transactionsData = await this.extractTransactions();
    const transactions = transactionsData.map(t => t.item_ids.map(Number));
    
    // Map product ID to product Name
    const idToNameMap = {};
    transactionsData.forEach(t => {
      t.item_ids.map(Number).forEach((id, index) => {
        idToNameMap[id] = t.item_names[index];
      });
    });

    const totalTransactions = transactions.length;
    if (totalTransactions === 0) return [];

    // Helper: count support for an itemset
    const countSupport = (itemset) => {
      let count = 0;
      for (const t of transactions) {
        // Check if every item in itemset is present in the transaction t
        if (itemset.every(item => t.includes(item))) {
          count++;
        }
      }
      return count;
    };

    // Step 1: Find frequent 1-itemsets (L1)
    const itemCounts = {};
    transactions.forEach(t => {
      // Create a set to avoid counting duplicates in the same transaction
      const uniqueItems = new Set(t);
      uniqueItems.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });
    });

    const l1 = Object.keys(itemCounts)
      .map(Number)
      .filter(item => (itemCounts[item] / totalTransactions) >= minSupport)
      .map(item => [item]);

    // Step 2: Find frequent 2-itemsets (L2)
    // For standard Market Basket Analysis, 2-itemsets (A => B) provide the most actionable rules.
    const l1Items = l1.map(arr => arr[0]);
    const l2Candidates = this.getCombinations(l1Items, 2);
    
    const l2 = [];
    const supportMap = {};

    // Populate support map for L1
    l1.forEach(itemset => {
      supportMap[itemset[0].toString()] = itemCounts[itemset[0]];
    });

    // Evaluate candidates for L2
    l2Candidates.forEach(candidate => {
      const count = countSupport(candidate);
      if ((count / totalTransactions) >= minSupport) {
        l2.push(candidate);
        // Store as sorted comma-separated string key
        supportMap[candidate.slice().sort().join(',')] = count;
      }
    });

    // Step 3: Generate Association Rules from L2
    const rules = [];
    
    l2.forEach(itemset => {
      const [a, b] = itemset;
      const keyAB = itemset.slice().sort().join(',');
      
      const suppAB = supportMap[keyAB] / totalTransactions;
      const suppA = supportMap[a.toString()] / totalTransactions;
      const suppB = supportMap[b.toString()] / totalTransactions;

      // Rule: A => B
      const confAtoB = suppAB / suppA;
      const liftAtoB = confAtoB / suppB;

      if (confAtoB >= minConfidence && liftAtoB >= minLift) {
        rules.push({
          antecedent: [a],
          antecedentNames: [idToNameMap[a]],
          consequent: [b],
          consequentNames: [idToNameMap[b]],
          support: parseFloat(suppAB.toFixed(4)),
          confidence: parseFloat(confAtoB.toFixed(4)),
          lift: parseFloat(liftAtoB.toFixed(4))
        });
      }

      // Rule: B => A
      const confBtoA = suppAB / suppB;
      const liftBtoA = confBtoA / suppA;

      if (confBtoA >= minConfidence && liftBtoA >= minLift) {
        rules.push({
          antecedent: [b],
          antecedentNames: [idToNameMap[b]],
          consequent: [a],
          consequentNames: [idToNameMap[a]],
          support: parseFloat(suppAB.toFixed(4)),
          confidence: parseFloat(confBtoA.toFixed(4)),
          lift: parseFloat(liftBtoA.toFixed(4))
        });
      }
    });

    // Sort by Lift descending, then Confidence descending
    return rules.sort((x, y) => y.lift - x.lift || y.confidence - x.confidence);
  }
};
