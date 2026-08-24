/**
 * Assertions for the pure trade maths.
 *
 * These four modules — ladder pricing, MOQ stepping, mix allocation and landed
 * cost — are the only places on the product page where a wrong answer costs
 * someone money, so they are written as pure functions specifically so they can
 * be checked without a browser. Run with:
 *
 *   node --experimental-strip-types scripts/test-pricing.mjs
 *
 * Node 22.6+ strips the TypeScript annotations at load; there is no build step
 * and no test framework, because a hundred lines of assertions do not need one.
 */

import assert from 'node:assert/strict';

const { ladderRanges, unitPriceForQty, activeTierIndex, nextTierNudge, lowestUnitPrice, highestUnitPrice, savingAtQty, snapToStep, isLegalQty, resolveListingState } =
  await import('../src/features/product/lib/pricing.ts');
const { buildMatrix, distributeEvenly, scaleMixTo, parsePastedMix, totalQty, capacityOf, cellState, setCell } =
  await import('../src/features/product/lib/mix.ts');
const { computeLandedCost, shippingQuotes, freeShippingStatus, cartonCount, shipmentWeight } =
  await import('../src/features/product/lib/landed-cost.ts');

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

/* --------------------------------------------------------------- fixtures */

const TIERS = [
  { minQty: 50, unitPrice: 50_000 },
  { minQty: 100, unitPrice: 47_000 },
  { minQty: 200, unitPrice: 45_200 },
  { minQty: 500, unitPrice: 44_000 },
];

const VARIANTS = [
  { id: 'a', sku: 'A', attributes: { Colour: 'Black', Version: 'ENC' }, stock: 240 },
  { id: 'b', sku: 'B', attributes: { Colour: 'Black', Version: 'ANC' }, stock: 96, priceDelta: 4_000 },
  { id: 'c', sku: 'C', attributes: { Colour: 'White', Version: 'ENC' }, stock: 180 },
  { id: 'd', sku: 'D', attributes: { Colour: 'White', Version: 'ANC' }, stock: 12, incoming: { qty: 240, days: 12 }, priceDelta: 4_000 },
  { id: 'e', sku: 'E', attributes: { Colour: 'Blue', Version: 'ENC' }, stock: 64 },
  { id: 'f', sku: 'F', attributes: { Colour: 'Blue', Version: 'ANC' }, stock: 0, incoming: { qty: 180, days: 14 }, priceDelta: 4_000 },
];

/* ----------------------------------------------------------------- ladder */

console.log('\nladder');

check('upper bounds are derived, top tier stays open', () => {
  const ranges = ladderRanges(TIERS);
  assert.deepEqual(
    ranges.map((r) => [r.minQty, r.maxQty]),
    [[50, 99], [100, 199], [200, 499], [500, null]],
  );
});

check('best tier marks the cheapest price, not merely the last row', () => {
  // A mis-entered ladder whose last row is not the cheapest must not be
  // advertised as the best deal.
  const odd = [
    { minQty: 50, unitPrice: 50_000 },
    { minQty: 100, unitPrice: 40_000 },
    { minQty: 200, unitPrice: 42_000 },
  ];
  assert.deepEqual(ladderRanges(odd).map((r) => r.isBest), [false, true, false]);
});

check('applicable price steps at each boundary', () => {
  assert.equal(unitPriceForQty(TIERS, 49), 50_000, 'below MOQ falls back to the floor tier');
  assert.equal(unitPriceForQty(TIERS, 50), 50_000);
  assert.equal(unitPriceForQty(TIERS, 99), 50_000);
  assert.equal(unitPriceForQty(TIERS, 100), 47_000);
  assert.equal(unitPriceForQty(TIERS, 199), 47_000);
  assert.equal(unitPriceForQty(TIERS, 200), 45_200);
  assert.equal(unitPriceForQty(TIERS, 499), 45_200);
  assert.equal(unitPriceForQty(TIERS, 500), 44_000);
  assert.equal(unitPriceForQty(TIERS, 5_000), 44_000);
});

check('active tier index tracks the quantity', () => {
  assert.equal(activeTierIndex(TIERS, 0), 0);
  assert.equal(activeTierIndex(TIERS, 150), 1);
  assert.equal(activeTierIndex(TIERS, 500), 3);
});

