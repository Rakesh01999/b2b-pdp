import type { Product, ProductCard, Seller, Review, RatingAggregate } from '@/lib/types';

/**
 * Sample catalogue. Stands in for `GET /v1/storefront/products/:slug` until the
 * API carries the fields the product page needs (see the design plan's API
 * section: `unit`, `moqStep`, `weightGrams`, `cartonQty`, `priceOnRequest`,
 * grouped specifications, media provenance and a `seller` reference).
 *
 * Twenty-two products, spanning fifteen of the twenty main categories. The
 * first five are chosen to exercise every listing state the CTA resolver can
 * produce, because a page that only ever renders its happy path is a page
 * whose other states are untested:
 *
 *   tws-earbuds-pro-x      in stock, ladder priced, mixed sourced variants
 *   kurti-cotton-block     sourced to order, sold by a marketplace supplier
 *   led-panel-light-18w    price on request  → quote-only
 *   phone-case-tpu-clear   in stock, single axis, no reviews yet
 *   bt-speaker-mini-x2     out of stock, no sourcing route → unavailable
 *
 * The rest exist to make browsing, search, deals and pagination feel like a
 * real catalogue rather than five items reused everywhere — five were
 * previously lightweight cards with no page behind them at all (an unnoticed
 * 404 waiting for anyone who clicked one), and are full listings now. Three
 * sell by a unit other than the piece — fasteners by the kilogram, fabric by
 * the metre, kids' wear by the dozen — the only products in this file that do,
 * exercising a code path the ladder, the matrix and the landed-cost maths had
 * never actually been fed before.
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

/** A local packaging and print supplier — proof the seller block also has to render a small domestic manufacturer, not only importers. */
const DHAKA_PACK_HOUSE: Seller = {
  id: 'seller-dhakapack',
  name: 'Dhaka Pack House',
  kind: 'supplier',
  location: { en: 'Gazipur', bn: 'গাজীপুর' },
  yearsActive: 7,
  skuCount: 94,
  verified: true,
  escrow: true,
  metrics: [
    { key: 'response', value: 92, sampleSize: 156 },
    { key: 'onTime', value: 88, sampleSize: 201 },
    { key: 'reorder', value: 44, sampleSize: 98 },
    { key: 'disputes', value: 100, sampleSize: 11 },
  ],
  certifications: [
    {
      code: 'TRADE-LIC',
      label: { en: 'Trade licence, Gazipur', bn: 'ট্রেড লাইসেন্স, গাজীপুর' },
      documentUrl: '#verified-document',
      verifiedAt: '2026-03-02',
    },
  ],
  storeHref: '/store/dhaka-pack-house',
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

const CABLE_REVIEWS: Review[] = [
  {
    id: 'cb-rv-1',
    business: 'Tongi Mobile Bazar',
    district: { en: 'Gazipur', bn: 'গাজীপুর' },
    rating: 5,
    body: {
      en: 'Every phone-case order I place now includes 500 of these. Margin is thin per piece, but nobody returns a cable that survives daily coiling — and 3A actually charges a power bank properly, not just a phone.',
      bn: 'এখন প্রতিটি ফোন-কেস অর্ডারে 500টি করে নিই। প্রতি পিসে মার্জিন কম, কিন্তু প্রতিদিন গোটানো সহ্য করা কেবল কেউ ফেরত দেয় না — আর 3এ শুধু ফোন নয়, পাওয়ার ব্যাংকও ঠিকমতো চার্জ করে।',
    },
    orderQty: 500,
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-07-22',
    photos: [],
    helpfulVotes: 9,
  },
  {
    id: 'cb-rv-2',
    business: 'Feni Accessories Hub',
    district: { en: 'Feni', bn: 'ফেনী' },
    rating: 4,
    body: {
      en: 'Good cable, but the white colour shows shelf dirt within a week. I only reorder black now.',
      bn: 'কেবল ভালো, তবে সাদা রঙে এক সপ্তাহেই শেলফের ময়লা দেখা যায়। এখন শুধু কালো রঙই আবার নিই।',
    },
    orderQty: 200,
    verified: true,
    repeatBuyer: false,
    createdAt: '2026-06-30',
    photos: [],
    helpfulVotes: 4,
  },
];

const POWERBANK_REVIEWS: Review[] = [
  {
    id: 'pb-rv-1',
    business: 'Rangpur Mobile Zone',
    district: { en: 'Rangpur', bn: 'রংপুর' },
    rating: 5,
    body: {
      en: '22.5W actually charges as fast as the box claims — tested against a phone that supports it. Slim enough that customers do not complain about pocket bulk.',
      bn: '22.5ওয়াট বক্সে লেখা গতিতেই চার্জ করে — সাপোর্ট করে এমন ফোনে টেস্ট করে দেখেছি। এত স্লিম যে পকেটে ভারী লাগে না বলে কোনও অভিযোগ নেই।',
    },
    orderQty: 100,
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-07-15',
    photos: [],
    helpfulVotes: 11,
  },
  {
    id: 'pb-rv-2',
    business: 'Mymensingh Electronics',
    district: { en: 'Mymensingh', bn: 'ময়মনসিংহ' },
    rating: 5,
    body: {
      en: 'Third order. Cell capacity tests close to what is printed — customers are not coming back with the classic "10,000 written, 6,000 real" complaint.',
      bn: 'তৃতীয়বার অর্ডার। সেলের ক্যাপাসিটি লেখার কাছাকাছিই — "লেখা 10,000, আসলে 6,000" এই অভিযোগ নিয়ে কেউ ফিরে আসেনি।',
    },
    orderQty: 300,
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-06-20',
    photos: [],
    helpfulVotes: 14,
  },
  {
    id: 'pb-rv-3',
    business: 'Jashore Gadget Corner',
    district: { en: 'Jashore', bn: 'যশোর' },
    rating: 4,
    body: {
      en: 'Solid unit. Box says 22.5W but only the newest phones actually pull that rate — worth explaining to customers so they do not expect it on an older handset.',
      bn: 'ভালো ইউনিট। বক্সে 22.5ওয়াট লেখা থাকলেও শুধু নতুন ফোনই সেই গতি টানে — পুরনো হ্যান্ডসেটে আশা না করতে ক্রেতাকে বুঝিয়ে বলা দরকার।',
    },
    orderQty: 50,
    verified: true,
    repeatBuyer: false,
    createdAt: '2026-05-28',
    photos: [],
    helpfulVotes: 5,
  },
];

const SMARTWATCH_REVIEWS: Review[] = [
  {
    id: 'sw-rv-1',
    business: 'Rajshahi Time & Tech',
    district: { en: 'Rajshahi', bn: 'রাজশাহী' },
    rating: 4,
    body: {
      en: 'Battery claim is optimistic — real use is closer to 4 days than the advertised week. Bluetooth calling works cleanly though, which is what customers actually ask about in-store.',
      bn: 'ব্যাটারির দাবি একটু বাড়িয়ে বলা — বাস্তবে সপ্তাহের বদলে 4 দিনের কাছাকাছি। তবে ব্লুটুথ কলিং পরিষ্কার কাজ করে, যা দোকানে ক্রেতারা আসলে জিজ্ঞেস করে।',
    },
    orderQty: 100,
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-06-11',
    photos: [],
    helpfulVotes: 7,
  },
  {
    id: 'sw-rv-2',
    business: 'Tangail Mobile House',
    district: { en: 'Tangail', bn: 'টাঙ্গাইল' },
    rating: 4,
    body: {
      en: 'Good at this price point. The strap is the weak part — I keep a few spares behind the counter since that is the first thing that wears out.',
      bn: 'এই দামে ভালো। স্ট্র্যাপটাই দুর্বল জায়গা — কাউন্টারের পেছনে কয়েকটা স্পেয়ার রাখি, কারণ এটাই আগে নষ্ট হয়।',
    },
    orderQty: 50,
    verified: true,
    repeatBuyer: false,
    createdAt: '2026-05-19',
    photos: [],
    helpfulVotes: 3,
  },
];

const COOKWARE_REVIEWS: Review[] = [
  {
    id: 'cw-rv-1',
    business: "Cox's Bazar Home Store",
    district: { en: "Cox's Bazar", bn: 'কক্সবাজার' },
    rating: 5,
    body: {
      en: 'Induction base actually works on a real induction stove, not just a gas-only claim dressed up. Handles stay cool through a full cooking cycle.',
      bn: 'ইনডাকশন বেস আসল ইনডাকশন চুলায় সত্যিই কাজ করে, শুধু গ্যাসের দাবি সাজিয়ে বলা নয়। পুরো রান্নার সময় হ্যান্ডেল ঠান্ডা থাকে।',
    },
    orderQty: 40,
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-07-08',
    photos: [],
    helpfulVotes: 6,
  },
  {
    id: 'cw-rv-2',
    business: 'Comilla Kitchenware',
    district: { en: 'Cumilla', bn: 'কুমিল্লা' },
    rating: 4,
    body: {
      en: 'Non-stick coating held up through the return-window testing. One customer said the lid does not sit quite as snugly as the photo — otherwise solid.',
      bn: 'রিটার্ন উইন্ডোর টেস্টে নন-স্টিক কোটিং টিকে গেছে। একজন ক্রেতা বলেছেন ঢাকনা ছবির মতো ঠিক ফিট হয় না — বাকিটা ঠিক আছে।',
    },
    orderQty: 100,
    verified: true,
    repeatBuyer: false,
    createdAt: '2026-06-14',
    photos: [],
    helpfulVotes: 4,
  },
];

const WATCH_REVIEWS: Review[] = [
  {
    id: 'wc-rv-1',
    business: 'Sylhet Time Corner',
    district: { en: 'Sylhet', bn: 'সিলেট' },
    rating: 5,
    body: {
      en: 'The steel case feels heavier and more solid than the price suggests. Water resistance held through a customer complaint about rain — no fogging reported back.',
      bn: 'স্টিল কেসটা দামের তুলনায় বেশি ভারী ও মজবুত লাগে। বৃষ্টি নিয়ে এক ক্রেতার অভিযোগেও ওয়াটার রেজিস্ট্যান্স টিকেছে — কুয়াশা জমার অভিযোগ আসেনি।',
    },
    orderQty: 60,
    verified: true,
    repeatBuyer: true,
    createdAt: '2026-07-02',
    photos: [],
    helpfulVotes: 8,
  },
  {
    id: 'wc-rv-2',
    business: 'Khulna Fashion Watch',
    district: { en: 'Khulna', bn: 'খুলনা' },
    rating: 4,
    body: {
      en: 'Good movement accuracy. The strap buckle is a little stiff out of the box, but loosens after about a week of wear.',
      bn: 'মুভমেন্ট নির্ভুল। স্ট্র্যাপের বাকলটা প্রথমে একটু শক্ত, তবে প্রায় এক সপ্তাহ পরানোর পর ঢিলা হয়ে যায়।',
    },
    orderQty: 30,
    verified: true,
    repeatBuyer: false,
    createdAt: '2026-06-05',
    photos: [],
    helpfulVotes: 3,
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

/* ------------------------------------------------- promoted from rail cards */
// These five used to be lightweight cards with no product behind them at all —
// they appeared in rails, search and "frequently bought together", but opening
// one 404'd, because `getProduct()` only ever looked inside `PRODUCTS`. They
// are full listings now. Pricing, MOQ, category and seller name match what the
// cards always showed, so nothing a buyer had already seen changes — the only
// difference is that clicking now goes somewhere.

const CABLE: Product = {
  id: 'p-cable',
  slug: 'usb-c-braided-cable-1m',
  title: {
    en: 'Braided USB-C cable 1 m — 3A fast charge',
    bn: 'ব্রেইডেড USB-C কেবল 1 মিটার — 3এ ফাস্ট চার্জ',
  },
  shortDescription: {
    en: 'Nylon-braided USB-C to USB-A cable, 1 metre, rated for 3A fast charging. The counter accessory every phone-case order also needs.',
    bn: 'নাইলন-ব্রেইডেড USB-C থেকে USB-A কেবল, 1 মিটার, 3এ ফাস্ট চার্জিং রেটেড। প্রতিটি ফোন-কেস অর্ডারের সঙ্গে যা লাগে।',
  },
  sku: 'AB-3315',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Cables & Connectors', bn: 'কেবল ও কানেক্টর' },
    slug: 'cables-connectors',
    parent: { name: { en: 'Mobile Accessories', bn: 'মোবাইল অ্যাকসেসরিজ' }, slug: 'mobile-accessories' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-cable.png',
      width: 800,
      height: 800,
      alt: { en: 'Braided USB-C cable', bn: 'ব্রেইডেড USB-C কেবল' },
      capturedAt: '2026-06-02',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 100, unitPrice: 6_500 },
      { minQty: 500, unitPrice: 5_600 },
      { minQty: 1_000, unitPrice: 4_900 },
    ],
    moq: 100,
    moqStep: 50,
    priceOnRequest: false,
  },
  variantAxes: ['Colour'],
  variants: [
    { id: 'cb-blk', sku: 'AB-3315-BK', attributes: { Colour: 'Black' }, stock: 4_200 },
    { id: 'cb-wht', sku: 'AB-3315-WH', attributes: { Colour: 'White' }, stock: 2_600 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Length', bn: 'দৈর্ঘ্য' }, value: { en: '1 m' }, key: true },
    { group: 'technical', label: { en: 'Current rating', bn: 'কারেন্ট রেটিং' }, value: { en: '3A, 60W max' }, key: true },
    { group: 'technical', label: { en: 'Build', bn: 'বিল্ড' }, value: { en: 'Nylon braid, aluminium connector shell' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '1,000 pcs' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '100 pcs, in multiples of 50', bn: '100 পিস, 50-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships same day from Dhaka stock', bn: 'ঢাকা স্টক থেকে একই দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'A braided cable rated for real fast-charge current rather than the thin 1A core sold as an afterthought elsewhere. Stocked in the two colours that actually move at retail.',
        bn: 'বাস্তব ফাস্ট-চার্জ কারেন্টের জন্য রেটেড ব্রেইডেড কেবল, অন্য জায়গায় বিক্রি হওয়া পাতলা 1এ কোরের বদলে। রিটেইলে আসলে যে দুটি রঙ বিক্রি হয়, সেগুলোই স্টকে।',
      },
    },
  ],
  logistics: { weightGrams: 42, cartonQty: 1_000, cartonDims: '40 × 30 × 30 cm', leadTimeDays: 0 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Yiwu Xinfeng Cable Co.',
    region: { en: 'Zhejiang, China', bn: 'ঝেজিয়াং, চীন' },
    platform: '1688',
    yearsActive: 5,
    verified: true,
  },
  rating: aggregate(CABLE_REVIEWS),
  reviews: CABLE_REVIEWS,
  stats: { views: 7_240, ordersPlaced: 3_210 },
  tags: [{ en: 'Fast charging', bn: 'ফাস্ট চার্জিং' }],
  publishedAt: '2026-06-02',
};

const PACKAGING: Product = {
  id: 'p-packaging',
  slug: 'retail-blister-box-blank',
  title: {
    en: 'Blank retail blister box — earbud size',
    bn: 'ব্লাঙ্ক রিটেইল ব্লিস্টার বক্স — ইয়ারবাড সাইজ',
  },
  shortDescription: {
    en: 'Unprinted blister box sized for TWS earbuds, ready for your own label or a custom print run. Local stock, no minimum print order.',
    bn: 'TWS ইয়ারবাডের মাপে আনপ্রিন্টেড ব্লিস্টার বক্স, নিজের লেবেল বা কাস্টম প্রিন্টের জন্য প্রস্তুত। স্থানীয় স্টক, প্রিন্টে কোনও সর্বনিম্ন নেই।',
  },
  sku: 'DP-1002',
  status: 'active',
  source: 'manual',
  category: {
    name: { en: 'Retail Packaging', bn: 'রিটেইল প্যাকেজিং' },
    slug: 'retail-packaging',
    parent: { name: { en: 'Packaging & Printing', bn: 'প্যাকেজিং ও প্রিন্টিং' }, slug: 'packaging' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-packaging.png',
      width: 800,
      height: 800,
      alt: { en: 'Blank retail blister box', bn: 'ব্লাঙ্ক রিটেইল ব্লিস্টার বক্স' },
      capturedAt: '2026-05-18',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 200, unitPrice: 1_800 },
      { minQty: 1_000, unitPrice: 1_400 },
    ],
    moq: 200,
    moqStep: 100,
    priceOnRequest: false,
  },
  variantAxes: ['Finish'],
  variants: [
    { id: 'pk-clear', sku: 'DP-1002-CLR', attributes: { Finish: 'Clear PVC lid' }, stock: 6_400 },
    { id: 'pk-matte', sku: 'DP-1002-MAT', attributes: { Finish: 'Matte card base' }, stock: 3_100 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Fits', bn: 'উপযোগী' }, value: { en: 'TWS earbud cases up to 65 × 50 × 28 mm' }, key: true },
    { group: 'general', label: { en: 'Material', bn: 'ম্যাটেরিয়াল' }, value: { en: 'PVC lid, 350 gsm card base' } },
    { group: 'trade', label: { en: 'Custom print', bn: 'কাস্টম প্রিন্ট' }, value: { en: 'From 500 pcs, artwork required as vector', bn: '500 পিস থেকে, ভেক্টর আর্টওয়ার্ক প্রয়োজন' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '200 pcs, in multiples of 100', bn: '200 পিস, 100-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 2 days, blank stock', bn: '2 দিনে, ব্লাঙ্ক স্টক থেকে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'The box behind half the earbud listings on this platform. Buy it blank and heat-stamp your own logo, or send artwork for a printed run — either way it ships from Gazipur, not from a factory queue three weeks away.',
        bn: 'এই প্ল্যাটফর্মের অর্ধেক ইয়ারবাড লিস্টিংয়ের পেছনের বক্স এটি। ব্লাঙ্ক কিনে নিজের লোগো বসান, বা প্রিন্টের জন্য আর্টওয়ার্ক দিন — যেভাবেই হোক, তিন সপ্তাহ দূরের ফ্যাক্টরি সারি নয়, গাজীপুর থেকেই আসে।',
      },
    },
  ],
  logistics: { weightGrams: 34, cartonQty: 2_000, cartonDims: '55 × 35 × 30 cm', leadTimeDays: 2 },
  seller: DHAKA_PACK_HOUSE,
  rating: null,
  reviews: [],
  stats: { views: 3_180, ordersPlaced: 740 },
  tags: [],
  publishedAt: '2026-05-18',
};

const POWERBANK: Product = {
  id: 'p-powerbank',
  slug: 'power-bank-10000mah-slim',
  title: {
    en: 'Slim power bank 10,000 mAh — 22.5W PD',
    bn: 'স্লিম পাওয়ার ব্যাংক 10,000 এমএএইচ — 22.5ওয়াট',
  },
  shortDescription: {
    en: 'A slim 10,000 mAh power bank with 22.5W two-way fast charging. Tested cell capacity, not just a printed number.',
    bn: 'স্লিম 10,000 এমএএইচ পাওয়ার ব্যাংক, 22.5ওয়াট দুই-দিকের ফাস্ট চার্জিং। শুধু ছাপা সংখ্যা নয়, টেস্ট করা সেল ক্যাপাসিটি।',
  },
  sku: 'AB-5560',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Power Banks', bn: 'পাওয়ার ব্যাংক' },
    slug: 'power-banks',
    parent: { name: { en: 'Consumer Electronics', bn: 'কনজিউমার ইলেকট্রনিক্স' }, slug: 'electronics' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-powerbank.png',
      width: 800,
      height: 800,
      alt: { en: 'Slim power bank, 10,000 mAh', bn: 'স্লিম পাওয়ার ব্যাংক' },
      capturedAt: '2026-05-30',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 30, unitPrice: 88_000 },
      { minQty: 100, unitPrice: 81_000 },
      { minQty: 300, unitPrice: 76_500 },
    ],
    moq: 30,
    moqStep: 10,
    priceOnRequest: false,
    samplePrice: 105_000,
    sampleQty: 1,
  },
  variantAxes: ['Colour'],
  variants: [
    { id: 'pb-blk', sku: 'AB-5560-BK', attributes: { Colour: 'Black' }, stock: 860 },
    { id: 'pb-slv', sku: 'AB-5560-SV', attributes: { Colour: 'Silver' }, stock: 540 },
  ],
  specifications: [
    { group: 'technical', label: { en: 'Capacity', bn: 'ক্যাপাসিটি' }, value: { en: '10,000 mAh, tested' }, key: true },
    { group: 'technical', label: { en: 'Output', bn: 'আউটপুট' }, value: { en: '22.5W PD/QC, in and out' }, key: true },
    { group: 'technical', label: { en: 'Thickness', bn: 'পুরুত্ব' }, value: { en: '14.5 mm' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '100 pcs' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '30 pcs, in multiples of 10', bn: '30 পিস, 10-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 4 days from local stock', bn: 'স্থানীয় স্টক থেকে 4 দিনে' }, key: true },
    { group: 'compliance', label: { en: 'Battery transport', bn: 'ব্যাটারি পরিবহন' }, value: { en: 'UN38.3 tested, air-freight permitted' } },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Rated capacity on a power bank is the single most faked number in the accessory aisle. Every batch here is discharge-tested before listing, and the figure on this page is what the cell actually holds, not what the moulding says.',
        bn: 'অ্যাকসেসরিজ শেলফে সবচেয়ে বেশি বাড়িয়ে বলা সংখ্যা পাওয়ার ব্যাংকের ক্যাপাসিটি। এখানে প্রতিটি ব্যাচ লিস্ট করার আগে ডিসচার্জ-টেস্ট করা হয়, আর এই পেজের সংখ্যা মোল্ডিংয়ে লেখা নয়, সেল আসলে যা ধরে রাখে তাই।',
      },
    },
  ],
  logistics: { weightGrams: 210, cartonQty: 100, cartonDims: '44 × 34 × 30 cm', leadTimeDays: 4 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Shenzhen Hengbao Power Co.',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 6,
    verified: true,
  },
  rating: aggregate(POWERBANK_REVIEWS),
  reviews: POWERBANK_REVIEWS,
  stats: { views: 11_640, ordersPlaced: 1_640 },
  tags: [{ en: 'Tested capacity', bn: 'টেস্টেড ক্যাপাসিটি' }],
  publishedAt: '2026-05-30',
};

