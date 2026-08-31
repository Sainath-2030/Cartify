# Cartify Rebuild — Technical Architecture & Implementation Memory

## 1. PROJECT OVERVIEW
Cartify is an AI-powered academic e-commerce recommendation platform designed to combine:
1. A multi-actor e-commerce application (Shopper, Content Manager, Administrator).
2. A scalable interaction telemetry tracking system.
3. A dataset-independent product architecture.
4. A foundation for multi-model AI recommendation architectures (**NCF + CNN + GRU + Autoencoder + Attention Fusion**).

---

## 2. ACTORS & ROLE ARCHITECTURE
- **`USER` (Shopper):** Customer storefront, search, filtering, product details, cart, wishlist, authentic reviews, and simulated checkout/order history.
- **`CONTENT_MANAGER`:** Content Console (`/api/content-manager/*`), internal product creation (`source = 'internal'`), product CRUD, metadata allowlist updates, gallery image management, category management.
- **`ADMIN`:** Administrator Console (`/api/admin/*`), live catalogue health diagnostics, interaction analytics, recommendation metrics/status contracts, retraining trigger contracts, business rules tuning, and audit log inspection.
- **`SYSTEM_SCHEDULER`:** Background job runner for batch retraining triggers and interaction archival.

---

## 3. DATASET PROVENANCE & CATEGORY TAXONOMY — IMPLEMENTED (Phase 1B & 1C)
- **Raw Input Source:** `data/Amazon-Products.csv` ($551,587$ raw lines).
- **Clean Output File:** `data/processed/amazon-products-clean.csv` ($16,976$ clean, validated rows).
- **Hierarchical Classification:**
  1. **Level 1 (High-Precision Word-Boundary Regex):** Captures explicit product types (`\b(green tea|instant coffee|coconut oil|smartwatch|yoga mat|dumbbell|candle|lipstick|gaming mouse)\b`).
  2. **Level 2 (Specific Sub-Category Mapping):** Maps verified sub-categories (`air conditioners`, `smartphones`, `cookware`, `fragrance`).
  3. **Level 3 (Pure Uncontaminated Main Categories):** Maps direct fashion and appliances departments (`men's clothing`, `women's clothing`, `appliances`, etc.).
  4. **Level 4 (Exclusion of Out-of-Scope Items):** Unclassifiable/noisy items ($43,584$ records) are excluded rather than dumped into Fashion.
- **Brand Extraction:** Case-sensitive word-boundary matching enforced for short acronyms (`\bboAt\b`, `\bHP\b`, `\bLG\b`, `\bMi\b`).
- **Active Catalogue in PostgreSQL (16,976 Products):**
  - **Fashion (`fashion`):** $3,500$
  - **Electronics (`electronics`):** $3,200$
  - **Home & Kitchen (`home-kitchen`):** $2,800$
  - **Beauty (`beauty`):** $2,500$
  - **Sports & Fitness (`sports`):** $2,500$
  - **Grocery (`grocery`):** $2,200$
  - **Gaming (`gaming`):** $276$
  - **Books (`books`):** $0$ *(Preserved without fabricated data)*

---

## 4. DATABASE SCHEMA (PostgreSQL) — IMPLEMENTED (Phase 1A & Phase 1D.3 Migration)

