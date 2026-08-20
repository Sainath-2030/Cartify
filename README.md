# Cartify — Section 1: Onboarding, Authentication & Foundation

**Shop Smarter, Not Harder.**

This is Section 1 of the Cartify AI-powered e-commerce platform: project
foundation, authentication, and profile management. It does **not** include
product catalogue, cart, search, or any of the recommendation models —
those are built in later sections.

---

## What's in Section 1

- Project scaffolding for a React (Vite) client and a Node/Express server, cleanly separated.
- A premium, responsive landing page matching the Cartify brand.
- Registration with full client- and server-side validation (Indian mobile number format, password strength, etc.).
- Login with JWT-based authentication.
- A protected profile page with view/edit functionality.
- PostgreSQL schema for `users`, plus an `interactions` table that is the foundation for the future recommendation engine.
- A clean, layered REST API (routes → controllers → services → models).

## Architecture at a glance

```
Client (React + Vite + Tailwind)
   │  fetch() with JWT in Authorization header
   ▼
Server (Express)
   routes → validate → controllers → services → models
   │
   ▼
PostgreSQL (users, interactions)
```

- **Routes** only wire URLs to controllers and middleware.
- **Controllers** handle req/res and delegate business logic to services.
- **Services** contain the actual logic (hashing passwords, issuing JWTs, enforcing uniqueness, etc.).
- **Models** are the only layer that talks to PostgreSQL, using parameterized queries.
- **Middleware** covers JWT verification (`requireAuth`), body validation, and centralized error handling.

Authentication is stateless JWT: on login/register the server signs a token
containing the user id, and the client stores it (in `localStorage`) and
sends it as `Authorization: Bearer <token>` on protected requests. Logout is
mainly a client-side action (discarding the token); the `/api/auth/logout`
endpoint exists for a consistent API contract and to leave room for future
token-blocklisting if needed.

## How this prepares Cartify for the recommendation engine

The `interactions` table is deliberately built now, even though nothing
writes to it yet:

- `user_id`, `product_id`, `interaction_type` (`view`, `click`, `search`,
  `wishlist`, `cart`, `purchase`, `rating`, `review`) — this is exactly the
  shape **Neural Collaborative Filtering** needs.
- `session_id` + `created_at` ordering — this is what **GRU-based session
  modeling** will read to reconstruct a browsing sequence
  (e.g. Laptop → Mouse → Keyboard → Headset).
- `metadata` is JSONB, so future interaction types or model-specific fields
  (e.g. CNN content-feature references, autoencoder cold-start flags) can be
  added without a schema migration.
- `product_id` intentionally has **no foreign key yet**, since the
  `products` table doesn't exist until Section 2. The exact `ALTER TABLE`
  needed to wire it up is documented as a comment in `database/schema.sql`.

Nothing here fakes or hardcodes AI behavior — the "Recommended For You"
section on the homepage is a clearly-labeled visual placeholder, not a
working recommender.

## Project structure

```
cartify/
├── client/            # React + Vite + Tailwind frontend
│   └── src/
│       ├── components/  # Button, Input, Navbar, Footer, Modal, Loader, Toast, FormField, ProductCard...
│       ├── pages/        # Home, Login, Signup, Profile, NotFound
│       ├── layouts/      # MainLayout
│       ├── services/     # api.js, authService.js, userService.js
│       ├── hooks/        # useAuth, useToast
│       ├── context/      # AuthContext, ToastContext
│       └── utils/        # validators.js
├── server/            # Node + Express backend
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── models/
│   ├── validators/
│   ├── config/          # db.js (PostgreSQL pool)
│   └── utils/            # jwt.js, asyncHandler.js
├── database/
│   ├── schema.sql
│   └── seed.sql
├── .env.example
└── README.md
```

## API endpoints (Section 1)

| Method | Path                | Auth required | Description                         |
|--------|----------------------|:---:|--------------------------------------|
| POST   | `/api/auth/register`| No  | Create a new account, returns a JWT |
| POST   | `/api/auth/login`    | No  | Log in, returns a JWT               |
| POST   | `/api/auth/logout`   | No  | Stateless logout acknowledgment     |
| GET    | `/api/users/me`      | Yes | Get the logged-in user's profile    |
| PUT    | `/api/users/me`      | Yes | Update the logged-in user's profile |

---

## Setup instructions

### 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ running locally (or a connection string to a hosted instance)

### 2. Install dependencies

```bash
cd cartify/server
npm install

cd ../client
npm install
```

### 3. Create the PostgreSQL database

```bash
createdb cartify_db
# or, inside psql:
# CREATE DATABASE cartify_db;
```

### 4. Configure environment variables

```bash
cd cartify
cp .env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`:

```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/cartify_db
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

`client/.env` only needs:

```
VITE_API_URL=http://localhost:5000/api
```

### 5. Run the database schema

```bash
psql -d cartify_db -f database/schema.sql
# optional demo data:
psql -d cartify_db -f database/seed.sql
```

### 6. Start the backend

```bash
cd server
npm run dev
# API available at http://localhost:5000/api
```

### 7. Start the frontend

```bash
cd client
npm run dev
# App available at http://localhost:5173
```

### 8. Test registration

Open `http://localhost:5173/signup`, fill in the form (try an invalid email
or a weak password first to see inline validation), and submit. You should
be redirected to your profile page and see a success toast.

### 9. Test login

