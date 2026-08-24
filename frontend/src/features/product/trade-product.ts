import type { Product } from '@/lib/types';

/**
 * The slice of a product the trade panel needs.
 *
 * Deliberately a separate, framework-neutral module rather than living beside
 * the provider: `trade-context.tsx` is a `'use client'` file, and anything
 * exported from a client module cannot be *called* on the server — only
 * rendered. The page builds this payload during the server render, so the
 * builder has to live outside the client boundary.
 *
 * Trimming also keeps the RSC payload honest. The full product carries
 * specifications, description blocks, reviews and seller detail that the panel
 * never reads; serialising all of it into the client payload would roughly
 * triple it for no benefit.
 */
export interface TradeProduct {
  slug: string;
  title: Product['title'];
  sku: string;
  status: Product['status'];
  pricing: Product['pricing'];
  variants: Product['variants'];
  variantAxes: string[];
  logistics: Product['logistics'];
  customisation?: Product['customisation'];
  sellerName: string;
  /** First non-video image — the sticky bar needs an identity thumbnail. */
  thumb: string;
}

export function toTradeProduct(product: Product): TradeProduct {
  return {
    slug: product.slug,
    title: product.title,
    sku: product.sku,
    status: product.status,
    pricing: product.pricing,
    variants: product.variants,
    variantAxes: product.variantAxes,
    logistics: product.logistics,
    customisation: product.customisation,
    sellerName: product.seller.name,
    thumb: product.media.find((m) => m.kind !== 'video')?.src ?? product.media[0]?.src ?? '',
  };
}
