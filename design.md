# Cartify — Design System

**Status:** Reference design language for the storefront, distilled from the provided reference screenshot.
**Scope:** Visual theme only (color, type, spacing, components). Not an implementation change — pair this with a scoped follow-up task when you're ready to apply it across `client/`.

This file is meant to sit alongside `CLAUDE.md` as a second permanent reference: CLAUDE.md governs *architecture*, this file governs *how it looks*. Every new page or component should be checked against this doc before being merged.

---

## 1. Direction

Cartify moves from its current light, blue-accent storefront to a **premium dark commerce** look: near-black surfaces, a single high-contrast lime accent reserved for "things that need attention" (sales, active state, selected filters), and a quiet, confident grid of product cards. The mood is closer to a flagship tech/gadget retailer than a general marketplace — minimal chrome, generous negative space, one accent color doing all the work.

**Non-negotiables carried from the reference:**
- Background is dark and mostly flat — no gradients, no glassmorphism.
- Exactly one accent color (lime/chartreuse), used sparingly and consistently for the same categories of thing every time.
- Cards are dark-on-dark with a hairline border, not shadows — depth comes from subtle elevation in surface color, not drop-shadow.
- Filter chips and tabs are pill-shaped; product cards are soft-rounded rectangles. Two radii, not more.

---

## 2. Color

Named tokens — map these onto Tailwind's `theme.extend.colors` (see §7).

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#0B0B0D` | Page background, navbar background |
| `bg-surface` | `#17171A` | Product cards, filter panel, modals |
| `bg-elevated` | `#202024` | Hover/active surface, dropdowns, input fields |
| `border-subtle` | `#2A2A2E` | Card borders, dividers, pill chip borders |
| `border-strong` | `#3A3A40` | Hover border, focused input border |
| `accent` | `#D7FF3D` | Sale badges, active tab underline, checked checkboxes, primary CTA fill |
| `accent-ink` | `#0B0B0D` | Text/icon color *on top of* the accent (never white-on-lime) |
| `text-primary` | `#F5F5F7` | Headings, product names, prices |
| `text-secondary` | `#9A9AA1` | Brand labels, breadcrumbs, helper text |
| `text-tertiary` | `#67676D` | Disabled state, placeholder text |
| `danger` | `#FF6B6B` | Out-of-stock, destructive actions, error text |
| `success` | `#7CE38B` | In-stock confirmation, success toasts |

**Rules:**
- `accent` is never used for large fills (no lime buttons that span a whole row) or for plain body text — it marks a small, specific thing: a badge, a checkbox, an active underline, an icon button.
- Never place white text directly on `accent`; use `accent-ink` (near-black) for contrast and legibility (AA-safe).
- Only one elevation step at a time — a card sitting on `bg-base` uses `bg-surface`; a dropdown *inside* that card uses `bg-elevated`. Don't skip a level.

---

## 3. Typography

Keep the existing type family — **Inter** — already loaded in `client/index.html`. It's a clean geometric grotesque that reads well at both display and UI sizes, so no second typeface is needed.

| Role | Size / Line-height | Weight | Tracking |
|---|---|---|---|
| Display (page hero, "Bestsellers") | 40px / 1.1 | 800 (extrabold) | -0.02em |
| Section heading | 24px / 1.25 | 700 (bold) | -0.01em |
| Card title / product name | 14px / 1.4 | 500 (medium) | normal |
| Body | 14px / 1.5 | 400 (regular) | normal |
| Label / eyebrow (brand name above product title) | 12px / 1.3 | 500 (medium) | 0.02em, sentence case — **not all-caps** |
| Price (primary) | 16px / 1.2 | 700 (bold) | normal |
| Price (strikethrough/compare-at) | 13px / 1.2 | 400, `text-tertiary` | normal |
| Micro (rating count, filter counts) | 12px / 1.3 | 400, `text-secondary` | normal |

**Rules:**
- Sentence case everywhere. No tracked-out all-caps labels — the reference uses simple sentence-case tab labels ("All items", "Smartphones") and this should carry through the whole app.
- One weight jump per hierarchy step is enough (400 → 500 → 700 → 800); don't introduce 600 as a separate step.
- Line length for body copy (product descriptions, review text) stays under 70–75 characters — constrain with `max-w-prose` or an explicit `max-w-[65ch]`.

---

## 4. Spacing & Layout

Base unit: **4px**, following Tailwind's default scale — don't introduce a custom spacing scale, just use it consistently.

| Context | Value |
|---|---|
| Page horizontal padding (mobile) | 20px (`px-5`) |
| Page horizontal padding (desktop) | 32px (`px-8`), max content width `1280px` |
| Section vertical rhythm | 56–64px between major sections |
| Card internal padding | 16px |
| Grid gap (product cards) | 16px mobile, 20px desktop |
| Filter sidebar width | 260px, fixed, left-aligned |
| Navbar height | 64px |

**Grid:**
- Product grid: 2 columns on mobile, 3 on tablet, 4 on desktop — this matches Cartify's existing `ProductGrid.jsx` breakpoints, so the column logic doesn't need to change, only the card skin.
- Filter sidebar + content is a two-column layout (`260px` + `flex-1`), collapsing to a bottom drawer on mobile — this already matches `FilterSidebar.jsx`'s existing behavior.

**Radii (exactly two, used consistently):**
- `rounded-lg` (10px) — buttons, pills, chips, inputs, badges.
- `rounded-2xl` (16px) — product cards, image containers, modals.

**Borders over shadows:** cards get a 1px `border-subtle` border instead of a drop-shadow. Reserve shadow only for genuinely floating elements (dropdowns, mobile drawers, toasts) using a soft, low-opacity black shadow — never a colored/glow shadow.

---

