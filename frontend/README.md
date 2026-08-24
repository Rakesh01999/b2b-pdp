# ArcB2B — Product Detail Page

An implementation of the **Trade Desk** product page from
[`../docs/arcb2b-pdp-design-plan.md`](../docs/arcb2b-pdp-design-plan.md).

Standalone app, deliberately separate from `../ARCB2B` — that repository is
reference only and nothing in it was modified. This build pins the same versions
it uses (`next@16.3.2`, `react@19.2.4`, Tailwind 4, `lucide-react`) so the
components are drop-in compatible with that frontend.

```bash
npm install
npm run media     # generate the product imagery (required once, ~20s)
npm run dev       # http://localhost:3000  → redirects to /en
npm run build && npm start
npm test          # 37 assertions over the pricing / mix / landed-cost maths
npm run lint && npm run typecheck
```

Open `/en` or `/bn`. The home page carries the hero and the full category tree;
its last section indexes the five product pages, each exercising a different
listing state.

---

## Surfaces

| route | what it is |
|---|---|
| `/[lang]` | Hero, the twenty-category grid, the catalogue rail, and the product-page index |
| `/[lang]/categories` | The full directory — 20 categories, 108 subcategories, live filter across both levels |
| `/[lang]/category/[slug]` | One route serving both levels: a parent shows its children as refinements, a child shows its siblings |
| `/[lang]/product/[slug]` | The Trade Desk — the deliverable |
| `/[lang]/search` | Server-rendered results — text match, category facets computed pre-filter, sort and filters as links so the page works and is linkable without JavaScript |
| `/[lang]/deals` | Ranked by the real spread between a listing's minimum-order price and its floor price — no countdown timers |
| `/[lang]/rfq/new` | The standalone sourcing request; drafts to `localStorage` so a twelve-field form survives a lost connection |
| `/[lang]/cart` | Real courier and landed-cost computation over the buyer's actual cart lines and district |
| `/[lang]/store/[slug]` | A supplier storefront — the same identity block and trust-ledger component the product page uses, not a copy of it |
| `/[lang]/account`, `/account/orders`, `/account/rfq/[id]` | Honest signed-out state backed by real `localStorage` (cart, saved, recently viewed); the RFQ thread is the multi-supplier quote comparison, ranked by landed cost at each quote's own quantity |
| `/[lang]/messages`, `/[lang]/notifications` | Fixture threads and a fixture feed, both stated as such; the composer persists a draft per thread |
| `/[lang]/sign-in`, `/[lang]/register` | Real client-side validation (phone shape, business name); no identity service exists behind it, and the form says so after submit rather than faking success |
| `/[lang]/[...slug]` | One catch-all serving all seventeen informational pages (`/help*`, `/sell*`, `/legal/*`, `/about`, `/careers`, `/how-it-works`, `/install`) from `src/data/pages.ts`, plus the terminal 404 for anything else under a locale |

**337 pages prerender statically**: every category and subcategory in both
locales, the products, the directory, every storefront, every content page, and
the RFQ thread fixture. `/search` and `/messages` render on demand because they
key off a query string or resolve which thread to open.

Every internal link resolves — verified by crawling both locale homes to
exhaustion (1,042 URLs) after each change; see `npm test` for the pricing/mix/
landed-cost/search assertions.

### The hero

Search-first, because a B2B hero has to get a buyer who arrived with a part
number into the catalogue in one action while also telling a first-time importer
what the platform does. Left column: value proposition, the search field scoped
across the whole taxonomy, popular terms, and the three assurances. Right column
answers the case search cannot serve — "it is not listed" — with the sourcing
request, three numbered steps and three figures computed from the taxonomy.

**No carousel.** A rotating banner is a decision the buyer did not ask to make,
it moves what they were reading, and on a metered connection it is several images
downloaded to show one. Server-rendered apart from the search field itself.

### Category browsing

`data/categories.ts` is the single spine. The header's All Categories panel, the
directory, every category page and the home grid all read it, so a category
cannot exist in the menu and be missing from the directory, and a subcategory
link can never 404. Main-category counts are summed from their children rather
than stored twice.

The All Categories panel is a two-pane flyout from `lg` (rail selects, pane
shows children) and a full-height sheet below it, because a hover-driven flyout
means nothing on a touch screen. Every entry is a real link, so browse survives
JavaScript failing to load.

---

## What the product page does

