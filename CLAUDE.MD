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
│
├── layouts/
│   └── MainLayout
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

Current routes:

/
 /login
 /signup
 /products
 /products/:slug
 /categories
 /category/:slug
 /profile
 *

`/profile` is protected.

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
│   ├── authMiddleware
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
created_at
updated_at

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

# 13. CURRENT PRODUCT DATA — IMPLEMENTED

Current catalogue contains approximately:

95 products
8 categories

Current product data originated primarily from DummyJSON, with some hand-authored products for categories not adequately covered by it.

Important:

DummyJSON is NOT used by the running frontend.

The data was transformed into Cartify's own PostgreSQL structure.

Current product characteristics:

- unique primary images
- unique product names
- normalized prices
- product metadata
- ratings
- stock
- categories

Current prices derived from DummyJSON are illustrative and must NOT be described as live market prices.

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

# 21. FUTURE SHOPPING FEATURES — PLANNED

## Section 3 — Shopping Experience & User Interactions

NOT IMPLEMENTED.

Planned:

### Cart

- Add to cart
- Remove
- Quantity update
- Cart total
- Stock validation
- Cart persistence

### Wishlist

- Add/remove
- Wishlist page
- Wishlist count
- Move to cart

### Recently Viewed

- Track viewed products
- Display recently viewed products

### Reviews

- Submit review
- Edit own review
- Delete own review
- Rating validation
- Recalculate product rating from real review rows

Never hardcode ratings from the frontend.

### Expanded interactions

Planned interaction types:

wishlist_add
wishlist_remove
cart_add
cart_remove
cart_quantity_update
rating
review

No checkout/payment in Section 3.

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

# 42. CURRENT DEVELOPMENT STATUS

Section 1 — Authentication
STATUS: COMPLETE

Section 2 — Product Catalogue & Discovery
STATUS: COMPLETE

Section 2.5 — Product Data Quality
STATUS: COMPLETE

Dataset-Agnostic Architecture Audit
STATUS: COMPLETE

Dataset-Agnostic Refactor
STATUS: NOT YET IMPLEMENTED

H&M Dataset Integration
STATUS: NOT STARTED

Section 3 — Shopping Experience
STATUS: NOT STARTED

Section 4 — Recommendation Data Pipeline
STATUS: NOT STARTED

Section 5 — NCF
STATUS: NOT STARTED

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

---

# 43. CURRENT NEXT STEP

The immediate architectural task is:

Dataset-Agnostic Refactor

Specifically:

Phase A
Database + Backend

↓

Phase B
API + Frontend

↓

Phase C
Future Dataset Import

After that:

Section 3
Shopping Experience & User Interactions

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