const SMARTWATCH: Product = {
  id: 'p-smartwatch',
  slug: 'smartwatch-fit-s1',
  title: {
    en: 'Fitness smartwatch S1 — 1.85 in, BT calling',
    bn: 'ফিটনেস স্মার্টওয়াচ এস1 — 1.85 ইঞ্চি, বিটি কলিং',
  },
  shortDescription: {
    en: '1.85-inch fitness smartwatch with Bluetooth calling, heart-rate and sleep tracking. A retail-shelf staple at the ৳1,000–1,500 price band.',
    bn: '1.85 ইঞ্চি ফিটনেস স্মার্টওয়াচ, ব্লুটুথ কলিং, হার্ট-রেট ও স্লিপ ট্র্যাকিং। 1,000–1,500 টাকার শেলফে জনপ্রিয়।',
  },
  sku: 'AB-6634',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Smartwatches & Bands', bn: 'স্মার্টওয়াচ ও ব্যান্ড' },
    slug: 'smartwatches',
    parent: { name: { en: 'Consumer Electronics', bn: 'কনজিউমার ইলেকট্রনিক্স' }, slug: 'electronics' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-smartwatch.png',
      width: 800,
      height: 800,
      alt: { en: 'Fitness smartwatch S1', bn: 'ফিটনেস স্মার্টওয়াচ এস1' },
      capturedAt: '2026-06-08',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 20, unitPrice: 128_000 },
      { minQty: 100, unitPrice: 118_000 },
      { minQty: 250, unitPrice: 112_000 },
    ],
    moq: 20,
    moqStep: 10,
    priceOnRequest: false,
  },
  variantAxes: ['Strap colour'],
  variants: [
    { id: 'sw-blk', sku: 'AB-6634-BK', attributes: { 'Strap colour': 'Black' }, stock: 340 },
    { id: 'sw-pnk', sku: 'AB-6634-PK', attributes: { 'Strap colour': 'Rose pink' }, stock: 180 },
    { id: 'sw-blu', sku: 'AB-6634-BL', attributes: { 'Strap colour': 'Navy' }, stock: 0, incoming: { qty: 200, days: 10 } },
  ],
  specifications: [
    { group: 'technical', label: { en: 'Display', bn: 'ডিসপ্লে' }, value: { en: '1.85 in IPS, 240×280' }, key: true },
    { group: 'technical', label: { en: 'Calling', bn: 'কলিং' }, value: { en: 'Bluetooth 5.2, built-in mic/speaker' }, key: true },
    { group: 'technical', label: { en: 'Battery', bn: 'ব্যাটারি' }, value: { en: '260 mAh, up to 5 days typical use' } },
    { group: 'technical', label: { en: 'Water rating', bn: 'ওয়াটার রেটিং' }, value: { en: 'IP67' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '150 pcs' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '20 pcs, in multiples of 10', bn: '20 পিস, 10-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 6 days from local stock', bn: 'স্থানীয় স্টক থেকে 6 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'The advertised week of battery life assumes the screen stays off and calling stays unused — real counter use runs closer to four or five days, and the spec sheet says so rather than letting the return desk find out.',
        bn: 'বিজ্ঞাপনের এক সপ্তাহ ব্যাটারি ধরে নেয় স্ক্রিন বন্ধ ও কলিং অব্যবহৃত — বাস্তবে কাউন্টার ব্যবহারে চার-পাঁচ দিনের কাছাকাছি, আর স্পেক শিটেই তা বলা আছে, রিটার্ন ডেস্ককে খুঁজে বের করতে হয় না।',
      },
    },
  ],
  logistics: { weightGrams: 58, cartonQty: 150, cartonDims: '46 × 32 × 28 cm', leadTimeDays: 6 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Shenzhen Youpin Wearables',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 4,
    verified: true,
  },
  rating: aggregate(SMARTWATCH_REVIEWS),
  reviews: SMARTWATCH_REVIEWS,
  stats: { views: 5_920, ordersPlaced: 880 },
  tags: [],
  publishedAt: '2026-06-08',
};

