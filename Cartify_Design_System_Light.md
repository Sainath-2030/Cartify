# Cartify --- Design System

**Status:** Reference design language for the storefront, distilled from
the provided light-mode direction and reference screenshot.

**Scope:** Visual theme only (color, type, spacing, components). Not an
implementation change --- pair this with a scoped follow-up task when
you're ready to apply it across `client/`.

This file is meant to sit alongside `CLAUDE.md` as a second permanent
reference: CLAUDE.md governs *architecture*, this file governs *how it
looks*. Every new page or component should be checked against this doc
before being merged.

------------------------------------------------------------------------

## 1. Direction

Cartify moves from its current dark, lime-accent storefront to a
**premium warm light commerce** look: soft off-white surfaces, warm
cream sections, a restrained green accent, subtle borders, and very
light elevation. The mood should feel like a modern curated lifestyle
retailer --- editorial, calm, bright, and premium rather than a generic
white marketplace.

**Non-negotiables carried from the reference:**

-   Background is light and warm --- no gradients, no glassmorphism, no
    heavy shadows.
-   Use one primary brand accent: deep natural green for primary actions
    and selected states, with a brighter lime/chartreuse reserved for
    small highlights and status details.
-   Cards are light-on-light with a hairline warm-gray border; depth
    comes primarily from borders and small surface changes, not obvious
    drop shadows.
-   Filter chips and tabs are pill-shaped; product cards are
    soft-rounded rectangles. Two radii, not more.
-   Avoid pure white everywhere. Use warm off-white and cream surfaces
    to create hierarchy without making the interface feel flat or
    clinical.
-   Green should communicate action, selection, trust, and commerce ---
    not become a decorative background color.

------------------------------------------------------------------------

## 2. Color

Named tokens --- map these onto Tailwind's `theme.extend.colors` (see
§7).

  -----------------------------------------------------------------------
  Token                   Hex                     Usage
  ----------------------- ----------------------- -----------------------
  `bg-base`               `#FAFAF7`               Page background, navbar
                                                  background

  `bg-surface`            `#FFFFFF`               Product cards, filter
                                                  panels, modals

  `bg-elevated`           `#F4F4EE`               Hover/active surfaces,
                                                  dropdowns, input fields

  `bg-soft`               `#F1F4E8`               Soft promotional areas,
                                                  selected category
                                                  backgrounds

  `bg-hero`               `#F7F6EE`               Large hero/feature
                                                  panels, warm editorial
                                                  sections

  `border-subtle`         `#E5E6DE`               Card borders, dividers,
                                                  pill chip borders

  `border-strong`         `#D2D5C8`               Hover border, focused
                                                  input border

  `accent`                `#4F8F2F`               Primary CTA, active
                                                  navigation, selected
                                                  filters, trust states

  `accent-dark`           `#3D7424`               Primary CTA
                                                  hover/pressed state

  `accent-light`          `#E8F5D7`               Selected/soft green
                                                  backgrounds, success
                                                  highlights

  `highlight`             `#C8F23D`               Small attention
                                                  accents, cart count,
                                                  sale details, tiny
                                                  active indicators

  `accent-ink`            `#FFFFFF`               Text/icon color on top
                                                  of the primary green
                                                  accent

  `highlight-ink`         `#17200E`               Text/icon color on top
                                                  of the lime highlight

  `text-primary`          `#17302B`               Headings, product
                                                  names, prices

  `text-secondary`        `#66736F`               Brand labels,
                                                  breadcrumbs, helper
                                                  text

  `text-tertiary`         `#929B96`               Disabled state,
                                                  placeholder text, muted
                                                  metadata

  `danger`                `#C94A4A`               Out-of-stock,
                                                  destructive actions,
                                                  error text

  `success`               `#4F8F2F`               In-stock confirmation,
                                                  success toasts
  -----------------------------------------------------------------------

**Rules:**

