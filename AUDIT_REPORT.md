# Cartify — Comprehensive Architecture & Dataset Audit Report

**Project:** Cartify AI-Powered E-Commerce Platform  
**Audit Date:** 2026-08-31  
**Scope:** Complete Architecture, SRS Compliance, Amazon Products Dataset 2023 Analysis, Multi-Role RBAC, and ML Readiness  

---

## 1. PROJECT OVERVIEW

**Cartify** is an academic e-commerce platform engineered with a clean, dataset-agnostic architecture and structured for progressive evolution into an AI-powered hybrid recommendation system.

The project is structured in two major evolutionary tiers:
1. **Core E-Commerce Platform:** Customer-facing storefront, role-based administration (`Administrator` and `Content Manager`), product discovery, filtering/search, interaction tracking, and future shopping workflows (cart, wishlist, checkout, reviews).
2. **Hybrid Multi-Modal Recommendation Engine (Planned):** Modular recommendation architecture combining:
   $$\text{NCF} + \text{CNN} + \text{GRU} + \text{Autoencoder} \longrightarrow \text{Attention Fusion} \longrightarrow \text{Personalized Recommendations}$$

---

## 2. CURRENT FOLDER STRUCTURE

```
cartify/
├── client/                               # React 18 + Vite + Tailwind Frontend
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── components/                   # UI components (ProductCard, ProductGrid, ProductGallery, RatingStars, FilterSidebar, etc.)
│       │   └── dashboard/                # Role dashboard shell (DashboardShell.jsx, ComingSoon.jsx)
│       ├── context/                      # AuthContext.jsx, ToastContext.jsx
│       ├── hooks/                        # useAuth.js, useToast.js, useInteractionTracking.js
│       ├── layouts/                      # MainLayout.jsx, AdminLayout.jsx, ContentManagerLayout.jsx
│       ├── pages/                        # Home, Login, Signup, Profile, Products, ProductDetail, Categories, Category, Unauthorized, NotFound
│       │   ├── admin/                    # AdminDashboard, AdminAnalytics, AdminModels, AdminRetraining, AdminCatalogue, AdminBusinessRules
│       │   └── content-manager/          # CMDashboard, CMProducts, CMProductNew, CMCategories
│       ├── services/                     # api.js, authService.js, productService.js, categoryService.js, userService.js, interactionService.js
│       └── utils/                        # format.js, image.js, session.js, validators.js
│
├── server/                               # Node.js + Express REST API (ESM)
│   ├── app.js                            # Express app configuration & middleware
│   ├── server.js                         # HTTP server listener
│   ├── package.json
│   ├── config/                           # db.js (pg.Pool connection manager)
│   ├── controllers/                      # authController, productController, categoryController, userController, interactionController
│   ├── middleware/                       # authMiddleware (requireAuth, requireRole), optionalAuthMiddleware, errorMiddleware, validateMiddleware
│   ├── models/                           # userModel, productModel, categoryModel, reviewModel, interactionModel
│   ├── routes/                           # authRoutes, userRoutes, productRoutes, categoryRoutes, interactionRoutes
│   ├── scripts/                          # importProducts.js, validateProducts.js
│   ├── services/                         # authService, productService, categoryService, userService, interactionService
│   ├── utils/                            # asyncHandler.js, jwt.js
│   └── validators/                       # authValidators, productValidators, userValidators, reviewValidators
│
├── database/                             # PostgreSQL Schema & Seed Scripts
│   ├── schema.sql                        # users, interactions tables
│   ├── schema_section2.sql               # categories, products, reviews, FTS vector, interaction FK
│   ├── schema_section3_roles.sql         # users.role column & check constraints
│   ├── seed.sql                          # Demo user
│   ├── seed_section2.sql                 # Seed catalogue
│   ├── seed_section3_real_products.sql   # Real catalogue seed
│   └── update_images.sql                 # Image utility script
│
├── data/                                 # Raw Dataset Storage
│   ├── Amazon-Products.csv               # Complete Amazon Products Dataset 2023 (188.6 MB, 551,586 rows)
│   └── [140 category CSVs]               # Individual subcategory split CSV files
│
├── AUDIT_REPORT.md                       # This Audit Report
├── BRAIN.md                              # Antigravity Persistent Technical Memory
├── CLAUDE.MD                             # Persistent Project Context & Memory
└── README.md                             # Project Documentation
```