| | |
|---|---|
| **Interactive price ladder** | Each tier is a radio that rescales the mix to that tier's minimum; the active ring is *derived* from live quantity, so typing in the grid moves it. Quantity and price are one decision in B2B, so they get one control. |
| **SKU mix grid** | Colour × version (or × size) with row totals, per-cell stock state, arrow-key/Enter navigation, distribute-evenly, and **paste from a spreadsheet** shown as a diff before it applies. Text inputs with `inputMode="numeric"`, never `type="number"`. |
| **Landed cost** | Goods + variant surcharge + courier by district + payment-gateway fee → **per-unit landed**. Baymard finds 81% of sites omit per-unit price on multi-quantity products and 67% omit total order cost; for a reseller those two omissions *are* the decision. |
| **State-driven CTA** | The primary action is resolved from stock, production window, whether a ladder is published, requested customisation, and how far past the top tier the quantity has gone — seven states, one resolver, shared by the panel and the sticky bar. |
| **Trust ledger** | Four measured seller metrics, each with a definition popover and an explicit *"Not enough orders yet"* below its sample threshold. Nothing is derived from anything but transaction records. |
| **Sold-by / sourced-from** | One component, two data modes: ArcB2B-as-seller with factory provenance (the contracted P0 model) or a marketplace supplier storefront (P1). |
| **Quote drawer** | Right-hand drawer on desktop, bottom sheet on mobile, prefilled from page state, draft persisted, lazy-loaded so it is not in the initial bundle. |
| **Reviews** | Reviewer is a *business*; order quantity is shown; repeat-buyer share is promoted into the summary; photos browse across all reviews in one overlay; seller replies are prominent. |

There is deliberately **no "Buy Now"** — reasoning in §12 of the plan.

---

## Architecture

**Bilingual by routing, not by client state.** Every page lives under
`app/[lang]/`, both locales are prerendered, `<html lang>` is correct per page,
`hreflang` alternates are emitted, and the product page ships **no i18n
JavaScript**. Switching language is a navigation. `src/proxy.ts` sends an
unprefixed request to the locale its `Accept-Language` asks for.

**Server-first.** Only these ship JS: the gallery, trade panel, shipping
comparison, review filters, section nav, sticky bar, chrome controls and the two
quantity-aware rails. Specifications, description, seller block, breadcrumb and
all structured data are Server Components. Four lazy chunks (quote drawer,
lightbox, review overlay, mix sheet) load on intent.

**One source of truth for the working order.** `features/product/trade-context.tsx`
derives every figure — applicable price, active tier, legality, courier band,
landed total — in a single `useMemo`. No effects syncing state to state, so there
is no frame where the quantity and the price disagree.

**Money is integer paisa** everywhere (`৳1` = `100`). Percentage fees are basis
points. The subtotal a buyer reads is the subtotal the order would be written
with; `npm test` pins the arithmetic to the paisa.

```
src/
├── app/[lang]/product/[slug]/   page · loading · error · not-found · opengraph-image
├── app/{sitemap,robots,manifest}.ts
├── components/{ui,layout,seo}/
├── features/
│   ├── app/providers.tsx        prefs + cart + saved + recently-viewed
│   ├── chrome/                  header · footer · tab bar · controls
│   └── product/
│       ├── lib/                 pricing · mix · landed-cost   ← pure, tested
│       ├── trade-context.tsx    derived state for the whole page
│       └── components/          gallery · summary · trade/ · sections · rails
├── data/catalog.ts              stands in for the storefront API
└── lib/                         types · i18n · format · constants · catalog
```

### Design tokens

`app/globals.css`. Light-first, `[data-theme="dark"]` override, mapped into
Tailwind through `@theme inline` so utilities read the live variable.

**The brand hue is a deep trade teal, deliberately not the reference build's
orange.** It reads professional rather than promotional, it is unmistakable
against ARCB2B at a glance, and it is dark enough to be legible as text as well
as usable as a fill — which the orange was not.

| token | value | contrast |
|---|---|---|
| `--accent` | `#0f766e` | 5.1:1 white-on-accent, 4.5:1 as text on white — **both directions pass AA** |
| `--price` | `#be123c` | 5.9:1 on white. Reserved for money. |
| `--success` / `--warning` | `#15803d` / `#a16207` | 4.6:1 |
| `--info` / `--danger` | `#1d4ed8` / `#b91c1c` | 6.3:1 / 5.9:1 |
| `--rating` | `#f59e0b` | decorative only — star glyphs and distribution bars, never text |

Neutrals carry a faint teal bias so they read as chosen alongside the brand hue
rather than as a grey borrowed from somewhere else.

**One rule for text on a saturated fill: `--on-fill`.** Light-mode fills are
700-level and take white; dark-mode fills are 400/500-level and take near-black.
A single token means no component has to know which theme it is in — which is
what stops the dark theme shipping white-on-bright-teal buttons at 2.3:1.