-   `accent` is the main action color. Use it for primary buttons,
    active navigation, selected filters, links that require attention,
    and trust/confirmation states.
-   `highlight` is a secondary attention color, not a second brand
    color. Use it sparingly for cart count badges, sale indicators, tiny
    status dots, and small visual accents.
-   Never use `highlight` or `accent` as a large full-page fill.
-   Never place dark green text on `accent` unless the contrast has been
    verified; primary CTA text should use `accent-ink`.
-   Use `text-primary` for the main hierarchy instead of pure black.
    Pure `#000000` should not be used for normal UI text.
-   Avoid pure `#FFFFFF` as the page background. Reserve it for cards,
    controls, and content surfaces that need to sit above `bg-base`.
-   Only one elevation step at a time --- a card sitting on `bg-base`
    uses `bg-surface`; a dropdown inside that card uses `bg-elevated`.
-   Warm cream (`bg-hero`) should be used for editorial/hero areas, not
    repeatedly across every component.

------------------------------------------------------------------------

## 3. Typography

Keep the existing type family --- **Inter** --- already loaded in
`client/index.html`. It's a clean geometric grotesque that reads well at
both display and UI sizes, so no second typeface is needed.

  -----------------------------------------------------------------------------------
  Role                         Size /            Weight             Tracking
                               Line-height                          
  ---------------------------- ----------------- ------------------ -----------------
  Display (page hero,          40px / 1.1        800 (extrabold)    -0.02em
  "Bestsellers")                                                    

  Section heading              24px / 1.25       700 (bold)         -0.01em

  Card title / product name    14px / 1.4        500 (medium)       normal

  Body                         14px / 1.5        400 (regular)      normal

  Label / eyebrow (brand name  12px / 1.3        500 (medium)       0.02em, sentence
  above product title)                                              case --- **not
                                                                    all-caps**

  Price (primary)              16px / 1.2        700 (bold)         normal

  Price                        13px / 1.2        400,               normal
  (strikethrough/compare-at)                     `text-tertiary`    

  Micro (rating count, filter  12px / 1.3        400,               normal
  counts)                                        `text-secondary`   
  -----------------------------------------------------------------------------------

**Rules:**

-   Sentence case everywhere. No tracked-out all-caps labels --- simple
    sentence-case tab labels such as "All items", "Categories", and "Top
    rated" should carry through the whole app.
-   One weight jump per hierarchy step is enough (400 → 500 → 700 →
    800); don't introduce 600 as a separate step.
-   Use the darker green-black `text-primary` for headings rather than
    pure black to preserve the warm premium character.
-   Line length for body copy (product descriptions, review text) stays
    under 70--75 characters --- constrain with `max-w-prose` or an
    explicit `max-w-[65ch]`.
-   Display headings can be large and confident, but avoid excessive
    text weight across the interface. Reserve 800 for true hero/display
    hierarchy.

------------------------------------------------------------------------

## 4. Spacing & Layout

Base unit: **4px**, following Tailwind's default scale --- don't
introduce a custom spacing scale, just use it consistently.

  -----------------------------------------------------------------------
  Context                             Value
  ----------------------------------- -----------------------------------
  Page horizontal padding (mobile)    20px (`px-5`)

  Page horizontal padding (desktop)   32px (`px-8`), max content width
                                      `1280px`

  Section vertical rhythm             56--64px between major sections

  Card internal padding               16px

  Grid gap (product cards)            16px mobile, 20px desktop

  Filter sidebar width                260px, fixed, left-aligned

  Navbar height                       64px

  Announcement bar height             28--32px

  Category navigation height          64px
  -----------------------------------------------------------------------

**Grid:**

-   Product grid: 2 columns on mobile, 3 on tablet, 4 on desktop ---
    this matches Cartify's existing `ProductGrid.jsx` breakpoints, so
    the column logic doesn't need to change, only the card skin.
-   Filter sidebar + content is a two-column layout (`260px` +
    `flex-1`), collapsing to a bottom drawer on mobile --- this already
    matches `FilterSidebar.jsx`'s existing behavior.