## 5. Core Components

### Product card
- Container: `bg-surface`, `rounded-2xl`, `border border-border-subtle`, `p-3`.
- Image: `rounded-xl`, `aspect-square`, object-cover, sits inside the card with a small inset margin (not edge-to-edge).
- Sale badge: top-left over the image, pill (`rounded-lg`), `bg-accent text-accent-ink`, e.g. "Sale 15%" — bold, 12px.
- Wishlist icon: top-right over the image, circular, `bg-black/40 backdrop-blur` idle, fills `accent-ink`-on-`accent` when active.
- Below the image: brand label (`text-secondary`, 12px) → product name (`text-primary`, 14px medium, 1–2 line clamp) → rating row (star icon + number, `text-secondary`) → price row (current price bold, compare-at price strikethrough + muted).
- Hover: border brightens to `border-strong`, no scale/shadow theatrics — a single quiet state change.

### Filter chips ("Apple ×", "SMEG ×")
- Pill, `rounded-lg`, `bg-elevated`, `border border-border-subtle`, `text-primary` 13px, with an inline `×` icon-button to remove.
- A "Reset filters" text link sits above the chip row, `text-secondary` with an `×` icon, no button chrome.

### Sidebar filter list (Price, Brand, checkboxes)
- Section headers: 14px medium, `text-primary`, with a chevron to collapse/expand (matches existing `FilterSidebar.jsx` behavior).
- Checkboxes: square, `rounded` (not full circle), unchecked = `border-border-subtle` outline on transparent; checked = `bg-accent` fill with `accent-ink` checkmark.
- Search-within-filter input (e.g. "Search brands"): `bg-elevated`, `rounded-lg`, `border-subtle`, placeholder in `text-tertiary`.

### Top navigation
- Full-width bar, `bg-base`, bottom `border-subtle` hairline (no shadow).
- Logo left, primary nav tabs center/left-of-center as plain text links with a lime underline only on the *active* route (matches "Bestsellers" active state in the reference) — not on hover.
- Right cluster: search icon, cart icon (with count badge in `accent`/`accent-ink`), auth/profile icon — all circular icon-buttons, `bg-elevated` on hover.

### Buttons
- Primary: `bg-accent text-accent-ink`, `rounded-lg`, bold label, used sparingly (checkout, primary form submit) — not for every CTA.
- Secondary: transparent with `border-border-subtle`, `text-primary`, `bg-elevated` on hover.
- Ghost/tertiary: no border, `text-secondary`, `text-primary` on hover — used for "Top rated ⌄"-style sort/filter triggers.

### Toasts, empty states, error states
- Reuse Cartify's existing `Toast.jsx` / `EmptyState.jsx` / `ErrorState.jsx` structural components — only re-skin their colors (dark surface, lime for success accents, `danger` red for errors) rather than rebuilding them.

---

## 6. Iconography & Imagery

- Icons: continue using `lucide-react` (already a dependency) — stroke-based, 1.5–2px weight, no filled icon style except for the small number of "active/selected" states (wishlist heart, checked checkbox).
- Product photography: consistent square crop, neutral/dark or transparent backdrop so products pop against `bg-surface` without a visible seam — matches the reference's studio-shot product photos.
- No stock-photo lifestyle imagery in card grids; product-on-white/transparent only.

---

## 7. Tailwind Mapping (for implementation reference)

This is *not* an applied change — it's what `client/tailwind.config.js` and `client/src/index.css` would need to become to implement this system, keeping the same token *names* Cartify's components already reference (`primary`, `ink`, `muted`, `surface`) so existing className usage in components like `ProductCard.jsx`, `Navbar.jsx`, `FilterSidebar.jsx` keeps working without a full rewrite — only the color *values* change.

```js
// client/tailwind.config.js (proposed values — not yet applied)
colors: {
  primary: {
    DEFAULT: '#D7FF3D',   // accent (was blue #2563EB)
    dark:    '#BEE62E',
    light:   '#E4FF6B',
  },
  ink: {
    DEFAULT: '#F5F5F7',    // was near-black text on light bg; now near-white text on dark bg
  },
  muted: {
    DEFAULT: '#9A9AA1',
  },
  surface: {
    DEFAULT: '#0B0B0D',    // page background (was #F8FAFC)
  },
  card: {
    DEFAULT: '#17171A',
    elevated: '#202024',
  },
  border: {
    subtle: '#2A2A2E',
    strong: '#3A3A40',
  },
},
```

```css
/* client/src/index.css — .card component would need: */
.card {
  @apply rounded-2xl border border-border-subtle bg-card;
  /* remove shadow-card / shadow-cardHover; borders carry depth instead */
}
```

Because `ink` currently means "near-black text," inverting it to near-white for dark mode is a **global, breaking visual change** — every component using `text-ink` will need visual re-verification (not code changes, since the className stays `text-ink`), particularly form inputs, badges, and any hardcoded `bg-white`/`border-slate-*` utility classes sprinkled through components (e.g. `Toast.jsx`, `Modal.jsx`, `FilterSidebar.jsx` all use raw `slate-*`/`white` Tailwind colors today rather than the theme tokens, so those will need updating too, not just the theme file).

---

## 8. Open Questions Before Implementation

- Should this be a permanent re-theme, or a `dark:` variant alongside the current light theme? (Tailwind's `dark:` prefix would let both coexist; a straight re-theme is simpler but non-reversible without a git revert.)
- Do admin/content-manager dashboards (`DashboardShell.jsx` and friends) adopt the same dark theme, or stay light to visually distinguish "storefront" from "back office"?
- Confirm the exact accent hex against your brand guidelines if one exists beyond this screenshot — `#D7FF3D` is estimated from the reference image, not sampled from a source file.
