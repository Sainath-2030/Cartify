# Cartify — Project Instructions for Claude (Persistent Memory)

This file is Cartify's persistent development memory.

READ THIS FILE FIRST IN EVERY NEW SESSION before inspecting or modifying the codebase.

This file should contain enough information for Claude to understand the current architecture, decisions, completed work, constraints, and roadmap without requiring the full project ZIP every time.

Keep this file updated after every major feature, section, architectural change, database change, or important decision.

IMPORTANT:
Clearly distinguish between IMPLEMENTED and PLANNED features.
Never claim a planned feature has been implemented.

---

# 1. PROJECT OVERVIEW

**Project:** Cartify

**Tagline:** Shop Smarter, Not Harder.

Cartify is an AI-powered e-commerce web application being developed as an academic research/project implementation.

The project has two major layers:

1. E-commerce web application
2. Future AI-powered recommendation system

The current goal is to build a complete, professional e-commerce experience first and then integrate a hybrid recommendation engine.

Future recommendation architecture:

NCF + CNN + GRU + Autoencoder
                ↓
        Attention Fusion
                ↓
   Personalized Recommendations

The web application and ML system must remain modular and loosely coupled.

---

# 2. CORE ARCHITECTURE

## Current Architecture — IMPLEMENTED

React Frontend (client/)
        ↓
REST + JSON
        ↓
Node.js + Express API (server/)
        ↓
pg / node-postgres
        ↓
PostgreSQL Database

No ORM is used.

Database access is implemented through:

server/config/db.js

using `pg` with parameterized SQL queries.

Database SQL files are maintained manually under:

database/

No migration framework is currently used.

---

## Future AI Architecture — PLANNED

React Frontend
        ↓
Node/Express API
        ↓
Recommendation Service
        ↓
┌──────────┬──────────┬──────────┬────────────┐
│   NCF    │   CNN    │   GRU    │ Autoencoder│
└──────────┴──────────┴──────────┴────────────┘
        ↓
Attention Fusion
        ↓
Personalized Recommendations

The ML system should eventually be modular.

Do not tightly couple:

- React
- Express
- ML models
- dataset-specific code

---

# 3. TECHNOLOGY STACK

## Frontend

Location:

client/

Technologies:

- React 18.3.1
- ReactDOM 18.3.1
- Vite 5.3.3
- react-router-dom 6.24.1
- Tailwind CSS 3.4.6
- PostCSS
- Autoprefixer
- lucide-react 0.383.0
- Plain JavaScript
- Fetch API

No axios.

No React Query.

No external state-management library.

---

## Backend

Location:

server/

Technologies:

- Node.js
- Express 4.19.2
- ESM modules
- pg 8.12.0
- bcrypt 5.1.1
- jsonwebtoken 9.0.2
- cors
- dotenv
- nodemon for development

server/package.json uses:

"type": "module"

---

## Database

- PostgreSQL
- SQL written manually
- `pg` / node-postgres
- No ORM
- No migration framework

SQL files are under:

database/

and are executed manually using PostgreSQL/psql.

---

## Future ML Stack — PLANNED

Potential technologies:

- Python
- PyTorch
- TensorFlow/Keras where appropriate
- NumPy
- Pandas
- scikit-learn

Do not add ML dependencies until the relevant ML section begins.

---

# 4. DEVELOPMENT PHILOSOPHY

Cartify is developed SECTION BY SECTION.

Never rebuild the entire project for a new section.

Before making changes:

1. Read CLAUDE.md.
2. Inspect the existing implementation.
3. Identify reusable components/services/models.
4. Modify only what is necessary.
5. Preserve existing functionality.
6. Avoid duplicate implementations.
7. Test old functionality after changes.
8. Update CLAUDE.md after completing the feature.

Cartify is one continuously evolving project, not a collection of disposable implementations.

---

# 5. FRONTEND ARCHITECTURE — IMPLEMENTED

client/src/

├── components/
│   ├── Navbar
│   ├── Footer
│   ├── ProductCard
│   ├── ProductGrid
│   ├── ProductGallery
│   ├── ProductInfo
│   ├── ProductSkeleton
│   ├── ReviewSection
│   ├── RatingStars
│   ├── SearchBar
│   ├── FilterSidebar
│   ├── SortDropdown
│   ├── Pagination
│   ├── CategoryCard
│   ├── CategoryGrid
│   ├── Button
│   ├── Input
│   ├── FormField
│   ├── PasswordStrength
│   ├── Loader
│   ├── Toast
│   ├── Modal
│   ├── MobileMenu
│   ├── EmptyState
│   ├── ErrorState
│   └── ProtectedRoute
│   ├── RoleProtectedRoute
│   └── dashboard/
│       ├── DashboardShell   (shared sidebar/header/mobile-drawer shell for role dashboards)
│       └── ComingSoon        (placeholder card for not-yet-built dashboard sections)
│
├── pages/
│   ├── Home
│   ├── Login
│   ├── Signup
│   ├── Profile
│   ├── Products
│   ├── ProductDetail
│   ├── Categories
│   ├── Category
│   └── NotFound
│   ├── Unauthorized
│   ├── admin/
│   │   ├── AdminDashboard
│   │   ├── AdminAnalytics       (ComingSoon)
│   │   ├── AdminModels          (ComingSoon)
│   │   ├── AdminRetraining      (ComingSoon)
│   │   ├── AdminCatalogue       (ComingSoon)
│   │   └── AdminBusinessRules   (ComingSoon)
│   └── content-manager/
│       ├── CMDashboard
│       ├── CMProducts       (ComingSoon)
│       ├── CMProductNew     (ComingSoon)
│       └── CMCategories     (ComingSoon)

