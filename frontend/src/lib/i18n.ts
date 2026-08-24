import type { Bilingual, Lang } from './types';

/**
 * Localisation.
 *
 * The locale is a route segment (`/en/...`, `/bn/...`), not client state. That
 * choice is what lets every bilingual string render on the server: the page
 * stays fully static per language, `<html lang>` is correct, `hreflang`
 * alternates come for free, and the product page ships no i18n JavaScript at
 * all. Switching language is a navigation — which is the honest behaviour for
 * a localised site, and keeps the two versions independently indexable.
 *
 * Strings are stored with both scripts side by side rather than in two parallel
 * files, so a translator (or a reviewer) sees the pair together and neither can
 * silently drift.
 */

export const LOCALES = ['en', 'bn'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Resolves a bilingual value, falling back to English when `bn` is absent. */
export function pick(value: Bilingual | undefined, lang: Lang): string {
  if (!value) return '';
  return (lang === 'bn' ? value.bn : value.en) || value.en;
}

const STRINGS = {
  /* ---------------------------------------------------------------- chrome */
  'brand.tagline': {
    en: "Bangladesh's wholesale sourcing marketplace",
    bn: 'বাংলাদেশের পাইকারি সোর্সিং মার্কেটপ্লেস',
  },
  'chrome.skipToContent': { en: 'Skip to product details', bn: 'পণ্যের বিবরণে যান' },
  'chrome.deliverTo': { en: 'Deliver to', bn: 'ডেলিভারি' },
  'chrome.howItWorks': { en: 'How it works', bn: 'কীভাবে কাজ করে' },
  'chrome.myOrders': { en: 'My orders', bn: 'আমার অর্ডার' },
  'chrome.sellOnArcB2B': { en: 'Sell on ArcB2B', bn: 'ArcB2B-এ বিক্রি' },
  'chrome.help': { en: 'Help', bn: 'সহায়তা' },
  'chrome.searchPlaceholder': { en: 'What are you sourcing today?', bn: 'আজ কী সোর্স করছেন?' },
  'chrome.searchLabel': { en: 'Search products', bn: 'পণ্য খুঁজুন' },
  'chrome.searchScope': { en: 'Search within', bn: 'এর মধ্যে খুঁজুন' },
  'chrome.searchAll': { en: 'All categories', bn: 'সব ক্যাটাগরি' },
  'chrome.search': { en: 'Search', bn: 'খুঁজুন' },
  'chrome.trending': { en: 'Trending', bn: 'ট্রেন্ডিং' },
  'chrome.allCategories': { en: 'All Categories', bn: 'সব ক্যাটাগরি' },
  'chrome.flashDeals': { en: 'Volume Deals', bn: 'ভলিউম ডিল' },
  'chrome.requestQuote': { en: 'Request a Quote', bn: 'কোটেশন অনুরোধ' },
  'chrome.messages': { en: 'Messages', bn: 'বার্তা' },
  'chrome.notifications': { en: 'Notifications', bn: 'নোটিফিকেশন' },
  'chrome.cart': { en: 'Cart', bn: 'কার্ট' },
  'chrome.account': { en: 'Account', bn: 'অ্যাকাউন্ট' },
  'chrome.signIn': { en: 'Sign in', bn: 'সাইন ইন' },
  'chrome.joinFree': { en: 'Join free', bn: 'ফ্রি জয়েন' },
  'chrome.home': { en: 'Home', bn: 'হোম' },
  'chrome.categories': { en: 'Categories', bn: 'ক্যাটাগরি' },
  'chrome.theme': { en: 'Switch colour theme', bn: 'থিম পরিবর্তন' },
  'chrome.language': { en: 'Language', bn: 'ভাষা' },
  'chrome.backToResults': { en: 'Back to results', bn: 'ফলাফলে ফিরুন' },
  'chrome.breadcrumb': { en: 'Breadcrumb', bn: 'ব্রেডক্রাম্ব' },
  'chrome.fullPath': { en: 'Show full path', bn: 'সম্পূর্ণ পথ' },

  /* --------------------------------------------------------------- summary */
  'product.sold': { en: 'sold', bn: 'বিক্রি' },
  'product.reviews': { en: 'reviews', bn: 'রিভিউ' },
  'product.noReviewsYet': { en: 'No reviews yet', bn: 'এখনও কোনও রিভিউ নেই' },
  'product.sku': { en: 'SKU', bn: 'এসকেইউ' },
  'product.keyAttributes': { en: 'At a glance', bn: 'এক নজরে' },
  'product.fullSpecs': { en: 'Full specifications', bn: 'সম্পূর্ণ স্পেসিফিকেশন' },
  'product.localStock': { en: 'Local stock', bn: 'স্থানীয় স্টক' },
  'product.sourcedToOrder': { en: 'Sourced to order', bn: 'অর্ডারে সোর্সিং' },
  'product.dispatch': { en: 'dispatch', bn: 'ডেলিভারি' },
  'product.bestSeller': { en: 'Best seller', bn: 'বেস্ট সেলার' },
  'product.new': { en: 'New', bn: 'নতুন' },
  'product.factoryDirect': { en: 'Factory direct', bn: 'ফ্যাক্টরি ডাইরেক্ট' },
  'product.lowStock': { en: 'Low stock', bn: 'স্টক কম' },
  'product.outOfStock': { en: 'Out of stock', bn: 'স্টক শেষ' },

  /* --------------------------------------------------------------- gallery */
  'gallery.zoomHint': { en: 'Hover to zoom', bn: 'জুম করতে হোভার' },
  'gallery.zoomUnavailable': { en: 'Zoom unavailable', bn: 'জুম নেই' },
  'gallery.fullscreen': { en: 'View fullscreen', bn: 'ফুলস্ক্রিন' },
  'gallery.close': { en: 'Close', bn: 'বন্ধ' },
  'gallery.previous': { en: 'Previous image', bn: 'পূর্ববর্তী ছবি' },
  'gallery.next': { en: 'Next image', bn: 'পরবর্তী ছবি' },
  'gallery.playVideo': { en: 'Play product video', bn: 'ভিডিও দেখুন' },
  'gallery.studioPhoto': { en: 'Studio photo', bn: 'স্টুডিও ছবি' },
  'gallery.supplierPhoto': { en: 'Supplier photo', bn: 'সরবরাহকারীর ছবি' },
  'gallery.verified': { en: 'verified', bn: 'যাচাই' },
  'gallery.imageUnavailable': { en: 'Image unavailable', bn: 'ছবি নেই' },
  'gallery.thumbnails': { en: 'Product images', bn: 'পণ্যের ছবি' },

  /* ----------------------------------------------------------------- ladder */
  'ladder.title': { en: 'Quantity price ladder', bn: 'পরিমাণ অনুযায়ী মূল্য' },
  'ladder.hint': { en: 'Tap a tier to set quantity', bn: 'পরিমাণ নির্ধারণে ট্যাপ করুন' },
  'ladder.best': { en: 'Best', bn: 'সেরা' },
  'ladder.per': { en: 'per', bn: 'প্রতি' },
  'ladder.addMore': { en: 'Add', bn: 'আরও' },
  'ladder.more': { en: 'more for', bn: 'নিলে' },
  'ladder.save': { en: 'save', bn: 'সাশ্রয়' },
  'ladder.bestPriceUnlocked': { en: 'Best price unlocked', bn: 'সেরা মূল্য পেয়েছেন' },
  'ladder.from': { en: 'From', bn: 'শুরু' },
  'ladder.asLowAs': { en: 'As low as', bn: 'সর্বনিম্ন' },
  'ladder.atMinimum': { en: 'at the minimum order of', bn: 'সর্বনিম্ন অর্ডারে' },
  'ladder.atTopTier': { en: 'at', bn: '—' },
  'ladder.atQty': { en: 'at', bn: '—' },
  'ladder.volumeAbove': {
    en: 'Buying above the top tier? Request a volume quote',
    bn: 'সর্বোচ্চ টিয়ারের বেশি? ভলিউম কোট চান',
  },
  'ladder.priceOnRequest': { en: 'Price on request', bn: 'মূল্য জানতে যোগাযোগ' },

  /* ----------------------------------------------------------------- matrix */
  'matrix.title': { en: 'Your mix', bn: 'আপনার মিক্স' },
  'matrix.subtitle': {
    en: 'Enter a quantity per variant — the minimum applies to the total, not each cell',
    bn: 'প্রতি ভ্যারিয়েন্টে পরিমাণ দিন — সর্বনিম্ন প্রযোজ্য মোট পরিমাণে',
  },
  'matrix.rowTotal': { en: 'Row total', bn: 'সারির মোট' },
  'matrix.available': { en: 'available', bn: 'স্টক' },
  'matrix.total': { en: 'Total', bn: 'মোট' },
  'matrix.variant': { en: 'Variant', bn: 'ভ্যারিয়েন্ট' },
  'matrix.qty': { en: 'Qty', bn: 'পরিমাণ' },
  'matrix.distribute': { en: 'Distribute evenly', bn: 'সমানভাগে ভাগ করুন' },
  'matrix.clear': { en: 'Clear', bn: 'মুছুন' },
  'matrix.paste': { en: 'Paste from spreadsheet', bn: 'স্প্রেডশিট থেকে পেস্ট' },
  'matrix.pasteTitle': { en: 'Review pasted quantities', bn: 'পেস্ট করা পরিমাণ দেখুন' },
  'matrix.pasteHint': {
    en: 'Paste rows and columns copied from Excel or Google Sheets. Nothing is applied until you confirm.',
    bn: 'এক্সেল বা গুগল শিট থেকে কপি করে পেস্ট করুন। নিশ্চিত করার আগে কিছুই প্রয়োগ হবে না।',
  },
  'matrix.pasteApply': { en: 'Apply changes', bn: 'পরিবর্তন প্রয়োগ' },
  'matrix.pasteCancel': { en: 'Cancel', bn: 'বাতিল' },
  'matrix.willChange': { en: 'will change', bn: 'পরিবর্তন হবে' },
  'matrix.sourced': { en: 'sourced', bn: 'সোর্সিং' },
  'matrix.unavailable': { en: 'none', bn: 'নেই' },
  'matrix.openSheet': { en: 'Choose your mix', bn: 'আপনার মিক্স বাছুন' },
  'matrix.done': { en: 'Done', bn: 'সম্পন্ন' },

  /* -------------------------------------------------------------------- MOQ */
  'moq.label': { en: 'MOQ', bn: 'সর্বনিম্ন' },
  'moq.minimumIs': { en: 'Minimum order is', bn: 'সর্বনিম্ন অর্ডার' },
  'moq.addMore': { en: 'add', bn: 'আরও দিন' },
  'moq.setTo': { en: 'Set to', bn: 'নির্ধারণ করুন' },
  'moq.stepRule': { en: 'Order in multiples of', bn: 'গুণিতকে অর্ডার করুন' },
  'moq.roundUp': { en: 'Round up to', bn: 'বাড়িয়ে নিন' },

  /* ----------------------------------------------------------- landed cost */
  'landed.title': { en: 'Landed cost', bn: 'সর্বমোট খরচ' },
  'landed.estimated': { en: 'Estimated until checkout', bn: 'চেকআউট পর্যন্ত আনুমানিক' },
  'landed.goods': { en: 'Goods subtotal', bn: 'পণ্যের সাবটোটাল' },
  'landed.surcharge': { en: 'Variant surcharge', bn: 'ভ্যারিয়েন্ট সারচার্জ' },
  'landed.courier': { en: 'Courier', bn: 'কুরিয়ার' },
  'landed.paymentFee': { en: 'fee', bn: 'ফি' },
  'landed.total': { en: 'Landed total', bn: 'সর্বমোট' },
  'landed.perUnit': { en: 'Per unit landed', bn: 'প্রতি একক সর্বমোট' },
  'landed.perUnitHelp': {
    en: 'What you actually pay per piece, including delivery and payment fee — the figure to set your shelf price from.',
    bn: 'ডেলিভারি ও পেমেন্ট ফি সহ প্রতি পিসে প্রকৃত খরচ — এই হিসাবেই বিক্রয়মূল্য ঠিক করুন।',
  },
  'landed.breakdown': { en: 'Breakdown', bn: 'বিস্তারিত' },
  'landed.freeQualifies': { en: 'Free delivery applied', bn: 'ফ্রি ডেলিভারি প্রযোজ্য' },
  'landed.freeShortfall': { en: 'to free delivery', bn: 'হলে ফ্রি ডেলিভারি' },
  'landed.payWith': { en: 'Pay with', bn: 'পেমেন্ট' },
  'landed.enterQty': {
    en: 'Enter a quantity to see your landed cost',
    bn: 'সর্বমোট খরচ দেখতে পরিমাণ দিন',
  },

  /* ------------------------------------------------------------------- CTAs */
  'cta.addToCart': { en: 'Add mix to cart', bn: 'মিক্স কার্টে যোগ করুন' },
  'cta.startSourcing': { en: 'Start sourcing order', bn: 'সোর্সিং অর্ডার শুরু করুন' },
  'cta.requestQuote': { en: 'Request quote', bn: 'কোট চান' },
  'cta.requestVolumeQuote': { en: 'Request volume quote', bn: 'ভলিউম কোট চান' },
  'cta.requestCustomQuote': { en: 'Request custom quote', bn: 'কাস্টম কোট চান' },
  'cta.notifyMe': { en: 'Notify me when available', bn: 'স্টকে এলে জানান' },
  'cta.orderSample': { en: 'Order sample', bn: 'স্যাম্পল নিন' },
  'cta.chat': { en: 'Chat', bn: 'চ্যাট' },
  'cta.save': { en: 'Save', bn: 'সেভ' },
  'cta.saved': { en: 'Saved', bn: 'সেভ হয়েছে' },
  'cta.share': { en: 'Share', bn: 'শেয়ার' },
  'cta.linkCopied': { en: 'Link copied', bn: 'লিংক কপি হয়েছে' },
  'cta.added': { en: 'Added to cart', bn: 'কার্টে যোগ হয়েছে' },
  'cta.adding': { en: 'Adding…', bn: 'যোগ হচ্ছে…' },
  'cta.addFailed': { en: 'Could not add to cart', bn: 'কার্টে যোগ করা যায়নি' },
  'cta.retry': { en: 'Try again', bn: 'আবার চেষ্টা' },
  'cta.continueBrowsing': { en: 'Continue browsing', bn: 'ব্রাউজ করুন' },
  'cta.goToCart': { en: 'Go to cart', bn: 'কার্টে যান' },
  'cta.contactSeller': { en: 'Message seller', bn: 'বার্তা পাঠান' },
  'cta.visitStore': { en: 'Visit store', bn: 'স্টোর দেখুন' },

  /* --------------------------------------------------------------- assurance */
  'assurance.escrow': {
    en: 'Escrow — payment released on delivery confirmation',
    bn: 'এসক্রো — ডেলিভারি নিশ্চিত হলে পেমেন্ট',
  },
  'assurance.dispute': { en: 'day dispute window, photo evidence', bn: 'দিনের ডিসপিউট, ছবি প্রমাণে' },
  'assurance.payment': { en: 'bKash · Nagad · Rocket · bank transfer', bn: 'বিকাশ · নগদ · রকেট · ব্যাংক' },
  'assurance.shipsNow': { en: 'In local stock — ships now', bn: 'স্থানীয় স্টকে — এখনই' },
  'assurance.shipsIn': { en: 'Dispatches in', bn: 'ডেলিভারি' },
  'assurance.afterPayment': {
    en: 'after payment confirmation',
    bn: 'পেমেন্ট নিশ্চিত হওয়ার পর',
  },

  /* ------------------------------------------------------------------ seller */
  'seller.soldBy': { en: 'Sold by', bn: 'বিক্রেতা' },
  'seller.sourcedFrom': { en: 'Sourced from', bn: 'সোর্স' },
  'seller.verified': { en: 'Verified', bn: 'যাচাইকৃত' },
  'seller.escrowSeller': { en: 'Escrow seller', bn: 'এসক্রো বিক্রেতা' },
  'seller.years': { en: 'yrs trading', bn: 'বছর' },
  'seller.skus': { en: 'SKUs', bn: 'পণ্য' },
  'seller.verifiedFactory': { en: 'verified factory', bn: 'যাচাইকৃত ফ্যাক্টরি' },
  'seller.metricsTitle': { en: 'Measured performance', bn: 'পরিমাপিত পারফরম্যান্স' },
  'seller.metric.response': { en: 'Response', bn: 'রেসপন্স' },
  'seller.metric.onTime': { en: 'On-time', bn: 'সময়মতো' },
  'seller.metric.reorder': { en: 'Reorder', bn: 'রি-অর্ডার' },
  'seller.metric.disputes': { en: 'Disputes', bn: 'ডিসপিউট' },
  'seller.metric.response.def': {
    en: 'Share of buyer messages answered within 24 hours, last 90 days.',
    bn: 'গত ৯০ দিনে ২৪ ঘণ্টার মধ্যে উত্তর দেওয়া বার্তার হার।',
  },
  'seller.metric.onTime.def': {
    en: 'Share of orders dispatched inside the promised window.',
    bn: 'প্রতিশ্রুত সময়ে পাঠানো অর্ডারের হার।',
  },
  'seller.metric.reorder.def': {
    en: 'Share of buyers who ordered again within six months.',
    bn: 'ছয় মাসের মধ্যে পুনরায় অর্ডার করা ক্রেতার হার।',
  },
  'seller.metric.disputes.def': {
    en: 'Share of disputes resolved for the buyer or by agreement.',
    bn: 'ক্রেতার পক্ষে বা সমঝোতায় নিষ্পত্তি হওয়া ডিসপিউটের হার।',
  },
  'seller.notEnoughData': { en: 'Not enough orders yet', bn: 'পর্যাপ্ত অর্ডার হয়নি' },
  'seller.fromOrders': { en: 'from', bn: 'ভিত্তি' },
  'seller.orders': { en: 'orders', bn: 'অর্ডার' },
  'seller.messages': { en: 'messages', bn: 'বার্তা' },
  'seller.certifications': { en: 'Certifications', bn: 'সার্টিফিকেশন' },
  'seller.viewDocument': { en: 'View verified document', bn: 'যাচাইকৃত নথি' },
  'seller.underReview': {
    en: 'This seller is under review — orders are paused',
    bn: 'এই বিক্রেতা পর্যালোচনায় — অর্ডার বন্ধ',
  },

  /* ---------------------------------------------------------------- sections */
  'section.overview': { en: 'Overview', bn: 'বিবরণ' },
  'section.specifications': { en: 'Specifications', bn: 'স্পেসিফিকেশন' },
  'section.shipping': { en: 'Shipping', bn: 'ডেলিভারি' },
  'section.reviews': { en: 'Reviews', bn: 'রিভিউ' },
  'section.seller': { en: 'Seller', bn: 'বিক্রেতা' },
  'section.nav': { en: 'Product sections', bn: 'পণ্যের অংশ' },

  /* ------------------------------------------------------------- spec groups */
  'spec.general': { en: 'General', bn: 'সাধারণ' },
  'spec.technical': { en: 'Technical', bn: 'টেকনিক্যাল' },
  'spec.packaging': { en: 'Packaging & logistics', bn: 'প্যাকেজিং ও লজিস্টিকস' },
  'spec.trade': { en: 'Trade terms', bn: 'ট্রেড শর্তাবলী' },
  'spec.compliance': { en: 'Compliance', bn: 'কমপ্লায়েন্স' },
  'spec.empty': {
    en: 'Specifications are being finalised for this listing.',
    bn: 'এই লিস্টিংয়ের স্পেসিফিকেশন চূড়ান্ত হচ্ছে।',
  },
  'spec.requestDetails': { en: 'Request details', bn: 'বিবরণ চান' },

  /* ---------------------------------------------------------------- shipping */
  'shipping.title': { en: 'Shipping & delivery', bn: 'শিপিং ও ডেলিভারি' },
  'shipping.deliverTo': { en: 'Deliver to', bn: 'ডেলিভারি ঠিকানা' },
  'shipping.courier': { en: 'Courier', bn: 'কুরিয়ার' },
  'shipping.cost': { en: 'Cost', bn: 'খরচ' },
  'shipping.window': { en: 'Window', bn: 'সময়' },
  'shipping.notes': { en: 'Notes', bn: 'মন্তব্য' },
  'shipping.cheapest': { en: 'Cheapest', bn: 'সবচেয়ে কম' },
  'shipping.fastest': { en: 'Fastest', bn: 'দ্রুততম' },
  'shipping.free': { en: 'Free', bn: 'ফ্রি' },
  'shipping.cartons': { en: 'cartons', bn: 'কার্টন' },
  'shipping.freightNote': {
    en: 'Over 200 kg ships by truck freight — request a freight quote for exact cost.',
    bn: '২০০ কেজির বেশি হলে ট্রাক ফ্রেইটে যাবে — সঠিক খরচের জন্য কোট চান।',
  },
  'shipping.sourcedNote': {
    en: 'Sourced-to-order items dispatch after payment confirmation, not after order placement.',
    bn: 'অর্ডারে সোর্স করা পণ্য পেমেন্ট নিশ্চিত হওয়ার পর পাঠানো হয়, অর্ডার দেওয়ার পর নয়।',
  },
  // The table is populated at the MOQ rather than left blank, so the note has
  // to say which quantity these rates belong to. Telling a buyer to 'enter a
  // quantity' beside a table full of figures reads as a stale message.
  'shipping.enterQtyFirst': {
    en: 'Rates shown for the minimum order — enter your quantity for exact figures.',
    bn: 'সর্বনিম্ন অর্ডারের হার দেখানো হচ্ছে — সঠিক হিসাবের জন্য আপনার পরিমাণ দিন।',
  },

  /* ----------------------------------------------------------------- reviews */
  'reviews.title': { en: 'Reviews', bn: 'রিভিউ' },
  'reviews.verifiedPurchase': { en: 'Verified purchase', bn: 'যাচাইকৃত ক্রয়' },
  'reviews.withPhotos': { en: 'With photos', bn: 'ছবিসহ' },
  'reviews.repeatBuyers': { en: 'Repeat buyers', bn: 'পুনঃক্রেতা' },
  'reviews.ordered': { en: 'Ordered', bn: 'অর্ডার' },
  'reviews.helpful': { en: 'Helpful', bn: 'উপকারী' },
  'reviews.replied': { en: 'replied', bn: 'উত্তর দিয়েছে' },
  'reviews.all': { en: 'All', bn: 'সব' },
  'reviews.newest': { en: 'Newest', bn: 'নতুন' },
  'reviews.empty': {
    en: 'No reviews yet — be the first to review after your order.',
    bn: 'এখনও রিভিউ নেই — অর্ডারের পর প্রথম রিভিউ আপনিই দিন।',
  },
  'reviews.showMore': { en: 'Show more reviews', bn: 'আরও রিভিউ' },
  'reviews.outOf5': { en: 'out of 5', bn: '৫-এর মধ্যে' },
  'reviews.noneMatch': { en: 'No reviews match this filter.', bn: 'এই ফিল্টারে কোনও রিভিউ নেই।' },

  /* -------------------------------------------------------------------- RFQ */
  'rfq.title': { en: 'Request a quote', bn: 'কোটেশন চান' },
  'rfq.quantity': { en: 'Quantity', bn: 'পরিমাণ' },
  'rfq.targetPrice': { en: 'Target price', bn: 'কাঙ্ক্ষিত মূল্য' },
  'rfq.ladderAnchor': { en: 'Ladder price at', bn: 'ল্যাডার মূল্য' },
  'rfq.deliverTo': { en: 'Deliver to', bn: 'ডেলিভারি' },
  'rfq.neededBy': { en: 'Needed by', bn: 'কবে দরকার' },
  'rfq.customisation': { en: 'Customisation', bn: 'কাস্টমাইজেশন' },
  'rfq.logoPrint': { en: 'Logo print', bn: 'লোগো প্রিন্ট' },
  'rfq.customPackaging': { en: 'Custom packaging', bn: 'কাস্টম প্যাকেজিং' },
  'rfq.privateLabel': { en: 'Private label', bn: 'প্রাইভেট লেবেল' },
  'rfq.details': { en: 'Details', bn: 'বিস্তারিত' },
  'rfq.detailsPlaceholder': {
    en: 'Specifications, branding, packaging, payment terms…',
    bn: 'স্পেসিফিকেশন, ব্র্যান্ডিং, প্যাকেজিং, পেমেন্ট শর্ত…',
  },
  'rfq.attachments': { en: 'Attachments', bn: 'সংযুক্তি' },
  'rfq.addFiles': { en: 'Add files', bn: 'ফাইল যোগ' },
  'rfq.attachmentHint': { en: 'Spec sheet or artwork · up to 5 files, 10 MB each', bn: 'স্পেক শিট বা আর্টওয়ার্ক · ৫টি ফাইল, প্রতিটি ১০ এমবি' },
  'rfq.responseTime': { en: 'Typical first response', bn: 'সাধারণত প্রথম উত্তর' },
  'rfq.send': { en: 'Send request', bn: 'অনুরোধ পাঠান' },
  'rfq.sending': { en: 'Sending…', bn: 'পাঠানো হচ্ছে…' },
  'rfq.sent': { en: 'Request sent', bn: 'অনুরোধ পাঠানো হয়েছে' },
  'rfq.sentBody': {
    en: 'We typically reply within 4 hours. You can track this request and compare quotes as they arrive.',
    bn: 'সাধারণত ৪ ঘণ্টার মধ্যে উত্তর দেওয়া হয়। কোট এলে তুলনা করতে পারবেন।',
  },
  'rfq.trackRequest': { en: 'Track this request', bn: 'অনুরোধ ট্র্যাক করুন' },
  'rfq.failed': {
    en: 'Could not send the request. Your draft is saved.',
    bn: 'অনুরোধ পাঠানো যায়নি। আপনার ড্রাফট সংরক্ষিত আছে।',
  },
  'rfq.privacy': {
    en: 'Your contact details are shared with the seller only.',
    bn: 'আপনার যোগাযোগের তথ্য কেবল বিক্রেতার সঙ্গে শেয়ার হবে।',
  },
  'rfq.required': { en: 'required', bn: 'আবশ্যক' },
  'rfq.close': { en: 'Close request form', bn: 'ফর্ম বন্ধ' },
  'rfq.draftRestored': { en: 'Draft restored', bn: 'ড্রাফট ফিরে এসেছে' },

  /* ------------------------------------------------------------------- rails */
  'rail.similar': { en: 'Similar products', bn: 'একই ধরনের পণ্য' },
  'rail.similarNote': { en: 'priced at your quantity', bn: 'আপনার পরিমাণে মূল্য' },
  'rail.boughtTogether': { en: 'Frequently bought together', bn: 'একসঙ্গে কেনা হয়' },
  'rail.recentlyViewed': { en: 'Recently viewed', bn: 'সম্প্রতি দেখা' },
  'rail.addBundle': { en: 'Add all three to cart', bn: 'তিনটিই কার্টে যোগ' },
  'rail.viewAll': { en: 'View all', bn: 'সব দেখুন' },
  'rail.fromPrice': { en: 'from', bn: 'শুরু' },

  /* ------------------------------------------------------------------ footer */
  'footer.buying': { en: 'Buying', bn: 'ক্রয়' },
  'footer.selling': { en: 'Selling', bn: 'বিক্রয়' },
  'footer.support': { en: 'Support', bn: 'সহায়তা' },
  'footer.company': { en: 'Company', bn: 'কোম্পানি' },
  'footer.popularCategories': { en: 'Popular categories', bn: 'জনপ্রিয় ক্যাটাগরি' },
  'footer.installApp': { en: 'Install the app', bn: 'অ্যাপ ইনস্টল করুন' },
  'footer.installAppSub': { en: 'Works offline, order faster', bn: 'অফলাইনেও চলে, দ্রুত অর্ডার' },
  'footer.tradeLicence': { en: 'Trade licence', bn: 'ট্রেড লাইসেন্স' },
  'footer.rights': {
    en: "Made for Bangladesh's retailers & resellers",
    bn: 'বাংলাদেশের খুচরা বিক্রেতা ও রিসেলারদের জন্য',
  },

  /* ------------------------------------------------------------------ states */
  'state.notFoundTitle': {
    en: 'This listing is no longer available',
    bn: 'এই লিস্টিং আর নেই',
  },
  'state.notFoundBody': {
    en: 'It may have been unpublished or sold out permanently. Search for what you need, or browse similar products below.',
    bn: 'এটি সরিয়ে নেওয়া হয়েছে বা স্থায়ীভাবে শেষ। আপনার প্রয়োজন খুঁজুন, বা নিচের একই ধরনের পণ্য দেখুন।',
  },
  'state.errorTitle': { en: 'Something went wrong loading this product', bn: 'পণ্য লোড করতে সমস্যা হয়েছে' },
  'state.errorBody': {
    en: 'The connection dropped or the catalogue is briefly unavailable. Nothing you entered was lost.',
    bn: 'সংযোগ বিচ্ছিন্ন হয়েছে বা ক্যাটালগ সাময়িকভাবে অনুপলব্ধ। আপনার দেওয়া তথ্য হারায়নি।',
  },
  'state.tryAgain': { en: 'Try again', bn: 'আবার চেষ্টা করুন' },
  'state.searchProducts': { en: 'Search products', bn: 'পণ্য খুঁজুন' },
  'state.offline': {
    en: 'Offline — prices may have changed',
    bn: 'অফলাইন — মূল্য পরিবর্তিত হতে পারে',
  },
  'state.offlineCta': { en: 'Reconnect to order', bn: 'অর্ডারে সংযোগ দিন' },
  'state.loading': { en: 'Loading product', bn: 'পণ্য লোড হচ্ছে' },

  /* --------------------------------------------------------------- home */
  'home.eyebrow': { en: 'Wholesale sourcing · Bangladesh', bn: 'পাইকারি সোর্সিং · বাংলাদেশ' },
  'home.headline': {
    en: 'Source wholesale, priced in Taka, delivered nationwide.',
    bn: 'পাইকারি সোর্সিং — টাকায় মূল্য, সারা দেশে ডেলিভারি।',
  },
  'home.sub': {
    en: 'Laddered wholesale pricing you can read before you ask, escrow-protected payment, and four couriers quoting against your district. Built for shops that reorder.',
    bn: 'জিজ্ঞেস করার আগেই দেখা যায় এমন ল্যাডার মূল্য, এসক্রো-সুরক্ষিত পেমেন্ট এবং আপনার জেলার জন্য চারটি কুরিয়ারের দর। যারা বারবার অর্ডার করেন তাদের জন্য।',
  },
  'home.browseCategories': { en: 'Browse all categories', bn: 'সব ক্যাটাগরি দেখুন' },
  'home.popular': { en: 'Popular right now', bn: 'এখন জনপ্রিয়' },
  'home.statCategories': { en: 'categories', bn: 'ক্যাটাগরি' },
  'home.statSubcategories': { en: 'subcategories', bn: 'সাবক্যাটাগরি' },
  'home.statProducts': { en: 'products listed', bn: 'পণ্য তালিকাভুক্ত' },
  'home.rfqTitle': { en: 'Cannot find it? Have it sourced.', bn: 'খুঁজে পাচ্ছেন না? সোর্স করিয়ে নিন।' },
  'home.rfqBody': {
    en: 'Post what you need with a target price and a quantity. Verified suppliers quote against it, and you compare the replies side by side.',
    bn: 'কী দরকার, কাঙ্ক্ষিত দাম ও পরিমাণ জানান। যাচাইকৃত সরবরাহকারীরা কোট দেবেন, আপনি পাশাপাশি তুলনা করবেন।',
  },
  'home.rfqStep1': { en: 'Post your requirement', bn: 'প্রয়োজন জানান' },
  'home.rfqStep2': { en: 'Compare supplier quotes', bn: 'কোট তুলনা করুন' },
  'home.rfqStep3': { en: 'Accept and it becomes an order', bn: 'গ্রহণ করলেই অর্ডার' },
  'home.shopByCategory': { en: 'Shop by category', bn: 'ক্যাটাগরি অনুযায়ী' },
  'home.shopByCategorySub': {
    en: 'Twenty categories, every one with its own subcategory tree.',
    bn: 'বিশটি ক্যাটাগরি, প্রতিটিতে নিজস্ব সাবক্যাটাগরি।',
  },
  'home.reviewTitle': { en: 'Review the product page', bn: 'পণ্য পেজ দেখুন' },
  'home.reviewSub': {
    en: 'Each listing below exercises a different state the page has to handle.',
    bn: 'নিচের প্রতিটি লিস্টিং পেজের একটি ভিন্ন অবস্থা দেখায়।',
  },
  'home.openPage': { en: 'Open page', bn: 'পেজ দেখুন' },

  /* ----------------------------------------------------------- categories */
  'category.all': { en: 'All categories', bn: 'সব ক্যাটাগরি' },
  'category.directoryTitle': { en: 'All categories', bn: 'সব ক্যাটাগরি' },
  'category.directorySub': {
    en: 'Every category and subcategory on ArcB2B. Filter to jump straight to a branch.',
    bn: 'ArcB2B-এর সব ক্যাটাগরি ও সাবক্যাটাগরি। সরাসরি যেতে ফিল্টার করুন।',
  },
  'category.filterLabel': { en: 'Filter categories', bn: 'ক্যাটাগরি ফিল্টার' },
  'category.filterPlaceholder': { en: 'Filter by name — try "cable" or "kurti"', bn: 'নাম দিয়ে ফিল্টার — যেমন "কেবল"' },
  'category.noMatches': { en: 'No category matches that filter.', bn: 'এই ফিল্টারে কোনও ক্যাটাগরি নেই।' },
  'category.clearFilter': { en: 'Clear filter', bn: 'ফিল্টার মুছুন' },
  'category.products': { en: 'products', bn: 'পণ্য' },
  'category.subcategories': { en: 'subcategories', bn: 'সাবক্যাটাগরি' },
  'category.browseAll': { en: 'Browse all of', bn: 'সব দেখুন —' },
  'category.refine': { en: 'Refine by subcategory', bn: 'সাবক্যাটাগরি অনুযায়ী' },
  'category.inThisCategory': { en: 'In this category', bn: 'এই ক্যাটাগরিতে' },
  'category.showing': { en: 'Showing', bn: 'দেখানো হচ্ছে' },
  'category.sampleNote': {
    en: 'sample data covers a few branches of the tree',
    bn: 'নমুনা ডেটা কয়েকটি শাখা জুড়ে আছে',
  },
  'category.emptyTitle': { en: 'No sample listings in this branch yet', bn: 'এই শাখায় এখনও নমুনা লিস্টিং নেই' },
  'category.emptyBody': {
    en: 'The taxonomy is complete, but this build ships sample products for only a few branches. Browse a featured category, or post a sourcing request and have it filled.',
    bn: 'ক্যাটাগরি কাঠামো সম্পূর্ণ, তবে এই বিল্ডে কয়েকটি শাখায় নমুনা পণ্য আছে। ফিচার্ড ক্যাটাগরি দেখুন বা সোর্সিং অনুরোধ দিন।',
  },

  /* -------------------------------------------------------------------- misc */
  'misc.info': { en: 'More information', bn: 'আরও তথ্য' },
  'misc.close': { en: 'Close', bn: 'বন্ধ' },
  'misc.of': { en: 'of', bn: 'এর' },
  'misc.and': { en: 'and', bn: 'এবং' },
  'misc.backHome': { en: 'Back to home', bn: 'হোমে ফিরুন' },
  'misc.viewAll': { en: 'View all', bn: 'সব দেখুন' },
  'misc.total': { en: 'Total', bn: 'মোট' },
  'misc.units': { en: 'units', bn: 'ইউনিট' },
  'misc.prototypeLabel': { en: 'Prototype', bn: 'প্রোটোটাইপ' },

  /* ------------------------------------------------------------------ search */
  'search.title': { en: 'Search', bn: 'খুঁজুন' },
  'search.resultsFor': { en: 'Results for', bn: 'ফলাফল' },
  'search.allListings': { en: 'All listings', bn: 'সব লিস্টিং' },
  'search.listingsFound': { en: 'listings', bn: 'লিস্টিং' },
  'search.listingFound': { en: 'listing', bn: 'লিস্টিং' },
  'search.sort': { en: 'Sort', bn: 'সাজান' },
  'search.sortRelevance': { en: 'Best match', bn: 'সবচেয়ে মিল' },
  'search.sortPriceAsc': { en: 'Price: low to high', bn: 'দাম: কম থেকে বেশি' },
  'search.sortPriceDesc': { en: 'Price: high to low', bn: 'দাম: বেশি থেকে কম' },
  'search.sortMoq': { en: 'Lowest minimum', bn: 'সর্বনিম্ন MOQ' },
  'search.sortPopular': { en: 'Most ordered', bn: 'সর্বাধিক অর্ডার' },
  'search.filters': { en: 'Filters', bn: 'ফিল্টার' },
  'search.category': { en: 'Category', bn: 'ক্যাটাগরি' },
  'search.inStockOnly': { en: 'Local stock only', bn: 'শুধু স্থানীয় স্টক' },
  'search.lowMoqOnly': { en: 'Minimum 100 or under', bn: 'সর্বনিম্ন ১০০ বা কম' },
  'search.clearFilters': { en: 'Clear filters', bn: 'ফিল্টার মুছুন' },
  'search.emptyTitle': { en: 'Nothing in the sample catalogue matches that', bn: 'নমুনা ক্যাটালগে এর সঙ্গে কিছু মেলেনি' },
  'search.emptyBody': {
    en: 'The sample catalogue covers ten listings across a few branches of the tree. Post a sourcing request and verified suppliers will quote against it, or open one of the shelves below.',
    bn: 'নমুনা ক্যাটালগে গাছের কয়েকটি শাখায় দশটি লিস্টিং আছে। একটি সোর্সিং অনুরোধ দিন — যাচাইকৃত সরবরাহকারীরা কোট দেবেন, অথবা নিচের শেলফগুলো দেখুন।',
  },
  'search.suggestedShelves': { en: 'Shelves matching your words', bn: 'আপনার শব্দের সঙ্গে মেলা শেলফ' },
  'search.noQueryTitle': { en: 'Search the wholesale catalogue', bn: 'পাইকারি ক্যাটালগ খুঁজুন' },
  'search.noQueryBody': {
    en: 'Type what you are sourcing. Every result shows its minimum order and the price at each quantity tier, so you can compare before you ask anyone anything.',
    bn: 'আপনি যা সোর্স করছেন লিখুন। প্রতিটি ফলাফলে সর্বনিম্ন অর্ডার ও প্রতিটি টিয়ারের দাম দেখা যায় — কাউকে কিছু জিজ্ঞেস করার আগেই তুলনা করতে পারবেন।',
  },
  'search.narrowedTo': { en: 'Narrowed to', bn: 'সীমিত' },

  /* -------------------------------------------------------------------- cart */
  'cart.title': { en: 'Your cart', bn: 'আপনার কার্ট' },
  'cart.emptyTitle': { en: 'Your cart is empty', bn: 'আপনার কার্ট খালি' },
  'cart.emptyBody': {
    en: 'Build a mix on any product page and it lands here. The cart is stored in this browser, so it survives a reload but does not follow you to another device until you sign in.',
    bn: 'যেকোনও পণ্যের পেজে মিক্স তৈরি করলে তা এখানে আসে। কার্ট এই ব্রাউজারে সংরক্ষিত — রিলোডে থাকে, তবে সাইন ইন না করলে অন্য ডিভাইসে যায় না।',
  },
  'cart.lines': { en: 'lines', bn: 'লাইন' },
  'cart.remove': { en: 'Remove', bn: 'সরান' },
  'cart.removeLine': { en: 'Remove this line', bn: 'এই লাইন সরান' },
  'cart.clear': { en: 'Clear cart', bn: 'কার্ট খালি করুন' },
  'cart.summary': { en: 'Order summary', bn: 'অর্ডার সারসংক্ষেপ' },
  'cart.goods': { en: 'Goods total', bn: 'পণ্যের মোট' },
  'cart.checkout': { en: 'Proceed to checkout', bn: 'চেকআউটে যান' },
  'cart.checkoutNote': {
    en: 'Checkout needs the payment gateway and the order service, neither of which is part of this front-end prototype.',
    bn: 'চেকআউটের জন্য পেমেন্ট গেটওয়ে ও অর্ডার সার্ভিস দরকার, যা এই ফ্রন্ট-এন্ড প্রোটোটাইপে নেই।',
  },
  'cart.keepBrowsing': { en: 'Keep browsing', bn: 'ব্রাউজিং চালিয়ে যান' },
  'cart.added': { en: 'Added', bn: 'যোগ হয়েছে' },
  'cart.viewListing': { en: 'View listing', bn: 'লিস্টিং দেখুন' },
  'cart.editMix': { en: 'Edit mix', bn: 'মিক্স সম্পাদনা' },
  'cart.landedNote': {
    en: 'Courier and payment fee are quoted per consignment at checkout, against the district in your preferences.',
    bn: 'কুরিয়ার ও পেমেন্ট ফি চেকআউটে কনসাইনমেন্ট অনুযায়ী, আপনার পছন্দের জেলার বিপরীতে নির্ধারিত হয়।',
  },

  /* ------------------------------------------------------------------- deals */
  'deals.title': { en: 'Volume deals', bn: 'ভলিউম ডিল' },
  'deals.sub': {
    en: 'Ranked by how hard the ladder rewards volume — the real spread between the minimum-order price and the floor price.',
    bn: 'ল্যাডার ভলিউমে কত ছাড় দেয় তার ভিত্তিতে সাজানো — সর্বনিম্ন অর্ডারের দাম ও সর্বনিম্ন দামের প্রকৃত পার্থক্য।',
  },
  'deals.spreadOff': { en: 'off at volume', bn: 'ভলিউমে ছাড়' },
  'deals.entryPrice': { en: 'At the minimum', bn: 'সর্বনিম্ন অর্ডারে' },
  'deals.bestPrice': { en: 'Best price', bn: 'সেরা দাম' },
  'deals.bestFrom': { en: 'from', bn: 'থেকে' },
  'deals.method': {
    en: 'No countdown timers. A staple that restocks every week is not a flash sale, and a timer on one is a lie with a clock attached.',
    bn: 'কোনও কাউন্টডাউন টাইমার নেই। প্রতি সপ্তাহে স্টকে আসা নিত্যপণ্য ফ্ল্যাশ সেল নয়, আর তাতে টাইমার লাগানো ঘড়িসহ একটি মিথ্যা।',
  },
  'deals.empty': { en: 'No laddered listings in the sample catalogue yet.', bn: 'নমুনা ক্যাটালগে এখনও ল্যাডার-যুক্ত লিস্টিং নেই।' },

  /* --------------------------------------------------------------- rfq page */
  'rfqPage.sub': {
    en: 'Describe what you need and verified suppliers quote against it. You compare the replies side by side before committing to anything.',
    bn: 'আপনার প্রয়োজন লিখুন, যাচাইকৃত সরবরাহকারীরা কোট দেবেন। কিছু চূড়ান্ত করার আগে পাশাপাশি উত্তর তুলনা করবেন।',
  },
  'rfqPage.productLabel': { en: 'Product or category', bn: 'পণ্য বা ক্যাটাগরি' },
  'rfqPage.productPlaceholder': { en: 'e.g. TWS earbuds, retail-boxed', bn: 'যেমন TWS ইয়ারবাড, রিটেইল বক্সে' },
  'rfqPage.contact': { en: 'How suppliers reach you', bn: 'সরবরাহকারীরা কীভাবে যোগাযোগ করবেন' },
  'rfqPage.business': { en: 'Business name', bn: 'ব্যবসার নাম' },
  'rfqPage.phone': { en: 'Mobile number', bn: 'মোবাইল নম্বর' },
  'rfqPage.whatHappens': { en: 'What happens next', bn: 'এরপর কী হয়' },
  'rfqPage.step1': { en: 'Your request reaches suppliers in the matching category — never published publicly.', bn: 'আপনার অনুরোধ সংশ্লিষ্ট ক্যাটাগরির সরবরাহকারীদের কাছে যায় — কখনও প্রকাশ্যে নয়।' },
  'rfqPage.step2': { en: 'Quotes arrive in one thread, each with a price, a lead time and a validity period.', bn: 'কোট একটি থ্রেডে আসে, প্রতিটিতে দাম, লিড টাইম ও মেয়াদ থাকে।' },
  'rfqPage.step3': { en: 'You accept one, and payment goes into escrow rather than to the supplier.', bn: 'আপনি একটি গ্রহণ করেন, এবং পেমেন্ট সরবরাহকারীর বদলে এসক্রোতে যায়।' },
  'rfqPage.aboutBulk': { en: 'How bulk ordering works', bn: 'বাল্ক অর্ডার কীভাবে কাজ করে' },
  'rfqPage.invalid': { en: 'Fill in the product, quantity and a mobile number.', bn: 'পণ্য, পরিমাণ ও মোবাইল নম্বর দিন।' },

  /* ------------------------------------------------------------------- store */
  'store.metricsFootnote': {
    en: 'All four figures are computed from transactions on this platform. None can be edited by the supplier, and none publishes until the sample is large enough for the number to mean something.',
    bn: 'চারটি সংখ্যাই এই প্ল্যাটফর্মের লেনদেন থেকে হিসাব হয়। সরবরাহকারী কোনওটি সম্পাদনা করতে পারেন না, এবং নমুনা যথেষ্ট বড় না হলে কোনওটি প্রকাশও হয় না।',
  },
  'store.verificationLink': { en: 'How suppliers are verified', bn: 'সরবরাহকারী কীভাবে যাচাই হয়' },
  'store.listings': { en: 'Listings from this supplier', bn: 'এই সরবরাহকারীর লিস্টিং' },
  'store.performance': { en: 'Measured performance', bn: 'পরিমাপকৃত পারফরম্যান্স' },
  'store.noListings': {
    en: 'No listings from this storefront are in the sample catalogue. Message them with what you need and they will quote.',
    bn: 'নমুনা ক্যাটালগে এই স্টোরফ্রন্টের কোনও লিস্টিং নেই। আপনার প্রয়োজন জানিয়ে বার্তা দিন, তারা কোট দেবেন।',
  },
  'store.tradingSince': { en: 'Trading since', bn: 'ব্যবসা শুরু' },
  'store.skus': { en: 'SKUs listed', bn: 'তালিকাভুক্ত SKU' },
  'store.platformStore': { en: 'ArcB2B first-party stock', bn: 'ArcB2B নিজস্ব স্টক' },
  'store.supplierStore': { en: 'Independent supplier storefront', bn: 'স্বতন্ত্র সরবরাহকারী স্টোরফ্রন্ট' },

  /* ----------------------------------------------------------------- account */
  'account.title': { en: 'Your account', bn: 'আপনার অ্যাকাউন্ট' },
  'account.signedOut': { en: 'Not signed in', bn: 'সাইন ইন করা নেই' },
  'account.signedOutBody': {
    en: 'Sign in to sync your cart, saved listings and quotation threads across devices. Everything below is held in this browser only.',
    bn: 'কার্ট, সংরক্ষিত লিস্টিং ও কোটেশন থ্রেড সব ডিভাইসে রাখতে সাইন ইন করুন। নিচের সবকিছু কেবল এই ব্রাউজারে আছে।',
  },
  'account.savedListings': { en: 'Saved listings', bn: 'সংরক্ষিত লিস্টিং' },
  'account.recentlyViewed': { en: 'Recently viewed', bn: 'সম্প্রতি দেখা' },
  'account.inCart': { en: 'In your cart', bn: 'কার্টে' },
  'account.noSaved': { en: 'Nothing saved yet. The heart on any listing puts it here.', bn: 'এখনও কিছু সংরক্ষিত নেই। যেকোনও লিস্টিংয়ের হার্ট চাপলে এখানে আসবে।' },
  'account.noRecent': { en: 'No listings viewed in this browser yet.', bn: 'এই ব্রাউজারে এখনও কোনও লিস্টিং দেখা হয়নি।' },
  'account.ordersTitle': { en: 'Your orders', bn: 'আপনার অর্ডার' },
  'account.ordersEmpty': {
    en: 'Order history comes from the order service, which is not part of this front-end prototype. The sample request below shows the shape a real one takes.',
    bn: 'অর্ডার ইতিহাস আসে অর্ডার সার্ভিস থেকে, যা এই ফ্রন্ট-এন্ড প্রোটোটাইপে নেই। নিচের নমুনা অনুরোধে প্রকৃত রূপটি দেখা যায়।',
  },
  'account.quotations': { en: 'Quotation requests', bn: 'কোটেশন অনুরোধ' },
  'account.viewRequest': { en: 'View request', bn: 'অনুরোধ দেখুন' },
  'help.trackHint': {
    en: 'Every order carries a courier tracking reference from the moment it is dispatched, and the same reference reaches your registered mobile number by SMS — so an order can be traced even from a phone that is not signed in.',
    bn: 'প্রতিটি অর্ডার পাঠানোর মুহূর্ত থেকে একটি কুরিয়ার ট্র্যাকিং রেফারেন্স বহন করে, এবং একই রেফারেন্স এসএমএসে আপনার নিবন্ধিত মোবাইল নম্বরে যায় — তাই সাইন ইন না করা ফোন থেকেও অর্ডার খোঁজা যায়।',
  },
  'account.localData': { en: 'Held in this browser', bn: 'এই ব্রাউজারে সংরক্ষিত' },

  /* ------------------------------------------------------------------- rfq id */
  'rfqThread.title': { en: 'Quotation request', bn: 'কোটেশন অনুরোধ' },
  'rfqThread.quotesReceived': { en: 'Quotes received', bn: 'প্রাপ্ত কোট' },
  'rfqThread.quoteReceived': { en: 'Quote received', bn: 'প্রাপ্ত কোট' },
  'rfqThread.validUntil': { en: 'Valid until', bn: 'মেয়াদ' },
  'rfqThread.leadTime': { en: 'Lead time', bn: 'লিড টাইম' },
  'rfqThread.accept': { en: 'Accept this quote', bn: 'এই কোট গ্রহণ করুন' },
  'rfqThread.negotiate': { en: 'Counter-offer', bn: 'পাল্টা প্রস্তাব' },
  'rfqThread.requested': { en: 'You requested', bn: 'আপনি চেয়েছেন' },
  'rfqThread.awaiting': { en: 'Awaiting more quotes', bn: 'আরও কোটের অপেক্ষা' },
  'rfqThread.notFound': { en: 'No such quotation request', bn: 'এমন কোনও কোটেশন অনুরোধ নেই' },
  'rfqThread.landedPerUnit': { en: 'Landed per unit', bn: 'প্রতি ইউনিটে সর্বমোট' },
  'rfqThread.bestOnPrice': { en: 'Lowest price', bn: 'সর্বনিম্ন দাম' },
  'rfqThread.underTarget': { en: 'under your target', bn: 'আপনার লক্ষ্যের নিচে' },
  'rfqThread.needsMore': { en: 'Only at this price if you take a further', bn: 'এই দামে নিতে আরও লাগবে' },
  'rfqThread.compareNote': {
    en: 'Each quote is ranked by its landed cost per unit at the quantity that quote is actually valid for — not by its headline price. A ৳25 saving that needs 300 more units is only a saving if those 300 sell.',
    bn: 'প্রতিটি কোট তার নিজের প্রযোজ্য পরিমাণে প্রতি ইউনিটের সর্বমোট খরচ অনুযায়ী সাজানো — প্রচারিত দাম অনুযায়ী নয়। ২৫ টাকার সাশ্রয়ের জন্য আরও ৩০০ ইউনিট লাগলে, সেই ৩০০ বিক্রি হলেই তা সাশ্রয়।',
  },
  'rfqThread.bestOnSpeed': { en: 'Fastest', bn: 'দ্রুততম' },

  /* ---------------------------------------------------------------- messages */
  'messages.title': { en: 'Messages', bn: 'বার্তা' },
  'messages.threads': { en: 'Conversations', bn: 'কথোপকথন' },
  'messages.about': { en: 'About', bn: 'বিষয়' },
  'messages.write': { en: 'Write a message', bn: 'বার্তা লিখুন' },
  'messages.placeholder': { en: 'Quantity, delivery district, and anything you need customised…', bn: 'পরিমাণ, ডেলিভারি জেলা, এবং যা কাস্টমাইজ করতে চান…' },
  'messages.send': { en: 'Send', bn: 'পাঠান' },
  'messages.sent': { en: 'Message queued', bn: 'বার্তা কিউতে' },
  'messages.sendNote': {
    en: 'Delivery needs the messaging service; this prototype holds your draft in the browser instead of dropping it.',
    bn: 'পাঠাতে মেসেজিং সার্ভিস দরকার; এই প্রোটোটাইপ আপনার ড্রাফট ফেলে না দিয়ে ব্রাউজারে রাখে।',
  },
  'messages.empty': { en: 'No conversations yet.', bn: 'এখনও কোনও কথোপকথন নেই।' },
  'messages.newAbout': { en: 'New message about', bn: 'নতুন বার্তা — বিষয়' },
  'messages.responseTypical': { en: 'Typically replies within', bn: 'সাধারণত উত্তর দেয়' },

  /* ----------------------------------------------------------- notifications */
  'notif.title': { en: 'Notifications', bn: 'নোটিফিকেশন' },
  'notif.empty': { en: 'Nothing to catch up on.', bn: 'নতুন কিছু নেই।' },
  'notif.unread': { en: 'unread', bn: 'অপঠিত' },
  'notif.settingsNote': {
    en: 'Order, quotation and dispute events push here and to your registered mobile number.',
    bn: 'অর্ডার, কোটেশন ও ডিসপিউটের ঘটনা এখানে এবং আপনার নিবন্ধিত মোবাইল নম্বরে যায়।',
  },

  /* -------------------------------------------------------------------- auth */
  'auth.signInTitle': { en: 'Sign in', bn: 'সাইন ইন' },
  'auth.signInSub': { en: 'One code to your mobile number. No password to forget.', bn: 'আপনার মোবাইলে একটি কোড। মনে রাখার মতো কোনও পাসওয়ার্ড নেই।' },
  'auth.registerTitle': { en: 'Create a buyer account', bn: 'ক্রেতা অ্যাকাউন্ট খুলুন' },
  'auth.registerSub': { en: 'Free. You need a business name and a mobile number — trade licence only if you want to sell.', bn: 'ফ্রি। ব্যবসার নাম ও মোবাইল নম্বর দরকার — বিক্রি করতে চাইলে কেবল তখনই ট্রেড লাইসেন্স।' },
  'auth.phone': { en: 'Mobile number', bn: 'মোবাইল নম্বর' },
  'auth.phoneHint': { en: '11 digits, starting 01', bn: '১১ সংখ্যা, ০১ দিয়ে শুরু' },
  'auth.business': { en: 'Business name', bn: 'ব্যবসার নাম' },
  'auth.district': { en: 'Main delivery district', bn: 'প্রধান ডেলিভারি জেলা' },
  'auth.continue': { en: 'Send me a code', bn: 'কোড পাঠান' },
  'auth.createAccount': { en: 'Create account', bn: 'অ্যাকাউন্ট খুলুন' },
  'auth.haveAccount': { en: 'Already have an account?', bn: 'অ্যাকাউন্ট আছে?' },
  'auth.noAccount': { en: 'New to ArcB2B?', bn: 'ArcB2B-এ নতুন?' },
  'auth.invalidPhone': { en: 'Enter an 11-digit Bangladeshi mobile number.', bn: '১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন।' },
  'auth.invalidBusiness': { en: 'Enter the name your trade licence is in.', bn: 'ট্রেড লাইসেন্সে যে নাম আছে সেটি দিন।' },
  'auth.stubNote': {
    en: 'Authentication needs the identity service and an SMS gateway, neither of which is part of this front-end prototype. The form validates exactly as it would in production.',
    bn: 'অথেনটিকেশনের জন্য আইডেন্টিটি সার্ভিস ও এসএমএস গেটওয়ে দরকার, যা এই ফ্রন্ট-এন্ড প্রোটোটাইপে নেই। ফর্মটি প্রোডাকশনের মতোই যাচাই করে।',
  },
  'auth.noPasswordNote': {
    en: 'No password. We send a one-time code to your mobile number, the same way bKash and Nagad already do — one fewer credential to lose.',
    bn: 'কোনও পাসওয়ার্ড নেই। আমরা আপনার মোবাইল নম্বরে একটি এককালীন কোড পাঠাই, বিকাশ ও নগদ যেভাবে করে — হারানোর মতো একটি জিনিস কম।',
  },
  'auth.sellerInstead': { en: 'Want to sell instead?', bn: 'বিক্রি করতে চান?' },

  /* ---------------------------------------------------------------- content */
  'content.updated': { en: 'Last updated', bn: 'সর্বশেষ হালনাগাদ' },
  'content.related': { en: 'Read next', bn: 'পরবর্তী পড়ুন' },
  'content.stillStuck': { en: 'Still stuck?', bn: 'এখনও সমাধান হয়নি?' },
  'content.stillStuckBody': {
    en: 'Message the seller from the product page — the SKU, your quantity and the ladder price travel with the conversation, so nobody has to ask what you are looking at.',
    bn: 'পণ্যের পেজ থেকে বিক্রেতাকে বার্তা দিন — SKU, আপনার পরিমাণ ও ল্যাডার মূল্য কথোপকথনের সঙ্গে যায়, তাই আপনি কী দেখছেন তা কাউকে জিজ্ঞেস করতে হয় না।',
  },
} as const satisfies Record<string, Bilingual>;

export type StringKey = keyof typeof STRINGS;

/** Bound translator. Server components call `const t = translator(lang)`. */
export function translator(lang: Lang): (key: StringKey) => string {
  return (key) => pick(STRINGS[key], lang);
}

/**
 * Count-aware lookup.
 *
 * English inflects these nouns and Bengali does not, so both keys resolve to the
 * same Bengali string while English gets the distinction. Without this the page
 * says '1 listings', which is the kind of small wrongness that makes a buyer
 * doubt the numbers next to it.
 */
export function tn(lang: Lang, count: number, one: StringKey, many: StringKey): string {
  return t(lang, count === 1 ? one : many);
}

export function t(lang: Lang, key: StringKey): string {
  return pick(STRINGS[key], lang);
}

/** Locale-prefixed href. Every internal link goes through this. */
export function localeHref(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${clean === '/' ? '' : clean}`;
}

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  bn: 'বাংলা',
};

/** `hreflang` values for the metadata alternates map. */
export const HREFLANG: Record<Locale, string> = {
  en: 'en-BD',
  bn: 'bn-BD',
};
