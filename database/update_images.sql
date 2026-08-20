-- ==========================================================
-- Cartify — Image update (re-seed with category-relevant photos)
--
-- Section 2's original seed used random placeholder photos. This clears
-- existing category/product/review rows and reloads them via the updated
-- seed_section2.sql, which assigns real, category-matched images
-- (e.g. actual headphones for Headphones, actual sneakers for Footwear).
--
-- Uses DELETE (not TRUNCATE ... CASCADE) so it only removes interaction
-- rows tied to the deleted products, not your entire interactions history.
-- Safe to run on a database that already has Section 2 data loaded.
-- ==========================================================

DELETE FROM reviews;
DELETE FROM products;
DELETE FROM categories;