check('next-tier nudge quantifies the saving in money', () => {
  const nudge = nextTierNudge(TIERS, 112);
  assert.equal(nudge.unitsNeeded, 88);
  assert.equal(nudge.tier.unitPrice, 45_200);
  // (47_000 - 45_200) * 200 = 360_000 paisa = tk3,600
  assert.equal(nudge.saving, 360_000);
  assert.equal(nextTierNudge(TIERS, 500), null, 'no nudge at the top tier');
});

check('low and high price bracket the ladder', () => {
  assert.equal(lowestUnitPrice(TIERS), 44_000);
  assert.equal(highestUnitPrice(TIERS), 50_000);
});

check('saving is measured against the ladder floor', () => {
  assert.equal(savingAtQty(TIERS, 0), 0);
  assert.equal(savingAtQty(TIERS, 50), 0, 'no saving at the floor tier');
  assert.equal(savingAtQty(TIERS, 500), (50_000 - 44_000) * 500);
});

/* ------------------------------------------------------------ MOQ + steps */

console.log('\nMOQ and step rules');

check('snapToStep rounds up to a legal quantity', () => {
  assert.equal(snapToStep(1, 50, 10), 50, 'anything below MOQ becomes MOQ');
  assert.equal(snapToStep(50, 50, 10), 50);
  assert.equal(snapToStep(51, 50, 10), 60);
  assert.equal(snapToStep(60, 50, 10), 60);
  assert.equal(snapToStep(0, 50, 10), 0, 'zero stays zero — nothing ordered');
  assert.equal(snapToStep(37, 30, 6), 42, 'steps count from the MOQ, not from zero');
});

check('legality follows MOQ and the carton multiple', () => {
  assert.equal(isLegalQty(49, 50, 10), false);
  assert.equal(isLegalQty(50, 50, 10), true);
  assert.equal(isLegalQty(55, 50, 10), false);
  assert.equal(isLegalQty(60, 50, 10), true);
  assert.equal(isLegalQty(31, 30, 1), true, 'a step of 1 imposes no multiple');
});

/* -------------------------------------------------------------------- mix */

console.log('\nmix allocation');

check('matrix builds both axes and finds every cell', () => {
  const matrix = buildMatrix(VARIANTS, ['Colour', 'Version']);
  assert.deepEqual(matrix.rows, ['Black', 'White', 'Blue']);
  assert.deepEqual(matrix.cols, ['ENC', 'ANC']);
  assert.equal(matrix.cells.length, 3);
  assert.equal(matrix.cells[0][0].variant.id, 'a');
  assert.equal(matrix.cells[2][1].variant.id, 'f');
});

check('single-axis products still produce a one-column matrix', () => {
  const single = [
    { id: 'x', sku: 'X', attributes: { Model: 'A15' }, stock: 100 },
    { id: 'y', sku: 'Y', attributes: { Model: 'A25' }, stock: 50 },
  ];
  const matrix = buildMatrix(single, ['Model']);
  assert.equal(matrix.colAxis, null);
  assert.equal(matrix.cols.length, 1);
  assert.equal(matrix.cells.length, 2);
});

check('capacity counts inbound units, cell state does not', () => {
  assert.equal(capacityOf(VARIANTS[3]), 252, '12 in stock + 240 inbound');
  assert.equal(cellState(VARIANTS[0]), 'available');
  assert.equal(cellState(VARIANTS[3]), 'low', '12 dispatchable is below the low threshold');
  assert.equal(cellState(VARIANTS[5]), 'sourced', 'nothing dispatchable, all inbound');
  assert.equal(cellState(null), 'unavailable');
});

check('distributing hits the target exactly and respects capacity', () => {
  const mix = distributeEvenly(500, VARIANTS);
  assert.equal(totalQty(mix), 500);
  for (const variant of VARIANTS) {
    assert.ok((mix[variant.id] ?? 0) <= capacityOf(variant), `${variant.id} within capacity`);
  }
});

check('distributing beyond total capacity stops rather than looping', () => {
  const capacity = VARIANTS.reduce((sum, v) => sum + capacityOf(v), 0);
  const mix = distributeEvenly(capacity + 5_000, VARIANTS);
  assert.equal(totalQty(mix), capacity);
});

