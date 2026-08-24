import {
  COURIERS,
  FREE_SHIPPING_THRESHOLD,
  FREIGHT_THRESHOLD_GRAMS,
  districtById,
  paymentMethodById,
} from '@/lib/constants';
import type { Paisa, ShippingQuote } from '@/lib/types';

/**
 * Landed cost — the figure ArcB2B shows and its references do not.
 *
 * Every buyer on this platform is a reseller computing margin. Unit price alone
 * cannot answer "what do I pay per piece", because courier cost and the payment
 * gateway fee both land on the same invoice. Baymard's benchmark finds 81% of
 * sites omit per-unit price on multi-quantity products and 67% omit total order
 * cost; for a B2B buyer those two omissions *are* the decision.
 *
 * All arithmetic is integer paisa. Percentage fees are basis points, so a 1.5%
 * gateway fee never introduces a float.
 */

export interface ShippingInput {
  districtId: string;
  /** Total shipment weight in grams. */
  weightGrams: number;
  /** Goods subtotal, for the free-delivery threshold. */
  orderValue: Paisa;
}

function billableKg(weightGrams: number): number {
  // Couriers bill on whole kilos, rounded up, minimum one.
  return Math.max(1, Math.ceil(weightGrams / 1000));
}

/**
 * The rate card, evaluated. Returns one quote per courier, cheapest first, with
 * at most one `cheapest` and one `fastest` flag so the table never wears four
 * competing badges.
 */
export function shippingQuotes(input: ShippingInput): ShippingQuote[] {
  const { zone } = districtById(input.districtId);
  const kg = billableKg(input.weightGrams);
  const threshold = FREE_SHIPPING_THRESHOLD[zone];
  const qualifiesFree = threshold !== null && input.orderValue >= threshold;

  const quotes: ShippingQuote[] = COURIERS.map((courier) => {
    const raw = courier.base[zone] + courier.perKg[zone] * (kg - 1);
    const [minDays, maxDays] = courier.days[zone];
    return {
      courier: courier.id,
      courierName: courier.name,
      cost: qualifiesFree ? 0 : raw,
      minDays,
      maxDays,
      cod: courier.cod,
      note: courier.note,
    };
  });

  quotes.sort((a, b) => a.cost - b.cost || a.maxDays - b.maxDays);

  // Flags are only meaningful when the options actually differ.
  if (!qualifiesFree && quotes.length > 1) {
    const cheapest = quotes[0];
    if (cheapest.cost < quotes[1].cost) cheapest.flag = 'cheapest';
  }

  const fastest = [...quotes].sort((a, b) => a.maxDays - b.maxDays || a.cost - b.cost)[0];
  if (fastest && fastest.flag === undefined) fastest.flag = 'fastest';

  return quotes;
}

export function freeShippingStatus(input: ShippingInput): {
  threshold: Paisa | null;
  qualifies: boolean;
  shortfall: Paisa;
} {
  const { zone } = districtById(input.districtId);
  const threshold = FREE_SHIPPING_THRESHOLD[zone];
  if (threshold === null) return { threshold: null, qualifies: false, shortfall: 0 };
  return {
    threshold,
    qualifies: input.orderValue >= threshold,
    shortfall: Math.max(0, threshold - input.orderValue),
  };
}

export function needsFreight(weightGrams: number): boolean {
  return weightGrams >= FREIGHT_THRESHOLD_GRAMS;
}

/* ---------------------------------------------------------------- the figure */

export interface LandedCostInput {
  qty: number;
  unitPrice: Paisa;
  /** Extra charged above the ladder price for premium SKUs in the mix. */
  variantSurcharge?: Paisa;
  shippingCost: Paisa;
  paymentMethodId: string;
}

export interface LandedCost {
  qty: number;
  unitPrice: Paisa;
  goodsSubtotal: Paisa;
  variantSurcharge: Paisa;
  shippingCost: Paisa;
  paymentFee: Paisa;
  paymentFeeBps: number;
  paymentMethodName: string;
  total: Paisa;
  /** The number a reseller actually sets shelf price from. */
  perUnit: Paisa;
}

export function computeLandedCost(input: LandedCostInput): LandedCost {
  const method = paymentMethodById(input.paymentMethodId);
  const surcharge = input.variantSurcharge ?? 0;
  const goodsSubtotal = input.unitPrice * input.qty;
  const beforeFee = goodsSubtotal + surcharge + input.shippingCost;

  // Basis points, integer-divided last so the fee is exact to the paisa.
  const paymentFee = Math.round((beforeFee * method.feeBps) / 10_000);
  const total = beforeFee + paymentFee;

  return {
    qty: input.qty,
    unitPrice: input.unitPrice,
    goodsSubtotal,
    variantSurcharge: surcharge,
    shippingCost: input.shippingCost,
    paymentFee,
    paymentFeeBps: method.feeBps,
    paymentMethodName: method.name,
    total,
    perUnit: input.qty > 0 ? Math.round(total / input.qty) : 0,
  };
}

/** Shipment weight for a mix — the figure the rate card is banded on. */
export function shipmentWeight(qty: number, unitWeightGrams: number): number {
  return qty * unitWeightGrams;
}

/** Cartons a mix occupies. Shown because a buyer arranging pickup needs it. */
export function cartonCount(qty: number, cartonQty: number): number {
  if (cartonQty <= 0) return 0;
  return Math.ceil(qty / cartonQty);
}
