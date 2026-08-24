import type { Product, ProductCard, Seller, Review, RatingAggregate } from '@/lib/types';

/**
 * Sample catalogue. Stands in for `GET /v1/storefront/products/:slug` until the
 * API carries the fields the product page needs (see the design plan's API
 * section: `unit`, `moqStep`, `weightGrams`, `cartonQty`, `priceOnRequest`,
 * grouped specifications, media provenance and a `seller` reference).
 *
 * The five products here are chosen to exercise every listing state the CTA
 * resolver can produce, because a page that only ever renders its happy path is
 * a page whose other states are untested:
 *
 *   tws-earbuds-pro-x      in stock, ladder priced, mixed sourced variants
 *   kurti-cotton-block     sourced to order, sold by a marketplace supplier
 *   led-panel-light-18w    price on request  → quote-only
 *   phone-case-tpu-clear   in stock, single axis, no reviews yet
 *   bt-speaker-mini-x2     out of stock, no sourcing route → unavailable
 *
 * All money is an integer in paisa. ৳500 is 50_000.
 */

/* ------------------------------------------------------------------ sellers */

/**
 * The platform selling its own imported stock — the contracted P0 model, where
 * ArcB2B imports, marks up and sells. Metrics are transaction-derived; a metric
 * with too small a sample publishes `null`, and the UI must say so rather than
 * invent a figure.
 */
const ARCB2B_SOURCING: Seller = {
  id: 'seller-arcb2b',
  name: 'ArcB2B Sourcing',
  kind: 'platform',
  location: { en: 'Tejgaon, Dhaka', bn: 'তেজগাঁও, ঢাকা' },
  yearsActive: 3,
  skuCount: 1240,
  verified: true,
  escrow: true,
  metrics: [
    { key: 'response', value: 96, sampleSize: 812 },
    { key: 'onTime', value: 94, sampleSize: 1105 },
    { key: 'reorder', value: 38, sampleSize: 640 },
    { key: 'disputes', value: 100, sampleSize: 27 },
  ],
  certifications: [
    {
      code: 'TRADE-LIC',
      label: { en: 'Trade licence, Dhaka North', bn: 'ট্রেড লাইসেন্স, ঢাকা উত্তর' },
      documentUrl: '#verified-document',
      verifiedAt: '2026-02-11',
    },
    {
      code: 'BIN',
      label: { en: 'VAT registration (BIN)', bn: 'ভ্যাট রেজিস্ট্রেশন' },
      documentUrl: '#verified-document',
      verifiedAt: '2026-02-11',
    },
  ],
  storeHref: '/store/arcb2b-sourcing',
};

/**
 * A marketplace supplier — the P1 model. Present in the sample data on purpose:
 * the seller block has to render both worlds from one component, and the only
 * way to know it does is to have a listing of each. Note the deliberately
 * unmeasured `reorder`: a young storefront has not been trading long enough for
 * a six-month repeat figure to mean anything.
 */
const MEGHNA_TEXTILES: Seller = {
  id: 'seller-meghna',
  name: 'Meghna Textiles',
  kind: 'supplier',
  location: { en: 'Narsingdi', bn: 'নরসিংদী' },
  yearsActive: 11,
  skuCount: 186,
  verified: true,
  escrow: true,
  metrics: [
    { key: 'response', value: 89, sampleSize: 214 },
    { key: 'onTime', value: 91, sampleSize: 143 },
    { key: 'reorder', value: null, sampleSize: 12 },
    { key: 'disputes', value: 96, sampleSize: 24 },
  ],
  certifications: [
    {
      code: 'OEKO-TEX',
      label: { en: 'OEKO-TEX Standard 100', bn: 'ওকো-টেক্স স্ট্যান্ডার্ড 100' },
      documentUrl: '#verified-document',
      verifiedAt: '2026-01-28',
    },
  ],
  storeHref: '/store/meghna-textiles',
};

/** A storefront under review — drives the suspended-seller state. */
const RIDDHI_IMPORTS: Seller = {
  id: 'seller-riddhi',
  name: 'Riddhi Imports',
  kind: 'supplier',
  location: { en: 'Chattogram', bn: 'চট্টগ্রাম' },
  yearsActive: 1,
  skuCount: 42,
  verified: false,
  escrow: true,
  metrics: [
    { key: 'response', value: null, sampleSize: 18 },
    { key: 'onTime', value: null, sampleSize: 9 },
    { key: 'reorder', value: null, sampleSize: 3 },
    { key: 'disputes', value: null, sampleSize: 2 },
  ],
  certifications: [],
  storeHref: '/store/riddhi-imports',
};

/* ------------------------------------------------------------------ reviews */