│
├── layouts/
│   └── MainLayout
│   ├── AdminLayout             (wraps DashboardShell, role: ADMIN)
│   └── ContentManagerLayout    (wraps DashboardShell, role: CONTENT_MANAGER)
│
├── services/
│   ├── api.js
│   ├── authService
│   ├── userService
│   ├── productService
│   ├── categoryService
│   └── interactionService
│
├── hooks/
│   ├── useAuth
│   ├── useToast
│   └── useInteractionTracking
│
├── context/
│   ├── AuthContext
│   └── ToastContext
│
├── utils/
│   ├── validators
│   ├── format
│   ├── image
│   └── session
│
└── assets/

MainLayout provides:

Navbar
   ↓
Page
   ↓
Footer

---

# 6. FRONTEND API CONVENTIONS

client/src/services/api.js contains the fetch wrapper.

JWT:

localStorage
    ↓
cartify_token

Authenticated requests use:

Authorization: Bearer <token>

The API wrapper normalizes errors into:

{
    message,
    status,
    fieldErrors
}

Product-facing components consume Cartify's internal product representation.

They must NOT depend directly on an external dataset format.

---

# 7. FRONTEND ROUTES — IMPLEMENTED

# 7. FRONTEND ROUTES — IMPLEMENTED

Storefront routes (inside MainLayout — navbar + footer):

/
 /login
 /signup
 /products
 /products/:slug
 /categories
 /category/:slug
 /profile        (protected — any authenticated user)
 /unauthorized
 *

Administrator dashboard routes (own DashboardShell, no storefront navbar/footer,
protected by RoleProtectedRoute allowedRoles=['ADMIN']):

/admin                    → AdminDashboard
/admin/analytics          → ComingSoon
/admin/models             → ComingSoon
/admin/retraining         → ComingSoon
/admin/catalogue          → ComingSoon
/admin/business-rules     → ComingSoon

Content Manager dashboard routes (own DashboardShell, protected by
RoleProtectedRoute allowedRoles=['CONTENT_MANAGER']):

/content-manager                  → CMDashboard
/content-manager/products         → ComingSoon
/content-manager/products/new     → ComingSoon
/content-manager/categories       → ComingSoon

Post-login redirect (client/src/pages/Login.jsx) is role-aware:
ADMIN → /admin, CONTENT_MANAGER → /content-manager, USER → /profile
(a pending protected-route deep-link via location.state.from still takes priority).

Authenticated users see role-conditional dashboard links in Navbar's profile
dropdown (desktop) and MobileMenu (mobile) — ADMIN sees "Admin Dashboard",
CONTENT_MANAGER sees "Content Manager Dashboard". Regular USER accounts see
neither link, matching existing Section 1/2 behavior.

---

# 8. BACKEND ARCHITECTURE — IMPLEMENTED

server/

├── app.js
├── server.js
│
├── config/
│   └── db.js
│
├── routes/
│   ├── authRoutes
│   ├── userRoutes
│   ├── productRoutes
│   ├── categoryRoutes
│   └── interactionRoutes
│
├── controllers/
│   ├── authController
│   ├── userController
│   ├── productController
│   ├── categoryController
│   └── interactionController
│
├── services/
│   ├── authService
│   ├── userService
│   ├── productService
│   ├── categoryService
│   └── interactionService
│
├── models/
│   ├── userModel
│   ├── productModel
│   ├── categoryModel
│   ├── reviewModel
│   └── interactionModel
│
├── middleware/
│   ├── authMiddleware  (exports requireAuth + requireRole(...roles))
│   ├── optionalAuthMiddleware
│   ├── errorMiddleware
│   └── validateMiddleware
│
├── validators/
│   ├── authValidators
│   ├── userValidators
│   ├── productValidators
│   └── reviewValidators
│
├── utils/
│   ├── jwt.js
│   └── asyncHandler.js
│
└── scripts/
    ├── importProducts.js
    └── validateProducts.js

Backend layering:

routes
  ↓
validators
  ↓
controllers
  ↓
services
  ↓
models
  ↓
PostgreSQL

Raw SQL must remain inside models/data-access code.
requireRole(...roles) is the server-side authorization boundary for Admin/
Content-Manager-only endpoints (SRS SEC-3). It must run after requireAuth.
Not yet attached to any route — no Admin/Content-Manager API endpoints
exist yet (see Section 9b).

---

# 9. DATABASE ARCHITECTURE — IMPLEMENTED

Current SQL files are executed approximately in this order:

