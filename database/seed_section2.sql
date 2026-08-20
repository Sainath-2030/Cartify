-- generated 70 products across 8 categories

-- ==========================================================
-- Cartify Seed Data — Section 2 (categories + products)
-- Run AFTER schema.sql and schema_section2.sql
-- ==========================================================

INSERT INTO categories (name, slug, description, image) VALUES
('Electronics', 'electronics', 'Smartphones, laptops, audio and accessories.', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop&auto=format&q=75'),
('Fashion', 'fashion', 'Clothing, footwear and accessories for everyone.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop&auto=format&q=75'),
('Home & Kitchen', 'home-kitchen', 'Everything for your kitchen, furniture and appliances.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=400&fit=crop&auto=format&q=75'),
('Books', 'books', 'Fiction, non-fiction and academic reads.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop&auto=format&q=75'),
('Beauty', 'beauty', 'Skincare, haircare and personal grooming essentials.', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=400&fit=crop&auto=format&q=75'),
('Sports', 'sports', 'Gear and equipment for an active lifestyle.', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop&auto=format&q=75'),
('Grocery', 'grocery', 'Everyday groceries and pantry staples.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop&auto=format&q=75'),
('Gaming', 'gaming', 'Consoles, accessories and PC gaming gear.', 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=800&h=400&fit=crop&auto=format&q=75')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Galaxy S23 Ultra Smartphone', 'galaxy-s23-ultra-smartphone-1', 'A flagship smartphone with a stunning display, powerful processor and all-day battery life, built for everyday performance. Backed by a manufacturer warranty and easy returns through Cartify.', 'A flagship smartphone with a stunning display, powerful processor and all-day battery life, built for everyday performance.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'Samsung', 1299, 40, 779.4, 3.9, 1840,
  5, 'Samsung Official Store', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Samsung", "Model": "Galaxy", "Category": "Electronics", "Subcategory": "Smartphones", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'iPhone 15 Pro', 'iphone-15-pro-2', 'A flagship smartphone with a stunning display, powerful processor and all-day battery life, built for everyday performance. Trusted by thousands of customers for reliable, everyday performance.', 'A flagship smartphone with a stunning display, powerful processor and all-day battery life, built for everyday performance.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'HP', 1299, 0, 1299.0, 3.6, 1917,
  80, 'HP Official Store', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "HP", "Model": "iPhone", "Category": "Electronics", "Subcategory": "Smartphones", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'OnePlus 12R 5G Smartphone', 'oneplus-12r-5g-smartphone-3', 'A flagship smartphone with a stunning display, powerful processor and all-day battery life, built for everyday performance. Trusted by thousands of customers for reliable, everyday performance.', 'A flagship smartphone with a stunning display, powerful processor and all-day battery life, built for everyday performance.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones',
  'OnePlus', 11999, 10, 10799.1, 4.1, 2290,
  0, 'OnePlus Official Store', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "OnePlus", "Model": "OnePlus", "Category": "Electronics", "Subcategory": "Smartphones", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'MacBook Air M2 13-inch', 'macbook-air-m2-13-inch-4', 'A lightweight, high-performance laptop designed for productivity, creativity and seamless multitasking on the go. Backed by a manufacturer warranty and easy returns through Cartify.', 'A lightweight, high-performance laptop designed for productivity, creativity and seamless multitasking on the go.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Laptops',
  'HP', 8999, 12, 7919.12, 3.7, 2769,
  3, 'Cartify Retail', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "HP", "Model": "MacBook", "Category": "Electronics", "Subcategory": "Laptops", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Inspiron 15 Laptop', 'inspiron-15-laptop-5', 'A lightweight, high-performance laptop designed for productivity, creativity and seamless multitasking on the go. A best-seller in its category, loved for its quality and value.', 'A lightweight, high-performance laptop designed for productivity, creativity and seamless multitasking on the go.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Laptops',
  'Dell', 24999, 12, 21999.12, 4.6, 3775,
  80, 'Cartify Retail', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Dell", "Model": "Inspiron", "Category": "Electronics", "Subcategory": "Laptops", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Pavilion 14 Laptop', 'pavilion-14-laptop-6', 'A lightweight, high-performance laptop designed for productivity, creativity and seamless multitasking on the go. Backed by a manufacturer warranty and easy returns through Cartify.', 'A lightweight, high-performance laptop designed for productivity, creativity and seamless multitasking on the go.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Laptops',
  'OnePlus', 6999, 35, 4549.35, 4.4, 2974,
  120, 'Cartify Retail', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "OnePlus", "Model": "Pavilion", "Category": "Electronics", "Subcategory": "Laptops", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'WH-1000XM5 Wireless Headphones', 'wh-1000xm5-wireless-headphones-7', 'Immersive sound with active noise cancellation, comfortable ear cushions and long battery life for all-day listening. A best-seller in its category, loved for its quality and value.', 'Immersive sound with active noise cancellation, comfortable ear cushions and long battery life for all-day listening.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Headphones',
  'boAt', 69999, 12, 61599.12, 4.9, 1919,
  3, 'Cartify Retail', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "boAt", "Model": "WH-1000XM5", "Category": "Electronics", "Subcategory": "Headphones", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Rockerz 450 Bluetooth Headphones', 'rockerz-450-bluetooth-headphones-8', 'Immersive sound with active noise cancellation, comfortable ear cushions and long battery life for all-day listening. Trusted by thousands of customers for reliable, everyday performance.', 'Immersive sound with active noise cancellation, comfortable ear cushions and long battery life for all-day listening.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Headphones',
  'Dell', 2999, 15, 2549.15, 4.0, 2199,
  3, 'Dell Official Store', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Dell", "Model": "Rockerz", "Category": "Electronics", "Subcategory": "Headphones", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Tune 510BT Wireless Headphones', 'tune-510bt-wireless-headphones-9', 'Immersive sound with active noise cancellation, comfortable ear cushions and long battery life for all-day listening. Backed by a manufacturer warranty and easy returns through Cartify.', 'Immersive sound with active noise cancellation, comfortable ear cushions and long battery life for all-day listening.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Headphones',
  'boAt', 2999, 20, 2399.2, 4.0, 4574,
  8, 'boAt Official Store', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "boAt", "Model": "Tune", "Category": "Electronics", "Subcategory": "Headphones", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'EOS R50 Mirrorless Camera', 'eos-r50-mirrorless-camera-10', 'Capture sharp, vibrant photos and smooth video with a compact, easy-to-use camera built for enthusiasts and professionals alike. Thoughtfully designed with attention to detail and everyday usability.', 'Capture sharp, vibrant photos and smooth video with a compact, easy-to-use camera built for enthusiasts and professionals alike.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Cameras',
  'Sony', 69999, 15, 59499.15, 4.1, 554,
  8, 'Sony Official Store', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Sony", "Model": "EOS", "Category": "Electronics", "Subcategory": "Cameras", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'PowerShot G7X Digital Camera', 'powershot-g7x-digital-camera-11', 'Capture sharp, vibrant photos and smooth video with a compact, easy-to-use camera built for enthusiasts and professionals alike. Thoughtfully designed with attention to detail and everyday usability.', 'Capture sharp, vibrant photos and smooth video with a compact, easy-to-use camera built for enthusiasts and professionals alike.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Cameras',
  'Canon', 11999, 35, 7799.35, 4.1, 2181,
  5, 'Cartify Retail', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Canon", "Model": "PowerShot", "Category": "Electronics", "Subcategory": "Cameras", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'MX Master 3S Wireless Mouse', 'mx-master-3s-wireless-mouse-12', 'A reliable accessory engineered for durability and everyday convenience, compatible with a wide range of devices. Backed by a manufacturer warranty and easy returns through Cartify.', 'A reliable accessory engineered for durability and everyday convenience, compatible with a wide range of devices.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Accessories',
  'Logitech', 11999, 30, 8399.3, 4.1, 1808,
  5, 'Logitech Official Store', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Logitech", "Model": "MX", "Category": "Electronics", "Subcategory": "Accessories", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'K380 Multi-Device Keyboard', 'k380-multi-device-keyboard-13', 'A reliable accessory engineered for durability and everyday convenience, compatible with a wide range of devices. A best-seller in its category, loved for its quality and value.', 'A reliable accessory engineered for durability and everyday convenience, compatible with a wide range of devices.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Accessories',
  'Samsung', 2999, 35, 1949.35, 3.7, 3470,
  120, 'Cartify Retail', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Samsung", "Model": "K380", "Category": "Electronics", "Subcategory": "Accessories", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  '45W USB-C Fast Charger', '45w-usb-c-fast-charger-14', 'A reliable accessory engineered for durability and everyday convenience, compatible with a wide range of devices. Thoughtfully designed with attention to detail and everyday usability.', 'A reliable accessory engineered for durability and everyday convenience, compatible with a wide range of devices.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Accessories',
  'Canon', 19999, 12, 17599.12, 4.9, 106,
  3, 'Canon Official Store', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Canon", "Model": "45W", "Category": "Electronics", "Subcategory": "Accessories", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  '27-inch 4K UHD Monitor', '27-inch-4k-uhd-monitor-15', 'A reliable accessory engineered for durability and everyday convenience, compatible with a wide range of devices. Thoughtfully designed with attention to detail and everyday usability.', 'A reliable accessory engineered for durability and everyday convenience, compatible with a wide range of devices.',
  (SELECT id FROM categories WHERE slug = 'electronics'), 'Accessories',
  'Dell', 1999, 12, 1759.12, 4.1, 3728,
  0, 'Dell Official Store', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Dell", "Model": "27-inch", "Category": "Electronics", "Subcategory": "Accessories", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  '511 Slim Fit Jeans', '511-slim-fit-jeans-16', 'A versatile, comfortable piece designed to fit effortlessly into any wardrobe, made with quality materials that last. Trusted by thousands of customers for reliable, everyday performance.', 'A versatile, comfortable piece designed to fit effortlessly into any wardrobe, made with quality materials that last.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Men',
  'Adidas', 3999, 0, 3999.0, 4.7, 2456,
  80, 'Adidas Official Store', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Adidas", "Model": "511", "Category": "Fashion", "Subcategory": "Men", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Air Max 270 Sneakers', 'air-max-270-sneakers-17', 'Cushioned, breathable footwear built for comfort and performance, whether you''re running errands or running miles. Thoughtfully designed with attention to detail and everyday usability.', 'Cushioned, breathable footwear built for comfort and performance, whether you''re running errands or running miles.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Footwear',
  'Adidas', 3999, 25, 2999.25, 4.8, 2667,
  50, 'Cartify Retail', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Adidas", "Model": "Air", "Category": "Fashion", "Subcategory": "Footwear", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Ultraboost Light Running Shoes', 'ultraboost-light-running-shoes-18', 'Cushioned, breathable footwear built for comfort and performance, whether you''re running errands or running miles. Backed by a manufacturer warranty and easy returns through Cartify.', 'Cushioned, breathable footwear built for comfort and performance, whether you''re running errands or running miles.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Footwear',
  'Puma', 499, 10, 449.1, 4.7, 657,
  3, 'Puma Official Store', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Puma", "Model": "Ultraboost", "Category": "Fashion", "Subcategory": "Footwear", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Essential Cotton T-Shirt', 'essential-cotton-t-shirt-19', 'A versatile, comfortable piece designed to fit effortlessly into any wardrobe, made with quality materials that last. A best-seller in its category, loved for its quality and value.', 'A versatile, comfortable piece designed to fit effortlessly into any wardrobe, made with quality materials that last.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Men',
  'Adidas', 999, 35, 649.35, 4.2, 4515,
  5, 'Cartify Retail', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Adidas", "Model": "Essential", "Category": "Fashion", "Subcategory": "Men", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Floral Wrap Dress', 'floral-wrap-dress-20', 'A stylish, well-tailored piece crafted from breathable fabric, perfect for everyday wear or special occasions. A best-seller in its category, loved for its quality and value.', 'A stylish, well-tailored piece crafted from breathable fabric, perfect for everyday wear or special occasions.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Women',
  'Puma', 1499, 18, 1229.18, 4.9, 3071,
  50, 'Puma Official Store', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Puma", "Model": "Floral", "Category": "Fashion", "Subcategory": "Women", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Slim Fit Blazer', 'slim-fit-blazer-21', 'A versatile, comfortable piece designed to fit effortlessly into any wardrobe, made with quality materials that last. Backed by a manufacturer warranty and easy returns through Cartify.', 'A versatile, comfortable piece designed to fit effortlessly into any wardrobe, made with quality materials that last.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Men',
  'Puma', 1299, 0, 1299.0, 4.0, 4549,
  8, 'Puma Official Store', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Puma", "Model": "Slim", "Category": "Fashion", "Subcategory": "Men", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Chronograph Leather Watch', 'chronograph-leather-watch-22', 'A timeless timepiece combining precision engineering with a sleek design that pairs well with any outfit. Thoughtfully designed with attention to detail and everyday usability.', 'A timeless timepiece combining precision engineering with a sleek design that pairs well with any outfit.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Watches',
  'Levi''s', 1299, 0, 1299.0, 4.8, 2718,
  3, 'Levi''s Official Store', 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Levi''s", "Model": "Chronograph", "Category": "Fashion", "Subcategory": "Watches", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Neo Analog Sports Watch', 'neo-analog-sports-watch-23', 'A timeless timepiece combining precision engineering with a sleek design that pairs well with any outfit. A best-seller in its category, loved for its quality and value.', 'A timeless timepiece combining precision engineering with a sleek design that pairs well with any outfit.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Watches',
  'Fossil', 1299, 25, 974.25, 3.7, 4689,
  120, 'Fossil Official Store', 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Fossil", "Model": "Neo", "Category": "Fashion", "Subcategory": "Watches", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'High-Waist Skinny Jeans', 'high-waist-skinny-jeans-24', 'A stylish, well-tailored piece crafted from breathable fabric, perfect for everyday wear or special occasions. Backed by a manufacturer warranty and easy returns through Cartify.', 'A stylish, well-tailored piece crafted from breathable fabric, perfect for everyday wear or special occasions.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Women',
  'Puma', 799, 0, 799.0, 4.4, 2914,
  35, 'Puma Official Store', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Puma", "Model": "High-Waist", "Category": "Fashion", "Subcategory": "Women", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Classic Canvas Backpack', 'classic-canvas-backpack-25', 'A versatile, comfortable piece designed to fit effortlessly into any wardrobe, made with quality materials that last. A best-seller in its category, loved for its quality and value.', 'A versatile, comfortable piece designed to fit effortlessly into any wardrobe, made with quality materials that last.',
  (SELECT id FROM categories WHERE slug = 'fashion'), 'Men',
  'Nike', 499, 18, 409.18, 4.5, 907,
  8, 'Cartify Retail', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Nike", "Model": "Classic", "Category": "Fashion", "Subcategory": "Men", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Deluxe Non-Stick Cookware Set', 'deluxe-non-stick-cookware-set-26', 'A durable, easy-to-clean kitchen essential designed to make everyday cooking faster and more enjoyable. Backed by a manufacturer warranty and easy returns through Cartify.', 'A durable, easy-to-clean kitchen essential designed to make everyday cooking faster and more enjoyable.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Kitchen',
  'Milton', 999, 12, 879.12, 4.1, 629,
  50, 'Milton Official Store', 'https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Milton", "Model": "Deluxe", "Category": "Home & Kitchen", "Subcategory": "Kitchen", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Air Fryer 4.2L Digital', 'air-fryer-4.2l-digital-27', 'An energy-efficient appliance built with smart features to simplify your daily routine at home. A best-seller in its category, loved for its quality and value.', 'An energy-efficient appliance built with smart features to simplify your daily routine at home.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Appliances',
  'Butterfly', 9999, 0, 9999.0, 4.9, 1948,
  5, 'Butterfly Official Store', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Butterfly", "Model": "Air", "Category": "Home & Kitchen", "Subcategory": "Appliances", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Mixer Grinder 750W', 'mixer-grinder-750w-28', 'An energy-efficient appliance built with smart features to simplify your daily routine at home. A best-seller in its category, loved for its quality and value.', 'An energy-efficient appliance built with smart features to simplify your daily routine at home.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Appliances',
  'Milton', 499, 5, 474.05, 4.0, 3210,
  12, 'Milton Official Store', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Milton", "Model": "Mixer", "Category": "Home & Kitchen", "Subcategory": "Appliances", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Stainless Steel Insulated Bottle', 'stainless-steel-insulated-bottle-29', 'A durable, easy-to-clean kitchen essential designed to make everyday cooking faster and more enjoyable. Backed by a manufacturer warranty and easy returns through Cartify.', 'A durable, easy-to-clean kitchen essential designed to make everyday cooking faster and more enjoyable.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Kitchen',
  'Milton', 9999, 35, 6499.35, 4.5, 1280,
  8, 'Cartify Retail', 'https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Milton", "Model": "Stainless", "Category": "Home & Kitchen", "Subcategory": "Kitchen", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Ergonomic Office Chair', 'ergonomic-office-chair-30', 'Sturdy, well-designed furniture that blends comfort and style to elevate any room in your home. Trusted by thousands of customers for reliable, everyday performance.', 'Sturdy, well-designed furniture that blends comfort and style to elevate any room in your home.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Furniture',
  'Butterfly', 9999, 0, 9999.0, 4.5, 480,
  0, 'Butterfly Official Store', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Butterfly", "Model": "Ergonomic", "Category": "Home & Kitchen", "Subcategory": "Furniture", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  '3-Seater Fabric Sofa', '3-seater-fabric-sofa-31', 'Sturdy, well-designed furniture that blends comfort and style to elevate any room in your home. Trusted by thousands of customers for reliable, everyday performance.', 'Sturdy, well-designed furniture that blends comfort and style to elevate any room in your home.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Furniture',
  'Bajaj', 799, 5, 759.05, 3.6, 568,
  8, 'Bajaj Official Store', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Bajaj", "Model": "3-Seater", "Category": "Home & Kitchen", "Subcategory": "Furniture", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Ceramic Dinner Set 24-Piece', 'ceramic-dinner-set-24-piece-32', 'A durable, easy-to-clean kitchen essential designed to make everyday cooking faster and more enjoyable. Thoughtfully designed with attention to detail and everyday usability.', 'A durable, easy-to-clean kitchen essential designed to make everyday cooking faster and more enjoyable.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Kitchen',
  'Bajaj', 499, 30, 349.3, 3.6, 4793,
  120, 'Bajaj Official Store', 'https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Bajaj", "Model": "Ceramic", "Category": "Home & Kitchen", "Subcategory": "Kitchen", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Compact Microwave Oven 20L', 'compact-microwave-oven-20l-33', 'An energy-efficient appliance built with smart features to simplify your daily routine at home. Backed by a manufacturer warranty and easy returns through Cartify.', 'An energy-efficient appliance built with smart features to simplify your daily routine at home.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Appliances',
  'Butterfly', 3999, 10, 3599.1, 3.9, 1084,
  12, 'Butterfly Official Store', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Butterfly", "Model": "Compact", "Category": "Home & Kitchen", "Subcategory": "Appliances", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Wooden Study Table', 'wooden-study-table-34', 'Sturdy, well-designed furniture that blends comfort and style to elevate any room in your home. Thoughtfully designed with attention to detail and everyday usability.', 'Sturdy, well-designed furniture that blends comfort and style to elevate any room in your home.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Furniture',
  'Milton', 14999, 30, 10499.3, 4.9, 612,
  80, 'Cartify Retail', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Milton", "Model": "Wooden", "Category": "Home & Kitchen", "Subcategory": "Furniture", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Electric Kettle 1.5L', 'electric-kettle-1.5l-35', 'An energy-efficient appliance built with smart features to simplify your daily routine at home. Thoughtfully designed with attention to detail and everyday usability.', 'An energy-efficient appliance built with smart features to simplify your daily routine at home.',
  (SELECT id FROM categories WHERE slug = 'home-kitchen'), 'Appliances',
  'IKEA', 799, 10, 719.1, 4.0, 1304,
  50, 'IKEA Official Store', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "IKEA", "Model": "Electric", "Category": "Home & Kitchen", "Subcategory": "Appliances", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Atomic Habits', 'atomic-habits-36', 'A thought-provoking, well-researched read that offers practical insight you can apply to everyday life. Backed by a manufacturer warranty and easy returns through Cartify.', 'A thought-provoking, well-researched read that offers practical insight you can apply to everyday life.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Non-Fiction',
  'Penguin', 499, 25, 374.25, 3.9, 860,
  5, 'Cartify Retail', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1521056787327-b0fe7cba9f43?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Penguin", "Model": "Atomic", "Category": "Books", "Subcategory": "Non-Fiction", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'The Silent Patient', 'the-silent-patient-37', 'A gripping, beautifully written story that keeps you turning pages long after you meant to stop. Thoughtfully designed with attention to detail and everyday usability.', 'A gripping, beautifully written story that keeps you turning pages long after you meant to stop.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Fiction',
  'HarperCollins', 299, 12, 263.12, 4.3, 2820,
  8, 'HarperCollins Official Store', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "HarperCollins", "Model": "The", "Category": "Books", "Subcategory": "Fiction", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Sapiens: A Brief History of Humankind', 'sapiens-a-brief-history-of-humankind-38', 'A thought-provoking, well-researched read that offers practical insight you can apply to everyday life. Thoughtfully designed with attention to detail and everyday usability.', 'A thought-provoking, well-researched read that offers practical insight you can apply to everyday life.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Non-Fiction',
  'Scholastic', 299, 0, 299.0, 3.6, 3481,
  12, 'Cartify Retail', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1521056787327-b0fe7cba9f43?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Scholastic", "Model": "Sapiens:", "Category": "Books", "Subcategory": "Non-Fiction", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Introduction to Algorithms', 'introduction-to-algorithms-39', 'A comprehensive reference text widely used by students and professionals to build strong foundational knowledge. Backed by a manufacturer warranty and easy returns through Cartify.', 'A comprehensive reference text widely used by students and professionals to build strong foundational knowledge.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Academic',
  'Bloomsbury', 249, 40, 149.4, 4.1, 3515,
  80, 'Cartify Retail', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Bloomsbury", "Model": "Introduction", "Category": "Books", "Subcategory": "Academic", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'The Midnight Library', 'the-midnight-library-40', 'A gripping, beautifully written story that keeps you turning pages long after you meant to stop. Trusted by thousands of customers for reliable, everyday performance.', 'A gripping, beautifully written story that keeps you turning pages long after you meant to stop.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Fiction',
  'HarperCollins', 399, 0, 399.0, 4.7, 4783,
  80, 'Cartify Retail', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "HarperCollins", "Model": "The", "Category": "Books", "Subcategory": "Fiction", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Deep Work', 'deep-work-41', 'A thought-provoking, well-researched read that offers practical insight you can apply to everyday life. Thoughtfully designed with attention to detail and everyday usability.', 'A thought-provoking, well-researched read that offers practical insight you can apply to everyday life.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Non-Fiction',
  'Bloomsbury', 299, 0, 299.0, 4.8, 1732,
  8, 'Bloomsbury Official Store', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1521056787327-b0fe7cba9f43?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Bloomsbury", "Model": "Deep", "Category": "Books", "Subcategory": "Non-Fiction", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Clean Code', 'clean-code-42', 'A comprehensive reference text widely used by students and professionals to build strong foundational knowledge. Trusted by thousands of customers for reliable, everyday performance.', 'A comprehensive reference text widely used by students and professionals to build strong foundational knowledge.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Academic',
  'Scholastic', 399, 40, 239.4, 3.7, 1951,
  5, 'Scholastic Official Store', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Scholastic", "Model": "Clean", "Category": "Books", "Subcategory": "Academic", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Ikigai: The Japanese Secret', 'ikigai-the-japanese-secret-43', 'A thought-provoking, well-researched read that offers practical insight you can apply to everyday life. Backed by a manufacturer warranty and easy returns through Cartify.', 'A thought-provoking, well-researched read that offers practical insight you can apply to everyday life.',
  (SELECT id FROM categories WHERE slug = 'books'), 'Non-Fiction',
  'Penguin', 249, 40, 149.4, 4.8, 3384,
  8, 'Cartify Retail', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1521056787327-b0fe7cba9f43?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Penguin", "Model": "Ikigai:", "Category": "Books", "Subcategory": "Non-Fiction", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Vitamin C Brightening Serum', 'vitamin-c-brightening-serum-44', 'A dermatologically tested formula that nourishes and protects your skin with visible results over time. Trusted by thousands of customers for reliable, everyday performance.', 'A dermatologically tested formula that nourishes and protects your skin with visible results over time.',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Skincare',
  'Nivea', 1199, 10, 1079.1, 3.8, 3782,
  20, 'Cartify Retail', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Nivea", "Model": "Vitamin", "Category": "Beauty", "Subcategory": "Skincare", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Argan Oil Hair Mask', 'argan-oil-hair-mask-45', 'A nourishing formula that strengthens and revitalizes hair from root to tip, suited for daily use. A best-seller in its category, loved for its quality and value.', 'A nourishing formula that strengthens and revitalizes hair from root to tip, suited for daily use.',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Haircare',
  'Nivea', 399, 18, 327.18, 4.0, 580,
  12, 'Cartify Retail', 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1585232004423-fbb0e1442a13?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Nivea", "Model": "Argan", "Category": "Beauty", "Subcategory": "Haircare", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Matte Finish Sunscreen SPF 50', 'matte-finish-sunscreen-spf-50-46', 'A dermatologically tested formula that nourishes and protects your skin with visible results over time. Thoughtfully designed with attention to detail and everyday usability.', 'A dermatologically tested formula that nourishes and protects your skin with visible results over time.',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Skincare',
  'The Ordinary', 699, 0, 699.0, 3.7, 2151,
  5, 'The Ordinary Official Store', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "The Ordinary", "Model": "Matte", "Category": "Beauty", "Subcategory": "Skincare", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Charcoal Face Wash', 'charcoal-face-wash-47', 'A dermatologically tested formula that nourishes and protects your skin with visible results over time. Backed by a manufacturer warranty and easy returns through Cartify.', 'A dermatologically tested formula that nourishes and protects your skin with visible results over time.',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Skincare',
  'Nivea', 899, 15, 764.15, 4.5, 2581,
  35, 'Nivea Official Store', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Nivea", "Model": "Charcoal", "Category": "Beauty", "Subcategory": "Skincare", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Rechargeable Trimmer', 'rechargeable-trimmer-48', 'A precision-engineered grooming tool designed for comfort, control and consistent results. Trusted by thousands of customers for reliable, everyday performance.', 'A precision-engineered grooming tool designed for comfort, control and consistent results.',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Grooming',
  'The Ordinary', 399, 12, 351.12, 3.6, 3584,
  0, 'The Ordinary Official Store', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "The Ordinary", "Model": "Rechargeable", "Category": "Beauty", "Subcategory": "Grooming", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Keratin Smooth Shampoo', 'keratin-smooth-shampoo-49', 'A nourishing formula that strengthens and revitalizes hair from root to tip, suited for daily use. Thoughtfully designed with attention to detail and everyday usability.', 'A nourishing formula that strengthens and revitalizes hair from root to tip, suited for daily use.',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Haircare',
  'Lakme', 199, 35, 129.35, 4.8, 2583,
  3, 'Lakme Official Store', 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1585232004423-fbb0e1442a13?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Lakme", "Model": "Keratin", "Category": "Beauty", "Subcategory": "Haircare", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Hyaluronic Acid Moisturizer', 'hyaluronic-acid-moisturizer-50', 'A dermatologically tested formula that nourishes and protects your skin with visible results over time. A best-seller in its category, loved for its quality and value.', 'A dermatologically tested formula that nourishes and protects your skin with visible results over time.',
  (SELECT id FROM categories WHERE slug = 'beauty'), 'Skincare',
  'Mamaearth', 899, 15, 764.15, 4.1, 2434,
  80, 'Cartify Retail', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Mamaearth", "Model": "Hyaluronic", "Category": "Beauty", "Subcategory": "Skincare", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Yoga Mat 6mm Anti-Slip', 'yoga-mat-6mm-anti-slip-51', 'Durable fitness gear designed to support your training routine, from warm-up to cool-down. Thoughtfully designed with attention to detail and everyday usability.', 'Durable fitness gear designed to support your training routine, from warm-up to cool-down.',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Fitness',
  'Yonex', 999, 30, 699.3, 4.3, 3338,
  80, 'Yonex Official Store', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Yonex", "Model": "Yoga", "Category": "Sports", "Subcategory": "Fitness", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Adjustable Dumbbell Set 20kg', 'adjustable-dumbbell-set-20kg-52', 'Durable fitness gear designed to support your training routine, from warm-up to cool-down. Trusted by thousands of customers for reliable, everyday performance.', 'Durable fitness gear designed to support your training routine, from warm-up to cool-down.',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Fitness',
  'Adidas', 3999, 30, 2799.3, 4.3, 2651,
  50, 'Adidas Official Store', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Adidas", "Model": "Adjustable", "Category": "Sports", "Subcategory": "Fitness", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Badminton Racket Carbon Fiber', 'badminton-racket-carbon-fiber-53', 'Professional-grade sports equipment designed for durability and consistent performance on the field or court. Trusted by thousands of customers for reliable, everyday performance.', 'Professional-grade sports equipment designed for durability and consistent performance on the field or court.',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Team Sports',
  'Yonex', 999, 35, 649.35, 3.6, 4234,
  120, 'Cartify Retail', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1593766827228-8737b4534aa6?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Yonex", "Model": "Badminton", "Category": "Sports", "Subcategory": "Team Sports", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Trekking Backpack 50L', 'trekking-backpack-50l-54', 'Rugged, weather-resistant gear built to handle the outdoors without compromising on comfort. Backed by a manufacturer warranty and easy returns through Cartify.', 'Rugged, weather-resistant gear built to handle the outdoors without compromising on comfort.',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Outdoor',
  'Decathlon', 1499, 10, 1349.1, 3.7, 390,
  8, 'Decathlon Official Store', 'https://images.unsplash.com/photo-1533692328991-08159ff19fca?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1533692328991-08159ff19fca?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Decathlon", "Model": "Trekking", "Category": "Sports", "Subcategory": "Outdoor", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Football Size 5', 'football-size-5-55', 'Professional-grade sports equipment designed for durability and consistent performance on the field or court. Backed by a manufacturer warranty and easy returns through Cartify.', 'Professional-grade sports equipment designed for durability and consistent performance on the field or court.',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Team Sports',
  'Yonex', 1499, 40, 899.4, 4.5, 4061,
  35, 'Cartify Retail', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1593766827228-8737b4534aa6?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Yonex", "Model": "Football", "Category": "Sports", "Subcategory": "Team Sports", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Resistance Bands Set', 'resistance-bands-set-56', 'Durable fitness gear designed to support your training routine, from warm-up to cool-down. Trusted by thousands of customers for reliable, everyday performance.', 'Durable fitness gear designed to support your training routine, from warm-up to cool-down.',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Fitness',
  'Yonex', 1499, 5, 1424.05, 4.6, 4255,
  50, 'Cartify Retail', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Yonex", "Model": "Resistance", "Category": "Sports", "Subcategory": "Fitness", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Cricket Bat English Willow', 'cricket-bat-english-willow-57', 'Professional-grade sports equipment designed for durability and consistent performance on the field or court. A best-seller in its category, loved for its quality and value.', 'Professional-grade sports equipment designed for durability and consistent performance on the field or court.',
  (SELECT id FROM categories WHERE slug = 'sports'), 'Team Sports',
  'Yonex', 999, 20, 799.2, 4.4, 4590,
  120, 'Cartify Retail', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1593766827228-8737b4534aa6?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Yonex", "Model": "Cricket", "Category": "Sports", "Subcategory": "Team Sports", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Organic Basmati Rice 5kg', 'organic-basmati-rice-5kg-58', 'A pantry staple sourced for quality and freshness, perfect for everyday home cooking. Trusted by thousands of customers for reliable, everyday performance.', 'A pantry staple sourced for quality and freshness, perfect for everyday home cooking.',
  (SELECT id FROM categories WHERE slug = 'grocery'), 'Pantry',
  'Haldiram''s', 249, 25, 186.75, 4.1, 1315,
  50, 'Haldiram''s Official Store', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1560788504-a5a9d477952a?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Haldiram''s", "Model": "Organic", "Category": "Grocery", "Subcategory": "Pantry", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Cold Pressed Groundnut Oil 1L', 'cold-pressed-groundnut-oil-1l-59', 'A pantry staple sourced for quality and freshness, perfect for everyday home cooking. Thoughtfully designed with attention to detail and everyday usability.', 'A pantry staple sourced for quality and freshness, perfect for everyday home cooking.',
  (SELECT id FROM categories WHERE slug = 'grocery'), 'Pantry',
  'Britannia', 499, 25, 374.25, 4.2, 1971,
  12, 'Britannia Official Store', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1560788504-a5a9d477952a?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Britannia", "Model": "Cold", "Category": "Grocery", "Subcategory": "Pantry", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Assorted Namkeen Combo Pack', 'assorted-namkeen-combo-pack-60', 'A satisfying snack made with quality ingredients, perfect for sharing or enjoying on the go. A best-seller in its category, loved for its quality and value.', 'A satisfying snack made with quality ingredients, perfect for sharing or enjoying on the go.',
  (SELECT id FROM categories WHERE slug = 'grocery'), 'Snacks',
  'Britannia', 199, 15, 169.15, 4.8, 672,
  5, 'Cartify Retail', 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1621447504864-d8686f12c84a?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Britannia", "Model": "Assorted", "Category": "Grocery", "Subcategory": "Snacks", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Instant Coffee Premix Jar', 'instant-coffee-premix-jar-61', 'A refreshing, carefully sourced beverage that fits effortlessly into your daily routine. A best-seller in its category, loved for its quality and value.', 'A refreshing, carefully sourced beverage that fits effortlessly into your daily routine.',
  (SELECT id FROM categories WHERE slug = 'grocery'), 'Beverages',
  'Nestle', 399, 10, 359.1, 3.6, 3351,
  20, 'Nestle Official Store', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Nestle", "Model": "Instant", "Category": "Grocery", "Subcategory": "Beverages", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Whole Wheat Atta 10kg', 'whole-wheat-atta-10kg-62', 'A pantry staple sourced for quality and freshness, perfect for everyday home cooking. A best-seller in its category, loved for its quality and value.', 'A pantry staple sourced for quality and freshness, perfect for everyday home cooking.',
  (SELECT id FROM categories WHERE slug = 'grocery'), 'Pantry',
  'Nestle', 499, 18, 409.18, 4.0, 4796,
  0, 'Nestle Official Store', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1560788504-a5a9d477952a?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Nestle", "Model": "Whole", "Category": "Grocery", "Subcategory": "Pantry", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Green Tea Bags Pack of 100', 'green-tea-bags-pack-of-100-63', 'A refreshing, carefully sourced beverage that fits effortlessly into your daily routine. Trusted by thousands of customers for reliable, everyday performance.', 'A refreshing, carefully sourced beverage that fits effortlessly into your daily routine.',
  (SELECT id FROM categories WHERE slug = 'grocery'), 'Beverages',
  'Tata', 199, 12, 175.12, 4.6, 3444,
  80, 'Tata Official Store', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Tata", "Model": "Green", "Category": "Grocery", "Subcategory": "Beverages", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'PlayStation 5 Console', 'playstation-5-console-64', 'Next-generation gaming console delivering stunning visuals, fast load times and an expansive game library. A best-seller in its category, loved for its quality and value.', 'Next-generation gaming console delivering stunning visuals, fast load times and an expansive game library.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Consoles',
  'Microsoft', 9999, 18, 8199.18, 4.2, 3197,
  20, 'Microsoft Official Store', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Microsoft", "Model": "PlayStation", "Category": "Gaming", "Subcategory": "Consoles", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Xbox Series X Console', 'xbox-series-x-console-65', 'Next-generation gaming console delivering stunning visuals, fast load times and an expansive game library. Backed by a manufacturer warranty and easy returns through Cartify.', 'Next-generation gaming console delivering stunning visuals, fast load times and an expansive game library.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Consoles',
  'Microsoft', 39999, 5, 37999.05, 4.9, 4387,
  0, 'Microsoft Official Store', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Microsoft", "Model": "Xbox", "Category": "Gaming", "Subcategory": "Consoles", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'DualSense Wireless Controller', 'dualsense-wireless-controller-66', 'Precision gaming accessory engineered for competitive play, with a comfortable design for long sessions. A best-seller in its category, loved for its quality and value.', 'Precision gaming accessory engineered for competitive play, with a comfortable design for long sessions.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Gaming Accessories',
  'Razer', 4999, 20, 3999.2, 3.8, 2143,
  35, 'Cartify Retail', 'https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1615680022647-99c397cbcaea?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1600861195091-690c92f1d2cb?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Razer", "Model": "DualSense", "Category": "Gaming", "Subcategory": "Gaming Accessories", "Warranty": "1 Year"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Mechanical RGB Gaming Keyboard', 'mechanical-rgb-gaming-keyboard-67', 'High-performance PC gaming gear built for speed, accuracy and durability during intense sessions. A best-seller in its category, loved for its quality and value.', 'High-performance PC gaming gear built for speed, accuracy and durability during intense sessions.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'PC Gaming',
  'Logitech', 24999, 12, 21999.12, 4.6, 3465,
  12, 'Logitech Official Store', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Logitech", "Model": "Mechanical", "Category": "Gaming", "Subcategory": "PC Gaming", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Pro Gaming Headset with Mic', 'pro-gaming-headset-with-mic-68', 'Precision gaming accessory engineered for competitive play, with a comfortable design for long sessions. Trusted by thousands of customers for reliable, everyday performance.', 'Precision gaming accessory engineered for competitive play, with a comfortable design for long sessions.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Gaming Accessories',
  'HyperX', 1999, 15, 1699.15, 3.8, 574,
  0, 'HyperX Official Store', 'https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1615680022647-99c397cbcaea?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1600861195091-690c92f1d2cb?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "HyperX", "Model": "Pro", "Category": "Gaming", "Subcategory": "Gaming Accessories", "Warranty": "6 Months"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Gaming Mouse 16000 DPI', 'gaming-mouse-16000-dpi-69', 'High-performance PC gaming gear built for speed, accuracy and durability during intense sessions. A best-seller in its category, loved for its quality and value.', 'High-performance PC gaming gear built for speed, accuracy and durability during intense sessions.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'PC Gaming',
  'Sony', 4999, 10, 4499.1, 3.7, 949,
  120, 'Sony Official Store', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Sony", "Model": "Gaming", "Category": "Gaming", "Subcategory": "PC Gaming", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
INSERT INTO products (
  name, slug, description, short_description, category_id, subcategory,
  brand, price, discount_percentage, final_price, rating, review_count,
  stock_quantity, seller_name, main_image, images, specifications
) VALUES (
  'Nintendo Switch OLED', 'nintendo-switch-oled-70', 'Next-generation gaming console delivering stunning visuals, fast load times and an expansive game library. Backed by a manufacturer warranty and easy returns through Cartify.', 'Next-generation gaming console delivering stunning visuals, fast load times and an expansive game library.',
  (SELECT id FROM categories WHERE slug = 'gaming'), 'Consoles',
  'Logitech', 14999, 5, 14249.05, 4.3, 950,
  5, 'Logitech Official Store', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop&auto=format&q=75', '["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=600&h=600&fit=crop&auto=format&q=75", "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop&auto=format&q=75"]'::jsonb, '{"Brand": "Logitech", "Model": "Nintendo", "Category": "Gaming", "Subcategory": "Consoles", "Warranty": "2 Years"}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Karan Malhotra', 5, 'Packaging was excellent and the product arrived in perfect condition.' FROM products WHERE slug = 'galaxy-s23-ultra-smartphone-1';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Vikram Rao', 5, 'Decent product for the price, does the job well.' FROM products WHERE slug = 'galaxy-s23-ultra-smartphone-1';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Priya Nair', 5, 'Packaging was excellent and the product arrived in perfect condition.' FROM products WHERE slug = 'iphone-15-pro-2';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Sneha Kulkarni', 5, 'Great value for money, works exactly as described.' FROM products WHERE slug = 'iphone-15-pro-2';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Neha Gupta', 5, 'Great value for money, works exactly as described.' FROM products WHERE slug = 'oneplus-12r-5g-smartphone-3';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Aarav Mehta', 5, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = 'oneplus-12r-5g-smartphone-3';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Vikram Rao', 4, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = 'oneplus-12r-5g-smartphone-3';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Aditya Kapoor', 4, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = 'macbook-air-m2-13-inch-4';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Aarav Mehta', 4, 'Decent product for the price, does the job well.' FROM products WHERE slug = 'macbook-air-m2-13-inch-4';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Vikram Rao', 5, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = 'inspiron-15-laptop-5';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ishita Sharma', 3, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = 'inspiron-15-laptop-5';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Rohan Verma', 5, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = 'pavilion-14-laptop-6';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Karan Malhotra', 5, 'Packaging was excellent and the product arrived in perfect condition.' FROM products WHERE slug = 'pavilion-14-laptop-6';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ishita Sharma', 4, 'Decent product for the price, does the job well.' FROM products WHERE slug = 'pavilion-14-laptop-6';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Neha Gupta', 4, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = 'wh-1000xm5-wireless-headphones-7';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Sneha Kulkarni', 4, 'Great value for money, works exactly as described.' FROM products WHERE slug = 'wh-1000xm5-wireless-headphones-7';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ishita Sharma', 4, 'Good quality but delivery took longer than expected.' FROM products WHERE slug = 'wh-1000xm5-wireless-headphones-7';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Neha Gupta', 5, 'Packaging was excellent and the product arrived in perfect condition.' FROM products WHERE slug = 'wh-1000xm5-wireless-headphones-7';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ananya Iyer', 4, 'Great value for money, works exactly as described.' FROM products WHERE slug = 'rockerz-450-bluetooth-headphones-8';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ananya Iyer', 4, 'Good quality but delivery took longer than expected.' FROM products WHERE slug = 'rockerz-450-bluetooth-headphones-8';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Sneha Kulkarni', 4, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = 'rockerz-450-bluetooth-headphones-8';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Karan Malhotra', 5, 'Packaging was excellent and the product arrived in perfect condition.' FROM products WHERE slug = 'tune-510bt-wireless-headphones-9';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Karan Malhotra', 3, 'Packaging was excellent and the product arrived in perfect condition.' FROM products WHERE slug = 'tune-510bt-wireless-headphones-9';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Aditya Kapoor', 3, 'Good quality but delivery took longer than expected.' FROM products WHERE slug = 'tune-510bt-wireless-headphones-9';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Vikram Rao', 5, 'Decent product for the price, does the job well.' FROM products WHERE slug = 'eos-r50-mirrorless-camera-10';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Sneha Kulkarni', 4, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = 'eos-r50-mirrorless-camera-10';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ishita Sharma', 3, 'Decent product for the price, does the job well.' FROM products WHERE slug = 'powershot-g7x-digital-camera-11';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Priya Nair', 3, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = 'powershot-g7x-digital-camera-11';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Vikram Rao', 3, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = 'powershot-g7x-digital-camera-11';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Karan Malhotra', 5, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = 'powershot-g7x-digital-camera-11';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ishita Sharma', 5, 'Packaging was excellent and the product arrived in perfect condition.' FROM products WHERE slug = 'mx-master-3s-wireless-mouse-12';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ananya Iyer', 5, 'Decent product for the price, does the job well.' FROM products WHERE slug = 'mx-master-3s-wireless-mouse-12';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Aditya Kapoor', 4, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = 'mx-master-3s-wireless-mouse-12';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ishita Sharma', 4, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = 'k380-multi-device-keyboard-13';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Karan Malhotra', 3, 'Good quality but delivery took longer than expected.' FROM products WHERE slug = 'k380-multi-device-keyboard-13';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Sneha Kulkarni', 3, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = 'k380-multi-device-keyboard-13';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Aditya Kapoor', 3, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = 'k380-multi-device-keyboard-13';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Sneha Kulkarni', 4, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = '45w-usb-c-fast-charger-14';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Karan Malhotra', 5, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = '45w-usb-c-fast-charger-14';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Neha Gupta', 3, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = '27-inch-4k-uhd-monitor-15';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Sneha Kulkarni', 3, 'Exceeded my expectations, would definitely buy again.' FROM products WHERE slug = '27-inch-4k-uhd-monitor-15';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Ananya Iyer', 4, 'Good quality but delivery took longer than expected.' FROM products WHERE slug = '27-inch-4k-uhd-monitor-15';
INSERT INTO reviews (product_id, reviewer_name, rating, review_text)
SELECT id, 'Aarav Mehta', 5, 'Works well so far, will update after a few months of use.' FROM products WHERE slug = '27-inch-4k-uhd-monitor-15';