const EARBUD_REVIEWS: Review[] = [
  {
    id: 'rv-1',
    business: 'Rahim Electronics',
    district: { en: 'Chattogram', bn: 'চট্টগ্রাম' },
    rating: 5,
    body: {
      en: 'Sound matched the sample exactly. 3 units dead on arrival out of 200 — replaced without argument inside the dispute window. Reordering 500 next month.',
      bn: 'স্যাম্পলের সাথে সাউন্ড হুবহু মিলেছে। 200টির মধ্যে 3টি নষ্ট ছিল — কোনও ঝামেলা ছাড়াই বদলে দিয়েছে। পরের মাসে 500 নেব।',
    },
    orderQty: 200,
    variantLabel: 'Midnight Black / ENC',
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-08-12',
    photos: ['/media/review-01.png', '/media/review-02.png'],
    helpfulVotes: 12,
    sellerReply: {
      body: {
        en: 'The 3 units were replaced under the 7-day dispute window. QC batch reference AB-9241-0812 — we tightened driver testing on that batch.',
        bn: '7 দিনের ডিসপিউট উইন্ডোতে 3টি ইউনিট বদলে দেওয়া হয়েছে। QC ব্যাচ AB-9241-0812 — ওই ব্যাচে ড্রাইভার টেস্টিং আরও কড়া করা হয়েছে।',
      },
      author: 'ArcB2B Sourcing',
      createdAt: '2026-08-13',
    },
  },
  {
    id: 'rv-2',
    business: 'Nabila Mobile Corner',
    district: { en: 'Dhaka', bn: 'ঢাকা' },
    rating: 4,
    body: {
      en: 'Good margin at the 200 tier. Retail box print is a bit thin — I overstick with my own label anyway. ANC version is worth the extra ৳40 for walk-in customers.',
      bn: '200 টিয়ারে ভালো মার্জিন। রিটেইল বক্সের প্রিন্ট একটু হালকা — আমি নিজের লেবেল লাগিয়ে দিই। ANC ভার্সনে অতিরিক্ত 40 টাকা যুক্তিসঙ্গত।',
    },
    orderQty: 240,
    variantLabel: 'Cloud White / ANC',
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-07-30',
    photos: ['/media/review-03.png'],
    helpfulVotes: 8,
  },
  {
    id: 'rv-3',
    business: 'Sylhet Gadget House',
    district: { en: 'Sylhet', bn: 'সিলেট' },
    rating: 5,
    body: {
      en: 'Third reorder. Courier to Sylhet took 4 days both times, exactly as quoted. Battery life is genuinely close to the spec sheet, which is rare at this price.',
      bn: 'তৃতীয়বার অর্ডার। দুইবারই সিলেটে 4 দিনে এসেছে, ঠিক যেমন বলা হয়েছিল। ব্যাটারি স্পেক শিটের কাছাকাছি — এই দামে বিরল।',
    },
    orderQty: 500,
    variantLabel: 'Midnight Black / ANC',
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-07-18',
    photos: [],
    helpfulVotes: 15,
  },
  {
    id: 'rv-4',
    business: 'Khulna Tech Mart',
    district: { en: 'Khulna', bn: 'খুলনা' },
    rating: 3,
    body: {
      en: 'Product is fine but the Sky Blue arrived as a slightly different shade than the listing photo. Not a return-worthy problem, just plan your display around it.',
      bn: 'পণ্য ঠিক আছে, তবে স্কাই ব্লু ছবির চেয়ে কিছুটা ভিন্ন শেড এসেছে। ফেরত দেওয়ার মতো নয়, তবে ডিসপ্লে সাজানোর সময় মনে রাখবেন।',
    },
    orderQty: 100,
    variantLabel: 'Sky Blue / ENC',
    verified: true,
    repeatBuyer: false,
    createdAt: '2026-07-04',
    photos: ['/media/review-04.png'],
    helpfulVotes: 21,
    sellerReply: {
      body: {
        en: 'Fair point — the Sky Blue photo was shot under warmer light than the current batch. We have reshot it; the gallery image is now from batch AB-9241-07.',
        bn: 'ঠিক বলেছেন — স্কাই ব্লুয়ের ছবি বর্তমান ব্যাচের চেয়ে উষ্ণ আলোয় তোলা হয়েছিল। নতুন করে তোলা হয়েছে; এখন ব্যাচ AB-9241-07 থেকে।',
      },
      author: 'ArcB2B Sourcing',
      createdAt: '2026-07-05',
    },
  },
  {
    id: 'rv-5',
    business: 'Bogura Mobile Ghor',
    district: { en: 'Bogura', bn: 'বগুড়া' },
    rating: 5,
    body: {
      en: 'Bought 60 as a trial. Sold out in eleven days. The landed cost figure on this page was accurate to within ৳200 of my final invoice, which is why I trusted the second order.',
      bn: 'পরীক্ষামূলকভাবে 60টি নিয়েছিলাম। 11 দিনে শেষ। এই পেজের সর্বমোট খরচের হিসাব আমার চূড়ান্ত বিলের 200 টাকার মধ্যে মিলেছে — তাই দ্বিতীয় অর্ডারে ভরসা পেয়েছি।',
    },
    orderQty: 60,
    variantLabel: 'Midnight Black / ENC',
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-06-22',
    photos: [],
    helpfulVotes: 31,
  },
  {
    id: 'rv-6',
    business: 'Comilla Digital',
    district: { en: 'Cumilla', bn: 'কুমিল্লা' },
    rating: 4,
    body: {
      en: 'Solid. One request: publish the carton dimensions before checkout — I arrange my own pickup and had to ask over chat.',
      bn: 'ভালো। একটি অনুরোধ: চেকআউটের আগে কার্টনের মাপ দিন — আমি নিজে পিকআপ করি, চ্যাটে জিজ্ঞেস করতে হয়েছিল।',
    },
    orderQty: 150,
    variantLabel: 'Cloud White / ENC',
    verified: true,
    repeatBuyer: false,
    createdAt: '2026-06-09',
    photos: [],
    helpfulVotes: 6,
  },
];

/** Derived, never hand-written — the aggregate must agree with the list. */
function aggregate(reviews: Review[]): RatingAggregate | null {
  if (reviews.length === 0) return null;
  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let sum = 0;
  for (const r of reviews) {
    distribution[r.rating - 1] += 1;
    sum += r.rating;
  }
  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    total: reviews.length,
    distribution,
    verifiedCount: reviews.filter((r) => r.verified).length,
    withPhotosCount: reviews.filter((r) => r.photos.length > 0).length,
    repeatBuyerCount: reviews.filter((r) => r.repeatBuyer).length,
  };
}

/* ----------------------------------------------------------------- products */

