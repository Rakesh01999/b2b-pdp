/**
 * Domain types for the ArcB2B product page.
 *
 * These mirror the API contract proposed in the design plan (§18), including
 * the fields the current ARCB2B `Product` model does not yet carry: `unit`,
 * `moqStep`, `weightGrams`, `cartonQty`, `priceOnRequest`, `customisation`,
 * grouped specifications, media provenance, and a `seller` reference.
 *
 * MONEY IS ALWAYS AN INTEGER IN PAISA (৳1 = 100 paisa). Percentage fees and
 * tier maths compound, and floats drift; keeping the minor unit integral means
 * the subtotal a buyer reads is the subtotal the order is written with.
 */

/** Integer minor unit. ৳1 = 100 paisa. Never a float. */
export type Paisa = number;

export type Lang = 'en' | 'bn';

/** A string that has both scripts. `bn` is optional — English is the fallback. */
export interface Bilingual {
  en: string;
  bn?: string;
}

/* ------------------------------------------------------------------ pricing */

export interface PriceTier {
  /** Inclusive lower bound in units. The first tier's minQty equals the MOQ. */
  minQty: number;
  unitPrice: Paisa;
}

/** A tier with its computed upper bound. Produced by `ladderRanges()`. */
export interface PriceTierRange extends PriceTier {
  /** Inclusive upper bound, or null for the open-ended top tier. */
  maxQty: number | null;
  isBest: boolean;
}

/* ----------------------------------------------------------------- variants */

export interface Variant {
  id: string;
  sku: string;
  /** e.g. `{ Colour: 'Midnight Black', Size: 'M' }`. Drives the matrix axes. */
  attributes: Record<string, string>;
  /** Units available for immediate dispatch. */
  stock: number;
  /** Units already on the water, with the days until they land. */
  incoming?: { qty: number; days: number };
  /** Per-unit adjustment against the ladder price, if this SKU costs more. */
  priceDelta?: Paisa;
}

/* ------------------------------------------------------------------- media */

export type MediaKind = 'studio' | 'supplier' | 'video';

export interface ProductMedia {
  kind: MediaKind;
  /** Full-resolution source. The zoom lens reads this; 2x is not simulated. */
  src: string;
  /** Video only. */
  poster?: string;
  width: number;
  height: number;
  alt: Bilingual;
  /** ISO date. Rendered as photo provenance — honesty on an import catalogue. */
  capturedAt?: string;
}

/* ----------------------------------------------------------- specifications */

export type SpecGroup = 'general' | 'technical' | 'packaging' | 'trade' | 'compliance';

export interface SpecRow {
  group: SpecGroup;
  label: Bilingual;
  value: Bilingual;
  /** Promoted into the eight key attributes above the fold. */
  key?: boolean;
  /** Renders an info affordance next to the value. */
  note?: Bilingual;
}

/* ------------------------------------------------------------------- seller */

export type SellerMetricKey = 'response' | 'onTime' | 'reorder' | 'disputes';

/**
 * A measured metric. `value` is null when there is not enough transaction
 * history to publish one — and the UI must render that as "not enough orders
 * yet" rather than inventing a number or showing a zero.
 */
export interface SellerMetric {
  key: SellerMetricKey;
  /** Percentage, 0–100. Null means not measured. */
  value: number | null;
  /** Orders or messages the figure is computed from. Drives the threshold. */
  sampleSize: number;
}

export interface Certification {
  code: string;
  label: Bilingual;
  /** Link to the admin-verified document. Absent means the chip does not render. */
  documentUrl?: string;
  verifiedAt?: string;
}

export interface Seller {
  id: string;
  name: string;
  /**
   * `platform` is ArcB2B selling its own imported stock (the contracted P0
   * model). `supplier` is a marketplace storefront (P1). The same component
   * renders both — only the data source changes.
   */
  kind: 'platform' | 'supplier';
  location: Bilingual;
  yearsActive: number;
  skuCount: number;
  verified: boolean;
  escrow: boolean;
  metrics: SellerMetric[];
  certifications: Certification[];
  storeHref: string;
}

/** Where imported stock actually came from. Absent for locally made goods. */
export interface SourcingProvenance {
  factoryName: string;
  region: Bilingual;
  platform: '1688' | 'alibaba' | 'direct';
  yearsActive: number;
  verified: boolean;
}

/* ------------------------------------------------------------------ reviews */

export interface Review {
  id: string;
  /** A business, not a person — that is what persuades another shop owner. */
  business: string;
  district: Bilingual;
  rating: 1 | 2 | 3 | 4 | 5;
  body: Bilingual;
  /** Order size carries the signal: 5★ on 500 pcs outweighs 5★ on a sample. */
  orderQty: number;
  variantLabel?: string;
  verified: boolean;
  repeatBuyer: boolean;
  createdAt: string;
  photos: string[];
  helpfulVotes: number;
  sellerReply?: { body: Bilingual; author: string; createdAt: string };
}