check('rescaling preserves the shape the buyer chose', () => {
  // 3:1 in favour of the first line must stay roughly 3:1 after doubling.
  const start = setCell(setCell({}, 'a', 90, 240), 'c', 30, 180);
  const scaled = scaleMixTo(start, VARIANTS, 240);
  assert.equal(totalQty(scaled), 240);
  assert.ok(scaled.a > scaled.c * 2, 'ratio preserved rather than flattened');
});

check('rescaling an empty mix falls back to an even spread', () => {
  assert.equal(totalQty(scaleMixTo({}, VARIANTS, 120)), 120);
});

check('setCell clamps to capacity and prunes zeroes', () => {
  assert.deepEqual(setCell({}, 'a', 999, 240), { a: 240 });
  assert.deepEqual(setCell({ a: 10 }, 'a', 0, 240), {});
  assert.deepEqual(setCell({}, 'a', -5, 240), {});
});

check('paste maps a spreadsheet block and reports what changes', () => {
  const matrix = buildMatrix(VARIANTS, ['Colour', 'Version']);
  const result = parsePastedMix('Black\t40\t32\nWhite\t20\t20', matrix, {});
  assert.equal(totalQty(result.mix), 112);
  assert.equal(result.mix.a, 40);
  assert.equal(result.mix.b, 32);
  assert.equal(result.changes.length, 4);
});

check('paste honours a header row and matches columns by name', () => {
  const matrix = buildMatrix(VARIANTS, ['Colour', 'Version']);
  // Columns deliberately reversed relative to the matrix order.
  const result = parsePastedMix('Colour\tANC\tENC\nBlack\t10\t20', matrix, {});
  assert.equal(result.mix.b, 10, 'ANC column landed on the ANC variant');
  assert.equal(result.mix.a, 20);
});

check('paste clamps over-capacity values and says so', () => {
  const matrix = buildMatrix(VARIANTS, ['Colour', 'Version']);
  const result = parsePastedMix('Blue\t0\t9999', matrix, {});
  assert.equal(result.mix.f, 180, 'clamped to the inbound quantity');
  assert.ok(result.warnings.some((w) => w.includes('180')), 'warned about the reduction');
});

check('paste never applies silently — an unmatched row is reported', () => {
  const matrix = buildMatrix(VARIANTS, ['Colour', 'Version']);
  const result = parsePastedMix('Magenta\t10\t10', matrix, {});
  assert.ok(result.warnings.length > 0);
  assert.equal(result.changes.length, 0);
});

/* ------------------------------------------------------------ landed cost */

console.log('\nlanded cost');

check('landed cost is exact to the paisa', () => {
  // The worked example from the design plan: 240 units at tk452, three ANC cells
  // of 40 carrying +tk40 each, free delivery, bKash at 1.5%.
  const landed = computeLandedCost({
    qty: 240,
    unitPrice: 45_200,
    variantSurcharge: 4_000 * 120,
    shippingCost: 0,
    paymentMethodId: 'bkash',
  });
  assert.equal(landed.goodsSubtotal, 10_848_000);
  assert.equal(landed.variantSurcharge, 480_000);
  assert.equal(landed.paymentFee, 169_920);
  assert.equal(landed.total, 11_497_920);
  assert.equal(landed.perUnit, 47_908, 'tk479.08 per unit');
});

check('a zero-fee method adds nothing', () => {
  const landed = computeLandedCost({
    qty: 100,
    unitPrice: 47_000,
    shippingCost: 50_000,
    paymentMethodId: 'bank',
  });
  assert.equal(landed.paymentFee, 0);
  assert.equal(landed.total, 4_750_000);
});

check('per-unit is zero at zero quantity rather than dividing by zero', () => {
  const landed = computeLandedCost({ qty: 0, unitPrice: 47_000, shippingCost: 0, paymentMethodId: 'bkash' });
  assert.equal(landed.perUnit, 0);
  assert.ok(Number.isFinite(landed.perUnit));
});

check('courier rates band on whole kilos, minimum one', () => {
  const light = shippingQuotes({ districtId: 'dhaka-metro', weightGrams: 200, orderValue: 1_000 });
  const oneKilo = shippingQuotes({ districtId: 'dhaka-metro', weightGrams: 1_000, orderValue: 1_000 });
  assert.deepEqual(
    light.map((q) => q.cost),
    oneKilo.map((q) => q.cost),
    'anything under a kilo bills as one kilo',
  );
});