const EARBUDS: Product = {
  id: 'p-earbuds',
  slug: 'tws-earbuds-pro-x',
  title: {
    en: 'TWS Earbuds Pro X — ENC dual-mic, wireless charging case',
    bn: 'TWS ইয়ারবাড প্রো এক্স — ENC ডুয়াল মাইক, ওয়্যারলেস চার্জিং কেস',
  },
  shortDescription: {
    en: 'Bluetooth 5.3 true-wireless earbuds with dual-mic environmental noise cancellation, 30-hour total playtime and a wireless-charge case. Retail-boxed, ready for resale.',
    bn: 'ব্লুটুথ 5.3 ট্রু-ওয়্যারলেস ইয়ারবাড, ডুয়াল-মাইক ENC, মোট 30 ঘণ্টা প্লেটাইম ও ওয়্যারলেস চার্জিং কেস। রিটেইল বক্সে, পুনঃবিক্রয়ের জন্য প্রস্তুত।',
  },
  sku: 'AB-9241',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Earphones & Headsets', bn: 'ইয়ারফোন ও হেডসেট' },
    slug: 'earphones-headsets',
    parent: { name: { en: 'Consumer Electronics', bn: 'কনজিউমার ইলেকট্রনিক্স' }, slug: 'electronics' },
  },

  media: [
    {
      kind: 'studio',
      src: '/media/earbuds-01.png',
      width: 1200,
      height: 1200,
      alt: {
        en: 'TWS Earbuds Pro X charging case, closed, front view with charging indicator lit',
        bn: 'TWS ইয়ারবাড প্রো এক্স চার্জিং কেস, বন্ধ অবস্থায় সামনে থেকে',
      },
      capturedAt: '2026-08-12',
    },
    {
      kind: 'studio',
      src: '/media/earbuds-02.png',
      width: 1200,
      height: 1200,
      alt: {
        en: 'Charging case at three-quarter angle beside a single earbud',
        bn: 'একটি ইয়ারবাডের পাশে চার্জিং কেস, তিন-চতুর্থাংশ কোণে',
      },
      capturedAt: '2026-08-12',
    },
    {
      kind: 'video',
      src: '/media/earbuds-poster.png',
      poster: '/media/earbuds-poster.png',
      width: 1200,
      height: 1200,
      alt: {
        en: 'Product video: pairing, case fit and charging indicator walkthrough',
        bn: 'পণ্যের ভিডিও: পেয়ারিং, কেস ফিট ও চার্জিং ইন্ডিকেটর',
      },
    },
    {
      kind: 'studio',
      src: '/media/earbuds-03.png',
      width: 1200,
      height: 1200,
      alt: {
        en: 'Case open with both earbuds seated in their charging cradles',
        bn: 'কেস খোলা, দুটি ইয়ারবাড চার্জিং ক্র্যাডলে বসানো',
      },
      capturedAt: '2026-08-12',
    },
    {
      kind: 'studio',
      src: '/media/earbuds-04.png',
      width: 1200,
      height: 1200,
      alt: {
        en: 'Cloud White colourway, front view',
        bn: 'ক্লাউড হোয়াইট রঙ, সামনে থেকে',
      },
      capturedAt: '2026-07-19',
    },
    {
      kind: 'supplier',
      src: '/media/earbuds-05.png',
      width: 1200,
      height: 1200,
      alt: {
        en: 'Close inspection of the case hinge and lid seam finish',
        bn: 'কেসের হিঞ্জ ও লিড সিমের ফিনিশিং কাছ থেকে',
      },
      capturedAt: '2026-06-30',
    },
    {
      kind: 'studio',
      src: '/media/earbuds-06.png',
      width: 1200,
      height: 1200,
      alt: {
        en: 'Export carton of 100 units with consignment label',
        bn: '100 ইউনিটের এক্সপোর্ট কার্টন, কনসাইনমেন্ট লেবেলসহ',
      },
      capturedAt: '2026-08-12',
    },
  ],

  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 50, unitPrice: 50_000 },
      { minQty: 100, unitPrice: 47_000 },
      { minQty: 200, unitPrice: 45_200 },
      { minQty: 500, unitPrice: 44_000 },
    ],
    moq: 50,
    moqStep: 10,
    priceOnRequest: false,
    samplePrice: 65_000,
    sampleQty: 1,
  },

  // Colour x Version, not colour x size: a wholesale electronics listing varies
  // by specification tier, and the ANC build genuinely costs more per unit.
  variantAxes: ['Colour', 'Version'],
  variants: [
    { id: 'v-blk-enc', sku: 'AB-9241-BK-E', attributes: { Colour: 'Midnight Black', Version: 'ENC' }, stock: 240 },
    {
      id: 'v-blk-anc',
      sku: 'AB-9241-BK-A',
      attributes: { Colour: 'Midnight Black', Version: 'ANC' },
      stock: 96,
      priceDelta: 4_000,
    },
    { id: 'v-wht-enc', sku: 'AB-9241-WH-E', attributes: { Colour: 'Cloud White', Version: 'ENC' }, stock: 180 },
    {
      id: 'v-wht-anc',
      sku: 'AB-9241-WH-A',
      attributes: { Colour: 'Cloud White', Version: 'ANC' },
      stock: 12,
      incoming: { qty: 240, days: 12 },
      priceDelta: 4_000,
    },
    { id: 'v-blu-enc', sku: 'AB-9241-BL-E', attributes: { Colour: 'Sky Blue', Version: 'ENC' }, stock: 64 },
    {
      id: 'v-blu-anc',
      sku: 'AB-9241-BL-A',
      attributes: { Colour: 'Sky Blue', Version: 'ANC' },
      stock: 0,
      incoming: { qty: 180, days: 14 },
      priceDelta: 4_000,
    },
  ],

  specifications: [
    { group: 'general', label: { en: 'Brand', bn: 'ব্র্যান্ড' }, value: { en: 'Aukey OEM' }, key: true },
    { group: 'general', label: { en: 'Model', bn: 'মডেল' }, value: { en: 'AB-9241 / TWS-ProX' } },
    { group: 'general', label: { en: 'Origin', bn: 'উৎপত্তি' }, value: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' }, key: true },
    { group: 'general', label: { en: 'HS code', bn: 'এইচএস কোড' }, value: { en: '8518.30.00' } },
    { group: 'general', label: { en: 'Colours', bn: 'রঙ' }, value: { en: 'Midnight Black, Cloud White, Sky Blue', bn: 'মিডনাইট ব্ল্যাক, ক্লাউড হোয়াইট, স্কাই ব্লু' } },

    { group: 'technical', label: { en: 'Bluetooth', bn: 'ব্লুটুথ' }, value: { en: '5.3, 10 m range' }, key: true },
    { group: 'technical', label: { en: 'Battery', bn: 'ব্যাটারি' }, value: { en: '40 mAh bud + 400 mAh case' }, key: true },
    { group: 'technical', label: { en: 'Playtime', bn: 'প্লেটাইম' }, value: { en: '6 h bud, 30 h with case', bn: '6 ঘণ্টা বাড, কেসসহ 30 ঘণ্টা' } },
    { group: 'technical', label: { en: 'Driver', bn: 'ড্রাইভার' }, value: { en: '13 mm dynamic, PET diaphragm' } },
    { group: 'technical', label: { en: 'Microphone', bn: 'মাইক্রোফোন' }, value: { en: 'Dual-mic ENC (ANC on Version A)' } },
    { group: 'technical', label: { en: 'Water rating', bn: 'ওয়াটার রেটিং' }, value: { en: 'IPX5 (buds only)' } },
    { group: 'technical', label: { en: 'Charging', bn: 'চার্জিং' }, value: { en: 'USB-C, 2 h full · Qi wireless 3 h' } },
    { group: 'technical', label: { en: 'Chipset', bn: 'চিপসেট' }, value: { en: 'JL AC6983D4' } },

    { group: 'packaging', label: { en: 'Retail packaging', bn: 'রিটেইল প্যাকেজিং' }, value: { en: 'Printed box, blister insert, USB-C cable, 3 ear-tip sizes', bn: 'প্রিন্টেড বক্স, ব্লিস্টার, USB-C কেবল, 3 মাপের ইয়ার-টিপ' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '100 pcs', bn: '100 পিস' }, key: true },
    { group: 'packaging', label: { en: 'Carton dimensions', bn: 'কার্টনের মাপ' }, value: { en: '42 × 32 × 28 cm' } },
    { group: 'packaging', label: { en: 'Gross weight', bn: 'গ্রস ওজন' }, value: { en: '10.5 kg per carton' } },
    { group: 'packaging', label: { en: 'Units per pallet', bn: 'প্রতি প্যালেটে' }, value: { en: '1,200 pcs' } },

    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '50 pcs, in multiples of 10', bn: '50 পিস, 10-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 3 days from local stock', bn: 'স্থানীয় স্টক থেকে 3 দিনে' }, key: true },
    { group: 'trade', label: { en: 'Sample', bn: 'স্যাম্পল' }, value: { en: '৳650 for 1 pc, credited against a 200 pc order', bn: '1 পিস 650 টাকা, 200 পিস অর্ডারে সমন্বয়' } },
    { group: 'trade', label: { en: 'Logo print', bn: 'লোগো প্রিন্ট' }, value: { en: 'From 500 pcs, +৳12/unit, 10-day lead', bn: '500 পিস থেকে, +12 টাকা/ইউনিট, 10 দিন' }, key: true },
    { group: 'trade', label: { en: 'Private label', bn: 'প্রাইভেট লেবেল' }, value: { en: 'From 2,000 pcs — box, insert and manual', bn: '2,000 পিস থেকে — বক্স, ইনসার্ট ও ম্যানুয়াল' } },
    { group: 'trade', label: { en: 'Warranty', bn: 'ওয়ারেন্টি' }, value: { en: '6 months, seller-handled replacement', bn: '6 মাস, বিক্রেতার মাধ্যমে রিপ্লেসমেন্ট' }, key: true },
    { group: 'trade', label: { en: 'Payment terms', bn: 'পেমেন্ট শর্ত' }, value: { en: 'Full payment to escrow; 50% advance available above 1,000 pcs', bn: 'এসক্রোতে সম্পূর্ণ পেমেন্ট; 1,000 পিসের বেশিতে 50% অগ্রিম' } },

    { group: 'compliance', label: { en: 'Certification', bn: 'সার্টিফিকেশন' }, value: { en: 'CE, RoHS', bn: 'CE, RoHS' }, key: true, note: { en: 'Certificates verified by ArcB2B on 11 Feb 2026', bn: 'ArcB2B কর্তৃক 11 ফেব্রুয়ারি 2026-এ যাচাইকৃত' } },
    { group: 'compliance', label: { en: 'Battery transport', bn: 'ব্যাটারি পরিবহন' }, value: { en: 'UN38.3 tested, air-freight permitted' } },
    { group: 'compliance', label: { en: 'BTRC', bn: 'বিটিআরসি' }, value: { en: 'Type approval not required for this class', bn: 'এই শ্রেণির জন্য টাইপ অ্যাপ্রুভাল প্রয়োজন নেই' } },
  ],

  description: [
    {
      type: 'paragraph',
      text: {
        en: 'A retail-ready true-wireless earbud built for the Bangladeshi accessory counter: the specification that sells at the 1,500–2,000 taka shelf price, in a box you can put out without reworking it.',
        bn: 'বাংলাদেশের অ্যাকসেসরিজ কাউন্টারের জন্য তৈরি রিটেইল-রেডি ট্রু-ওয়্যারলেস ইয়ারবাড: 1,500–2,000 টাকার শেলফ প্রাইসে যে স্পেসিফিকেশন বিক্রি হয়, এমন বক্সে যা সরাসরি সাজানো যায়।',
      },
    },
    { type: 'heading', text: { en: 'What sells this at the counter', bn: 'কাউন্টারে কী বিক্রি করায়' } },
    {
      type: 'list',
      items: [
        { en: 'Thirty hours total playtime — the number walk-in customers ask for first.', bn: 'মোট 30 ঘণ্টা প্লেটাইম — ক্রেতারা প্রথমেই এটি জিজ্ঞেস করেন।' },
        { en: 'Wireless charging on the case, which is still uncommon in this price band.', bn: 'কেসে ওয়্যারলেস চার্জিং, যা এই দামে এখনও অসাধারণ।' },
        { en: 'Dual-mic ENC on every unit; the ANC build is a separate SKU for customers who test call quality in-store.', bn: 'প্রতিটি ইউনিটে ডুয়াল-মাইক ENC; ANC আলাদা SKU।' },
        { en: 'Three ear-tip sizes in the box — the single largest cause of returns, removed.', bn: 'বক্সে 3 মাপের ইয়ার-টিপ — রিটার্নের সবচেয়ে বড় কারণ দূর।' },
      ],
    },
    {
      type: 'image',
      src: '/media/earbuds-03.png',
      width: 1200,
      height: 1200,
      caption: {
        en: 'Both buds seat magnetically; the cradle contacts are gold-plated on this batch.',
        bn: 'দুটি বাডই ম্যাগনেটিকভাবে বসে; এই ব্যাচে ক্র্যাডলের কন্টাক্ট গোল্ড-প্লেটেড।',
      },
    },
    { type: 'heading', text: { en: 'Packaging and branding', bn: 'প্যাকেজিং ও ব্র্যান্ডিং' } },
    {
      type: 'paragraph',
      text: {
        en: 'Units ship in printed retail boxes, 100 to an export carton. Logo printing on the box is available from 500 pieces at ৳12 per unit with a ten-day lead time; full private label — box, insert and manual under your own brand — starts at 2,000 pieces. Send artwork as vector with the quote request and the factory will return a proof before production.',
        bn: 'ইউনিটগুলো প্রিন্টেড রিটেইল বক্সে আসে, এক্সপোর্ট কার্টনে 100টি। বক্সে লোগো প্রিন্ট 500 পিস থেকে, প্রতি ইউনিট 12 টাকা, 10 দিনের লিড টাইম; সম্পূর্ণ প্রাইভেট লেবেল — বক্স, ইনসার্ট ও ম্যানুয়াল আপনার ব্র্যান্ডে — 2,000 পিস থেকে। কোট অনুরোধের সঙ্গে ভেক্টর আর্টওয়ার্ক দিলে ফ্যাক্টরি উৎপাদনের আগে প্রুফ পাঠাবে।',
      },
    },
    {
      type: 'image',
      src: '/media/earbuds-06.png',
      width: 1200,
      height: 1200,
      caption: {
        en: 'Export carton, 100 pieces, 10.5 kg gross — five cartons to a 500-piece order.',
        bn: 'এক্সপোর্ট কার্টন, 100 পিস, গ্রস 10.5 কেজি — 500 পিসের অর্ডারে 5 কার্টন।',
      },
    },
    { type: 'heading', text: { en: 'Quality control', bn: 'কোয়ালিটি কন্ট্রোল' } },
    {
      type: 'paragraph',
      text: {
        en: 'Every carton is sample-tested on arrival in Dhaka: pairing, both microphones, case charge cycle and lid retention. Batch references are printed on the carton label so a dispute can be traced to a production run rather than argued in the abstract.',
        bn: 'ঢাকায় পৌঁছানোর পর প্রতিটি কার্টন স্যাম্পল-টেস্ট করা হয়: পেয়ারিং, দুটি মাইক্রোফোন, কেসের চার্জ সাইকেল ও লিড রিটেনশন। কার্টন লেবেলে ব্যাচ রেফারেন্স ছাপা থাকে, যাতে কোনও ডিসপিউট নির্দিষ্ট প্রোডাকশন রানে চিহ্নিত করা যায়।',
      },
    },
  ],

  logistics: {
    weightGrams: 105,
    cartonQty: 100,
    cartonDims: '42 × 32 × 28 cm',
    unitsPerPallet: 1200,
    leadTimeDays: 3,
  },

  customisation: {
    logoPrintMoq: 500,
    customPackagingMoq: 1000,
    privateLabelMoq: 2000,
  },

  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Guangzhou Lianhe Electronics',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 6,
    verified: true,
  },

  rating: aggregate(EARBUD_REVIEWS),
  reviews: EARBUD_REVIEWS,
  stats: { views: 18_420, ordersPlaced: 2_340 },
  tags: [
    { en: 'Best seller', bn: 'বেস্ট সেলার' },
    { en: 'Retail-boxed', bn: 'রিটেইল বক্স' },
  ],
  publishedAt: '2026-03-14',
};