schema.sql
    ↓
schema_section2.sql
    ↓
product seed

No migration framework is used.

---

## users

## users

Current important fields:

id
full_name
email
password_hash
mobile
address
city
state
postal_code
date_of_birth
avatar_url
role            (VARCHAR, NOT NULL, DEFAULT 'USER' — see Section 9b)
created_at
updated_at

role is one of: USER, ADMIN, CONTENT_MANAGER (CHECK constraint chk_users_role).
Not self-assignable via PUT /api/users/me — promotion is a manual DB
operation only (see Section 9b) until an Admin role-management UI exists.

---

## categories

Current fields:

id
name
slug
description
image
created_at

Current categories:

Electronics
Fashion
Home & Kitchen
Books
Beauty
Sports
Grocery
Gaming

The application should not assume this exact list forever.

Future datasets may have different category structures.

---

## products

Current fields:

id BIGSERIAL
name
slug
description
short_description
category_id
subcategory
brand
price
discount_percentage
final_price
rating
review_count
stock_quantity
seller_name
seller_id
main_image
images JSONB
specifications JSONB
is_active
created_at
updated_at

`brand` is NOT NULL.

When a product has no brand:

Unbranded

is used instead of NULL.

---

## interactions

Current fields:

id
user_id
product_id
interaction_type
session_id
metadata JSONB
created_at

Current interaction types include:

view
click
search
wishlist
cart
purchase
rating
review
product_view
product_click
category_view

The interaction model will be expanded during Section 3.

---

## reviews

Current fields:

id
product_id
user_id
reviewer_name
rating
review_text
created_at

Current review rows:

0

The current system only displays reviews.

Review submission is not yet implemented.

# 9b. ROLE-BASED ACCESS — CHUNK 1 (Actor-Based Interfaces)

## IMPLEMENTED

- `users.role` column added via `database/schema_section3_roles.sql` (additive migration). Values: `USER` (default), `ADMIN`, `CONTENT_MANAGER`, enforced by a CHECK constraint.
- JWT payload now includes `role`. `req.user` (from `requireAuth`/`optionalAuth`) includes `{ id, email, role }`.
- `server/middleware/authMiddleware.js` exports `requireRole(...roles)` — server-side authorization boundary (SRS SEC-3). Not yet attached to any route; foundation for future Admin/Content Manager APIs.
- Role is NOT self-assignable: `PUT /api/users/me` (`validateProfileUpdate` / `UserModel.updateById`) does not accept `role`. Promotion to ADMIN/CONTENT_MANAGER is currently a manual DB operation (documented in the migration file).
- Frontend: `client/src/components/RoleProtectedRoute.jsx` — client-side role gate (UX only, not a security boundary). Redirects unauthenticated users to `/login`, wrong-role users to `/unauthorized` (`client/src/pages/Unauthorized.jsx`).
- New dashboard shell: `client/src/components/dashboard/DashboardShell.jsx` (shared sidebar/header/mobile-drawer UI) and `client/src/components/dashboard/ComingSoon.jsx` (placeholder card, used by all not-yet-built sections).
- **Administrator dashboard** — `client/src/layouts/AdminLayout.jsx`, routes under `/admin` (role: `ADMIN`):
  - `/admin` — `AdminDashboard.jsx` (overview cards, clearly labeled as a structural foundation, no live data)
  - `/admin/analytics`, `/admin/models`, `/admin/retraining`, `/admin/catalogue`, `/admin/business-rules` — all `ComingSoon` placeholders
- **Content Manager dashboard** — `client/src/layouts/ContentManagerLayout.jsx`, routes under `/content-manager` (role: `CONTENT_MANAGER`):
  - `/content-manager` — `CMDashboard.jsx` (overview cards)
  - `/content-manager/products`, `/content-manager/products/new`, `/content-manager/categories` — all `ComingSoon` placeholders
- Both dashboard route trees are siblings of `MainLayout`'s route (not nested inside it) — no storefront navbar/footer on dashboard pages, consistent with standard admin-console UX.
- Existing storefront routes/components unmodified except: `App.jsx` (new routes added), `authMiddleware.js`, `optionalAuthMiddleware.js`, `authService.js`, `userModel.js` (role-related additions only, all backward compatible).

## PLANNED / NOT STARTED

- No actual Admin APIs (analytics, model status, retraining triggers, business rules) — all UI is `ComingSoon`.
- No actual Content Manager product CRUD or image upload backend — all UI is `ComingSoon`.
- No admin UI for promoting/demoting user roles (currently manual SQL only).
- `requireRole` middleware exists but is not yet attached to any real route.
- System Scheduler actor has no interface (by design — background actor per SRS).

## FOLLOW-UP FIX (same chunk) — dashboard discoverability

Initial Chunk 1 shipped working routes/auth but no way for a logged-in
Admin/Content-Manager to actually *find* their dashboard (login always
redirected to /profile; no nav link existed anywhere). Fixed via:

- `client/src/pages/Login.jsx` — `onSubmit` now branches the post-login
  redirect on `loggedInUser.role` (ADMIN → /admin, CONTENT_MANAGER →
  /content-manager, else /profile), with `location.state.from` still
  taking priority for deep-linked protected-route redirects.