-   Hero/editorial panels can use a balanced 1:1 or 55/45 text-to-media
    split on desktop, collapsing to a single column on mobile.
-   Keep major content aligned to the same `1280px` page container as
    the existing storefront.

**Radii (exactly two, used consistently):**

-   `rounded-lg` (10px) --- buttons, pills, chips, inputs, badges.
-   `rounded-2xl` (16px) --- product cards, image containers, modals,
    hero panels.

**Borders over shadows:** cards get a 1px `border-subtle` border instead
of a heavy drop-shadow. Reserve a soft, low-opacity shadow only for
genuinely floating elements (dropdowns, mobile drawers, toasts). Never
use colored/glow shadows.

------------------------------------------------------------------------

## 5. Core Components

### Product card

-   Container: `bg-surface`, `rounded-2xl`,
    `border border-border-subtle`, `p-3`.
-   Image: `rounded-xl`, `aspect-square`, object-cover, sits inside the
    card with a small inset margin (not edge-to-edge).
-   Sale badge: top-left over the image, pill (`rounded-lg`),
    `bg-highlight text-highlight-ink`, e.g. "Sale 15%" --- bold, 12px.
-   Wishlist icon: top-right over the image, circular, `bg-white/90`
    with a subtle border in idle state; use `bg-accent text-accent-ink`
    when active.
-   Below the image: brand label (`text-secondary`, 12px) → product name
    (`text-primary`, 14px medium, 1--2 line clamp) → rating row (star
    icon + number, `text-secondary`) → price row (current price bold,
    compare-at price strikethrough + muted).
-   Hover: border brightens to `border-strong`, background can shift
    very subtly toward `bg-elevated`; no scale/shadow theatrics.
-   Product photography should retain enough surrounding whitespace to
    work naturally on the white card surface.

### Filter chips ("Apple ×", "SMEG ×")

-   Pill, `rounded-lg`, `bg-elevated`, `border border-border-subtle`,
    `text-primary` 13px, with an inline `×` icon-button to remove.
-   Selected/active filter chips may use `bg-accent-light` with
    `border-accent` and `text-primary`.
-   A "Reset filters" text link sits above the chip row,
    `text-secondary` with an `×` icon, no button chrome.

### Sidebar filter list (Price, Brand, checkboxes)

-   Section headers: 14px medium, `text-primary`, with a chevron to
    collapse/expand (matches existing `FilterSidebar.jsx` behavior).
-   Checkboxes: square, `rounded` (not full circle), unchecked =
    `border-border-subtle` outline on transparent; checked = `bg-accent`
    fill with `accent-ink` checkmark.
-   Search-within-filter input (e.g. "Search brands"): `bg-elevated`,
    `rounded-lg`, `border-subtle`, placeholder in `text-tertiary`.
-   Avoid large green blocks in the sidebar. Green indicates
    selected/active state only.

### Top navigation

-   Full-width bar, `bg-surface`, bottom `border-subtle` hairline (no
    shadow).
-   Announcement bar above navigation: very light green-tinted
    background (`bg-soft`) with compact green text. Keep it
    informational rather than visually dominant.
-   Logo left, primary nav tabs center/left-of-center as plain text
    links with a green underline only on the **active** route --- not on
    hover.
-   Right cluster: search field, wishlist icon, cart icon with count
    badge, auth/profile icon.
-   Search field: `bg-elevated`, `rounded-lg`,
    `border border-border-subtle`; placeholder uses `text-secondary`.
-   Icon buttons should be clean and light; use `bg-elevated` on hover
    rather than dark fills.
-   Category navigation below the main navbar uses light pill controls.
    The selected category can use `bg-accent-light` and
    `text-accent-dark`.

### Hero / editorial panel

-   Container: `bg-hero`, `rounded-2xl`, `border border-border-subtle`,
    generous internal whitespace.
