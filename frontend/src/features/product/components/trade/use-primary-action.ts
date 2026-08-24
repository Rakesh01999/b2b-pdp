'use client';

import { useCallback } from 'react';
import { useTrade } from '@/features/product/trade-context';
import { useCart } from '@/features/app/providers';
import { pick, t, type StringKey } from '@/lib/i18n';
import type { Lang, ListingState } from '@/lib/types';

/**
 * The primary action, resolved once and shared.
 *
 * Both the trade panel and the sticky bar present the same primary CTA, so the
 * decision lives here rather than in either of them. Two copies of this logic
 * would eventually disagree, and the bug — a bar offering "Add to cart" for a
 * quote-only line — is exactly the kind that reaches production because each
 * component looks correct on its own.
 */

const LABEL: Record<ListingState, StringKey> = {
  in_stock: 'cta.addToCart',
  sourced_to_order: 'cta.startSourcing',
  volume_quote: 'cta.requestVolumeQuote',
  quote_only: 'cta.requestQuote',
  customisation: 'cta.requestCustomQuote',
  unavailable: 'cta.notifyMe',
  below_moq: 'cta.addToCart',
};

export interface PrimaryAction {
  label: string;
  /** True when the action opens the quote drawer rather than touching the cart. */
  isQuote: boolean;
  disabled: boolean;
  run: () => Promise<void>;
}

export function usePrimaryAction(lang: Lang): PrimaryAction {
  const { product, lines, unitPrice, listingState, allowsCart, setAddStatus, openRfq } = useTrade();
  const { addEntry } = useCart();

  const routesToCart = listingState === 'in_stock' || listingState === 'sourced_to_order';

  const run = useCallback(async () => {
    if (!routesToCart) {
      openRfq(
        listingState === 'volume_quote'
          ? 'volume'
          : listingState === 'customisation'
            ? 'custom'
            : listingState === 'unavailable'
              ? 'unavailable'
              : 'general',
      );
      return;
    }

    setAddStatus('pending');
    try {
      await addEntry({
        productSlug: product.slug,
        productTitle: pick(product.title, lang),
        lines,
        unitPrice,
      });
      setAddStatus('added');
    } catch {
      setAddStatus('error');
    }
  }, [routesToCart, listingState, openRfq, setAddStatus, addEntry, product, lines, unitPrice, lang]);

  return {
    label: t(lang, LABEL[listingState]),
    isQuote: !routesToCart,
    disabled: routesToCart ? !allowsCart : false,
    run,
  };
}