- `client/src/components/Navbar.jsx` — profile dropdown now conditionally
  renders "Admin Dashboard" / "Content Manager Dashboard" links (using the
  `LayoutDashboard` lucide icon) above the existing "Profile" link, based
  on `user.role`. `MobileMenu` is now passed a `user` prop.
- `client/src/components/MobileMenu.jsx` — accepts new `user` prop, same
  conditional dashboard links added above "Profile" in the drawer.

IMPORTANT recurring gotcha (document for future debugging sessions): a
browser session's JWT is issued at login time. Promoting a user's role via
direct SQL (`UPDATE users SET role = ...`) does NOT retroactively change an
already-issued token — the user must log out and log back in for the new
role to appear in `req.user.role` / `user.role` client-side.

---


# 10. DATABASE RELATIONSHIPS

---


# 10. DATABASE RELATIONSHIPS

products.category_id
        ↓
categories.id

interactions.user_id
        ↓
users.id

interactions.product_id
        ↓
products.id

reviews.product_id
        ↓
products.id

reviews.user_id
        ↓
users.id

Future tables such as:

cart_items
wishlist_items
order_items

must reference the internal:

products.id

---

# 11. AUTHENTICATION — IMPLEMENTED

Registration and login issue JWTs.

JWT contains the user ID.

Client stores token in:

cartify_token

Password hashing:

bcrypt

Middleware:

requireAuth
optionalAuth

`requireAuth`:

- rejects unauthenticated requests.

`optionalAuth`:

- attaches user information when available
- does not block guests.

Password hashes are never returned by APIs.

---

# 12. PRODUCT/CATALOGUE — IMPLEMENTED

Current functionality:

- Product listing
- Product cards
- Product details
- Categories
- Category pages
- Search
- Filtering
- Sorting
- Pagination
- Rating display
- Stock display
- Image gallery
- Specifications
- Seller information
- Review display
- Interaction tracking

Current product API supports:

GET /api/products
GET /api/products/search
GET /api/products/slug/:slug
GET /api/products/:id
GET /api/products/brands

---

# 13. CURRENT PRODUCT DATA — IMPLEMENTED (REBUILD V2)

Current database catalogue contains:

16,976 100% complete, verified, and dataset-independent products
8 categories (Electronics, Fashion, Home & Kitchen, Beauty, Sports, Grocery, Gaming, Books)

Cleaned and normalized with authentic Indian Rupee MRP and selling prices, normalized CDN images (`/images/I/...`), full descriptions, and clean brand names. Dataset-agnostic: `source = 'amazon'`, `source_id = ASIN`. Zero incomplete rows. Zero category pollution.

Important:

External datasets are NOT directly read by the running frontend.

All data is normalized into Cartify's internal PostgreSQL schema.

Current product characteristics:

- unique primary images
- unique product names and slugs
- normalized prices and discounts in INR
- product metadata and specifications JSONB
- ratings and review counts
- simulated stock quantities
- mapped top-level categories

Current prices and stock quantities are illustrative prototype values for academic research.

---

# 14. PRODUCT ID STRATEGY — IMPLEMENTED

This is an important architectural decision.

Cartify uses:

products.id

as its internal stable product identity.

It is:

BIGSERIAL

and PostgreSQL assigns it.

Other application tables reference:

products.id

via foreign keys.

External dataset IDs must NOT replace Cartify's internal product ID.

Current situation:

External Dataset ID
        ↓
temporary transformation
        ↓
Cartify products.id

Future planned improvement:

products
├── id
├── source
└── source_id

where:

id

remains the internal Cartify identity.

`source` and `source_id` would only identify the origin of imported data.

---

# 15. INTERACTION MODEL — IMPLEMENTED FOUNDATION

Current interaction tracking supports:

product_view
product_click
search
category_view

Authenticated users use:

user_id

Guests use:

session_id

Guest interactions are not currently persisted into the user-scoped database because `interactions.user_id` is NOT NULL.

The frontend generates a guest session ID using:

client/src/utils/session.js

The interaction table is intentionally designed to eventually support:

NCF
GRU
Autoencoder
Attention Fusion

No recommendation scoring exists yet.

No fake/hardcoded recommendations exist.

---

# 16. API RESPONSE CONTRACT — IMPLEMENTED

Success:

{
  "success": true,
  "data": {}
}

Pagination:

