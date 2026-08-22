# Cartify — Project Instructions for Claude

## 1. Project Overview

Cartify is an AI-powered e-commerce web application being developed as an academic research/project implementation.

### Product Name

Cartify

### Tagline

Shop Smarter, Not Harder.

### Project Goal

Cartify provides a modern e-commerce shopping experience and will eventually integrate a hybrid deep-learning recommendation engine.

The final system will personalize product recommendations using multiple machine-learning models instead of relying on a single recommendation algorithm.

---

# 2. Core Project Architecture

The current architecture is:

React Frontend
        ↓
Node.js + Express API
        ↓
PostgreSQL Database

The future AI recommendation architecture will be:

React Frontend
        ↓
Node.js / Express API
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

The AI models should eventually be integrated as modular services rather than tightly coupling ML code with the React frontend.

---

# 3. Technology Stack

## Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- Tailwind CSS if already used in the existing implementation
- Lucide React or existing icon library

## Backend

- Node.js
- Express.js

## Database

- PostgreSQL

## API

- REST API
- JSON

## Authentication

- JWT
- bcrypt

## Future Machine Learning

- Python
- PyTorch
- TensorFlow/Keras where appropriate
- NumPy
- Pandas
- Scikit-learn where appropriate

## Development

- VS Code
- Git
- GitHub
- Postman
- PostgreSQL / pgAdmin

---

# 4. IMPORTANT DEVELOPMENT RULE

Cartify is being developed SECTION BY SECTION.

Never rebuild the entire project when implementing a new section.

Always inspect the existing codebase first.

Before making changes:

1. Understand the current architecture.
2. Identify which files already implement the required functionality.
3. Reuse existing components/services/models.
4. Modify existing files only when necessary.
5. Create new files only when they provide a clear architectural benefit.
6. Preserve working functionality from previous sections.

Do NOT create a second implementation of something that already exists.

---

# 5. Completed Sections

## Section 1 — User Onboarding & Authentication

COMPLETED.

Includes:

- Landing/home page
- User registration
- Login
- Logout
- JWT authentication
- bcrypt password hashing
- Protected routes
- User profile
- PostgreSQL user storage
- Basic interaction database structure

Do not break any of these features.

---

## Section 2 — Product Catalogue & Product Discovery

COMPLETED.

Includes:

- Product database
- Categories
- Product catalogue
- Product cards
- Product details
- Product image gallery
- Search
- Filtering
- Sorting
- Pagination
- Category pages
- Product ratings
- Product reviews display
- Stock status
- Basic product interaction tracking
- Premium responsive UI

The current product dataset is being improved to look realistic and internally consistent.

---

# 6. Current Development Status

The project currently has:

Section 1:
DONE

Section 2:
DONE

Current data-quality improvement:
IN PROGRESS / BEFORE SECTION 3

The product catalogue should contain realistic and coherent products.

A product's:

- name
- brand
- image
- category
- description
- specifications
- price
- rating

must describe the SAME product.

Do not generate random product/image/brand combinations.

---

# 7. Product Data Rules

Product data is extremely important because it will eventually be used by the recommendation system.

Never use randomization for:

- Product images
- Product names
- Brands
- Prices
- Ratings
- Discounts

Avoid repeated primary images wherever possible.

Use product-specific images.

Do not claim that sample/public dataset prices are live market prices.

If using a public dataset, treat it as source/catalogue data and clean/normalize it before storing it in PostgreSQL.

Do not scrape commercial websites such as Amazon, Flipkart or Myntra.

Do not make the frontend dependent on an external product API at runtime.

The architecture should remain:

Public Dataset
      ↓
Cleaning / Transformation
      ↓
PostgreSQL
      ↓
Node / Express
      ↓
React

---

# 8. Database Principles

PostgreSQL is the source of truth for Cartify application data.

Important entities include:

- users
- categories
- products
- interactions
- reviews
- future orders
- future recommendations

Product IDs must remain stable.

Do not regenerate product IDs unnecessarily.

This is important because future ML models will use:

user_id + product_id

and:

user_id + product_id + timestamp

---

# 9. Interaction Data

Interaction tracking is a critical part of Cartify.

The system should eventually capture events such as:

- product_view
- product_click
- search
- category_view
- wishlist
- cart
- purchase
- rating
- review

Interaction records should contain, where applicable:

- user_id
- product_id
- interaction_type
- timestamp
- session_id
- metadata

This data will eventually be used for recommendation models.

Do not create fake AI recommendations from interaction data.