- **`users`:** `(id BIGSERIAL PK, email UNIQUE, password_hash, full_name, role user_role, avatar_url, created_at, updated_at)`
- **`categories`:** `(id SERIAL PK, name, slug UNIQUE, description, image_url, is_active, created_at)`
- **`products`:** `(id BIGSERIAL PK, source, source_id, name, slug UNIQUE, brand, category_id FK, subcategory, description, short_description, price, discount_percentage, final_price, rating, review_count, stock_quantity, seller_name, main_image, images JSONB, specifications JSONB, is_active, search_vector tsvector, created_at, updated_at, UNIQUE (source, source_id))`
- **`interactions`:** `(id BIGSERIAL PK, user_id FK, session_id, product_id FK, interaction_type interaction_type, metadata JSONB, created_at)`
- **`reviews`:** `(id BIGSERIAL PK, product_id FK, user_id FK, reviewer_name, rating (1-5), review_text, created_at, UNIQUE(product_id, user_id))`
- **`cart_items`:** `(id BIGSERIAL PK, user_id FK, product_id FK, quantity, created_at, updated_at, UNIQUE(user_id, product_id))`
- **`wishlist_items`:** `(id BIGSERIAL PK, user_id FK, product_id FK, created_at, UNIQUE(user_id, product_id))`
- **`orders`:** `(id BIGSERIAL PK, user_id FK, total_amount, status order_status, shipping_address JSONB, payment_method, payment_status, created_at, updated_at)`
- **`order_items`:** `(id BIGSERIAL PK, order_id FK, product_id FK, quantity, unit_price, total_price)`
- **`audit_logs`:** `(id BIGSERIAL PK, user_id FK, action VARCHAR(100), entity_type VARCHAR(50), entity_id VARCHAR(100), metadata JSONB, created_at TIMESTAMPTZ)`
- **`system_configs`:** `(key VARCHAR(100) PK, value JSONB, description TEXT, updated_at TIMESTAMPTZ)`

---

## 5. BACKEND & API REFERENCE — IMPLEMENTED (Phase 1D.1 - Phase 1D.3)

### Architecture
Layered separation of concerns:
`Route (HTTP & RBAC binding)` $\rightarrow$ `Controller (Request parsing & Validation)` $\rightarrow$ `Service (Business rules & Audit Logging)` $\rightarrow$ `Model (PostgreSQL queries)` $\rightarrow$ `PostgreSQL 16`

### RBAC Middleware Security
- **`requireAuth`:** Verifies JWT token and populates `req.user = { id, email, role }`.
- **`requireRole(...roles)`:** Enforces server-side authorization boundaries. Unauthenticated $\rightarrow$ 401; unauthorized role $\rightarrow$ 403. Client body role fields are completely ignored.

### Complete API Endpoint Reference Table