const TRIPOD: Product = {
  id: 'p-tripod',
  slug: 'phone-tripod-ring-light',
  title: {
    en: 'Phone tripod with ring light — 1.6 m',
    bn: 'ফোন ট্রাইপড ও রিং লাইট — 1.6 মিটার',
  },
  shortDescription: {
    en: 'Extendable 1.6 m tripod with a 3-colour ring light and phone clamp. The counter item every live-selling shop reorders.',
    bn: 'বাড়ানো যায় এমন 1.6 মিটার ট্রাইপড, 3-রঙা রিং লাইট ও ফোন ক্ল্যাম্পসহ। লাইভ বিক্রি করা দোকানগুলো বারবার নেয়।',
  },
  sku: 'AB-4471',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Selfie Sticks & Tripods', bn: 'সেলফি স্টিক ও ট্রাইপড' },
    slug: 'selfie-tripods',
    parent: { name: { en: 'Mobile Accessories', bn: 'মোবাইল অ্যাকসেসরিজ' }, slug: 'mobile-accessories' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-tripod.png',
      width: 800,
      height: 800,
      alt: { en: 'Phone tripod with ring light', bn: 'ফোন ট্রাইপড ও রিং লাইট' },
      capturedAt: '2026-06-15',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 20, unitPrice: 96_000 },
      { minQty: 100, unitPrice: 87_000 },
    ],
    moq: 20,
    moqStep: 10,
    priceOnRequest: false,
  },
  variantAxes: ['Ring light size'],
  variants: [
    { id: 'tp-6in', sku: 'AB-4471-6', attributes: { 'Ring light size': '6 in' }, stock: 420 },
    { id: 'tp-10in', sku: 'AB-4471-10', attributes: { 'Ring light size': '10 in' }, stock: 260 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Extended height', bn: 'সর্বোচ্চ উচ্চতা' }, value: { en: '1.6 m' }, key: true },
    { group: 'technical', label: { en: 'Ring light', bn: 'রিং লাইট' }, value: { en: '3-colour, USB powered, dimmable' }, key: true },
    { group: 'technical', label: { en: 'Load capacity', bn: 'লোড ক্ষমতা' }, value: { en: 'Phone + light, up to 800 g' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '60 pcs' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '20 pcs, in multiples of 10', bn: '20 পিস, 10-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 5 days from local stock', bn: 'স্থানীয় স্টক থেকে 5 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Every shop that started live-selling on social video in the last two years bought one of these first. The clamp fits phones up to 85 mm wide with a case on.',
        bn: 'গত দুই বছরে যারা ভিডিওতে লাইভ বিক্রি শুরু করেছেন তারা প্রথমে এটিই কিনেছেন। ক্ল্যাম্পটি কেসসহ 85 মিমি পর্যন্ত চওড়া ফোনে লাগে।',
      },
    },
  ],
  logistics: { weightGrams: 640, cartonQty: 60, cartonDims: '50 × 40 × 38 cm', leadTimeDays: 5 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Dongguan Weisheng Photo Equipment',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 3,
    verified: true,
  },
  rating: null,
  reviews: [],
  stats: { views: 4_460, ordersPlaced: 460 },
  tags: [],
  publishedAt: '2026-06-15',
};