check('quotes are cheapest-first and carry at most one flag each', () => {
  const quotes = shippingQuotes({ districtId: 'chattogram', weightGrams: 12_000, orderValue: 1_000_000 });
  const costs = quotes.map((q) => q.cost);
  assert.deepEqual(costs, [...costs].sort((a, b) => a - b));
  assert.equal(quotes.filter((q) => q.flag === 'cheapest').length, 1);
  assert.equal(quotes.filter((q) => q.flag === 'fastest').length, 1);
});

check('free delivery zeroes every courier once the threshold is met', () => {
  const quotes = shippingQuotes({ districtId: 'dhaka-metro', weightGrams: 12_000, orderValue: 6_000_000 });
  assert.ok(quotes.every((q) => q.cost === 0));

  const status = freeShippingStatus({ districtId: 'dhaka-metro', weightGrams: 12_000, orderValue: 2_500_000 });
  assert.equal(status.qualifies, false);
  assert.equal(status.shortfall, 2_500_000, 'tk25,000 short of the tk50,000 threshold');
});

check('outlying districts have no free-delivery threshold', () => {
  const status = freeShippingStatus({ districtId: 'coxs-bazar', weightGrams: 1_000, orderValue: 99_999_999 });
  assert.equal(status.threshold, null);
  assert.equal(status.qualifies, false);
});

check('cartons and shipment weight round the way a warehouse counts', () => {
  assert.equal(cartonCount(240, 100), 3, 'a part-full carton still ships as a carton');
  assert.equal(cartonCount(0, 100), 0);
  assert.equal(shipmentWeight(112, 105), 11_760);
});

/* ---------------------------------------------------------- listing state */

console.log('\nlisting state');

const baseListing = {
  status: 'active',
  pricing: { currency: 'BDT', unit: 'pc', tiers: TIERS, moq: 50, moqStep: 10, priceOnRequest: false },
  logistics: { weightGrams: 105, cartonQty: 100, cartonDims: '', leadTimeDays: 3 },
};

check('dispatch lead time alone does not make a line sourced-to-order', () => {
  // The regression this guards: leadTimeDays: 3 means "ships from local stock in
  // three days", and treating it as sourcing labelled every stocked product as
  // made-to-order and pushed buyers toward a quote they did not need.
  assert.equal(resolveListingState(baseListing, { qty: 100, availableStock: 592 }), 'in_stock');
});

check('a declared production window does make it sourced-to-order', () => {
  const madeToOrder = { ...baseListing, logistics: { ...baseListing.logistics, sourcingDays: [18, 22] } };
  assert.equal(resolveListingState(madeToOrder, { qty: 100, availableStock: 592 }), 'sourced_to_order');
});

check('ordering past dispatchable stock draws on inbound units', () => {
  assert.equal(resolveListingState(baseListing, { qty: 700, availableStock: 592 }), 'sourced_to_order');
});

check('an unpublished ladder routes to a quote', () => {
  const quoteOnly = { ...baseListing, pricing: { ...baseListing.pricing, tiers: [], priceOnRequest: true } };
  assert.equal(resolveListingState(quoteOnly, { qty: 0, availableStock: 100 }), 'quote_only');
});

check('volume past twice the top tier becomes a negotiation', () => {
  assert.equal(resolveListingState(baseListing, { qty: 1_200, availableStock: 5_000 }), 'volume_quote');
});

check('an illegal quantity reports below_moq, not a purchasable state', () => {
  assert.equal(resolveListingState(baseListing, { qty: 55, availableStock: 592 }), 'below_moq');
  assert.equal(resolveListingState(baseListing, { qty: 20, availableStock: 592 }), 'below_moq');
});

check('a suspended listing is unavailable whatever the stock says', () => {
  const suspended = { ...baseListing, status: 'suspended' };
  assert.equal(resolveListingState(suspended, { qty: 100, availableStock: 592 }), 'unavailable');
});

check('customisation overrides the purchasable states', () => {
  assert.equal(
    resolveListingState(baseListing, { qty: 100, availableStock: 592, customisationRequested: true }),
    'customisation',
  );
});

console.log(`\n${passed} assertions passed${process.exitCode ? ' — with failures above' : ''}\n`);
