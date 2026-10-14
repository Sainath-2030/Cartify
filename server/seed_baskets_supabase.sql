-- ============================================================================
-- Cartify — Production Basket Seeder (Supabase SQL Editor, single block)
-- ============================================================================
-- Replaces the thin basket dataset with 3,600 persona-aware affinity baskets,
-- mirroring what server/scripts/seed_market_baskets.mjs produces locally.
--
-- Run in the Supabase SQL Editor as ONE block (transactional).
-- Expected: 3,600 orders, ~10,500 order_items, ~10,500 basket interactions.
--
-- Design notes
--   * Baskets come from popularity-ranked, per-category co-purchasable bundles
--     so Apriori mines genuine repeated rules rather than one-off noise.
--   * Each basket is owned by a shopper whose PERSONA covers that category, so
--     purchase rows reinforce shopper identity instead of erasing it (the bug
--     that previously made every user a generic ~24% Electronics shopper).
--   * Only basket-seeded interactions are cleared; persona rows survive.
--   * Deterministic hashes (hashtextextended) are used instead of random() so a
--     re-run reproduces the same catalogue shape.
-- ============================================================================

BEGIN;

-- 1 ── Clear previous basket data (scoped to this script's own rows) ---------
DELETE FROM interactions
 WHERE metadata IS NOT NULL
   AND metadata::jsonb->>'source' = 'basket_seed';

TRUNCATE order_items RESTART IDENTITY CASCADE;
TRUNCATE orders RESTART IDENTITY CASCADE;

-- 2 ── Which categories each shopper identity legitimately buys -------------
CREATE TEMP TABLE persona_cats ON COMMIT DROP AS
SELECT u.id AS user_id,
       (CASE ((u.id - 1) % 8)
         WHEN 0 THEN ARRAY['Electronics','Gaming']
         WHEN 1 THEN ARRAY['Fashion','Beauty']
         WHEN 2 THEN ARRAY['Home & Kitchen','Grocery']
         WHEN 3 THEN ARRAY['Beauty','Fashion']
         WHEN 4 THEN ARRAY['Sports','Electronics']
         WHEN 5 THEN ARRAY['Grocery','Home & Kitchen']
         WHEN 6 THEN ARRAY['Gaming','Electronics']
         ELSE          ARRAY['Books']
       END)::text[] AS cats
  FROM users u;

-- Products eligible for baskets: active, priced, sufficiently reviewed.
CREATE TEMP TABLE eligible ON COMMIT DROP AS
SELECT p.id, p.category_id, c.name::text AS cat, p.final_price,
       ROW_NUMBER() OVER (
         PARTITION BY c.name ORDER BY p.review_count DESC NULLS LAST, p.id
       ) AS rn
  FROM products p
  JOIN categories c ON c.id = p.category_id
 WHERE p.is_active = true
   AND p.final_price > 0
   AND COALESCE(p.review_count, 0) > 5;

-- Chunk each category's shelf into fixed 3-item co-purchasable bundles.
CREATE TEMP TABLE bundles ON COMMIT DROP AS
SELECT cat,
       category_id,
       rn / 3                   AS bundle_id,
       array_agg(id ORDER BY rn) AS product_ids,
       count(*)                 AS size
  FROM eligible
 GROUP BY cat, category_id, rn / 3
HAVING count(*) >= 2;

-- Only categories at least one persona claims get baskets.
CREATE TEMP TABLE usable_bundles ON COMMIT DROP AS
SELECT b.cat, b.category_id, b.bundle_id, b.product_ids
  FROM bundles b
 WHERE EXISTS (SELECT 1 FROM persona_cats pc WHERE pc.cats @> ARRAY[b.cat]);

-- Category basket weight, scaled so the plan totals TARGET_BASKETS (3,600)
-- while preserving the Node archetype's relative popularity
-- (Electronics 53 > Sports 40 > Fashion 28 > ... > Books 6).
CREATE TEMP TABLE cat_weight ON COMMIT DROP AS
WITH raw AS (
  SELECT ub.cat AS category_name,
         CASE ub.cat
           WHEN 'Electronics'    THEN 53
           WHEN 'Sports'         THEN 40
           WHEN 'Fashion'        THEN 28
           WHEN 'Home & Kitchen' THEN 28
           WHEN 'Beauty'         THEN 26
           WHEN 'Grocery'        THEN 25
           WHEN 'Gaming'         THEN 8
           WHEN 'Books'          THEN 6
           ELSE 1
         END AS rel_weight,
         count(DISTINCT ub.bundle_id) AS bundle_count
    FROM usable_bundles ub
   GROUP BY 1
)
-- Proportional share of the 3,600 target, then capped so no category gets
-- more baskets than it has distinct bundles. Without the cap the bundle
-- floor dominates and the total overshoots (it landed at 5,396 uncapped).
SELECT r.category_name,
       r.bundle_count,
       LEAST(
         GREATEST(
           (3600 * r.rel_weight) / (SELECT sum(rel_weight) FROM raw),
           1                       -- every used category gets at least one
         ),
         r.bundle_count           -- at most one per bundle, for coverage
       )::int AS weight
  FROM raw r;

-- 3 ── Basket plan: weighted category draw -> bundle -> persona shopper ------
CREATE TEMP TABLE basket_plan ON COMMIT DROP AS
WITH expanded AS (
  SELECT cw.category_name, cw.weight, g.i,
         -- abs(): hashtextextended returns a signed bigint, so a bare `%`
         -- can go negative and OFFSET would then reject the plan.
         abs(hashtextextended(cw.category_name || g.i::text, 0)) % 1000 AS h_bundle,
         abs(hashtextextended('spill' || cw.category_name || g.i::text, 0)) % 100 AS h_loyal,
         abs(hashtextextended('rand'  || cw.category_name || g.i::text, 0)) % 1000 AS h_any
    FROM cat_weight cw
    CROSS JOIN LATERAL generate_series(1, cw.weight) AS g(i)
),
numbered AS (
  SELECT e.*, row_number() OVER (ORDER BY e.category_name, e.i) AS basket_no
    FROM expanded e
),
-- Pick the owning shopper.
--   loyal  : the lowest user_id in the persona cohort (a repeat customer)
--   spread : a deterministic hash pick, so the cohort does not collapse onto
--            one account the way a pure "first user" rule would
-- OFFSET receives a value derived from the numbered row (not a correlated
-- reference to another CTE), which is what Postgres requires here.
owner_pick AS (
  SELECT n.basket_no,
         n.category_name,
         n.h_bundle,
         cw.bundle_count,
         pc.cohort_n,
         pc.ids[1 + (CASE WHEN n.h_loyal % 100 < 55 THEN 0
                          ELSE n.h_any % GREATEST(pc.cohort_n - 1, 1)
                     END)] AS user_id
    FROM numbered n
    JOIN cat_weight cw ON cw.category_name = n.category_name
    JOIN LATERAL (
      SELECT count(*)::int AS cohort_n,
             array_agg(pc2.user_id ORDER BY pc2.user_id) AS ids
        FROM persona_cats pc2
       WHERE n.category_name = ANY (pc2.cats)
    ) pc ON true
)
SELECT o.basket_no,
       o.category_name,
       (SELECT b.bundle_id FROM usable_bundles b
         WHERE b.cat = o.category_name ORDER BY b.bundle_id
         LIMIT 1 OFFSET (o.h_bundle % o.bundle_count)) AS bundle_id,
       o.user_id
  FROM owner_pick o;

-- 4 ── Materialise orders ----------------------------------------------------
-- 120-day window so dim_time roll-ups span multiple months.
CREATE TEMP TABLE seeded_orders ON COMMIT DROP AS
SELECT bp.basket_no,
       nextval('orders_id_seq') AS order_id,
       bp.user_id,
       now() - (bp.basket_no % 120) * interval '1 day'
              - ((bp.basket_no * 37) % 86400) * interval '1 second' AS created_at
  FROM basket_plan bp;

-- Line items: take 2..4 items from the bundle (canonical bundle + spill).
CREATE TEMP TABLE basket_lines ON COMMIT DROP AS
SELECT so.order_id,
       so.user_id,
       so.created_at,
       bp.category_name,
       u.pid AS product_id,
       p.final_price,
       (CASE WHEN (bp.basket_no + u.ord) % 5 = 0 THEN 2 ELSE 1 END) AS qty
  FROM basket_plan bp
  JOIN seeded_orders so ON so.basket_no = bp.basket_no
  JOIN usable_bundles ub
    ON ub.cat = bp.category_name AND ub.bundle_id = bp.bundle_id
  JOIN LATERAL unnest(ub.product_ids) WITH ORDINALITY AS u(pid, ord)
    ON u.ord <= 2 + (bp.basket_no % 3)
  JOIN products p ON p.id = u.pid
 WHERE bp.user_id IS NOT NULL;

INSERT INTO orders (id, user_id, total_amount, status, shipping_address,
                    payment_method, payment_status, created_at, updated_at)
SELECT so.order_id,
       so.user_id,
       COALESCE(agg.total_amount, 0),
       'DELIVERED'::order_status,
       jsonb_build_object(
         'fullName',   'Customer ' || so.user_id,
         'street',     '123 Market Way',
         'city',       (ARRAY['Mumbai','Bangalore','Delhi','Hyderabad','Pune','Chennai'])[1 + so.order_id % 6],
         'state',      (ARRAY['Maharashtra','Karnataka','Delhi','Telangana','Maharashtra','Tamil Nadu'])[1 + so.order_id % 6],
         'postalCode', '40000' || (so.order_id % 9),
         'country',    'India'),
       'SIMULATED_GATEWAY',
       'PAID',
       so.created_at,
       so.created_at
  FROM seeded_orders so
  LEFT JOIN (
    SELECT order_id, sum(qty * final_price) AS total_amount
      FROM basket_lines GROUP BY order_id
  ) agg ON agg.order_id = so.order_id;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT order_id, product_id, qty, final_price, qty * final_price
  FROM basket_lines;

INSERT INTO interactions (user_id, session_id, product_id, interaction_type,
                          metadata, created_at)
SELECT bl.user_id,
       'sess_basket_' || bl.order_id,
       bl.product_id,
       'PURCHASE'::interaction_type,
       jsonb_build_object('order_id',  bl.order_id,
                          'source',    'basket_seed',
                          'archetype', lower(regexp_replace(bl.category_name, '\s+', '_', 'g'))),
       bl.created_at
  FROM basket_lines bl;

COMMIT;

-- Expected: orders 3600 | order_items ~10500 | basket interactions ~10500