const KURTI: Product = {
  id: 'p-kurti',
  slug: 'kurti-cotton-block-print',
  title: {
    en: 'Hand block-print cotton kurti — 140 GSM, straight cut',
    bn: 'হ্যান্ড ব্লক-প্রিন্ট কটন কুর্তি — 140 জিএসএম, স্ট্রেট কাট',
  },
  shortDescription: {
    en: 'Narsingdi-woven 140 GSM cotton, hand block-printed in a single-colour geometric repeat. Straight cut, side slits, unlined. Made to order in your size ratio.',
    bn: 'নরসিংদীতে বোনা 140 জিএসএম কটন, এক রঙের জিওমেট্রিক রিপিটে হ্যান্ড ব্লক-প্রিন্ট। স্ট্রেট কাট, সাইড স্লিট, আনলাইনড। আপনার সাইজ অনুপাতে তৈরি।',
  },
  sku: 'MT-4417',
  status: 'active',
  source: 'manual',
  category: {
    name: { en: "Women's Kurti & Tunics", bn: 'কুর্তি ও টিউনিক' },
    slug: 'kurti-tunics',
    parent: { name: { en: 'Apparel', bn: 'পোশাক' }, slug: 'apparel' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/kurti-01.png',
      width: 1200,
      height: 1200,
      alt: { en: 'Teal block-print cotton kurti, straight cut, front view', bn: 'টিল ব্লক-প্রিন্ট কটন কুর্তি, সামনে থেকে' },
      capturedAt: '2026-08-02',
    },
    {
      kind: 'studio',
      src: '/media/kurti-02.png',
      width: 1200,
      height: 1200,
      alt: { en: 'Close view of the hand block-print repeat and fabric weave', bn: 'হ্যান্ড ব্লক-প্রিন্ট ও কাপড়ের বুনন কাছ থেকে' },
      capturedAt: '2026-08-02',
    },
    {
      kind: 'supplier',
      src: '/media/kurti-03.png',
      width: 1200,
      height: 1200,
      alt: { en: 'Packed carton of 50 pieces ready for dispatch', bn: '50 পিসের কার্টন, পাঠানোর জন্য প্রস্তুত' },
      capturedAt: '2026-07-21',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 30, unitPrice: 48_000 },
      { minQty: 60, unitPrice: 44_500 },
      { minQty: 150, unitPrice: 41_000 },
      { minQty: 300, unitPrice: 38_500 },
    ],
    moq: 30,
    moqStep: 6,
    priceOnRequest: false,
    samplePrice: 58_000,
    sampleQty: 1,
  },
  variantAxes: ['Colour', 'Size'],
  variants: [
    { id: 'k-teal-s', sku: 'MT-4417-TL-S', attributes: { Colour: 'Deep Teal', Size: 'S' }, stock: 0, incoming: { qty: 120, days: 18 } },
    { id: 'k-teal-m', sku: 'MT-4417-TL-M', attributes: { Colour: 'Deep Teal', Size: 'M' }, stock: 18, incoming: { qty: 200, days: 18 } },
    { id: 'k-teal-l', sku: 'MT-4417-TL-L', attributes: { Colour: 'Deep Teal', Size: 'L' }, stock: 24, incoming: { qty: 200, days: 18 } },
    { id: 'k-teal-xl', sku: 'MT-4417-TL-XL', attributes: { Colour: 'Deep Teal', Size: 'XL' }, stock: 0, incoming: { qty: 90, days: 18 } },
    { id: 'k-indigo-s', sku: 'MT-4417-IN-S', attributes: { Colour: 'Indigo', Size: 'S' }, stock: 0, incoming: { qty: 100, days: 22 } },
    { id: 'k-indigo-m', sku: 'MT-4417-IN-M', attributes: { Colour: 'Indigo', Size: 'M' }, stock: 12, incoming: { qty: 180, days: 22 } },
    { id: 'k-indigo-l', sku: 'MT-4417-IN-L', attributes: { Colour: 'Indigo', Size: 'L' }, stock: 6, incoming: { qty: 180, days: 22 } },
    { id: 'k-indigo-xl', sku: 'MT-4417-IN-XL', attributes: { Colour: 'Indigo', Size: 'XL' }, stock: 0, incoming: { qty: 80, days: 22 } },
  ],
  specifications: [
    { group: 'general', label: { en: 'Brand', bn: 'ব্র্যান্ড' }, value: { en: 'Meghna (unbranded, label-ready)', bn: 'মেঘনা (আনব্র্যান্ডেড)' }, key: true },
    { group: 'general', label: { en: 'Origin', bn: 'উৎপত্তি' }, value: { en: 'Narsingdi, Bangladesh', bn: 'নরসিংদী, বাংলাদেশ' }, key: true },
    { group: 'general', label: { en: 'HS code', bn: 'এইচএস কোড' }, value: { en: '6206.30.00' } },
    { group: 'technical', label: { en: 'Fabric', bn: 'কাপড়' }, value: { en: '100% cotton, 140 GSM', bn: '100% কটন, 140 জিএসএম' }, key: true },
    { group: 'technical', label: { en: 'Print', bn: 'প্রিন্ট' }, value: { en: 'Hand block, single colour, azo-free dye', bn: 'হ্যান্ড ব্লক, এক রঙ, অ্যাজো-মুক্ত ডাই' }, key: true },
    { group: 'technical', label: { en: 'Cut', bn: 'কাট' }, value: { en: 'Straight, side slits, unlined' } },
    { group: 'technical', label: { en: 'Sizes', bn: 'সাইজ' }, value: { en: 'S / M / L / XL', bn: 'S / M / L / XL' }, key: true },
    { group: 'technical', label: { en: 'Shrinkage', bn: 'শ্রিংকেজ' }, value: { en: 'Pre-washed, under 3%', bn: 'প্রি-ওয়াশড, 3%-এর কম' } },
    { group: 'packaging', label: { en: 'Packaging', bn: 'প্যাকেজিং' }, value: { en: 'Individual poly bag, size-stickered', bn: 'আলাদা পলি ব্যাগ, সাইজ স্টিকারসহ' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '50 pcs', bn: '50 পিস' }, key: true },
    { group: 'packaging', label: { en: 'Carton dimensions', bn: 'কার্টনের মাপ' }, value: { en: '60 × 40 × 35 cm' } },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '30 pcs, in multiples of 6', bn: '30 পিস, 6-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: '18–22 days after payment confirmation', bn: 'পেমেন্ট নিশ্চিত হওয়ার 18–22 দিন পর' }, key: true },
    { group: 'trade', label: { en: 'Size ratio', bn: 'সাইজ অনুপাত' }, value: { en: 'Your ratio, entered in the mix grid', bn: 'আপনার অনুপাত, মিক্স গ্রিডে দিন' } },
    { group: 'trade', label: { en: 'Custom label', bn: 'কাস্টম লেবেল' }, value: { en: 'Woven neck label from 300 pcs', bn: '300 পিস থেকে ওভেন নেক লেবেল' } },
    { group: 'compliance', label: { en: 'Certification', bn: 'সার্টিফিকেশন' }, value: { en: 'OEKO-TEX Standard 100' }, key: true, note: { en: 'Certificate verified 28 Jan 2026', bn: '28 জানুয়ারি 2026-এ যাচাইকৃত' } },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Cut and printed to order in Narsingdi. You choose the size ratio; the workshop cuts to it rather than shipping a fixed pack, which is the difference between a rail that sells through and one that leaves you with XL.',
        bn: 'নরসিংদীতে অর্ডার অনুযায়ী কাটা ও প্রিন্ট করা। আপনি সাইজ অনুপাত ঠিক করেন; ওয়ার্কশপ সেই অনুযায়ী কাটে, নির্দিষ্ট প্যাক পাঠায় না — এটাই বিক্রি হয়ে যাওয়া আর XL পড়ে থাকার মধ্যে পার্থক্য।',
      },
    },
    {
      type: 'paragraph',
      text: {
        en: 'Hand block printing means a small, honest amount of variation between pieces — registration shifts by a millimetre or two and the dye takes slightly differently across a run. That is the look buyers are paying for; it is not a defect and is not grounds for a dispute.',
        bn: 'হ্যান্ড ব্লক প্রিন্টে পিস-টু-পিস সামান্য পার্থক্য স্বাভাবিক — রেজিস্ট্রেশন এক-দুই মিলিমিটার সরে যায়, ডাইও কিছুটা ভিন্নভাবে বসে। ক্রেতারা এই লুকের জন্যই দাম দেন; এটি ত্রুটি নয় এবং ডিসপিউটের কারণ নয়।',
      },
    },
  ],
  logistics: {
    weightGrams: 220,
    cartonQty: 50,
    cartonDims: '60 × 40 × 35 cm',
    leadTimeDays: 18,
    sourcingDays: [18, 22],
  },
  customisation: { privateLabelMoq: 300 },
  seller: MEGHNA_TEXTILES,
  rating: {
    average: 4.4,
    total: 37,
    distribution: [1, 1, 4, 9, 22],
    verifiedCount: 34,
    withPhotosCount: 11,
    repeatBuyerCount: 14,
  },
  reviews: [],
  stats: { views: 6_180, ordersPlaced: 412 },
  tags: [{ en: 'Made in Bangladesh', bn: 'বাংলাদেশে তৈরি' }],
  publishedAt: '2026-05-02',
};

