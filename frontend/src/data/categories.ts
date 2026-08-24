import type { Bilingual } from '@/lib/types';

/**
 * The category taxonomy — two levels, twenty main categories.
 *
 * This is the spine of browse. The header's All Categories panel, the
 * `/categories` directory, every `/category/[slug]` page and the home page tiles
 * all read this one structure, so a category cannot exist in the menu and be
 * missing from the directory, and a subcategory link can never 404.
 *
 * Sized to the PRD's "20+ product categories" and chosen for what actually moves
 * through Bangladeshi wholesale — mobile accessories and apparel carry the
 * volume, so they get the deepest subcategory trees.
 *
 * `productCount` is a display figure that would come from the catalogue
 * aggregate in production. It is summed upward from the subcategories rather
 * than stored twice, so a main category's count can never disagree with its
 * children.
 */

/** Icon keys are resolved to components in the UI layer, keeping this file pure. */
export type CategoryIcon =
  | 'electronics'
  | 'mobile'
  | 'apparel'
  | 'home'
  | 'beauty'
  | 'lighting'
  | 'packaging'
  | 'stationery'
  | 'footwear'
  | 'toys'
  | 'hardware'
  | 'auto'
  | 'sports'
  | 'jewellery'
  | 'textiles'
  | 'food'
  | 'agriculture'
  | 'medical'
  | 'furniture'
  | 'machinery';

export interface Subcategory {
  slug: string;
  name: Bilingual;
  productCount: number;
}

export interface MainCategory {
  slug: string;
  name: Bilingual;
  /** One line for the directory card and the category page header. */
  blurb: Bilingual;
  icon: CategoryIcon;
  /** Promoted into the header rail and the home page tiles. */
  featured: boolean;
  subcategories: Subcategory[];
}

const sub = (slug: string, en: string, bn: string, productCount: number): Subcategory => ({
  slug,
  name: { en, bn },
  productCount,
});

