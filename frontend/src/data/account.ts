import type { Bilingual, Paisa } from '@/lib/types';

/**
 * Account-side fixtures: one quotation thread, the message list, the
 * notification feed.
 *
 * These are fixtures, and every page that renders them says so. The alternative
 * was an empty state on four routes, which would have hidden the part of the
 * design that actually needed working out — what a quote comparison looks like
 * when three suppliers answer the same request with different quantities, lead
 * times and validity periods.
 *
 * Dates are fixed ISO strings rather than offsets from today. A fixture that
 * drifts with the clock produces a build whose output changes for no reason, and
 * "2 days ago" that is really eleven months ago is worse than a date.
 */

/* ------------------------------------------------------------------ quotes */

export interface RfqQuote {
  id: string;
  sellerId: string;
  sellerName: string;
  storeHref: string;
  /** Quoted unit price in paisa, at `minQty`. */
  unitPrice: Paisa;
  minQty: number;
  leadTimeDays: number;
  /** ISO date the quote expires. A quote without one is not a quote. */
  validUntil: string;
  note?: Bilingual;
  /** Estimated courier for the quoted quantity to the buyer's district. */
  courierEstimate: Paisa;
}

export interface RfqThread {
  id: string;
  item: Bilingual;
  categorySlug: string;
  quantity: number;
  targetPrice: Paisa;
  districtId: string;
  neededBy: string;
  createdAt: string;
  customisation: Bilingual[];
  details: Bilingual;
  quotes: RfqQuote[];
  /** Suppliers the request reached but who have not answered yet. */
  awaitingCount: number;
}

export const RFQ_THREADS: Record<string, RfqThread> = {
  'RFQ-24817': {
    id: 'RFQ-24817',
    item: {
      en: 'TWS earbuds, retail-boxed, with our logo on the case',
      bn: 'TWS ইয়ারবাড, রিটেইল বক্সে, কেসে আমাদের লোগোসহ',
    },
    categorySlug: 'earphones-headsets',
    quantity: 1_200,
    targetPrice: 40_000, // ৳400
    districtId: 'chattogram',
    neededBy: '2026-10-05',
    createdAt: '2026-08-18',
    customisation: [
      { en: 'Logo print on case', bn: 'কেসে লোগো প্রিন্ট' },
      { en: 'Custom retail box', bn: 'কাস্টম রিটেইল বক্স' },
    ],
    details: {
      en: 'Need 1,200 units for a Chattogram retail chain. Mixed colours acceptable, roughly 60% black. Logo is one-colour, artwork ready. Must clear our warehouse before the first week of October.',
      bn: 'চট্টগ্রামের একটি রিটেইল চেইনের জন্য ১,২০০ ইউনিট দরকার। মিশ্র রঙ চলবে, প্রায় ৬০% কালো। লোগো এক রঙের, আর্টওয়ার্ক প্রস্তুত। অক্টোবরের প্রথম সপ্তাহের আগে গুদামে পৌঁছাতে হবে।',
    },
    quotes: [
      {
        id: 'Q-1',
        sellerId: 'seller-arcb2b',
        sellerName: 'ArcB2B Sourcing',
        storeHref: '/store/arcb2b-sourcing',
        unitPrice: 41_500,
        minQty: 1_200,
        leadTimeDays: 18,
        validUntil: '2026-09-10',
        courierEstimate: 1_84_000,
        note: {
          en: 'Price includes one-colour logo print and custom box. 60/40 colour split confirmed with the factory.',
          bn: 'দামে এক রঙের লোগো প্রিন্ট ও কাস্টম বক্স অন্তর্ভুক্ত। কারখানার সঙ্গে ৬০/৪০ রঙের ভাগ নিশ্চিত।',
        },
      },
      {
        id: 'Q-2',
        sellerId: 'seller-riddhi',
        sellerName: 'Riddhi Imports',
        storeHref: '/store/riddhi-imports',
        unitPrice: 39_800,
        minQty: 1_500,
        leadTimeDays: 26,
        validUntil: '2026-09-02',
        courierEstimate: 2_20_000,
        note: {
          en: 'Below your target, but only at 1,500 units. Custom box adds ৳6/unit and two weeks.',
          bn: 'আপনার লক্ষ্যের নিচে, তবে কেবল ১,৫০০ ইউনিটে। কাস্টম বক্সে প্রতি ইউনিটে ৬ টাকা ও দুই সপ্তাহ যোগ হবে।',
        },
      },
      {
        id: 'Q-3',
        sellerId: 'seller-meghna',
        sellerName: 'Meghna Textiles',
        storeHref: '/store/meghna-textiles',
        unitPrice: 44_000,
        minQty: 1_000,
        leadTimeDays: 12,
        validUntil: '2026-09-08',
        courierEstimate: 1_84_000,
        note: {
          en: 'Fastest of the three — stock is in Dhaka. Logo print outsourced locally, no custom box available.',
          bn: 'তিনটির মধ্যে দ্রুততম — স্টক ঢাকায়। লোগো প্রিন্ট স্থানীয়ভাবে, কাস্টম বক্স নেই।',
        },
      },
    ],
    awaitingCount: 4,
  },
};