const LED_PANEL: Product = {
  id: 'p-led',
  slug: 'led-panel-light-18w',
  title: {
    en: 'LED round panel light 18W — recessed, driver included',
    bn: 'এলইডি রাউন্ড প্যানেল লাইট 18ওয়াট — রিসেসড, ড্রাইভারসহ',
  },
  shortDescription: {
    en: 'Aluminium-backed 18W recessed panel, 6500K, with isolated driver. Priced per project — volume, colour temperature and driver grade all move the number.',
    bn: 'অ্যালুমিনিয়াম-ব্যাকড 18ওয়াট রিসেসড প্যানেল, 6500কে, আইসোলেটেড ড্রাইভারসহ। প্রকল্প অনুযায়ী মূল্য।',
  },
  sku: 'AB-3310',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Ceiling & Panel Lights', bn: 'সিলিং ও প্যানেল লাইট' },
    slug: 'panel-lights',
    parent: { name: { en: 'Lighting', bn: 'লাইটিং' }, slug: 'lighting' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/led-01.png',
      width: 1200,
      height: 1200,
      alt: { en: '18W round LED panel, lit, front view', bn: '18ওয়াট রাউন্ড এলইডি প্যানেল, জ্বালানো' },
      capturedAt: '2026-07-11',
    },
    {
      kind: 'supplier',
      src: '/media/led-02.png',
      width: 1200,
      height: 1200,
      alt: { en: 'Close view of the diffuser edge and bezel finish', bn: 'ডিফিউজার প্রান্ত ও বেজেল ফিনিশ কাছ থেকে' },
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    // Deliberately empty: driver grade and colour temperature move the unit cost
    // enough that a published ladder would be misleading. This is the state that
    // makes RFQ the primary action.
    tiers: [],
    moq: 200,
    moqStep: 20,
    priceOnRequest: true,
  },
  variantAxes: ['Colour temperature'],
  variants: [
    { id: 'l-6500', sku: 'AB-3310-65', attributes: { 'Colour temperature': '6500K daylight' }, stock: 1_400 },
    { id: 'l-4000', sku: 'AB-3310-40', attributes: { 'Colour temperature': '4000K neutral' }, stock: 620 },
    { id: 'l-3000', sku: 'AB-3310-30', attributes: { 'Colour temperature': '3000K warm' }, stock: 0, incoming: { qty: 800, days: 16 } },
  ],
  specifications: [
    { group: 'general', label: { en: 'Brand', bn: 'ব্র্যান্ড' }, value: { en: 'OEM' }, key: true },
    { group: 'general', label: { en: 'Origin', bn: 'উৎপত্তি' }, value: { en: 'Zhongshan, China', bn: 'ঝংশান, চীন' } },
    { group: 'technical', label: { en: 'Power', bn: 'পাওয়ার' }, value: { en: '18 W' }, key: true },
    { group: 'technical', label: { en: 'Luminous flux', bn: 'লুমিনাস ফ্লাক্স' }, value: { en: '1,620 lm (90 lm/W)' }, key: true },
    { group: 'technical', label: { en: 'Input', bn: 'ইনপুট' }, value: { en: '165–265 V AC, 50/60 Hz' } },
    { group: 'technical', label: { en: 'Cut-out', bn: 'কাট-আউট' }, value: { en: '205 mm', bn: '205 মিমি' } },
    { group: 'technical', label: { en: 'Driver', bn: 'ড্রাইভার' }, value: { en: 'Isolated, 30,000 h rated' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '40 pcs', bn: '40 পিস' }, key: true },
    { group: 'packaging', label: { en: 'Carton dimensions', bn: 'কার্টনের মাপ' }, value: { en: '46 × 46 × 30 cm' } },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '200 pcs, in multiples of 20', bn: '200 পিস, 20-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Pricing', bn: 'মূল্য' }, value: { en: 'Quoted per project — driver grade and colour temperature move the unit cost', bn: 'প্রকল্প অনুযায়ী — ড্রাইভার গ্রেড ও কালার টেম্পারেচারে দাম বদলায়' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: '16–20 days after payment confirmation' } },
    { group: 'compliance', label: { en: 'Certification', bn: 'সার্টিফিকেশন' }, value: { en: 'CE, RoHS' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Specified for contract work rather than shelf sale. Tell us the quantity, the colour temperature split and whether the site needs an isolated driver, and we will quote against your actual bill of quantities.',
        bn: 'শেলফ বিক্রির চেয়ে কনট্রাক্ট কাজের জন্য। পরিমাণ, কালার টেম্পারেচারের ভাগ এবং সাইটে আইসোলেটেড ড্রাইভার দরকার কিনা জানান — আপনার বিল অফ কোয়ান্টিটি ধরে কোট দেওয়া হবে।',
      },
    },
  ],
  logistics: { weightGrams: 340, cartonQty: 40, cartonDims: '46 × 46 × 30 cm', leadTimeDays: 16, sourcingDays: [16, 20] },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Zhongshan Guangyi Lighting',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 9,
    verified: true,
  },
  rating: null,
  reviews: [],
  stats: { views: 2_940, ordersPlaced: 68 },
  tags: [{ en: 'Project pricing', bn: 'প্রকল্প মূল্য' }],
  publishedAt: '2026-06-19',
};