/* --------------------------------------------------------- new departments */
// Twelve more, spread across categories the sample catalogue did not reach
// before: home & kitchen, beauty, stationery, footwear & bags, toys, hardware,
// auto parts, sports, jewellery & watches, textiles and a second apparel line.
// Three of them deliberately sell by a unit other than the piece — fasteners by
// the kilogram, fabric by the metre, kids' wear by the dozen — because every
// product before this batch sold by `pc`, and the ladder, the matrix and the
// landed-cost maths all had a code path nothing in the sample data had ever
// actually exercised.

const COOKWARE: Product = {
  id: 'p-cookware',
  slug: 'cookware-set-nonstick-3pc',
  title: {
    en: 'Non-stick cookware set — 3-piece, induction base',
    bn: 'নন-স্টিক কুকওয়্যার সেট — 3-পিস, ইনডাকশন বেস',
  },
  shortDescription: {
    en: 'A 3-piece non-stick pan set — frying pan, saucepan, wok — with an induction-ready base and stay-cool handles.',
    bn: 'একটি 3-পিস নন-স্টিক প্যান সেট — ফ্রাইং প্যান, সসপ্যান, ওক — ইনডাকশন-প্রস্তুত বেস ও ঠান্ডা থাকা হ্যান্ডেলসহ।',
  },
  sku: 'AB-8102',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Cookware & Bakeware', bn: 'কুকওয়্যার ও বেকওয়্যার' },
    slug: 'cookware',
    parent: { name: { en: 'Home & Kitchen', bn: 'হোম ও কিচেন' }, slug: 'home-kitchen' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-cookware.png',
      width: 800,
      height: 800,
      alt: { en: 'Non-stick cookware set, 3 pieces', bn: 'নন-স্টিক কুকওয়্যার সেট' },
      capturedAt: '2026-07-01',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 20, unitPrice: 85_000 },
      { minQty: 50, unitPrice: 78_000 },
      { minQty: 100, unitPrice: 72_000 },
    ],
    moq: 20,
    moqStep: 5,
    priceOnRequest: false,
  },
  variantAxes: ['Colour'],
  variants: [
    { id: 'cw-blk', sku: 'AB-8102-BK', attributes: { Colour: 'Charcoal black' }, stock: 240 },
    { id: 'cw-red', sku: 'AB-8102-RD', attributes: { Colour: 'Brick red' }, stock: 96 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Set contents', bn: 'সেটে যা আছে' }, value: { en: 'Frying pan, saucepan, wok' }, key: true },
    { group: 'technical', label: { en: 'Coating', bn: 'কোটিং' }, value: { en: '3-layer non-stick, PFOA-free' }, key: true },
    { group: 'technical', label: { en: 'Base', bn: 'বেস' }, value: { en: 'Induction-compatible, works on gas too' }, key: true },
    { group: 'technical', label: { en: 'Handles', bn: 'হ্যান্ডেল' }, value: { en: 'Bakelite, stay-cool' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '20 sets' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '20 sets, in multiples of 5', bn: '20 সেট, 5-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 4 days from local stock', bn: 'স্থানীয় স্টক থেকে 4 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Priced for the kitchenware aisle where an induction claim actually gets tested against a real stove before a customer buys — this base is genuinely induction-compatible, not gas-only with an induction sticker.',
        bn: 'কিচেনওয়্যার শেলফের জন্য দাম ঠিক করা, যেখানে ক্রেতা কেনার আগেই ইনডাকশনের দাবি সত্যিকারের চুলায় যাচাই করেন — এই বেস সত্যিকারের ইনডাকশন-সামঞ্জস্যপূর্ণ, স্টিকার সাঁটা গ্যাস-শুধু নয়।',
      },
    },
  ],
  logistics: { weightGrams: 1_850, cartonQty: 20, cartonDims: '52 × 40 × 36 cm', leadTimeDays: 4 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Foshan Shunde Cookware Co.',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 9,
    verified: true,
  },
  rating: aggregate(COOKWARE_REVIEWS),
  reviews: COOKWARE_REVIEWS,
  stats: { views: 4_120, ordersPlaced: 310 },
  tags: [{ en: 'Induction ready', bn: 'ইনডাকশন প্রস্তুত' }],
  publishedAt: '2026-07-01',
};

const SERUM: Product = {
  id: 'p-serum',
  slug: 'vitamin-c-serum-30ml',
  title: {
    en: 'Vitamin C brightening serum — 30 ml, private-label ready',
    bn: 'ভিটামিন সি ব্রাইটেনিং সিরাম — 30 মিলি, প্রাইভেট-লেবেল প্রস্তুত',
  },
  shortDescription: {
    en: '10% vitamin C brightening serum in a 30 ml amber bottle, formulated for private label — your box, your name, from 1,000 units.',
    bn: '10% ভিটামিন সি ব্রাইটেনিং সিরাম, 30 মিলি অ্যাম্বার বোতলে, প্রাইভেট লেবেলের জন্য তৈরি — 1,000 ইউনিট থেকে নিজের বক্স, নিজের নাম।',
  },
  sku: 'AB-8830',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Skincare', bn: 'স্কিনকেয়ার' },
    slug: 'skincare',
    parent: { name: { en: 'Beauty & Personal Care', bn: 'বিউটি ও পার্সোনাল কেয়ার' }, slug: 'beauty' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-skincare.png',
      width: 800,
      height: 800,
      alt: { en: 'Vitamin C serum bottle, 30 ml', bn: 'ভিটামিন সি সিরাম বোতল' },
      capturedAt: '2026-07-10',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 500, unitPrice: 18_000 },
      { minQty: 1_000, unitPrice: 15_000 },
      { minQty: 3_000, unitPrice: 13_500 },
    ],
    moq: 500,
    moqStep: 100,
    priceOnRequest: false,
    samplePrice: 45_000,
    sampleQty: 1,
  },
  variantAxes: ['Formula'],
  variants: [
    { id: 'sr-std', sku: 'AB-8830-STD', attributes: { Formula: 'Standard 10%' }, stock: 0, incoming: { qty: 6_000, days: 14 } },
    { id: 'sr-hy', sku: 'AB-8830-HY', attributes: { Formula: '10% + hyaluronic acid' }, stock: 0, incoming: { qty: 4_000, days: 16 } },
  ],
  specifications: [
    { group: 'general', label: { en: 'Volume', bn: 'পরিমাণ' }, value: { en: '30 ml, amber glass' }, key: true },
    { group: 'technical', label: { en: 'Active', bn: 'অ্যাক্টিভ' }, value: { en: '10% vitamin C (sodium ascorbyl phosphate)' }, key: true },
    { group: 'technical', label: { en: 'Shelf life', bn: 'মেয়াদ' }, value: { en: '24 months unopened' } },
    { group: 'trade', label: { en: 'Private label', bn: 'প্রাইভেট লেবেল' }, value: { en: 'From 1,000 pcs — box and label under your brand', bn: '1,000 পিস থেকে — আপনার ব্র্যান্ডে বক্স ও লেবেল' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '500 pcs, in multiples of 100', bn: '500 পিস, 100-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Produced to order, 12–16 days', bn: 'অর্ডারে তৈরি, 12–16 দিন' }, key: true },
    { group: 'compliance', label: { en: 'Certification', bn: 'সার্টিফিকেশন' }, value: { en: 'GMP-certified facility' } },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'A stable, GMP-produced formula rather than a jobber relabel — batches are made to order so the concentration on the certificate of analysis matches what ships, and private label is a real production option from 1,000 units, not a marketing line.',
        bn: 'জবারের রিলেবেল নয়, একটি স্থিতিশীল GMP-উৎপাদিত ফর্মুলা — ব্যাচ অর্ডার অনুযায়ী তৈরি হয়, তাই সার্টিফিকেট অফ অ্যানালাইসিসের ঘনত্ব যা পাঠানো হয় তার সঙ্গে মেলে, আর 1,000 ইউনিট থেকে প্রাইভেট লেবেল সত্যিকারের প্রোডাকশন অপশন, শুধু বিজ্ঞাপনের কথা নয়।',
      },
    },
  ],
  logistics: { weightGrams: 62, cartonQty: 500, cartonDims: '40 × 30 × 26 cm', leadTimeDays: 12, sourcingDays: [12, 16] },
  customisation: { customPackagingMoq: 1_000, privateLabelMoq: 1_000 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Guangzhou Meiyan Cosmetics',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 8,
    verified: true,
  },
  rating: null,
  reviews: [],
  stats: { views: 2_640, ordersPlaced: 0 },
  tags: [{ en: 'Private label', bn: 'প্রাইভেট লেবেল' }],
  publishedAt: '2026-07-10',
};