| Method | Path | Auth Required | Role | Request Parameters / Body | Response Payload |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `GET` | `/api/health` | No | Any | None | `{ success: true, message: string }` |
| `GET` | `/api/categories` | No | Any | None | `{ success: true, data: Category[] }` |
| `GET` | `/api/categories/:slug` | No | Any | Path: `slug` | `{ success: true, data: Category }` |
| `GET` | `/api/products` | No | Any | Query: `page`, `limit`, `category`, `brand`, `minPrice`, `maxPrice`, `rating`, `inStock`, `sort` | `{ success: true, data: Product[], pagination: Pagination }` |
| `GET` | `/api/products/search` | No | Any | Query: `q` (required), `page`, `limit`, `category`, `sort` | `{ success: true, data: Product[], pagination: Pagination, query: string }` |
| `GET` | `/api/products/:id` | No | Any | Path: `id` (integer Cartify PK) | `{ success: true, data: Product }` |
| `GET` | `/api/products/slug/:slug` | No | Any | Path: `slug` | `{ success: true, data: ProductDetail }` |
| `GET` | `/api/products/brands` | No | Any | Query: `category` (optional) | `{ success: true, data: string[] }` |
| `GET` | `/api/products/:productId/reviews` | No | Any | Path: `productId`, Query: `page`, `limit` | `{ success: true, data: Review[], pagination: Pagination }` |
| `GET` | `/api/products/:productId/reviews/summary` | No | Any | Path: `productId` | `{ success: true, data: RatingSummary }` |
| `GET` | `/api/products/:productId/reviews/me` | Yes | All | Path: `productId`, Header: `Authorization: Bearer <JWT>` | `{ success: true, data: Review \| null }` |
| `POST`| `/api/products/:productId/reviews` | Yes | All | Path: `productId`, Body: `{ rating: 1-5, reviewText?: string }` | `{ success: true, message: string, data: Review }` |
| `PATCH` or `PUT` | `/api/reviews/:reviewId` | Yes | Owner/Admin | Path: `reviewId`, Body: `{ rating?: 1-5, reviewText?: string }` | `{ success: true, message: string, data: Review }` |
| `DELETE` | `/api/reviews/:reviewId` | Yes | Owner/Admin | Path: `reviewId` | `{ success: true, message: string, data: { reviewId, productId } }` |
| `POST`| `/api/auth/register` | No | Any | Body: `{ email, password, fullName }` | `{ success: true, data: { user, token } }` |
| `POST`| `/api/auth/login` | No | Any | Body: `{ email, password }` | `{ success: true, data: { user, token } }` |
| `GET` | `/api/auth/me` | Yes | All | Header: `Authorization: Bearer <JWT>` | `{ success: true, data: { user } }` |
| `GET` | `/api/cart` | Yes | All | Header: `Authorization: Bearer <JWT>` | `{ success: true, data: CartSummary }` |
| `POST`| `/api/cart` or `/api/cart/items` | Yes | All | Body: `{ productId: number, quantity?: number }` | `{ success: true, message: string, data: CartSummary }` |
| `PATCH` or `PUT` | `/api/cart/items/:productId` | Yes | All | Path: `productId`, Body: `{ quantity: number }` | `{ success: true, message: string, data: CartSummary }` |
| `DELETE` | `/api/cart/items/:productId` | Yes | All | Path: `productId` | `{ success: true, message: string, data: CartSummary }` |
| `DELETE` | `/api/cart` | Yes | All | Header: `Authorization: Bearer <JWT>` | `{ success: true, message: string, data: CartSummary }` |
| `GET` | `/api/wishlist` | Yes | All | Header: `Authorization: Bearer <JWT>` | `{ success: true, data: WishlistSummary }` |
| `GET` | `/api/wishlist/ids` | Yes | All | Header: `Authorization: Bearer <JWT>` | `{ success: true, data: number[] }` |
| `GET` | `/api/wishlist/check/:productId` | Yes | All | Path: `productId` | `{ success: true, data: { productId: number, isWishlisted: boolean } }` |
| `POST`| `/api/wishlist` or `/api/wishlist/items` | Yes | All | Body: `{ productId: number }` | `{ success: true, message: string, data: WishlistSummary }` |
| `POST`| `/api/wishlist/move-to-cart/:productId` | Yes | All | Path: `productId`, Body: `{ quantity?: number }` | `{ success: true, message: string, data: { wishlist, cart } }` |
| `DELETE` | `/api/wishlist/items/:productId` | Yes | All | Path: `productId` | `{ success: true, message: string, data: WishlistSummary }` |
| `DELETE` | `/api/wishlist` | Yes | All | Header: `Authorization: Bearer <JWT>` | `{ success: true, message: string, data: WishlistSummary }` |
| `GET` | `/api/orders/preview` | Yes | All | Header: `Authorization: Bearer <JWT>` | `{ success: true, data: CheckoutPreview }` |
| `GET` | `/api/orders` | Yes | All | Header: `Authorization: Bearer <JWT>`, Query: `page`, `limit` | `{ success: true, data: OrderSummary[], pagination: Pagination }` |
| `GET` | `/api/orders/:orderId` | Yes | Owner/Admin | Path: `orderId` | `{ success: true, data: OrderDetail }` |
| `POST`| `/api/orders` | Yes | All | Body: `{ shippingAddress: Address, paymentMethod?: string }` | `{ success: true, message: string, data: OrderDetail }` |
| `PATCH`| `/api/orders/:orderId/cancel` | Yes | Owner/Admin | Path: `orderId` | `{ success: true, message: string, data: { id, status } }` |
| `POST`| `/api/interactions` | Optional | All/Guest | Body: `{ interactionType: 'VIEW' \| 'SEARCH', productId?: number, sessionId?: string, metadata?: object }` | `{ success: true, message: string, data: Interaction }` |
| `GET` | `/api/admin/catalogue/health` | Yes | `ADMIN` | None | `{ success: true, data: CatalogueHealth }` |
| `GET` | `/api/admin/analytics/interactions` | Yes | `ADMIN` | Query: `timeframe` (`24h`, `7d`, `30d`, `all`) | `{ success: true, data: InteractionAnalytics }` |
| `GET` | `/api/admin/models/metrics` | Yes | `ADMIN` | None | `{ success: true, data: { status: 'NOT_AVAILABLE', ... } }` |
| `GET` | `/api/admin/models/status` | Yes | `ADMIN` | None | `{ success: true, data: { status: 'NOT_IMPLEMENTED', models: [...] } }` |
| `POST`| `/api/admin/models/retrain` | Yes | `ADMIN` | Body: `{ trigger?: string, parameters?: object }` | `{ success: true, data: { status: 'QUEUED', requestId: string } }` |
| `GET` | `/api/admin/business-rules` | Yes | `ADMIN` | None | `{ success: true, data: BusinessRules }` |
| `PATCH`| `/api/admin/business-rules` | Yes | `ADMIN` | Body: `{ diversityBoost?: number, minRatingThreshold?: number, ... }` | `{ success: true, message: string, data: BusinessRules }` |
| `GET` | `/api/admin/audit-logs` | Yes | `ADMIN` | Query: `limit` | `{ success: true, data: AuditLog[] }` |
| `GET` | `/api/content-manager/products` | Yes | `CONTENT_MANAGER`, `ADMIN` | Query: `page`, `limit`, `category`, `isActive`, `search`, `sort` | `{ success: true, data: Product[], pagination: Pagination }` |
| `POST`| `/api/content-manager/products` | Yes | `CONTENT_MANAGER`, `ADMIN` | Body: `{ name, brand, categoryId, subcategory, description, price, discountPercentage, finalPrice, stockQuantity, mainImage, images, specifications }` | `{ success: true, message: string, data: InternalProduct }` |
| `PATCH`| `/api/content-manager/products/:id` | Yes | `CONTENT_MANAGER`, `ADMIN` | Path: `id`, Body: `{ name?, price?, stockQuantity?, is_active?, ... }` | `{ success: true, message: string, data: Product }` |
| `PATCH`| `/api/content-manager/products/:id/images` | Yes | `CONTENT_MANAGER`, `ADMIN` | Path: `id`, Body: `{ mainImage: string, images: string[] }` | `{ success: true, message: string, data: ProductImages }` |
| `GET` | `/api/content-manager/categories` | Yes | `CONTENT_MANAGER`, `ADMIN` | None | `{ success: true, data: Category[] }` |
| `POST`| `/api/content-manager/categories` | Yes | `CONTENT_MANAGER`, `ADMIN` | Body: `{ name, slug?, description?, imageUrl?, isActive? }` | `{ success: true, message: string, data: Category }` |
| `PATCH`| `/api/content-manager/categories/:id` | Yes | `CONTENT_MANAGER`, `ADMIN` | Path: `id`, Body: `{ name?, description?, imageUrl?, isActive? }` | `{ success: true, message: string, data: Category }` |
| `DELETE`| `/api/content-manager/categories/:id` | Yes | `CONTENT_MANAGER`, `ADMIN` | Path: `id` | `{ success: true, message: string, data: Category }` |