---

## 3. TECHNOLOGY STACK

| Layer | Technologies & Libraries | Notes / Constraints |
| :--- | :--- | :--- |
| **Frontend** | React 18.3.1, Vite 5.3.3, `react-router-dom` 6.24.1, Tailwind CSS 3.4.6, `lucide-react` 0.383.0 | Native Fetch API, no Axios, no Redux, no React Query. |
| **Backend** | Node.js (ESM), Express 4.19.2, `pg` 8.12.0, `bcrypt` 5.1.1, `jsonwebtoken` 9.0.2, CORS 2.8.5, `dotenv` 16.4.5 | Strict Layered Architecture (`routes` → `validators` → `controllers` → `services` → `models`). |
| **Database** | PostgreSQL 14+, GIN Indexed `tsvector` | Parameterized SQL queries, no ORM, additive SQL migration scripts. |
| **ML (Future)** | Python, PyTorch / TensorFlow, Scikit-learn, Pandas | Planned as a decoupled recommendation microservice. |

---

## 4. FRONTEND STATUS

* **Architecture:** Component-driven React with clean separation between Storefront (`MainLayout`), Administrator console (`AdminLayout`), and Content Manager console (`ContentManagerLayout`).
* **Routing & Protected Boundaries:**
  * **Storefront:** `/`, `/products`, `/products/:slug`, `/categories`, `/category/:slug`, `/profile` (`ProtectedRoute`), `/login`, `/signup`, `/unauthorized`, `*` (`NotFound`).
  * **Admin Console:** `/admin` (`AdminDashboard`), `/admin/analytics`, `/admin/models`, `/admin/retraining`, `/admin/catalogue`, `/admin/business-rules` (Gated by `RoleProtectedRoute(allowedRoles=['ADMIN'])`).
  * **Content Manager Console:** `/content-manager` (`CMDashboard`), `/content-manager/products`, `/content-manager/products/new`, `/content-manager/categories` (Gated by `RoleProtectedRoute(allowedRoles=['CONTENT_MANAGER'])`).
* **Component Implementation Breakdown:**
  * **IMPLEMENTED:** ProductCard, ProductGrid, ProductGallery, ProductInfo, ProductSkeleton, FilterSidebar (category, brand, price slider, rating radio, stock toggle), SortDropdown (6 sort modes), Pagination, SearchBar, Navbar (role-conditional links), MobileMenu, ReviewSection (display layer), RatingStars, DashboardShell, ComingSoon.
  * **PARTIALLY IMPLEMENTED:** Dashboard sub-pages (UI routing and layouts are active; sub-pages render placeholder `ComingSoon` components pending backend management APIs).
  * **PLANNED / MISSING:** Shopping Cart drawer/page, Wishlist page, Review submission form & modal, Checkout/Order flow.

---

## 5. BACKEND STATUS

* **Architecture:** Layered REST API with Express 4.
  * `routes/`: Explicit URL route mapping. Dynamic parameters (`/search`, `/brands`) ordered before wildcard slugs.
  * `middleware/`: `authMiddleware.js` (`requireAuth`, `requireRole`), `optionalAuthMiddleware.js`, `validateMiddleware.js`, `errorMiddleware.js`.
  * `controllers/`: HTTP extraction, response formatting, status codes.
  * `services/`: Business logic, pagination calculation, multi-model aggregation.
  * `models/`: Direct parameterized PostgreSQL queries.