const NOTEBOOK: Product = {
  id: 'p-notebook',
  slug: 'notebook-a5-hardcover-ruled',
  title: {
    en: 'A5 hardcover notebook — 100 gsm ruled, custom cover print',
    bn: 'A5 হার্ডকভার নোটবুক — 100 জিএসএম রুলড, কাস্টম কভার প্রিন্ট',
  },
  shortDescription: {
    en: '192-page A5 hardcover notebook, 100 gsm ruled paper, sewn binding. Cover print available from 500 pieces.',
    bn: '192 পাতার A5 হার্ডকভার নোটবুক, 100 জিএসএম রুলড কাগজ, সেলাই করা বাঁধাই। 500 পিস থেকে কভার প্রিন্ট।',
  },
  sku: 'DP-1044',
  status: 'active',
  source: 'manual',
  category: {
    name: { en: 'Notebooks & Paper', bn: 'খাতা ও কাগজ' },
    slug: 'notebooks-paper',
    parent: { name: { en: 'Stationery & Office', bn: 'স্টেশনারি ও অফিস' }, slug: 'stationery' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-notebook.png',
      width: 800,
      height: 800,
      alt: { en: 'A5 hardcover notebooks, boxed', bn: 'A5 হার্ডকভার নোটবুক' },
      capturedAt: '2026-05-22',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 200, unitPrice: 4_500 },
      { minQty: 1_000, unitPrice: 3_800 },
      { minQty: 3_000, unitPrice: 3_200 },
    ],
    moq: 200,
    moqStep: 100,
    priceOnRequest: false,
  },
  variantAxes: ['Cover colour'],
  variants: [
    { id: 'nb-blk', sku: 'DP-1044-BK', attributes: { 'Cover colour': 'Black' }, stock: 3_200 },
    { id: 'nb-nvy', sku: 'DP-1044-NV', attributes: { 'Cover colour': 'Navy' }, stock: 2_100 },
    { id: 'nb-krf', sku: 'DP-1044-KR', attributes: { 'Cover colour': 'Kraft brown' }, stock: 1_400 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Pages', bn: 'পাতা' }, value: { en: '192, ruled' }, key: true },
    { group: 'general', label: { en: 'Paper', bn: 'কাগজ' }, value: { en: '100 gsm, low ghosting for gel pens', bn: '100 জিএসএম, জেল পেনে কম ঘোস্টিং' }, key: true },
    { group: 'technical', label: { en: 'Binding', bn: 'বাঁধাই' }, value: { en: 'Sewn, lies flat' } },
    { group: 'trade', label: { en: 'Cover print', bn: 'কভার প্রিন্ট' }, value: { en: 'From 500 pcs, one colour, artwork required', bn: '500 পিস থেকে, এক রঙ, আর্টওয়ার্ক প্রয়োজন' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '200 pcs, in multiples of 100', bn: '200 পিস, 100-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 2 days, blank stock', bn: 'ব্লাঙ্ক স্টক থেকে 2 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: '100 gsm is the detail that matters here — thinner paper ghosts through with a gel pen, which is what turns a customer away from a notebook stack a second time. Printed with a school or corporate logo from 500 pieces.',
        bn: '100 জিএসএমই এখানে গুরুত্বপূর্ণ — পাতলা কাগজে জেল পেনে লেখা উলটো পাশে দেখা যায়, যা দ্বিতীয়বার ক্রেতাকে ফিরিয়ে দেয়। 500 পিস থেকে স্কুল বা কর্পোরেট লোগো প্রিন্ট করা যায়।',
      },
    },
  ],
  logistics: { weightGrams: 220, cartonQty: 200, cartonDims: '48 × 34 × 30 cm', leadTimeDays: 2 },
  customisation: { customPackagingMoq: 500 },
  seller: DHAKA_PACK_HOUSE,
  rating: null,
  reviews: [],
  stats: { views: 2_980, ordersPlaced: 420 },
  tags: [],
  publishedAt: '2026-05-22',
};

const BACKPACK: Product = {
  id: 'p-backpack',
  slug: 'laptop-backpack-15in-water-resistant',
  title: {
    en: 'Laptop backpack 15.6 in — water-resistant, USB port',
    bn: 'ল্যাপটপ ব্যাকপ্যাক 15.6 ইঞ্চি — ওয়াটার-রেজিস্ট্যান্ট, USB পোর্ট',
  },
  shortDescription: {
    en: 'Water-resistant 15.6-inch laptop backpack with a padded sleeve, anti-theft back pocket and a built-in USB charging port.',
    bn: 'ওয়াটার-রেজিস্ট্যান্ট 15.6 ইঞ্চি ল্যাপটপ ব্যাকপ্যাক, প্যাডেড স্লিভ, অ্যান্টি-থেফট পকেট ও বিল্ট-ইন USB চার্জিং পোর্টসহ।',
  },
  sku: 'AB-7743',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Backpacks & School Bags', bn: 'ব্যাকপ্যাক ও স্কুল ব্যাগ' },
    slug: 'backpacks',
    parent: { name: { en: 'Footwear & Bags', bn: 'ফুটওয়্যার ও ব্যাগ' }, slug: 'footwear-bags' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-backpack.png',
      width: 800,
      height: 800,
      alt: { en: 'Laptop backpack, 15.6 inch', bn: 'ল্যাপটপ ব্যাকপ্যাক' },
      capturedAt: '2026-06-25',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 30, unitPrice: 65_000 },
      { minQty: 100, unitPrice: 58_000 },
      { minQty: 300, unitPrice: 52_000 },
    ],
    moq: 30,
    moqStep: 10,
    priceOnRequest: false,
  },
  variantAxes: ['Colour'],
  variants: [
    { id: 'bp-blk', sku: 'AB-7743-BK', attributes: { Colour: 'Black' }, stock: 180 },
    { id: 'bp-gry', sku: 'AB-7743-GY', attributes: { Colour: 'Charcoal grey' }, stock: 90 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Fits', bn: 'উপযোগী' }, value: { en: 'Laptops up to 15.6 in' }, key: true },
    { group: 'technical', label: { en: 'Fabric', bn: 'ফ্যাব্রিক' }, value: { en: '900D oxford, water-resistant coating' }, key: true },
    { group: 'technical', label: { en: 'Features', bn: 'ফিচার' }, value: { en: 'USB charging port, anti-theft back-panel pocket' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '30 pcs' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '30 pcs, in multiples of 10', bn: '30 পিস, 10-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 5 days from local stock', bn: 'স্থানীয় স্টক থেকে 5 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Sits between the ৳400 no-name bag and a branded ৳3,000 backpack — water-resistant fabric and a padded sleeve at a price a university-area shop can actually stock in volume.',
        bn: '400 টাকার নামহীন ব্যাগ ও 3,000 টাকার ব্র্যান্ডেড ব্যাকপ্যাকের মাঝামাঝি — ওয়াটার-রেজিস্ট্যান্ট ফ্যাব্রিক ও প্যাডেড স্লিভ, এমন দামে যা বিশ্ববিদ্যালয় এলাকার দোকান আসলে ভলিউমে স্টক রাখতে পারে।',
      },
    },
  ],
  logistics: { weightGrams: 780, cartonQty: 30, cartonDims: '54 × 42 × 40 cm', leadTimeDays: 5 },
  seller: RIDDHI_IMPORTS,
  rating: null,
  reviews: [],
  stats: { views: 3_760, ordersPlaced: 210 },
  tags: [],
  publishedAt: '2026-06-25',
};

const BLOCKS: Product = {
  id: 'p-blocks',
  slug: 'wooden-alphabet-blocks-26pc',
  title: {
    en: 'Wooden alphabet blocks — 26 pcs, non-toxic paint',
    bn: 'কাঠের অ্যালফাবেট ব্লক — 26 পিস, নন-টক্সিক রং',
  },
  shortDescription: {
    en: 'A 26-piece wooden alphabet block set, water-based non-toxic paint, in a printed storage box.',
    bn: '26-পিস কাঠের অ্যালফাবেট ব্লক সেট, পানি-ভিত্তিক নন-টক্সিক রং, প্রিন্টেড স্টোরেজ বক্সে।',
  },
  sku: 'AB-9902',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Educational Toys', bn: 'শিক্ষামূলক খেলনা' },
    slug: 'educational-toys',
    parent: { name: { en: 'Toys & Baby', bn: 'খেলনা ও শিশু' }, slug: 'toys-baby' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-blocks.png',
      width: 800,
      height: 800,
      alt: { en: 'Wooden alphabet blocks, boxed set', bn: 'কাঠের অ্যালফাবেট ব্লক' },
      capturedAt: '2026-06-18',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 50, unitPrice: 22_000 },
      { minQty: 200, unitPrice: 19_500 },
      { minQty: 500, unitPrice: 17_500 },
    ],
    moq: 50,
    moqStep: 25,
    priceOnRequest: false,
  },
  variantAxes: ['Box design'],
  variants: [
    { id: 'bl-ani', sku: 'AB-9902-ANI', attributes: { 'Box design': 'Animal print' }, stock: 640 },
    { id: 'bl-num', sku: 'AB-9902-NUM', attributes: { 'Box design': 'Number print' }, stock: 380 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Set contents', bn: 'সেটে যা আছে' }, value: { en: '26 blocks, A–Z' }, key: true },
    { group: 'technical', label: { en: 'Material', bn: 'ম্যাটেরিয়াল' }, value: { en: 'Beech wood, water-based paint' }, key: true },
    { group: 'compliance', label: { en: 'Safety', bn: 'নিরাপত্তা' }, value: { en: 'Non-toxic paint, EN71-3 tested' }, key: true },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '50 sets' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '50 sets, in multiples of 25', bn: '50 সেট, 25-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 3 days from local stock', bn: 'স্থানীয় স্টক থেকে 3 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'The paint is the part parents actually ask about. EN71-3 covers migration of heavy metals from a coating a toddler will put in their mouth, and the test certificate is available on request rather than a claim printed on the box alone.',
        bn: 'রংটাই বাবা-মায়েরা আসলে জিজ্ঞেস করেন। EN71-3 কভার করে এমন কোটিং থেকে ভারী ধাতুর মিশে যাওয়া, যা শিশু মুখে দিতে পারে — শুধু বক্সে ছাপা দাবি নয়, চাইলে টেস্ট সার্টিফিকেট পাওয়া যায়।',
      },
    },
  ],
  logistics: { weightGrams: 480, cartonQty: 50, cartonDims: '46 × 36 × 32 cm', leadTimeDays: 3 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Ningbo Xinle Toys',
    region: { en: 'Zhejiang, China', bn: 'ঝেজিয়াং, চীন' },
    platform: '1688',
    yearsActive: 7,
    verified: true,
  },
  rating: null,
  reviews: [],
  stats: { views: 2_240, ordersPlaced: 160 },
  tags: [],
  publishedAt: '2026-06-18',
};

