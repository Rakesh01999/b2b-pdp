/**
 * Assertions for catalogue search.
 *
 * Search is the second place on this site where a wrong answer costs money: a
 * buyer who cannot find a line they would have bought does not complain, they
 * just leave. The ranking and the sort comparators are pure functions over the
 * card index for exactly this reason.
 *
 * Run through `node scripts/run-tests.mjs`, which registers the `@/*` alias
 * hook first.
 */

import assert from 'node:assert/strict';

const { searchCatalogue, suggestCategories, searchHref, isSortKey } = await import(
  '../src/lib/search.ts'
);

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
    passed += 1;
  } catch (error) {
    console.error(`  FAIL  ${name}\n        ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`  ok    ${name}`);
};

console.log('\ncatalogue search');

check('an empty query returns the whole index', () => {
  const result = searchCatalogue({});
  assert.ok(result.total >= 10, `expected the full index, got ${result.total}`);
  assert.equal(result.empty, false);
});

check('a title match ranks above a merely related record', () => {
  const result = searchCatalogue({ q: 'power bank' });
  assert.ok(result.total > 0, 'expected at least one hit for "power bank"');
  assert.match(result.cards[0].slug, /power-bank/);
});

check('search matches the Bengali title as well as the English one', () => {
  const result = searchCatalogue({ q: 'পাওয়ার ব্যাংক' });
  assert.ok(result.total > 0, 'expected a hit on the Bengali title');
  assert.match(result.cards[0].slug, /power-bank/);
});

check('the category filter accepts a main category and its leaves alike', () => {
  const viaMain = searchCatalogue({ cat: 'mobile-accessories' });
  const viaLeaf = searchCatalogue({ cat: 'power-banks' });
  assert.ok(viaMain.total > 0, 'expected listings under mobile-accessories');
  assert.ok(viaLeaf.total > 0, 'expected listings under power-banks');
  // A leaf can never hold more than its parent.
  assert.ok(viaLeaf.total <= viaMain.total);
});

check('facet counts are computed before the category filter narrows the set', () => {
  const unfiltered = searchCatalogue({});
  const filtered = searchCatalogue({ cat: 'electronics' });
  // Same facet list either way — otherwise applying a filter would hide every
  // other route out of it.
  assert.deepEqual(
    filtered.facets.map((facet) => facet.slug).sort(),
    unfiltered.facets.map((facet) => facet.slug).sort(),
  );
});

check('the in-stock filter excludes made-to-order lines only', () => {
  const result = searchCatalogue({ inStock: true });
  assert.ok(result.cards.length > 0);
  assert.ok(result.cards.every((card) => card.madeToOrder === false));
});

check('the low-minimum filter is inclusive of its ceiling', () => {
  const result = searchCatalogue({ maxMoq: 100 });
  assert.ok(result.cards.every((card) => card.moq <= 100));
  assert.ok(result.cards.some((card) => card.moq === 100), 'expected the boundary to be included');
});

check('price-ascending sorts by the ladder floor', () => {
  const result = searchCatalogue({ sort: 'price-asc' });
  const floors = result.cards
    .filter((card) => card.tiers.length > 0)
    .map((card) => Math.min(...card.tiers.map((tier) => tier.unitPrice)));
  const sorted = [...floors].sort((a, b) => a - b);
  assert.deepEqual(floors, sorted);
});

check('unpriced listings stay last in both price directions', () => {
  for (const sort of ['price-asc', 'price-desc']) {
    const cards = searchCatalogue({ sort }).cards;
    const firstQuoteOnly = cards.findIndex((card) => card.tiers.length === 0);
    if (firstQuoteOnly === -1) continue;
    assert.ok(
      cards.slice(firstQuoteOnly).every((card) => card.tiers.length === 0),
      `a priced listing sorted after a quote-only one under ${sort}`,
    );
  }
});

check('lowest-minimum sort is ascending on MOQ', () => {
  const moqs = searchCatalogue({ sort: 'moq-asc' }).cards.map((card) => card.moq);
  assert.deepEqual(moqs, [...moqs].sort((a, b) => a - b));
});

check('a query with no listings still routes to matching shelves', () => {
  // `machinery` is one of the branches the sample catalogue still does not
  // reach — see the note at the top of `src/data/catalog.ts`. A compound query
  // like "printing machinery" or "garment machinery" would not do here: each
  // word is checked individually as well as as a phrase, and "printing" and
  // "garment" both already match an unrelated listing's category name
  // (Packaging & Printing, Apparel & Garments).
  const result = searchCatalogue({ q: 'machinery' });
  assert.equal(result.total, 0, 'sample catalogue should hold no machinery');
  assert.ok(result.categorySuggestions.length > 0, 'expected a shelf suggestion');
});

check('shelf suggestions ignore one- and two-letter noise', () => {
  assert.deepEqual(suggestCategories('a to'), []);
});

check('the query serialiser drops defaults and keeps the rest', () => {
  assert.equal(searchHref({}), '/search');
  assert.equal(searchHref({ sort: 'relevance' }), '/search');
  assert.equal(searchHref({ q: 'led panel' }), '/search?q=led+panel');
  assert.equal(
    searchHref({ q: 'led', cat: 'lighting', sort: 'price-asc', inStock: true, maxMoq: 100 }),
    '/search?q=led&cat=lighting&sort=price-asc&stock=1&moq=100',
  );
});

check('an unrecognised sort key is rejected rather than trusted', () => {
  assert.equal(isSortKey('price-asc'), true);
  assert.equal(isSortKey('cheapest'), false);
  assert.equal(isSortKey(undefined), false);
});

console.log(`\n${passed} search assertions passed${process.exitCode ? ' — with failures above' : ''}\n`);