const PHONE_CASE: Product = {
  id: 'p-case',
  slug: 'phone-case-tpu-clear',
  title: {
    en: 'Clear TPU phone case — anti-yellow, camera lip',
    bn: 'ক্লিয়ার TPU ফোন কেস — অ্যান্টি-ইয়েলো, ক্যামেরা লিপ',
  },
  shortDescription: {
    en: '1.5 mm anti-yellowing TPU with a raised camera lip and reinforced corners. Stocked for the twelve highest-turnover handset models in Bangladesh.',
    bn: '1.5 মিমি অ্যান্টি-ইয়েলোয়িং TPU, উঁচু ক্যামেরা লিপ ও শক্ত কর্নার। বাংলাদেশে সবচেয়ে বেশি বিক্রি হওয়া 12টি হ্যান্ডসেট মডেলের জন্য স্টকে।',
  },
  sku: 'AB-1180',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Phone Cases', bn: 'ফোন কেস' },
    slug: 'phone-cases',
    parent: { name: { en: 'Mobile Accessories', bn: 'মোবাইল অ্যাকসেসরিজ' }, slug: 'mobile-accessories' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/case-01.png',
      width: 1200,
      height: 1200,
      alt: { en: 'Clear TPU phone case, rear view showing camera cut-out', bn: 'ক্লিয়ার TPU ফোন কেস, পিছন থেকে' },
      capturedAt: '2026-08-05',
    },
    {
      kind: 'studio',
      src: '/media/case-02.png',
      width: 1200,
      height: 1200,
      alt: { en: 'Case at an angle showing the raised camera lip', bn: 'কোণ থেকে উঁচু ক্যামেরা লিপ' },
      capturedAt: '2026-08-05',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 100, unitPrice: 5_500 },
      { minQty: 500, unitPrice: 4_800 },
      { minQty: 1_000, unitPrice: 4_200 },
    ],
    moq: 100,
    moqStep: 50,
    priceOnRequest: false,
  },
  variantAxes: ['Model'],
  variants: [
    { id: 'c-a15', sku: 'AB-1180-A15', attributes: { Model: 'Galaxy A15' }, stock: 1_800 },
    { id: 'c-a25', sku: 'AB-1180-A25', attributes: { Model: 'Galaxy A25' }, stock: 1_200 },
    { id: 'c-redmi13', sku: 'AB-1180-R13', attributes: { Model: 'Redmi 13C' }, stock: 2_400 },
    { id: 'c-15a', sku: 'AB-1180-I15', attributes: { Model: 'iPhone 15' }, stock: 640 },
    { id: 'c-realme', sku: 'AB-1180-RC5', attributes: { Model: 'Realme C55' }, stock: 18 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Material', bn: 'ম্যাটেরিয়াল' }, value: { en: 'TPU, 1.5 mm, anti-yellowing' }, key: true },
    { group: 'general', label: { en: 'Origin', bn: 'উৎপত্তি' }, value: { en: 'Guangdong, China' } },
    { group: 'technical', label: { en: 'Camera lip', bn: 'ক্যামেরা লিপ' }, value: { en: '1.2 mm raised' }, key: true },
    { group: 'technical', label: { en: 'Corners', bn: 'কর্নার' }, value: { en: 'Reinforced, 1.2 m drop tested' }, key: true },
    { group: 'packaging', label: { en: 'Packaging', bn: 'প্যাকেজিং' }, value: { en: 'Individual poly bag' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '500 pcs' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '100 pcs, in multiples of 50' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships next day from Dhaka stock', bn: 'ঢাকা স্টক থেকে পরদিন' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'The accessory that pays the rent. Stocked only for handsets with real turnover in Bangladesh, so you are not holding cases for phones nobody walks in with.',
        bn: 'যে অ্যাকসেসরি দোকান চালায়। কেবল বাংলাদেশে প্রকৃত চাহিদা আছে এমন হ্যান্ডসেটের জন্যই স্টক রাখা হয়।',
      },
    },
  ],
  logistics: { weightGrams: 28, cartonQty: 500, cartonDims: '50 × 40 × 40 cm', leadTimeDays: 0 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Dongguan Prime Moulding',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 4,
    verified: true,
  },
  // No reviews at all — this is the honest empty state, not a default 4.6.
  rating: null,
  reviews: [],
  stats: { views: 9_760, ordersPlaced: 1_180 },
  tags: [{ en: 'Ships next day', bn: 'পরদিন ডেলিভারি' }],
  publishedAt: '2026-07-28',
};