**Density zoning** is the rule that keeps the hybrid layout coherent — every
region carries exactly one of `.zone-evidence` / `.zone-decision` /
`.zone-reference` / `.zone-nav`, and no component mixes them.

`--header-h` and `--mobile-chrome-h` are published so every sticky offset and
`scroll-margin-top` derives from one number instead of a magic constant.

### Bengali typography

A single font stack (`Geist → Anek Bangla`) consulted per codepoint, so Anek
Bangla is reached for the Bengali block — including `৳` — while Latin runs and
brand names stay in Geist. `[lang="bn"]` corrects the metrics: Bangla sets matras
above and below the baseline, so it needs more leading and zero negative
tracking. Numerals stay Western in both languages, because Bangladeshi commerce
writes prices that way and a reseller scans them faster.

---

## Verified

- `npm run build` — **275 pages prerendered static** (20 categories + 108
  subcategories + 5 products + directory + home, × 2 locales).
- `npm test` — 37 assertions green.
- `npm run lint`, `npm run typecheck` — clean.
- Rendered and screenshotted in headless Chrome at **500 / 768 / 1024 / 1280 /
  1440 px**, in both locales, in light and dark theme, across the home page, the
  category directory, a subcategory page, and the in-stock, sourced-to-order and
  quote-only product states.
- Server-rendered HTML confirmed to contain the `<h1>`, all four ladder prices,
  the mix grid inputs with their `aria-label`s, both JSON-LD blocks, and a
  `<link rel="preload" as="image">` with a full `srcset` for the LCP hero.

### Bugs found and fixed during verification

Each of these was caught by looking at the running page or by an assertion, not
by reading the code.

**Layout and palette**

- **The header wrapped into two rows at tablet widths**, dropping the account
  icons onto their own line with a band of dead space beside them. The cause was
  a flex line breaking on min-content that nothing in the markup declared, so it
  was invisible from the source. Replaced with explicit grid placement — two
  columns below `md`, three from `md` up, each child placed by name.
- **The search field showed four characters at 768px.** The 152px scope selector
  was competing for a shared row. It now stands down exactly where space is
  tight: shown at `sm` (own full-width row), hidden at `md`, shown again from
  `lg`.
- **The submit button left a 4px sliver of border showing** and an uneven inner
  radius — a rounded pill inside a rounded pill. The form now sets one height
  with `items-stretch` and clips a flush button, so alignment is structural
  rather than hand-tuned padding kept in sync by hand.
- **The dark theme would have shipped white-on-bright-teal buttons at 2.3:1.**
  Fixed by the `--on-fill` token rather than by per-component overrides.
- **Rating stars rendered brown** — the AA-darkened `--warning` reused for a
  decorative glyph. Now a dedicated `--rating`.
- **Next served a stale optimised image** after the source PNG changed, which
  read as an unfixed bug until `.next/cache/images` was cleared. Worth knowing
  before chasing a phantom.

**Correctness**

1. **Dispatch lead time was being read as sourcing.** `leadTimeDays: 3` means
   "ships from Dhaka stock in three days", but the resolver treated any non-zero
   value as made-to-order — labelling every stocked product "Sourced to order"
   and offering *Start sourcing order* instead of *Add mix to cart*. Sourcing is
   now driven by a declared production window or by demand exceeding dispatchable
   stock. Pinned by a test.
2. **The headline price misstated the MOQ price.** It showed the ladder's
   cheapest tier (`৳440`) beside "From 50 pcs", implying ৳440 buys 50 pieces when
   50 pieces cost ৳500 each. Now labelled *As low as*, with the MOQ price stated
   beneath it.
3. **Paste treated a data row as a header.** The header heuristic counted the row
   label, so `Black⇥40⇥32` looked like a header and the first row of quantities
   was silently dropped. Caught by `npm test`.
4. **The mobile trade bar parked on top of the tab bar** when hidden — a plain
   `translate-y-full` moves an element down by its own height, which left it
   exactly over the 56px bar below. Both bars now move as one unit.
5. **`useSearchParams` without a Suspense boundary** collapsed the entire hero
   subtree to client-only rendering during the production prerender — the exact
   LCP regression this page exists to avoid. It failed *silently*: the build
   reported success and the defect was only visible as a
   `BAILOUT_TO_CLIENT_SIDE_RENDERING` marker in the emitted HTML.
6. **Cells showed combined capacity as "available".** A cell with 12 in Dhaka and
   240 inbound read as `252`, true of the order and false of the warehouse. Now
   `12 +240`, and `180 sourced` where nothing is dispatchable.