* **API Endpoints:**
  * **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`.
  * **Users:** `GET /api/users/me`, `PUT /api/users/me`.
  * **Products:** `GET /api/products` (filterable/sortable/paginated), `GET /api/products/search` (FTS `tsvector`), `GET /api/products/brands`, `GET /api/products/slug/:slug`, `GET /api/products/:id`.
  * **Categories:** `GET /api/categories`, `GET /api/categories/:slug`, `GET /api/categories/:slug/products`.
  * **Interactions:** `POST /api/interactions` (records discovery events for authenticated users, tracks session IDs for guests).
* **Missing Backend APIs (Planned):**
  * Cart CRUD endpoints (`/api/cart`).
  * Wishlist CRUD endpoints (`/api/wishlist`).
  * Review creation/mutation endpoints (`POST /api/products/:id/reviews`).
  * Admin management & metrics endpoints (`/api/admin/*`).
  * Content Manager product CRUD endpoints (`/api/content-manager/*`).

---

## 6. DATABASE STATUS

* **Current Database Contents:**
  * `users`: 3 records (Admin: `sainathnanaware2005@gmail.com`, Content Manager: `dihjay420@gmail.com`, Shopper: `shopper_1788173836914@cartify.com`).
  * `categories`: 8 records (`Electronics`, `Fashion`, `Home & Kitchen`, `Books`, `Beauty`, `Sports`, `Grocery`, `Gaming`).
  * `products`: 3,328 active records.
  * `reviews`: 95 seeded review display records.
  * `interactions`: 13 telemetry interaction rows.
* **Schema Integrity:**
  * Primary Keys: `BIGSERIAL` on all relational entities (`users.id`, `products.id`, `interactions.id`, `reviews.id`).
  * Constraints: Foreign keys active (`products.category_id -> categories.id`, `interactions.user_id -> users.id`, `interactions.product_id -> products.id`, `reviews.product_id -> products.id`).
  * Indexes: B-Tree indexes on `email`, `slug`, `category_id`, `brand`, `final_price`, `rating`, `user_id`, `product_id`, `session_id`, `role`, plus GIN index on `search_vector`.
* **Dataset Independence:** The database schema is completely independent of external sources. `products.id` is the single permanent internal identity.

---

## 7. AMAZON PRODUCTS DATASET 2023 ANALYSIS

* **Location:** `data/Amazon-Products.csv` (188,603,963 bytes) along with 140 individual category CSV files in `data/`.
* **Exact Dataset Dimensions:**
  * **Total Rows:** 551,586 product rows (551,587 lines including header).
  * **Main Categories:** 21 distinct categories (e.g. `accessories`, `men's clothing`, `women's clothing`, `tv, audio & cameras`, `appliances`, `stores`, `sports & fitness`, `home & kitchen`, `beauty & health`, `bags & luggage`, etc.).
  * **Sub-categories:** 113 distinct sub-categories.
* **Raw Column Structure:**
  1. `""` (Index: integer sequence 0 to 551585)
  2. `name` (Product title)
  3. `main_category` (Broad category string)
  4. `sub_category` (Specific product classification)
  5. `image` (Amazon CDN image URL)
  6. `link` (Amazon product web URL containing ASIN)
  7. `ratings` (Average rating out of 5)
  8. `no_of_ratings` (Number of customer ratings, comma-formatted string)
  9. `discount_price` (Discounted price in INR with currency symbol `₹` and commas)
  10. `actual_price` (M.R.P. in INR with currency symbol `₹` and commas)
* **Data Quality & Health Audit:**
  * **Images:** 551,585 rows (99.9998%) have valid, direct Amazon image URLs (`https://m.media-amazon.com/images/...`).
  * **Product IDs (ASIN):** 551,584 rows contain a valid 10-character Amazon ASIN extractable via regex (`/dp/([A-Z0-9]{10})/`).
  * **Unique Products:** 471,155 unique ASINs (approx. 80,431 multi-category cross-listing duplicates across CSVs).
  * **Missing Values:**
    * `ratings` & `no_of_ratings`: 175,795 missing (~31.9%).
    * `discount_price`: 61,164 missing (~11.1%).
    * `actual_price`: 17,815 missing (~3.2%).
  * **Descriptions:** Raw dataset contains titles only; rich descriptions and specification key-values are not provided as separate columns.
  * **Brands:** Not a distinct column; brand names are embedded at the beginning of the `name` string (e.g. *"Lloyd 1.5 Ton...", "LG 1.5 Ton...", "Samsung Galaxy..."*).
* **Current Import Status:** The full 551,586 Amazon CSV is **NOT** currently imported in its entirety into PostgreSQL. The database currently runs on a stable 3,328-product catalogue. The running application is healthy, working, and fully compatible.

---

## 8. DATASET → CARTIFY MODEL MAPPING

| Amazon Dataset Field | Cleaning / Transformation Pipeline | Cartify Internal Product Field |
| :--- | :--- | :--- |
| `link` (`/dp/([A-Z0-9]{10})/`) | Extract 10-character Amazon ASIN | `source_id` *(External traceability)* |
| (Literal: `'amazon'`) | Source dataset identifier | `source` *(Provenance)* |
| `name` | Clean whitespace, trim trailing ellipsis (`...`) | `name` |
| `name` | `slugify(name) + '-' + deduplication_index` | `slug` |
| `name` | First 140 characters truncated with ellipsis | `short_description` |
| `name` + `sub_category` | Synthesized feature description | `description` |
| `main_category` / `sub_category` | Mapped via taxonomy dictionary to Cartify category slugs | `category_id` |
| `sub_category` | Direct string assignment | `subcategory` |
| `name` | Extracted leading brand token / known brand map; fallback `'Unbranded'` | `brand` |
| `actual_price` | Clean non-numeric characters (`replace(/[^0-9.]/g, '')`) | `price` |
| `discount_price` | Clean non-numeric; if missing or 0, fallback to `actual_price` | `final_price` |
| `actual_price` & `discount_price` | Compute `((price - final_price) / price) * 100`, bounded [0, 90] | `discount_percentage` |
| `ratings` | Parse float; fallback to 0.0 or category average | `rating` |
| `no_of_ratings` | Parse integer (strip commas); fallback to 0 | `review_count` |
| (Simulated) | Deterministic pseudo-random stock quantity (e.g. 10 - 100) | `stock_quantity` |
| `brand` | `[Brand] Official Store` or `'Cartify Retail'` | `seller_name` |
| `image` | Primary Amazon CDN image URL | `main_image` |
| `image` | Array of image URLs (JSONB) | `images` |
| `sub_category` + `brand` | Category-specific structured key-value pairs (JSONB) | `specifications` |

---

## 9. AUTHENTICATION & ROLE STATUS

* **Roles Defined:** `USER` (Shopper), `ADMIN` (Administrator), `CONTENT_MANAGER` (Content Manager).
* **Database Level:** `users.role` column with `chk_users_role CHECK (role IN ('USER', 'ADMIN', 'CONTENT_MANAGER'))` and index on `role`.
* **Backend Security:**
  * JWT claims include `{ userId, email, role }`.
  * `requireAuth` populates `req.user`.
  * `requireRole(...roles)` validates role authorization.
  * Role self-promotion is blocked; `PUT /api/users/me` strips role mutations.
* **Frontend Security & Routing:**
  * `RoleProtectedRoute` verifies authentication and checks `allowedRoles`.
  * Role-aware post-login redirection (`ADMIN` $\to$ `/admin`, `CONTENT_MANAGER` $\to$ `/content-manager`, `USER` $\to$ `/profile`).
  * Role-conditional navigation in desktop `Navbar` dropdown and `MobileMenu` drawer.

---

## 10. SRS REQUIREMENTS VS IMPLEMENTATION

| SRS Requirement Category | Requirement Summary | Implementation Status | Implementation Notes |
| :--- | :--- | :--- | :--- |
| **REQ-AUTH-1 / SEC-1** | User Registration with Validation | **IMPLEMENTED** | Indian mobile, strong password, bcrypt hashing |
| **REQ-AUTH-2 / SEC-2** | JWT-based Stateless Authentication | **IMPLEMENTED** | 7-day JWT expiry, Authorization Bearer header |
| **REQ-AUTH-3 / SEC-3** | Role-Based Access Control (RBAC) | **PARTIALLY IMPLEMENTED** | DB check & `requireRole` middleware exist; Admin/CM APIs pending |
| **REQ-CAT-1 / CAT-2** | Product Browsing & Filtering | **IMPLEMENTED** | Multi-faceted sidebar (brand, category, price, rating, stock) |
| **REQ-CAT-3** | Full-Text Search | **IMPLEMENTED** | PostgreSQL GIN `tsvector` weighted search (`/api/products/search`) |
| **REQ-CAT-4** | Product Details & Gallery | **IMPLEMENTED** | Full gallery, specifications tab, seller info, related products |
| **REQ-CAT-5** | Category Management / Navigation | **IMPLEMENTED** | Category list & filtered category pages with live counts |
| **REQ-INT-1 / ML-DATA** | Interaction Telemetry Tracking | **IMPLEMENTED** | Captures views, clicks, searches with session IDs |
| **REQ-SHOP-1** | Shopping Cart System | **NOT IMPLEMENTED** | Planned in Section 3 (Cart CRUD, stock validation) |
| **REQ-SHOP-2** | Wishlist System | **NOT IMPLEMENTED** | Planned in Section 3 (Wishlist toggle & move-to-cart) |
| **REQ-SHOP-3** | User Review Submission | **PARTIALLY IMPLEMENTED** | Review display layer built; review submission pending |
| **REQ-ORD-1 / ORD-2** | Checkout & Order Management | **NOT IMPLEMENTED** | Planned in Section 4 (Academic simulation) |
| **REQ-ADM-1..5** | Administrator Console | **PARTIALLY IMPLEMENTED** | Shell & routes created; live metrics & model controls pending |
| **REQ-CM-1..3** | Content Manager Console | **PARTIALLY IMPLEMENTED** | Shell & routes created; product CRUD forms & APIs pending |
| **REQ-ML-1..5** | AI Recommendation Engine | **NOT IMPLEMENTED** | Telemetry ready; NCF/CNN/GRU/Autoencoder planned |

---

## 11. FUTURE ML READINESS

The telemetry and schema foundation directly supports future recommendation modeling:

1. **NCF (Neural Collaborative Filtering):**
   * Ready via `interactions (user_id, product_id, interaction_type, created_at)`.
2. **GRU (Session Sequence Modeling):**
   * Ready via `interactions (session_id, user_id, product_id, created_at)`. Chronological clickstreams can be extracted per session without data contamination.
3. **CNN (Visual Feature Extraction):**
   * Ready via `products.main_image` storing high-resolution image URLs accessible for offline embedding extraction (ResNet/EfficientNet).
4. **Autoencoder (Sparse Collaborative Filtering & Cold Start):**
   * Ready via aggregation of implicit interaction matrices from `interactions` and metadata attributes from `products.specifications`.
5. **Attention Fusion:**
   * Ready because all data pipelines link to permanent internal IDs (`products.id`, `users.id`).

---

## 12. ARCHITECTURAL PROBLEMS IDENTIFIED

1. **Missing `source` / `source_id` Columns in `products` Table:**
   * *Problem:* The current `products` table does not have explicit columns for storing external dataset provenance (`source = 'amazon'`) and origin IDs (`source_id = 'B0BRKXTSBT'`).
   * *Impact:* Re-running imports or syncing future dataset updates without tracking source IDs risks duplicate rows or losing linkability to source images.
2. **Hardcoded Category Limit in Frontend (`Home.jsx`):**
   * *Problem:* `Home.jsx` slices categories with `.slice(0, 8)`.
   * *Impact:* While benign with 8 categories, it introduces an arbitrary client-side assumption if categories expand.
3. **Guest Interaction Non-Persistence:**
   * *Problem:* `interactions.user_id` has a `NOT NULL` constraint in `database/schema.sql`, causing unauthenticated guest interaction events to be discarded at the service layer (`guest_session_not_persisted`).
   * *Impact:* GRU session modeling for anonymous guest shoppers cannot leverage guest browsing histories until guest interaction storage is enabled (e.g. allowing nullable `user_id` when `session_id` is present).
4. **DummyJSON Importer Script Stale:**
   * *Problem:* `server/scripts/importProducts.js` still references DummyJSON APIs rather than reading local CSV datasets in `data/`.

---

## 13. RECOMMENDED CHANGES

#### HIGH PRIORITY
- **Dataset Agnostic Database Schema Refactor (Additive Migration):**
  Add `source VARCHAR(50) DEFAULT 'cartify'` and `source_id VARCHAR(100)` to `products`, with a unique constraint on `(source, source_id)` where `source_id IS NOT NULL`.
- **Dataset Import Pipeline for Amazon Products 2023 (`server/scripts/importAmazonProducts.js`):**
  Build a streaming, chunked, idempotent importer that reads `data/Amazon-Products.csv`, cleans prices, extracts ASINs, extracts brands, maps categories to Cartify's schema, and upserts into PostgreSQL.
- **Enable Nullable `user_id` on `interactions` Table:**
  Modify `interactions.user_id` constraint to allow `NULL` when `session_id IS NOT NULL` (with a check constraint `chk_interaction_identity CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)`), enabling anonymous session tracking for the future GRU model.

#### MEDIUM PRIORITY
- **Section 3 — Shopping Experience & User Interactions:**
  Implement Shopping Cart backend & frontend, Wishlist persistence, and Authenticated Review Submission with automated rating recalculation.
- **Content Manager Product Management Endpoints:**
  Implement backend CRUD routes (`POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`) protected with `requireAuth, requireRole('CONTENT_MANAGER', 'ADMIN')` to replace the `ComingSoon` placeholders in the Content Manager dashboard.

#### LOW PRIORITY
- **Dynamic Category Limits:**
  Refactor `Home.jsx` to parameterize category grid limits via component props rather than hardcoded `.slice(0, 8)`.
- **Admin System Metrics Endpoint:**
  Provide `GET /api/admin/overview` with aggregated statistics (user counts, product totals, interaction volume) to power the Admin Dashboard cards.

---

## 14. PRIORITY ORDER FOR NEXT DEVELOPMENT

1. **Step 1: Section 3 — Shopping Experience (Recommended Immediate Next Step)**
   * Implement Cart (backend models, routes, React Context, Cart Drawer/Page).
   * Implement Wishlist (backend models, routes, React Context, Wishlist Page).
   * Implement Review Submission (authenticated review creation, rating aggregation).
2. **Step 2: Content Manager & Admin Operational Features**
   * Wire live product CRUD and catalogue management in `/content-manager`.
   * Wire system metrics and user role management in `/admin`.
3. **Step 3: Dataset-Agnostic Refactor & Bulk Ingestion**
   * Add `source` / `source_id` additive migration.
   * Add streaming Amazon 2023 batch importer script.
4. **Step 4: ML Telemetry Pipeline & Sequence Modeling**
   * Adjust guest interaction schema constraints.
   * Build data export scripts for NCF/GRU offline training.

---

## 15. BRAIN.md STATUS

* **Status:** **CREATED & FULLY SYNCHRONIZED** at `BRAIN.md`.
* **Contents:** Comprehensive 12-section technical architectural memory covering project objectives, folder structure, full technology stack, frontend/backend architecture, database schemas, role boundaries, API contracts, Amazon dataset analysis & mapping, ML readiness, and development rules.

---

## 16. CLAUDE.md STATUS

* **Status:** **UPDATED & SYNCHRONIZED** at `CLAUDE.MD`.
* **Updates:** Synchronized product catalogue size (3,328 products), documented the addition of the full Amazon Products Dataset 2023 in `data/`, and verified alignment with `BRAIN.md`.

---

PROJECT AUDIT COMPLETE