const SPEAKER: Product = {
  id: 'p-speaker',
  slug: 'bt-speaker-mini-x2',
  title: {
    en: 'Mini Bluetooth speaker X2 — 5W, TWS pairing',
    bn: 'মিনি ব্লুটুথ স্পিকার এক্স2 — 5ওয়াট, TWS পেয়ারিং',
  },
  shortDescription: {
    en: '5W mono speaker with TWS pairing and a 1200 mAh cell. Currently out of stock with no confirmed inbound shipment.',
    bn: '5ওয়াট মনো স্পিকার, TWS পেয়ারিং ও 1200 এমএএইচ সেল। বর্তমানে স্টকে নেই।',
  },
  sku: 'AB-7702',
  status: 'out_of_stock',
  source: '1688',
  category: {
    name: { en: 'Bluetooth Speakers', bn: 'ব্লুটুথ স্পিকার' },
    slug: 'bluetooth-speakers',
    parent: { name: { en: 'Consumer Electronics', bn: 'কনজিউমার ইলেকট্রনিক্স' }, slug: 'electronics' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-speaker.png',
      width: 800,
      height: 800,
      alt: { en: 'Mini Bluetooth speaker X2, front view', bn: 'মিনি ব্লুটুথ স্পিকার এক্স2' },
      capturedAt: '2026-05-14',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 50, unitPrice: 38_000 },
      { minQty: 200, unitPrice: 34_500 },
    ],
    moq: 50,
    moqStep: 10,
    priceOnRequest: false,
  },
  variantAxes: ['Colour'],
  variants: [
    { id: 's-blk', sku: 'AB-7702-BK', attributes: { Colour: 'Black' }, stock: 0 },
    { id: 's-red', sku: 'AB-7702-RD', attributes: { Colour: 'Red' }, stock: 0 },
  ],
  specifications: [
    { group: 'technical', label: { en: 'Output', bn: 'আউটপুট' }, value: { en: '5 W mono' }, key: true },
    { group: 'technical', label: { en: 'Battery', bn: 'ব্যাটারি' }, value: { en: '1,200 mAh, 8 h playtime' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '50 pcs' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'This line is between shipments. The listing stays up so you can request a quote against the next production run, or compare it with what is in stock.',
        bn: 'এই লাইনটি দুই শিপমেন্টের মাঝে। লিস্টিং রাখা হয়েছে যাতে পরবর্তী প্রোডাকশন রানের জন্য কোট চাইতে পারেন।',
      },
    },
  ],
  logistics: { weightGrams: 260, cartonQty: 60, cartonDims: '48 × 36 × 32 cm', leadTimeDays: 0 },
  seller: RIDDHI_IMPORTS,
  rating: null,
  reviews: [],
  stats: { views: 1_120, ordersPlaced: 84 },
  tags: [],
  publishedAt: '2026-04-30',
};