export const CATEGORIES: MainCategory[] = [
  {
    slug: 'electronics',
    name: { en: 'Consumer Electronics', bn: 'কনজিউমার ইলেকট্রনিক্স' },
    blurb: {
      en: 'Audio, wearables and small electronics, retail-boxed and ready for the counter.',
      bn: 'অডিও, ওয়্যারেবল ও ছোট ইলেকট্রনিক্স — রিটেইল বক্সে, কাউন্টারের জন্য প্রস্তুত।',
    },
    icon: 'electronics',
    featured: true,
    subcategories: [
      sub('earphones-headsets', 'Earphones & Headsets', 'ইয়ারফোন ও হেডসেট', 1842),
      sub('bluetooth-speakers', 'Bluetooth Speakers', 'ব্লুটুথ স্পিকার', 736),
      sub('smartwatches', 'Smartwatches & Bands', 'স্মার্টওয়াচ ও ব্যান্ড', 618),
      sub('power-banks', 'Power Banks', 'পাওয়ার ব্যাংক', 494),
      sub('chargers-adapters', 'Chargers & Adapters', 'চার্জার ও অ্যাডাপ্টার', 1120),
      sub('computer-peripherals', 'Computer Peripherals', 'কম্পিউটার পেরিফেরাল', 402),
      sub('cctv-security', 'CCTV & Security', 'সিসিটিভি ও নিরাপত্তা', 288),
    ],
  },
  {
    slug: 'mobile-accessories',
    name: { en: 'Mobile Accessories', bn: 'মোবাইল অ্যাকসেসরিজ' },
    blurb: {
      en: 'The fast-turnover counter lines — cases, glass, cables and repair parts.',
      bn: 'দ্রুত বিক্রি হওয়া পণ্য — কেস, গ্লাস, কেবল ও রিপেয়ার পার্টস।',
    },
    icon: 'mobile',
    featured: true,
    subcategories: [
      sub('phone-cases', 'Phone Cases', 'ফোন কেস', 2410),
      sub('screen-protectors', 'Screen Protectors', 'স্ক্রিন প্রোটেক্টর', 1180),
      sub('cables-connectors', 'Cables & Connectors', 'কেবল ও কানেক্টর', 1364),
      sub('holders-mounts', 'Holders & Mounts', 'হোল্ডার ও মাউন্ট', 512),
      sub('repair-parts', 'Repair Parts', 'রিপেয়ার পার্টস', 806),
      sub('selfie-tripods', 'Selfie Sticks & Tripods', 'সেলফি স্টিক ও ট্রাইপড', 344),
    ],
  },
  {
    slug: 'apparel',
    name: { en: 'Apparel & Garments', bn: 'পোশাক ও গার্মেন্টস' },
    blurb: {
      en: 'Made-to-order and stock lots, cut in your size ratio by Bangladeshi workshops.',
      bn: 'অর্ডারে তৈরি ও স্টক লট — বাংলাদেশি ওয়ার্কশপে আপনার সাইজ অনুপাতে।',
    },
    icon: 'apparel',
    featured: true,
    subcategories: [
      sub('kurti-tunics', "Women's Kurti & Tunics", 'কুর্তি ও টিউনিক', 1520),
      sub('sarees', 'Sarees', 'শাড়ি', 980),
      sub('mens-shirts', "Men's Shirts", 'পুরুষদের শার্ট', 1244),
      sub('t-shirts', 'T-shirts & Polos', 'টি-শার্ট ও পোলো', 1688),
      sub('kids-wear', 'Kids Wear', 'শিশুদের পোশাক', 742),
      sub('winter-wear', 'Winter Wear', 'শীতের পোশাক', 610),
      sub('panjabi', 'Panjabi & Ethnic', 'পাঞ্জাবি ও এথনিক', 528),
      sub('undergarments', 'Undergarments & Socks', 'অন্তর্বাস ও মোজা', 466),
    ],
  },
  {
    slug: 'home-kitchen',
    name: { en: 'Home & Kitchen', bn: 'হোম ও কিচেন' },
    blurb: {
      en: 'Cookware, storage and small appliances in carton quantities.',
      bn: 'কুকওয়্যার, স্টোরেজ ও ছোট অ্যাপ্লায়েন্স — কার্টন পরিমাণে।',
    },
    icon: 'home',
    featured: true,
    subcategories: [
      sub('cookware', 'Cookware & Bakeware', 'কুকওয়্যার ও বেকওয়্যার', 862),
      sub('storage-organisers', 'Storage & Organisers', 'স্টোরেজ ও অর্গানাইজার', 704),
      sub('tableware', 'Tableware & Glassware', 'টেবিলওয়্যার ও গ্লাসওয়্যার', 596),
      sub('small-appliances', 'Small Appliances', 'ছোট অ্যাপ্লায়েন্স', 438),
      sub('cleaning-supplies', 'Cleaning Supplies', 'পরিচ্ছন্নতা সামগ্রী', 512),
      sub('home-decor', 'Home Decor', 'হোম ডেকর', 634),
    ],
  },
  {
    slug: 'beauty',
    name: { en: 'Beauty & Personal Care', bn: 'বিউটি ও পার্সোনাল কেয়ার' },
    blurb: {
      en: 'Cosmetics, hair and skin lines with import documentation in order.',
      bn: 'কসমেটিকস, হেয়ার ও স্কিন — ইম্পোর্ট ডকুমেন্টেশনসহ।',
    },
    icon: 'beauty',
    featured: true,
    subcategories: [
      sub('skincare', 'Skincare', 'স্কিনকেয়ার', 924),
      sub('haircare', 'Haircare', 'হেয়ারকেয়ার', 688),
      sub('makeup', 'Makeup & Cosmetics', 'মেকআপ ও কসমেটিকস', 1136),
      sub('fragrances', 'Fragrances', 'সুগন্ধি', 402),
      sub('grooming-tools', 'Grooming Tools', 'গ্রুমিং টুলস', 356),
      sub('salon-supplies', 'Salon Supplies', 'সেলুন সামগ্রী', 274),
    ],
  },
  {
    slug: 'lighting',
    name: { en: 'Lighting & Electrical', bn: 'লাইটিং ও ইলেকট্রিক্যাল' },
    blurb: {
      en: 'Project-priced LED and switchgear, quoted against your bill of quantities.',
      bn: 'প্রকল্প-ভিত্তিক এলইডি ও সুইচগিয়ার — বিল অফ কোয়ান্টিটি অনুযায়ী কোট।',
    },
    icon: 'lighting',
    featured: true,
    subcategories: [
      sub('panel-lights', 'Ceiling & Panel Lights', 'সিলিং ও প্যানেল লাইট', 486),
      sub('bulbs-tubes', 'Bulbs & Tubes', 'বাল্ব ও টিউব', 622),
      sub('decorative-lighting', 'Decorative Lighting', 'ডেকোরেটিভ লাইটিং', 398),
      sub('switches-sockets', 'Switches & Sockets', 'সুইচ ও সকেট', 544),
      sub('wires-cables', 'Wires & Cables', 'ওয়্যার ও কেবল', 312),
      sub('solar', 'Solar & Inverters', 'সোলার ও ইনভার্টার', 208),
    ],
  },
  {
    slug: 'packaging',
    name: { en: 'Packaging & Printing', bn: 'প্যাকেজিং ও প্রিন্টিং' },
    blurb: {
      en: 'Boxes, bags and labels — blank stock or printed with your artwork.',
      bn: 'বক্স, ব্যাগ ও লেবেল — ব্লাঙ্ক বা আপনার আর্টওয়ার্কে প্রিন্ট।',
    },
    icon: 'packaging',
    featured: true,
    subcategories: [
      sub('cartons-boxes', 'Cartons & Boxes', 'কার্টন ও বক্স', 468),
      sub('poly-bags', 'Poly & Courier Bags', 'পলি ও কুরিয়ার ব্যাগ', 386),
      sub('labels-stickers', 'Labels & Stickers', 'লেবেল ও স্টিকার', 512),
      sub('tapes-wrap', 'Tapes & Wrap', 'টেপ ও র‍্যাপ', 264),
      sub('retail-packaging', 'Retail Packaging', 'রিটেইল প্যাকেজিং', 342),
    ],
  },
  {
    slug: 'stationery',
    name: { en: 'Stationery & Office', bn: 'স্টেশনারি ও অফিস' },
    blurb: {
      en: 'School and office supplies, priced for institutional volume.',
      bn: 'স্কুল ও অফিস সামগ্রী — প্রাতিষ্ঠানিক পরিমাণে মূল্য।',
    },
    icon: 'stationery',
    featured: false,
    subcategories: [
      sub('writing-instruments', 'Pens & Pencils', 'কলম ও পেন্সিল', 624),
      sub('notebooks-paper', 'Notebooks & Paper', 'খাতা ও কাগজ', 588),
      sub('school-supplies', 'School Supplies', 'স্কুল সামগ্রী', 476),
      sub('office-equipment', 'Office Equipment', 'অফিস সরঞ্জাম', 302),
      sub('art-craft', 'Art & Craft', 'আর্ট ও ক্রাফট', 358),
    ],
  },
  {
    slug: 'footwear-bags',
    name: { en: 'Footwear & Bags', bn: 'ফুটওয়্যার ও ব্যাগ' },
    blurb: {
      en: 'Sandals, sneakers, school bags and luggage in size-ratio packs.',
      bn: 'স্যান্ডেল, স্নিকার, স্কুল ব্যাগ ও লাগেজ — সাইজ অনুপাতে প্যাক।',
    },
    icon: 'footwear',
    featured: true,
    subcategories: [
      sub('mens-footwear', "Men's Footwear", 'পুরুষদের ফুটওয়্যার', 812),
      sub('womens-footwear', "Women's Footwear", 'মহিলাদের ফুটওয়্যার', 946),
      sub('kids-footwear', "Kids' Footwear", 'শিশুদের ফুটওয়্যার', 528),
      sub('backpacks', 'Backpacks & School Bags', 'ব্যাকপ্যাক ও স্কুল ব্যাগ', 664),
      sub('handbags', 'Handbags & Wallets', 'হ্যান্ডব্যাগ ও ওয়ালেট', 738),
      sub('luggage', 'Luggage & Trolleys', 'লাগেজ ও ট্রলি', 246),
    ],
  },
  {
    slug: 'toys-baby',
    name: { en: 'Toys & Baby', bn: 'খেলনা ও শিশু' },
    blurb: {
      en: 'Toys, baby care and nursery goods with safety certification on file.',
      bn: 'খেলনা, বেবি কেয়ার ও নার্সারি — সেফটি সার্টিফিকেশনসহ।',
    },
    icon: 'toys',
    featured: false,
    subcategories: [
      sub('educational-toys', 'Educational Toys', 'শিক্ষামূলক খেলনা', 542),
      sub('remote-toys', 'Remote & Battery Toys', 'রিমোট ও ব্যাটারি খেলনা', 468),
      sub('soft-toys', 'Soft Toys', 'সফট টয়', 386),
      sub('baby-care', 'Baby Care', 'বেবি কেয়ার', 594),
      sub('nursery', 'Nursery & Furniture', 'নার্সারি ও ফার্নিচার', 218),
    ],
  },
  {
    slug: 'hardware-tools',
    name: { en: 'Hardware & Tools', bn: 'হার্ডওয়্যার ও টুলস' },
    blurb: {
      en: 'Hand tools, power tools and fasteners for trade counters.',
      bn: 'হ্যান্ড টুল, পাওয়ার টুল ও ফাসেনার — ট্রেড কাউন্টারের জন্য।',
    },
    icon: 'hardware',
    featured: false,
    subcategories: [
      sub('hand-tools', 'Hand Tools', 'হ্যান্ড টুলস', 686),
      sub('power-tools', 'Power Tools', 'পাওয়ার টুলস', 424),
      sub('fasteners', 'Fasteners & Fittings', 'ফাসেনার ও ফিটিংস', 812),
      sub('plumbing', 'Plumbing', 'প্লাম্বিং', 386),
      sub('paint-adhesives', 'Paint & Adhesives', 'পেইন্ট ও আঠা', 294),
    ],
  },
  {
    slug: 'auto-parts',
    name: { en: 'Auto & Bike Parts', bn: 'অটো ও বাইক পার্টস' },
    blurb: {
      en: 'Two-wheeler and light-vehicle parts, accessories and consumables.',
      bn: 'বাইক ও হালকা যানবাহনের পার্টস, অ্যাকসেসরিজ ও কনজিউমেবল।',
    },
    icon: 'auto',
    featured: false,
    subcategories: [
      sub('bike-parts', 'Motorcycle Parts', 'মোটরসাইকেল পার্টস', 728),
      sub('car-accessories', 'Car Accessories', 'কার অ্যাকসেসরিজ', 546),
      sub('lubricants', 'Lubricants & Fluids', 'লুব্রিকেন্ট ও ফ্লুইড', 218),
      sub('tyres-tubes', 'Tyres & Tubes', 'টায়ার ও টিউব', 264),
      sub('helmets-safety', 'Helmets & Riding Gear', 'হেলমেট ও রাইডিং গিয়ার', 336),
    ],
  },
  {
    slug: 'sports-outdoor',
    name: { en: 'Sports & Outdoor', bn: 'স্পোর্টস ও আউটডোর' },
    blurb: {
      en: 'Cricket, football, fitness and outdoor equipment by the carton.',
      bn: 'ক্রিকেট, ফুটবল, ফিটনেস ও আউটডোর সরঞ্জাম — কার্টনে।',
    },
    icon: 'sports',
    featured: false,
    subcategories: [
      sub('cricket', 'Cricket', 'ক্রিকেট', 386),
      sub('football', 'Football', 'ফুটবল', 264),
      sub('fitness', 'Fitness & Gym', 'ফিটনেস ও জিম', 498),
      sub('outdoor-camping', 'Outdoor & Camping', 'আউটডোর ও ক্যাম্পিং', 212),
      sub('cycles', 'Cycles & Parts', 'সাইকেল ও পার্টস', 188),
    ],
  },
  {
    slug: 'jewellery-watches',
    name: { en: 'Jewellery & Watches', bn: 'জুয়েলারি ও ঘড়ি' },
    blurb: {
      en: 'Imitation jewellery, watches and hair accessories in mixed lots.',
      bn: 'ইমিটেশন জুয়েলারি, ঘড়ি ও হেয়ার অ্যাকসেসরিজ — মিক্সড লটে।',
    },
    icon: 'jewellery',
    featured: false,
    subcategories: [
      sub('imitation-jewellery', 'Imitation Jewellery', 'ইমিটেশন জুয়েলারি', 1246),
      sub('watches', 'Watches', 'ঘড়ি', 588),
      sub('hair-accessories', 'Hair Accessories', 'হেয়ার অ্যাকসেসরিজ', 464),
      sub('sunglasses', 'Sunglasses & Frames', 'সানগ্লাস ও ফ্রেম', 372),
    ],
  },
  {
    slug: 'textiles',
    name: { en: 'Fabric & Textiles', bn: 'কাপড় ও টেক্সটাইল' },
    blurb: {
      en: 'Woven and knit fabric by the roll, plus trims and accessories.',
      bn: 'রোলে ওভেন ও নিট কাপড়, সঙ্গে ট্রিম ও অ্যাকসেসরিজ।',
    },
    icon: 'textiles',
    featured: false,
    subcategories: [
      sub('cotton-fabric', 'Cotton Fabric', 'কটন কাপড়', 686),
      sub('synthetic-fabric', 'Synthetic Fabric', 'সিনথেটিক কাপড়', 512),
      sub('lace-trims', 'Lace & Trims', 'লেস ও ট্রিম', 398),
      sub('threads-zippers', 'Threads & Zippers', 'সুতা ও জিপার', 342),
      sub('home-textiles', 'Home Textiles', 'হোম টেক্সটাইল', 468),
    ],
  },
  {
    slug: 'food-beverage',
    name: { en: 'Food & Beverage Supplies', bn: 'খাদ্য ও পানীয় সামগ্রী' },
    blurb: {
      en: 'Dry goods, disposables and kitchen supplies for restaurants and retail.',
      bn: 'ড্রাই গুডস, ডিসপোজেবল ও কিচেন সামগ্রী — রেস্টুরেন্ট ও রিটেইলের জন্য।',
    },
    icon: 'food',
    featured: false,
    subcategories: [
      sub('dry-goods', 'Dry Goods & Spices', 'ড্রাই গুডস ও মসলা', 424),
      sub('beverages', 'Beverages', 'পানীয়', 286),
      sub('disposables', 'Disposables & Takeaway', 'ডিসপোজেবল ও টেকঅ্যাওয়ে', 512),
      sub('bakery-supplies', 'Bakery Supplies', 'বেকারি সামগ্রী', 238),
      sub('commercial-kitchen', 'Commercial Kitchen', 'কমার্শিয়াল কিচেন', 164),
    ],
  },
  {
    slug: 'agriculture',
    name: { en: 'Agriculture & Garden', bn: 'কৃষি ও বাগান' },
    blurb: {
      en: 'Seeds, irrigation, tools and greenhouse supplies.',
      bn: 'বীজ, সেচ, সরঞ্জাম ও গ্রিনহাউস সামগ্রী।',
    },
    icon: 'agriculture',
    featured: false,
    subcategories: [
      sub('seeds-saplings', 'Seeds & Saplings', 'বীজ ও চারা', 268),
      sub('irrigation', 'Irrigation', 'সেচ', 186),
      sub('farm-tools', 'Farm Tools', 'কৃষি সরঞ্জাম', 324),
      sub('greenhouse', 'Greenhouse & Nets', 'গ্রিনহাউস ও নেট', 142),
      sub('poultry-fisheries', 'Poultry & Fisheries', 'পোল্ট্রি ও মৎস্য', 214),
    ],
  },
  {
    slug: 'medical-safety',
    name: { en: 'Medical & Safety', bn: 'মেডিক্যাল ও সেফটি' },
    blurb: {
      en: 'Disposables, diagnostics and industrial safety wear.',
      bn: 'ডিসপোজেবল, ডায়াগনস্টিক ও ইন্ডাস্ট্রিয়াল সেফটি পোশাক।',
    },
    icon: 'medical',
    featured: false,
    subcategories: [
      sub('medical-disposables', 'Medical Disposables', 'মেডিক্যাল ডিসপোজেবল', 386),
      sub('diagnostics', 'Diagnostics', 'ডায়াগনস্টিক', 218),
      sub('safety-wear', 'Safety Wear', 'সেফটি পোশাক', 442),
      sub('first-aid', 'First Aid', 'ফার্স্ট এইড', 164),
      sub('mobility-aids', 'Mobility Aids', 'মোবিলিটি এইড', 128),
    ],
  },
  {
    slug: 'furniture',
    name: { en: 'Furniture & Fixtures', bn: 'ফার্নিচার ও ফিক্সচার' },
    blurb: {
      en: 'Office, retail and home furniture, flat-packed for courier or freight.',
      bn: 'অফিস, রিটেইল ও হোম ফার্নিচার — ফ্ল্যাট প্যাকে কুরিয়ার বা ফ্রেইটে।',
    },
    icon: 'furniture',
    featured: false,
    subcategories: [
      sub('office-furniture', 'Office Furniture', 'অফিস ফার্নিচার', 264),
      sub('retail-fixtures', 'Retail Fixtures & Racks', 'রিটেইল ফিক্সচার ও র‍্যাক', 318),
      sub('home-furniture', 'Home Furniture', 'হোম ফার্নিচার', 386),
      sub('mattresses', 'Mattresses & Bedding', 'ম্যাট্রেস ও বিছানা', 172),
    ],
  },
  {
    slug: 'machinery',
    name: { en: 'Industrial Machinery', bn: 'ইন্ডাস্ট্রিয়াল মেশিনারি' },
    blurb: {
      en: 'Garment, packaging and food machinery — quoted with spares and install.',
      bn: 'গার্মেন্ট, প্যাকেজিং ও ফুড মেশিনারি — স্পেয়ার ও ইনস্টলেশনসহ কোট।',
    },
    icon: 'machinery',
    featured: false,
    subcategories: [
      sub('garment-machinery', 'Garment Machinery', 'গার্মেন্ট মেশিনারি', 218),
      sub('packaging-machinery', 'Packaging Machinery', 'প্যাকেজিং মেশিনারি', 164),
      sub('food-machinery', 'Food Machinery', 'ফুড মেশিনারি', 142),
      sub('printing-machinery', 'Printing Machinery', 'প্রিন্টিং মেশিনারি', 118),
      sub('spare-parts', 'Spares & Consumables', 'স্পেয়ার ও কনজিউমেবল', 286),
    ],
  },
];

