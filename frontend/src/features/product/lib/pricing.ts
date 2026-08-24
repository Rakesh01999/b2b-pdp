import type { ListingState, Paisa, PriceTier, PriceTierRange, Product } from '@/lib/types';

/**
 * Tier-pricing maths. Pure, dependency-free, and deliberately the only place
 * tier boundaries are computed — the ladder UI, the buy box, the matrix and
 * the recommendation rails all read the same functions, so they can never
 * disagree about which tier a quantity falls in.
 */

/** Ascending copy of the ladder. Defensive: input order is not trusted. */
export function sortedTiers(tiers: PriceTier[]): PriceTier[] {
  return [...tiers].sort((a, b) => a.minQty - b.minQty);
}

/**
 * The ladder with upper bounds resolved, so the UI never has to look ahead to
 * the next tier to render "100–199". The top tier's `maxQty` is null (open).
 */
export function ladderRanges(tiers: PriceTier[]): PriceTierRange[] {
  const sorted = sortedTiers(tiers);
  const cheapest = sorted.reduce<Paisa>(
    (min, t) => Math.min(min, t.unitPrice),
    sorted[0]?.unitPrice ?? 0,
  );

  return sorted.map((tier, i) => {
    const next = sorted[i + 1];
    return {
      ...tier,
      maxQty: next ? next.minQty - 1 : null,
      // "Best" marks the cheapest unit price, not merely the last row — a
      // mis-entered ladder where the top tier is not the cheapest should not
      // be advertised as the best deal.
      isBest: tier.unitPrice === cheapest && sorted.length > 1,
    };
  });
}

/** Applicable unit price at a quantity. Below MOQ, the floor tier's price. */
export function unitPriceForQty(tiers: PriceTier[], qty: number): Paisa {
  const sorted = sortedTiers(tiers);
  if (sorted.length === 0) return 0;
  let price = sorted[0].unitPrice;
  for (const tier of sorted) {
    if (qty >= tier.minQty) price = tier.unitPrice;
  }
  return price;
}

/** Index into `ladderRanges()` of the tier a quantity currently sits in. */
export function activeTierIndex(tiers: PriceTier[], qty: number): number {
  const sorted = sortedTiers(tiers);
  let index = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (qty >= sorted[i].minQty) index = i;
  }
  return index;
}

export interface NextTierNudge {
  tier: PriceTier;
  /** How many more units unlock it. */
  unitsNeeded: number;
  /** Total saved *at the new quantity*, versus paying the current unit price. */
  saving: Paisa;
}

/**
 * The next unreached tier, framed as money rather than a percentage — B2B
 * buyers compute in Taka, and "save ৳3,976" moves quantity in a way that
 * "save 4%" does not.
 */
export function nextTierNudge(tiers: PriceTier[], qty: number): NextTierNudge | null {
  const sorted = sortedTiers(tiers);
  const upcoming = sorted.find((t) => qty < t.minQty);
  if (!upcoming) return null;

  const currentUnit = unitPriceForQty(sorted, qty);
  const saving = Math.max(0, (currentUnit - upcoming.unitPrice) * upcoming.minQty);

  return { tier: upcoming, unitsNeeded: upcoming.minQty - qty, saving };
}

/** Cheapest advertised unit price — the "from ৳x" figure on cards and meta. */
export function lowestUnitPrice(tiers: PriceTier[]): Paisa {
  const sorted = sortedTiers(tiers);
  return sorted.reduce<Paisa>((min, t) => Math.min(min, t.unitPrice), sorted[0]?.unitPrice ?? 0);
}

/** Dearest advertised unit price — the ladder floor, and `highPrice` in JSON-LD. */
export function highestUnitPrice(tiers: PriceTier[]): Paisa {
  const sorted = sortedTiers(tiers);
  return sorted.reduce<Paisa>((max, t) => Math.max(max, t.unitPrice), sorted[0]?.unitPrice ?? 0);
}

/** Saving against the ladder floor at a given quantity. Zero at the floor. */
export function savingAtQty(tiers: PriceTier[], qty: number): Paisa {
  if (qty <= 0) return 0;
  const floor = highestUnitPrice(tiers);
  const applied = unitPriceForQty(tiers, qty);
  return Math.max(0, (floor - applied) * qty);
}

/* -------------------------------------------------------------- MOQ + steps */

/** Rounds up to the next legal order quantity (MOQ floor, carton multiples). */
export function snapToStep(qty: number, moq: number, step: number): number {
  if (qty <= 0) return 0;
  const floored = Math.max(qty, moq);
  if (step <= 1) return floored;
  const offset = floored - moq;
  return moq + Math.ceil(offset / step) * step;
}

export function isLegalQty(qty: number, moq: number, step: number): boolean {
  if (qty < moq) return false;
  if (step <= 1) return true;
  return (qty - moq) % step === 0;
}

/* ------------------------------------------------------- listing state / CTA */

export interface ListingContext {
  qty: number;
  /** Total dispatchable stock across all variants. */
  availableStock: number;
  /** Buyer has opened a customisation option that requires a quote. */
  customisationRequested?: boolean;
}

/**
 * Decides which CTA is primary, from data rather than from convention.
 *
 * Deliberately there is no `buy_now`: ArcB2B orders are multi-SKU matrices
 * under a consolidated MOQ, and checkout needs a district, a courier, a
 * payment method and an escrow acknowledgement. A path that skips the cart
 * either skips those decisions or duplicates checkout — so the cart *is* the
 * B2B express lane, because it is where a mix becomes an order.
 */
/** Only the fields the decision actually reads — so a trimmed payload works. */
export type ListingInput = Pick<Product, 'pricing' | 'status' | 'logistics'>;

export function resolveListingState(product: ListingInput, ctx: ListingContext): ListingState {
  const { pricing, status, logistics } = product;
  const { qty, availableStock, customisationRequested } = ctx;

  if (status === 'suspended') return 'unavailable';

  if (pricing.priceOnRequest || pricing.tiers.length === 0) return 'quote_only';

  if (status === 'out_of_stock' && logistics.leadTimeDays === 0) return 'unavailable';

  if (customisationRequested) return 'customisation';

  // Past twice the top tier's floor, a published ladder stops being the right
  // instrument — that is a negotiation, and pretending otherwise leaves money
  // on the table for both sides.
  const top = sortedTiers(pricing.tiers).at(-1);
  if (top && qty > top.minQty * 2) return 'volume_quote';

  if (qty > 0 && !isLegalQty(qty, pricing.moq, pricing.moqStep)) return 'below_moq';

  /**
   * Sourced-to-order is not the same thing as "takes a few days to dispatch".
   *
   * `leadTimeDays` is dispatch lead — the earbuds ship from a Dhaka warehouse
   * in three days and are unambiguously in stock. What makes a line sourced is
   * either that the seller declares a production window (`sourcingDays`), or
   * that the buyer has asked for more than can be dispatched and the balance has
   * to come off an inbound shipment. Conflating the two labelled every stocked
   * product as sourced and pushed buyers toward a quote they did not need.
   */
  const madeToOrder = logistics.sourcingDays !== undefined;
  if (madeToOrder || qty > availableStock) return 'sourced_to_order';

  return 'in_stock';
}

/** Whether a state permits adding to the cart at all. */
export function stateAllowsCart(state: ListingState): boolean {
  return state === 'in_stock' || state === 'sourced_to_order' || state === 'customisation' || state === 'volume_quote';
}