---

## 6. DEFAULT SEEDED CREDENTIALS

| Role | Email | Password |
| :--- | :--- | :--- |
| **`ADMIN`** | `admin@cartify.com` | `AdminPassword123!` |
| **`CONTENT_MANAGER`** | `manager@cartify.com` | `ManagerPassword123!` |
| **`USER`** | `shopper@cartify.com` | `ShopperPassword123!` |

---

## 7. FEATURE STATUS MATRIX

| Rebuild Stage | Sub-Phase | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **Phase 1: Core Foundation** | **Phase 1A: Database Foundation** | **COMPLETE** | Schema with 9 tables, 3 ENUMs, constraints, indexes, 3 actor accounts, 8 categories |
| | **Phase 1B: Dataset Preprocessing** | **COMPLETE** | Refined multi-level hierarchical classifier; 16,976 clean rows in `data/processed/amazon-products-clean.csv` |
| | **Phase 1C: Dataset Import** | **COMPLETE** | Re-imported 16,976 products into PostgreSQL in 4.71s; verified 100% taxonomy purity & search vectors |
| | **Phase 1D.1: Backend / API Foundation** | **COMPLETE** | Layered Express routes, controllers, services, connection pool, centralized error handler, input validators, 26/26 tests passed |
| | **Phase 1D.2A: Cart API** | **COMPLETE** | Authenticated shopping cart endpoints, user isolation, stock validation, atomic increments, 21/21 tests passed |
| | **Phase 1D.2B: Wishlist API** | **COMPLETE** | Authenticated wishlist endpoints, idempotent add, lightweight check/ids endpoints, move-to-cart, user isolation, 21/21 tests passed |
| | **Phase 1D.2C: Reviews & Ratings API** | **COMPLETE** | Authenticated reviews/ratings CRUD, one-review-per-user constraint, rating summary breakdown, 28/28 tests passed |
| | **Phase 1D.2D: Orders & Checkout API** | **COMPLETE** | ACID transactional checkout, price snapshots, stock management, cancellation, verified purchase link, 30/30 tests passed |
| | **Phase 1D.2E: Telemetry & Interaction Ingestion API** | **COMPLETE** | Two-tier event pipeline (`POST /api/interactions` + trusted service hooks), metadata sanitization, 25/25 tests passed |
| | **Phase 1D.3: RBAC Console APIs (Admin & Content Manager)** | **COMPLETE** | Role-based console endpoints for ADMIN and CONTENT_MANAGER, catalogue health, analytics, model status contracts, internal products (`source='internal'`), audit logging, 34/34 tests passed |
| | **Phase 1D.4: Final Backend & API Verification** | **COMPLETE** | Comprehensive 8-suite regression and master E2E cross-actor lifecycle verified 100% (220/220 tests passed). Phase 1 Core Backend locked. |
| **PHASE 1 (CORE FOUNDATION & BACKEND)** | **ALL SUB-PHASES** | **COMPLETE / LOCKED** | **Fully verified, hardened, and locked for Phase 2 Frontend implementation.** |
| **Phase 2: Storefront UI/UX Rebuild** | **Phase 2.0: Premium Frontend Foundation + Global Shell** | **COMPLETE** | Approved "Intelligent Minimalist Luxury" visual foundation, Carbon Obsidian + Pure Ink palette, Plus Jakarta Sans + Inter typography, 8-pt spacing tokens, rebuilt sticky frosted `Navbar`, touch-friendly `MobileMenu`, editorial `Footer`, and refined core UI primitives (`Button`, `Input`, `Select`, `Badge`, `Card`, `Container`, `SectionHeader`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast`). |
| | **Phase 2.1: Visual Refinement (Warm Background)** | **COMPLETE** | Refined storefront canvas to warm stone / ivory palette (`#F3F0EA` canvas, `#EAE6DE` secondary warm surfaces, `#FAF9F6` soft card surfaces, `#DDD9D1` hairline border) with high-contrast preservation of the black editorial hero component (`#09090B`). |
| | **Phase 2.2: Home Page Redesign** | **NOT STARTED** | Full editorial discovery hero, real data shelves, department pills, AI recommender teaser |
| | **Phase 2.2: Product Catalogue & Discovery** | **NOT STARTED** | Filtering, sorting, fast search, pagination, luxury product card |
| | **Phase 2.3: Product Details & Reviews** | **NOT STARTED** | Gallery, specifications, verified reviews submission |
| | **Phase 2.4: Shopping Cart & Wishlist** | **NOT STARTED** | Refined cart drawer, cart page, item mutations, move-to-cart |
| | **Phase 2.5: Checkout & Order Confirmation** | **NOT STARTED** | 2-step frictionless checkout simulation, snapshot reviews |
| | **Phase 2.6: User Profile & Orders** | **NOT STARTED** | Tabbed account center, order history, shipping addresses |
| | **Phase 2.7: Auth Experience (Login/Signup)** | **NOT STARTED** | Minimalist auth cards, validation, role routing |
| | **Phase 2.8: Admin Operational Dashboard** | **NOT STARTED** | Live catalogue health, interaction analytics, model status |
| | **Phase 2.9: Content Manager Console** | **NOT STARTED** | Internal product CRUD, metadata updates, categories |
| | **Phase 2.10: Responsive Polish & E2E QA** | **NOT STARTED** | Mobile navigation, touch targets, and viewport optimization |