7. **An unexplained "Variant surcharge" line.** Now names its basis (`265 × +৳40`).
8. **Landed cost appeared on quote-only lines**, promising a figure that cannot
   exist before the seller replies.
9. **A disabled CTA with no stated reason** at zero quantity, against this page's
   own rule that a disabled control always says why.
10. **The product card repeated the sourcing bug**, because it only knew
    `leadTimeDays`. It now reads a `madeToOrder` flag derived from the same
    production-window field the resolver uses, so the card and the page cannot
    disagree about whether a line is stocked.
11. **A category page claimed "1,842 products" and rendered one.** The header
    count is the taxonomy figure and the grid holds whatever sample data exists;
    it now says which is which rather than letting the reader reconcile them.

---

## What is stubbed, and where the seams are

Nothing here pretends to be backed by a service it is not.

| Stub | Where | Real implementation |
|---|---|---|
| Catalogue | `src/data/catalog.ts` behind `src/lib/catalog.ts` | `GET /v1/storefront/products/:slug`. Swap the one access module; every consumer is already behind it. |
| Cart / RFQ submit | `features/app/providers.tsx`, `rfq-drawer.tsx` | Server Actions → `POST /v1/cart/lines`, `POST /v1/rfq`. The artificial delays exist so the optimistic pending states are observable. |
| Courier rates | `src/lib/constants.ts` rate card | Pathao / Steadfast / RedX / eCourier APIs. Consumers read one `ShippingQuote` shape, so live rates are a data change with no UI change. |
| Seller metrics | `catalog.ts` fixtures | A nightly-computed `SellerMetrics` aggregate. The `null` + threshold path is already implemented and used. |
| Bought-together | `BOUGHT_TOGETHER` map | Order co-occurrence. Hard-coded rather than pretending to be a model. |
| Product video | one media item | The media kind, poster-first loading and lightbox slot are implemented; the encoded file is not bundled, and the overlay says so instead of showing a dead player. |
| OG image Bengali | `opengraph-image.tsx` | English title in both locales — rendering Bengali needs a subsetted Bengali face bundled into the image response. Noted in the file. |
| Product imagery | `scripts/generate-media.mjs` | Procedural PNGs (a PNG encoder over zlib plus SDF rasterisation) rather than stock photos, so the zoom lens has a genuinely higher-resolution source and `next/image` is exercised against real files. |
| Category counts | `src/data/categories.ts` | A catalogue aggregate. Main-category totals are summed from their children rather than stored, so the two figures cannot disagree; only the leaf numbers are fixtures. |
| Category listings | `getCategoryProducts()` | A filtered catalogue query. Sample products exist for a few branches only, and pages say so instead of padding the grid with unrelated items. |
| Checkout | `features/cart/cart-view.tsx` | Payment gateway + order service. The button is disabled with a note explaining why, rather than a live-looking control that silently does nothing. |
| Sign-in / register | `features/account/auth-form.tsx` | Identity service + SMS gateway for the OTP. Validation (phone shape, business name) runs for real client-side; submission ends in an honest "no service behind this yet" state instead of a fabricated success. |
| RFQ quote threads | `src/data/account.ts` | The quotation service. One fixture thread (`RFQ-24817`) with three suppliers, built to exercise the actual design problem: ranking quotes that each carry a different quantity, lead time and validity by landed cost per unit rather than headline price. |
| Messages / notifications | `src/data/account.ts` | The messaging service and the push/SMS notification pipeline. Two fixture threads and a five-entry feed; the composer persists a real per-thread draft to `localStorage` and says the send is stubbed only after an attempt. |
| Search | `src/lib/search.ts` | `GET /v1/search`. Ranking, category facets and sorting are real logic over the sample index — swapping the backend is replacing `searchCatalogue()`'s body with a fetch. |
| Order history | `/account/orders` | The order service. Deliberately empty rather than fabricated — an invented order a buyer believes is in flight is worse than no history at all. |

### Fields the API must add

Listed in full in §18 of the plan. The ones this page cannot be honest without:
`rating`/`reviewCount` denormalised, `moqStep`, `weightGrams`, `cartonQty`,
`unit`, `priceOnRequest`, `imageDerivatives`, `descriptionBlocks[]`, and a
nullable `seller` reference. Four modules do not exist yet at all: **Review**,
**Seller/SellerMetrics**, **RFQ**, **ShippingRate**.

### Open decisions

Still the six from §30 of the plan. Two were settled by building:
Next 16.3.2 was used (matching ARCB2B), and Western numerals are used in both
languages. The remaining four — dropping "Buy Now", the P0 seller model, the
landed-cost rate card, and reviews-before-RFQ — are unchanged and yours to call.