const TOOLKIT: Product = {
  id: 'p-toolkit',
  slug: 'hand-tool-kit-46pc',
  title: {
    en: '46-piece hand tool kit — chrome vanadium, carry case',
    bn: '46-পিস হ্যান্ড টুল কিট — ক্রোম ভ্যানাডিয়াম, ক্যারি কেস',
  },
  shortDescription: {
    en: 'A 46-piece general hand tool kit in chrome vanadium steel, packed in a moulded carry case.',
    bn: '46-পিস সাধারণ হ্যান্ড টুল কিট, ক্রোম ভ্যানাডিয়াম স্টিল, মোল্ডেড ক্যারি কেসে।',
  },
  sku: 'AB-8845',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Hand Tools', bn: 'হ্যান্ড টুলস' },
    slug: 'hand-tools',
    parent: { name: { en: 'Hardware & Tools', bn: 'হার্ডওয়্যার ও টুলস' }, slug: 'hardware-tools' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-toolkit.png',
      width: 800,
      height: 800,
      alt: { en: 'Hand tool kit, 46 pieces, cased', bn: 'হ্যান্ড টুল কিট' },
      capturedAt: '2026-05-10',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 20, unitPrice: 98_000 },
      { minQty: 100, unitPrice: 89_000 },
      { minQty: 300, unitPrice: 82_000 },
    ],
    moq: 20,
    moqStep: 10,
    priceOnRequest: false,
  },
  variantAxes: ['Case colour'],
  variants: [
    { id: 'tk-blk', sku: 'AB-8845-BK', attributes: { 'Case colour': 'Black' }, stock: 210 },
    { id: 'tk-red', sku: 'AB-8845-RD', attributes: { 'Case colour': 'Red' }, stock: 140 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Set contents', bn: 'সেটে যা আছে' }, value: { en: '46 pieces: sockets, wrenches, screwdrivers, pliers' }, key: true },
    { group: 'technical', label: { en: 'Material', bn: 'ম্যাটেরিয়াল' }, value: { en: 'Chrome vanadium steel' }, key: true },
    { group: 'packaging', label: { en: 'Case', bn: 'কেস' }, value: { en: 'Moulded EVA, latched' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '20 kits' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '20 kits, in multiples of 10', bn: '20 কিট, 10-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 6 days from local stock', bn: 'স্থানীয় স্টক থেকে 6 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Chrome vanadium rather than the unmarked mild steel that rounds off a bolt head on the third use — the alloy is the difference between a tool kit and a tool-shaped kit.',
        bn: 'তৃতীয়বার ব্যবহারেই বোল্টের মাথা গোল করে দেওয়া আনমার্কড মাইল্ড স্টিল নয়, ক্রোম ভ্যানাডিয়াম — এই অ্যালয়টুকুই আসল টুল কিট আর টুল-আকৃতির কিটের পার্থক্য।',
      },
    },
  ],
  logistics: { weightGrams: 2_400, cartonQty: 20, cartonDims: '50 × 40 × 34 cm', leadTimeDays: 6 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Yongkang Hardware Manufacturing',
    region: { en: 'Zhejiang, China', bn: 'ঝেজিয়াং, চীন' },
    platform: '1688',
    yearsActive: 10,
    verified: true,
  },
  rating: null,
  reviews: [],
  stats: { views: 3_040, ordersPlaced: 190 },
  tags: [],
  publishedAt: '2026-05-10',
};

const FASTENERS: Product = {
  id: 'p-fasteners',
  slug: 'self-tapping-screws-assorted',
  title: {
    en: 'Self-tapping screws — assorted sizes, zinc-plated',
    bn: 'সেলফ-ট্যাপিং স্ক্রু — বিভিন্ন মাপ, জিংক-প্লেটেড',
  },
  shortDescription: {
    en: 'Zinc-plated self-tapping screws, assorted sizes from M3 to M6, sold by the kilogram in sealed bulk bags.',
    bn: 'জিংক-প্লেটেড সেলফ-ট্যাপিং স্ক্রু, M3 থেকে M6 পর্যন্ত বিভিন্ন মাপ, সিলড বাল্ক ব্যাগে কেজি হিসাবে।',
  },
  sku: 'AB-8846',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Fasteners & Fittings', bn: 'ফাসেনার ও ফিটিংস' },
    slug: 'fasteners',
    parent: { name: { en: 'Hardware & Tools', bn: 'হার্ডওয়্যার ও টুলস' }, slug: 'hardware-tools' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-fasteners.png',
      width: 800,
      height: 800,
      alt: { en: 'Bulk carton of self-tapping screws', bn: 'সেলফ-ট্যাপিং স্ক্রুর বাল্ক কার্টন' },
      capturedAt: '2026-05-05',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'kg',
    tiers: [
      { minQty: 25, unitPrice: 22_000 },
      { minQty: 100, unitPrice: 19_500 },
      { minQty: 500, unitPrice: 17_500 },
    ],
    moq: 25,
    moqStep: 5,
    priceOnRequest: false,
  },
  variantAxes: ['Size'],
  variants: [
    { id: 'fs-m3', sku: 'AB-8846-M3', attributes: { Size: 'M3 × 20mm' }, stock: 640 },
    { id: 'fs-m4', sku: 'AB-8846-M4', attributes: { Size: 'M4 × 25mm' }, stock: 820 },
    { id: 'fs-m5', sku: 'AB-8846-M5', attributes: { Size: 'M5 × 30mm' }, stock: 410 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Sizes available', bn: 'উপলব্ধ মাপ' }, value: { en: 'M3–M6, mixed lengths' }, key: true },
    { group: 'technical', label: { en: 'Coating', bn: 'কোটিং' }, value: { en: 'Zinc-plated, corrosion resistant' }, key: true },
    { group: 'technical', label: { en: 'Head type', bn: 'হেডের ধরন' }, value: { en: 'Phillips pan head' } },
    { group: 'packaging', label: { en: 'Bagging', bn: 'ব্যাগিং' }, value: { en: 'Sealed 5 kg bags, by size' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '25 kg, in multiples of 5 kg', bn: '25 কেজি, 5 কেজির গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships same day from local stock', bn: 'স্থানীয় স্টক থেকে একই দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Sold by weight because that is how a hardware counter actually buys fasteners — no piece-count fiction, no guessing how many screws are in an unlabelled bag. Mixed sizes ship in separately sealed 5 kg bags so nothing needs sorting on arrival.',
        bn: 'ওজন হিসাবে বিক্রি হয়, কারণ হার্ডওয়্যার কাউন্টার আসলে এভাবেই ফাসেনার কেনে — পিস-সংখ্যার কল্পকাহিনি নেই, লেবেলহীন ব্যাগে কয়টা স্ক্রু তা অনুমান করতে হয় না। বিভিন্ন মাপ আলাদা সিল করা 5 কেজি ব্যাগে আসে, পৌঁছানোর পর বাছাই করতে হয় না।',
      },
    },
  ],
  logistics: { weightGrams: 1_000, cartonQty: 25, cartonDims: '40 × 30 × 25 cm', leadTimeDays: 0 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Ningbo Fastener Industrial Co.',
    region: { en: 'Zhejiang, China', bn: 'ঝেজিয়াং, চীন' },
    platform: '1688',
    yearsActive: 12,
    verified: true,
  },
  rating: null,
  reviews: [],
  stats: { views: 1_860, ordersPlaced: 240 },
  tags: [],
  publishedAt: '2026-05-05',
};

const CAR_ORGANISER: Product = {
  id: 'p-car-organiser',
  slug: 'car-seat-organiser-pu',
  title: {
    en: 'Car seat organiser — PU leather, multi-pocket',
    bn: 'কার সিট অর্গানাইজার — PU লেদার, মাল্টি-পকেট',
  },
  shortDescription: {
    en: 'A back-of-seat PU leather organiser with tablet pocket, tissue slot and multiple storage compartments.',
    bn: 'সিটের পেছনে লাগানো PU লেদার অর্গানাইজার, ট্যাবলেট পকেট, টিস্যু স্লট ও একাধিক স্টোরেজ কম্পার্টমেন্টসহ।',
  },
  sku: 'AB-7761',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Car Accessories', bn: 'কার অ্যাকসেসরিজ' },
    slug: 'car-accessories',
    parent: { name: { en: 'Auto & Bike Parts', bn: 'অটো ও বাইক পার্টস' }, slug: 'auto-parts' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-caraccessory.png',
      width: 800,
      height: 800,
      alt: { en: 'Car seat organiser, PU leather', bn: 'কার সিট অর্গানাইজার' },
      capturedAt: '2026-06-28',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 50, unitPrice: 32_000 },
      { minQty: 200, unitPrice: 29_000 },
      { minQty: 500, unitPrice: 26_000 },
    ],
    moq: 50,
    moqStep: 25,
    priceOnRequest: false,
  },
  variantAxes: ['Colour'],
  variants: [
    { id: 'co-blk', sku: 'AB-7761-BK', attributes: { Colour: 'Black' }, stock: 320 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Mounting', bn: 'মাউন্টিং' }, value: { en: 'Adjustable headrest straps' }, key: true },
    { group: 'technical', label: { en: 'Material', bn: 'ম্যাটেরিয়াল' }, value: { en: 'PU leather, rigid backing board' }, key: true },
    { group: 'technical', label: { en: 'Compartments', bn: 'কম্পার্টমেন্ট' }, value: { en: 'Tablet pocket, tissue slot, 4 storage pouches' } },
    { group: 'packaging', label: { en: 'Carton quantity', bn: 'কার্টনে সংখ্যা' }, value: { en: '50 pcs' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '50 pcs, in multiples of 25', bn: '50 পিস, 25-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 4 days from local stock', bn: 'স্থানীয় স্টক থেকে 4 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'One SKU that fits any car — it straps to the headrest posts rather than being moulded to a specific seat, which is what makes it sell across a mixed showroom of makes and models.',
        bn: 'যেকোনও গাড়িতে লাগে এমন একটি SKU — নির্দিষ্ট সিটের আকারে ঢালাই না করে হেডরেস্টের স্ট্যান্ডে স্ট্র্যাপ দিয়ে আটকায়, যা বিভিন্ন ব্র্যান্ড ও মডেলের মিশ্র শোরুমে বিক্রি সহজ করে।',
      },
    },
  ],
  logistics: { weightGrams: 620, cartonQty: 50, cartonDims: '48 × 38 × 30 cm', leadTimeDays: 4 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Dongguan Yijia Auto Accessories',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 5,
    verified: true,
  },
  rating: null,
  reviews: [],
  stats: { views: 1_540, ordersPlaced: 88 },
  tags: [],
  publishedAt: '2026-06-28',
};