/* ------------------------------------------------------------------ lookups */

/** Summed from the children so the two figures can never disagree. */
export function categoryProductCount(category: MainCategory): number {
  return category.subcategories.reduce((sum, s) => sum + s.productCount, 0);
}

export const TOTAL_CATEGORY_COUNT = CATEGORIES.length;
export const TOTAL_SUBCATEGORY_COUNT = CATEGORIES.reduce(
  (sum, c) => sum + c.subcategories.length,
  0,
);
export const TOTAL_PRODUCT_COUNT = CATEGORIES.reduce((sum, c) => sum + categoryProductCount(c), 0);

export interface CategoryMatch {
  main: MainCategory;
  /** Present when the slug named a subcategory rather than a main category. */
  sub?: Subcategory;
}

/**
 * Resolves a slug against both levels in one call.
 *
 * `/category/[slug]` serves main categories and subcategories from the same
 * route, so the page needs one lookup that says which it found and, for a
 * subcategory, what its parent is — otherwise every caller reimplements the
 * search and the breadcrumb drifts out of step with the heading.
 */
export function findCategory(slug: string): CategoryMatch | null {
  const main = CATEGORIES.find((c) => c.slug === slug);
  if (main) return { main };

  for (const candidate of CATEGORIES) {
    const found = candidate.subcategories.find((s) => s.slug === slug);
    if (found) return { main: candidate, sub: found };
  }
  return null;
}

export function featuredCategories(): MainCategory[] {
  return CATEGORIES.filter((c) => c.featured);
}

/** Every slug at both levels — used by `generateStaticParams`. */
export function allCategorySlugs(): string[] {
  return CATEGORIES.flatMap((c) => [c.slug, ...c.subcategories.map((s) => s.slug)]);
}