---

# 10. Future Recommendation Architecture

Cartify's research component will use a hybrid recommendation architecture.

## NCF — Neural Collaborative Filtering

Purpose:

Learn user-product interaction patterns.

Input examples:

- clicks
- views
- ratings
- wishlist
- cart
- purchases

Output:

User-product preference score.

---

## CNN — Product Content/Image Model

Purpose:

Extract meaningful product features from:

- product images
- descriptions
- reviews/content where appropriate

Output:

Product feature representation.

---

## GRU — Session Recommendation

Purpose:

Understand sequential browsing behavior.

Example:

Laptop
→ Mouse
→ Keyboard
→ Headset

The GRU should learn relationships between sequential interactions.

---

## Autoencoder — Cold Start

Purpose:

Handle situations where there is limited interaction data.

Examples:

- New user
- New product
- Sparse interaction history

---

## Attention Fusion Layer

Purpose:

Combine outputs from:

NCF
CNN
GRU
Autoencoder

The attention mechanism should dynamically determine the importance of different model outputs.

Final output:

Ranked personalized product recommendations.

---

# 11. Future Development Roadmap

## Section 3

Shopping Experience & User Interactions

Planned:

- Shopping cart
- Add/remove products
- Quantity management
- Cart total
- Wishlist
- Wishlist page
- Recently viewed
- Product rating submission
- Review submission
- More detailed interaction tracking

---

## Section 4

Recommendation Data Pipeline

Planned:

- Dataset preparation
- Interaction preprocessing
- Cleaning
- Encoding users/products
- Session construction
- Train/validation/test split
- Feature preparation
- ML-ready data pipeline

---

## Section 5

NCF Recommendation Model

Implement and evaluate Neural Collaborative Filtering.

---

## Section 6

CNN Product Content Model

Implement product image/content feature extraction.

---

## Section 7

GRU Session Recommendation

Implement sequential/session-based recommendation.

---

## Section 8

Autoencoder Cold-Start Model

Implement cold-start recommendation support.

---

## Section 9

Attention Fusion / Hybrid Recommendation Engine

Combine:

NCF
+
CNN
+
GRU
+
Autoencoder

using an Attention Fusion Layer.

---

## Section 10

AI + Cartify Integration

Integrate the recommendation engine into the web application.

Add:

- Recommended For You
- Similar Products
- Personalized Home Page
- Session-based recommendations
- Personalized product ranking

---

## Section 11

Admin Analytics

Planned:

- Recommendation metrics
- Precision@K
- Recall@K
- NDCG@K
- Hit Ratio
- Model monitoring
- Dataset monitoring
- Recommendation statistics

---

## Section 12

Final Integration & Testing

Includes:

- End-to-end testing
- ML evaluation
- API testing
- Frontend testing
- Security testing
- Performance testing
- Responsive testing
- Deployment preparation

---

# 12. Frontend Design Rules

Cartify must look like a real modern e-commerce startup.

The UI should be:

- Premium
- Professional
- Clean
- Responsive
- Modern
- Consistent
- Easy to navigate

Avoid:

- Amateur-looking layouts
- Excessive gradients
- Excessive glassmorphism
- Excessive animations
- Random colors
- Inconsistent spacing
- Generic CRUD appearance

Maintain the existing Cartify design system.

Do not redesign existing pages unless specifically requested.

---

# 13. Backend Architecture Rules

Keep backend code modular.

Prefer:

server/
├── controllers/
├── routes/
├── services/
├── models/
├── middleware/
├── validators/
├── config/
└── utils/

Do not place the entire backend implementation inside:

server.js

Use:

Routes
→ Controllers
→ Services
→ Database layer

where appropriate.

---

# 14. Frontend Architecture Rules

Keep React modular.

Prefer:

client/src/
├── components/
├── pages/
├── layouts/
├── services/
├── hooks/
├── context/
├── utils/
└── assets/

Use reusable components.

Examples:

- Navbar
- Footer
- ProductCard
- ProductGrid
- SearchBar
- FilterSidebar
- Button
- Input
- Loader
- EmptyState
- ErrorState

Do not duplicate components unnecessarily.

---

# 15. API Rules

Use REST APIs.

Use consistent response structures.

Successful response:

{
  "success": true,
  "data": ...
}

Error response:

{
  "success": false,
  "message": "Something went wrong"
}

Use appropriate HTTP status codes.

Do not expose:

- passwords
- password hashes
- JWT secrets
- database credentials
- stack traces

---

# 16. Environment Variables