const DUMBBELL: Product = {
  id: 'p-dumbbell',
  slug: 'dumbbell-pair-adjustable-20kg',
  title: {
    en: 'Adjustable dumbbell pair — 20 kg, rubber coated',
    bn: 'অ্যাডজাস্টেবল ডাম্বেল জোড়া — 20 কেজি, রাবার কোটেড',
  },
  shortDescription: {
    en: 'A rubber-coated adjustable dumbbell pair, 2–20 kg per hand, plate-loading with a quick-lock collar.',
    bn: 'রাবার-কোটেড অ্যাডজাস্টেবল ডাম্বেল জোড়া, প্রতি হাতে 2–20 কেজি, প্লেট-লোডিং, কুইক-লক কলারসহ।',
  },
  sku: 'AB-6602',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Fitness & Gym', bn: 'ফিটনেস ও জিম' },
    slug: 'fitness',
    parent: { name: { en: 'Sports & Outdoor', bn: 'স্পোর্টস ও আউটডোর' }, slug: 'sports-outdoor' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-dumbbell.png',
      width: 800,
      height: 800,
      alt: { en: 'Adjustable dumbbell pair, boxed', bn: 'অ্যাডজাস্টেবল ডাম্বেল জোড়া' },
      capturedAt: '2026-06-02',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 10, unitPrice: 320_000 },
      { minQty: 30, unitPrice: 295_000 },
      { minQty: 60, unitPrice: 270_000 },
    ],
    moq: 10,
    moqStep: 5,
    priceOnRequest: false,
  },
  variantAxes: ['Max weight'],
  variants: [
    { id: 'db-20', sku: 'AB-6602-20', attributes: { 'Max weight': '20 kg per hand' }, stock: 48 },
    { id: 'db-24', sku: 'AB-6602-24', attributes: { 'Max weight': '24 kg per hand' }, stock: 0, incoming: { qty: 60, days: 20 } },
  ],
  specifications: [
    { group: 'general', label: { en: 'Weight range', bn: 'ওজন সীমা' }, value: { en: '2–20 kg per hand, adjustable' }, key: true },
    { group: 'technical', label: { en: 'Coating', bn: 'কোটিং' }, value: { en: 'Rubber-coated plates, chrome bar' }, key: true },
    { group: 'technical', label: { en: 'Locking', bn: 'লকিং' }, value: { en: 'Quick-lock collar, no wrench needed' } },
    { group: 'packaging', label: { en: 'Sold as', bn: 'বিক্রয় একক' }, value: { en: 'Pair (2 units) per pc' }, key: true },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '10 pairs, in multiples of 5', bn: '10 জোড়া, 5-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 7 days — palletised freight', bn: 'প্যালেটাইজড ফ্রেইট, 7 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Heavier than most of what ships through this platform, so the lead time reflects palletised freight rather than a parcel courier — the product page prices that in rather than surprising a buyer at the shipping quote.',
        bn: 'এই প্ল্যাটফর্মে সাধারণত যা পাঠানো হয় তার চেয়ে ভারী, তাই লিড টাইমে পার্সেল কুরিয়ার নয়, প্যালেটাইজড ফ্রেইট ধরা হয়েছে — শিপিং কোটে গিয়ে ক্রেতাকে চমকে দেওয়ার বদলে পেজেই তা যোগ করা আছে।',
      },
    },
  ],
  logistics: { weightGrams: 20_400, cartonQty: 10, cartonDims: '60 × 50 × 45 cm', leadTimeDays: 7 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Xingtai Fitness Equipment Co.',
    region: { en: 'Hebei, China', bn: 'হেবেই, চীন' },
    platform: '1688',
    yearsActive: 6,
    verified: true,
  },
  rating: null,
  reviews: [],
  stats: { views: 1_280, ordersPlaced: 42 },
  tags: [],
  publishedAt: '2026-06-02',
};

const WATCH: Product = {
  id: 'p-watch',
  slug: 'mens-analog-watch-steel',
  title: {
    en: "Men's analog watch — stainless steel, 3 ATM",
    bn: 'পুরুষদের অ্যানালগ ঘড়ি — স্টেইনলেস স্টিল, 3 ATM',
  },
  shortDescription: {
    en: 'A stainless-steel analog watch, quartz movement, 3 ATM water resistance, ships in a branded gift box.',
    bn: 'স্টেইনলেস স্টিল অ্যানালগ ঘড়ি, কোয়ার্টজ মুভমেন্ট, 3 ATM ওয়াটার রেজিস্ট্যান্স, ব্র্যান্ডেড গিফট বক্সে আসে।',
  },
  sku: 'AB-5511',
  status: 'active',
  source: '1688',
  category: {
    name: { en: 'Watches', bn: 'ঘড়ি' },
    slug: 'watches',
    parent: { name: { en: 'Jewellery & Watches', bn: 'জুয়েলারি ও ঘড়ি' }, slug: 'jewellery-watches' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-watch.png',
      width: 800,
      height: 800,
      alt: { en: "Men's analog steel watch, boxed", bn: 'পুরুষদের স্টিল ঘড়ি' },
      capturedAt: '2026-05-15',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'pc',
    tiers: [
      { minQty: 50, unitPrice: 45_000 },
      { minQty: 200, unitPrice: 39_500 },
      { minQty: 500, unitPrice: 36_000 },
    ],
    moq: 50,
    moqStep: 25,
    priceOnRequest: false,
  },
  variantAxes: ['Dial colour'],
  variants: [
    { id: 'wt-blk', sku: 'AB-5511-BK', attributes: { 'Dial colour': 'Black' }, stock: 280 },
    { id: 'wt-blu', sku: 'AB-5511-BL', attributes: { 'Dial colour': 'Navy blue' }, stock: 160 },
    { id: 'wt-slv', sku: 'AB-5511-SV', attributes: { 'Dial colour': 'Silver' }, stock: 90 },
  ],
  specifications: [
    { group: 'general', label: { en: 'Case', bn: 'কেস' }, value: { en: 'Stainless steel, 42 mm' }, key: true },
    { group: 'technical', label: { en: 'Movement', bn: 'মুভমেন্ট' }, value: { en: 'Quartz, Miyota-compatible' }, key: true },
    { group: 'technical', label: { en: 'Water resistance', bn: 'ওয়াটার রেজিস্ট্যান্স' }, value: { en: '3 ATM (splash and rain)' }, key: true },
    { group: 'packaging', label: { en: 'Packaging', bn: 'প্যাকেজিং' }, value: { en: 'Branded gift box with cushion' } },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '50 pcs, in multiples of 25', bn: '50 পিস, 25-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Ships in 5 days from local stock', bn: 'স্থানীয় স্টক থেকে 5 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'A quartz movement rated for years of daily accuracy rather than the unbranded module that drifts within a season — the case and the movement are the two things a customer actually notices the difference between at this price band.',
        bn: 'এক মৌসুমেই সময় এলোমেলো হয়ে যাওয়া আনব্র্যান্ডেড মডিউল নয়, বছরের পর বছর নির্ভুল থাকার মতো কোয়ার্টজ মুভমেন্ট — এই দামের ঘড়িতে কেস ও মুভমেন্টই মূল পার্থক্য যা ক্রেতা টের পান।',
      },
    },
  ],
  logistics: { weightGrams: 96, cartonQty: 100, cartonDims: '40 × 32 × 28 cm', leadTimeDays: 5 },
  seller: ARCB2B_SOURCING,
  provenance: {
    factoryName: 'Shenzhen Junwei Watch Co.',
    region: { en: 'Guangdong, China', bn: 'গুয়াংডং, চীন' },
    platform: '1688',
    yearsActive: 8,
    verified: true,
  },
  rating: aggregate(WATCH_REVIEWS),
  reviews: WATCH_REVIEWS,
  stats: { views: 2_860, ordersPlaced: 130 },
  tags: [],
  publishedAt: '2026-05-15',
};

