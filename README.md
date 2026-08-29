# ArcB2B — Trade Desk

Bangladesh's wholesale sourcing marketplace: laddered pricing you can read
before you ask, escrow-protected payment, and couriers quoted against your
district. This repository holds the planning and the implementation of the
**Trade Desk** product page and the storefront around it.

```
b2b-pdp/
├── docs/
│   └── arcb2b-pdp-design-plan.md   research, competitive analysis, and the
│                                   31-section plan this build implements
└── frontend/                       the standalone Next.js app — start here
```

## Start here

```bash
cd frontend
npm install
npm run media     # generate the product imagery (required once, ~20s)
npm run dev       # http://localhost:3000  → redirects to /en or /bn
```

The full picture — every route, the product page's feature list, the 22-product
catalogue, the design tokens, the architecture, what was verified, the bugs
found and fixed along the way, and what is deliberately stubbed and why — is
in **[`frontend/README.md`](frontend/README.md)**.

## What is in each half

**`docs/arcb2b-pdp-design-plan.md`** is the planning deliverable: a
research-grounded audit of the reference platform, three to five design
directions with one selected, competitive analysis of Alibaba / 1688 / Kamae,
wireframes, the component breakdown, responsive and interaction specs, design
tokens, the Next.js architecture, and the conceptual API contract — 31
numbered sections in total, written and approved before any implementation
code.

**`frontend/`** is that plan, built: a standalone Next.js 16 / React 19 /
Tailwind 4 app, bilingual by routing (`/en`, `/bn`) rather than by client
state, with its own palette, its own sample catalogue, and its own verified
build. It is deliberately separate from the `ARCB2B` reference codebase the
plan was audited against — nothing in that reference was modified; this is a
new app that stays drop-in compatible with it.

## At a glance

- **373 pages** prerender statically across both locales — every category,
  subcategory, product, storefront and content page.
- **22 products** across 15 of 20 main categories, 4 sellers, and three units
  besides the piece (kilogram, metre, dozen).
- **51 automated assertions** over the pricing ladder, the SKU mix, landed
  cost and catalogue search; **1,584 internal links** crawled to confirm every
  one resolves.
- No fabricated trust signals anywhere — the defect the design plan opens
  with in the reference codebase (a hashed supplier name, a rating computed
  from a string length) is the first thing this build set out not to repeat.

See [`frontend/README.md`](frontend/README.md) for all of it.