Log out from the profile page, then go to `/login` and sign in with the
same credentials.

### 10. Test profile

On `/profile`, click **Edit Profile**, change a field (e.g. city), and
**Save Changes** — it should persist after a page refresh.

### 11. Test logout

Click **Logout** from the navbar or profile sidebar. You should be returned
to the homepage and redirected to `/login` if you try to visit `/profile`
again.

---

## What's intentionally NOT in Section 1

Per the project roadmap, none of the following are implemented yet:
NCF, CNN, GRU, Autoencoder, Attention Fusion, product recommendations,
product catalogue, search/filtering, cart/wishlist functionality, payments,
order processing, or a full admin dashboard. These arrive in Sections 2–12.

---

# Section 2: Product Catalogue & Product Discovery

Section 2 extends the Section 1 foundation — same auth, same database
connection, same design system — with a full product catalogue.

## What's new in Section 2

- `categories` and `products` tables, plus a `reviews` table for the
  review display layer, and the Section 1 `interactions` table is now
  wired to `products` via a foreign key.
- 8 categories, 70 realistic seeded products (well above the 30–50
  target), and sample reviews.
- REST APIs for listing/searching/filtering/sorting products, browsing
  categories, and recording discovery interactions.
- Pages: `/products` (catalogue), `/products/:slug` (product detail),
  `/categories` (all categories), `/category/:slug` (single category).
- Combinable filters (category, brand, price range, rating, availability),
  6 sort modes, server-side pagination, and PostgreSQL full-text search.
- A real product image gallery, specifications tab, seller info, and a
  review display section (average rating, breakdown bars, sample reviews).
- Guest-safe interaction tracking (`product_view`, `product_click`,
  `search`, `category_view`) recorded for logged-in users only — the
  exact shape the future NCF/GRU models will consume.
- Loading skeletons, empty states, and error states with retry, used
  consistently across every data-driven page.

## New/updated API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List products — supports `page`, `limit`, `category`, `brand`, `minPrice`, `maxPrice`, `rating`, `inStock`, `sort` |
| GET | `/api/products/search` | Search — same filters plus required `q` |
| GET | `/api/products/brands` | Distinct brand list, optionally `?category=slug` |
| GET | `/api/products/slug/:slug` | Full product detail (gallery, specs, reviews, related products) |
| GET | `/api/products/:id` | Product detail by numeric id |
| GET | `/api/categories` | All categories with live product counts |
| GET | `/api/categories/:slug` | Single category |
| GET | `/api/categories/:slug/products` | Products in a category (same filters as `/api/products`) |
| POST | `/api/interactions` | Record a discovery interaction (optional auth — guests are accepted but only persisted for logged-in users) |

## Setup: applying the Section 2 changes to an existing Section 1 install

If you already have Section 1 running, you only need to add the new
schema/seed data — no changes to your `.env` files are required.

```bash
cd cartify
psql -d cartify_db -f database/schema_section2.sql
psql -d cartify_db -f database/seed_section2.sql
```

Then restart the backend (`npm run dev` in `server/`) so it picks up the
new routes, and refresh the frontend — no new frontend dependencies were
added, so `npm install` in `client/` is not required unless you're setting
up from scratch.

### Setting up from scratch (Section 1 + Section 2 together)

```bash
cd cartify/server && npm install
cd ../client && npm install
createdb cartify_db
psql -d cartify_db -f ../database/schema.sql
psql -d cartify_db -f ../database/schema_section2.sql
psql -d cartify_db -f ../database/seed.sql            # optional demo user
psql -d cartify_db -f ../database/seed_section2.sql    # categories + products
```
Then configure `.env` files as described in the Section 1 instructions
above, and start both `npm run dev` processes.

## Manual testing checklist

- [ ] `/products` loads with 12 products and correct "Showing X-Y of Z"
- [ ] Clicking a category in the sidebar filters the grid
- [ ] Setting min/max price filters correctly
- [ ] Selecting a rating (e.g. "4 & up") filters correctly
- [ ] Selecting a brand filters correctly
- [ ] Combining category + brand + price + rating narrows results further
- [ ] Each sort option changes product order
- [ ] Pagination moves between pages and disables Prev/Next at the ends
- [ ] Searching from the navbar goes to `/products?q=...` with matching results
- [ ] Searching a nonsense term shows the "No products found" empty state
- [ ] `/categories` shows all 8 categories with live product counts
- [ ] Clicking a category card opens `/category/:slug` with its own filters
- [ ] `/products/:slug` shows gallery, price, rating, specs, seller info, reviews
- [ ] Clicking thumbnails swaps the main image
- [ ] An invalid slug (e.g. `/products/does-not-exist`) shows a clean "Product not found" state, not a crash
- [ ] Logged-in product views appear as rows in the `interactions` table (`SELECT * FROM interactions ORDER BY created_at DESC LIMIT 5;`)
- [ ] Mobile viewport: filters open in a bottom drawer, grid becomes 2 columns
- [ ] Section 1 still works: signup, login, profile edit, logout unaffected

## What's intentionally NOT in Section 2

NCF, CNN, GRU, Autoencoder, Attention Fusion, AI recommendation ranking,
checkout/payment, order management, a complete cart/wishlist system, admin
dashboard, and model training are all out of scope — reserved for later
sections. The "Personalized For You" section on the homepage and the
Add to Cart / Wishlist / Buy Now buttons are clearly labeled placeholders.
