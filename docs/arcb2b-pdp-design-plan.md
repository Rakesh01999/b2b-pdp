# ArcB2B — Product Page (PDP)
## Research, Competitive Analysis, Design Direction & Implementation Plan

**Status:** Design proposal — awaiting approval. No implementation code written.
**Author:** Principal engineer / product design review
**Date:** 23 August 2026
**Scope:** Buyer-facing Product Detail Page, the global chrome it lives inside, the design system it needs, and the Next.js + API architecture to build it.

---

## 0. What this plan is grounded in

This is not a greenfield proposal. Before designing anything I read the actual repository at `ARCB2B/`, because a plan that ignores what already ships is a plan that gets thrown away.

**What already exists and works (and that this plan therefore builds on, not replaces):**

| Asset | Location | Assessment |
|---|---|---|
| Light-first storefront token layer, scoped `.storefront`, with a dark override | `frontend/src/app/globals.css` | **Keep.** Genuinely good: scoped theming, orange accent `#ff6a00`, marketplace price red `#e62412`, cool-grey canvas `#f2f3f5`. |
| Bengali typography handling (Anek Bangla reached only for Bengali codepoints; `[lang="bn"]` leading/tracking corrections) | `globals.css` | **Keep — this is the single most sophisticated thing in the codebase.** Most Bangladeshi platforms get this wrong. |
| `.price` / `.tnum` tabular-figure treatment | `globals.css` | **Keep.** Correct instinct: money and quantity columns must not jitter. |
| Sticky header with condense-on-scroll, scope-narrowing search, category rail, mobile tab bar | `components/store/chrome.tsx` | **Keep, extend.** Comments in this file show real reasoning about sticky containing blocks. |
| Tier-pricing math: `priceLadder`, `unitPriceForQty`, `nextTier`, `lowestPrice` | `lib/store.ts` | **Keep.** Pure, testable, correct. Reuse verbatim. |
| SKU quantity matrix (colour × size grid, per-cell quantity entry) | `components/store/product-purchase.tsx` | **Keep the concept, rebuild the ergonomics.** This is the signature 1688 interaction and it is already here. |
| API fallback to a sample catalog when the backend is empty | `lib/storefront.ts` | **Keep.** Lets design and demo proceed ahead of data. |

**Gaps and defects found in the current PDP** — each of these is a work item in the roadmap in §29, and each is a real finding, not a style opinion:

1. **Fabricated trust data presented as fact.** `supplierFor()` derives the supplier name from a hash of the product slug; `SupplierCard` computes "Response 92%" and "On-time 95%" from `supplier.years % 8` and `supplier.name.length % 5`. Numbers that look like verified performance metrics but are arithmetic on a string are the single highest-risk thing on the page. In a marketplace, invented trust signals are worse than absent ones.
2. **Fabricated rating.** The backend `Product` model has no `rating` field at all; the frontend reads `product.rating ?? 4.6`, so *every* product displays 4.6 stars. This also flows into `schema.org` markup, i.e. into Google.
3. **Incorrect structured data.** `aggregateRating.reviewCount` is populated from `stats.orders`. Order count is not review count. This is a rich-results policy problem, not just a modelling nit.
4. **No reviews on the page**, despite PRD §5.12 marking aggregate rating on detail pages as P0.
5. **No `BreadcrumbList` JSON-LD**, so the breadcrumb the user sees is invisible to search.
6. **Images bypass Next's image pipeline.** `ProductMedia` and `ProductGallery` use raw `<img>`. `ProductMedia` even passes a `sizes` attribute, which does nothing without a `srcset`. The PDP hero image is the LCP element on this page; this is the largest available Core Web Vitals win.
7. **Zoom has no high-resolution source.** The magnifier applies `scale(2)` to the same image file, so hovering magnifies upscaled pixels. B2B buyers zoom to inspect stitching, connectors, and print quality — a fake zoom actively damages confidence.
8. **The whole hero is client-side.** `ProductGallery` and `PurchaseArea` are `'use client'`, so the LCP image and the price are rendered by JavaScript rather than streamed as HTML.
9. **Product video is modelled but never rendered.** `IProduct.video` exists in Mongoose; the PDP ignores it. PRD §5.4 lists video as P0.
10. **Sticky offset is a magic number.** `lg:sticky lg:top-[150px]` hardcodes the header height. Any header change silently breaks the buy box.
11. **No `loading.tsx`, no `not-found.tsx`, no `error.tsx`** for the product route — three of the five states the brief asks for don't exist.
12. **Mobile has no purchase bar,** and the bottom of the viewport is already occupied by `MobileTabBar`. This collision must be resolved deliberately (see §18).
13. **No supplier, review, or RFQ model exists in the backend at all** (`backend/src/modules/` has products, orders, categories, content, messages, imports, sourcing, settings — and nothing else). Every supplier-facing element on the PDP is currently unbacked.
14. **Stack drift:** the brief specifies Next.js 15; `frontend/package.json` pins `next@16.3.2` with `react@19.2.4`. The repo's own `AGENTS.md` warns that this Next version has breaking changes from training data. The plan below is written for the installed version; see §23.

**One product-level finding that changes the design**, from PRD §4 and §5.14: in the contracted P0 scope, ArcB2B is **not** a multi-vendor marketplace. It is a single-storefront importer — the admin imports from 1688, applies a markup (`markupPercent`, `sourcePriceCny`), and ArcB2B sells. "Supplier storefronts (marketplace mode)" is explicitly **P1**. The brief for this task, however, describes a multi-vendor marketplace.

Both are true at different times, and the PDP is where the seam shows. §14 resolves it with a single component that renders correctly in both worlds, so P1 is a data change rather than a redesign.

---

## 1. Executive design recommendation

**Build the ArcB2B PDP as a "Trade Desk": a two-column decision surface where the left column carries evidence and the right column carries a persistent, quantity-aware trade panel.**

Six decisions define it:

1. **Adopt 1688's *information model*, reject 1688's *visual density*.** The laddered price table, the SKU quantity matrix, MOQ-as-a-gate, and sourced-to-order lead times are the correct B2B mental model and ArcB2B already implements them. What should not be copied is the visual language: 12px type, seven competing reds, banner stacks, and thirty links above the fold. Bangladeshi buyers will use this on a mid-range Android phone over mobile data; density is a cost, not a feature.

2. **The price ladder becomes the quantity input.** Today it is passive display sitting above a separate matrix. Make each tier a button that sets quantity to that tier's minimum, and show the *live* applicable tier as the buyer types. Quantity and price are one decision in B2B, so they should be one control. This is the plan's central interaction and I have not seen it done cleanly on any of the reference platforms.

3. **There is no "Buy Now".** ArcB2B carts are multi-SKU, MOQ-validated, and checkout requires district-based courier selection and a payment method. A one-tap path that bypasses the cart contradicts the matrix mental model and creates a second checkout to maintain forever. **Recommended: drop it.** The primary CTA is chosen by listing state (§13), not by convention.

4. **Show landed cost, not unit price alone.** Every ArcB2B buyer is a reseller computing margin. The panel should surface subtotal → estimated courier by district → payment method fee → **estimated landed cost per unit**. Baymard's benchmark finds 81% of sites fail to show per-unit price on multi-quantity products and 67% omit total order cost; for a B2B buyer those two omissions are the whole decision. This is ArcB2B's clearest differentiator against every reference platform.

5. **Trust is a ledger of four measured numbers, not a wall of badges.** Response rate, on-time dispatch, reorder rate, dispute resolution — each with a definition, each computed from real orders, each rendered as "not enough data yet" until it is. Delete the fabricated metrics on day one (§0, finding 1).

6. **RFQ is a right-side drawer on desktop and a bottom sheet on mobile, pre-filled from page state, with a resumable dedicated page behind it.** Never a modal, never a full-page navigation from the PDP. Reasoning in §15.

**Visual direction:** Direction D-prime, *Structured Trade* — the marketplace warmth of 1688/Alibaba (orange action, red price, dense-but-ordered data) executed with enterprise-SaaS discipline (an 8pt grid, one accent, hairline borders, generous line-height, no gradients on data surfaces). Full justification in §5.

---

## 2. Competitive design analysis

### 2.1 Research method and honesty note

I fetched what was fetchable and I am explicit about what was not, because fabricated citations are worse than fewer citations.

| Source | URL | Result |
|---|---|---|
| Alibaba.com homepage | https://www.alibaba.com/ | **Fetched.** Nav, search, category tabs, RFQ entry points verified. |
| Baymard Institute — product page UX benchmark | https://baymard.com/blog/current-state-ecommerce-product-page-ux | **Fetched.** Quantified findings used below and in §1. |
| Baymard — product page research programme | https://baymard.com/research/product-page | Referenced; 2 years of testing, 1,300+ recorded usability issues. |
| Baymard — 2026 roadmap (confirms new B2B benchmarks in progress) | https://baymard.com/blog/year-in-review-2025-and-2026-roadmap | Referenced. |
| Kamae — B2B sourcing platform, Bangladesh | https://kamae.app/ | **Blocked (HTTP 403).** Analysis below is from the Play Store listing and public profiles, not from the live UI. |
| Kamae Android app | https://play.google.com/store/apps/details?id=com.kamaebd.app | Listing fetched but truncated by Google; positioning confirmed, UI not observed. |
| Kamae public profile | https://www.facebook.com/kamaeapp/ | Positioning and support model. |
| 1688.com | https://www.1688.com/ | **Not renderable** — the page is JS-driven and geo-gated; the fetch returned no content. My 1688 analysis below is from prior knowledge of the platform and from the PRD's own description of it (PRD §5.4 and §6.1, written by whoever specified this project against the live site). I flag it as such rather than dressing it as fresh observation. |
| Alibaba MOQ / consolidated-MOQ seller documentation | https://seller.alibaba.com/blogs/2026/southeast-asia/apparel-accessories/consolidated-moq-multiple-sku-guide-alibaba-b2b | Fetched via search; confirms multi-SKU consolidated MOQ is current platform behaviour. |
| Alibaba low-MOQ buyer guide | https://www.alibaba.com/product-insights/how-to-choose-low-moq-products-expert-buying-guide-2026.html | Confirms MOQ shown on every listing. |

