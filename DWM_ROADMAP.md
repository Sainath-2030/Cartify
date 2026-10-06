# Cartify: Data Warehouse & Data Mining (DWM) Roadmap & Project Guide

> **Academic Course Reference:** Data Warehouse and Data Mining (DWM)  
> **Project Title:** Cartify — Enterprise E-Commerce Platform with Dual OLTP/OLAP Architecture, Neural Data Mining & Executive BI Dashboard  
> **Repository:** `Sainath-2030/Cartify`  
> **Target Audience:** College Professor / Project Evaluators / Technical Reviewers  
> **Status:** Active Reference & Step-by-Step Implementation Guide

---

## 1. Executive Summary & Dual Architecture

Cartify is designed not merely as a commercial storefront, but as an **Enterprise Dual-Layer System** that bridges operational e-commerce transactions (**OLTP**) with analytical decision support and knowledge discovery (**OLAP & Data Mining**).

```
                      +---------------------------------------+
                      |           CARTIFY STOREFRONT          |
                      |   (Customer Browsing, Cart, Orders)   |
                      +-------------------+-------------------+
                                          |
                        OLTP Transaction  | Event Telemetry
                        & State Changes   | (Clicks, Views, Carts)
                                          v
                      +---------------------------------------+
                      |        OPERATIONAL DATABASE (OLTP)    |
                      |   PostgreSQL 16 Normalized 3NF Schema  |
                      |   (users, products, orders, items)    |
                      +-------------------+-------------------+
                                          |
                      +-------------------+-------------------+
                      |   ETL PIPELINE / DATA PREPROCESSING   |
                      |   - Null Imputation & Cleaning        |
                      |   - Feature Extraction & Rescaling    |
                      |   - Denormalization into Star Schema  |
                      +-------------------+-------------------+
                                          |
         +--------------------------------+--------------------------------+
         |                                                                 |
         v                                                                 v
+---------------------------------+             +----------------------------------+
|      DATA MINING SUBSYSTEM      |             |     DATA WAREHOUSE & OLAP CUBE   |
|  - Collaborative Filtering(NCF) |             |  - Fact & Dimension Tables       |
|  - Sequential Mining (GRU)      |             |  - Multi-Dimensional Aggregations|
|  - Content Embeddings (CNN)     |             |  - Slicing, Dicing, Drill-Down   |
|  - Association Rules (Apriori)  |             |  - RFM Customer Clusters         |
+----------------+----------------+             +-----------------+----------------+
                 |                                                |
                 +-----------------------+------------------------+
                                         |
                                         v
                      +---------------------------------------+
                      |       EXECUTIVE BI & ADMIN CONSOLE    |
                      |   - Real-Time Model Telemetry & Bench  |
                      |   - Catalogue Health & Quality Audits |
                      |   - Market Basket Cross-Selling UI    |
                      |   - Multi-Dimensional OLAP Visualizer |
                      +---------------------------------------+
```

---

## 2. DWM Topics Already Implemented in Cartify

The following topics from the standard academic Data Warehouse & Data Mining curriculum are already coded and operational:

| DWM Academic Topic | Implementation in Cartify | Technical Verification / Source Code |
| :--- | :--- | :--- |
| **1. Data Preprocessing & Data Cleaning** | Automated catalogue health diagnostics: detects missing descriptions, missing images, unrated items, calculates completeness percentages, and handles verification triage (`VERIFIED`, `NEEDS_REVIEW`, `REJECTED`). | • [`AdminCatalogue.jsx`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/pages/admin/AdminCatalogue.jsx)<br>• [`adminModel.js`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/server/models/adminModel.js#L5-L82) |
| **2. Dimensionality Reduction & Feature Extraction** | Deep learning feature extraction converting high-dimensional raw product images into 256-dimensional unit-normalized dense vectors using a ResNet-18 backbone. Non-linear interaction feature compression using Autoencoders. | • [`ml-service/cnn/`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/ml-service/cnn/)<br>• [`ml-service/autoencoder/`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/ml-service/autoencoder/) |
| **3. Collaborative Filtering (Latent Factor Mining)** | Neural Collaborative Filtering (NCF) combining Generalized Matrix Factorization (GMF) and Multi-Layer Perceptrons (MLP). Extracts user/item latent embedding vectors from implicit feedback matrices (purchase=5, cart=3, view=1). | • [`ml-service/ncf/`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/ml-service/ncf/) |
| **4. Sequential Pattern Mining** | Session clickstream mining using Gated Recurrent Units (GRU) to model sequential dependencies across user sessions and predict the immediate next interaction. | • [`ml-service/gru/`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/ml-service/gru/) |
| **5. Multi-Modal Ensemble Mining** | Multi-Modal Attention Fusion combining collaborative embeddings, visual features, text metadata, and sequential signals through an attention weighting mechanism. | • [`ml-service/fusion/`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/ml-service/fusion/) |
| **6. Mining Validation & Evaluation Metrics** | Leave-One-Out cross-validation with 99 sampled unseen negatives measuring core ranking and information retrieval metrics: **Precision@K, Recall@K, Hit Ratio (HR@K), NDCG@K, MRR, Catalogue Coverage**, and **Diversity Index**. | • [`AdminAnalytics.jsx`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/pages/admin/AdminAnalytics.jsx)<br>• [`adminService.js`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/server/services/adminService.js#L41-L87) |
| **7. Operational Telemetry & Funnel Aggregations** | Event streaming and conversion funnel slicing across user touchpoints (`VIEW` $\rightarrow$ `CART_ADD` / `WISHLIST_ADD` $\rightarrow$ `PURCHASE`) with discrete temporal aggregation intervals (24h, 7d, 30d, all-time). | • [`adminModel.js`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/server/models/adminModel.js#L85-L220) |
| **8. Rule-Based Post-Mining & Governance** | Heuristic ranking modifiers (category multipliers, boost scores, freshness penalties) configured via database system settings with complete immutable audit trails. | • [`AdminBusinessRules.jsx`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/pages/admin/AdminBusinessRules.jsx)<br>• `audit_logs` table |

---

## 3. How to Present This Project to Your Professor

### 3.1 The 3-Minute Elevator Pitch
> *"Professor, our project **Cartify** tackles a major challenge in industry: bridging high-concurrency transactional e-commerce (OLTP) with analytical intelligence and knowledge discovery (OLAP & Data Mining). While conventional web applications only store orders, Cartify records an event telemetry stream of interactions, applies automated data quality preprocessing, performs dimensionality reduction and multi-modal recommendation mining using NCF, CNNs, and GRUs, and provides an executive Business Intelligence dashboard featuring multi-dimensional OLAP analytics, association rule mining, and customer clustering."*

### 3.2 Key Professor Questions & Bulletproof Answers

**Q1: "Is this just a normal full-stack e-commerce website?"**
* **Answer:** *"No, sir/ma'am. The e-commerce storefront is only the operational source layer (OLTP) that generates live, organic data. The core innovation of our project lies in the analytical and data mining pipeline behind it:
  1. We separate the operational tables from analytical aggregations.
  2. We apply data cleansing, missing-value diagnostics, and automated quality scoring.
  3. We run five distinct data mining models (NCF for latent factor collaborative filtering, CNN for visual dimensionality reduction, GRU for sequential pattern mining, Autoencoders for state compression, and Attention Fusion for multi-modal ensemble prediction).
  4. We evaluate these models using formal information retrieval metrics: Hit Ratio, NDCG, Precision, Recall, and Diversity Index.
  5. We expose decision-support tools in our BI Dashboard."*

**Q2: "Where is the Data Warehouse concept here?"**
* **Answer:** *"In our architecture, the transactional schema in PostgreSQL is normalized in 3NF to ensure ACID compliance during checkout. For analytical querying, we model a Star Schema consisting of central Fact tables (`Fact_Sales`, `Fact_Interactions`) connected to Dimension tables (`Dim_Time`, `Dim_Product`, `Dim_Customer`, `Dim_Category`). This allows the BI dashboard to perform real-time OLAP operations: roll-up, drill-down, slice, and dice without locking transactional tables."*

**Q3: "What classical data mining algorithms are running?"**
* **Answer:** *"We cover three classical families of data mining:
  1. **Association Rule Mining:** Market Basket Analysis using the Apriori/FP-Growth algorithm to discover itemsets with high Support, Confidence, and Lift.
  2. **Unsupervised Clustering:** Customer segmentation via RFM (Recency, Frequency, Monetary) modeling and K-Means clustering.
  3. **Supervised & Neural Sequence Mining:** Latent factor decomposition through NCF and sequential clickstream pattern mining through GRUs."*

### 3.3 Suggested Presentation Slide Structure
1. **Slide 1: Title & Overview** — Project title, Dual OLTP/OLAP architecture diagram.
2. **Slide 2: Problem Statement** — Limitations of pure OLTP systems in modern retail; need for automated data quality and intelligence.
3. **Slide 3: Data Preprocessing & Quality Assurance** — Catalogue health metrics, null value handling, anomaly detection.
4. **Slide 4: Data Warehouse Architecture** — Star schema layout (`Fact_Sales`, dimensions), OLAP operations (slice, dice, drill-down).
5. **Slide 5: Association Rule Mining (Market Basket)** — Frequent itemsets, Support, Confidence, Lift calculation on checkout data.
6. **Slide 6: Clustering & Segmentation** — RFM customer segmentation and K-Means clusters.
7. **Slide 7: Neural Recommender & Multi-Modal Mining** — NCF + CNN + GRU + Attention Fusion.
8. **Slide 8: Model Evaluation & Benchmarks** — HR@K, NDCG@K, Leave-One-Out cross-validation results.
9. **Slide 9: Executive BI Dashboard Live Demo** — Visual showcase of the administrator console.
10. **Slide 10: Conclusion & Academic Learnings** — Key takeaways mapping to course syllabus.

---

## 4. Section-Wise Future Implementation Roadmap

To maintain clean code quality and ensure manageable progress, future work is organized into **independent, step-by-step sections**. We will execute these sections sequentially.

```
+-----------------------------------------------------------------------------------+
| SECTION 1: Data Warehouse Layer & Star Schema (OLAP Foundation)                   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| SECTION 2: Market Basket Analysis & Association Rules (Apriori Engine)            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| SECTION 3: Customer Segmentation & RFM Clustering (K-Means Engine)               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| SECTION 4: Interactive Multi-Dimensional OLAP Slice & Dice on BI Dashboard        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| SECTION 5: Customer Churn Classification & Predictive Forecasting                 |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| SECTION 6: ETL Pipeline Monitoring, Data Lineage & Quality Auditing               |
+-----------------------------------------------------------------------------------+
```

---

### SECTION 1: Data Warehouse Layer & Star Schema (OLAP Foundation)

*Goal: Establish formal dimensional modeling in PostgreSQL to separate analytical queries from transactional tables.*

- [x] **Step 1.1: Star Schema SQL Definition**
  - Create `database/schema_warehouse_star.sql`.
  - Define Dimension Tables:
    - `dim_time`: `time_id`, `full_date`, `year`, `quarter`, `month`, `month_name`, `day`, `day_of_week`, `is_weekend`.
    - `dim_product`: `product_id`, `title`, `brand`, `category_id`, `category_name`, `price_tier`.
    - `dim_customer`: `customer_id`, `created_at`, `account_age_days`, `activity_tier`.
  - Define Fact Table:
    - `fact_sales`: `fact_id`, `time_id`, `product_id`, `customer_id`, `quantity_sold`, `unit_price`, `total_revenue`, `discount_amount`.
  - Define Event Fact Table:
    - `fact_interaction_daily`: Pre-aggregated daily interaction counts per product/category.

- [x] **Step 1.2: ETL Batch Loading Script**
  - Create `server/scripts/etl_populate_warehouse.js`.
  - Implement Extract from operational `orders`, `order_items`, `interactions`, `products`.
  - Implement Transform: generate surrogate keys, handle missing fields, derive dimensions.
  - Implement Load: bulk insert/upsert into `fact_*` and `dim_*` tables.

- [x] **Step 1.3: Data Warehouse Model & Service Layer**
  - Create `server/models/warehouseModel.js` and `server/services/warehouseService.js`.
  - Provide optimized queries for analytical aggregations using Star Schema joins.

---

### SECTION 2: Market Basket Analysis & Association Rules (Apriori Engine)

*Goal: Mine transactional purchase records to discover itemsets frequently bought together and expose dynamic rule tuning.*

- [x] **Step 2.1: Transaction Basket Extractor**
  - Query `order_items` grouped by `order_id` to form transaction item lists:
    $$\mathcal{T} = \{ \{p_1, p_3\}, \{p_2, p_4, p_5\}, \dots \}$$
  - Also support session-level basket extraction from `interactions` (`interaction_type = 'CART_ADD'` grouped by `session_id`).

- [x] **Step 2.2: Association Rule Mining Algorithm**
  - Create `server/services/mining/aprioriService.js` (or Python helper in `ml-service/mining/apriori.py`).
  - Calculate:
    - **Support:** $\text{Supp}(X \cup Y) = \frac{\text{freq}(X \cup Y)}{|\mathcal{T}|}$
    - **Confidence:** $\text{Conf}(X \Rightarrow Y) = \frac{\text{Supp}(X \cup Y)}{\text{Supp}(X)}$
    - **Lift:** $\text{Lift}(X \Rightarrow Y) = \frac{\text{Conf}(X \Rightarrow Y)}{\text{Supp}(Y)}$
  - Filter rules where $\text{Supp} \ge \text{min\_sup}$ and $\text{Conf} \ge \text{min\_conf}$.

- [x] **Step 2.3: API Endpoints for Association Rules**
  - Add `GET /api/admin/bi/association-rules` with query params `minSupport`, `minConfidence`, `minLift`.

- [x] **Step 2.4: BI Dashboard Association Rules Explorer**
  - In [AdminBIDashboard.jsx](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/pages/admin/AdminBIDashboard.jsx), render:
    - Interactive sliders for Minimum Support ($1\% - 20\%$) and Minimum Confidence ($20\% - 90\%$).
    - Association Rules Table with visual Lift badges ($\text{Lift} > 1.0$ indicating positive association).
    - Top Cross-Sell recommendations widget.

---

### SECTION 3: Customer Segmentation & RFM Clustering (K-Means)

*Goal: Apply unsupervised learning to segment users by purchasing behavior and visualize cluster distributions.*

- [x] **Step 3.1: RFM Metric Generation**
  - Build query calculating the three key dimensions per customer:
    - **Recency ($R$):** Days elapsed since the customer's last order or login.
    - **Frequency ($F$):** Total number of completed transactions.
    - **Monetary ($M$):** Total spend across all completed orders.

- [x] **Step 3.2: K-Means Clustering Algorithm**
  - Normalize RFM scores (Z-Score or Min-Max scaling).
  - Implement K-Means clustering ($K = 4$):
    - *Cluster 1: Champions / High-Value* (Low R, High F, High M)
    - *Cluster 2: Loyal Customers* (Moderate R, Moderate F, Moderate M)
    - *Cluster 3: At-Risk / Potential Churn* (High R, Moderate F, Moderate M)
    - *Cluster 4: New / Inactive Explorers* (High R, Low F, Low M)
  - Return cluster centroids and customer assignment distributions.

- [x] **Step 3.3: API Endpoints for Customer Segmentation**
  - Add `GET /api/admin/bi/customer-segments`.

- [x] **Step 3.4: BI Dashboard Segmentation Visualizer**
  - In [AdminBIDashboard.jsx](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/pages/admin/AdminBIDashboard.jsx), render:
    - 4 Cluster breakdown cards with customer count, average order value, and suggested marketing strategy.
    - Interactive 2D scatter plot (Recency vs. Monetary) with cluster color-coding.

---

### SECTION 4: Interactive Multi-Dimensional OLAP Slice & Dice on BI Dashboard

*Goal: Enable executive drill-down, roll-up, slicing, and dicing over sales and product categories.*

- [x] **Step 4.1: Multi-Dimensional OLAP Aggregation Service**
  - In `warehouseService.js` and `warehouseModel.js`, build dynamic queries with SQL `GROUP BY CUBE` and `ROLLUP`:
    - By Time (Year $\rightarrow$ Quarter $\rightarrow$ Month $\rightarrow$ Week $\rightarrow$ Day)
    - By Product Hierarchy (Category $\rightarrow$ Price Tier)
    - By Customer Tier (Activity Tier $\rightarrow$ Category)

- [x] **Step 4.2: API Endpoints for OLAP Cube Queries**
  - Add `GET /api/admin/bi/olap-cube` supporting `dimensions`, `filters`, `timeGrain`, `cubeMode`, `metric`.

- [x] **Step 4.3: BI Dashboard OLAP Controls & Visual Charts**
  - Add an **OLAP Multi-Dimension Toolbar**:
    - **Drill-Down / Roll-Up Switcher:** Toggle view between Yearly, Quarterly, Monthly, Weekly, and Daily revenue.
    - **Slice Filter:** Select specific Category (e.g. *Electronics*, *Sports*, *Beauty*, *Home & Kitchen*).
    - **Dice Selector:** Combine multiple filters simultaneously (e.g. *Category = Electronics* AND *Quarter = Q3* AND *PriceTier = LUXURY*).
  - Render dynamic SVG charts for sales trends and category contribution.
  - Interactive Cross-Tabulation Pivot Grid with Heatmap shading, subtotal rows, and grand totals.

---

### SECTION 5: Customer Churn Classification & Predictive Forecasting

*Goal: Apply predictive data mining to identify churn risk and sales trends.*

- [x] **Step 5.1: Churn Risk Feature Vector**
  - Compute feature vectors per user: `days_inactive`, `cart_abandonment_ratio`, `negative_review_count`, `average_session_interval`.
  - Implemented in [`churnService.js`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/server/services/mining/churnService.js).

- [x] **Step 5.2: Classification Rule Engine**
  - Train/apply a classification model (Decision Tree / Logistic Scoring) predicting Churn Probability ($0.0 - 1.0$).
  - Label users as *High Risk*, *Medium Risk*, or *Safe*.
  - Added REST endpoint `GET /api/admin/bi/churn-predictions`.

- [x] **Step 5.3: BI Dashboard Churn & Risk Panel**
  - Added a **Customer Retention & Churn Risk** component to the BI Dashboard showing users requiring proactive re-engagement.
  - Interactive risk filtering, decision tree rule visualizer modal, individual customer logit decomposition modal, and one-click retention action dispatching in [`AdminBIDashboard.jsx`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/pages/admin/AdminBIDashboard.jsx).

---

### SECTION 6: ETL Pipeline Monitoring, Data Lineage & Quality Auditing

*Goal: Showcase complete Data Warehousing lifecycle management and data governance.*

- [x] **Step 6.1: ETL Run Logger & Lineage Table**
  - Updated table `etl_job_runs` with `created_at` and created `etl_data_lineage` and `data_quality_audits` in [`database/schema_warehouse_star.sql`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/database/schema_warehouse_star.sql).
  - Built 4-tier Architectural Data Lineage Directed Acyclic Graph (DAG) generator resolving 22 nodes and 22 directed edges across OLTP Sources, ETL Transforms, Star Schema Tables, and Analytics/ML Consumers in [`dataQualityService.js`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/server/services/mining/dataQualityService.js).

- [x] **Step 6.2: Automated Data Quality Scoring**
  - Implemented automated multi-dimensional Data Quality scoring in [`dataQualityService.js`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/server/services/mining/dataQualityService.js):
    - **Completeness (40% Weight):** Evaluates non-null ratios across all 5 Star Schema dimensions and facts (`dim_product`, `dim_customer`, `dim_time`, `fact_sales`, `fact_interaction_daily`).
    - **Consistency (35% Weight):** Evaluates 6 formal referential integrity checks (zero orphan products, customers, times, or interaction FKs, revenue balance math tolerance, domain range non-negativity).
    - **Timeliness (25% Weight):** Evaluates ingestion sync latency, operational transaction time delta, and SLA decay curves (&lt; 24h compliance).
    - **Composite Data Quality Index (DQI):** Weighted composite score with formal status grades (`EXCELLENT`, `GOOD`, `WARNING`, `CRITICAL`) and immutable audit persistence in `data_quality_audits`.
  - Added REST endpoints `GET /api/admin/bi/data-quality`, `POST /api/admin/bi/data-quality/audit`, and `GET /api/admin/bi/data-lineage` in [`adminRoutes.js`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/server/routes/adminRoutes.js).

- [x] **Step 6.3: BI Dashboard ETL & Data Quality Console**
  - Added comprehensive **DWM Section 6 • Data Governance & Lineage** module to [`AdminBIDashboard.jsx`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/pages/admin/AdminBIDashboard.jsx):
    - 4 Executive KPI Metric Cards (Composite DQI Gauge, Completeness Index, Referential Integrity Ratio, Ingestion Timeliness & SLA).
    - Interactive 4-Tier Architectural Data Lineage (DAG) Visualizer with dynamic live record counts, health chips, and an interactive Inspector Drawer displaying schema, transformation logic, upstream sources, and downstream consumers.
    - Deep-Dive Tabbed Console covering Completeness Matrix with column-level bars, Consistency Validation Rules with pass/fail chips, Timeliness SLA monitoring, ETL Job Runs historical log (`etl_job_runs`), and Historical DQI Checkpoint trends.
    - Interactive Lineage Modal for expanded full-screen architecture exploration.

---

### SECTION 7: Higher-Order Association Rule Mining (Apriori L2/L3/L4)

*Goal: Extend the existing Market Basket Analysis engine from 2-itemsets to genuine higher-order Apriori — discovering compound cross-sell patterns invisible to simple A→B analysis.*

- [x] **Step 7.1: Higher-Order Apriori Engine**
  - Rewrote [`server/services/mining/aprioriService.js`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/server/services/mining/aprioriService.js) with full textbook Apriori:
    - **Candidate generation:** $L_{k-1} \times L_{k-1}$ prefix-join (shared $k-2$ prefix) — eliminates the brute-force combination approach.
    - **Anti-monotonicity pruning:** discards any $k$-candidate whose $(k-1)$-subsets are not all frequent.
    - **Inverted-index support counting:** $O(|T| \times \bar{b})$ per level rather than $O(|C_k| \times |T|)$.
    - **Rule generation from all levels:** every non-empty proper subset as antecedent; $\text{Conf} = \text{Supp}(X \cup Y)/\text{Supp}(X)$, $\text{Lift} = \text{Conf}/\text{Supp}(Y)$.
    - **Safety guards:** `maxItemsetSize` clamped [2, 4]; candidate cap of 50,000; minSupport floor of 0.001; `isTruncated` flag in response metadata.
    - Each rule now carries `itemsetSize`, `antecedentSize`, and `consequentSize`.

- [x] **Step 7.2: API Endpoint Update**
  - Extended `GET /api/admin/bi/association-rules` with `maxItemsetSize` query parameter (int, 2–4, default 3).
  - Response now returns `{ data: rules[], meta: { totalTransactions, frequentItemsetCounts, isTruncated, maxItemsetSize, effectiveMinSupport } }`.
  - Backward-compatible: callers that expect a flat array still work; `meta` is a bonus field.

- [x] **Step 7.3: Dashboard Refactor & Section 7 UI**
  - Extracted `AdminBIDashboard.jsx` (3,826 lines) into 7 presentational panel components under `client/src/pages/admin/bi/`:
    - `biShared.js` — shared formatters and CLUSTER_CONFIG.
    - `BiHeader.jsx` — header, grain switcher, ETL button.
    - `WarehouseOverviewPanel.jsx` — Section 1 KPIs & charts.
    - `AssociationRulesPanel.jsx` — Section 2 + Section 7 higher-order UI.
    - `CustomerSegmentsPanel.jsx` — Section 3 RFM scatter.
    - `OlapExplorerPanel.jsx` — Section 4 CUBE/ROLLUP explorer.
    - `ChurnPanel.jsx` — Section 5 churn risk table + modals.
    - `DataGovernancePanel.jsx` — Section 6 lineage DAG + DQI console.
  - Shell `AdminBIDashboard.jsx` reduced from 3,826 → 412 lines (pure state + fetch logic).
  - `AssociationRulesPanel` extended with Section 7 additions:
    - **3-button L2/L3/L4 order selector** with contextual hint text.
    - **Order badge column** (`antecedentSize → consequentSize`) on each rule row — L3/L4 rules visually distinct from L2.
    - **Frequent Itemset Counts** pill summary (L1/L2/L3 counts) in the hyperparameter panel.
    - Truncation warning banner when candidate cap is hit.

- [x] **Step 7.4: Test Suite**
  - Created [`server/scripts/test_section7_higher_order_rules.js`](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/server/scripts/test_section7_higher_order_rules.js): **27/27 assertions passed**.
    - Phase 0: Admin authentication.
    - Phase 1: API contract (meta shape, field types).
    - Phase 2: L2 backward-compatibility (math invariants, size fields, itemsetSize=2 enforcement).
    - Phase 3: L3 higher-order rules (new fields, anti-monotonicity sanity, sort order, size range; live result: 274 L2 + 186 L3 rules).
    - Phase 4: Input clamping (maxItemsetSize=99 → 4, minSupport floor, 401 on unauthenticated).

---

## 5. Milestone Tracking Checklist

Use this checklist during future pair-programming turns:

- [x] **Milestone 0: Core Foundation & Route Setup** *(Completed)*
  - [x] Added `BI Dashboard` navigation tab to [AdminLayout.jsx](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/layouts/AdminLayout.jsx).
  - [x] Added `BI Dashboard` overview card to [AdminDashboard.jsx](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/pages/admin/AdminDashboard.jsx).
  - [x] Created [AdminBIDashboard.jsx](file:///d:/Preet/Others/Projects/sem5project/Cartify/Cartify/client/src/pages/admin/AdminBIDashboard.jsx) shell page.
  - [x] Created `DWM_ROADMAP.md` guide.
- [x] **Milestone 1: Star Schema & Warehouse Layer** (Section 1) *(Completed)*
- [x] **Milestone 2: Market Basket Analysis & Association Rules** (Section 2) *(Completed)*
- [x] **Milestone 3: Customer Segmentation & RFM Clustering** (Section 3) *(Completed)*
- [x] **Milestone 4: OLAP Slice & Dice on BI Dashboard** (Section 4) *(Completed)*
- [x] **Milestone 5: Churn Classification & Predictive Insights** (Section 5) *(Completed)*
- [x] **Milestone 6: ETL Lineage & Data Quality Audit** (Section 6) *(Completed)*
- [x] **Milestone 7: Higher-Order Apriori (L2/L3/L4)** (Section 7) *(Completed)*