export interface RatingAggregate {
  average: number;
  total: number;
  /** Index 0 = 1★ … index 4 = 5★. */
  distribution: [number, number, number, number, number];
  verifiedCount: number;
  withPhotosCount: number;
  repeatBuyerCount: number;
}

/* ------------------------------------------------------------------ product */

export type ProductStatus = 'active' | 'suspended' | 'out_of_stock';
export type ProductSource = 'manual' | '1688';

/** The unit a ladder price is quoted in. Not all wholesale sells by the piece. */
export type SellUnit = 'pc' | 'dozen' | 'carton' | 'kg' | 'metre';

export interface DescriptionBlock {
  type: 'paragraph' | 'heading' | 'list' | 'image';
  /** paragraph / heading */
  text?: Bilingual;
  /** list */
  items?: Bilingual[];
  /** image — imported description strips are split into captioned blocks so
   *  they stay indexable, translatable and accessible. */
  src?: string;
  width?: number;
  height?: number;
  caption?: Bilingual;
}

export interface Product {
  id: string;
  slug: string;
  title: Bilingual;
  shortDescription: Bilingual;
  sku: string;
  status: ProductStatus;
  source: ProductSource;

  category: { name: Bilingual; slug: string; parent?: { name: Bilingual; slug: string } };

  media: ProductMedia[];

  pricing: {
    currency: 'BDT';
    unit: SellUnit;
    /** Ladder floor, ascending. Tier 0's minQty is the MOQ. */
    tiers: PriceTier[];
    moq: number;
    /** Order quantity must be a multiple of this (carton multiples). */
    moqStep: number;
    /** Price is withheld pending a quote. Forces the quote-only CTA state. */
    priceOnRequest: boolean;
    samplePrice?: Paisa;
    sampleQty?: number;
  };

  variants: Variant[];
  /** Axis order for the matrix, e.g. `['Colour', 'Size']`. */
  variantAxes: string[];

  specifications: SpecRow[];
  description: DescriptionBlock[];

  logistics: {
    weightGrams: number;
    cartonQty: number;
    cartonDims: string;
    unitsPerPallet?: number;
    /** Dispatch lead in days. 0 ships same day; this is NOT a sourcing signal. */
    leadTimeDays: number;
    /**
     * Production window in days after payment confirmation. Its presence is
     * what makes a line sourced-to-order; see `resolveListingState()`.
     */
    sourcingDays?: [number, number];
  };

  customisation?: {
    logoPrintMoq?: number;
    customPackagingMoq?: number;
    privateLabelMoq?: number;
  };

  seller: Seller;
  provenance?: SourcingProvenance;

  rating: RatingAggregate | null;
  reviews: Review[];

  stats: { views: number; ordersPlaced: number };
  tags: Bilingual[];
  publishedAt: string;
}

/** Card shape for rails and search results — deliberately leaner than Product. */
export interface ProductCard {
  id: string;
  slug: string;
  title: Bilingual;
  image: string;
  unit: SellUnit;
  tiers: PriceTier[];
  moq: number;
  rating: number | null;
  reviewCount: number;
  ordersPlaced: number;
  source: ProductSource;
  leadTimeDays: number;
  /**
   * True only when the seller declares a production window. Dispatch lead time
   * alone is not sourcing — without this the card calls every stocked product
   * made-to-order, which is the same mistake the CTA resolver had.
   */
  madeToOrder: boolean;
  sellerName: string;
  /**
   * Leaf category slug, so a card can be filtered without loading its Product.
   * A search index that cannot narrow by category is a text box, not search.
   */
  categorySlug: string;
}

/* ----------------------------------------------------------------- shipping */

export type CourierId = 'pathao' | 'steadfast' | 'redx' | 'ecourier';

export interface ShippingQuote {
  courier: CourierId;
  courierName: string;
  cost: Paisa;
  minDays: number;
  maxDays: number;
  cod: boolean;
  note?: Bilingual;
  /** Cheapest / fastest for this basket. Drives at most one chip per row. */
  flag?: 'cheapest' | 'fastest';
}

export interface District {
  id: string;
  name: Bilingual;
  zone: 'dhaka_metro' | 'dhaka_suburb' | 'divisional' | 'district';
}

export type PaymentMethodId = 'bkash' | 'nagad' | 'rocket' | 'bank';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  /** Basis points, so a 1.5% fee is 150 and stays integral. */
  feeBps: number;
}

/* -------------------------------------------------------- derived page state */

/**
 * The listing state that decides which CTA is primary. Derived from data, not
 * chosen by a designer — see `resolveListingState()`.
 */
export type ListingState =
  | 'in_stock'
  | 'sourced_to_order'
  | 'volume_quote'
  | 'quote_only'
  | 'customisation'
  | 'unavailable'
  | 'below_moq';