Additional platforms I draw on from direct professional familiarity, cited by root domain only so no URL is invented: **IndiaMART** (https://www.indiamart.com/) as the closest structural analogue to Bangladesh's market; **Amazon Business** (https://business.amazon.com/) for quantity-discount presentation inside a B2C chassis; **Faire** (https://www.faire.com/) and **Ankorstore** (https://www.ankorstore.com/) for modern wholesale UX; **McMaster-Carr** (https://www.mcmaster.com/) as the benchmark for specification-led B2B; **Daraz** (https://www.daraz.com.bd/) for what Bangladeshi buyers are already trained on.

### 2.2 Platform-by-platform

**1688.com** — Chinese domestic wholesale, the platform ArcB2B is conceptually modelled on.

- *Information density:* Extreme. Ladder price table, SKU matrix, factory capability block, and description images all fight for the same fold.
- *Product page:* The ladder table and the colour × size quantity grid are the two load-bearing elements. Buyers do not "add to cart" — they fill a matrix. Consolidated MOQ across variants is the norm.
- *Supplier presentation:* Capability-first — years trading, factory floor area, monthly output, repeat-purchase rate. Very little brand storytelling.
- *Mobile:* App-first; the web mobile experience is a secondary concern.
- **Why the pattern works:** buyers are professional, repeat, price-driven, and Chinese-literate. Density is cheap when the reader already knows the schema.
- **Suitability for ArcB2B:** *Model — yes. Chrome — no.* ArcB2B's buyer is a Dhaka shop owner or reseller who may be new to wholesale platforms, on a mid-tier Android, in Bangla or English. The schema must be taught by the layout, not assumed.

**Alibaba.com** — cross-border B2B, the internationalised sibling.

- *Verified from the live homepage:* auth + "My Alibaba / Orders / Messages" cluster, language and currency selectors, a single dominant search field ("What are you looking for?"), tabbed scopes (**AI Mode / Products / Manufacturers / Worldwide**), 38+ industry categories, and RFQ surfaced in **multiple** places including a dedicated homepage card ("Post customized sourcing requirements to get quotes from multiple matching suppliers").
- *Product page:* Sticky purchase panel; Trade Assurance as a persistent trust rail; tabbed lower page (Description / Specs / Company / Reviews); supplier response metrics beside the CTAs.
- **Why the patterns work:** *Search-as-tabbed-scope* — buyers arrive with different intents (a part, a factory, a quote) and the tab admits that instead of forcing one ranking model to serve all three. *RFQ in multiple entry points* — for a first-time cross-border buyer, "ask for a quote" is a lower-anxiety first action than "buy", so it is offered wherever hesitation occurs. *Sticky purchase panel* — the evaluation content is long; the decision must stay reachable.
- **Suitability:** high. Alibaba is the closest match to ArcB2B's buyer-education problem. Borrow the sticky panel, the scoped search, and RFQ ubiquity. Do not borrow the tab bar that buries specifications behind a click (see §12), and do not borrow the badge inflation — "Gold Supplier" style tiers are pay-to-play signals that ArcB2B cannot honestly replicate.

**Kamae.app** — the direct Bangladeshi competitor. *Live UI not observed (403); positioning only.*

- Sources from China (Alibaba/Chinese manufacturers) for Bangladeshi buyers, priced in BDT, with the full chain handled — sourcing, supplier communication, payment, shipping, customs clearance. Nationwide free shipping. App-first (10,000+ installs), support 12 hours/day by phone, live chat, and Facebook.
- **What this tells us, and it is the most strategically important finding in this section:** Kamae competes on *removing the import problem*, not on catalogue size. Their pitch is "pay in Taka, we handle customs." ArcB2B's PRD is the same shape (1688 import + markup + escrow + local courier).
- **Consequence for the PDP:** the differentiator cannot be "more products". It has to be **certainty** — a visible, itemised, per-unit landed cost with a committed delivery window and escrow terms, on the product page, before any conversation. That is precisely §1 recommendation 4. It is also why "Free shipping nationwide" is a claim ArcB2B must either match on the PDP or explicitly out-argue with a cheaper landed total.
- **Suitability:** treat as the competitive floor for trust and clarity, not as a UI reference.

**IndiaMART** — closest structural analogue for a South Asian market.

- RFQ-first: the dominant CTA on most listings is "Get Best Price", not "Buy". Price is frequently withheld pending contact.
- **Why it works:** in fragmented markets with negotiated pricing, listing a firm price is a commercial disadvantage for the seller, so the platform optimises for lead capture.
- **Why ArcB2B should partially reject it:** "Get Best Price" everywhere destroys comparison shopping and pushes every purchase into a slow human loop. ArcB2B has real published tier pricing from its import pipeline — that is an advantage over IndiaMART and it should be spent, not hidden. **Recommendation: published price is the default; RFQ is the escape hatch for volume above the top tier, customisation, or genuinely quote-only lines.**

**Amazon Business** — quantity discounts inside a B2C chassis.

- Tiered "buy more, save more" presented as a compact table near the buy box; business-pricing and VAT-exclusive toggles.
- **Why it works:** it does not restructure the page for B2B, it *annotates* it — low cognitive cost for buyers who already know the B2C layout.
- **Suitability:** the *restraint* is worth borrowing (the ladder is a small precise table, not a hero banner). The chassis is not — ArcB2B's SKU-matrix ordering genuinely needs more room than an annotation.

**Faire / Ankorstore** — modern Western wholesale.

- Generous whitespace, editorial photography, brand-led supplier pages, opening-order minimums stated in currency rather than units, net-60 terms surfaced as a benefit.
- **Why it works:** their buyer is a boutique owner making a taste decision; the product is aspirational and the catalogue is curated.
- **Suitability:** borrow the *typographic calm* and the supplier-as-brand treatment for verified local manufacturers. Reject the low information density — a Dhaka electronics reseller buying 500 phone cases is making a margin decision, not a taste decision, and needs the numbers.

**McMaster-Carr** — the benchmark nobody in e-commerce beats on specification UX.

- Specifications *are* the product page. Instant filtering, dimension diagrams, zero marketing copy, sub-second navigation.
- **Why it works:** the buyer knows exactly what they need and the only job is unambiguous identification.
- **Suitability:** borrow the principle that **specifications must be visible, not tabbed away** (§12), and borrow the performance discipline. Reject the total absence of persuasion — ArcB2B's buyer often does need to be convinced the supplier is real.

**Daraz Bangladesh** — the local trained behaviour.

- Orange action colour, red prices, dense mobile cards, bottom tab bar, voucher-heavy chrome.
- **Suitability:** important for *familiarity* — the bottom tab bar, the red price treatment and a single dominant action colour are all worth keeping. **Revised in review:** this section originally also recommended keeping the reference build's orange for continuity. That was wrong for a platform that needs its own identity, and the shipped palette uses a deep trade teal instead (§24). What carries the familiarity is the *grammar* — one saturated action colour, red money, a bottom tab bar — not the specific hue. Reject the voucher clutter and the constant urgency theatre: B2B buyers reorder monthly and manufactured scarcity erodes credibility fast.

### 2.3 Comparison matrix

| Dimension | 1688 | Alibaba | Kamae | IndiaMART | Faire | McMaster | **ArcB2B target** |
|---|---|---|---|---|---|---|---|
| Information density | Extreme | High | Unknown | High | Low | High, ordered | **Medium-high, ordered** |
| Visual polish | Low | Medium | Unknown | Low | High | Utilitarian | **High** |
| Ladder pricing | Core | Core | — | Rare | Minimums only | Qty breaks | **Core, interactive** |
| SKU matrix ordering | Signature | Partial | — | No | No | No | **Signature** |
| MOQ prominence | High | High | — | High | Currency-based | — | **High, as a gate** |
| Primary CTA | Fill matrix | Contact / RFQ | App flow | Get Best Price | Add to order | Add to order | **State-dependent (§13)** |
| Landed cost shown | No | No | Claimed free ship | No | No | Shipping calc | **Yes — differentiator** |
| Supplier trust model | Capability data | Badge tiers | Platform-as-trust | Verified tiers | Brand | N/A | **4 measured metrics** |
| Specs placement | Inline, dense | Tabbed | — | Inline | Minimal | The whole page | **Inline, two-column** |
| Mobile quality | App-first | Good | App-first | Poor web | Good | Adequate | **First-class web + PWA** |
| Bangla support | — | — | Yes | — | — | — | **Full bilingual** |

---

## 3. What actually makes a B2B product page different

The brief asks this directly (§30). The answer is not "add MOQ". It is that a B2C PDP resolves **one** question and a B2B PDP resolves **ten**, in a fixed order, and the layout either respects that order or fights it.

A B2C buyer asks: *do I want this, at this price, arriving by then?* One person, one unit, minutes to decide, and the platform is the guarantor.

An ArcB2B buyer asks, roughly in this sequence:

| # | Buyer question | Where the page answers it | Priority |
|---|---|---|---|
| 1 | Is this the right item? | Gallery + title + key attributes above the fold; real zoom | P0 |
| 2 | What is my price *at my quantity*? | Interactive tier ladder — the answer must change as they type | P0 |
| 3 | Can I even buy this? (MOQ) | MOQ chip beside the title **and** as a gate on the CTA | P0 |
| 4 | What will it actually cost me landed? | Landed-cost block: subtotal + courier + fee + per-unit landed | P0 |
| 5 | Can I trust the seller? | Trust ledger — four measured numbers, not badges | P0 |
| 6 | When does it arrive? | Lead time + district-aware courier estimate, stated as a range | P0 |
| 7 | Can I mix variants? | SKU quantity matrix with consolidated MOQ | P0 |
| 8 | Can I negotiate / go bigger? | RFQ drawer, offered contextually at the top tier | P0 |
| 9 | Can they customise / brand it? | Customisation block in specs; drives RFQ | P1 |
| 10 | Can I talk to a human? | Persistent chat affordance, product context attached | P0 |

**Design consequences that fall directly out of that table:**

- **Price is a function, not a number.** Every price on the page must be qualified by quantity. A bare "৳500" is a lie in B2B. The existing `unitPriceForQty()` already models this correctly; the UI must expose it live.
- **Quantity is not a stepper, it is a plan.** The buyer is allocating across variants under a single consolidated MOQ. A `-`/`+` control is the wrong instrument; a matrix is the right one.
- **The decision is deferred and shared.** B2B buyers leave, check with a partner, compare, and return — often on a different device. Therefore: shareable URL state (`?qty=`), a real save/wishlist that works before sign-in (Baymard: 89% of sites get this wrong, 21% of users rely on it), and a copyable quote summary. This is a hard requirement, not a nice-to-have.
- **Trust must be quantified because the brand is unknown.** Nobody has heard of ArcB2B or of "Guangzhou Lianhe". Unverifiable badges do nothing; four measured numbers with definitions do.
- **Two decision modes must coexist.** *Transact now* (published price, in stock, add to cart) and *negotiate* (volume, custom, quote-only). One page, two exits, no ambiguity about which is which.

---

## 4. Design direction options

Scored 1–5 for ArcB2B suitability.

### Direction A — "Wholesale Terminal" (1688-faithful)
High-density port of the 1688 mental model: 12–13px type, everything above the fold, tables everywhere, minimal whitespace.
- **Strengths:** maximum information per screen; instantly legible to experienced wholesale buyers; fastest to build from the existing components.
- **Weaknesses:** hostile to first-time buyers; nearly untranslatable to mobile without a separate design; Bangla needs *more* leading, not less, so density and localisation fight each other; reads cheap, which undermines escrow trust.
- **Best for:** a mature market of professional repeat buyers.
- **ArcB2B suitability: 2/5.** Wrong for a platform whose growth depends on converting first-time importers.

### Direction B — "Modern Minimal B2B" (Faire-like)
Generous whitespace, large photography, 16px+ body, progressive disclosure, one idea per screenful.
- **Strengths:** premium and trustworthy; excellent mobile translation; accessible by default; strong Bangla rendering.
- **Weaknesses:** pushes the ladder, MOQ, and matrix below the fold; a professional buyer comparing five listings has to scroll for the numbers; whitespace reads as "not much inventory" on a wholesale platform.
- **Best for:** curated, brand-led wholesale.
- **ArcB2B suitability: 3/5.** Right instincts, wrong information priority.

### Direction C — "Enterprise Console" (dashboard-like)
Treat the PDP as a procurement record: data tables, tight rhythm, muted palette, tabular numerics throughout.
- **Strengths:** superb for specs and price comparison; scales to complex products; already half-built in the repo's `.admin` token set.
- **Weaknesses:** cold; no persuasion; product photography is structurally deprioritised; the emotional register is wrong for the discovery half of the funnel.
- **Best for:** a logged-in procurement portal with negotiated contracts.
- **ArcB2B suitability: 3/5** for the lower page, **1/5** for the hero.

### Direction D — "Structured Trade" (hybrid) ✅ **SELECTED**
1688's information model + Alibaba's sticky decision panel + SaaS layout discipline + premium product presentation + mobile-first purchase bar. Dense where numbers live, calm where evaluation happens.
- **Strengths:** correct information priority *and* readable; extends the existing token system rather than replacing it; mobile is a first-class transformation, not a fallback; leaves room for the landed-cost differentiator.
- **Weaknesses:** requires real discipline — hybrids drift into inconsistency without hard rules. §5 supplies those rules.
- **ArcB2B suitability: 5/5.**

### Direction E — "Conversation-First" (Kamae/IndiaMART-like)
Chat and RFQ are the primary actions; price is indicative; a human closes the deal.
- **Strengths:** highest conversion on complex or custom orders; matches how Bangladeshi wholesale actually works today; lowest data requirements.
- **Weaknesses:** does not scale past a few hundred orders/day without a large support team; kills self-service comparison; wastes the published-price advantage the import pipeline provides.
- **ArcB2B suitability: 2/5 as a direction, 5/5 as a *layer*.** Adopt it as the escape hatch inside Direction D, not as the frame.

---

## 5. The final ArcB2B design direction

> **ArcB2B should use Direction D, "Structured Trade": 1688's information model, executed with enterprise-SaaS layout discipline, wrapped in a premium light-first marketplace skin already present in the codebase — because ArcB2B's buyer must be *taught* the wholesale schema while a professional buyer must be able to *skip* the teaching, and only a density-zoned layout serves both.**

### 5.1 The one rule that keeps a hybrid coherent: density zoning

Every region of the page is assigned a density class, and the class dictates type size, line-height, and spacing. No component may mix classes.

| Zone | Density | Body size / leading | Regions |
|---|---|---|---|
| **Evidence** | Calm | 15px / 1.7 | Gallery, description, reviews, supplier narrative |
| **Decision** | Tight | 13–14px / 1.5, tabular figures | Tier ladder, SKU matrix, landed cost, buy box |
| **Reference** | Dense | 13px / 1.55, two-column | Specifications, certifications, packaging |
| **Navigation** | Compact | 12–13px | Header, breadcrumb, footer, recommendation rails |

Numbers are always tabular. Prices always use the `.price` treatment. Nothing in the Decision zone gets a gradient, a shadow beyond one elevation step, or a rounded corner above 12px. This is the whole discipline; it is short on purpose so it actually gets followed.

### 5.2 Borrow — conceptually

| Pattern | Reference | Why it earns its place in ArcB2B |
|---|---|---|
| Quantity-tier price ladder | 1688 / Alibaba | The correct B2B price model; already implemented in `lib/store.ts`. |
| SKU quantity matrix, consolidated MOQ | 1688 | The signature bulk-order interaction; matches how a reseller actually buys — a mix, not a unit. |
| Sticky purchase panel | Alibaba | The evaluation content is long; the decision must remain reachable at all times. |
| RFQ at multiple entry points | Alibaba | Reduces the anxiety cost of a first order for a buyer who has never imported. |
| Scoped search (category selector in the field) | Alibaba / existing header | Already built; a 20+ category catalogue needs scope narrowing to keep result relevance usable. |
| Capability-led supplier data | 1688 | Years, output, reorder rate persuade a professional buyer; brand storytelling does not. |
| Quantity breaks as a small precise table | Amazon Business | Restraint: the ladder is a control, not a hero. |
| Specifications visible, not tabbed | McMaster-Carr | Specs are the identification instrument; a click between the buyer and identification is a click too many. |
| Orange action / red price / bottom tab bar | Daraz + existing tokens | Local familiarity — do not make buyers relearn colour grammar. |
| Bottom sheets for heavy mobile forms | Modern mobile convention | Keeps page context visible behind the form; back-button friendly. |

### 5.3 Avoid — deliberately

| Pattern | Where it comes from | Why ArcB2B must not ship it |
|---|---|---|
| Pay-to-play supplier tiers ("Gold", "Diamond") | Alibaba | Signals purchased status, not verified quality. ArcB2B cannot honestly operate one at launch, and a fake tier is corrosive. |
| Manufactured urgency (countdowns on staples, "3 left!") | Daraz / 1688 | B2B buyers reorder monthly. Urgency theatre destroys credibility with exactly the repeat buyers the business depends on. |
| Price hidden behind "Get Best Price" by default | IndiaMART | Discards the published-price advantage of the import pipeline and forces every order through a human. |
| Tabbed lower page (Description / Specs / Reviews) | Alibaba | Hides P0 evaluation content, halves scroll-depth analytics, and breaks in-page search (Ctrl-F) and deep links. Use anchored sections with a sticky section-nav instead. |
| Banner and voucher stacks in the hero | 1688 / Daraz | Competes with the product for the fold and pushes MOQ and price down. |
| Description-as-one-giant-image | 1688 imports | Unsearchable, unindexable, untranslatable, inaccessible, and a Core Web Vitals disaster. Imported description images must be split and captioned (§12). |
| Auto-playing video with sound | General e-commerce | Bandwidth cost on mobile data; hostile. |
| Any fabricated metric | **Current ArcB2B code** | Highest-priority deletion. See §0, findings 1–3. |
| Infinite recommendation rails | 1688 | Each rail costs LCP/INP budget and attention. Three, maximum (§16). |

### 5.4 Redesign — patterns to take further than the references do

1. **Ladder → interactive control.** Tiers become buttons; selecting one sets quantity to its minimum; the active tier is derived from live quantity; the next-tier nudge is always visible ("add 12 more → ৳470/pc, save ৳1,410"). *Nobody in the reference set does this well.*
2. **SKU matrix → real B2B input.** Add per-row and per-column subtotals, a "distribute evenly" helper, paste-from-spreadsheet support (resellers keep their mix in Excel), sticky row and column headers, and stock shown as a state (`In stock 240` / `Low 12` / `Sourced 10–14d`) rather than a bare integer. Replace the `<input type="number">` spinners with a text input plus `inputMode="numeric"` — spinners are unusable for entering 480.
3. **Trust → measured ledger.** Four metrics, each with a definition popover and an explicit "not enough orders yet" state. Never compute a metric from a string.
4. **Shipping → landed cost.** District selector (persisted per buyer), courier options with price and window, and the resulting per-unit landed cost. Directly attacks Baymard findings 5 and 6, and directly answers Kamae's "free nationwide shipping" claim.
5. **Zoom → inspection.** A real 2× source, a lens on desktop, pinch-zoom in a fullscreen sheet on mobile, and a **"Sourced-photo" vs "Studio photo"** label on imported imagery. Honesty about photo provenance is a trust asset on an import-driven catalogue.
6. **Specs → scannable and filterable.** Two-column definition list, the eight highest-value attributes promoted above the fold as chips, the remainder in a "Full specifications" region that is *expanded by default on desktop* and collapsed on mobile.

### 5.5 Combine — where two references merge into one component

- **Trade Panel** = Alibaba's sticky buy box + 1688's ladder + Amazon Business's discount table + an ArcB2B-original landed-cost block.
- **Sold-by / Sourced-from** = 1688's factory capability card + Alibaba's response metrics + ArcB2B's escrow guarantee, in **one component with two data modes** (P0: ArcB2B-as-seller with a sourced-from provenance line; P1: real supplier). This is the seam from §0 and designing it now is what prevents a P1 rewrite.
- **Evidence Stack** = Faire's editorial calm for the description + McMaster's discipline for the specs, as anchored sections under one sticky section-nav.
- **Mobile Trade Bar** = Daraz's sticky bottom CTA + the ladder's live unit price + an MOQ gate, sharing the viewport with the existing `MobileTabBar` per §18.

### 5.6 Why this is right for Bangladesh specifically

1. **Bilingual by construction.** Bangla needs ~15% more leading and zero negative tracking; `globals.css` already encodes this. A dense direction would fight it, and Bangla would render as the second-class option. Calm evidence zones let both scripts look intentional. This also means **no text in images** — including imported 1688 description images (§5.3).
2. **Mid-range Android on mobile data is the primary device.** The performance budget in §22 is a design constraint, not an afterthought: it rules out heavy client-side hydration in the hero and rules out image-based descriptions.
3. **Price sensitivity is absolute and margin is computed on the spot.** Landed cost, tier ladder, and per-unit maths are the conversion mechanics — not decoration.
4. **Trust is the market's binding constraint.** Advance payment to an unknown online seller is the single biggest blocker in Bangladeshi B2B. Escrow, measured metrics, dispute windows, and honest photo provenance must be *visible on the product page*, not buried in a policy link.
5. **Chat is culturally the closer.** Bangladeshi wholesale runs on conversation (Kamae's own support model — phone, live chat, Facebook, 12h/day — confirms it). Direction D keeps chat and RFQ permanently one tap away without making them the only path.
6. **Familiar colour grammar.** Orange action, red price, bottom tabs — already in the codebase, already what Daraz has trained the market on. Familiarity is free conversion.

---

## 6. Product page wireframes

### 6.1 Desktop — 1440px+ (`xl`), above the fold

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ UTILITY BAR   Deliver to: Dhaka ▾  ·  ৳ BDT  ·  বাংলা/EN     How it works · Orders · Sell│  36px, scrolls away
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ▣ ArcB2B   ┌──────────────────────────────────────────────┐  ⌨ Chat  🔔  🛒  👤 Account │  STICKY
│            │ All ▾ │ What are you sourcing today?  │ 🔍 Search│      3            2       │  condenses on scroll
│            └──────────────────────────────────────────────┘                             │
│            Trending: TWS earbuds · Kurti · Phone case                                   │  folds on scroll
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ☰ All Categories │ Electronics │ Apparel │ Home │ Beauty │ … │  ⚡Flash Deals · 📄 RFQ  │  scrolls away
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Home / Electronics / Audio / TWS Earbuds Pro X — 500 pcs bulk            ← Back to list │  breadcrumb + return link
├──────────────────────────────────────┬─────────────────────────────────────────────────┤
│                                      │  ⬤ MOQ 50 pcs   ⬤ Local stock   ⬤ Best seller  │
│   ┌──────────────────────────────┐   │                                                 │
│   │                              │   │  TWS Earbuds Pro X — ENC dual-mic,               │
│   │      PRIMARY MEDIA           │   │  wireless charging case                          │
│   │      1:1, LCP, priority      │   │                                                 │
│   │                              │   │  ★★★★☆ 4.6 (128 reviews) · 2,340 sold · SKU AB-9241│
│   │   ⤢ fullscreen   🔍 lens     │   │                                                 │
│   │                              │   │ ┌─── TRADE PANEL ───────────────────── sticky ─┐ │
│   └──────────────────────────────┘   │ │ QUANTITY PRICE LADDER — tap a tier            │ │
│   ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐          │ │ ┌────────┬────────┬────────┬────────┐         │ │
│   │▣ ││  ││  ││▶ ││  ││+4│          │ │ │ 50–99  │100–199 │200–499 │ 500+   │         │ │
│   └──┘└──┘└──┘└──┘└──┘└──┘          │ │ │ ৳500   │ ৳470   │ ৳452   │ ৳440   │         │ │
│    ▲ active   ▲ video               │ │ │ /pc    │ /pc  ◀ │ /pc    │ BEST   │         │ │
│                                      │ │ └────────┴────────┴────────┴────────┘         │ │
│   Studio photo · verified 12 Aug     │ │  ← selected tier is ringed + raised            │ │
│                                      │ │                                                │ │
│   ── KEY ATTRIBUTES ──────────────    │ │ ৳470 /pc   ▾ add 88 more → ৳452 (save ৳3,976) │ │
│   Brand      Aukey OEM               │ │                                                │ │
│   Battery    400 mAh + 40 mAh        │ │ ┌── YOUR MIX ─────────────────── 112 pcs ───┐ │ │
│   Bluetooth  5.3                     │ │ │        │ S   │ M   │ L   │  row total     │ │ │
│   Cert       CE, RoHS                │ │ │ Black  │ 40  │ 32  │  0  │  72           │ │ │
│   Carton     100 pcs / 8 kg          │ │ │ White  │ 20  │ 20  │  0  │  40           │ │ │
│   Lead time  Ships in 3 days         │ │ │ ─────────────────────────────────────────│ │ │
│   Custom     Logo print from 500 pcs │ │ │ stock  │ 240 │ 180 │ Low 12 │            │ │ │
│   → Full specifications (48)         │ │ └───────────────────────── ⊞ distribute ──┘ │ │
│                                      │ │                                                │ │
│                                      │ │ ── LANDED COST ────────────────────────────── │ │
│                                      │ │ 112 pcs × ৳470            ৳52,640            │ │
│                                      │ │ Courier — Dhaka Metro ▾    ৳1,120 (Pathao)   │ │
│                                      │ │ bKash fee (1.5%)             ৳806            │ │
│                                      │ │ ────────────────────────────────────────────  │ │
│                                      │ │ Landed total                ৳54,566           │ │
│                                      │ │ Per unit landed             ৳487.20           │ │
│                                      │ │                                                │ │
│                                      │ │ ┌──────────────────────────────────────────┐ │ │
│                                      │ │ │      ADD MIX TO CART  (112 pcs)          │ │ │  primary
│                                      │ │ └──────────────────────────────────────────┘ │ │
│                                      │ │ [ Request quote ] [ Order sample ৳650 ]      │ │  secondary
│                                      │ │ [ 💬 Chat ]  [ ♡ Save ]  [ ⇗ Share ]         │ │  tertiary
│                                      │ │                                                │ │
│                                      │ │ ✓ Escrow — released on delivery confirmation  │ │
│                                      │ │ ✓ 7-day dispute window, photo evidence        │ │
│                                      │ │ ✓ bKash · Nagad · Rocket · bank transfer      │ │
│                                      │ └────────────────────────────────────────────────┘ │
├──────────────────────────────────────┴─────────────────────────────────────────────────┤
│ SOLD BY / SOURCED FROM                                                                  │
│ ┌────────────────────────────────────┬──────────────────────────────────────────────┐   │
│ │ ▣ ArcB2B Sourcing  ✓ Escrow seller │  Response 96%   On-time 94%                  │   │
│ │ Dhaka · operating 3 yrs · 1,240 SKU│  Reorder  38%   Disputes 100% resolved       │   │
│ │ Sourced from: Guangzhou Lianhe     │  ⓘ each metric defines itself on hover       │   │
│ │  (verified 1688 factory, 6 yrs)    │  [ Visit store ]  [ 💬 Message ]             │   │
│ └────────────────────────────────────┴──────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┃ Overview  ┃ Specifications  ┃ Shipping  ┃ Reviews (128)  ┃ Supplier  ┃  ← sticky nav │  anchors, not tabs
├────────────────────────────────────────────────────────────────────────────────────────┤
│ § OVERVIEW — rich description, max 65ch measure, images captioned & lazy               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ § SPECIFICATIONS — two-column definition list, 48 rows, expanded on desktop            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ § SHIPPING & DELIVERY — district selector · courier comparison table · bulk/pallet note │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ § REVIEWS — 4.6 ▮▮▮▮▯ · distribution bars · filters · photo strip · seller replies      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ § SUPPLIER — capability, certifications, other products (6-up rail)                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ RAIL 1  Similar products (same category, comparable tier price)        6-up             │
│ RAIL 2  Frequently bought together (cases + cables + packaging)        4-up + bundle CTA│
│ RAIL 3  Recently viewed                                               6-up, client-only │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER — service strip · 4 link columns · payment marks · app install · legal           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Laptop — 1024–1279px (`lg`)

Same two-column structure, compressed and reordered inside the panel.

```
┌──────────────────────────────────────────────────────────────────────┐
│ HEADER (utility bar hidden below 1024; language + district move into  │
│         the account menu)                                             │
├───────────────────────────────┬──────────────────────────────────────┤
│  MEDIA  380px fixed           │  TRADE PANEL  fluid, min 420px       │
│  thumbs: 5 + overflow chip    │  ladder: horizontal scroll, snap      │
│  key attributes: 5 rows       │  matrix: horizontal scroll,           │
│  + "Full specifications"      │          sticky first column          │
│                               │  landed cost: collapsed to 2 lines    │
│                               │          + "Breakdown ▾"              │
└───────────────────────────────┴──────────────────────────────────────┘
Sticky section-nav condenses to icons + labels; rails drop to 5-up / 4-up.
```

### 6.3 Tablet — 768–1023px (`md`)

**The key decision: stop trying to keep two columns.** At 768px a genuine two-column hero gives the matrix under 300px — unusable. Instead: media and summary side by side, then the trade panel full width beneath them.

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER — compact: logo, search (full width row 2), icons      │
├──────────────────────────────────────────────────────────────┤
│ BREADCRUMB (truncated middle: Home / … / TWS Earbuds Pro X)   │
├────────────────────────────┬─────────────────────────────────┤
│  MEDIA  swipeable, 1:1     │  MOQ · badges                   │
│  dots + counter 3/9        │  TITLE                          │
│                            │  rating · sold · SKU            │
│                            │  ৳470/pc from · MOQ 50          │
│                            │  ✓ escrow  ✓ 3-day dispatch     │
├────────────────────────────┴─────────────────────────────────┤
│ TRADE PANEL — full width, no longer sticky                    │
│ ladder: 4 tiers across full width (fits at 768px)             │
│ matrix: full width, sticky first column, h-scroll if > 4 cols │
│ landed cost: two columns of figures                           │
│ CTAs: primary full width, secondary 50/50                     │
├──────────────────────────────────────────────────────────────┤
│ SOLD BY — single card, metrics 2×2                            │
│ SECTION NAV — sticky, horizontally scrollable                 │
│ SECTIONS — specs collapse to single column, accordion below 8 │
│ RAILS — 3-up, snap-scroll                                     │
├──────────────────────────────────────────────────────────────┤
│ STICKY TRADE BAR appears once the panel scrolls out of view    │
└──────────────────────────────────────────────────────────────┘
```

### 6.4 Mobile — 360–767px (`base`/`sm`)

```
┌────────────────────────────────┐
│ ▣ ArcB2B    🔍  🛒²  👤        │ ← 48px, sticky, search opens overlay
├────────────────────────────────┤
│ Home / … / TWS Earbuds     ⋯   │ ← 1 line, ⋯ opens full path sheet
├────────────────────────────────┤
│                                │
│      MEDIA CAROUSEL 1:1        │ ← swipe, dots, tap → fullscreen pinch
│                          3/9   │
│  ⬤ MOQ 50   ⬤ Local stock      │ ← overlay chips, bottom-left
├────────────────────────────────┤
│ TWS Earbuds Pro X — ENC dual-  │
│ mic, wireless charging case    │
│ ★4.6 (128) · 2,340 sold        │
├────────────────────────────────┤
│ ৳470 /pc   at 100–199 pcs      │ ← live, reflects current quantity
│ from ৳440 at 500+              │
├────────────────────────────────┤
│ PRICE LADDER — h-scroll, snap  │
│ ┌────┐┌────┐┌────┐┌────┐       │
│ │50+ ││100+││200+││500+│       │
│ │৳500││৳470││৳452││৳440│       │
│ └────┘└────┘└────┘└────┘       │
├────────────────────────────────┤
│ ⊞ Choose your mix    112 pcs ▸ │ ← opens matrix BOTTOM SHEET
├────────────────────────────────┤
│ 🚚 Dhaka Metro ▾   ৳1,120      │
│    Pathao · 2–3 days            │
│ 💰 Landed ৳487.20/pc      ▾    │ ← expands breakdown inline
├────────────────────────────────┤
│ ✓ Escrow  ✓ 7-day dispute      │
├────────────────────────────────┤
│ ▸ Specifications (48)          │ ← accordions, all collapsed
│ ▸ Description                  │
│ ▸ Shipping & delivery          │
│ ▸ Reviews (128)          ★4.6  │
│ ▸ Sold by ArcB2B Sourcing      │
├────────────────────────────────┤
│ Similar products  ── 2-up grid │
│ Recently viewed   ── h-scroll  │
├────────────────────────────────┤
│ FOOTER — accordion columns      │
└────────────────────────────────┘
╔════════════════════════════════╗
║ ৳470/pc      [💬] [ADD 112 PCS]║ ← TRADE BAR, fixed, 56px
╚════════════════════════════════╝
┌────────────────────────────────┐
│ 🏠   ⊞   🔍   🛒   👤          │ ← existing MobileTabBar, 56px
└────────────────────────────────┘
```

**The bottom-of-viewport collision, resolved (see §18):** on the PDP the Trade Bar sits *above* the tab bar and the tab bar **auto-hides on scroll-down, returns on scroll-up**. Rationale: on a product page the buyer's task is this product, not navigation; the tab bar is a wayfinding tool and can yield. Total chrome at rest is 112px, which is acceptable; during downward scroll it is 56px. The page reserves `padding-bottom: calc(112px + env(safe-area-inset-bottom))`.

### 6.5 Small mobile — 320–359px

Ladder shows 2.5 tiers with a scroll hint; the Trade Bar drops the price label and keeps `[💬] [ADD 112 PCS]`; key attributes collapse to a single "Specifications" accordion; breadcrumb shows only `⋯ / Current`.

---

## 7. Component architecture

```
app/(store)/product/[slug]/page.tsx            ── Server Component (RSC)
│   ├─ generateMetadata()                      ── title, description, OG, canonical
│   ├─ <ProductJsonLd /> + <BreadcrumbJsonLd />── server-rendered, no client JS
│   ├─ loading.tsx / error.tsx / not-found.tsx  ── route-level states
│   │
├── <MarketplaceHeader>                              [layout, server shell]
│   ├── <UtilityBar>            district · currency · language · secondary links
│   ├── <PrimaryBar>            sticky
│   │   ├── <Logo>
│   │   ├── <GlobalSearch>      [client] scope select + input + suggest + trending
│   │   └── <AccountActions>    [client] chat · notifications · cart · account
│   └── <CategoryRail>          [server] + <MegaMenu> [client, lazy on intent]
│
├── <ProductBreadcrumb>          [server] + back-to-results link (from referrer)
│
├── <ProductHero>                [server layout, client islands inside]
│   ├── <ProductGallery>                              [client island]
│   │   ├── <PrimaryMedia>       next/image, priority, 2× zoom source
│   │   ├── <ZoomLens>           desktop pointer-tracked
│   │   ├── <MediaThumbRail>     images + video poster + 360 entry
│   │   ├── <MediaLightbox>      lazy: fullscreen, keyboard, pinch
│   │   ├── <VideoPlayer>        lazy, poster-first, never autoplay
│   │   └── <PhotoProvenance>    "Studio photo" | "Supplier photo" + date
│   │
│   ├── <ProductSummary>                              [server]
│   │   ├── <BadgeRow>           MOQ · stock state · seller tier · new/bestseller
│   │   ├── <ProductTitle>       h1, bilingual
│   │   ├── <ProductMeta>        rating · review count · sold · SKU · category
│   │   └── <KeyAttributes>      8 promoted specs + link to full table
│   │
│   └── <TradePanel>                                  [client island — the core]
│       ├── <PriceLadder>        interactive tiers; sets quantity
│       ├── <ActivePriceReadout> live unit price + next-tier nudge
│       ├── <SkuMatrix>          per-variant quantity, subtotals, paste, distribute
│       │   ├── <MatrixCell>     text input, inputMode numeric, stock state
│       │   └── <MatrixHelpers>  distribute evenly · clear · paste from sheet
│       ├── <MoqGate>            validation state + remediation copy
│       ├── <LandedCost>         subtotal · courier · fee · total · per-unit
│       │   └── <DistrictSelect> persisted, drives courier estimate
│       ├── <PurchaseActions>
│       │   ├── <PrimaryCta>     resolved by listing state (§13)
│       │   ├── <SecondaryCtas>  request quote · order sample
│       │   └── <TertiaryCtas>   chat · save · share · compare
│       └── <TradeAssurance>     escrow · dispute window · payment marks
│
├── <SellerBlock>                [server; two data modes — P0 / P1]
│   ├── <SellerIdentity>         ArcB2B-as-seller | supplier storefront
│   ├── <SourcingProvenance>     "Sourced from <factory>" (import listings)
│   ├── <TrustLedger>            4 measured metrics, each with definition + empty state
│   └── <SellerActions>          visit store · message  [client]
│
├── <SectionNav>                 [client] sticky anchor nav, scroll-spy
│
├── <ProductOverview>            [server] sanitised rich text, captioned images
├── <ProductSpecifications>      [server] two-column dl; <SpecSearch> [client, P1]
├── <ShippingSection>            [server shell]
│   ├── <CourierComparison>      [client] district → options, price, window
│   └── <BulkShippingNote>       pallet / carton / freight for large orders
├── <ReviewsSection>             [server, streamed in Suspense]
│   ├── <RatingSummary>          average + distribution bars + verified share
│   ├── <ReviewFilters>          [client] rating · with photos · variant · recency
│   ├── <ReviewList>             [server, paginated] + <SellerReply>
│   └── <ReviewMediaOverlay>     [client, lazy] cross-review photo carousel
├── <SupplierSection>            [server] capability, certifications, other products
│
├── <RecommendationRails>        [server, streamed]
│   ├── <SimilarProducts>
│   ├── <BoughtTogether>         + <BundleCta> [client]
│   └── <RecentlyViewed>         [client, localStorage]
│
├── <RfqDrawer>                  [client, lazy — code-split, loaded on intent]
│   ├── <RfqForm>                prefilled: product, qty, tier price, district
│   ├── <RfqAttachments>
│   └── <RfqSubmitState>         optimistic → confirmed → track link
│
├── <ChatDock>                   [client, lazy] product-context card attached
├── <MobileTradeBar>             [client] price + chat + primary CTA
├── <MobileMatrixSheet>          [client, lazy] the matrix as a bottom sheet
├── <MobileTabBar>               [client] existing; auto-hide on PDP
└── <MarketplaceFooter>          [server]
```

**Client-component budget.** Only these ship JavaScript: `GlobalSearch`, `AccountActions`, `ProductGallery`, `TradePanel`, `SectionNav`, `CourierComparison`, `ReviewFilters`, `SellerActions`, `MobileTradeBar`, `RecentlyViewed`, plus four lazy chunks (`RfqDrawer`, `MediaLightbox`, `ChatDock`, `MobileMatrixSheet`). Everything else is a Server Component. Target for the initial route JS: **≤ 110 KB gzipped**, lazy chunks excluded.

---

## 8. Header specification

The existing header is close to right. These are the changes and the reasoning.

**Row 1 — Utility bar** (36px, scrolls away, hidden below `md`)
`Deliver to: <district> ▾ · ৳ BDT · বাংলা | EN` on the left; `How it works · My orders · Sell on ArcB2B` on the right.
*Why the district selector belongs here:* it is a global preference that drives courier estimates on every PDP and in the cart. Setting it once, persisted, is what makes landed cost possible without friction. Nothing here is needed mid-task, so it is the correct thing to let scroll away.

**Row 2 — Primary bar** (sticky, condenses)
`Logo | [ All ▾ | search input | Search ] | Chat · Notifications · Cart · Account`
- **Search is the largest element on the row.** In a 20+ category, millions-of-SKU catalogue, search is the primary navigation instrument; category browsing is secondary.
- **Keep the scope selector.** It already narrows results; it is what makes "case" mean phone cases rather than packaging.
- **Add suggest-on-type** (P1): products, categories, and suppliers in one dropdown, keyboard-navigable, 200ms debounce, results server-rendered from a lightweight endpoint.
- **Condense on scroll:** logo → mark only, trending row folds, vertical padding tightens. Already implemented in `chrome.tsx` (`nextCondensedState`), and correctly avoids animating layout properties.
- **Cart and Chat carry counts.** Chat matters more on a B2B platform than on B2C — a pending supplier reply is a blocked purchase.

**Row 3 — Category rail** (scrolls away)
`☰ All Categories | <top 8 categories> | ⚡Flash Deals · 📄 Request for Quote`
- **RFQ lives here permanently,** matching Alibaba's multi-entry-point approach: a buyer who cannot find what they need must always have "ask us to source it" within reach.
- **Mega-menu on hover/focus intent,** lazily loaded — never in the initial bundle.

**Sticky rule, and why only one row pins.** A sticky element can only travel inside its own container, and pinning three rows costs 130px of a 640px mobile viewport. Pin the primary bar only; let utility and category rows scroll away. `chrome.tsx` already does this and documents why — preserve it. Publish the pinned height as `--header-h` and drive every sticky offset from it, replacing the `top-[150px]` magic number.

**Tablet (`md`):** utility bar hidden (district and language move into the account menu); search takes its own full-width row; category rail becomes horizontally scrollable.

**Mobile:** 48px bar — logo, search icon, cart, account. Tapping search opens a full-screen overlay with recent searches, trending terms, and category shortcuts; search-first because typing is the fastest path on a phone. The category rail is replaced by the `Categories` tab in the bottom bar. Notifications and chat move into the account sheet, except the chat entry on the PDP, which lives in the Trade Bar where it is contextual.

---

## 9. Breadcrumb and product context

`Home / Electronics / Audio / TWS Earbuds Pro X`

- Rendered as an `<ol>` inside `<nav aria-label="Breadcrumb">`; last item is `aria-current="page"` and not a link.
- **Emit `BreadcrumbList` JSON-LD** — currently missing (§0, finding 5). Google renders breadcrumbs in results and this is free SERP real estate.
- The product name truncates to ~42 characters on desktop with the full text as `title`; on mobile it collapses to `Home / … / <product>` and `⋯` opens the full path as a sheet.
- **Add a "Back to results" affordance** when the buyer arrived from search or a category. B2B buyers comparison-shop across many listings, and losing scroll position in a filtered result set is one of the most costly small failures on the page. Implement by carrying the origin in the URL (`?from=search&q=…`), not by reading `document.referrer`.

---

## 10. Product hero — media and summary

### 10.1 Media

- **Layout:** 1:1 primary, 420px fixed on `xl`, 380px on `lg`. Square (not 4:3) because imported catalogue imagery is overwhelmingly square, and letterboxing wholesale product shots looks like a bug.
- **The primary image is the LCP element.** It must be `next/image` with `priority`, an explicit `sizes`, and be rendered from the **Server Component** — not from inside a `'use client'` gallery. Structure: the server renders the first image as static HTML; the client gallery hydrates around it and takes over on interaction. This is the highest-value performance decision on the page.
- **Zoom:** pointer-tracked lens on desktop from a genuine 2× source (`.../w_1600`), not `scale()` on the display asset. If no high-res derivative exists, **hide the zoom affordance** rather than advertise a fake one.
- **Thumb rail:** 6 visible + `+N` overflow chip; video and 360° occupy rail positions with distinct markers; keyboard-navigable with arrow keys; `aria-current` on the active thumb.
- **Fullscreen lightbox:** lazy chunk, focus-trapped, `Esc` to close, arrow keys, pinch-zoom on touch.
- **Video:** poster-first, click to play, never autoplay, never audio by default. `IProduct.video` already exists in the model and is currently ignored.
- **360°:** P2. Only for products where rotation carries information; a frame-sequence viewer is a real bandwidth cost on mobile data.
- **Photo provenance label** — "Studio photo · verified 12 Aug" vs "Supplier photo". On an import-driven catalogue this is a trust asset, and it costs one line.
- **Placeholder:** keep the existing gradient-plus-monogram. It reads as intentional; emoji placeholders read as a prototype.

### 10.2 Summary

Order, top to bottom, and this order is load-bearing:

1. **Badge row** — `MOQ 50 pcs` · stock state · seller tier · `Best seller`/`New`. Maximum four. MOQ comes first because it is the qualifying gate: a buyer who cannot meet MOQ should learn it in the first second, not after filling a matrix.
2. **H1 title** — bilingual, `text-wrap: balance`, 24px/1.25 desktop, 20px mobile, two lines maximum before truncation.
3. **Meta line** — rating · review count · units sold · SKU · category link. **Every number here must be real.** Until a review model exists, render "No reviews yet" — never a default 4.6 (§0, finding 2).
4. **Key attributes** — the 8 highest-value specs as a compact definition list, chosen per category (electronics: certification, battery, warranty; apparel: fabric, GSM, sizes, pack). This is what lets a professional buyer skip the whole lower page. Ends with `→ Full specifications (48)`.

---

## 11. Pricing, MOQ, quantity and purchase

### 11.1 The interactive price ladder

```
QUANTITY PRICE LADDER — tap a tier to set quantity
┌──────────┬──────────┬──────────┬──────────┐
│  50–99   │ 100–199  │ 200–499  │  500+    │
│  ৳500    │  ৳470    │  ৳452    │  ৳440    │  ← .price, tabular
│  /pc     │  /pc     │  /pc     │  BEST    │
└──────────┴──────────┴──────────┴──────────┘
              ▲ active: ringed, raised, accent tint
```

- Each tier is a `role="radio"` inside a `role="radiogroup"`; keyboard-operable; selecting sets total quantity to the tier minimum (distributed across variants by the existing mix, or evenly if empty).
- The active tier is **derived from live quantity**, so typing in the matrix moves the ring. Quantity and price are one decision.
- **Next-tier nudge, always visible:** `add 88 more → ৳452/pc, save ৳3,976`. Frame it in **money saved**, not percentage — B2B buyers compute in Taka.
- Reuse `priceLadder()`, `unitPriceForQty()`, `nextTier()` unchanged. Compute upper bounds in a pure helper (`ladderRanges()`) rather than inline in JSX, so it is unit-testable.
- Horizontal snap-scroll below `md`; 4 tiers fit at 768px; 2.5 with a scroll hint at 360px.
- **Negotiable indicator:** where the top tier is open-ended, append `Volume above 500 pcs → request a quote` as a link into the RFQ drawer, pre-filled. This is the correct place to offer negotiation — at the point the ladder runs out.

### 11.2 MOQ

MOQ appears in exactly three places, each doing a different job:
1. **Badge beside the title** — the qualifying gate, seen first.
2. **Ladder floor** — the first tier starts at MOQ, so it is structurally visible.
3. **CTA gate** — below MOQ the primary CTA is disabled with actionable copy: *"Minimum order is 50 pcs — add 38 more"* plus a one-tap `Set to 50` button. Never a bare "invalid" state; always the remedy.

Also honour a **quantity step** where packaging requires it (carton of 100). This requires a `moqStep` / `packQty` field the model does not have yet (§25).

### 12.3 note — the SKU matrix

```
YOUR MIX                                    112 pcs total
┌──────────┬─────┬─────┬─────┬────────────┐
│          │  S  │  M  │  L  │  row total │
├──────────┼─────┼─────┼─────┼────────────┤
│ ⬛ Black │  40 │  32 │   0 │     72     │
│ ⬜ White │  20 │  20 │   0 │     40     │
├──────────┼─────┼─────┼─────┼────────────┤
│ available│ 240 │ 180 │ ⚠12 │            │
└──────────┴─────┴─────┴─────┴────────────┘
       [⊞ distribute evenly]  [⌫ clear]  [📋 paste from spreadsheet]
```

- Sticky first column and header row; horizontal scroll beyond 4 columns with a shadow edge hint.
- **Text inputs with `inputMode="numeric"`**, not `type="number"`. Number spinners are actively harmful for entering 480, and the mobile keyboard is already handled by `inputMode`.
- Cell states: available (plain), low stock (amber count), sourced-to-order (blue, with a lead-time tooltip), unavailable (struck, disabled, `aria-disabled`).
- **Row and column subtotals** — a reseller allocating 500 pcs across 6 SKUs needs running totals; the current implementation makes them do the arithmetic.
- **Paste from spreadsheet.** Resellers keep their mix in Excel. Accepting a pasted block into the matrix is a small feature with disproportionate value and no real competitor equivalent.
- **Consolidated MOQ** across the whole matrix, matching Alibaba's documented behaviour for multi-SKU orders — validate the sum, not each cell.
- On mobile the matrix is a **bottom sheet**, entered from a summary row (`⊞ Choose your mix — 112 pcs ▸`). A wide grid does not belong inline on a 360px viewport.

### 11.4 Landed cost — the differentiator

```
112 pcs × ৳470                 ৳52,640
Courier — Dhaka Metro ▾         ৳1,120   Pathao · 2–3 days
bKash fee (1.5%)                  ৳806
────────────────────────────────────────
Landed total                   ৳54,566
Per unit landed                ৳487.20   ⓘ what you actually pay per piece
```

Rules: only ever labelled **estimated** until checkout; the district persists across the session and the account; the courier line links to the full comparison in the Shipping section; the per-unit landed figure is the number a reseller uses to set shelf price, so it gets equal typographic weight to the unit price. Directly addresses Baymard's findings that 81% of sites omit per-unit price and 67% omit total order cost.

---

## 12. The primary CTA decision — answering §13 of the brief

The brief is right that the answer is not automatically "Buy Now". It should not be a designer's guess either — it should be **derived from data the model already carries**.

| Listing state | Condition (existing or proposed fields) | Primary CTA | Secondary | Tertiary |
|---|---|---|---|---|
| **In stock, priced** | `stock ≥ moq`, `tiers` present, `leadTimeDays = 0` | **Add mix to cart** | Request quote · Order sample | Chat · Save · Share |
| **Sourced to order, priced** | `stock < moq` or `source = '1688'`, `leadTimeDays > 0` | **Start sourcing order** (cart, lead time stated in the button's helper line) | Request quote · Order sample | Chat · Save |
| **Volume beyond top tier** | requested qty > top tier `minQty × 2` | **Request volume quote** | Add mix to cart | Chat |
| **Quote only** | `tiers` empty / `priceOnRequest` flag | **Request quote** | — | Chat · Save |
| **Customisation required** | `customisable = true` and buyer opened customisation | **Request custom quote** | Add mix to cart | Chat |
| **Out of stock / suspended** | `status ≠ 'active'` or `stock = 0` with no sourcing route | **Notify me when available** | Request quote | Similar products |
| **Below MOQ** | `qty < moq` | **Add mix to cart (disabled)** + `Set to 50 pcs` remedy | Request quote | Chat |

**And no "Buy Now" anywhere.** Justification: ArcB2B orders are multi-SKU matrices under consolidated MOQ; checkout requires district-based courier selection, a payment method, and escrow acknowledgement. A path that skips the cart either skips those decisions (and fails) or reimplements them (and doubles the checkout surface). The cart *is* the B2B express lane, because it is where a mix becomes an order. If a one-tap reorder path is wanted later, the right place is order history ("Reorder"), not the PDP.

**Visual hierarchy, strictly one primary:** primary = solid accent, full width, 48px tall; secondary = outline, side by side; tertiary = ghost icon buttons in a row. Never two solid buttons — the most common B2B PDP mistake is competing CTAs, which converts worse than either alone.

---

## 13. Shipping and delivery

Two surfaces: a **line in the Trade Panel** (the estimate, always visible) and a **full section** (the comparison, for buyers who care).

```
§ SHIPPING & DELIVERY

Deliver to  [ Dhaka Metro ▾ ]   112 pcs · 12 kg · 2 cartons

┌────────────┬──────────┬───────────┬──────────────────────────┐
│ Courier    │  Cost    │ Window    │ Notes                    │
├────────────┼──────────┼───────────┼──────────────────────────┤
│ Pathao     │  ৳1,120  │ 2–3 days  │ COD available            │
│ Steadfast  │    ৳980  │ 3–4 days  │ Cheapest for this weight │
│ RedX       │  ৳1,050  │ 2–4 days  │ Nationwide               │
│ eCourier   │  ৳1,240  │ 1–2 days  │ Fastest to Dhaka Metro   │
└────────────┴──────────┴───────────┴──────────────────────────┘
Free delivery on orders above ৳50,000 to Dhaka Metro. ✓ qualifies

Bulk over 200 kg ships by truck freight — request a freight quote.
Sourced-to-order items dispatch 10–14 days after payment confirmation.
```

**Design decisions:**
- **Estimate first, comparison second.** One number in the panel; the table only for buyers who want it. Four couriers in the buy box would be four decisions too early.
- **Weight and carton count are shown** because they drive the price and because a buyer arranging their own pickup needs them. Requires `weightGrams` and `cartonQty` fields (§25).
- **Courier logos are P1**, and only with permission. Text names ship first — an unlicensed logo wall is a legal and a visual liability.
- **Free-shipping threshold with live qualification** (`✓ qualifies` / `add ৳3,400 to qualify`) — this is a tier nudge that also answers Kamae's free-nationwide-shipping claim head-on.
- **Sourced-to-order lead time stated as a range from *payment confirmation*, not from order placement.** The distinction is the single largest source of B2B delivery disputes.
- **Integration-ready shape:** one `ShippingQuote { courier, cost, minDays, maxDays, cod, notes }` array, rendered identically whether it came from a rate card or a live Pathao/Steadfast/RedX/eCourier API. Ship with an admin-managed rate card; swap in live rates later with no UI change.

---

## 14. Seller, sourcing provenance and trust

**One component, two data modes** — the P0/P1 seam from §0.

**P0 (ArcB2B is the seller):**
```
┌───────────────────────────────────┬──────────────────────────────────┐
│ ▣ ArcB2B Sourcing   ✓ Escrow      │ Response  96%    On-time  94%    │
│ Dhaka · 3 yrs · 1,240 SKUs        │ Reorder   38%    Disputes 100%   │
│ Sourced from Guangzhou Lianhe     │ ⓘ definitions on hover           │
│   verified 1688 factory · 6 yrs   │ [ Visit store ]  [ 💬 Message ]  │
└───────────────────────────────────┴──────────────────────────────────┘
```

**P1 (marketplace, real supplier):** identity, location, years, and metrics all come from the supplier record; the provenance line disappears for locally manufactured goods and persists for re-exported ones. **No component rewrite** — only the data source changes.

**The trust ledger — four metrics, and only four:**

| Metric | Definition shown to the buyer | Source |
|---|---|---|
| Response rate | Share of buyer messages answered within 24 h, last 90 days | Messages module |
| On-time dispatch | Share of orders dispatched inside the promised window | Orders module |
| Reorder rate | Share of buyers who ordered again within 6 months | Orders module |
| Dispute resolution | Share of disputes resolved in the buyer's favour or by agreement | Orders/disputes |

Rules: every metric has an explicit **"Not enough orders yet"** state and *must* use it below a threshold (suggest 20 orders / 30 messages); every metric carries a definition popover; **no metric may be derived from anything other than transaction records** — the current `supplier.name.length % 5` implementation is deleted on day one, not deprecated.

**What is deliberately excluded:** purchased tier badges, "Trusted!" style adjectives, review counts inflated with order counts, and any certification claim without an uploaded, admin-verified document. Certifications render as `CE · RoHS` chips that open the verified document, or they do not render.

---

## 15. Specifications and description

**Layout decision: an inline two-column definition list, not tabs, not an accordion (on desktop).**

Why not tabs — the pattern Alibaba uses and the one most teams reach for: tabs hide P0 evaluation content behind a click, break `Ctrl-F`, break deep links to a spec, and destroy scroll-depth analytics. For a buyer identifying a component, tabs are strictly worse. Why not an accordion on desktop: the vertical space exists; there is no reason to charge a click for it.

```
§ SPECIFICATIONS                                    [ search specs 🔍 ]  ← P1

GENERAL                             PACKAGING & LOGISTICS
Brand           Aukey OEM           Carton qty        100 pcs
Model           AB-9241             Carton size       42 × 32 × 28 cm
Origin          Guangdong, CN       Gross weight      8.2 kg
HS code         8518.30.00          Units per pallet  1,200

TECHNICAL                           TRADE TERMS
Bluetooth       5.3                 MOQ               50 pcs
Battery         400 mAh + 40 mAh    Lead time         3 days (in stock)
Playtime        6 h + 24 h case     Sample            ৳650, 1 pc
Water rating    IPX5                Customisation     Logo print from 500 pcs
                                    Private label     Available from 2,000 pcs
Certification   CE · RoHS  ⓘ        Warranty          6 months, seller-handled
```

- **Grouped, not one flat list of 48 rows.** Groups are category-driven (General, Technical, Packaging & Logistics, Trade Terms, Compliance) and this grouping is what makes 48 rows scannable.
- **Trade Terms is a B2B-only group** and it is where three of the ten buyer questions from §3 get answered (customisation, lead time, sample).
- Below `md`: single column, and collapsed into an accordion when there are more than 8 rows.
- **Spec search** (P1) for products with 50+ attributes — the McMaster lesson.
- The `specifications: [{key, value}]` shape already exists in the model; add an optional `group` and `unit` (§25).

**Description:**
- Sanitised rich text, 65-character measure, 15px/1.7 — the calm zone.
- **Imported 1688 description images must be split into individual `next/image` elements with captions**, never rendered as one giant strip. One image is unindexable, untranslatable, inaccessible, and a CLS liability.
- Any text present only inside an image must be extracted to real text during import — this is a pipeline requirement, not a frontend one, and it is the difference between a Bangla-usable page and an English-only one.
- Lazy-load below the fold; the description is never the LCP element.

---

## 16. RFQ

**Recommendation: a right-side drawer on desktop, a bottom sheet on mobile, backed by a resumable dedicated page at `/rfq/new`.**

Reasoning against the alternatives:
- **Modal:** blocks the product context the buyer needs while writing the RFQ (quantity, tier price, specs). A buyer typing "target ৳440/pc" needs to see the ladder.
- **Inline section:** never seen — buyers who want a quote want it *now*, from the panel, not after scrolling past reviews.
- **Full-page navigation:** loses page state and back-button behaviour, and abandons the buyer if they wanted to check one more spec.
- **Drawer / sheet:** keeps the page behind it, is dismissible, is back-button friendly, and can be pre-filled from live page state. The dedicated page exists so a long RFQ survives a refresh and can be resumed or shared with a colleague — a real B2B behaviour.

```
┌──────────────────────────────────────┐
│ Request a quote                    ✕ │
├──────────────────────────────────────┤
│ ▣ TWS Earbuds Pro X                  │  ← locked context card
│   Ladder price at 500 pcs: ৳440/pc   │
├──────────────────────────────────────┤
│ Quantity *        [ 1,000    ] pcs   │  ← prefilled from panel
│ Target price      [ 425      ] /pc   │  ← ladder shown as anchor
│ Deliver to *      [ Dhaka Metro ▾ ]  │  ← prefilled from preference
│ Needed by         [ 15 Sep 2026  ]   │
│ Customisation     ☐ Logo print       │
│                   ☐ Custom packaging │
│                   ☐ Private label    │
│ Details           [ ................ │
│                     ................]│
│ Attachments       [ 📎 Add files ]   │  ← spec sheet, artwork; 5 × 10 MB
├──────────────────────────────────────┤
│ Typical first response: 4 hours       │  ← expectation, from real data
│ [        Send request        ]        │
│ Your contact details are shared with  │
│ the seller only.                      │
└──────────────────────────────────────┘
```

- **Four entry points**, matching Alibaba's verified pattern: the panel's secondary CTA; the ladder's "volume above 500 → request a quote"; the header category rail; and the out-of-stock state.
- **Everything that can be pre-filled, is.** An RFQ form that asks a buyer to retype the quantity they just entered is the reason RFQ conversion is usually poor.
- **Optimistic submit** → `Sent · we typically reply in 4 hours` → a link to `/rfq/<id>` for status. Failure keeps the draft in local storage and offers a retry; never lose typed input.
- **Lazy chunk.** The RFQ form must not be in the PDP's initial JavaScript.
- P1: quote comparison, counter-offer thread, accept-converts-to-order — all PRD §5.7 scope, all outside the PDP.

---

## 17. Reviews

```
§ REVIEWS (128)

  4.6        5 ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▯▯▯  86     Verified purchase   112 of 128
  ★★★★☆     4 ▮▮▮▮▮▯▯▯▯▯▯▯▯▯▯▯▯▯  28     With photos          34
  128 reviews 3 ▮▮▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯   9     Repeat buyers        41
              2 ▮▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯   3
              1 ▮▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯▯   2

[ All ] [ 5★ ] [ 4★ ] [ With photos ] [ Black / M ] [ Newest ▾ ]

┌────────────────────────────────────────────────────────────┐
│ ★★★★★  Rahim Electronics · Chattogram   ✓ Verified purchase │
│ Ordered 200 pcs · Black / M · 12 Aug 2026                   │
│ "Sound quality matched the sample. 3 units DOA out of 200,  │
│  seller replaced without argument. Will reorder."           │
│ [img][img]                                    👍 Helpful 12 │
│ ┌ ArcB2B Sourcing replied ────────────────────────────────┐ │
│ │ Thanks — the 3 units were replaced under the 7-day       │ │
│ │ dispute window. QC batch reference AB-9241-0812.         │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**B2B-specific decisions:**
- **Reviewer identity is a business, not a person** — shop name plus district. This is what persuades another shop owner. Individual names are neither useful nor privacy-safe here.
- **Order quantity is shown.** A 5-star review from a 500-pc order carries far more weight than one from a single sample, and hiding it hides the signal.
- **Repeat-buyer share** in the summary — the strongest quality signal in wholesale, and one no reference platform surfaces well.
- **Variant filter,** because "the Black/M runs small" is only useful to a buyer of Black/M.
- **Seller replies are prominent,** per Baymard: 89% of sites never respond to reviews, and users read a response as evidence of care. On a B2B platform where the alternative is a dispute, this matters more still.
- **Photo overlay browses across all review photos** in one carousel — Baymard finding 10, failed by 63% of sites.
- Streamed in a `Suspense` boundary; the section renders its summary from an aggregate field so the page never blocks on the review list.
- **Until the review model exists, the whole section renders an honest empty state** — `No reviews yet. Be the first to review after your order.` Not a fabricated 4.6 (§0, findings 2–4).

---

## 18. Recommendations — three rails, not eight

Each rail costs LCP budget, INP budget, and attention. Ranked by business value for a B2B buyer:

| Rail | Placement | Why it earns a slot |
|---|---|---|
| **1. Similar products** | Directly after the sections | Highest intent. A B2B buyer comparing 5 listings on price-at-quantity will otherwise leave to compare. Show *comparable tier price at the buyer's current quantity*, not the headline price — this is what makes the rail genuinely useful and is a real differentiator. |
| **2. Frequently bought together** | After Similar | Highest AOV impact. Resellers buy cases + cables + retail packaging together. Offer a bundle CTA that adds all three mixes at once. |
| **3. Recently viewed** | Last, above the footer | Pure comparison utility, zero server cost (localStorage, client-only, lazy). B2B sessions are long and multi-tab. |

**Cut, with reasons:** *Supplier's other products* — folded into the Supplier section where it has context, rather than a fourth rail. *Related category* — this is what the breadcrumb and the category page are for. *Trending / Bestsellers / Sponsored* — homepage and category-page material; on a PDP they compete with the decision.

All rails: `content-visibility: auto`, server-rendered, streamed in `Suspense`, snap-scroll on touch, and never blocking the hero.

---

## 19. Footer

Five link columns plus a service strip. The existing footer is close; this tightens it.

```
┌────────────────────────────────────────────────────────────────────────┐
│ SERVICE STRIP  🛡 Escrow protected  ·  🚚 Nationwide courier  ·         │
│                💳 bKash/Nagad/Rocket  ·  ↩ 7-day dispute window        │
├──────────────┬───────────┬───────────┬────────────┬────────────────────┤
│ ▣ ArcB2B     │ BUYING    │ SELLING   │ SUPPORT    │ COMPANY            │
│ Bangladesh's │ How to buy│ Sell on   │ Help centre│ About ArcB2B       │
│ wholesale    │ Request a │  ArcB2B   │ Contact us │ Careers            │
│ sourcing     │  quote    │ Supplier  │ Track order│ Terms of service   │
│ marketplace… │ Bulk      │  verify   │ Returns &  │ Privacy policy     │
│              │  ordering │ Supplier  │  disputes  │ Refund policy      │
│ bKash Nagad  │ Escrow &  │  fees     │ Report a   │                    │
│ Rocket Bank  │  payment  │ Seller    │  listing   │ POPULAR CATEGORIES │
│              │ Shipping &│  handbook │            │ Electronics ·      │
│ 📱 Install   │  couriers │           │ 📞 +880…   │ Apparel · Home ·   │
│    the app   │           │           │ 💬 Live    │ Beauty · Packaging │
├──────────────┴───────────┴───────────┴────────────┴────────────────────┤
│ © 2026 ArcB2B  ·  Made for Bangladesh's retailers & resellers          │
│ Trade licence #…  ·  বাংলা | English  ·  ৳ BDT                        │
└────────────────────────────────────────────────────────────────────────┘
```

Decisions: **five columns, not thirteen** — a thirteen-section footer is a sitemap, not navigation. **PWA install prompt lives here** as a persistent affordance, alongside the contextual prompt (§28). **Trade licence number in the legal bar** — for a Bangladeshi marketplace asking for advance payment, a visible registration number is a real trust signal. **Payment marks as text-styled chips** until logo permissions exist. Columns become accordions below `md`; the service strip becomes a 2×2 grid.

---

## 20. Responsive behaviour

Breakpoints, aligned to Tailwind 4 defaults so no custom screens are needed:

| Token | Width | Device reality |
|---|---|---|
| base | 320–639 | Small to standard Android |
| `sm` | 640–767 | Large phones, small tablets portrait |
| `md` | 768–1023 | Tablet |
| `lg` | 1024–1279 | Laptop |
| `xl` | 1280–1535 | Standard desktop |
| `2xl` | 1536+ | Large desktop |

**Transformation matrix** — how each component *changes*, not merely stacks:

| Component | base / sm | md | lg | xl / 2xl |
|---|---|---|---|---|
| Header | 48px, search overlay, bottom tabs | 2 rows, no utility bar | 3 rows, utility bar | 3 rows, mega-menu |
| Breadcrumb | `Home / … / product` | truncated middle | full | full + back-to-results |
| Hero | single column | media + summary side by side, panel below | 2 col, 380px media | 2 col, 420px media |
| Gallery | swipe carousel + dots | swipe + thumb rail | thumbs + lens | thumbs + lens + fullscreen |
| Price ladder | h-scroll, 2.5 visible | 4 across | 4 across | 4 across, wider cells |
| SKU matrix | **bottom sheet** | inline, sticky first col | inline | inline + subtotals |
| Landed cost | collapsed, expand inline | 2-col figures | collapsed + `Breakdown ▾` | fully expanded |
| Trade panel | inline + **fixed bottom bar** | full width, not sticky | sticky right column | sticky right column |
| Key attributes | inside accordion | 5 rows + link | 8 rows + link | 8 rows + link |
| Specifications | accordion, 1 col | 1 col expanded | 2 col | 2 col + search |
| Section nav | replaced by accordions | sticky, h-scroll | sticky, full | sticky, full |
| Reviews | summary + 3, "show more" | summary + 5 | full + filters | full + filters + photo strip |
| Rails | 2-up grid / h-scroll | 3-up | 5-up | 6-up |
| RFQ | bottom sheet | bottom sheet | right drawer | right drawer |
| Footer | accordions | 2 col | 5 col | 5 col |

**Bottom-of-viewport contract on mobile.** Two fixed bars cannot both sit at rest: `MobileTradeBar` (56px, product task) sits above `MobileTabBar` (56px, wayfinding). On the PDP only, the tab bar **hides on scroll-down and returns on scroll-up**; the Trade Bar never hides. Rationale: the buyer's task on this page is this product; navigation can yield, the purchase decision cannot. `body` reserves `padding-bottom: calc(112px + env(safe-area-inset-bottom))`. This must be implemented with a scroll-direction hook and `prefers-reduced-motion` respected (no transform animation when reduced).

---

## 21. Interaction design

| Interaction | Behaviour | Notes |
|---|---|---|
| **Gallery — thumb select** | Instant swap, no crossfade | Crossfades read as latency on product photos |
| **Gallery — desktop zoom** | Pointer-tracked lens on a 2× source; 150ms fade-in of the lens; badge hides while active | Hide the affordance entirely when no 2× derivative exists |
| **Gallery — mobile** | Horizontal swipe, snap, dots + `3/9` counter; tap → fullscreen pinch-zoom | `overscroll-behavior: contain` so page scroll isn't hijacked |
| **Video** | Poster + play button; loads the player chunk on click | Never autoplay; never audio by default |
| **Ladder — tier tap** | Sets total quantity to tier minimum; distributes across the existing mix, evenly if empty; ring animates 120ms | Announce via `aria-live`: "Quantity set to 100. Unit price ৳470." |
| **Matrix — typing** | Debounced 120ms → recompute totals, unit price, active tier, landed cost | All derived state; single reducer, no cascading effects |
| **Matrix — distribute evenly** | Spreads target quantity across in-stock cells, remainder to the largest-stock cell | One click replaces six inputs |
| **Matrix — paste** | Parses a tab/newline block from a spreadsheet into the grid; shows a diff before applying | Applying silently would be unforgivable — always confirm |
| **MOQ breach** | CTA disabled + amber inline message + `Set to 50 pcs` button; no toast | Errors belong beside the control, never in a corner |
| **Tier crossing** | Unit price and total re-render; the crossed tier pulses once (150ms); `aria-live="polite"` announces the new price | Money changed — the buyer must notice, once, not repeatedly |
| **Add to cart** | Optimistic: button → spinner (≤400ms) → `✓ Added`, header cart count increments, then a slide-in summary sheet with `Continue browsing` / `Go to cart` | Never navigate away automatically; B2B buyers add several mixes per session |
| **Add to cart — failure** | Button reverts, inline error with a retry, quantities preserved | Losing a filled matrix is the worst failure on this page |
| **RFQ open** | Drawer slides 220ms from the right (sheet up on mobile); focus moves to the first field; `Esc` closes; body scroll locked | Lazy chunk; show a skeleton if the chunk is still loading |
| **Chat** | Dock opens bottom-right with a product context card attached; unread badge in the header | Product context must be attached automatically |
| **Save / wishlist** | Works **before sign-in** (localStorage), merges on sign-in; heart fills, 150ms | Baymard: 89% of sites force registration; 21% of users rely on saving |
| **Share** | Native share sheet on mobile; copy-link with `?qty=112&variant=…` on desktop | Sharing a *configured* quote is the B2B behaviour that matters |
| **Compare** | Adds to a comparison tray (max 4), tray docks bottom-left | P1 |
| **Section nav** | Scroll-spy sets the active anchor; click smooth-scrolls with the sticky header offset accounted for | `scroll-margin-top: var(--header-h)` on every section |
| **Sticky panel** | Sticks below the header via `top: calc(var(--header-h) + 12px)`; if the panel is taller than the viewport it scrolls internally with the page | Never trap the buyer in a scroll dead-end |
| **Reviews — filter** | Client-side for the loaded page, server round-trip beyond; skeleton rows during fetch | URL reflects the filter so it is shareable |
| **District change** | Recomputes courier estimate and landed cost inline; persists to preference | No page reload, no modal |

**Motion budget:** 120–220ms, `ease-out`. Only opacity and transform. Everything inside `@media (prefers-reduced-motion: reduce)` reduces to instant. `globals.css` already establishes this discipline — keep it.

---

## 22. States — loading, empty, error

| State | Treatment |
|---|---|
| **Route loading** | `loading.tsx`: skeleton matching the real layout — media square, 3 title bars, ladder cells, panel block. Uses the existing `.skeleton` shimmer. Never a spinner: a skeleton that matches the layout eliminates CLS and communicates the shape. |
| **Streamed sections** | Reviews and rails arrive in `Suspense` with their own skeletons; the hero never waits on them. |
| **Product not found** | `not-found.tsx`: "This listing is no longer available" + search box + 6 similar products from the same category + link to the category. A dead end is a lost buyer. |
| **Out of stock** | Panel switches to `Notify me when available` + `Request quote`; ladder greys but stays visible (price history is useful); similar products promoted above the sections. |
| **Low stock** | Amber count on the matrix cell and an inline note: `Only 12 left in Black/L — 240 more arrive in 10–14 days`. Factual, not urgent. |
| **Sourced to order** | Blue informational band in the panel: `Sourced to order — dispatches 10–14 days after payment confirmation`. Stated before the CTA, never after. |
| **Seller unavailable / suspended** | Trust ledger replaced by `This seller is under review — orders are paused`. Honest and specific. Listing stays readable for SEO and for the buyer's reference. |
| **Network error (page)** | `error.tsx` with a retry that re-invokes the segment, not a full reload. Cached content stays visible where possible. |
| **Network error (partial)** | Failed section shows an inline retry; the rest of the page is unaffected. Never fail a whole page for a failed rail. |
| **Failed image** | `onError` → the existing gradient-monogram placeholder + `Image unavailable`; never a broken-image icon, never a layout shift. |
| **Empty specifications** | `Specifications are being finalised for this listing` + a `Request details` CTA into chat. Converts a gap into a lead. |
| **No reviews** | `No reviews yet — be the first to review after your order.` **This is the correct state today** (§0). |
| **RFQ submitting** | Button spinner, fields locked; success → confirmation with a tracking link; failure → draft retained in localStorage + retry. |
| **Cart operation** | Optimistic with rollback; the matrix is never cleared on failure. |
| **Offline (PWA)** | Cached PDP renders with an `Offline — prices may have changed` band; purchase CTAs disabled with `Reconnect to order`; chat and RFQ queue nothing (§28). |

---

## 23. Accessibility

Target **WCAG 2.1 AA** (PRD §9.2 already commits to this).

- **Semantics:** one `<h1>` (product title); sections are `<section aria-labelledby>`; specs are a `<dl>`; the matrix is a real `<table>` with `<th scope>` on both axes; breadcrumb is `<nav><ol>`.
- **Contrast:** the reference tokens have a real problem — accent orange `#ff6a00` on white is ~2.9:1 and **fails AA for text**, which forces an easily-forgotten "fill only, never text" rule onto every component that touches it. Choosing a darker brand hue removes the rule rather than documenting it: the shipped teal `#0f766e` clears AA in both directions (§24). The one contrast rule that remains is `--on-fill` for text on any saturated fill, so no component has to know which theme it is rendering in.
- **Focus:** the existing `:focus-visible` ring (2px accent, 2px offset) is correct — apply it to the matrix cells, ladder tiers, and thumbs, which are the easiest to miss.
- **Keyboard:** ladder = radiogroup with arrow keys; matrix = natural tab order plus arrow-key grid navigation; lightbox and drawer = focus-trapped with `Esc`; skip link to `#main`; the sticky header must not swallow anchor targets (`scroll-margin-top`).
- **Screen reader:** price changes announced `polite`; MOQ violations announced `assertive`; each matrix cell labelled `Black, Medium, quantity, 240 available`; the star rating has a text equivalent, and the star glyphs are `aria-hidden`.
- **Touch targets:** 44×44 minimum. The current 66px thumbs pass; matrix cells must be raised to ≥44px tall, and the tertiary icon buttons need padding.
- **Bilingual:** `lang` attribute on the html element and on any mixed-script run; the existing `[lang="bn"]` leading corrections are exactly right. **No text baked into images** — this is also an accessibility requirement, not only a localisation one.
- **Reduced motion:** already handled globally; extend to the tab-bar auto-hide and the tier pulse.
- **Zoom:** page must remain usable at 200% zoom and at 320px width — the sticky panel becomes static below `lg`, which is what makes this work.

---

## 24. Design tokens

> **Revised after review.** The first draft of this section reused the reference storefront's orange (`#ff6a00`). ArcB2B needs its own identity, so the shipped palette is built on a **deep trade teal** instead. Everything structural below — density zoning, the `-soft` semantic pairs, the tabular-figure treatment, the Bengali metrics — is unchanged; only the hue moved.
>
> Teal earns the change on more than differentiation: at `#0f766e` it clears AA in *both* directions (5.1:1 for white-on-accent, 4.5:1 as text on white), so the original palette's awkward "fill only, never text" caveat disappears and one token serves buttons, links and active states alike.

### Colour — light

```
/* Ground — neutrals carry a faint teal bias, so they read as chosen
   alongside the brand hue rather than as a borrowed grey. */
--bg                    #eff4f4   marketplace canvas
--surface               #ffffff   cards, panel
--surface-2             #f5f9f9   inputs, table heads
--surface-3             #e8efef   stronger fills
--line                  #dfe9e9   hairlines
--line-bright           #c7d6d6   emphasis borders

/* Brand + money */
--accent                #0f766e   5.1:1 white-on-accent · 4.5:1 as text
--accent-hi             #115e59   hover
--accent-ink            #0c5f58   accent as text where extra headroom helps
--accent-soft           #e7f7f5   active tier tint, selected cell
--price                 #be123c   5.9:1 on white. Money only.
--deal                  #be123c   flash deal

/* Semantic — deliberately distinct from the brand hue */
--success               #15803d   4.6:1
--success-soft          #eaf7ee
--warning               #a16207   4.6:1
--warning-soft          #fdf6e3
--rating                #f59e0b   DECORATIVE ONLY — stars, distribution bars
--danger                #b91c1c   5.9:1
--danger-soft           #fdeeee
--info                  #1d4ed8   6.3:1 — links, sourced-to-order
--info-soft             #eef2fe

/* Ink */
--ink                   #122127
--ink-dim               #4e6068
--ink-faint             #81939a
--on-fill               #ffffff   text on any saturated fill
```

### Colour — dark

Every dark-mode fill is a bright 400/500 tint, so `--on-fill` flips to near-black (`#04201d`) and nothing else has to know:

```
--bg #09100f · --surface #0f1917 · --surface-2 #14201e · --surface-3 #1c2b28
--line #233531 · --line-bright #334845
--accent #14b8a6 · --accent-hi #2dd4bf · --accent-ink #5eead4 · --accent-soft #0b2b27
--price #fb7185 · --success #4ade80 · --warning #fbbf24 · --rating #fbbf24
--danger #f87171 · --info #93b4fd
--ink #e5efed · --ink-dim #9db0ac · --ink-faint #6a7f7b · --on-fill #04201d
```

**Two rules worth stating because both were violated in the first implementation.**

*One token for text on a fill.* `--on-fill` is white in light mode and near-black in dark mode. Without it the dark theme shipped white-on-teal-500 buttons at 2.3:1, and the fix would otherwise have been a per-component override in a dozen files.

*Rating gold is not warning amber.* `--warning` is darkened to clear AA as **text**; at that value a star glyph reads brown. Stars and distribution bars are decorative graphics, never text, so they get their own token tuned for the eye rather than for a ratio.

### Typography

| Role | Family | Size / line-height / weight |
|---|---|---|
| Display (section heads) | Geist Sans | 24/1.2/700, tracking −0.022em |
| H1 product title | Geist Sans | 24/1.25/700 desktop · 20/1.3 mobile, `text-wrap: balance` |
| H2 section | Geist Sans | 17–19/1.3/700 |
| Body — evidence | Geist Sans | 15/1.7/400, max 65ch |
| Body — decision | Geist Sans | 13.5/1.5/500 |
| Label / eyebrow | Geist Sans | 11.5/1/700, uppercase, tracking 0.06em |
| **Price — hero** | Geist Sans `.price` | 34/1/700, tabular, tracking −0.02em |
| **Price — tier cell** | Geist Sans `.price` | 22/1/700, tabular |
| **Price — inline** | Geist Sans `.price` | 15/1.4/600, tabular |
| Data / quantity | Geist Sans `.tnum` | 13.5/1.4/600, tabular |
| Code / SKU / order no. | Geist Mono | 12.5/1.5/500 |
| Bangla | Anek Bangla via fallback | +15% leading, tracking 0 |

**Keep the existing font strategy.** The single `font-sans` stack (Geist → Anek Bangla) reached per-codepoint is a genuinely clever solution and it is documented in the CSS. Do not reorder it — putting Bangla first would re-typeset Latin runs and brand names.

### Spacing, radius, shadow

```
Spacing (4px base):  1=4  2=8  3=12  4=16  5=20  6=24  8=32  10=40  12=48  16=64
Section rhythm:      24px mobile · 32px tablet · 40px desktop
Radius:  sm 6 (chips, cells) · md 10 (buttons, inputs) · lg 12 (cards)
         xl 16 (panel, hero) · full (pills, avatars)
         Decision-zone maximum: 12px. Nothing rounder in the panel.
Shadow:  xs  0 1px 2px rgba(20,20,40,.05)      hairline lift
         sm  0 6px 18px rgba(20,20,40,.08)     cards (existing --store-shadow)
         md  0 12px 28px rgba(20,20,40,.12)    sticky panel, dropdowns
         lg  0 18px 48px rgba(20,20,40,.16)    drawers, sheets (existing)
         Data surfaces get xs or nothing. One elevation step per surface.
```

### Buttons

| Variant | Fill | Text | Border | Height | Use |
|---|---|---|---|---|---|
| Primary | accent | white | — | 48 | The one CTA |
| Secondary | transparent | ink | line-bright | 44 | Request quote, sample |
| Outline-accent | transparent | accent-ink | accent | 44 | Emphasised secondary |
| Ghost | transparent | ink-dim | — | 40 | Chat, save, share |
| Destructive | danger | white | — | 44 | Cancel order (not on PDP) |
| Disabled | accent @ 40% | white @ 70% | — | — | Always with a reason + remedy |

### Badges

| Badge | Treatment |
|---|---|
| `MOQ 50` | accent-soft fill, accent-ink text, accent/25 border, pill, tabular |
| `Verified` | success-soft fill, success text, check icon |
| `Local stock` | success-soft fill, success text |
| `Sourced to order` | info-soft fill, info text, clock icon |
| `Low stock` | warning-soft fill, warning text |
| `Best seller` | ink fill, white text — earned, not decorative |
| `New` | line border, ink-dim text |
| `Factory direct` | info border, info text, factory icon |
| `−12%` | deal fill, white text, tabular |

Rule: maximum four badges in the hero. A fifth badge means one of the five is not important.

### Icons

**Keep `lucide-react`** — already a dependency, tree-shakeable, consistent 1.5–2.4 stroke, and it has every icon this page needs. Rules: 20px in the header, 16–17px inline with text, 13–15px in metadata; always `aria-hidden` when paired with a label; never an icon-only control without an `aria-label`.

### Interaction states

| State | Treatment |
|---|---|
| Hover (card) | border → line-bright, shadow sm→md, 200ms |
| Hover (button) | fill → accent-hi, no transform |
| Active | `translateY(1px)` |
| Focus-visible | 2px accent outline, 2px offset (existing) |
| Selected (tier / cell) | accent-soft fill, accent border, 2px accent/20 ring |
| Disabled | 40% opacity, `not-allowed`, plus a stated reason |
| Loading (button) | inline spinner, label → present participle, width locked |
| Skeleton | existing `.skeleton` shimmer, real layout dimensions |

---

## 25. Next.js architecture

**Version note.** The brief says Next.js 15; the repo has `next@16.3.2` / `react@19.2.4`, and the repo's own `AGENTS.md` warns this version diverges from training data. **Recommendation: build against the installed version and read `node_modules/next/dist/docs/` for the routing and metadata APIs before writing code.** Do not downgrade — the App Router model this plan depends on is stable across both. This is the one item I would like confirmed before implementation starts.

### Route and boundaries

```
app/(store)/product/[slug]/
├── page.tsx          Server Component — data fetch, layout, JSON-LD, metadata
├── loading.tsx       skeleton matching the real layout
├── error.tsx         client boundary, segment-level retry
├── not-found.tsx     dead-listing recovery with search + similar
└── opengraph-image.tsx   generated OG card: image, title, ladder low price, MOQ
```

**Server / client split, and the rule behind it:** the boundary is drawn at the *smallest interactive unit*, not at the section. Consequences worth stating explicitly:

- `page.tsx` renders the **first gallery image itself** as a `next/image` with `priority`. The client `ProductGallery` hydrates around that server-rendered image. This is what moves LCP off the JavaScript critical path and is the single largest performance change from the current implementation.
- `TradePanel` is a client island, but the **price, ladder, and MOQ are server-rendered as initial HTML** inside it (passed as children / initial props) so the buyer sees the price before hydration.
- `SectionNav`, `ReviewFilters`, `CourierComparison`, `MobileTradeBar` are small, independent client islands — never one large client tree.
- `RfqDrawer`, `MediaLightbox`, `ChatDock`, `MobileMatrixSheet` are `dynamic()` chunks loaded on intent.

### Data fetching

- Keep the existing `lib/storefront.ts` server-only access layer with its sample-catalog fallback — it is the right pattern and it keeps design work unblocked by data.
- **ISR:** `revalidate: 120` for the product document (already in place). Add **on-demand revalidation** by tag (`product:<slug>`) from the admin publish flow — `app/api/revalidate/route.ts` already exists to build on.
- **Parallel fetch, streamed:** product + similar in the initial payload; reviews, courier rates, and recommendation rails in `Suspense` boundaries so they never block the hero.
- **`generateStaticParams`** for the top ~500 products by `stats.views` so the highest-traffic PDPs are prerendered.
- **Cart, wishlist, RFQ** go through Server Actions with optimistic client state — no bespoke API routes for mutations.

### Metadata and SEO

- `generateMetadata` (already present, extend): title `<Product> — wholesale price & MOQ | ArcB2B`; description built from the real low tier price and MOQ; `alternates.canonical`; `openGraph` with the generated card; `robots: noindex` for `status !== 'active'`.
- **`Product` JSON-LD** with `AggregateOffer` (`lowPrice` from `lowestPrice()`, `highPrice` from `basePrice`, `priceCurrency: BDT`, `availability`), `brand`, `sku`, `gtin` where known. **Only include `aggregateRating` when real reviews exist** — fix §0 finding 3.
- **`BreadcrumbList` JSON-LD** — add (§0 finding 5).
- URLs stay `/product/<slug>`; variant selection lives in query params (`?variant=black-m&qty=112`) so it is shareable but not indexable as duplicate content.
- `hreflang` for `bn`/`en` once localised routes exist (P1).
- `sitemap.ts` generated from active products; `robots.ts` excluding `/search`, `/cart`, `/account`.

### Images

- `next/image` throughout, with `remotePatterns` configured for the CDN — `next.config.ts` is currently empty and this is required.
- Explicit `sizes` per breakpoint; AVIF then WebP; `priority` on image 1 only; `loading="lazy"` on everything else.
- Blur placeholders generated at import time (the import pipeline is the right place — the frontend should not compute them).
- Derivatives per asset: `w_400` (thumb), `w_800` (display), `w_1600` (zoom). No 2× derivative → no zoom affordance.

### Performance budget

| Metric | Target | Enforcement |
|---|---|---|
| LCP (mobile 4G) | < 2.0s | Server-rendered priority hero image |
| INP | < 200ms | Debounced matrix, no cascading effects, small islands |
| CLS | < 0.05 | Fixed aspect ratios, reserved sticky-bar space, skeletons |
| Route JS (gzip) | ≤ 110 KB | Lazy chunks for drawer, lightbox, chat, sheet |
| Hero HTML TTFB | < 400ms | ISR + edge cache |

---

## 26. Folder structure

Feature-first, because a marketplace grows by feature and a `components/` bucket of 300 files does not survive it.

```
frontend/src/
├── app/
│   ├── (store)/
│   │   ├── layout.tsx                   StoreShell: header, footer, tab bar
│   │   └── product/[slug]/
│   │       ├── page.tsx
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       ├── not-found.tsx
│   │       └── opengraph-image.tsx
│   ├── admin/                           unchanged
│   ├── api/revalidate/route.ts          exists
│   ├── sitemap.ts                       NEW
│   ├── robots.ts                        NEW
│   └── globals.css                      token layer — extend, don't replace
│
├── features/
│   ├── product/
│   │   ├── components/
│   │   │   ├── gallery/                 PrimaryMedia, ZoomLens, ThumbRail,
│   │   │   │                            Lightbox, VideoPlayer, Provenance
│   │   │   ├── trade-panel/             PriceLadder, SkuMatrix, MoqGate,
│   │   │   │                            LandedCost, PurchaseActions, Assurance
│   │   │   ├── summary/                 BadgeRow, ProductMeta, KeyAttributes
│   │   │   ├── sections/                Overview, Specifications, Shipping,
│   │   │   │                            Reviews, SupplierSection, SectionNav
│   │   │   └── mobile/                  TradeBar, MatrixSheet
│   │   ├── hooks/                       useQuantityMix, useLandedCost,
│   │   │                                useActiveTier, useScrollDirection
│   │   ├── lib/                         pricing.ts (ladderRanges, tierFor),
│   │   │                                mix.ts (distribute, parsePaste),
│   │   │                                landed-cost.ts
│   │   ├── types.ts
│   │   └── __tests__/                   pricing + mix are pure — test them
│   ├── rfq/                             RfqDrawer, RfqForm, actions
│   ├── cart/                            actions, optimistic state
│   ├── reviews/
│   ├── seller/                          SellerBlock, TrustLedger
│   ├── shipping/                        CourierComparison, DistrictSelect
│   ├── chat/                            ChatDock (lazy)
│   └── search/                          GlobalSearch, suggestions
│
├── components/
│   ├── ui/                              Button, Badge, Input, Sheet, Drawer,
│   │                                    Accordion, Table, Skeleton, Tooltip
│   ├── layout/                          Container, SectionHead, Breadcrumb
│   └── seo/                             ProductJsonLd, BreadcrumbJsonLd
│
├── lib/
│   ├── api/                             server-only fetchers (from storefront.ts)
│   ├── format/                          taka(), num(), date, weight
│   ├── i18n/                            existing i18n.ts, split by surface
│   └── constants/                       districts, couriers, breakpoints
│
├── hooks/                               cross-feature only
├── types/                               shared domain types (mirror the API)
└── config/                              site, nav, feature flags
```

Migration is incremental: move `components/store/product-purchase.tsx` into `features/product/`, split it, and re-export from the old path during transition so nothing breaks mid-flight.

---

## 27. Backend and API preparation

*Conceptual only — no schema or route code, per the brief.*

### 27.1 Fields the PDP needs that the model does not have

Against `backend/src/modules/products/product.model.ts`:

| Field | Why the PDP needs it | Priority |
|---|---|---|
| `rating`, `reviewCount` (denormalised) | Currently faked in the frontend; needed for the meta line and for honest JSON-LD | **P0** |
| `moqStep` / `packQty` | Carton-multiple ordering; quantity step validation | P0 |
| `weightGrams`, `cartonQty`, `cartonDims` | Courier cost, freight decisions, the shipping table | P0 |
| `unit` (`pc`/`dozen`/`carton`/`kg`) | "৳470/pc" is currently hardcoded; not all wholesale sells by the piece | P0 |
| `priceOnRequest` (bool) | Drives the quote-only CTA state (§12) | P0 |
| `customisable`, `customisationMoq`, `privateLabelMoq` | Answers buyer questions 9; drives custom RFQ | P1 |
| `specifications[].group`, `.unit` | Grouped, scannable spec table (§15) | P1 |
| `images[].kind` (`studio`/`supplier`), `.capturedAt` | Photo provenance labelling | P1 |
| `imageDerivatives` (400/800/1600) | Real zoom; no 2× → no zoom affordance | P0 |
| `descriptionBlocks[]` (typed rich content) | Splitting imported description images into captioned blocks | P0 |
| `seller` ref | The P0/P1 seam — nullable now, populated in marketplace mode | P0 |
| `warrantyMonths`, `hsCode`, `certifications[]` (with document refs) | Trade Terms and Compliance spec groups | P1 |

### 27.2 Modules that do not exist yet

| Module | Needed for | Priority |
|---|---|---|
| **Review** (product, buyer, order ref, rating, text, photos, variant, orderQty, verified, sellerReply, moderation) | §17 — PRD §5.12 P0 | **P0** |
| **Seller / Storefront** (identity, verification docs, location, years, metrics) | §14 — PRD §5.14 P1, but the *shape* is needed at P0 | P0 shape, P1 data |
| **SellerMetrics** (computed nightly: response, on-time, reorder, disputes) | The trust ledger. Must be a computed aggregate, never derived ad hoc | P0 |
| **RFQ** (buyer, product ref, qty, target price, district, needed-by, customisation, attachments, status, quotes[]) | §16 — PRD §5.7 P0 | P0 |
| **ShippingRate** (courier, zone, weight band, cost, min/max days, COD) | §13; admin rate card first, live APIs later | P0 |
| **Recommendation** (co-purchase pairs, similarity) | §18 rails 1–2 | P1 |

### 27.3 Endpoint shape for the PDP

One primary read, four lazy reads. The goal is that the hero needs exactly one round trip.

```
GET /v1/storefront/products/:slug
  → product (full, with derivatives, tiers, variants, grouped specs,
             seller summary, rating aggregate, unit, weight, carton)
  → similar[] (6 cards)
  → breadcrumb[] (category ancestry)     ← currently computed client-side

GET /v1/storefront/products/:slug/reviews?page&rating&variant&sort&withPhotos
GET /v1/storefront/sellers/:id/metrics             ← computed aggregate only
GET /v1/storefront/shipping/quote?district&weight&value
GET /v1/storefront/products/:slug/recommendations?type=bought_together

POST /v1/rfq                                        (Server Action → API)
POST /v1/cart/lines                                 (multi-SKU mix payload)
POST /v1/wishlist                                   (merge-on-signin semantics)
```

**Contract rules:** every price is an integer in the minor unit (paisa) to avoid float drift; the API returns tiers already sorted with computed upper bounds so client and server never disagree about tier boundaries; `null` means "not measured" and the UI must render an explicit empty state rather than a zero; the existing `{ success, data, meta }` envelope is kept.

---

## 28. PWA

- **Install prompt:** a persistent footer entry plus one contextual prompt, shown only after a genuine engagement signal (second product viewed, or a completed order) — never on first load. Dismissal is remembered for 30 days.
- **Offline:** cache the app shell, the last 20 viewed PDPs, and the cart. A cached PDP renders with an `Offline — prices may have changed` band and **disabled purchase CTAs**. Deliberately *not* offline: checkout, RFQ submission, chat send. Queueing a financial action and replaying it later against changed prices and stock is a real failure mode, not a feature — the brief's instruction not to force offline behaviour where it doesn't fit applies exactly here.
- **Push:** order status transitions, RFQ quote received, chat reply, dispute updates. Permission requested *after* the first order, never on page load. Every push type independently toggleable — PRD §5.11 already scopes SMS + push per event.
- **App-like navigation:** the existing bottom tab bar plus route prefetching on link hover/intent.
- **Manifest:** standalone display, orange theme colour, maskable icons, `/` start URL, and shortcuts to Categories, RFQ, and Orders.

---

## 29. Implementation roadmap

Phased so that each phase is independently shippable and each begins with the highest-risk item.

**Phase 0 — Integrity (do this first, ~1 day)**
1. Delete `supplierFor()`'s fabricated metrics and the hardcoded `4.6` rating; render honest empty states.
2. Remove `aggregateRating` from JSON-LD until real reviews exist; add `BreadcrumbList`.
3. Add `--color-accent-ink` and the `-soft` tokens; audit every orange text usage.
*Why first: these are live correctness and trust problems, and none of them depend on anything else.*

**Phase 1 — Foundation (design system + performance)**
4. Extend `globals.css` with the new tokens; document the density zoning rule.
5. Build `components/ui/` primitives (Button, Badge, Sheet, Drawer, Accordion, Table, Skeleton, Tooltip).
6. Migrate all product imagery to `next/image`; configure `remotePatterns`; generate 400/800/1600 derivatives in the import pipeline.
7. Publish `--header-h`; replace every magic sticky offset.
8. Add `loading.tsx`, `error.tsx`, `not-found.tsx` for the product route.

**Phase 2 — The Trade Panel (the core deliverable)**
9. `features/product/lib/pricing.ts` + `mix.ts` as pure, unit-tested functions.
10. Interactive `PriceLadder` (radiogroup, sets quantity, derived active tier).
11. Rebuilt `SkuMatrix` (text inputs, subtotals, distribute, paste, sticky headers, stock states).
12. `MoqGate` with remedies.
13. `LandedCost` + `DistrictSelect` against an admin rate card.
14. `PurchaseActions` with the state-driven CTA resolver from §12.

**Phase 3 — Hero and evidence**
15. Server-rendered priority hero image; client gallery hydrating around it.
16. Real 2× zoom lens; fullscreen lightbox as a lazy chunk; video; provenance labels.
17. `ProductSummary` with badge row and key attributes.
18. Grouped two-column specifications; description as typed blocks with captioned images.
19. `SectionNav` with scroll-spy and correct anchor offsets.

**Phase 4 — Mobile**
20. `MobileTradeBar`; matrix bottom sheet; tab-bar auto-hide with the reserved-space contract.
21. Swipe gallery, pinch-zoom fullscreen, accordion sections.
22. 320px audit; 200% zoom audit; touch-target audit.

**Phase 5 — Trust and conversation**
23. Seller/Storefront and SellerMetrics modules; `SellerBlock` in P0 mode.
24. Review module + moderation; `ReviewsSection` with filters and photo overlay.
25. RFQ module; `RfqDrawer` as a lazy chunk with prefill; `/rfq/<id>` status.
26. `ChatDock` with product context.

**Phase 6 — Growth and polish**
27. Recommendation rails 1–3 with quantity-aware comparable pricing.
28. Live courier rate APIs replacing the rate card (no UI change).
29. Search suggestions; mega-menu.
30. Full accessibility audit (axe + manual keyboard + screen reader in both languages); Lighthouse against the §25 budget; structured-data validation.

---

## 30. Open decisions I need from you

Six things where your answer changes the build, listed with my recommendation so a "yes" is enough:

1. **Next.js version.** Repo has 16.3.2; brief says 15. *Recommend: build on 16.3.2 and read the bundled docs.* Confirm?
2. **Drop "Buy Now" entirely?** My recommendation is yes (§12). This is the most opinionated call in the plan.
3. **P0 seller model.** Ship the `SellerBlock` in ArcB2B-as-seller mode with sourcing provenance, sized for P1 marketplace data? *Recommend: yes* — it is the difference between a data change and a rewrite later.
4. **Numerals in Bangla mode.** `taka()` currently renders Western digits (`৳500`) even in Bangla. *Recommend: keep Western digits* — Bangladeshi commerce overwhelmingly uses them and Bengali numerals would hurt scanning. Confirm, because it is a one-line change either way and expensive to flip later.
5. **Landed cost at launch.** It needs an admin courier rate card and product weights before it can show a number. *Recommend: build the component in Phase 2 with a rate card, live courier APIs in Phase 6.* Acceptable?
6. **Reviews before or after RFQ?** Both are P0 in the PRD; Phase 5 does reviews first. If RFQ matters more commercially at launch, I will swap them.

---

## 31. Final recommendation, in brief

**Recommended design:** Direction D, *Structured Trade* — 1688's B2B information model, Alibaba's sticky decision panel, SaaS layout discipline via density zoning, premium product presentation, and a mobile-first Trade Bar, built on the light-first orange/red marketplace palette already in `globals.css`.

**Why:** it is the only direction that serves both buyers ArcB2B needs — the first-time importer who must be taught the wholesale schema, and the professional reseller who must be able to skip the teaching and read the numbers. Density zoning is what lets one page do both without becoming incoherent.

**Key inspiration sources:** 1688 (ladder pricing, SKU matrix, capability-led supplier data — model, not chrome) · Alibaba (sticky panel, scoped search, RFQ ubiquity — verified live) · Baymard (per-unit price, total cost, save-before-signin, review responses, review photo browsing — all quantified failures on most sites) · McMaster-Carr (specs visible, not tabbed) · Faire (typographic calm in the evidence zone) · Daraz (local colour grammar and bottom tabs) · Kamae (the competitive floor: certainty about landed cost and delivery).

**Borrow:** ladder pricing · SKU matrix with consolidated MOQ · sticky purchase panel · multi-entry RFQ · scoped search · capability-led trust data · specs inline · orange/red/bottom-tab familiarity.

**Avoid:** pay-to-play supplier tiers · manufactured urgency · price hidden behind "Get Best Price" · tabbed lower page · banner stacks in the hero · description-as-one-image · autoplay video · **any fabricated metric**.

**Information architecture:** MOQ → identity → price-at-my-quantity → my mix → landed cost → action → trust → evidence → social proof → alternatives. That order is the buyer's question sequence from §3, and it is the same on every breakpoint.

**Desktop:** two columns — evidence left, a sticky Trade Panel right, anchored sections below a sticky section-nav, three recommendation rails.
**Mobile:** single column, swipe gallery, matrix in a bottom sheet, accordion sections, a fixed Trade Bar above an auto-hiding tab bar.

**Design system:** extend the existing `.storefront` token layer — do not replace it. Add `accent-ink` and four `-soft` semantic tokens, formalise density zoning, keep the Bengali typography handling and the tabular-figure treatment exactly as they are.

**The single most important thing in this plan:** delete the fabricated trust data before anything else ships. Everything else here is an improvement; that one is a correction.

---

*Awaiting approval before any implementation. Six open questions in §30.*