export const PRODUCTS: Product[] = [EARBUDS, KURTI, LED_PANEL, PHONE_CASE, SPEAKER];

/* -------------------------------------------------------------------- cards */

function toCard(p: Product): ProductCard {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    image: p.media.find((m) => m.kind !== 'video')?.src ?? '/media/card-packaging.png',
    unit: p.pricing.unit,
    tiers: p.pricing.tiers,
    moq: p.pricing.moq,
    rating: p.rating?.average ?? null,
    reviewCount: p.rating?.total ?? 0,
    ordersPlaced: p.stats.ordersPlaced,
    source: p.source,
    leadTimeDays: p.logistics.leadTimeDays,
    madeToOrder: p.logistics.sourcingDays !== undefined,
    sellerName: p.seller.name,
    categorySlug: p.category.slug,
  };
}

/** Extra cards so the rails are not just the five detailed products. */
const EXTRA_CARDS: ProductCard[] = [
  {
    id: 'x-cable',
    slug: 'usb-c-braided-cable-1m',
    title: { en: 'Braided USB-C cable 1 m — 3A fast charge', bn: 'ব্রেইডেড USB-C কেবল 1 মিটার — 3এ ফাস্ট চার্জ' },
    image: '/media/card-cable.png',
    unit: 'pc',
    tiers: [
      { minQty: 100, unitPrice: 6_500 },
      { minQty: 500, unitPrice: 5_600 },
      { minQty: 1_000, unitPrice: 4_900 },
    ],
    moq: 100,
    rating: 4.5,
    reviewCount: 64,
    ordersPlaced: 3_210,
    source: '1688',
    leadTimeDays: 0,
    madeToOrder: false,
    sellerName: 'ArcB2B Sourcing',
    categorySlug: 'cables-connectors',
  },
  {
    id: 'x-packaging',
    slug: 'retail-blister-box-blank',
    title: { en: 'Blank retail blister box — earbud size', bn: 'ব্লাঙ্ক রিটেইল ব্লিস্টার বক্স — ইয়ারবাড সাইজ' },
    image: '/media/card-packaging.png',
    unit: 'pc',
    tiers: [
      { minQty: 200, unitPrice: 1_800 },
      { minQty: 1_000, unitPrice: 1_400 },
    ],
    moq: 200,
    rating: 4.2,
    reviewCount: 18,
    ordersPlaced: 740,
    source: 'manual',
    leadTimeDays: 2,
    madeToOrder: false,
    sellerName: 'Dhaka Pack House',
    categorySlug: 'retail-packaging',
  },
  {
    id: 'x-powerbank',
    slug: 'power-bank-10000mah-slim',
    title: { en: 'Slim power bank 10,000 mAh — 22.5W PD', bn: 'স্লিম পাওয়ার ব্যাংক 10,000 এমএএইচ — 22.5ওয়াট' },
    image: '/media/card-powerbank.png',
    unit: 'pc',
    tiers: [
      { minQty: 30, unitPrice: 88_000 },
      { minQty: 100, unitPrice: 81_000 },
      { minQty: 300, unitPrice: 76_500 },
    ],
    moq: 30,
    rating: 4.6,
    reviewCount: 96,
    ordersPlaced: 1_640,
    source: '1688',
    leadTimeDays: 4,
    madeToOrder: false,
    sellerName: 'ArcB2B Sourcing',
    categorySlug: 'power-banks',
  },
  {
    id: 'x-smartwatch',
    slug: 'smartwatch-fit-s1',
    title: { en: 'Fitness smartwatch S1 — 1.85 in, BT calling', bn: 'ফিটনেস স্মার্টওয়াচ এস1 — 1.85 ইঞ্চি, বিটি কলিং' },
    image: '/media/card-smartwatch.png',
    unit: 'pc',
    tiers: [
      { minQty: 20, unitPrice: 128_000 },
      { minQty: 100, unitPrice: 118_000 },
      { minQty: 250, unitPrice: 112_000 },
    ],
    moq: 20,
    rating: 4.1,
    reviewCount: 52,
    ordersPlaced: 880,
    source: '1688',
    leadTimeDays: 6,
    madeToOrder: false,
    sellerName: 'ArcB2B Sourcing',
    categorySlug: 'smartwatches',
  },
  {
    id: 'x-tripod',
    slug: 'phone-tripod-ring-light',
    title: { en: 'Phone tripod with ring light — 1.6 m', bn: 'ফোন ট্রাইপড ও রিং লাইট — 1.6 মিটার' },
    image: '/media/card-tripod.png',
    unit: 'pc',
    tiers: [
      { minQty: 20, unitPrice: 96_000 },
      { minQty: 100, unitPrice: 87_000 },
    ],
    moq: 20,
    rating: 4.3,
    reviewCount: 29,
    ordersPlaced: 460,
    source: '1688',
    leadTimeDays: 5,
    madeToOrder: false,
    sellerName: 'ArcB2B Sourcing',
    categorySlug: 'selfie-tripods',
  },
];

export const ALL_CARDS: ProductCard[] = [...PRODUCTS.map(toCard), ...EXTRA_CARDS];

/**
 * Curated co-purchase set for the "frequently bought together" rail. In
 * production this comes from order co-occurrence; hard-coding it here keeps the
 * rail honest about being a fixture rather than pretending to be a model.
 */
export const BOUGHT_TOGETHER: Record<string, string[]> = {
  'tws-earbuds-pro-x': ['usb-c-braided-cable-1m', 'retail-blister-box-blank', 'phone-case-tpu-clear'],
  'phone-case-tpu-clear': ['usb-c-braided-cable-1m', 'retail-blister-box-blank'],
  'kurti-cotton-block-print': [],
};

export { ARCB2B_SOURCING, MEGHNA_TEXTILES, RIDDHI_IMPORTS };