{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

Error:

{
  "success": false,
  "message": "...",
  "errors": {}
}

Future API changes must preserve this general convention unless there is a strong architectural reason to change it.

---

# 17. DATASET-INDEPENDENT ARCHITECTURE

## STATUS

Audit: COMPLETE

Refactor: PARTIALLY PLANNED / NOT YET IMPLEMENTED

The architecture audit confirmed that Cartify's core application is already largely dataset-independent.

The following areas were identified as dataset-specific:

server/scripts/importProducts.js
database/seed_section3_real_products.sql

The importer is a developer-only tool and is NOT called by the running application.

The main frontend/backend product APIs already operate on Cartify's internal product structure.

---

## Dataset-independent target architecture

External Dataset
       ↓
Dataset-specific Importer
       ↓
Validation
       ↓
Normalization
       ↓
Cartify Internal Product Model
       ↓
PostgreSQL
       ↓
Cartify API
       ↓
React Frontend

The frontend must never directly depend on an external dataset.

---

# 18. DATASET REFACTOR RULES

The refactor must remain MINIMAL.

Do NOT redesign the whole database.

Do NOT rewrite working APIs without a concrete reason.

Do NOT replace:

products.id

with an external dataset ID.

Do NOT introduce unnecessary abstractions.

The purpose of the refactor is:

External dataset changes
        ↓
Importer changes
        ↓
Core application remains stable

---

# 19. PLANNED DATASET REFACTOR

## Phase A — Database + Backend

PLANNED, NOT IMPLEMENTED unless explicitly marked otherwise.

Potential changes:

products.source
products.source_id

with appropriate uniqueness rules.

Purpose:

- external dataset traceability
- idempotent imports
- future re-imports
- reliable product mapping

Also planned:

Extract reusable product insert/upsert logic from:

server/scripts/importProducts.js

so future dataset importers can reuse the same database-writing logic.

---

## Phase B — API + Frontend

The current audit found no major API contract problem.

Potential minor improvement:

Remove or parameterize:

client/src/pages/Home.jsx

slice(0, 8)

because it happens to match the current number of categories but should not be treated as a permanent architectural limitation.

---

## Phase C — Future Dataset Import

When a future dataset is selected:

server/scripts/import<DatasetName>.js

should follow:

Read source
    ↓
Validate
    ↓
Normalize
    ↓
Map categories
    ↓
Normalize brands
    ↓
Normalize prices
    ↓
Generate/normalize slugs
    ↓
Map external IDs
    ↓
Insert/upsert into Cartify DB

Do not put dataset-specific transformation logic inside React components.

---

# 20. FUTURE H&M DATASET — NOT IMPLEMENTED

H&M Personalized Fashion Recommendations is a possible future dataset.

Important:

H&M integration = NOT IMPLEMENTED

Do NOT claim otherwise.

When eventually implemented, H&M will need:

article_id
        ↓
Cartify products.id

through an explicit mapping/import process.

H&M category names will not necessarily match Cartify's current categories.

That mapping must be decided during dataset integration.

Do NOT change the current category architecture solely because H&M may be used later.

---

# 21. SHOPPING FEATURES — SECTION 3 (COMPLETE)

## Chunk 3.1 — Shopping Cart (IMPLEMENTED)
Persistent database-backed shopping cart for authenticated users:
- Table: `cart_items` (`user_id`, `product_id`, `quantity`, `created_at`, `updated_at`, unique on `(user_id, product_id)`)
- Endpoints: `GET /api/cart`, `POST /api/cart`, `PUT /api/cart/:productId`, `DELETE /api/cart/:productId`, `DELETE /api/cart`
- Frontend: `CartProvider`, `useCart`, `CartDrawer` slide-over, `/cart` page, quick add on `ProductCard` and detail page.

## Chunk 3.2 — Wishlist System (IMPLEMENTED)
Persistent database-backed wishlist with $O(1)$ heart status lookups:
- Table: `wishlist_items` (`id`, `user_id`, `product_id`, `created_at`, unique on `(user_id, product_id)`)
- Endpoints:
  - `GET /api/wishlist` (retrieves full wishlist with product details)
  - `GET /api/wishlist/ids` (returns array of wishlisted product IDs for fast O(1) icon checks)
  - `POST /api/wishlist` (idempotent addition)
  - `DELETE /api/wishlist/:productId` (removes product)
  - `POST /api/wishlist/move-to-cart/:productId` (atomic transfer from wishlist into cart)
  - `DELETE /api/wishlist` (clears wishlist)
- Frontend:
  - `WishlistProvider` & `useWishlist` hook (`client/src/context/WishlistContext.jsx`)
  - Dedicated Wishlist page (`/wishlist`)
  - Heart icon button on `ProductCard` and `ProductDetail` with live filled red state
  - Navbar & MobileMenu live Wishlist badge counter.

## Chunk 3.3 — Authenticated Reviews & Rating Engine (IMPLEMENTED)
Live user reviews with automated database rating recalculation:
- Table: `reviews` (`id`, `product_id`, `user_id`, `reviewer_name`, `rating`, `review_text`, `created_at`)
- Endpoints:
  - `POST /api/products/:productId/reviews` (authenticated review creation, bounds rating 1-5, text 5-2000 chars, duplicate prevention)
  - `GET /api/products/:productId/reviews/me` (retrieves current user's submitted review)
  - `DELETE /api/reviews/:reviewId` (author or admin deletion with rating recalculation)
- Rating Recalculation Engine:
  - Updates `products.rating` and `products.review_count` directly from SQL aggregates on every insert or delete.
- Frontend:
  - `ReviewModal` with 5-star interactive picker and review text
  - "Write a Review" button in `ReviewSection`
  - Inline review deletion for authors
  - Live rating distribution bar refresh on submission.

---

# 22. FUTURE CHECKOUT / ORDER FEATURES — PLANNED

After Section 3:

Section 4 — Checkout & Orders

Potential features:

Cart
 ↓
Checkout
 ↓
Address
 ↓
Order Summary
 ↓
Payment Simulation
 ↓
Order Confirmation
 ↓
Order History

Payment is initially expected to be a simulated academic flow.

Do not implement real financial payment processing unless explicitly requested.

---

# 23. FUTURE ML ROADMAP

The planned ML sequence is:

Section 4
Recommendation Data Pipeline

Section 5
NCF

Section 6
CNN Product Content Model

Section 7
GRU Session Recommendation

Section 8
Autoencoder / Cold Start

Section 9
Attention Fusion

Section 10
AI + Cartify Integration

Section 11
Admin Analytics

Section 12
Final Integration & Testing

---

# 24. NCF — PLANNED

NCF will primarily use:

user_id
product_id
interaction

Conceptually:

User
 ↓
Embedding
 ↓
Product Embedding
 ↓
Neural Collaborative Filtering
 ↓
Recommendation Score

Do not implement until the NCF section begins.

---

# 25. GRU — PLANNED

GRU will use chronological user behavior.

Important fields:

user_id
product_id
timestamp
session_id

Conceptually:

User
 ↓
Session
 ↓
Chronological products
 ↓
GRU
 ↓
Sequential preference embedding

Never randomly shuffle sequences before sequence modeling.

---

# 26. CNN — PLANNED

CNN will use product images/content.

Conceptually:

Product Image
      ↓
CNN
      ↓
Image/Product Embedding

The frontend product image architecture should therefore remain independent from the source dataset.

---

# 27. AUTOENCODER — PLANNED

Autoencoder may use sparse user-item interaction representations.

Conceptually:

User × Product Matrix
        ↓
Autoencoder
        ↓
Latent Representation

Do not create fake interactions merely to increase dataset size.

---

# 28. ATTENTION FUSION — PLANNED

Final hybrid architecture:

NCF Embedding
       +
GRU Embedding
       +
CNN Embedding
       +
Autoencoder Embedding
       ↓
Attention Fusion
       ↓
Final User/Product Representation
       ↓
Recommendation Ranking

Do not implement recommendation scores before the actual models exist.

---

# 29. PRODUCT / DATA QUALITY RULES

Never create fake-looking product data unnecessarily.

Rules:

- Avoid duplicate product images.
- Avoid duplicate product names.
- Do not randomly assign images.
- Do not randomly assign prices.
- Do not randomly assign ratings.
- Do not claim sample dataset prices are live market prices.
- Normalize public datasets before inserting them into PostgreSQL.
- Do not make the frontend depend directly on an external dataset/API.
- Keep product IDs stable.
- Never randomly map unrelated product IDs.
- Never create fake AI recommendations.

Architecture must remain:

Dataset
 ↓
Clean / Transform
 ↓
PostgreSQL
 ↓
Node/Express
 ↓
React

---

# 30. EXTERNAL DATASET RULES

If replacing the current dataset:

1. Do not immediately delete the existing dataset.
2. First create/import the new dataset separately.
3. Validate product counts and fields.
4. Validate product ID mappings.
5. Validate image availability.
6. Validate category mappings.
7. Validate prices.
8. Validate interactions.
9. Test application APIs.
10. Only then replace/activate the new catalogue.

Never randomly map products between unrelated datasets.

---

# 31. FRONTEND DESIGN RULES

Cartify should look like a premium modern e-commerce startup.

Design goals:

- professional
- clean
- responsive
- consistent
- accessible
- realistic
- easy to navigate

Avoid:

- excessive gradients
- excessive glassmorphism
- unnecessary animations
- random colors
- inconsistent spacing
- amateur layouts
- generic CRUD appearance

Do not redesign existing pages unless explicitly requested.

Reuse the existing design system and components.

---

# 32. SECURITY RULES

Always:

- hash passwords with bcrypt
- validate inputs server-side
- use parameterized SQL
- avoid SQL injection
- validate query parameters
- use JWT authentication appropriately
- never expose password hashes
- never expose JWT secrets
- never expose database credentials
- never expose stack traces in production API responses
- keep secrets in `.env`
- never commit `.env`
- maintain `.env.example` with placeholders

---

# 33. DATABASE MIGRATION RULES

When changing the database:

Prefer:

new additive SQL file

over destructive rewrites.

Use:

IF NOT EXISTS

where appropriate.

Preserve:

users
interactions
stable product IDs

where possible.

Use:

BEGIN
COMMIT
ROLLBACK

for data-modifying scripts.

Warn before destructive operations.

Never casually:

DROP DATABASE
DROP TABLE
DELETE all users

---

# 34. DEPENDENCY RULES

Do not add dependencies unnecessarily.

Before adding a dependency:

1. Check existing packages.
2. Check whether native functionality is sufficient.
3. Check whether the architecture actually requires it.

Current rules:

- No ORM unless explicitly justified.
- No axios unless explicitly justified.
- No React Query unless explicitly justified.
- No state-management library unless explicitly justified.

Keep:

package.json
package-lock.json

synchronized.

---

# 35. TESTING RULES

Before declaring a section complete, test both:

1. New functionality
2. Existing functionality

Existing functionality includes:

Registration
Login
Logout
Profile
Product loading
Search
Categories
Filters
Sorting
Product details
Database connectivity

Never assume previous functionality still works.

---

# 36. CLAUDE WORKFLOW RULES

Every Claude session:

1. Read CLAUDE.md first.
2. Inspect the relevant existing files.
3. Understand current implementation.
4. Reuse existing code.
5. Modify only what is necessary.
6. Do not rebuild the project.

---

# 37. NO FULL ZIP RULE

IMPORTANT:

Do NOT regenerate the entire project ZIP unless explicitly requested.

Default output must be:

New files
+
Modified files
+
Exact manual instructions
+
Commands to run
+
Testing checklist
+
Git commit message

Do NOT return unchanged files.

If an entire file genuinely needs replacement, clearly state:

REPLACE ENTIRE FILE

Otherwise provide targeted changes.

---

# 38. USER'S MANUAL-APPLY WORKFLOW

The current development workflow is:

Claude
 ↓
Analyze existing project
 ↓
Provide changed/new files
 ↓
User manually applies changes
 ↓
Run project
 ↓
Test
 ↓
Git diff
 ↓
Git commit
 ↓
Git push

Do not assume Claude should directly regenerate the entire project.

---

# 39. GIT WORKFLOW

After every completed section or major feature, provide a meaningful commit message.

Preferred format:

feat(section-N): <what was actually implemented>

For fixes:

fix(section-N): <what was fixed>

For refactoring:

refactor: <what was refactored>

Provide commands such as:

git status
git diff
git add <relevant files>
git commit -m "<commit message>"
git push origin main

Never include:

.env
secrets
credentials

in Git commits.

---

# 40. CLAUDE.MD UPDATE RULE

After every major change:

1. Update this file.
2. Change PLANNED → IMPLEMENTED only when actually completed.
3. Add new files.
4. Add new tables.
5. Add new API endpoints.
6. Add important architecture decisions.
7. Update current development status.
8. Update future roadmap if necessary.

Do this as part of the same feature completion.

Never leave the project memory outdated.

---

# 41. IMPORTANT ANTI-HALLUCINATION RULE

Do not invent:

- files
- endpoints
- tables
- components
- completed features
- architecture decisions
- database fields
- dataset mappings

If something is unclear:

1. Inspect the codebase if available.
2. Read CLAUDE.md.
3. State what is known.
4. Clearly identify uncertainty.

Do not assume that a previously discussed feature was implemented.

The actual codebase is the source of truth for implementation status.

CLAUDE.md is the source of truth for documented architecture and project decisions.

---

# 42. CURRENT DEVELOPMENT STATUS (REBUILD TRACK)

Rebuild Phase 1A — Database Foundation
STATUS: COMPLETE — PostgreSQL clean schema established (9 tables, 3 ENUMs, dataset-agnostic product model, telemetry interactions, constraints, indexes, 3 actor accounts, 8 categories). Verified 100% (26/26 tests passed).

Rebuild Phase 1B — Amazon Dataset Preprocessing (Refined)
STATUS: COMPLETE — Hierarchical multi-level category classification and cased brand boundary matching executed. Validated and accurately mapped 16,976 clean products into `data/processed/amazon-products-clean.csv` + `data/processed/preprocessing-report.json`. Verified 100% (12/12 tests passed).

Rebuild Phase 1C — Amazon Dataset Import (Refined)
STATUS: COMPLETE — Re-imported 16,976 verified products into PostgreSQL with tsvectors in 4.71s. Passed 13/13 database verification tests and 10/10 API smoke tests (100%). Audited 35 multi-category sample products with 100% category purity.

Rebuild Phase 1D.1 — Backend / API Foundation
STATUS: COMPLETE — Layered architecture established (`Route -> Controller -> Service -> Model -> Database`), connection pooling with graceful shutdown, centralized error handling, request validators, product & category APIs, PostgreSQL tsvector search, and JWT RBAC foundation. Verified 100% (26/26 tests passed).

Rebuild Phase 1D.2A — Cart API
STATUS: COMPLETE — Production authenticated Cart API implemented with user isolation, stock validation, atomic conflict updates, and database price authority. Verified 100% (21/21 tests passed).

Rebuild Phase 1D.2B — Wishlist API
STATUS: COMPLETE — Authenticated Wishlist API implemented with user isolation, idempotent additions, lightweight check/ids endpoints, move-to-cart operations, and 100% test coverage (21/21 tests passed).

Rebuild Phase 1D.2C — Reviews & Ratings API
STATUS: COMPLETE — Authenticated reviews and ratings API implemented with database uniqueness constraint (`user_id`, `product_id`), rating summaries, rating breakdown distributions, owner edit/delete security, and 28/28 tests passed.

Rebuild Phase 1D.2D — Orders & Checkout API
STATUS: COMPLETE — ACID transactional checkout implemented (`BEGIN ... COMMIT/ROLLBACK`), snapshot unit prices, atomic stock decrements and cancellation restorations, payment prototype states, verified purchase link, and 30/30 tests passed.

Rebuild Phase 1D.2E — Telemetry & Interaction Ingestion API
STATUS: COMPLETE — Two-tier telemetry pipeline implemented (`POST /api/interactions` + trusted service hooks), metadata sanitization, and 25/25 tests passed.

Rebuild Phase 1D.3 — RBAC Console APIs (Admin & Content Manager)
STATUS: COMPLETE — Role-based console endpoints for ADMIN and CONTENT_MANAGER implemented, catalogue health, real analytics, uninitialized model status/metrics contracts, internal products (`source='internal'`), audit logging, and 34/34 tests passed.

Rebuild Phase 1D.4 — Final Backend & API Verification
STATUS: COMPLETE — End-to-end audit, security hardening, and cross-actor regression verification passed 100% across all 8 test suites (220/220 tests passed). Phase 1 Core Backend Foundation is fully verified and locked.

==================================================
PHASE 1 (CORE FOUNDATION & BACKEND) STATUS: COMPLETE
==================================================

Phase 2A — Cartify Design System + Global Frontend Layout
STATUS: COMPLETE — Design tokens established in `tailwind.config.js` and `index.css`, typography hierarchy, color tokens, reusable UI primitives (`Button`, `Input`, `Select`, `Badge`, `Card`, `Container`, `SectionHeader`, `Skeleton`, `EmptyState`, `ErrorState`, `Toast`, `Modal`), redesigned global `Navbar` with role-aware navigation, redesigned `MobileMenu`, and 4-column `Footer`. Frontend build passed without errors.

Phase 2B — Home Page Redesign
STATUS: COMPLETE — Redesigned shopper landing page with Hero discovery and quick search, real PostgreSQL-backed Featured Picks (`sort=featured`), Popular Picks (`sort=popular`), New Arrivals (`sort=newest`), Department navigation, transparent AI recommendation architecture teaser with community fallback, and local session Recently Viewed history. Frontend build passed with zero errors.

Phase 2C — Product Catalogue & Discovery Redesign
STATUS: NOT STARTED

Phase 2D — Product Details & Reviews Redesign
STATUS: NOT STARTED

Phase 2E — User Profile & Order History Redesign
STATUS: NOT STARTED

Phase 2F — Shopping Cart & Wishlist Redesign
STATUS: NOT STARTED

Phase 2G — Checkout & Order Confirmation Redesign
STATUS: NOT STARTED

Phase 2H — Admin Operational Dashboard Redesign
STATUS: NOT STARTED

Phase 2I — Content Manager Console Redesign
STATUS: NOT STARTED

Phase 2J — Responsive Layout & Polish
STATUS: NOT STARTED

Phase 2K — Final Visual QA & Verification
STATUS: NOT STARTED

Phase 3 — Simulated Checkout Transactions & Accounting
STATUS: PLANNED

Phase 4 — Operational Consoles & Content Control
STATUS: PLANNED

Phase 5 — Telemetry Export & Multi-Model Recommendation Pipeline (NCF + CNN + GRU + Autoencoder + Attention Fusion)
STATUS: PLANNED

Section 6 — CNN
STATUS: NOT STARTED

Section 7 — GRU
STATUS: NOT STARTED

Section 8 — Autoencoder
STATUS: NOT STARTED

Section 9 — Attention Fusion
STATUS: NOT STARTED

Section 10 — AI + Cartify Integration
STATUS: NOT STARTED

Section 11 — Admin Analytics
STATUS: NOT STARTED

Section 12 — Final Integration & Testing
STATUS: NOT STARTED

Phase 2.0 — Premium Frontend Foundation + Global Shell
STATUS: COMPLETE — Approved "Intelligent Minimalist Luxury" visual foundation implemented. Design tokens in tailwind.config.js and index.css, Plus Jakarta Sans + Inter typography hierarchy, 8-pt spacing rhythm, container system, rebuilt frosted sticky Navbar, touch-friendly MobileMenu, 4-column editorial Footer, and refined UI primitives (Button, Input, Select, Badge, Card, Container, SectionHeader, Skeleton, EmptyState, ErrorState, Toast).

---

# 43. CURRENT NEXT STEP

Phase 2.1 — Home Page Redesign
STATUS: NOT STARTED

The immediate next task when instructed will be:
Rebuilding the Home Page (editorial hero with live featured spotlight, curated department discovery pills, real PostgreSQL-backed featured/popular shelves, telemetry-ready AI recommendation teaser slot, and session recently viewed items).

---

# 44. GOLDEN RULE

Cartify is one continuously evolving project.

NEVER:

"Let's create a new project."

ALWAYS:

"Let's inspect the existing Cartify implementation and extend it without breaking previous work."

Build incrementally.

Preserve working functionality.

Keep architecture modular.

Keep dataset-specific logic isolated.

Keep ML modular.

Keep CLAUDE.md updated.

Never claim planned work is implemented.