const FABRIC: Product = {
  id: 'p-fabric',
  slug: 'cotton-poplin-fabric-58in',
  title: {
    en: '100% cotton poplin fabric — 58 in width',
    bn: '100% কটন পপলিন কাপড় — 58 ইঞ্চি প্রস্থ',
  },
  shortDescription: {
    en: 'Plain-weave 100% cotton poplin, 58 in width, 120 gsm — sold by the metre off a running roll for garment production.',
    bn: 'প্লেইন-উইভ 100% কটন পপলিন, 58 ইঞ্চি প্রস্থ, 120 জিএসএম — গার্মেন্ট উৎপাদনের জন্য মিটার হিসাবে রোল থেকে বিক্রি।',
  },
  sku: 'MT-2201',
  status: 'active',
  source: 'manual',
  category: {
    name: { en: 'Cotton Fabric', bn: 'কটন কাপড়' },
    slug: 'cotton-fabric',
    parent: { name: { en: 'Fabric & Textiles', bn: 'কাপড় ও টেক্সটাইল' }, slug: 'textiles' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-fabric.png',
      width: 800,
      height: 800,
      alt: { en: 'Cotton poplin fabric roll', bn: 'কটন পপলিন কাপড়ের রোল' },
      capturedAt: '2026-04-20',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'metre',
    tiers: [
      { minQty: 100, unitPrice: 9_500 },
      { minQty: 500, unitPrice: 8_200 },
      { minQty: 2_000, unitPrice: 7_200 },
    ],
    moq: 100,
    moqStep: 50,
    priceOnRequest: false,
    samplePrice: 15_000,
    sampleQty: 3,
  },
  variantAxes: ['Colour'],
  variants: [
    { id: 'fb-white', sku: 'MT-2201-WHT', attributes: { Colour: 'Undyed white' }, stock: 4_200 },
    { id: 'fb-navy', sku: 'MT-2201-NVY', attributes: { Colour: 'Navy' }, stock: 1_800 },
    { id: 'fb-teal', sku: 'MT-2201-TEL', attributes: { Colour: 'Deep teal' }, stock: 0, incoming: { qty: 3_000, days: 12 } },
  ],
  specifications: [
    { group: 'general', label: { en: 'Width', bn: 'প্রস্থ' }, value: { en: '58 in (147 cm)' }, key: true },
    { group: 'general', label: { en: 'Weight', bn: 'ওজন' }, value: { en: '120 gsm' }, key: true },
    { group: 'technical', label: { en: 'Weave', bn: 'বুনন' }, value: { en: 'Plain weave, 100% cotton' } },
    { group: 'technical', label: { en: 'Shrinkage', bn: 'শ্রিংকেজ' }, value: { en: 'Under 3%, pre-washed' } },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '100 m, in multiples of 50 m', bn: '100 মিটার, 50 মিটারের গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Sample', bn: 'স্যাম্পল' }, value: { en: '৳150 for 3 m, credited against a 500 m order', bn: '3 মিটার 150 টাকা, 500 মিটার অর্ডারে সমন্বয়' } },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Cut from running roll, 3 days', bn: 'চলমান রোল থেকে কাটা, 3 দিনে' }, key: true },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Pre-washed and shrinkage-tested before it goes on the roll, so a garment cut to size does not come back a size smaller after the buyer\'s own wash. Undyed white is kept in volume for anyone dyeing to a custom shade downstream.',
        bn: 'রোলে ওঠার আগেই প্রি-ওয়াশড ও শ্রিংকেজ-টেস্টেড, তাই মাপ অনুযায়ী কাটা পোশাক ক্রেতার নিজের ধোয়ার পর ছোট হয়ে যায় না। কাস্টম শেডে রং করতে চাইলে ব্যবহারের জন্য আনডাইড সাদা ভলিউমে রাখা হয়।',
      },
    },
  ],
  logistics: { weightGrams: 176, cartonQty: 100, cartonDims: '120 × 25 × 25 cm (roll)', leadTimeDays: 3 },
  seller: MEGHNA_TEXTILES,
  rating: null,
  reviews: [],
  stats: { views: 1_960, ordersPlaced: 74 },
  tags: [],
  publishedAt: '2026-04-20',
};

const KIDS_TSHIRT: Product = {
  id: 'p-kids-tshirt',
  slug: 'kids-cotton-tshirt-set-assorted',
  title: {
    en: 'Kids cotton t-shirt set — assorted prints, by the dozen',
    bn: 'শিশুদের কটন টি-শার্ট সেট — বিভিন্ন প্রিন্ট, ডজন হিসাবে',
  },
  shortDescription: {
    en: '100% cotton kids t-shirts in assorted screen prints, sold and produced by the dozen across sizes 2–8 years.',
    bn: '100% কটন শিশুদের টি-শার্ট, বিভিন্ন স্ক্রিন প্রিন্টে, 2–8 বছরের সাইজে ডজন হিসাবে বিক্রি ও উৎপাদিত।',
  },
  sku: 'MT-2260',
  status: 'active',
  source: 'manual',
  category: {
    name: { en: 'Kids Wear', bn: 'শিশুদের পোশাক' },
    slug: 'kids-wear',
    parent: { name: { en: 'Apparel & Garments', bn: 'পোশাক ও গার্মেন্টস' }, slug: 'apparel' },
  },
  media: [
    {
      kind: 'studio',
      src: '/media/card-kidstshirt.png',
      width: 800,
      height: 800,
      alt: { en: 'Kids cotton t-shirt, printed', bn: 'শিশুদের কটন টি-শার্ট' },
      capturedAt: '2026-04-28',
    },
  ],
  pricing: {
    currency: 'BDT',
    unit: 'dozen',
    tiers: [
      { minQty: 10, unitPrice: 145_000 },
      { minQty: 50, unitPrice: 132_000 },
      { minQty: 150, unitPrice: 120_000 },
    ],
    moq: 10,
    moqStep: 5,
    priceOnRequest: false,
    samplePrice: 18_000,
    sampleQty: 1,
  },
  variantAxes: ['Size range'],
  variants: [
    { id: 'kt-2-3', sku: 'MT-2260-23', attributes: { 'Size range': '2–3 yrs' }, stock: 0, incoming: { qty: 80, days: 14 } },
    { id: 'kt-4-5', sku: 'MT-2260-45', attributes: { 'Size range': '4–5 yrs' }, stock: 0, incoming: { qty: 120, days: 14 } },
    { id: 'kt-6-8', sku: 'MT-2260-68', attributes: { 'Size range': '6–8 yrs' }, stock: 0, incoming: { qty: 100, days: 18 } },
  ],
  specifications: [
    { group: 'general', label: { en: 'Sizes', bn: 'সাইজ' }, value: { en: '2–3, 4–5, 6–8 years' }, key: true },
    { group: 'general', label: { en: 'Fabric', bn: 'ফ্যাব্রিক' }, value: { en: '100% cotton, 160 gsm single jersey' }, key: true },
    { group: 'technical', label: { en: 'Print', bn: 'প্রিন্ট' }, value: { en: 'Screen print, water-based ink' } },
    { group: 'trade', label: { en: 'Minimum order', bn: 'সর্বনিম্ন অর্ডার' }, value: { en: '10 dozen, in multiples of 5', bn: '10 ডজন, 5-এর গুণিতকে' }, key: true },
    { group: 'trade', label: { en: 'Lead time', bn: 'লিড টাইম' }, value: { en: 'Produced to order, 14–18 days', bn: 'অর্ডারে তৈরি, 14–18 দিন' }, key: true },
    { group: 'trade', label: { en: 'Custom print', bn: 'কাস্টম প্রিন্ট' }, value: { en: 'Own design from 50 dozen', bn: '50 ডজন থেকে নিজস্ব ডিজাইন' } },
  ],
  description: [
    {
      type: 'paragraph',
      text: {
        en: 'Sold and produced by the dozen because that is the actual unit a kidswear stall restocks in — a size-mixed dozen across the three ranges keeps a small shop from tying up capital in a size nobody is buying that week.',
        bn: 'ডজন হিসাবে বিক্রি ও উৎপাদিত হয়, কারণ শিশুদের পোশাকের দোকান আসলে এই এককেই স্টক নেয় — তিনটি সাইজ মিলিয়ে এক ডজন নিলে ছোট দোকানের পুঁজি এমন সাইজে আটকে থাকে না যা সেই সপ্তাহে কেউ কিনছে না।',
      },
    },
  ],
  logistics: { weightGrams: 1_440, cartonQty: 10, cartonDims: '50 × 40 × 35 cm', leadTimeDays: 14, sourcingDays: [14, 18] },
  customisation: { customPackagingMoq: 600, privateLabelMoq: 600 },
  seller: MEGHNA_TEXTILES,
  rating: null,
  reviews: [],
  stats: { views: 1_420, ordersPlaced: 0 },
  tags: [],
  publishedAt: '2026-04-28',
};

export const PRODUCTS: Product[] = [
  EARBUDS,
  KURTI,
  LED_PANEL,
  PHONE_CASE,
  SPEAKER,
  CABLE,
  PACKAGING,
  POWERBANK,
  SMARTWATCH,
  TRIPOD,
  COOKWARE,
  SERUM,
  NOTEBOOK,
  BACKPACK,
  BLOCKS,
  TOOLKIT,
  FASTENERS,
  CAR_ORGANISER,
  DUMBBELL,
  WATCH,
  FABRIC,
  KIDS_TSHIRT,
];

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

/**
 * Every card the catalogue has, derived from `PRODUCTS` and nothing else — a
 * card that exists but has no product behind it is a link that 404s, which is
 * exactly the bug this file used to ship (see the note above `PACKAGING`).
 */
export const ALL_CARDS: ProductCard[] = PRODUCTS.map(toCard);

/**
 * Curated co-purchase set for the "frequently bought together" rail. In
 * production this comes from order co-occurrence; hard-coding it here keeps the
 * rail honest about being a fixture rather than pretending to be a model.
 */
export const BOUGHT_TOGETHER: Record<string, string[]> = {
  'tws-earbuds-pro-x': ['usb-c-braided-cable-1m', 'retail-blister-box-blank', 'phone-case-tpu-clear'],
  'phone-case-tpu-clear': ['usb-c-braided-cable-1m', 'retail-blister-box-blank'],
  'kurti-cotton-block-print': ['cotton-poplin-fabric-58in'],
  'cookware-set-nonstick-3pc': [],
  'mens-analog-watch-steel': [],
};

export { ARCB2B_SOURCING, MEGHNA_TEXTILES, RIDDHI_IMPORTS, DHAKA_PACK_HOUSE };
