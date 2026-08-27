-- ==========================================================
-- Cartify Seed Data — Product Data Quality Upgrade
--
-- Replaces the Section 2 demo product dataset with a cleaner,
-- more realistic catalogue sourced from DummyJSON
-- (https://dummyjson.com), a public sample e-commerce dataset,
-- plus a small hand-authored set for categories DummyJSON does
-- not cover (gaming, books) — each with a unique real photo,
-- never a shared/reused image.
--
-- IMPORTANT: This is SAMPLE/PLACEHOLDER catalogue data for an
-- academic prototype. Prices are converted from DummyJSON's USD
-- values at a fixed illustrative rate (1 USD = 83 INR) and do
-- NOT reflect live/current Indian market pricing.
--
-- Run AFTER schema.sql and schema_section2.sql. Safe to re-run:
-- clears prior product/category/review rows first, inside a
-- transaction, without touching users or interactions.
-- ==========================================================

BEGIN;

DELETE FROM reviews;
DELETE FROM products;
DELETE FROM categories;

INSERT INTO categories (name, slug, description, image) VALUES
('Electronics', 'electronics', 'Smartphones, laptops, tablets, audio and accessories.', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop'),
('Fashion', 'fashion', 'Clothing, footwear, watches and accessories for everyone.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop'),
('Home & Kitchen', 'home-kitchen', 'Furniture and everyday kitchen essentials.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=400&fit=crop'),
('Books', 'books', 'Fiction, non-fiction and academic reads.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop'),
('Beauty', 'beauty', 'Makeup, fragrance and skincare essentials.', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=400&fit=crop'),
('Sports', 'sports', 'Gear and equipment for an active lifestyle.', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop'),
('Grocery', 'grocery', 'Everyday groceries and pantry staples.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop'),
('Gaming', 'gaming', 'Consoles, accessories and PC gaming gear.', 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=800&h=400&fit=crop');

INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'iPhone 5s', 'iphone-5s', 'The iPhone 5s is a classic smartphone known for its compact design and advanced features during its release. While it''s an older model, it still provides a reliable user experience.', 'The iPhone 5s is a classic smartphone known for its compact design and advanced features during its release. While it''s an older model, it s…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Apple', 16599.17, 12.91, 14456.22, 2.83, 62,
  25, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/3.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'iPhone 6', 'iphone-6', 'The iPhone 6 is a stylish and capable smartphone with a larger display and improved performance. It introduced new features and design elements, making it a popular choice in its time.', 'The iPhone 6 is a stylish and capable smartphone with a larger display and improved performance. It introduced new features and design eleme…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Apple', 24899.17, 6.69, 23233.42, 3.41, 150,
  60, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/iphone-6/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/iphone-6/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/iphone-6/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/iphone-6/3.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'iPhone 13 Pro', 'iphone-13-pro', 'The iPhone 13 Pro is a cutting-edge smartphone with a powerful camera system, high-performance chip, and stunning display. It offers advanced features for users who demand top-notch technology.', 'The iPhone 13 Pro is a cutting-edge smartphone with a powerful camera system, high-performance chip, and stunning display. It offers advance…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Apple', 91299.17, 9.37, 82744.44, 4.12, 140,
  56, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/3.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'iPhone X', 'iphone-x', 'The iPhone X is a flagship smartphone featuring a bezel-less OLED display, facial recognition technology (Face ID), and impressive performance. It represents a milestone in iPhone design and innovation.', 'The iPhone X is a flagship smartphone featuring a bezel-less OLED display, facial recognition technology (Face ID), and impressive performan…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Apple', 74699.17, 19.59, 60065.6, 2.51, 92,
  37, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/iphone-x/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/iphone-x/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/iphone-x/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/iphone-x/3.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Oppo A57', 'oppo-a57', 'The Oppo A57 is a mid-range smartphone known for its sleek design and capable features. It offers a balance of performance and affordability, making it a popular choice.', 'The Oppo A57 is a mid-range smartphone known for its sleek design and capable features. It offers a balance of performance and affordability…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Oppo', 20749.17, 2.43, 20244.97, 3.94, 48,
  19, 'Oppo Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/3.webp"]'::jsonb, '{"Brand": "Oppo", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Oppo F19 Pro Plus', 'oppo-f19-pro-plus', 'The Oppo F19 Pro Plus is a feature-rich smartphone with a focus on camera capabilities. It boasts advanced photography features and a powerful performance for a premium user experience.', 'The Oppo F19 Pro Plus is a feature-rich smartphone with a focus on camera capabilities. It boasts advanced photography features and a powerf…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Oppo', 33199.17, 18.64, 27010.84, 3.51, 195,
  78, 'Oppo Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/3.webp"]'::jsonb, '{"Brand": "Oppo", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Oppo K1', 'oppo-k1', 'The Oppo K1 series offers a range of smartphones with various features and specifications. Known for their stylish design and reliable performance, the Oppo K1 series caters to diverse user preferences.', 'The Oppo K1 series offers a range of smartphones with various features and specifications. Known for their stylish design and reliable perfo…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Oppo', 24899.17, 18.29, 20345.11, 4.25, 138,
  55, 'Oppo Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/3.webp", "https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/4.webp"]'::jsonb, '{"Brand": "Oppo", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Realme C35', 'realme-c35', 'The Realme C35 is a budget-friendly smartphone with a focus on providing essential features for everyday use. It offers a reliable performance and user-friendly experience.', 'The Realme C35 is a budget-friendly smartphone with a focus on providing essential features for everyday use. It offers a reliable performan…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Realme', 12449.17, 15.3, 10544.45, 4.2, 120,
  48, 'Realme Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/realme-c35/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/realme-c35/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/realme-c35/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/realme-c35/3.webp"]'::jsonb, '{"Brand": "Realme", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Realme X', 'realme-x', 'The Realme X is a mid-range smartphone known for its sleek design and impressive display. It offers a good balance of performance and camera capabilities for users seeking a quality device.', 'The Realme X is a mid-range smartphone known for its sleek design and impressive display. It offers a good balance of performance and camera…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Realme', 24899.17, 6.95, 23168.68, 3.7, 30,
  12, 'Realme Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/realme-x/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/realme-x/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/realme-x/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/realme-x/3.webp"]'::jsonb, '{"Brand": "Realme", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Realme XT', 'realme-xt', 'The Realme XT is a feature-rich smartphone with a focus on camera technology. It comes equipped with advanced camera sensors, delivering high-quality photos and videos for photography enthusiasts.', 'The Realme XT is a feature-rich smartphone with a focus on camera technology. It comes equipped with advanced camera sensors, delivering hig…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Realme', 29049.17, 11.51, 25705.61, 4.58, 200,
  80, 'Realme Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/realme-xt/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/realme-xt/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/realme-xt/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/realme-xt/3.webp"]'::jsonb, '{"Brand": "Realme", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Samsung Galaxy S7', 'samsung-galaxy-s7', 'The Samsung Galaxy S7 is a flagship smartphone known for its sleek design and advanced features. It features a high-resolution display, powerful camera, and robust performance.', 'The Samsung Galaxy S7 is a flagship smartphone known for its sleek design and advanced features. It features a high-resolution display, powe…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Samsung', 24899.17, 19.55, 20031.38, 3.3, 168,
  67, 'Samsung Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/3.webp"]'::jsonb, '{"Brand": "Samsung", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Samsung Galaxy S8', 'samsung-galaxy-s8', 'The Samsung Galaxy S8 is a premium smartphone with an Infinity Display, offering a stunning visual experience. It boasts advanced camera capabilities and cutting-edge technology.', 'The Samsung Galaxy S8 is a premium smartphone with an Infinity Display, offering a stunning visual experience. It boasts advanced camera cap…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Samsung', 41499.17, 19.45, 33427.58, 4.4, 5,
  0, 'Samsung Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/3.webp"]'::jsonb, '{"Brand": "Samsung", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Samsung Galaxy S10', 'samsung-galaxy-s10', 'The Samsung Galaxy S10 is a flagship device featuring a dynamic AMOLED display, versatile camera system, and powerful performance. It represents innovation and excellence in smartphone technology.', 'The Samsung Galaxy S10 is a flagship device featuring a dynamic AMOLED display, versatile camera system, and powerful performance. It repres…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Samsung', 58099.17, 5.59, 54851.43, 3.06, 48,
  19, 'Samsung Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/3.webp"]'::jsonb, '{"Brand": "Samsung", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Vivo S1', 'vivo-s1', 'The Vivo S1 is a stylish and mid-range smartphone offering a blend of design and performance. It features a vibrant display, capable camera system, and reliable functionality.', 'The Vivo S1 is a stylish and mid-range smartphone offering a blend of design and performance. It features a vibrant display, capable camera …',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Vivo', 20749.17, 10.17, 18638.98, 3.5, 125,
  50, 'Vivo Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/vivo-s1/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/vivo-s1/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/vivo-s1/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/vivo-s1/3.webp"]'::jsonb, '{"Brand": "Vivo", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Vivo V9', 'vivo-v9', 'The Vivo V9 is a smartphone known for its sleek design and emphasis on capturing high-quality selfies. It features a notch display, dual-camera setup, and a modern design.', 'The Vivo V9 is a smartphone known for its sleek design and emphasis on capturing high-quality selfies. It features a notch display, dual-cam…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Vivo', 24899.17, 17.67, 20499.49, 3.6, 205,
  82, 'Vivo Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/vivo-v9/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/vivo-v9/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/vivo-v9/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/vivo-v9/3.webp"]'::jsonb, '{"Brand": "Vivo", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Vivo X21', 'vivo-x21', 'The Vivo X21 is a premium smartphone with a focus on cutting-edge technology. It features an in-display fingerprint sensor, a high-resolution display, and advanced camera capabilities.', 'The Vivo X21 is a premium smartphone with a focus on cutting-edge technology. It features an in-display fingerprint sensor, a high-resolutio…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Vivo', 41499.17, 17.41, 34274.16, 4.26, 18,
  7, 'Vivo Official Store', 'https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/1.webp", "https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/2.webp", "https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/3.webp"]'::jsonb, '{"Brand": "Vivo", "Category": "Electronics", "Type": "Smartphones", "Warranty": "1 Year Manufacturer Warranty", "Connectivity": "4G/5G, Wi-Fi, Bluetooth"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Apple MacBook Pro 14 Inch Space Grey', 'apple-macbook-pro-14-inch-space-grey', 'The MacBook Pro 14 Inch in Space Grey is a powerful and sleek laptop, featuring Apple''s M1 Pro chip for exceptional performance and a stunning Retina display.', 'The MacBook Pro 14 Inch in Space Grey is a powerful and sleek laptop, featuring Apple''s M1 Pro chip for exceptional performance and a stunni…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Laptops',
  'Apple', 165999.17, 4.69, 158213.81, 3.65, 60,
  24, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/1.webp", "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/2.webp", "https://cdn.dummyjson.com/product-images/laptops/apple-macbook-pro-14-inch-space-grey/3.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Laptops", "Warranty": "1 Year Manufacturer Warranty", "Form Factor": "Laptop"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Asus Zenbook Pro Dual Screen Laptop', 'asus-zenbook-pro-dual-screen-laptop', 'The Asus Zenbook Pro Dual Screen Laptop is a high-performance device with dual screens, providing productivity and versatility for creative professionals.', 'The Asus Zenbook Pro Dual Screen Laptop is a high-performance device with dual screens, providing productivity and versatility for creative …',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Laptops',
  'Asus', 149399.17, 11.14, 132756.1, 3.95, 112,
  45, 'Asus Official Store', 'https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/1.webp", "https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/2.webp", "https://cdn.dummyjson.com/product-images/laptops/asus-zenbook-pro-dual-screen-laptop/3.webp"]'::jsonb, '{"Brand": "Asus", "Category": "Electronics", "Type": "Laptops", "Warranty": "1 Year Manufacturer Warranty", "Form Factor": "Laptop"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Huawei Matebook X Pro', 'huawei-matebook-x-pro', 'The Huawei Matebook X Pro is a slim and stylish laptop with a high-resolution touchscreen display, offering a premium experience for users on the go.', 'The Huawei Matebook X Pro is a slim and stylish laptop with a high-resolution touchscreen display, offering a premium experience for users o…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Laptops',
  'Huawei', 116199.17, 9.38, 105299.69, 4.98, 188,
  75, 'Huawei Official Store', 'https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/1.webp", "https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/2.webp", "https://cdn.dummyjson.com/product-images/laptops/huawei-matebook-x-pro/3.webp"]'::jsonb, '{"Brand": "Huawei", "Category": "Electronics", "Type": "Laptops", "Warranty": "1 Year Manufacturer Warranty", "Form Factor": "Laptop"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Lenovo Yoga 920', 'lenovo-yoga-920', 'The Lenovo Yoga 920 is a 2-in-1 convertible laptop with a flexible hinge, allowing you to use it as a laptop or tablet, offering versatility and portability.', 'The Lenovo Yoga 920 is a 2-in-1 convertible laptop with a flexible hinge, allowing you to use it as a laptop or tablet, offering versatility…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Laptops',
  'Lenovo', 91299.17, 6.55, 85319.07, 2.86, 100,
  40, 'Lenovo Official Store', 'https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/1.webp", "https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/2.webp", "https://cdn.dummyjson.com/product-images/laptops/lenovo-yoga-920/3.webp"]'::jsonb, '{"Brand": "Lenovo", "Category": "Electronics", "Type": "Laptops", "Warranty": "1 Year Manufacturer Warranty", "Form Factor": "Laptop"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'New DELL XPS 13 9300 Laptop', 'new-dell-xps-13-9300-laptop', 'The New DELL XPS 13 9300 Laptop is a compact and powerful device, featuring a virtually borderless InfinityEdge display and high-end performance for various tasks.', 'The New DELL XPS 13 9300 Laptop is a compact and powerful device, featuring a virtually borderless InfinityEdge display and high-end perform…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Laptops',
  'Dell', 124499.17, 11.89, 109696.22, 2.67, 185,
  74, 'Dell Official Store', 'https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/1.webp", "https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/2.webp", "https://cdn.dummyjson.com/product-images/laptops/new-dell-xps-13-9300-laptop/3.webp"]'::jsonb, '{"Brand": "Dell", "Category": "Electronics", "Type": "Laptops", "Warranty": "1 Year Manufacturer Warranty", "Form Factor": "Laptop"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'iPad Mini 2021 Starlight', 'ipad-mini-2021-starlight', 'The iPad Mini 2021 in Starlight is a compact and powerful tablet from Apple. Featuring a stunning Retina display, powerful A-series chip, and a sleek design, it offers a premium tablet experience.', 'The iPad Mini 2021 in Starlight is a compact and powerful tablet from Apple. Featuring a stunning Retina display, powerful A-series chip, an…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Tablets',
  'Apple', 41499.17, 3.64, 39988.6, 3.18, 118,
  47, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/1.webp", "https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/2.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Tablets", "Warranty": "1 Year Manufacturer Warranty", "Form Factor": "Tablet"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Samsung Galaxy Tab S8 Plus Grey', 'samsung-galaxy-tab-s8-plus-grey', 'The Samsung Galaxy Tab S8 Plus in Grey is a high-performance Android tablet by Samsung. With a large AMOLED display, powerful processor, and S Pen support, it''s ideal for productivity and entertainment.', 'The Samsung Galaxy Tab S8 Plus in Grey is a high-performance Android tablet by Samsung. With a large AMOLED display, powerful processor, and…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Tablets',
  'Samsung', 49799.17, 13.31, 43170.9, 4.68, 155,
  62, 'Samsung Official Store', 'https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/1.webp", "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-s8-plus-grey/2.webp"]'::jsonb, '{"Brand": "Samsung", "Category": "Electronics", "Type": "Tablets", "Warranty": "1 Year Manufacturer Warranty", "Form Factor": "Tablet"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Samsung Galaxy Tab White', 'samsung-galaxy-tab-white', 'The Samsung Galaxy Tab in White is a sleek and versatile Android tablet. With a vibrant display, long-lasting battery, and a range of features, it offers a great user experience for various tasks.', 'The Samsung Galaxy Tab in White is a sleek and versatile Android tablet. With a vibrant display, long-lasting battery, and a range of featur…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Tablets',
  'Samsung', 29049.17, 18.2, 23762.22, 3.72, 230,
  92, 'Samsung Official Store', 'https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-white/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-white/1.webp", "https://cdn.dummyjson.com/product-images/tablets/samsung-galaxy-tab-white/2.webp"]'::jsonb, '{"Brand": "Samsung", "Category": "Electronics", "Type": "Tablets", "Warranty": "1 Year Manufacturer Warranty", "Form Factor": "Tablet"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Amazon Echo Plus', 'amazon-echo-plus', 'The Amazon Echo Plus is a smart speaker with built-in Alexa voice control. It features premium sound quality and serves as a hub for controlling smart home devices.', 'The Amazon Echo Plus is a smart speaker with built-in Alexa voice control. It features premium sound quality and serves as a hub for control…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio & Accessories',
  'Amazon', 8299.17, 12.07, 7297.46, 4.99, 152,
  61, 'Amazon Official Store', 'https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/1.webp", "https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/2.webp"]'::jsonb, '{"Brand": "Amazon", "Category": "Electronics", "Type": "Audio & Accessories", "Warranty": "6 Months Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Apple AirPods Max Silver', 'apple-airpods-max-silver', 'The Apple AirPods Max in Silver are premium over-ear headphones with high-fidelity audio, adaptive EQ, and active noise cancellation. Experience immersive sound in style.', 'The Apple AirPods Max in Silver are premium over-ear headphones with high-fidelity audio, adaptive EQ, and active noise cancellation. Experi…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio & Accessories',
  'Apple', 45649.17, 13.67, 39408.93, 3.47, 148,
  59, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Audio & Accessories", "Warranty": "6 Months Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Apple Airpods', 'apple-airpods', 'The Apple Airpods offer a seamless wireless audio experience. With easy pairing, high-quality sound, and Siri integration, they are perfect for on-the-go listening.', 'The Apple Airpods offer a seamless wireless audio experience. With easy pairing, high-quality sound, and Siri integration, they are perfect …',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio & Accessories',
  'Apple', 10789.17, 15.54, 9112.53, 4.15, 168,
  67, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/1.webp", "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/2.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Audio & Accessories", "Warranty": "6 Months Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Apple Airpower Wireless Charger', 'apple-airpower-wireless-charger', 'The Apple AirPower Wireless Charger provides a convenient way to charge your compatible Apple devices wirelessly. Simply place your devices on the charging mat for effortless charging.', 'The Apple AirPower Wireless Charger provides a convenient way to charge your compatible Apple devices wirelessly. Simply place your devices …',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio & Accessories',
  'Apple', 6639.17, 4.48, 6341.74, 3.68, 5,
  1, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpower-wireless-charger/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpower-wireless-charger/1.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Audio & Accessories", "Warranty": "6 Months Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Apple HomePod Mini Cosmic Grey', 'apple-homepod-mini-cosmic-grey', 'The Apple HomePod Mini in Cosmic Grey is a compact smart speaker that delivers impressive audio and integrates seamlessly with the Apple ecosystem for a smart home experience.', 'The Apple HomePod Mini in Cosmic Grey is a compact smart speaker that delivers impressive audio and integrates seamlessly with the Apple eco…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio & Accessories',
  'Apple', 8299.17, 18.1, 6797.02, 4.62, 68,
  27, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-homepod-mini-cosmic-grey/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-homepod-mini-cosmic-grey/1.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Audio & Accessories", "Warranty": "6 Months Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Apple MagSafe Battery Pack', 'apple-magsafe-battery-pack', 'The Apple MagSafe Battery Pack is a portable and convenient way to add extra battery life to your MagSafe-compatible iPhone. Attach it magnetically for a secure connection.', 'The Apple MagSafe Battery Pack is a portable and convenient way to add extra battery life to your MagSafe-compatible iPhone. Attach it magne…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio & Accessories',
  'Apple', 8299.17, 17.17, 6874.2, 3.62, 5,
  1, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-magsafe-battery-pack/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-magsafe-battery-pack/1.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Audio & Accessories", "Warranty": "6 Months Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Apple Watch Series 4 Gold', 'apple-watch-series-4-gold', 'The Apple Watch Series 4 in Gold is a stylish and advanced smartwatch with features like heart rate monitoring, fitness tracking, and a beautiful Retina display.', 'The Apple Watch Series 4 in Gold is a stylish and advanced smartwatch with features like heart rate monitoring, fitness tracking, and a beau…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio & Accessories',
  'Apple', 29049.17, 12.02, 25557.46, 2.74, 82,
  33, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/1.webp", "https://cdn.dummyjson.com/product-images/mobile-accessories/apple-watch-series-4-gold/2.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Audio & Accessories", "Warranty": "6 Months Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Apple iPhone Charger', 'apple-iphone-charger', 'The Apple iPhone Charger is a high-quality charger designed for fast and efficient charging of your iPhone. Ensure your device stays powered up and ready to go.', 'The Apple iPhone Charger is a high-quality charger designed for fast and efficient charging of your iPhone. Ensure your device stays powered…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio & Accessories',
  'Apple', 1659.17, 18.52, 1351.89, 4.15, 78,
  31, 'Apple Official Store', 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-iphone-charger/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mobile-accessories/apple-iphone-charger/1.webp"]'::jsonb, '{"Brand": "Apple", "Category": "Electronics", "Type": "Audio & Accessories", "Warranty": "6 Months Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Beats Flex Wireless Earphones', 'beats-flex-wireless-earphones', 'The Beats Flex Wireless Earphones offer a comfortable and versatile audio experience. With magnetic earbuds and up to 12 hours of battery life, they are ideal for everyday use.', 'The Beats Flex Wireless Earphones offer a comfortable and versatile audio experience. With magnetic earbuds and up to 12 hours of battery li…',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio & Accessories',
  'Beats', 4149.17, 5.73, 3911.42, 4.24, 125,
  50, 'Beats Official Store', 'https://cdn.dummyjson.com/product-images/mobile-accessories/beats-flex-wireless-earphones/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mobile-accessories/beats-flex-wireless-earphones/1.webp"]'::jsonb, '{"Brand": "Beats", "Category": "Electronics", "Type": "Audio & Accessories", "Warranty": "6 Months Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Brown Leather Belt Watch', 'brown-leather-belt-watch', 'The Brown Leather Belt Watch is a stylish timepiece with a classic design. Featuring a genuine leather strap and a sleek dial, it adds a touch of sophistication to your look.', 'The Brown Leather Belt Watch is a stylish timepiece with a classic design. Featuring a genuine leather strap and a sleek dial, it adds a tou…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Watches',
  'Fashion Timepieces', 7469.17, 5.99, 7021.77, 4.19, 80,
  32, 'Fashion Timepieces Official Store', 'https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/1.webp", "https://cdn.dummyjson.com/product-images/mens-watches/brown-leather-belt-watch/2.webp"]'::jsonb, '{"Brand": "Fashion Timepieces", "Category": "Fashion", "Type": "Watches", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Longines Master Collection', 'longines-master-collection', 'The Longines Master Collection is an elegant and refined watch known for its precision and craftsmanship. With a timeless design, it''s a symbol of luxury and sophistication.', 'The Longines Master Collection is an elegant and refined watch known for its precision and craftsmanship. With a timeless design, it''s a sym…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Watches',
  'Longines', 124499.17, 17.24, 103035.51, 3.87, 250,
  100, 'Longines Official Store', 'https://cdn.dummyjson.com/product-images/mens-watches/longines-master-collection/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-watches/longines-master-collection/1.webp", "https://cdn.dummyjson.com/product-images/mens-watches/longines-master-collection/2.webp"]'::jsonb, '{"Brand": "Longines", "Category": "Fashion", "Type": "Watches", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Rolex Cellini Date Black Dial', 'rolex-cellini-date-black-dial', 'The Rolex Cellini Date with Black Dial is a classic and prestigious watch. With a black dial and date complication, it exudes sophistication and is a symbol of Rolex''s heritage.', 'The Rolex Cellini Date with Black Dial is a classic and prestigious watch. With a black dial and date complication, it exudes sophistication…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Watches',
  'Rolex', 746999.17, 8.88, 680665.64, 4.97, 100,
  40, 'Rolex Official Store', 'https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-date-black-dial/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-date-black-dial/1.webp", "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-date-black-dial/2.webp"]'::jsonb, '{"Brand": "Rolex", "Category": "Fashion", "Type": "Watches", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Rolex Cellini Moonphase', 'rolex-cellini-moonphase', 'The Rolex Cellini Moonphase is a masterpiece of horology, featuring a moon phase complication and exquisite design. It reflects Rolex''s commitment to precision and elegance.', 'The Rolex Cellini Moonphase is a masterpiece of horology, featuring a moon phase complication and exquisite design. It reflects Rolex''s comm…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Watches',
  'Rolex', 1078999.17, 17.52, 889958.52, 2.58, 90,
  36, 'Rolex Official Store', 'https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-moonphase/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-moonphase/1.webp", "https://cdn.dummyjson.com/product-images/mens-watches/rolex-cellini-moonphase/2.webp"]'::jsonb, '{"Brand": "Rolex", "Category": "Fashion", "Type": "Watches", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Rolex Datejust', 'rolex-datejust', 'The Rolex Datejust is an iconic and versatile timepiece with a date window. Known for its timeless design and reliability, it''s a symbol of Rolex''s watchmaking excellence.', 'The Rolex Datejust is an iconic and versatile timepiece with a date window. Known for its timeless design and reliability, it''s a symbol of …',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Watches',
  'Rolex', 912999.17, 3.73, 878944.3, 3.66, 215,
  86, 'Rolex Official Store', 'https://cdn.dummyjson.com/product-images/mens-watches/rolex-datejust/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-watches/rolex-datejust/1.webp", "https://cdn.dummyjson.com/product-images/mens-watches/rolex-datejust/2.webp"]'::jsonb, '{"Brand": "Rolex", "Category": "Fashion", "Type": "Watches", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Rolex Submariner Watch', 'rolex-submariner-watch', 'The Rolex Submariner is a legendary dive watch with a rich history. Known for its durability and water resistance, it''s a symbol of adventure and exploration.', 'The Rolex Submariner is a legendary dive watch with a rich history. Known for its durability and water resistance, it''s a symbol of adventur…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Watches',
  'Rolex', 1161999.17, 5.05, 1103318.21, 2.69, 138,
  55, 'Rolex Official Store', 'https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/1.webp", "https://cdn.dummyjson.com/product-images/mens-watches/rolex-submariner-watch/2.webp"]'::jsonb, '{"Brand": "Rolex", "Category": "Fashion", "Type": "Watches", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Nike Air Jordan 1 Red And Black', 'nike-air-jordan-1-red-and-black', 'The Nike Air Jordan 1 in Red and Black is an iconic basketball sneaker known for its stylish design and high-performance features, making it a favorite among sneaker enthusiasts and athletes.', 'The Nike Air Jordan 1 in Red and Black is an iconic basketball sneaker known for its stylish design and high-performance features, making it…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Footwear',
  'Nike', 12449.17, 4.12, 11936.26, 4.77, 18,
  7, 'Nike Official Store', 'https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/1.webp", "https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/2.webp"]'::jsonb, '{"Brand": "Nike", "Category": "Fashion", "Type": "Footwear", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Nike Baseball Cleats', 'nike-baseball-cleats', 'Nike Baseball Cleats are designed for maximum traction and performance on the baseball field. They provide stability and support for players during games and practices.', 'Nike Baseball Cleats are designed for maximum traction and performance on the baseball field. They provide stability and support for players…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Footwear',
  'Nike', 6639.17, 18.04, 5441.46, 3.88, 30,
  12, 'Nike Official Store', 'https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/1.webp", "https://cdn.dummyjson.com/product-images/mens-shoes/nike-baseball-cleats/2.webp"]'::jsonb, '{"Brand": "Nike", "Category": "Fashion", "Type": "Footwear", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Puma Future Rider Trainers', 'puma-future-rider-trainers', 'The Puma Future Rider Trainers offer a blend of retro style and modern comfort. Perfect for casual wear, these trainers provide a fashionable and comfortable option for everyday use.', 'The Puma Future Rider Trainers offer a blend of retro style and modern comfort. Perfect for casual wear, these trainers provide a fashionabl…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Footwear',
  'Puma', 7469.17, 4.2, 7155.46, 4.9, 225,
  90, 'Puma Official Store', 'https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/1.webp", "https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/2.webp"]'::jsonb, '{"Brand": "Puma", "Category": "Fashion", "Type": "Footwear", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Sports Sneakers Off White & Red', 'sports-sneakers-off-white-red', 'The Sports Sneakers in Off White and Red combine style and functionality, making them a fashionable choice for sports enthusiasts. The red and off-white color combination adds a bold and energetic touch.', 'The Sports Sneakers in Off White and Red combine style and functionality, making them a fashionable choice for sports enthusiasts. The red a…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Footwear',
  'Off White', 9959.17, 4.97, 9464.2, 4.77, 42,
  17, 'Off White Official Store', 'https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/1.webp", "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-&-red/2.webp"]'::jsonb, '{"Brand": "Off White", "Category": "Fashion", "Type": "Footwear", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Sports Sneakers Off White Red', 'sports-sneakers-off-white-red-2', 'Another variant of the Sports Sneakers in Off White Red, featuring a unique design. These sneakers offer style and comfort for casual occasions.', 'Another variant of the Sports Sneakers in Off White Red, featuring a unique design. These sneakers offer style and comfort for casual occasi…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Footwear',
  'Off White', 9129.17, 0.04, 9125.52, 4.69, 155,
  62, 'Off White Official Store', 'https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/1.webp", "https://cdn.dummyjson.com/product-images/mens-shoes/sports-sneakers-off-white-red/2.webp"]'::jsonb, '{"Brand": "Off White", "Category": "Fashion", "Type": "Footwear", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Blue & Black Check Shirt', 'blue-black-check-shirt', 'The Blue & Black Check Shirt is a stylish and comfortable men''s shirt featuring a classic check pattern. Made from high-quality fabric, it''s suitable for both casual and semi-formal occasions.', 'The Blue & Black Check Shirt is a stylish and comfortable men''s shirt featuring a classic check pattern. Made from high-quality fabric, it''s…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Men',
  'Fashion Trends', 2489.17, 15.35, 2107.08, 3.64, 95,
  38, 'Fashion Trends Official Store', 'https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/1.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/2.webp"]'::jsonb, '{"Brand": "Fashion Trends", "Category": "Fashion", "Type": "Men", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Gigabyte Aorus Men Tshirt', 'gigabyte-aorus-men-tshirt', 'The Gigabyte Aorus Men Tshirt is a cool and casual shirt for gaming enthusiasts. With the Aorus logo and sleek design, it''s perfect for expressing your gaming style.', 'The Gigabyte Aorus Men Tshirt is a cool and casual shirt for gaming enthusiasts. With the Aorus logo and sleek design, it''s perfect for expr…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Men',
  'Gigabyte', 2074.17, 0.94, 2054.67, 3.18, 225,
  90, 'Gigabyte Official Store', 'https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/1.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/2.webp"]'::jsonb, '{"Brand": "Gigabyte", "Category": "Fashion", "Type": "Men", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Man Plaid Shirt', 'man-plaid-shirt', 'The Man Plaid Shirt is a timeless and versatile men''s shirt with a classic plaid pattern. Its comfortable fit and casual style make it a wardrobe essential for various occasions.', 'The Man Plaid Shirt is a timeless and versatile men''s shirt with a classic plaid pattern. Its comfortable fit and casual style make it a war…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Men',
  'Classic Wear', 2904.17, 19.5, 2337.86, 3.46, 205,
  82, 'Classic Wear Official Store', 'https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/1.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/2.webp"]'::jsonb, '{"Brand": "Classic Wear", "Category": "Fashion", "Type": "Men", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Man Short Sleeve Shirt', 'man-short-sleeve-shirt', 'The Man Short Sleeve Shirt is a breezy and stylish option for warm days. With a comfortable fit and short sleeves, it''s perfect for a laid-back yet polished look.', 'The Man Short Sleeve Shirt is a breezy and stylish option for warm days. With a comfortable fit and short sleeves, it''s perfect for a laid-b…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Men',
  'Casual Comfort', 1659.17, 6.83, 1545.85, 2.9, 5,
  2, 'Casual Comfort Official Store', 'https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/1.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/2.webp"]'::jsonb, '{"Brand": "Casual Comfort", "Category": "Fashion", "Type": "Men", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Men Check Shirt', 'men-check-shirt', 'The Men Check Shirt is a classic and versatile shirt featuring a stylish check pattern. Suitable for various occasions, it adds a smart and polished touch to your wardrobe.', 'The Men Check Shirt is a classic and versatile shirt featuring a stylish check pattern. Suitable for various occasions, it adds a smart and …',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Men',
  'Urban Chic', 2323.17, 11.38, 2058.79, 2.72, 238,
  95, 'Urban Chic Official Store', 'https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/1.webp", "https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/2.webp"]'::jsonb, '{"Brand": "Urban Chic", "Category": "Fashion", "Type": "Men", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Black Women''s Gown', 'black-women-s-gown', 'The Black Women''s Gown is an elegant and timeless evening gown. With a sleek black design, it''s perfect for formal events and special occasions, exuding sophistication and style.', 'The Black Women''s Gown is an elegant and timeless evening gown. With a sleek black design, it''s perfect for formal events and special occasi…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Women',
  'Unbranded', 10789.17, 10.48, 9658.46, 3.64, 62,
  25, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/womens-dresses/black-women''s-gown/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/womens-dresses/black-women''s-gown/1.webp", "https://cdn.dummyjson.com/product-images/womens-dresses/black-women''s-gown/2.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Fashion", "Type": "Women", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Corset Leather With Skirt', 'corset-leather-with-skirt', 'The Corset Leather With Skirt is a bold and edgy ensemble that combines a stylish corset with a matching skirt. Ideal for fashion-forward individuals, it makes a statement at any event.', 'The Corset Leather With Skirt is a bold and edgy ensemble that combines a stylish corset with a matching skirt. Ideal for fashion-forward in…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Women',
  'Unbranded', 7469.17, 16.26, 6254.68, 3.05, 75,
  30, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/1.webp", "https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/2.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Fashion", "Type": "Women", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Corset With Black Skirt', 'corset-with-black-skirt', 'The Corset With Black Skirt is a chic and versatile outfit that pairs a fashionable corset with a classic black skirt. It offers a trendy and coordinated look for various occasions.', 'The Corset With Black Skirt is a chic and versatile outfit that pairs a fashionable corset with a classic black skirt. It offers a trendy an…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Women',
  'Unbranded', 6639.17, 15.06, 5639.31, 4.52, 82,
  33, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/1.webp", "https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/2.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Fashion", "Type": "Women", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Dress Pea', 'dress-pea', 'The Dress Pea is a stylish and comfortable dress with a pea pattern. Perfect for casual outings, it adds a playful and fun element to your wardrobe, making it a great choice for day-to-day wear.', 'The Dress Pea is a stylish and comfortable dress with a pea pattern. Perfect for casual outings, it adds a playful and fun element to your w…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Women',
  'Unbranded', 4149.17, 17.68, 3415.6, 4.88, 15,
  6, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/1.webp", "https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/2.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Fashion", "Type": "Women", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Marni Red & Black Suit', 'marni-red-black-suit', 'The Marni Red & Black Suit is a sophisticated and fashion-forward suit ensemble. With a combination of red and black tones, it showcases a modern design for a bold and confident look.', 'The Marni Red & Black Suit is a sophisticated and fashion-forward suit ensemble. With a combination of red and black tones, it showcases a m…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Women',
  'Unbranded', 14939.17, 19.02, 12097.74, 4.48, 155,
  62, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/1.webp", "https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/2.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Fashion", "Type": "Women", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Black & Brown Slipper', 'black-brown-slipper', 'The Black & Brown Slipper is a comfortable and stylish choice for casual wear. Featuring a blend of black and brown colors, it adds a touch of sophistication to your relaxation.', 'The Black & Brown Slipper is a comfortable and stylish choice for casual wear. Featuring a blend of black and brown colors, it adds a touch …',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Footwear',
  'Comfort Trends', 1659.17, 3.33, 1603.92, 2.53, 8,
  3, 'Comfort Trends Official Store', 'https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/womens-shoes/black-&-brown-slipper/1.webp"]'::jsonb, '{"Brand": "Comfort Trends", "Category": "Fashion", "Type": "Footwear", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Black Sun Glasses', 'black-sun-glasses', 'The Black Sun Glasses are a classic and stylish choice, featuring a sleek black frame and tinted lenses. They provide both UV protection and a fashionable look.', 'The Black Sun Glasses are a classic and stylish choice, featuring a sleek black frame and tinted lenses. They provide both UV protection and…',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Accessories',
  'Fashion Shades', 2489.17, 4.94, 2366.21, 4.41, 150,
  60, 'Fashion Shades Official Store', 'https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/sunglasses/black-sun-glasses/1.webp"]'::jsonb, '{"Brand": "Fashion Shades", "Category": "Fashion", "Type": "Accessories", "Care": "See product label", "Closure Type": "Standard"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Essence Mascara Lash Princess', 'essence-mascara-lash-princess', 'The Essence Mascara Lash Princess is a popular mascara known for its volumizing and lengthening effects. Achieve dramatic lashes with this long-lasting and cruelty-free formula.', 'The Essence Mascara Lash Princess is a popular mascara known for its volumizing and lengthening effects. Achieve dramatic lashes with this l…',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Makeup',
  'Essence', 829.17, 10.48, 742.27, 2.56, 248,
  99, 'Essence Official Store', 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp"]'::jsonb, '{"Brand": "Essence", "Category": "Beauty", "Type": "Makeup", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Eyeshadow Palette with Mirror', 'eyeshadow-palette-with-mirror', 'The Eyeshadow Palette with Mirror offers a versatile range of eyeshadow shades for creating stunning eye looks. With a built-in mirror, it''s convenient for on-the-go makeup application.', 'The Eyeshadow Palette with Mirror offers a versatile range of eyeshadow shades for creating stunning eye looks. With a built-in mirror, it''s…',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Makeup',
  'Glamour Beauty', 1659.17, 18.19, 1357.37, 2.86, 85,
  34, 'Glamour Beauty Official Store', 'https://cdn.dummyjson.com/product-images/beauty/eyeshadow-palette-with-mirror/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/beauty/eyeshadow-palette-with-mirror/1.webp"]'::jsonb, '{"Brand": "Glamour Beauty", "Category": "Beauty", "Type": "Makeup", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Powder Canister', 'powder-canister', 'The Powder Canister is a finely milled setting powder designed to set makeup and control shine. With a lightweight and translucent formula, it provides a smooth and matte finish.', 'The Powder Canister is a finely milled setting powder designed to set makeup and control shine. With a lightweight and translucent formula, …',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Makeup',
  'Velvet Touch', 1244.17, 9.84, 1121.74, 4.64, 222,
  89, 'Velvet Touch Official Store', 'https://cdn.dummyjson.com/product-images/beauty/powder-canister/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/beauty/powder-canister/1.webp"]'::jsonb, '{"Brand": "Velvet Touch", "Category": "Beauty", "Type": "Makeup", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Red Lipstick', 'red-lipstick', 'The Red Lipstick is a classic and bold choice for adding a pop of color to your lips. With a creamy and pigmented formula, it provides a vibrant and long-lasting finish.', 'The Red Lipstick is a classic and bold choice for adding a pop of color to your lips. With a creamy and pigmented formula, it provides a vib…',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Makeup',
  'Chic Cosmetics', 1078.17, 12.16, 947.06, 4.36, 228,
  91, 'Chic Cosmetics Official Store', 'https://cdn.dummyjson.com/product-images/beauty/red-lipstick/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/beauty/red-lipstick/1.webp"]'::jsonb, '{"Brand": "Chic Cosmetics", "Category": "Beauty", "Type": "Makeup", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Red Nail Polish', 'red-nail-polish', 'The Red Nail Polish offers a rich and glossy red hue for vibrant and polished nails. With a quick-drying formula, it provides a salon-quality finish at home.', 'The Red Nail Polish offers a rich and glossy red hue for vibrant and polished nails. With a quick-drying formula, it provides a salon-qualit…',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Makeup',
  'Nail Couture', 746.17, 11.44, 660.81, 4.32, 198,
  79, 'Nail Couture Official Store', 'https://cdn.dummyjson.com/product-images/beauty/red-nail-polish/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/beauty/red-nail-polish/1.webp"]'::jsonb, '{"Brand": "Nail Couture", "Category": "Beauty", "Type": "Makeup", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Calvin Klein CK One', 'calvin-klein-ck-one', 'CK One by Calvin Klein is a classic unisex fragrance, known for its fresh and clean scent. It''s a versatile fragrance suitable for everyday wear.', 'CK One by Calvin Klein is a classic unisex fragrance, known for its fresh and clean scent. It''s a versatile fragrance suitable for everyday …',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Fragrance',
  'Calvin Klein', 4149.17, 1.89, 4070.75, 4.37, 72,
  29, 'Calvin Klein Official Store', 'https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/1.webp", "https://cdn.dummyjson.com/product-images/fragrances/calvin-klein-ck-one/2.webp"]'::jsonb, '{"Brand": "Calvin Klein", "Category": "Beauty", "Type": "Fragrance", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Chanel Coco Noir Eau De', 'chanel-coco-noir-eau-de', 'Coco Noir by Chanel is an elegant and mysterious fragrance, featuring notes of grapefruit, rose, and sandalwood. Perfect for evening occasions.', 'Coco Noir by Chanel is an elegant and mysterious fragrance, featuring notes of grapefruit, rose, and sandalwood. Perfect for evening occasio…',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Fragrance',
  'Chanel', 10789.17, 16.51, 9007.88, 4.26, 145,
  58, 'Chanel Official Store', 'https://cdn.dummyjson.com/product-images/fragrances/chanel-coco-noir-eau-de/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/fragrances/chanel-coco-noir-eau-de/1.webp", "https://cdn.dummyjson.com/product-images/fragrances/chanel-coco-noir-eau-de/2.webp"]'::jsonb, '{"Brand": "Chanel", "Category": "Beauty", "Type": "Fragrance", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Dior J''adore', 'dior-j-adore', 'J''adore by Dior is a luxurious and floral fragrance, known for its blend of ylang-ylang, rose, and jasmine. It embodies femininity and sophistication.', 'J''adore by Dior is a luxurious and floral fragrance, known for its blend of ylang-ylang, rose, and jasmine. It embodies femininity and sophi…',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Fragrance',
  'Dior', 7469.17, 14.72, 6369.71, 3.8, 245,
  98, 'Dior Official Store', 'https://cdn.dummyjson.com/product-images/fragrances/dior-j''adore/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/fragrances/dior-j''adore/1.webp", "https://cdn.dummyjson.com/product-images/fragrances/dior-j''adore/2.webp"]'::jsonb, '{"Brand": "Dior", "Category": "Beauty", "Type": "Fragrance", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Dolce Shine Eau de', 'dolce-shine-eau-de', 'Dolce Shine by Dolce & Gabbana is a vibrant and fruity fragrance, featuring notes of mango, jasmine, and blonde woods. It''s a joyful and youthful scent.', 'Dolce Shine by Dolce & Gabbana is a vibrant and fruity fragrance, featuring notes of mango, jasmine, and blonde woods. It''s a joyful and you…',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Fragrance',
  'Dolce & Gabbana', 5809.17, 0.62, 5773.15, 3.96, 10,
  4, 'Dolce & Gabbana Official Store', 'https://cdn.dummyjson.com/product-images/fragrances/dolce-shine-eau-de/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/fragrances/dolce-shine-eau-de/1.webp", "https://cdn.dummyjson.com/product-images/fragrances/dolce-shine-eau-de/2.webp"]'::jsonb, '{"Brand": "Dolce & Gabbana", "Category": "Beauty", "Type": "Fragrance", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Gucci Bloom Eau de', 'gucci-bloom-eau-de', 'Gucci Bloom by Gucci is a floral and captivating fragrance, with notes of tuberose, jasmine, and Rangoon creeper. It''s a modern and romantic scent.', 'Gucci Bloom by Gucci is a floral and captivating fragrance, with notes of tuberose, jasmine, and Rangoon creeper. It''s a modern and romantic…',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Fragrance',
  'Gucci', 6639.17, 14.39, 5683.79, 2.74, 228,
  91, 'Gucci Official Store', 'https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/1.webp", "https://cdn.dummyjson.com/product-images/fragrances/gucci-bloom-eau-de/2.webp"]'::jsonb, '{"Brand": "Gucci", "Category": "Beauty", "Type": "Fragrance", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Attitude Super Leaves Hand Soap', 'attitude-super-leaves-hand-soap', 'Attitude Super Leaves Hand Soap is a natural and nourishing hand soap enriched with the goodness of super leaves. It cleanses and moisturizes your hands, leaving them feeling fresh and soft.', 'Attitude Super Leaves Hand Soap is a natural and nourishing hand soap enriched with the goodness of super leaves. It cleanses and moisturize…',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Skincare',
  'Attitude', 746.17, 18.49, 608.2, 3.19, 235,
  94, 'Attitude Official Store', 'https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/skin-care/attitude-super-leaves-hand-soap/1.webp"]'::jsonb, '{"Brand": "Attitude", "Category": "Beauty", "Type": "Skincare", "Suitable For": "All Skin/Hair Types", "Cruelty Free": "Yes"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Annibale Colombo Bed', 'annibale-colombo-bed', 'The Annibale Colombo Bed is a luxurious and elegant bed frame, crafted with high-quality materials for a comfortable and stylish bedroom.', 'The Annibale Colombo Bed is a luxurious and elegant bed frame, crafted with high-quality materials for a comfortable and stylish bedroom.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Furniture',
  'Annibale Colombo', 157699.17, 8.57, 144184.35, 4.77, 220,
  88, 'Annibale Colombo Official Store', 'https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/1.webp", "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-bed/2.webp"]'::jsonb, '{"Brand": "Annibale Colombo", "Category": "Home-Kitchen", "Type": "Furniture", "Material": "As specified by manufacturer"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Annibale Colombo Sofa', 'annibale-colombo-sofa', 'The Annibale Colombo Sofa is a sophisticated and comfortable seating option, featuring exquisite design and premium upholstery for your living room.', 'The Annibale Colombo Sofa is a sophisticated and comfortable seating option, featuring exquisite design and premium upholstery for your livi…',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Furniture',
  'Annibale Colombo', 207499.17, 14.4, 177619.29, 3.92, 150,
  60, 'Annibale Colombo Official Store', 'https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/1.webp", "https://cdn.dummyjson.com/product-images/furniture/annibale-colombo-sofa/2.webp"]'::jsonb, '{"Brand": "Annibale Colombo", "Category": "Home-Kitchen", "Type": "Furniture", "Material": "As specified by manufacturer"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Bedside Table African Cherry', 'bedside-table-african-cherry', 'The Bedside Table in African Cherry is a stylish and functional addition to your bedroom, providing convenient storage space and a touch of elegance.', 'The Bedside Table in African Cherry is a stylish and functional addition to your bedroom, providing convenient storage space and a touch of …',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Furniture',
  'Furniture Co.', 24899.17, 19.09, 20145.92, 2.87, 160,
  64, 'Furniture Co. Official Store', 'https://cdn.dummyjson.com/product-images/furniture/bedside-table-african-cherry/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/furniture/bedside-table-african-cherry/1.webp", "https://cdn.dummyjson.com/product-images/furniture/bedside-table-african-cherry/2.webp"]'::jsonb, '{"Brand": "Furniture Co.", "Category": "Home-Kitchen", "Type": "Furniture", "Material": "As specified by manufacturer"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Apple', 'apple', 'Fresh and crisp apples, perfect for snacking or incorporating into various recipes.', 'Fresh and crisp apples, perfect for snacking or incorporating into various recipes.',
  (SELECT id FROM categories WHERE slug = 'grocery'), 'Pantry',
  'Unbranded', 165.17, 12.62, 144.33, 4.19, 20,
  8, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/groceries/apple/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/groceries/apple/1.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Grocery", "Type": "Pantry", "Shelf Life": "See packaging"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Beef Steak', 'beef-steak', 'High-quality beef steak, great for grilling or cooking to your preferred level of doneness.', 'High-quality beef steak, great for grilling or cooking to your preferred level of doneness.',
  (SELECT id FROM categories WHERE slug = 'grocery'), 'Pantry',
  'Unbranded', 1078.17, 9.61, 974.56, 4.47, 215,
  86, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/groceries/beef-steak/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/groceries/beef-steak/1.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Grocery", "Type": "Pantry", "Shelf Life": "See packaging"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Bamboo Spatula', 'bamboo-spatula', 'The Bamboo Spatula is a versatile kitchen tool made from eco-friendly bamboo. Ideal for flipping, stirring, and serving various dishes.', 'The Bamboo Spatula is a versatile kitchen tool made from eco-friendly bamboo. Ideal for flipping, stirring, and serving various dishes.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Kitchen',
  'Unbranded', 663.17, 2.84, 644.34, 3.27, 92,
  37, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/kitchen-accessories/bamboo-spatula/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/kitchen-accessories/bamboo-spatula/1.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Home-Kitchen", "Type": "Kitchen", "Material": "As specified by manufacturer"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Black Aluminium Cup', 'black-aluminium-cup', 'The Black Aluminium Cup is a stylish and durable cup suitable for both hot and cold beverages. Its sleek black design adds a modern touch to your drinkware collection.', 'The Black Aluminium Cup is a stylish and durable cup suitable for both hot and cold beverages. Its sleek black design adds a modern touch to…',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Kitchen',
  'Unbranded', 497.17, 15.65, 419.36, 4.46, 188,
  75, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/kitchen-accessories/black-aluminium-cup/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/kitchen-accessories/black-aluminium-cup/1.webp", "https://cdn.dummyjson.com/product-images/kitchen-accessories/black-aluminium-cup/2.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Home-Kitchen", "Type": "Kitchen", "Material": "As specified by manufacturer"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Black Whisk', 'black-whisk', 'The Black Whisk is a kitchen essential for whisking and beating ingredients. Its ergonomic handle and sleek design make it a practical and stylish tool.', 'The Black Whisk is a kitchen essential for whisking and beating ingredients. Its ergonomic handle and sleek design make it a practical and s…',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Kitchen',
  'Unbranded', 829.17, 10.24, 744.26, 3.9, 182,
  73, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/kitchen-accessories/black-whisk/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/kitchen-accessories/black-whisk/1.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Home-Kitchen", "Type": "Kitchen", "Material": "As specified by manufacturer"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'American Football', 'american-football', 'The American Football is a classic ball used in American football games. It is designed for throwing and catching, making it an essential piece of equipment for the sport.', 'The American Football is a classic ball used in American football games. It is designed for throwing and catching, making it an essential pi…',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Fitness',
  'Unbranded', 1659.17, 4.93, 1577.37, 4.91, 132,
  53, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/sports-accessories/american-football/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/sports-accessories/american-football/1.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Sports", "Type": "Fitness", "Recommended Use": "Recreational & Amateur Play"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Baseball Ball', 'baseball-ball', 'The Baseball Ball is a standard baseball used in baseball games. It features a durable leather cover and is designed for pitching, hitting, and fielding in the game of baseball.', 'The Baseball Ball is a standard baseball used in baseball games. It features a durable leather cover and is designed for pitching, hitting, …',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Fitness',
  'Unbranded', 746.17, 1.71, 733.41, 2.57, 250,
  100, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/sports-accessories/baseball-ball/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/sports-accessories/baseball-ball/1.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Sports", "Type": "Fitness", "Recommended Use": "Recreational & Amateur Play"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Baseball Glove', 'baseball-glove', 'The Baseball Glove is a protective glove worn by baseball players. It is designed to catch and field the baseball, providing players with comfort and control during the game.', 'The Baseball Glove is a protective glove worn by baseball players. It is designed to catch and field the baseball, providing players with co…',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Fitness',
  'Unbranded', 2074.17, 2.9, 2014.02, 3.96, 55,
  22, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/sports-accessories/baseball-glove/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/sports-accessories/baseball-glove/1.webp", "https://cdn.dummyjson.com/product-images/sports-accessories/baseball-glove/2.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Sports", "Type": "Fitness", "Recommended Use": "Recreational & Amateur Play"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Basketball', 'basketball', 'The Basketball is a standard ball used in basketball games. It is designed for dribbling, shooting, and passing in the game of basketball, suitable for both indoor and outdoor play.', 'The Basketball is a standard ball used in basketball games. It is designed for dribbling, shooting, and passing in the game of basketball, s…',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Fitness',
  'Unbranded', 1244.17, 7.44, 1151.6, 4.66, 188,
  75, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/sports-accessories/basketball/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/sports-accessories/basketball/1.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Sports", "Type": "Fitness", "Recommended Use": "Recreational & Amateur Play"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Basketball Rim', 'basketball-rim', 'The Basketball Rim is a sturdy hoop and net assembly mounted on a basketball backboard. It provides a target for shooting and scoring in the game of basketball.', 'The Basketball Rim is a sturdy hoop and net assembly mounted on a basketball backboard. It provides a target for shooting and scoring in the…',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Fitness',
  'Unbranded', 3319.17, 7.74, 3062.27, 4.6, 108,
  43, 'Cartify Retail', 'https://cdn.dummyjson.com/product-images/sports-accessories/basketball-rim/thumbnail.webp', '["https://cdn.dummyjson.com/product-images/sports-accessories/basketball-rim/1.webp"]'::jsonb, '{"Brand": "Unbranded", "Category": "Sports", "Type": "Fitness", "Recommended Use": "Recreational & Amateur Play"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'PlayStation 5 Console', 'playstation-5-console', 'Sony''s PlayStation 5 console with ultra-high-speed SSD, ray tracing support, and the DualSense controller with haptic feedback.', 'Sony''s PlayStation 5 console with ultra-high-speed SSD, ray tracing support, and the DualSense controller with haptic feedback.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Consoles',
  'Sony', 41499.17, 0.0, 41499.17, 4.8, 35,
  14, 'Sony Official Store', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Sony", "Category": "Gaming", "Type": "Consoles", "Warranty": "1 Year Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Xbox Series X Console', 'xbox-series-x-console', 'Microsoft''s Xbox Series X, built for 4K gaming at up to 120fps with a custom SSD for near-instant load times.', 'Microsoft''s Xbox Series X, built for 4K gaming at up to 120fps with a custom SSD for near-instant load times.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Consoles',
  'Microsoft', 41499.17, 5.0, 39424.21, 4.7, 22,
  9, 'Microsoft Official Store', 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Microsoft", "Category": "Gaming", "Type": "Consoles", "Warranty": "1 Year Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Nintendo Switch OLED', 'nintendo-switch-oled', 'Nintendo Switch OLED model with a vivid 7-inch OLED screen, enhanced audio, and a wide adjustable stand for tabletop play.', 'Nintendo Switch OLED model with a vivid 7-inch OLED screen, enhanced audio, and a wide adjustable stand for tabletop play.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Consoles',
  'Nintendo', 29049.17, 0.0, 29049.17, 4.6, 55,
  22, 'Nintendo Official Store', 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Nintendo", "Category": "Gaming", "Type": "Consoles", "Warranty": "1 Year Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'DualSense Wireless Controller', 'dualsense-wireless-controller', 'The PS5 DualSense controller featuring adaptive triggers, haptic feedback, and a built-in microphone for immersive gameplay.', 'The PS5 DualSense controller featuring adaptive triggers, haptic feedback, and a built-in microphone for immersive gameplay.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Gaming Accessories',
  'Sony', 5809.17, 10.0, 5228.25, 4.5, 120,
  48, 'Sony Official Store', 'https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Sony", "Category": "Gaming", "Type": "Gaming Accessories", "Warranty": "1 Year Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Razer BlackWidow Mechanical Keyboard', 'razer-blackwidow-mechanical-keyboard', 'Razer BlackWidow mechanical gaming keyboard with per-key RGB lighting and tactile Razer Green switches.', 'Razer BlackWidow mechanical gaming keyboard with per-key RGB lighting and tactile Razer Green switches.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'PC Gaming',
  'Razer', 11619.17, 15.0, 9876.29, 4.4, 78,
  31, 'Razer Official Store', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Razer", "Category": "Gaming", "Type": "PC Gaming", "Warranty": "1 Year Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'HyperX Cloud II Gaming Headset', 'hyperx-cloud-ii-gaming-headset', 'HyperX Cloud II headset with virtual 7.1 surround sound, memory foam ear cushions, and a detachable noise-cancelling mic.', 'HyperX Cloud II headset with virtual 7.1 surround sound, memory foam ear cushions, and a detachable noise-cancelling mic.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Gaming Accessories',
  'HyperX', 8299.17, 12.0, 7303.27, 4.6, 100,
  40, 'HyperX Official Store', 'https://images.unsplash.com/photo-1599669454699-248893623440?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1599669454699-248893623440?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "HyperX", "Category": "Gaming", "Type": "Gaming Accessories", "Warranty": "1 Year Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Logitech G502 Gaming Mouse', 'logitech-g502-gaming-mouse', 'Logitech G502 HERO gaming mouse with a 25K DPI sensor, adjustable weights, and 11 programmable buttons.', 'Logitech G502 HERO gaming mouse with a 25K DPI sensor, adjustable weights, and 11 programmable buttons.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'PC Gaming',
  'Logitech', 6639.17, 20.0, 5311.34, 4.7, 162,
  65, 'Logitech Official Store', 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Logitech", "Category": "Gaming", "Type": "PC Gaming", "Warranty": "1 Year Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Meta Quest 3 VR Headset', 'meta-quest-3-vr-headset', 'Meta Quest 3 standalone VR headset with mixed-reality passthrough and a high-resolution display for immersive gaming.', 'Meta Quest 3 standalone VR headset with mixed-reality passthrough and a high-resolution display for immersive gaming.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Gaming Accessories',
  'Meta', 41499.17, 0.0, 41499.17, 4.3, 28,
  11, 'Meta Official Store', 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Meta", "Category": "Gaming", "Type": "Gaming Accessories", "Warranty": "1 Year Manufacturer Warranty"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Atomic Habits', 'atomic-habits', 'James Clear''s bestselling guide to building good habits and breaking bad ones through small, incremental changes.', 'James Clear''s bestselling guide to building good habits and breaking bad ones through small, incremental changes.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Non-Fiction',
  'Penguin', 1410.17, 10.0, 1269.15, 4.8, 300,
  120, 'Penguin Official Store', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Penguin", "Category": "Books", "Type": "Non-Fiction", "Format": "Paperback"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Sapiens: A Brief History of Humankind', 'sapiens-a-brief-history-of-humankind', 'Yuval Noah Harari''s sweeping narrative of how Homo sapiens came to dominate the world, from the Stone Age to the modern era.', 'Yuval Noah Harari''s sweeping narrative of how Homo sapiens came to dominate the world, from the Stone Age to the modern era.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Non-Fiction',
  'HarperCollins', 1576.17, 8.0, 1450.08, 4.7, 212,
  85, 'HarperCollins Official Store', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "HarperCollins", "Category": "Books", "Type": "Non-Fiction", "Format": "Paperback"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'The Silent Patient', 'the-silent-patient', 'A psychological thriller by Alex Michaelides about a woman''s act of violence against her husband, and the therapist obsessed with uncovering why.', 'A psychological thriller by Alex Michaelides about a woman''s act of violence against her husband, and the therapist obsessed with uncovering…',
  (SELECT id FROM categories WHERE slug = 'books'), 'Fiction',
  'Celadon Books', 1244.17, 5.0, 1181.96, 4.5, 150,
  60, 'Celadon Books Official Store', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Celadon Books", "Category": "Books", "Type": "Fiction", "Format": "Paperback"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Clean Code: A Handbook of Agile Software Craftsmanship', 'clean-code-a-handbook-of-agile-software-craftsmanship', 'Robert C. Martin''s guide to writing readable, maintainable code, widely used as a reference in professional software engineering.', 'Robert C. Martin''s guide to writing readable, maintainable code, widely used as a reference in professional software engineering.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Academic',
  'Prentice Hall', 3319.17, 0.0, 3319.17, 4.4, 112,
  45, 'Prentice Hall Official Store', 'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Prentice Hall", "Category": "Books", "Type": "Academic", "Format": "Paperback"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Introduction to Algorithms', 'introduction-to-algorithms', 'The widely used CLRS textbook covering algorithm design, analysis, and a comprehensive range of core computer science algorithms.', 'The widely used CLRS textbook covering algorithm design, analysis, and a comprehensive range of core computer science algorithms.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Academic',
  'MIT Press', 7469.17, 0.0, 7469.17, 4.6, 62,
  25, 'MIT Press Official Store', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "MIT Press", "Category": "Books", "Type": "Academic", "Format": "Paperback"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'The Midnight Library', 'the-midnight-library', 'Matt Haig''s novel about a library between life and death, where every book lets you try a different version of your life.', 'Matt Haig''s novel about a library between life and death, where every book lets you try a different version of your life.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Fiction',
  'Penguin', 1327.17, 12.0, 1167.91, 4.6, 175,
  70, 'Penguin Official Store', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Penguin", "Category": "Books", "Type": "Fiction", "Format": "Paperback"}'::jsonb
);
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Ikigai: The Japanese Secret to a Long and Happy Life', 'ikigai-the-japanese-secret-to-a-long-and-happy-life', 'Héctor García and Francesc Miralles explore the Japanese concept of ikigai — one''s reason for being — and its link to longevity.', 'Héctor García and Francesc Miralles explore the Japanese concept of ikigai — one''s reason for being — and its link to longevity.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Non-Fiction',
  'Penguin', 1161.17, 7.0, 1079.89, 4.3, 138,
  55, 'Penguin Official Store', 'https://images.unsplash.com/photo-1521056787327-b0fe7cba9f43?w=200&h=200&fit=crop', '["https://images.unsplash.com/photo-1521056787327-b0fe7cba9f43?w=600&h=600&fit=crop"]'::jsonb, '{"Brand": "Penguin", "Category": "Books", "Type": "Non-Fiction", "Format": "Paperback"}'::jsonb
);

COMMIT;