export function findRfqThread(id: string): RfqThread | null {
  return RFQ_THREADS[id] ?? null;
}

export function allRfqIds(): string[] {
  return Object.keys(RFQ_THREADS);
}

/* ---------------------------------------------------------------- messages */

export interface Message {
  from: 'buyer' | 'seller';
  body: Bilingual;
  at: string;
}

export interface MessageThread {
  id: string;
  sellerId: string;
  sellerName: string;
  storeHref: string;
  /** The listing the conversation is about, if any. */
  productSlug?: string;
  subject: Bilingual;
  /** Response-rate figure the storefront publishes, as a human phrase. */
  respondsWithin: Bilingual;
  messages: Message[];
}

export const MESSAGE_THREADS: MessageThread[] = [
  {
    id: 'T-9182',
    sellerId: 'seller-arcb2b',
    sellerName: 'ArcB2B Sourcing',
    storeHref: '/store/arcb2b-sourcing',
    productSlug: 'tws-earbuds-pro-x',
    subject: { en: 'TWS Earbuds Pro X — 600 units, mixed colours', bn: 'TWS ইয়ারবাড প্রো এক্স — ৬০০ ইউনিট, মিশ্র রঙ' },
    respondsWithin: { en: '4 hours', bn: '৪ ঘণ্টা' },
    messages: [
      {
        from: 'buyer',
        at: '2026-08-20T09:12:00+06:00',
        body: {
          en: 'Can you hold 600 units at the 500-piece tier price if I split it 400 black and 200 white?',
          bn: '৪০০ কালো ও ২০০ সাদা ভাগ করলে ৫০০-পিস টিয়ারের দামে ৬০০ ইউনিট রাখতে পারবেন?',
        },
      },
      {
        from: 'seller',
        at: '2026-08-20T11:40:00+06:00',
        body: {
          en: 'Yes — the tier applies to the order total, so 600 across two colours gets the 500-piece price. White has 180 in Dhaka and 240 landing in 9 days; the rest ships immediately.',
          bn: 'হ্যাঁ — টিয়ার মোট অর্ডারে প্রযোজ্য, তাই দুই রঙে ৬০০ নিলে ৫০০-পিসের দাম পাবেন। সাদা ঢাকায় ১৮০ আছে ও ৯ দিনে ২৪০ আসছে; বাকিটা এখনই পাঠানো যাবে।',
        },
      },
      {
        from: 'buyer',
        at: '2026-08-20T12:05:00+06:00',
        body: {
          en: 'Split the consignment then — send the black now and the white when it lands. Same courier both times.',
          bn: 'তাহলে কনসাইনমেন্ট ভাগ করুন — কালোটা এখন পাঠান, সাদা এলে পরে। দুবারই একই কুরিয়ার।',
        },
      },
    ],
  },
  {
    id: 'T-9066',
    sellerId: 'seller-meghna',
    sellerName: 'Meghna Textiles',
    storeHref: '/store/meghna-textiles',
    productSlug: 'kurti-cotton-block-print',
    subject: { en: 'Block-print kurti — shade consistency across two batches', bn: 'ব্লক-প্রিন্ট কুর্তি — দুই ব্যাচে রঙের সামঞ্জস্য' },
    respondsWithin: { en: '1 working day', bn: '১ কর্মদিবস' },
    messages: [
      {
        from: 'buyer',
        at: '2026-08-11T16:30:00+06:00',
        body: {
          en: 'Last order the indigo ran two shades darker than the photos. Is the new batch from the same dye lot?',
          bn: 'গত অর্ডারে ইন্ডিগো ছবির চেয়ে দুই শেড গাঢ় ছিল। নতুন ব্যাচ কি একই ডাই লট থেকে?',
        },
      },
      {
        from: 'seller',
        at: '2026-08-12T10:15:00+06:00',
        body: {
          en: 'It is a new lot, and hand-dyed indigo does vary — the listing states a two-shade tolerance. I can send you a cut swatch from the current lot before you commit.',
          bn: 'এটি নতুন লট, এবং হাতে রং করা ইন্ডিগো কিছুটা বদলায় — লিস্টিংয়ে দুই শেড সহনসীমা লেখা আছে। চূড়ান্ত করার আগে চলতি লট থেকে একটি স্যাম্পল পাঠাতে পারি।',
        },
      },
    ],
  },
];