-   Avoid a full-bleed green background. The premium feel comes from
    warm cream + dark green typography + natural photography.
-   Eyebrow/pill: `bg-soft`, `text-accent-dark`,
    `border border-border-subtle`.
-   Hero headline: `text-primary`, 40px/1.1, 800 weight.
-   Supporting copy: `text-secondary`, 14--16px, constrained to
    approximately 55--65 characters per line.
-   Feature highlights: use small circular/icon containers in
    `accent-light`, `bg-soft`, or warm neutral tones rather than large
    colored cards.
-   Primary CTA: `bg-accent text-accent-ink`, `rounded-lg`, bold label.
-   Secondary CTA: `bg-surface`, `border border-border-subtle`,
    `text-primary`, `rounded-lg`.
-   Lifestyle imagery should feel bright, natural, warm, and editorial.
    Use subtle rounding rather than image shadows.
-   Trust/rating badge over imagery: white `bg-surface`, `rounded-lg`,
    subtle border, with green rating text and a small lime/gold-like
    highlight icon.

### Buttons

-   Primary: `bg-accent text-accent-ink`, `rounded-lg`, bold label, used
    for the primary conversion action --- checkout, add-to-cart, primary
    form submit, and key hero CTA.
-   Primary hover: `bg-accent-dark`.
-   Secondary: `bg-surface`, `border-border-subtle`, `text-primary`,
    `bg-elevated` on hover.
-   Ghost/tertiary: no border, `text-secondary`, `text-primary` on hover
    --- used for "Top rated ⌄"-style sort/filter triggers.
-   Do not make every CTA green. One primary action should visually
    dominate each local component.

### Toasts, empty states, error states

-   Reuse Cartify's existing `Toast.jsx` / `EmptyState.jsx` /
    `ErrorState.jsx` structural components --- only re-skin their colors
    rather than rebuilding them.
-   Toasts: `bg-surface`, `border-subtle`, soft shadow, `text-primary`.
-   Success: `accent-light` or a small `accent` indicator.
-   Errors: very light red background with `danger` text and border.
-   Empty states: warm neutral surface, dark green heading, muted
    supporting copy.

------------------------------------------------------------------------

## 6. Iconography & Imagery

-   Icons: continue using `lucide-react` (already a dependency) ---
    stroke-based, 1.5--2px weight, no filled icon style except for small
    active/selected states.
-   Icon color hierarchy: `text-secondary` by default, `text-primary`
    for high-priority controls, `accent` for selected/confirmation
    states.
-   Product photography: consistent square crop, clean
    white/warm-neutral or transparent backdrop so products sit naturally
    on `bg-surface` without a visible seam.
-   Lifestyle/hero photography: bright natural light, warm neutrals,
    soft greens, wood, ceramic, linen, and other tactile materials. It
    should support the premium curated-commerce mood.
-   No generic stock-photo lifestyle imagery in product card grids; keep
    card imagery product-focused.
-   Avoid excessive image filters, colored overlays, or artificial glow.
-   Photography should provide warmth because the UI itself remains
    intentionally restrained.

------------------------------------------------------------------------

## 7. Tailwind Mapping (for implementation reference)

This is *not* an applied change --- it's what
`client/tailwind.config.js` and `client/src/index.css` would need to
become to implement this system, keeping the same token names Cartify's
components already reference (`primary`, `ink`, `muted`, `surface`) so
existing className usage in components like `ProductCard.jsx`,
`Navbar.jsx`, `FilterSidebar.jsx` keeps working without a full rewrite
--- only the color values change.

