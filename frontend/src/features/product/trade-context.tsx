'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePrefs } from '@/features/app/providers';
import {
  activeTierIndex,
  isLegalQty,
  ladderRanges,
  lowestUnitPrice,
  nextTierNudge,
  resolveListingState,
  savingAtQty,
  snapToStep,
  stateAllowsCart,
  unitPriceForQty,
  type NextTierNudge,
} from './lib/pricing';
import {
  buildMatrix,
  capacityOf,
  clearMix,
  distributeEvenly,
  mixLines,
  scaleMixTo,
  setCell,
  sourcingDaysForMix,
  totalCapacity,
  totalQty as sumMix,
  totalStock,
  type Matrix,
  type Mix,
  type MixLine,
} from './lib/mix';
import {
  cartonCount,
  computeLandedCost,
  freeShippingStatus,
  needsFreight,
  shipmentWeight,
  shippingQuotes,
  type LandedCost,
} from './lib/landed-cost';
import type { TradeProduct } from './trade-product';
import type { ListingState, Paisa, PriceTierRange, ShippingQuote } from '@/lib/types';

/**
 * One source of truth for the buyer's working order.
 *
 * The trade panel, the mobile trade bar, the shipping comparison and the quote
 * drawer all read the same derived values from here. That is the whole point: on
 * a page where quantity drives the unit price, which drives the courier band,
 * which drives the landed total, any second copy of that arithmetic is a bug
 * waiting to be reported as "the price on the button doesn't match the table".
 *
 * Everything below the raw `mix` is derived in a single `useMemo`. There are no
 * effects syncing one piece of state to another, so there is no frame where the
 * quantity and the price disagree.
 */

export type AddStatus = 'idle' | 'pending' | 'added' | 'error';

interface TradeValue {
  product: TradeProduct;
  matrix: Matrix;

  /* raw state */
  mix: Mix;
  customisationRequested: boolean;

  /* derived quantities */
  qty: number;
  lines: MixLine[];
  availableStock: number;
  capacity: number;

  /* derived pricing */
  ladder: PriceTierRange[];
  activeTier: number;
  unitPrice: Paisa;
  variantSurcharge: Paisa;
  /** Units in the mix carrying a per-unit premium, and that premium. */
  surchargeUnits: number;
  surchargeRate: Paisa | null;
  saving: Paisa;
  nudge: NextTierNudge | null;
  fromPrice: Paisa;

  /* validation + routing */
  legal: boolean;
  belowMoq: boolean;
  listingState: ListingState;
  allowsCart: boolean;
  quoteOnly: boolean;
  sourcingDays: number;

  /* logistics + money */
  weightGrams: number;
  cartons: number;
  quotes: ShippingQuote[];
  selectedQuote: ShippingQuote | null;
  landed: LandedCost;
  freeShipping: ReturnType<typeof freeShippingStatus>;
  freight: boolean;

  /* actions */
  setQty: (variantId: string, value: number) => void;
  setTotal: (target: number) => void;
  selectTier: (index: number) => void;
  distribute: (target?: number) => void;
  reset: () => void;
  applyMix: (mix: Mix) => void;
  snapToLegal: () => void;
  setCourier: (courier: string) => void;
  courierId: string | null;
  requestCustomisation: (on: boolean) => void;

  /* ui */
  addStatus: AddStatus;
  setAddStatus: (status: AddStatus) => void;
  rfqOpen: boolean;
  openRfq: (reason?: RfqReason) => void;
  closeRfq: () => void;
  rfqReason: RfqReason;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}

export type RfqReason = 'general' | 'volume' | 'custom' | 'unavailable';

const TradeContext = createContext<TradeValue | null>(null);