export function findThreadBySeller(sellerId: string): MessageThread | null {
  return MESSAGE_THREADS.find((thread) => thread.sellerId === sellerId) ?? null;
}

export function findThreadByProduct(slug: string): MessageThread | null {
  return MESSAGE_THREADS.find((thread) => thread.productSlug === slug) ?? null;
}

/* ----------------------------------------------------------- notifications */

export type NotificationKind = 'quote' | 'order' | 'stock' | 'dispute' | 'price';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: Bilingual;
  body: Bilingual;
  at: string;
  read: boolean;
  /** Locale-relative destination. Every notification goes somewhere. */
  href: string;
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'N-1',
    kind: 'quote',
    title: { en: 'Three quotes on RFQ-24817', bn: 'RFQ-24817-এ তিনটি কোট' },
    body: {
      en: 'Riddhi Imports quoted below your target price, at 1,500 units rather than 1,200.',
      bn: 'রিদ্ধি ইমপোর্টস আপনার লক্ষ্যের নিচে কোট দিয়েছে, ১,২০০-র বদলে ১,৫০০ ইউনিটে।',
    },
    at: '2026-08-21T08:40:00+06:00',
    read: false,
    href: '/account/rfq/RFQ-24817',
  },
  {
    id: 'N-2',
    kind: 'stock',
    title: { en: 'White earbuds landed in Dhaka', bn: 'সাদা ইয়ারবাড ঢাকায় পৌঁছেছে' },
    body: {
      en: '240 units of the white variant are now dispatchable, so your split consignment can ship together.',
      bn: 'সাদা ভ্যারিয়েন্টের ২৪০ ইউনিট এখন পাঠানোর জন্য প্রস্তুত, তাই আপনার ভাগ করা কনসাইনমেন্ট একসঙ্গে যেতে পারে।',
    },
    at: '2026-08-20T18:05:00+06:00',
    read: false,
    href: '/product/tws-earbuds-pro-x',
  },
  {
    id: 'N-3',
    kind: 'price',
    title: { en: 'LED panel ladder revised', bn: 'এলইডি প্যানেলের ল্যাডার পরিবর্তিত' },
    body: {
      en: 'The 500-piece tier dropped by ৳12 per unit. Your saved listing now bottoms out lower.',
      bn: '৫০০-পিস টিয়ারে প্রতি ইউনিটে ১২ টাকা কমেছে। আপনার সংরক্ষিত লিস্টিংয়ের সর্বনিম্ন দাম আরও কমেছে।',
    },
    at: '2026-08-19T11:20:00+06:00',
    read: true,
    href: '/product/led-panel-light-18w',
  },
  {
    id: 'N-4',
    kind: 'order',
    title: { en: 'Escrow released to Meghna Textiles', bn: 'মেঘনা টেক্সটাইলসকে এসক্রো ছাড়' },
    body: {
      en: 'Your dispute window closed without a claim, so payment for the kurti order was released.',
      bn: 'দাবি ছাড়াই আপনার ডিসপিউট উইন্ডো শেষ হয়েছে, তাই কুর্তি অর্ডারের পেমেন্ট ছাড় হয়েছে।',
    },
    at: '2026-08-14T09:00:00+06:00',
    read: true,
    href: '/help/payment',
  },
];