``` js
// client/tailwind.config.js (proposed values — not yet applied)

colors: {
  primary: {
    DEFAULT: '#4F8F2F',  // primary green
    dark:    '#3D7424',
    light:   '#E8F5D7',
  },

  ink: {
    DEFAULT: '#17302B',  // dark green-black text on light surfaces
  },

  muted: {
    DEFAULT: '#66736F',
  },

  surface: {
    DEFAULT: '#FAFAF7',  // page background
  },

  card: {
    DEFAULT: '#FFFFFF',
    elevated: '#F4F4EE',
    soft: '#F1F4E8',
    hero: '#F7F6EE',
  },

  border: {
    subtle: '#E5E6DE',
    strong: '#D2D5C8',
  },

  highlight: {
    DEFAULT: '#C8F23D',
    ink: '#17200E',
  },

  danger: '#C94A4A',
  success: '#4F8F2F',
},
```

``` css
/* client/src/index.css — .card component would need: */

.card {
  @apply rounded-2xl border border-border-subtle bg-card;
  /* remove heavy shadow-card / shadow-cardHover;
     borders and surface changes carry depth */
}
```

**Global theme replacement guidance:**

-   Existing `bg-slate-*`, `text-slate-*`, `border-slate-*`, `bg-white`,
    and hardcoded dark-theme values should be reviewed and replaced with
    the design tokens where they represent semantic UI roles.
-   Existing `text-ink` should remain the semantic text token and
    resolve to `#17302B`.
-   Existing `primary` should resolve to the green accent instead of the
    previous blue.
-   `surface` should resolve to the warm page background, while `card`
    should resolve to white content surfaces.
-   Preserve component structure and behavior wherever possible; this
    document is a visual re-theme, not a component rewrite.

------------------------------------------------------------------------

## 8. Light Theme Implementation Notes

### Surface hierarchy

Use the following hierarchy consistently:

`bg-base (#FAFAF7)` → `bg-surface (#FFFFFF)` → `bg-elevated (#F4F4EE)`

For large editorial areas, use `bg-hero (#F7F6EE)`.

The interface should feel layered even when viewed without shadows. If a
component looks visually "floating," first check whether the surface and
border tokens are doing enough before adding a shadow.

### Accent hierarchy

Use green in this order of importance:

1.  `accent` --- primary actions and selected states.
2.  `accent-dark` --- hover/pressed states.
3.  `accent-light` --- selected backgrounds and supporting success
    surfaces.
4.  `highlight` --- tiny attention markers such as cart count, sale
    indicators, and small decorative dots.

Do not introduce additional blue, purple, orange, or neon accent colors
into the storefront unless a product-specific state genuinely requires
one.

### Navigation hierarchy

The top of the page should read as three quiet layers:

1.  Announcement bar --- subtle green-tinted information strip.
2.  Main navbar --- white/light surface with logo, navigation, search,
    wishlist, cart, and profile.
3.  Category pills --- light neutral controls with the selected category
    using a soft green treatment.

The navbar should remain visually lighter than the hero content and
should never compete with the hero headline.

### Hero hierarchy

The hero is the visual anchor of the storefront:

-   Warm cream panel.
-   Large dark green headline.
-   Small green eyebrow.
-   Three concise benefit signals.
-   One green primary CTA and one neutral secondary CTA.
-   Bright editorial product/lifestyle image.
-   Small white verification/rating badge.

Keep the hero spacious. Do not add gradients, oversized decorative
shapes, or multiple competing accent colors.

------------------------------------------------------------------------

## 9. Open Questions Before Implementation

-   Should this be a permanent re-theme, or a `dark:` variant alongside
    the light theme? Tailwind's `dark:` prefix would let both coexist; a
    straight re-theme is simpler but non-reversible without a git
    revert.
-   Do admin/content-manager dashboards (`DashboardShell.jsx` and
    friends) adopt the same light theme, or retain a separate visual
    language to distinguish storefront from back office?
-   Confirm the exact green brand hex against your brand guidelines if
    one exists. `#4F8F2F` is a proposed primary based on the desired
    light-mode direction; it should be treated as a design-system
    starting point rather than a sampled brand value.
-   Confirm whether the lime highlight should remain as `#C8F23D` or use
    the existing Cartify lime `#D7FF3D` for stronger brand continuity.