export function TradeProvider({
  product,
  children,
}: {
  product: TradeProduct;
  children: ReactNode;
}) {
  const { districtId, paymentMethodId } = usePrefs();

  const [mix, setMix] = useState<Mix>({});
  const [customisationRequested, setCustomisationRequested] = useState(false);
  const [addStatus, setAddStatus] = useState<AddStatus>('idle');
  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqReason, setRfqReason] = useState<RfqReason>('general');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [courierId, setCourierId] = useState<string | null>(null);

  const matrix = useMemo(
    () => buildMatrix(product.variants, product.variantAxes),
    [product.variants, product.variantAxes],
  );

  const variantById = useMemo(
    () => new Map(product.variants.map((v) => [v.id, v])),
    [product.variants],
  );

  /* ------------------------------------------------------------- actions */

  const setQty = useCallback(
    (variantId: string, value: number) => {
      const variant = variantById.get(variantId);
      setMix((prev) => setCell(prev, variantId, value, capacityOf(variant ?? null)));
      setAddStatus('idle');
    },
    [variantById],
  );

  const setTotal = useCallback(
    (target: number) => {
      setMix((prev) => scaleMixTo(prev, product.variants, target));
      setAddStatus('idle');
    },
    [product.variants],
  );

  const selectTier = useCallback(
    (index: number) => {
      const tier = product.pricing.tiers[index];
      if (!tier) return;
      setTotal(tier.minQty);
    },
    [product.pricing.tiers, setTotal],
  );

  const distribute = useCallback(
    (target?: number) => {
      const goal = target ?? Math.max(sumMix(mix), product.pricing.moq);
      setMix(distributeEvenly(goal, product.variants));
      setAddStatus('idle');
    },
    [mix, product.pricing.moq, product.variants],
  );

  const reset = useCallback(() => {
    setMix(clearMix());
    setAddStatus('idle');
  }, []);

  const applyMix = useCallback((next: Mix) => {
    setMix(next);
    setAddStatus('idle');
  }, []);

  const openRfq = useCallback((reason: RfqReason = 'general') => {
    setRfqReason(reason);
    setRfqOpen(true);
  }, []);

  const closeRfq = useCallback(() => setRfqOpen(false), []);

  /**
   * Restores a shared configuration from `?qty=`.
   *
   * Sharing a *configured* quote is the B2B behaviour that matters — a buyer
   * sends a colleague the price at their quantity, not the headline price — and
   * the Share control writes that parameter. Reading it back is what makes the
   * link do anything.
   *
   * Read from `window.location` in an effect rather than through
   * `useSearchParams`: this provider wraps the whole page, and the search-params
   * hook would opt the entire route out of static generation for a parameter
   * that is absent on almost every visit.
   */
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('qty');
    const requested = Number(raw?.replace(/[^\d]/g, ''));
    if (!raw || !Number.isFinite(requested) || requested <= 0) return;

    const legal = snapToStep(requested, product.pricing.moq, product.pricing.moqStep);
    // Must be an effect, not lazy initial state: the server renders this page
    // with an empty mix, so seeding from the URL during the first client render
    // would produce a hydration mismatch on every shared link.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setMix(distributeEvenly(Math.min(legal, totalCapacity(product.variants)), product.variants));
  }, [product]);

  /* ------------------------------------------------------------- derived */

  const derived = useMemo(() => {
    const qty = sumMix(mix);
    const tiers = product.pricing.tiers;
    const quoteOnly = product.pricing.priceOnRequest || tiers.length === 0;

    const ladder = ladderRanges(tiers);
    const unitPrice = quoteOnly ? 0 : unitPriceForQty(tiers, qty);

    // Premium SKUs carry a per-unit delta over the ladder price. Charging it as
    // a separate line rather than blending it into the unit price keeps the
    // ladder honest — the tier price is the tier price.
    let variantSurcharge = 0;
    let surchargeUnits = 0;
    const surchargeRates = new Set<number>();
    for (const [id, lineQty] of Object.entries(mix)) {
      const delta = variantById.get(id)?.priceDelta ?? 0;
      if (delta <= 0) continue;
      variantSurcharge += delta * lineQty;
      surchargeUnits += lineQty;
      surchargeRates.add(delta);
    }
    // A single rate can be shown as "120 x +tk40". Mixed rates cannot be
    // summarised honestly on one line, so the UI shows the total alone.
    const surchargeRate = surchargeRates.size === 1 ? [...surchargeRates][0] : null;

    const availableStock = totalStock(product.variants);
    const capacity = totalCapacity(product.variants);

    const listingState = resolveListingState(product, {
      qty,
      availableStock,
      customisationRequested,
    });

    const legal = qty === 0 || isLegalQty(qty, product.pricing.moq, product.pricing.moqStep);
    const belowMoq = qty > 0 && qty < product.pricing.moq;

    const weightGrams = shipmentWeight(qty, product.logistics.weightGrams);
    const goodsSubtotal = unitPrice * qty + variantSurcharge;

    const quotes = qty > 0 ? shippingQuotes({ districtId, weightGrams, orderValue: goodsSubtotal }) : [];
    const selectedQuote = quotes.find((q) => q.courier === courierId) ?? quotes[0] ?? null;

    const landed = computeLandedCost({
      qty,
      unitPrice,
      variantSurcharge,
      shippingCost: selectedQuote?.cost ?? 0,
      paymentMethodId,
    });

    return {
      qty,
      lines: mixLines(mix, product.variants),
      availableStock,
      capacity,
      ladder,
      activeTier: activeTierIndex(tiers, qty),
      unitPrice,
      variantSurcharge,
      surchargeUnits,
      surchargeRate,
      saving: quoteOnly ? 0 : savingAtQty(tiers, qty),
      nudge: quoteOnly ? null : nextTierNudge(tiers, qty),
      fromPrice: quoteOnly ? 0 : lowestUnitPrice(tiers),
      legal,
      belowMoq,
      listingState,
      allowsCart: stateAllowsCart(listingState) && qty > 0 && legal && !quoteOnly,
      quoteOnly,
      sourcingDays: Math.max(
        sourcingDaysForMix(mix, product.variants),
        product.logistics.leadTimeDays,
      ),
      weightGrams,
      cartons: cartonCount(qty, product.logistics.cartonQty),
      quotes,
      selectedQuote,
      landed,
      freeShipping: freeShippingStatus({ districtId, weightGrams, orderValue: goodsSubtotal }),
      freight: needsFreight(weightGrams),
    };
  }, [mix, product, variantById, customisationRequested, districtId, paymentMethodId, courierId]);

  const snapToLegal = useCallback(() => {
    setTotal(snapToStep(Math.max(derived.qty, 1), product.pricing.moq, product.pricing.moqStep));
  }, [derived.qty, product.pricing.moq, product.pricing.moqStep, setTotal]);

  const value = useMemo<TradeValue>(
    () => ({
      product,
      matrix,
      mix,
      customisationRequested,
      ...derived,
      setQty,
      setTotal,
      selectTier,
      distribute,
      reset,
      applyMix,
      snapToLegal,
      setCourier: setCourierId,
      courierId,
      requestCustomisation: setCustomisationRequested,
      addStatus,
      setAddStatus,
      rfqOpen,
      openRfq,
      closeRfq,
      rfqReason,
      sheetOpen,
      setSheetOpen,
    }),
    [
      product,
      matrix,
      mix,
      customisationRequested,
      derived,
      setQty,
      setTotal,
      selectTier,
      distribute,
      reset,
      applyMix,
      snapToLegal,
      courierId,
      addStatus,
      rfqOpen,
      openRfq,
      closeRfq,
      rfqReason,
      sheetOpen,
    ],
  );

  return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}

export type { TradeProduct };

export function useTrade(): TradeValue {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error('useTrade must be used inside <TradeProvider>');
  return ctx;
}
