-- ==============================================================================
-- CARTIFY DATA WAREHOUSE & STAR SCHEMA SPECIFICATION (PostgreSQL)
-- Section 1: OLAP Foundation & Multi-Dimensional Fact/Dimension Modeling
-- Academic Course: Data Warehouse & Data Mining (DWM)
-- ==============================================================================

-- 1. DIMENSION TABLE: dim_time
-- Granularity: Daily calendar dimension with rich temporal attributes for Roll-Up / Drill-Down
DROP TABLE IF EXISTS dim_time CASCADE;
CREATE TABLE dim_time (
    time_id INT PRIMARY KEY,                       -- Format: YYYYMMDD (e.g. 20260924)
    full_date DATE UNIQUE NOT NULL,
    year INT NOT NULL,
    quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    quarter_name VARCHAR(10) NOT NULL,             -- 'Q1', 'Q2', 'Q3', 'Q4'
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    month_name VARCHAR(20) NOT NULL,               -- 'January', 'February', ...
    month_short_name VARCHAR(3) NOT NULL,          -- 'Jan', 'Feb', ...
    week_of_year INT NOT NULL CHECK (week_of_year BETWEEN 1 AND 53),
    day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Sun, 7=Sat (or ISO standard)
    day_name VARCHAR(20) NOT NULL,                 -- 'Monday', 'Tuesday', ...
    day_short_name VARCHAR(3) NOT NULL,            -- 'Mon', 'Tue', ...
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX idx_dim_time_year_month ON dim_time(year, month);
CREATE INDEX idx_dim_time_quarter ON dim_time(year, quarter);
CREATE INDEX idx_dim_time_full_date ON dim_time(full_date);

-- 2. DIMENSION TABLE: dim_product
-- Granularity: Product entity with denormalized category hierarchy and price/rating tiers
DROP TABLE IF EXISTS dim_product CASCADE;
CREATE TABLE dim_product (
    product_id BIGINT PRIMARY KEY,                 -- References operational products.id
    title VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category_id INT NOT NULL,
    category_name VARCHAR(80) NOT NULL,
    subcategory VARCHAR(100),
    price NUMERIC(10, 2) NOT NULL,
    price_tier VARCHAR(30) NOT NULL,               -- 'BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY'
    rating NUMERIC(3, 2),
    rating_tier VARCHAR(30) NOT NULL,              -- 'EXCELLENT', 'GOOD', 'AVERAGE', 'LOW', 'UNRATED'
    review_count INT DEFAULT 0 NOT NULL,
    stock_quantity INT DEFAULT 0 NOT NULL,
    verification_status VARCHAR(30) DEFAULT 'VERIFIED' NOT NULL,
    source VARCHAR(50) DEFAULT 'cartify' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_dim_product_category ON dim_product(category_id, category_name);
CREATE INDEX idx_dim_product_brand ON dim_product(brand);
CREATE INDEX idx_dim_product_price_tier ON dim_product(price_tier);
CREATE INDEX idx_dim_product_rating_tier ON dim_product(rating_tier);

-- 3. DIMENSION TABLE: dim_customer
-- Granularity: Customer profile with derived behavioral activity tiers and tenure metrics
DROP TABLE IF EXISTS dim_customer CASCADE;
CREATE TABLE dim_customer (
    customer_id BIGINT PRIMARY KEY,                -- References operational users.id
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL,
    account_age_days INT NOT NULL,
    activity_tier VARCHAR(30) NOT NULL,            -- 'POWER_BUYER', 'REGULAR', 'OCCASIONAL', 'INACTIVE'
    total_orders_count INT DEFAULT 0 NOT NULL,
    total_spend NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    last_order_date TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_dim_customer_activity_tier ON dim_customer(activity_tier);
CREATE INDEX idx_dim_customer_state_city ON dim_customer(state, city);

-- 4. FACT TABLE: fact_sales
-- Granularity: Individual item line per order (Atomic Sales Fact)
DROP TABLE IF EXISTS fact_sales CASCADE;
CREATE TABLE fact_sales (
    fact_id BIGSERIAL PRIMARY KEY,
    time_id INT REFERENCES dim_time(time_id) ON DELETE RESTRICT NOT NULL,
    product_id BIGINT REFERENCES dim_product(product_id) ON DELETE CASCADE NOT NULL,
    customer_id BIGINT REFERENCES dim_customer(customer_id) ON DELETE SET NULL,
    order_id BIGINT NOT NULL,
    order_item_id BIGINT,
    quantity_sold INT NOT NULL CHECK (quantity_sold > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    total_revenue NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    net_revenue NUMERIC(10, 2) NOT NULL,
    order_status VARCHAR(50) DEFAULT 'DELIVERED' NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'SIMULATED_GATEWAY' NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_fact_sales_item UNIQUE (order_id, product_id, order_item_id)
);

CREATE INDEX idx_fact_sales_time ON fact_sales(time_id);
CREATE INDEX idx_fact_sales_product ON fact_sales(product_id);
CREATE INDEX idx_fact_sales_customer ON fact_sales(customer_id);
CREATE INDEX idx_fact_sales_order ON fact_sales(order_id);
CREATE INDEX idx_fact_sales_composite ON fact_sales(time_id, product_id, customer_id);

-- 5. FACT TABLE: fact_interaction_daily
-- Granularity: Daily pre-aggregated telemetry events per product & category
DROP TABLE IF EXISTS fact_interaction_daily CASCADE;
CREATE TABLE fact_interaction_daily (
    fact_id BIGSERIAL PRIMARY KEY,
    time_id INT REFERENCES dim_time(time_id) ON DELETE RESTRICT NOT NULL,
    product_id BIGINT REFERENCES dim_product(product_id) ON DELETE CASCADE NOT NULL,
    category_id INT NOT NULL,
    view_count INT DEFAULT 0 NOT NULL,
    search_count INT DEFAULT 0 NOT NULL,
    cart_count INT DEFAULT 0 NOT NULL,
    wishlist_count INT DEFAULT 0 NOT NULL,
    purchase_count INT DEFAULT 0 NOT NULL,
    total_interactions INT DEFAULT 0 NOT NULL,
    unique_users_count INT DEFAULT 0 NOT NULL,
    unique_sessions_count INT DEFAULT 0 NOT NULL,
    aggregated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_fact_interaction_daily UNIQUE (time_id, product_id)
);

CREATE INDEX idx_fact_int_time ON fact_interaction_daily(time_id);
CREATE INDEX idx_fact_int_product ON fact_interaction_daily(product_id);
CREATE INDEX idx_fact_int_category ON fact_interaction_daily(category_id);

-- 6. ETL AUDIT & LINEAGE TABLE: etl_job_runs
-- Tracks each execution of the ETL pipeline with extracted/transformed/loaded counts
DROP TABLE IF EXISTS etl_job_runs CASCADE;
CREATE TABLE etl_job_runs (
    job_id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    records_extracted INT DEFAULT 0 NOT NULL,
    records_transformed INT DEFAULT 0 NOT NULL,
    records_loaded INT DEFAULT 0 NOT NULL,
    execution_time_ms INT DEFAULT 0 NOT NULL,
    status VARCHAR(30) DEFAULT 'SUCCESS' NOT NULL, -- 'SUCCESS', 'FAILED', 'PARTIAL'
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_etl_job_runs_name_time ON etl_job_runs(job_name, started_at DESC);