Never hardcode secrets.

Use:

.env

for local secrets.

Never commit:

.env

to GitHub.

Maintain:

.env.example

with placeholder values.

Example:

DATABASE_URL=
JWT_SECRET=
PORT=

---

# 17. Security Rules

Always:

- Hash passwords using bcrypt.
- Use JWT securely.
- Validate input.
- Use parameterized SQL / safe database access.
- Validate API parameters.
- Avoid SQL injection.
- Avoid exposing sensitive information.
- Keep secrets in environment variables.

---

# 18. Git Rules

GitHub is the permanent source of truth and backup.

Before implementing a major section:

1. Ensure the current project works.
2. Commit the current version.
3. Create a meaningful checkpoint/tag if appropriate.

Example:

git commit -m "Complete Section 2 - Product Catalogue and Discovery"

Tags may be used:

section-1-complete
section-2-complete
section-3-complete
ncf-complete
cnn-complete
gru-complete
autoencoder-complete
attention-fusion-complete

Never intentionally delete previous working functionality.

---

# 19. Dependency Rules

Do not add a new dependency unless it is actually necessary.

Before adding a dependency:

1. Check whether the existing project already provides equivalent functionality.
2. Prefer stable and widely used packages.
3. Avoid unnecessary libraries.
4. Check compatibility with the existing stack.

If package.json changes, make sure package-lock.json is updated.

---

# 20. Database Migration Rules

Do not casually delete production-style data or tables.

When changing the database:

- Prefer migrations/schema updates.
- Preserve existing users.
- Preserve existing interactions where possible.
- Preserve stable product IDs where possible.
- Use transactions for large data modifications.

Before destructive database operations, clearly warn about them.

---

# 21. ML Development Rules

The ML recommendation system should remain modular.

Do not put model-training code inside React.

Do not put large Python ML logic directly inside Node.js.

Prefer a separate ML/recommendation service.

Potential architecture:

client
   ↓
Node/Express
   ↓
Recommendation API
   ↓
Python ML service
   ↓
PyTorch models
   ↓
Recommendations

The exact implementation can evolve later.

---

# 22. Dataset Rules

Training data should be separated from application source code where appropriate.

Do not commit very large datasets or trained model binaries to GitHub unnecessarily.

Prefer:

datasets/
models/

with documentation or download/setup instructions where appropriate.

---

# 23. Testing Rules

Before declaring a section complete, test existing functionality as well as new functionality.

At minimum verify:

- Registration
- Login
- Logout
- Profile
- Product loading
- Search
- Categories
- Filters
- Sorting
- Product details
- Database connectivity

Then test the newly implemented section.

Do not assume that because the new feature works, the old features still work.

---

# 24. Important Rule for New Sections

When asked to implement a new section:

First:

1. Inspect the existing project.
2. Determine what already exists.
3. Determine what must be added.
4. Identify possible conflicts.
5. Implement the section.
6. Preserve previous sections.
7. Test integration.
8. Report modified/new files.
9. Provide setup commands only when necessary.

Do not restart from scratch.

Do not create a second Cartify project.

Do not duplicate existing functionality.

---

# 25. Current Section

Current development stage:

PRODUCT DATA QUALITY UPGRADE

The immediate goal is to improve the product catalogue so that:

- Images are not unnecessarily repeated.
- Products match their images.
- Brands match products.
- Prices are realistic and coherent.
- Discounts are mathematically correct.
- Ratings are plausible.
- Categories are consistent.
- Product descriptions match products.
- Product specifications are relevant.
- Product IDs remain stable.

After this is complete and tested:

NEXT SECTION = Section 3 — Shopping Experience & User Interactions

---

# 26. Claude Response Style

When implementing code:

- Be concise.
- Do not repeatedly explain the entire project.
- Focus on the requested section.
- Inspect existing code before changing it.
- Clearly identify files created/modified.
- Provide complete code when files need to be replaced.
- Do not provide pseudo-code when actual implementation is requested.
- Do not implement future sections unless explicitly requested.

Before making major architectural changes, explain the reason briefly.

---

# 27. Golden Rule

Cartify is an evolving single project.

Every new section must build on the existing codebase.

NEVER:

"Let's create a new project."

Instead:

"Let's inspect the existing Cartify implementation and extend it."

The goal is one continuously evolving application:

Section 1
→ Section 2
→ Section 3
→ Section 4
→ NCF
→ CNN
→ GRU
→ Autoencoder
→ Attention Fusion
→ Final Cartify AI Platform