import type { Bilingual } from '@/lib/types';

/**
 * Content pages, as data.
 *
 * Every informational link in the chrome and the footer resolves here through a
 * single catch-all route. The alternative — a file per page — meant seventeen
 * near-identical routes, and the practical result of that cost is what the
 * footer looked like before: links that went nowhere.
 *
 * Content is deliberately short. These pages exist to answer one question each;
 * a buyer who wanted an essay would have called.
 */

export type PageBlock =
  | { type: 'paragraph'; text: Bilingual }
  | { type: 'heading'; text: Bilingual }
  | { type: 'list'; items: Bilingual[] }
  | { type: 'steps'; items: Bilingual[] }
  | { type: 'note'; text: Bilingual }
  | { type: 'facts'; rows: Array<[Bilingual, Bilingual]> };

export interface ContentPage {
  /** Locale-relative path, e.g. `/help/bulk`. */
  path: string;
  title: Bilingual;
  intro: Bilingual;
  /** ISO date, shown on legal pages where currency matters. */
  updated?: string;
  blocks: PageBlock[];
  /** Paths of pages worth reading next. */
  related?: string[];
}

const p = (en: string, bn: string): { type: 'paragraph'; text: Bilingual } => ({
  type: 'paragraph',
  text: { en, bn },
});
const h = (en: string, bn: string): { type: 'heading'; text: Bilingual } => ({
  type: 'heading',
  text: { en, bn },
});
const li = (pairs: Array<[string, string]>): { type: 'list'; items: Bilingual[] } => ({
  type: 'list',
  items: pairs.map(([en, bn]) => ({ en, bn })),
});
const steps = (pairs: Array<[string, string]>): { type: 'steps'; items: Bilingual[] } => ({
  type: 'steps',
  items: pairs.map(([en, bn]) => ({ en, bn })),
});
const note = (en: string, bn: string): { type: 'note'; text: Bilingual } => ({
  type: 'note',
  text: { en, bn },
});
const facts = (
  rows: Array<[string, string, string, string]>,
): { type: 'facts'; rows: Array<[Bilingual, Bilingual]> } => ({
  type: 'facts',
  rows: rows.map(([kEn, kBn, vEn, vBn]) => [
    { en: kEn, bn: kBn },
    { en: vEn, bn: vBn },
  ]),
});

export const CONTENT_PAGES: ContentPage[] = [
  /* ------------------------------------------------------------------ buying */
  {
    path: '/how-it-works',
    title: { en: 'How buying on ArcB2B works', bn: 'ArcB2B-এ কেনা কীভাবে কাজ করে' },
    intro: {
      en: 'Wholesale pricing you can read before you ask, payment held in escrow until you confirm delivery, and courier costs quoted against your district.',
      bn: 'জিজ্ঞেস করার আগেই দেখা যায় এমন পাইকারি মূল্য, ডেলিভারি নিশ্চিত করা পর্যন্ত এসক্রোতে পেমেন্ট, এবং আপনার জেলার জন্য কুরিয়ারের দর।',
    },
    blocks: [
      steps([
        [
          'Find the line. Search or browse the category tree. Every listing shows its minimum order and the price at each quantity tier — no enquiry needed to see a number.',
          'পণ্য খুঁজুন। সার্চ করুন বা ক্যাটাগরি দেখুন। প্রতিটি লিস্টিংয়ে সর্বনিম্ন অর্ডার ও প্রতিটি টিয়ারের দাম দেখা যায় — দাম জানতে কোনও অনুরোধ লাগে না।',
        ],
        [
          'Build your mix. Enter a quantity per variant in the grid. The minimum applies to the total, not to each cell, so you can spread one order across colours and sizes.',
          'আপনার মিক্স তৈরি করুন। গ্রিডে প্রতি ভ্যারিয়েন্টে পরিমাণ দিন। সর্বনিম্ন প্রযোজ্য মোট পরিমাণে, প্রতিটি ঘরে নয় — তাই এক অর্ডারে রঙ ও সাইজ মিশিয়ে নিতে পারেন।',
        ],
        [
          'Check the landed cost. The panel adds courier and payment fee to the goods total and shows what you actually pay per piece — the figure to set your shelf price from.',
          'সর্বমোট খরচ দেখুন। প্যানেল পণ্যের দামের সঙ্গে কুরিয়ার ও পেমেন্ট ফি যোগ করে প্রতি পিসে প্রকৃত খরচ দেখায় — এই হিসাবেই বিক্রয়মূল্য ঠিক করুন।',
        ],
        [
          'Pay into escrow. Funds sit on the platform ledger. The seller is paid when you confirm delivery, or automatically after the dispute window closes.',
          'এসক্রোতে পেমেন্ট করুন। টাকা প্ল্যাটফর্ম লেজারে থাকে। আপনি ডেলিভারি নিশ্চিত করলে, বা ডিসপিউট উইন্ডো শেষ হলে বিক্রেতা টাকা পান।',
        ],
        [
          'Receive and confirm. Track the consignment, check the goods against the listing, and confirm. If something is wrong, open a dispute with photos inside seven days.',
          'পণ্য নিন ও নিশ্চিত করুন। কনসাইনমেন্ট ট্র্যাক করুন, লিস্টিংয়ের সঙ্গে মিলিয়ে দেখুন, তারপর নিশ্চিত করুন। সমস্যা হলে ৭ দিনের মধ্যে ছবিসহ ডিসপিউট খুলুন।',
        ],
      ]),
      h('If it is not listed', 'তালিকায় না থাকলে'),
      p(
        'Post a sourcing request with the quantity, a target price and your delivery district. Verified suppliers quote against it and you compare the replies side by side before committing to anything.',
        'পরিমাণ, কাঙ্ক্ষিত দাম ও ডেলিভারি জেলা দিয়ে একটি সোর্সিং অনুরোধ দিন। যাচাইকৃত সরবরাহকারীরা কোট দেবেন এবং আপনি কিছু চূড়ান্ত করার আগে পাশাপাশি তুলনা করবেন।',
      ),
    ],
    related: ['/help/payment', '/help/shipping', '/help/bulk'],
  },
  {
    path: '/help',
    title: { en: 'Help centre', bn: 'হেল্প সেন্টার' },
    intro: {
      en: 'Answers to what buyers ask most. If none of these covers it, message the seller from the product page — product context travels with the conversation.',
      bn: 'ক্রেতারা যা সবচেয়ে বেশি জিজ্ঞেস করেন। এখানে না পেলে পণ্যের পেজ থেকে বিক্রেতাকে বার্তা দিন — পণ্যের তথ্য কথোপকথনের সঙ্গে যায়।',
    },
    blocks: [
      p(
        'Every topic below is written for a shop owner placing a real order, not for a browser. Where a rule has a number attached — a dispute window, a fee, a weight band — the number is stated.',
        'নিচের প্রতিটি বিষয় প্রকৃত অর্ডার দেওয়া দোকানদারের জন্য লেখা। যেখানে কোনও নিয়মের সঙ্গে সংখ্যা জড়িত — ডিসপিউট উইন্ডো, ফি, ওজনের ব্যান্ড — সেই সংখ্যা উল্লেখ করা আছে।',
      ),
    ],
    related: [
      '/help/bulk',
      '/help/payment',
      '/help/shipping',
      '/help/disputes',
      '/help/report',
      '/how-it-works',
    ],
  },
  {
    path: '/help/bulk',
    title: { en: 'Bulk and volume ordering', bn: 'বাল্ক ও ভলিউম অর্ডার' },
    intro: {
      en: 'How minimums, quantity tiers and volume negotiation work.',
      bn: 'সর্বনিম্ন পরিমাণ, টিয়ার ও ভলিউম আলোচনা কীভাবে কাজ করে।',
    },
    blocks: [
      h('Minimum order quantity', 'সর্বনিম্ন অর্ডার পরিমাণ'),
      p(
        'MOQ is the smallest order a seller will produce or pick. It applies to the order total across every variant, so 50 pieces can be five colours of ten. Some lines also carry a step — a carton multiple — and the panel rounds up for you rather than rejecting the number.',
        'MOQ হলো বিক্রেতা যে সর্বনিম্ন পরিমাণ তৈরি বা প্রস্তুত করবেন। এটি সব ভ্যারিয়েন্ট মিলিয়ে মোট অর্ডারে প্রযোজ্য — তাই ৫০ পিস মানে দশটি করে পাঁচ রঙ হতে পারে। কিছু পণ্যে কার্টনের গুণিতকও থাকে, এবং প্যানেল সংখ্যা বাতিল না করে বাড়িয়ে দেয়।',
      ),
      h('Quantity tiers', 'পরিমাণ টিয়ার'),
      p(
        'Published prices step down at fixed quantities. The tier that applies is the one your total reaches — you do not have to ask for it, and the panel shows how many more units unlock the next step and what that saves in Taka.',
        'নির্দিষ্ট পরিমাণে প্রকাশিত দাম কমে। আপনার মোট পরিমাণ যে টিয়ারে পৌঁছায় সেটিই প্রযোজ্য — চাইতে হয় না, এবং প্যানেল দেখায় পরের ধাপে যেতে আরও কত লাগবে ও কত টাকা সাশ্রয় হবে।',
      ),
      h('Above the top tier', 'সর্বোচ্চ টিয়ারের উপরে'),
      p(
        'A published ladder stops being the right instrument past roughly twice its top tier. At that point request a volume quote: the seller prices against your actual quantity, delivery date and any customisation, and the reply is a firm figure with a validity period.',
        'সর্বোচ্চ টিয়ারের প্রায় দ্বিগুণের পরে প্রকাশিত ল্যাডার আর সঠিক মাপকাঠি নয়। তখন ভলিউম কোট চান: বিক্রেতা আপনার প্রকৃত পরিমাণ, ডেলিভারির তারিখ ও কাস্টমাইজেশন ধরে দাম দেবেন, এবং উত্তরে একটি নির্দিষ্ট মেয়াদসহ দর পাবেন।',
      ),
      note(
        'Samples are priced separately and, on most lines, credited against a first bulk order. The product page states the sample price and the credit rule where one applies.',
        'স্যাম্পলের দাম আলাদা এবং বেশিরভাগ পণ্যে প্রথম বাল্ক অর্ডারে সমন্বয় হয়। প্রযোজ্য হলে পণ্যের পেজে স্যাম্পলের দাম ও সমন্বয়ের নিয়ম লেখা থাকে।',
      ),
    ],
    related: ['/rfq/new', '/how-it-works', '/help/payment'],
  },
  {
    path: '/help/payment',
    title: { en: 'Escrow and payment', bn: 'এসক্রো ও পেমেন্ট' },
    intro: {
      en: 'What happens to your money between paying and receiving.',
      bn: 'পেমেন্ট ও পণ্য পাওয়ার মাঝে আপনার টাকার কী হয়।',
    },
    blocks: [
      p(
        'Payment does not go to the seller when you pay. It is held on the ArcB2B ledger and released when you confirm delivery, or automatically once the dispute window closes without a claim. Opening a dispute freezes the release until it is resolved.',
        'আপনি পেমেন্ট করলে টাকা সরাসরি বিক্রেতার কাছে যায় না। এটি ArcB2B লেজারে থাকে এবং আপনি ডেলিভারি নিশ্চিত করলে, বা ডিসপিউট উইন্ডো দাবি ছাড়াই শেষ হলে ছাড়া হয়। ডিসপিউট খুললে নিষ্পত্তি পর্যন্ত ছাড় স্থগিত থাকে।',
      ),
      h('Methods and fees', 'পদ্ধতি ও ফি'),
      facts([
        ['bKash', 'বিকাশ', '1.5% gateway fee', '১.৫% গেটওয়ে ফি'],
        ['Nagad', 'নগদ', '1.4% gateway fee', '১.৪% গেটওয়ে ফি'],
        ['Rocket', 'রকেট', '1.6% gateway fee', '১.৬% গেটওয়ে ফি'],
        [
          'Bank transfer',
          'ব্যাংক ট্রান্সফার',
          'No fee. Upload proof of payment; verification is same working day.',
          'কোনও ফি নেই। পেমেন্টের প্রমাণ আপলোড করুন; একই কর্মদিবসে যাচাই।',
        ],
      ]),
      p(
        'The fee is shown as its own line in the landed-cost breakdown before you commit, so the total you read on the product page is the total on the invoice.',
        'চূড়ান্ত করার আগেই সর্বমোট খরচের হিসাবে ফি আলাদা লাইনে দেখানো হয় — তাই পণ্যের পেজে দেখা মোট টাকাই বিলে থাকে।',
      ),
      h('Advance payment on sourced orders', 'সোর্সড অর্ডারে অগ্রিম'),
      p(
        'Made-to-order lines above 1,000 pieces can be split: 50% on order confirmation, the balance before dispatch. Both instalments sit in escrow. Ask in the quote if you need these terms.',
        '১,০০০ পিসের বেশি অর্ডারে তৈরি পণ্যে ভাগ করা যায়: অর্ডার নিশ্চিত হলে ৫০%, পাঠানোর আগে বাকি। দুটি কিস্তিই এসক্রোতে থাকে। প্রয়োজন হলে কোটে জানান।',
      ),
      note(
        'ArcB2B never stores card or wallet credentials. Payment happens on the gateway’s own hosted flow and the callback signature is verified server-side.',
        'ArcB2B কখনও কার্ড বা ওয়ালেটের তথ্য সংরক্ষণ করে না। পেমেন্ট গেটওয়ের নিজস্ব পেজে হয় এবং কলব্যাক সিগনেচার সার্ভারে যাচাই করা হয়।',
      ),
    ],
    related: ['/help/disputes', '/legal/refunds', '/how-it-works'],
  },
  {
    path: '/help/shipping',
    title: { en: 'Shipping and couriers', bn: 'শিপিং ও কুরিয়ার' },
    intro: {
      en: 'Who carries your order, what it costs, and when it moves.',
      bn: 'কে আপনার অর্ডার নিয়ে যায়, কত খরচ, এবং কখন পাঠানো হয়।',
    },
    blocks: [
      p(
        'Four couriers quote on every order: Pathao, Steadfast, RedX and eCourier. Rates are banded by district zone and billed on whole kilos, minimum one. The product page shows the cost and the delivery window for each, and you choose — a slower, cheaper carrier is often the right call on a large order.',
        'প্রতিটি অর্ডারে চারটি কুরিয়ার দর দেয়: পাঠাও, স্টেডফাস্ট, রেডএক্স ও ইকুরিয়ার। দর জেলা-জোন অনুযায়ী এবং পূর্ণ কেজিতে হিসাব হয়, সর্বনিম্ন এক কেজি। পণ্যের পেজে প্রতিটির খরচ ও সময় দেখা যায়, এবং আপনি বেছে নেন।',
      ),
      h('Free delivery thresholds', 'ফ্রি ডেলিভারির সীমা'),
      facts([
        ['Dhaka Metro', 'ঢাকা মেট্রো', 'Free above ৳50,000', '৫০,০০০ টাকার উপরে ফ্রি'],
        ['Dhaka suburbs', 'ঢাকার আশপাশ', 'Free above ৳65,000', '৬৫,০০০ টাকার উপরে ফ্রি'],
        ['Divisional cities', 'বিভাগীয় শহর', 'Free above ৳90,000', '৯০,০০০ টাকার উপরে ফ্রি'],
        ['Other districts', 'অন্য জেলা', 'Quoted per consignment', 'কনসাইনমেন্ট অনুযায়ী দর'],
      ]),
      h('When the clock starts', 'সময় গণনা শুরু কখন'),
      p(
        'Stocked lines dispatch within the lead time shown on the listing. Made-to-order lines dispatch after payment confirmation, not after the order is placed — the distinction is the single largest cause of delivery disputes, so the page states it before the button, not after.',
        'স্টকে থাকা পণ্য লিস্টিংয়ে দেখানো সময়ের মধ্যে পাঠানো হয়। অর্ডারে তৈরি পণ্য পেমেন্ট নিশ্চিত হওয়ার পর পাঠানো হয়, অর্ডার দেওয়ার পর নয় — এই পার্থক্যই ডেলিভারি ডিসপিউটের সবচেয়ে বড় কারণ, তাই পেজে বাটনের আগেই তা লেখা থাকে।',
      ),
      note(
        'Consignments over 200 kg move by truck freight rather than parcel courier and are quoted separately. Carton count and gross weight are shown on the product page so you can arrange your own pickup instead if that is cheaper.',
        '২০০ কেজির বেশি কনসাইনমেন্ট পার্সেল কুরিয়ারের বদলে ট্রাক ফ্রেইটে যায় এবং আলাদা দর হয়। কার্টনের সংখ্যা ও গ্রস ওজন পণ্যের পেজে থাকে, তাই সস্তা হলে নিজে পিকআপের ব্যবস্থাও করতে পারেন।',
      ),
    ],
    related: ['/help/payment', '/how-it-works', '/help/disputes'],
  },
  {
    path: '/help/disputes',
    title: { en: 'Returns and disputes', bn: 'রিটার্ন ও ডিসপিউট' },
    intro: {
      en: 'What to do when the goods do not match the listing.',
      bn: 'পণ্য লিস্টিংয়ের সঙ্গে না মিললে কী করবেন।',
    },
    blocks: [
      p(
        'You have seven days from delivery to open a dispute. Photograph the problem against the carton label — the batch reference printed there is what lets a claim be traced to a production run rather than argued in the abstract.',
        'ডেলিভারির পর ৭ দিন সময় আছে ডিসপিউট খোলার। কার্টনের লেবেলের পাশে সমস্যার ছবি তুলুন — সেখানে ছাপা ব্যাচ রেফারেন্সই দাবিটিকে নির্দিষ্ট প্রোডাকশন রানে চিহ্নিত করতে দেয়।',
      ),
      h('What counts', 'যা গ্রহণযোগ্য'),
      li([
        ['Short shipment, wrong variant, or wrong quantity against the order.', 'কম পণ্য, ভুল ভ্যারিয়েন্ট, বা অর্ডারের চেয়ে ভুল পরিমাণ।'],
        ['Dead or damaged units beyond the tolerance stated on the listing.', 'লিস্টিংয়ে উল্লিখিত সহনসীমার বেশি নষ্ট বা ক্ষতিগ্রস্ত ইউনিট।'],
        ['Material difference from the specification or the gallery photography.', 'স্পেসিফিকেশন বা ছবির সঙ্গে বাস্তব পার্থক্য।'],
        ['Certification claimed on the listing that cannot be produced on request.', 'লিস্টিংয়ে দাবি করা সার্টিফিকেশন চাওয়া হলে দেখাতে না পারা।'],
      ]),
      h('What does not', 'যা গ্রহণযোগ্য নয়'),
      li([
        ['Normal variation on hand-made or hand-printed goods, where the listing says so.', 'হাতে তৈরি বা হ্যান্ড-প্রিন্ট পণ্যে স্বাভাবিক পার্থক্য, যদি লিস্টিংয়ে বলা থাকে।'],
        ['A change of mind after dispatch on a made-to-order line.', 'অর্ডারে তৈরি পণ্য পাঠানোর পর সিদ্ধান্ত বদল।'],
        ['Courier delay inside the quoted window.', 'দেওয়া সময়ের মধ্যে কুরিয়ার বিলম্ব।'],
      ]),
      p(
        'Escrow release freezes while a dispute is open. Most are settled by replacement of the affected units on the next consignment; a refund to the original payment method is the fallback where replacement is not practical.',
        'ডিসপিউট চলাকালীন এসক্রো ছাড় স্থগিত থাকে। বেশিরভাগ নিষ্পত্তি হয় পরবর্তী কনসাইনমেন্টে ক্ষতিগ্রস্ত ইউনিট বদলে দিয়ে; বদল সম্ভব না হলে মূল পেমেন্ট পদ্ধতিতে রিফান্ড।',
      ),
    ],
    related: ['/legal/refunds', '/help/payment', '/help/report'],
  },
  {
    path: '/help/report',
    title: { en: 'Report a listing', bn: 'লিস্টিং রিপোর্ট করুন' },
    intro: {
      en: 'Counterfeit goods, false certification claims or misleading photography.',
      bn: 'নকল পণ্য, মিথ্যা সার্টিফিকেশন দাবি বা বিভ্রান্তিকর ছবি।',
    },
    blocks: [
      p(
        'Use the report link on the product page, or message support with the SKU. A report puts the listing into review; if it is suspended, existing orders are honoured or refunded and the seller’s performance metrics stop publishing until verification completes.',
        'পণ্যের পেজের রিপোর্ট লিংক ব্যবহার করুন, বা SKU দিয়ে সাপোর্টে বার্তা দিন। রিপোর্ট করলে লিস্টিং পর্যালোচনায় যায়; স্থগিত হলে চলমান অর্ডার পূরণ বা রিফান্ড হয় এবং যাচাই শেষ না হওয়া পর্যন্ত বিক্রেতার মেট্রিক প্রকাশ বন্ধ থাকে।',
      ),
      h('What helps a report land', 'রিপোর্ট কার্যকর করতে যা দরকার'),
      li([
        ['The SKU and the specific claim you believe is false.', 'SKU এবং আপনি যে দাবিটি মিথ্যা মনে করছেন।'],
        ['Photographs of what arrived, next to the listing photograph.', 'যা এসেছে তার ছবি, লিস্টিংয়ের ছবির পাশে।'],
        ['The certificate or document you were shown, if any.', 'আপনাকে দেখানো সার্টিফিকেট বা নথি, যদি থাকে।'],
      ]),
    ],
    related: ['/help/disputes', '/legal/terms'],
  },

  /* ----------------------------------------------------------------- selling */
  {
    path: '/sell',
    title: { en: 'Sell on ArcB2B', bn: 'ArcB2B-এ বিক্রি করুন' },
    intro: {
      en: 'Reach shop owners who reorder. Publish real prices, get paid through escrow, and let the platform handle courier booking and disputes.',
      bn: 'যারা বারবার অর্ডার করেন তাদের কাছে পৌঁছান। প্রকৃত দাম প্রকাশ করুন, এসক্রোর মাধ্যমে পেমেন্ট নিন, এবং কুরিয়ার বুকিং ও ডিসপিউট প্ল্যাটফর্মে ছেড়ে দিন।',
    },
    blocks: [
      h('What you publish', 'আপনি যা প্রকাশ করেন'),
      li([
        ['A quantity ladder, not a single price. Buyers self-serve instead of messaging for a number, which is what makes a listing convert without staff time.', 'একটি পরিমাণ ল্যাডার, একটি দাম নয়। ক্রেতারা নিজেই দেখে নেন, বার্তা দিতে হয় না — এতেই কর্মী সময় ছাড়া বিক্রি হয়।'],
        ['A variant grid with real stock per SKU, so an order arrives pickable.', 'প্রতি SKU-তে প্রকৃত স্টকসহ ভ্যারিয়েন্ট গ্রিড, যাতে অর্ডার এলেই প্রস্তুত করা যায়।'],
        ['Carton quantity, gross weight and dimensions — these drive the courier quote the buyer sees.', 'কার্টনের সংখ্যা, গ্রস ওজন ও মাপ — এগুলোই ক্রেতার দেখা কুরিয়ার দর ঠিক করে।'],
        ['Lead time, and separately a production window if the line is made to order.', 'লিড টাইম, এবং অর্ডারে তৈরি হলে আলাদাভাবে প্রোডাকশন উইন্ডো।'],
      ]),
      h('What we measure', 'আমরা যা পরিমাপ করি'),
      p(
        'Four figures appear on your storefront: response rate, on-time dispatch, reorder rate and dispute resolution. All four are computed from transactions — none can be edited, and none publishes until there is enough history for the number to mean anything.',
        'আপনার স্টোরফ্রন্টে চারটি সংখ্যা দেখা যায়: রেসপন্স রেট, সময়মতো পাঠানো, রি-অর্ডার রেট ও ডিসপিউট নিষ্পত্তি। চারটিই লেনদেন থেকে হিসাব হয় — সম্পাদনা করা যায় না, এবং সংখ্যাটি অর্থবহ হওয়ার মতো তথ্য না থাকলে প্রকাশও হয় না।',
      ),
      note(
        'Reorder rate is the one buyers read hardest. It is the share of your buyers who came back inside six months, and nothing improves it except shipping what the listing said.',
        'রি-অর্ডার রেটই ক্রেতারা সবচেয়ে মনোযোগ দিয়ে দেখেন। এটি ছয় মাসের মধ্যে ফিরে আসা ক্রেতার হার, এবং লিস্টিং অনুযায়ী পণ্য পাঠানো ছাড়া এটি বাড়ানোর কিছু নেই।',
      ),
    ],
    related: ['/sell/verification', '/sell/fees', '/sell/handbook'],
  },
  {
    path: '/sell/verification',
    title: { en: 'Supplier verification', bn: 'সরবরাহকারী যাচাই' },
    intro: {
      en: 'What we check before a storefront can publish, and what buyers see as a result.',
      bn: 'স্টোরফ্রন্ট প্রকাশের আগে আমরা যা যাচাই করি, এবং ক্রেতারা তার ফলে যা দেখেন।',
    },
    blocks: [
      h('Documents', 'নথিপত্র'),
      li([
        ['Trade licence, current year, matching the business name on the account.', 'ট্রেড লাইসেন্স, চলতি বছরের, অ্যাকাউন্টের ব্যবসার নামের সঙ্গে মিল।'],
        ['VAT registration (BIN) where turnover requires it.', 'টার্নওভার অনুযায়ী প্রয়োজন হলে ভ্যাট রেজিস্ট্রেশন (BIN)।'],
        ['Bank account in the business name, for escrow release.', 'এসক্রো ছাড়ের জন্য ব্যবসার নামে ব্যাংক অ্যাকাউন্ট।'],
        ['National ID of the signing owner or director.', 'স্বাক্ষরকারী মালিক বা পরিচালকের জাতীয় পরিচয়পত্র।'],
      ]),
      h('Product-level claims', 'পণ্যভিত্তিক দাবি'),
      p(
        'Certification claims are verified separately from the storefront. A CE, RoHS or OEKO-TEX chip only appears on a listing when the document behind it has been uploaded and checked — a claim with nothing to open does not render at all.',
        'সার্টিফিকেশন দাবি স্টোরফ্রন্ট থেকে আলাদাভাবে যাচাই হয়। CE, RoHS বা OEKO-TEX চিপ কেবল তখনই দেখা যায় যখন এর পেছনের নথি আপলোড ও যাচাই হয়েছে — যে দাবির পেছনে কিছু খোলার নেই তা আদৌ দেখানো হয় না।',
      ),
      note(
        'An unverified storefront can be created and can prepare listings, but cannot publish or take orders. Buyers see "under review" instead of performance metrics.',
        'অযাচাইকৃত স্টোরফ্রন্ট তৈরি করা ও লিস্টিং প্রস্তুত করা যায়, তবে প্রকাশ বা অর্ডার নেওয়া যায় না। ক্রেতারা পারফরম্যান্স মেট্রিকের বদলে "পর্যালোচনায়" দেখেন।',
      ),
    ],
    related: ['/sell', '/sell/fees'],
  },
  {
    path: '/sell/fees',
    title: { en: 'Seller fees', bn: 'সেলার ফি' },
    intro: {
      en: 'One commission, no listing fee, no monthly charge.',
      bn: 'একটি কমিশন, কোনও লিস্টিং ফি নেই, মাসিক চার্জ নেই।',
    },
    blocks: [
      facts([
        ['Listing', 'লিস্টিং', 'Free, unlimited SKUs', 'ফ্রি, সীমাহীন SKU'],
        ['Commission', 'কমিশন', '4% of goods value on a completed order', 'সম্পন্ন অর্ডারের পণ্যমূল্যের ৪%'],
        ['Escrow release', 'এসক্রো ছাড়', 'Free to a bank account in the business name', 'ব্যবসার নামে ব্যাংক অ্যাকাউন্টে ফ্রি'],
        ['Courier booking', 'কুরিয়ার বুকিং', 'At carrier rate, no markup', 'ক্যারিয়ারের দরে, কোনও মার্কআপ নেই'],
        ['Disputed order', 'ডিসপিউটেড অর্ডার', 'No commission on a refunded amount', 'রিফান্ড করা অর্থে কমিশন নেই'],
      ]),
      p(
        'Commission is charged on goods value only — never on the courier cost or the payment gateway fee, because charging a percentage of someone else’s fee is not a service. It is deducted at escrow release, so there is no invoice to settle separately.',
        'কমিশন কেবল পণ্যমূল্যে ধরা হয় — কুরিয়ার খরচ বা পেমেন্ট গেটওয়ে ফিতে কখনও নয়, কারণ অন্যের ফির শতকরা অংশ নেওয়া কোনও সেবা নয়। এটি এসক্রো ছাড়ের সময় কাটা হয়, তাই আলাদা বিল মেটাতে হয় না।',
      ),
    ],
    related: ['/sell', '/help/payment'],
  },
  {
    path: '/sell/handbook',
    title: { en: 'Seller handbook', bn: 'সেলার হ্যান্ডবুক' },
    intro: {
      en: 'The practices that separate a storefront buyers reorder from one they try once.',
      bn: 'যে অভ্যাসগুলো বারবার অর্ডার পাওয়া স্টোরফ্রন্টকে একবার চেষ্টা করা স্টোরফ্রন্ট থেকে আলাদা করে।',
    },
    blocks: [
      h('Photograph honestly', 'সৎভাবে ছবি তুলুন'),
      p(
        'Shoot the batch you are shipping, under neutral light, and mark supplier-provided photography as such. A shade that does not match the gallery is the most common three-star review on this platform, and it is entirely avoidable.',
        'যে ব্যাচ পাঠাচ্ছেন সেটির ছবি তুলুন, স্বাভাবিক আলোয়, এবং সরবরাহকারীর দেওয়া ছবি হলে তা উল্লেখ করুন। ছবির সঙ্গে রঙ না মেলা এই প্ল্যাটফর্মে সবচেয়ে সাধারণ তিন-তারা রিভিউ, এবং এটি সম্পূর্ণ এড়ানো যায়।',
      ),
      h('State the tolerance', 'সহনসীমা লিখুন'),
      p(
        'If two units in a hundred arrive dead, say so on the listing. A stated tolerance is a specification; an unstated one is a dispute. The same applies to registration drift on hand-printed goods and to shrinkage on unwashed fabric.',
        'একশোতে দুটি নষ্ট আসতে পারলে লিস্টিংয়ে লিখুন। উল্লিখিত সহনসীমা একটি স্পেসিফিকেশন; না লেখা সহনসীমা একটি ডিসপিউট। হ্যান্ড-প্রিন্ট পণ্যের রেজিস্ট্রেশন ও আনওয়াশড কাপড়ের শ্রিংকেজেও একই নিয়ম।',
      ),
      h('Answer inside a working day', 'এক কর্মদিবসের মধ্যে উত্তর দিন'),
      p(
        'Response rate counts messages answered within 24 hours over the last 90 days, and it sits beside your name on every listing. A quote that arrives two days late has usually already lost.',
        'রেসপন্স রেট গত ৯০ দিনে ২৪ ঘণ্টার মধ্যে দেওয়া উত্তরের হিসাব, এবং এটি প্রতিটি লিস্টিংয়ে আপনার নামের পাশে থাকে। দুই দিন দেরিতে আসা কোট সাধারণত আগেই হেরে গেছে।',
      ),
      h('Reply to reviews, including the bad ones', 'রিভিউয়ের উত্তর দিন, খারাপগুলোতেও'),
      p(
        'A reply that names what went wrong and what changed reads as competence. Buyers weigh a three-star review with a substantive reply above a four-star review with silence.',
        'কী ভুল হয়েছিল ও কী বদলেছে তা লেখা উত্তর দক্ষতার প্রমাণ। ক্রেতারা যুক্তিপূর্ণ উত্তরসহ তিন-তারা রিভিউকে নীরব চার-তারা রিভিউয়ের চেয়ে বেশি মূল্য দেন।',
      ),
    ],
    related: ['/sell', '/sell/verification', '/sell/fees'],
  },

  /* ------------------------------------------------------------------- legal */
  {
    path: '/legal/terms',
    title: { en: 'Terms of service', bn: 'সেবার শর্তাবলী' },
    intro: {
      en: 'The agreement between ArcB2B, buyers and sellers using the platform.',
      bn: 'ArcB2B, ক্রেতা ও বিক্রেতাদের মধ্যে চুক্তি।',
    },
    updated: '2026-08-01',
    blocks: [
      h('The platform’s role', 'প্ল্যাটফর্মের ভূমিকা'),
      p(
        'ArcB2B operates in two modes. Where a listing is sold by ArcB2B Sourcing, ArcB2B is the seller of record. Where a listing is sold by a supplier storefront, ArcB2B is the marketplace and escrow agent, and the contract of sale is between buyer and supplier. Every listing states which applies.',
        'ArcB2B দুইভাবে কাজ করে। যেখানে ArcB2B Sourcing বিক্রেতা, সেখানে ArcB2B-ই রেকর্ডকৃত বিক্রেতা। যেখানে সরবরাহকারীর স্টোরফ্রন্ট বিক্রেতা, সেখানে ArcB2B মার্কেটপ্লেস ও এসক্রো এজেন্ট, এবং বিক্রয় চুক্তি ক্রেতা ও সরবরাহকারীর মধ্যে। প্রতিটি লিস্টিংয়ে তা লেখা থাকে।',
      ),
      h('Prices and quotations', 'মূল্য ও কোটেশন'),
      p(
        'Published tier prices are an offer to sell at the stated quantity while the listing remains active. A quotation is binding on the seller for the validity period stated in it. Landed-cost figures shown before checkout are estimates until courier and payment method are confirmed at checkout.',
        'প্রকাশিত টিয়ার মূল্য লিস্টিং সক্রিয় থাকা পর্যন্ত উল্লিখিত পরিমাণে বিক্রির প্রস্তাব। কোটেশন তাতে উল্লিখিত মেয়াদ পর্যন্ত বিক্রেতার জন্য বাধ্যতামূলক। চেকআউটের আগে দেখানো সর্বমোট খরচ আনুমানিক, চেকআউটে কুরিয়ার ও পেমেন্ট পদ্ধতি নিশ্চিত হলে চূড়ান্ত।',
      ),
      h('Escrow', 'এসক্রো'),
      p(
        'Funds are held on the platform ledger and released on delivery confirmation or on expiry of the dispute window. ArcB2B may withhold release while a dispute is open and may set off a refund against a seller’s pending balance.',
        'টাকা প্ল্যাটফর্ম লেজারে থাকে এবং ডেলিভারি নিশ্চিত হলে বা ডিসপিউট উইন্ডো শেষ হলে ছাড়া হয়। ডিসপিউট চলাকালীন ArcB2B ছাড় স্থগিত রাখতে পারে এবং বিক্রেতার বকেয়া থেকে রিফান্ড সমন্বয় করতে পারে।',
      ),
      h('Prohibited listings', 'নিষিদ্ধ লিস্টিং'),
      li([
        ['Counterfeit goods or unlicensed use of a third-party mark.', 'নকল পণ্য বা তৃতীয় পক্ষের ট্রেডমার্কের অনুমতিহীন ব্যবহার।'],
        ['Goods requiring a licence the seller does not hold.', 'বিক্রেতার কাছে নেই এমন লাইসেন্স প্রয়োজন হয় এমন পণ্য।'],
        ['Certification claims without a verifiable document.', 'যাচাইযোগ্য নথি ছাড়া সার্টিফিকেশন দাবি।'],
      ]),
      h('Governing law', 'প্রযোজ্য আইন'),
      p(
        'These terms are governed by the laws of Bangladesh, and the courts of Dhaka have exclusive jurisdiction. Where a translation of these terms differs from the English text, the English text prevails.',
        'এই শর্তাবলী বাংলাদেশের আইন দ্বারা পরিচালিত এবং ঢাকার আদালতের একচ্ছত্র এলাকাধিকার রয়েছে। অনুবাদ ও ইংরেজি পাঠে পার্থক্য হলে ইংরেজি পাঠ প্রাধান্য পাবে।',
      ),
    ],
    related: ['/legal/privacy', '/legal/refunds'],
  },
  {
    path: '/legal/privacy',
    title: { en: 'Privacy policy', bn: 'গোপনীয়তা নীতি' },
    intro: {
      en: 'What we collect, why, and what we never store.',
      bn: 'আমরা কী সংগ্রহ করি, কেন, এবং কী কখনও সংরক্ষণ করি না।',
    },
    updated: '2026-08-01',
    blocks: [
      h('What we collect', 'আমরা যা সংগ্রহ করি'),
      li([
        ['Account details: business name, contact person, phone, email, delivery districts.', 'অ্যাকাউন্টের তথ্য: ব্যবসার নাম, যোগাযোগের ব্যক্তি, ফোন, ইমেল, ডেলিভারি জেলা।'],
        ['Transaction records: orders, quotations, messages, disputes and escrow movements.', 'লেনদেনের রেকর্ড: অর্ডার, কোটেশন, বার্তা, ডিসপিউট ও এসক্রো লেনদেন।'],
        ['Verification documents for sellers, retained for as long as the storefront is active.', 'বিক্রেতাদের যাচাই নথি, স্টোরফ্রন্ট সক্রিয় থাকা পর্যন্ত সংরক্ষিত।'],
      ]),
      h('What we never store', 'আমরা যা কখনও সংরক্ষণ করি না'),
      p(
        'Card numbers and mobile-wallet credentials. Payment happens on the gateway’s hosted flow; ArcB2B receives a signed result, not the instrument.',
        'কার্ড নম্বর ও মোবাইল ওয়ালেটের তথ্য। পেমেন্ট গেটওয়ের নিজস্ব পেজে হয়; ArcB2B একটি স্বাক্ষরিত ফলাফল পায়, পেমেন্ট ইনস্ট্রুমেন্ট নয়।',
      ),
      h('Sharing', 'শেয়ার করা'),
      p(
        'Your contact details reach a seller when you place an order or send a quotation request to them, and reach a courier when a consignment is booked. Nothing is sold to advertisers.',
        'আপনি অর্ডার দিলে বা কোটেশন অনুরোধ পাঠালে আপনার যোগাযোগের তথ্য বিক্রেতার কাছে যায়, এবং কনসাইনমেন্ট বুক হলে কুরিয়ারের কাছে যায়। বিজ্ঞাপনদাতাদের কাছে কিছু বিক্রি করা হয় না।',
      ),
      h('Your requests', 'আপনার অনুরোধ'),
      p(
        'You can ask for a copy of your data or for deletion of your account. Transaction records tied to a completed order, a dispute or a tax obligation are retained for the period the law requires, and deletion applies to everything else.',
        'আপনি আপনার তথ্যের কপি বা অ্যাকাউন্ট মুছে ফেলার অনুরোধ করতে পারেন। সম্পন্ন অর্ডার, ডিসপিউট বা করের সঙ্গে জড়িত রেকর্ড আইন অনুযায়ী নির্দিষ্ট সময় রাখা হয়, বাকি সব মুছে ফেলা হয়।',
      ),
    ],
    related: ['/legal/terms', '/legal/refunds'],
  },
  {
    path: '/legal/refunds',
    title: { en: 'Refund policy', bn: 'রিফান্ড নীতি' },
    intro: {
      en: 'When money comes back, how much, and how long it takes.',
      bn: 'কখন টাকা ফেরত আসে, কত, এবং কত সময় লাগে।',
    },
    updated: '2026-08-01',
    blocks: [
      facts([
        [
          'Cancelled before dispatch',
          'পাঠানোর আগে বাতিল',
          'Full refund of goods and courier, less the gateway fee already incurred.',
          'পণ্য ও কুরিয়ারের সম্পূর্ণ রিফান্ড, ইতিমধ্যে খরচ হওয়া গেটওয়ে ফি বাদে।',
        ],
        [
          'Short or wrong shipment',
          'কম বা ভুল পণ্য',
          'Refund or replacement of the affected units, at your choice.',
          'ক্ষতিগ্রস্ত ইউনিটের রিফান্ড বা বদল, আপনার পছন্দমতো।',
        ],
        [
          'Not as described',
          'বর্ণনার সঙ্গে অমিল',
          'Full refund including return courier, once the goods are collected.',
          'পণ্য ফেরত নেওয়ার পর রিটার্ন কুরিয়ারসহ সম্পূর্ণ রিফান্ড।',
        ],
        [
          'Change of mind',
          'সিদ্ধান্ত বদল',
          'Not refundable on made-to-order lines after production starts.',
          'উৎপাদন শুরুর পর অর্ডারে তৈরি পণ্যে ফেরতযোগ্য নয়।',
        ],
      ]),
      p(
        'Approved refunds return to the original payment method within five working days of approval. Bank transfers can take a further two working days to clear, which is the bank’s timetable rather than ours.',
        'অনুমোদিত রিফান্ড অনুমোদনের পাঁচ কর্মদিবসের মধ্যে মূল পেমেন্ট পদ্ধতিতে ফেরত যায়। ব্যাংক ট্রান্সফারে আরও দুই কর্মদিবস লাগতে পারে, যা ব্যাংকের সময়সূচি।',
      ),
      note(
        'Where an order was paid in instalments, a partial refund is applied against the most recent instalment first.',
        'কিস্তিতে পরিশোধিত অর্ডারে আংশিক রিফান্ড সবচেয়ে সাম্প্রতিক কিস্তির বিপরীতে প্রয়োগ হয়।',
      ),
    ],
    related: ['/help/disputes', '/help/payment', '/legal/terms'],
  },

  /* ----------------------------------------------------------------- company */
  {
    path: '/about',
    title: { en: 'About ArcB2B', bn: 'ArcB2B সম্পর্কে' },
    intro: {
      en: 'A wholesale marketplace built for Bangladeshi shop owners, where the price is on the page.',
      bn: 'বাংলাদেশের দোকানদারদের জন্য তৈরি পাইকারি মার্কেটপ্লেস, যেখানে দাম পেজেই থাকে।',
    },
    blocks: [
      p(
        'Sourcing in Bangladesh runs on conversation: you message ten suppliers, wait, and compare replies that arrive in different shapes. It works, and it is slow, and it makes comparing anything properly almost impossible.',
        'বাংলাদেশে সোর্সিং চলে কথাবার্তায়: দশজন সরবরাহকারীকে বার্তা দিন, অপেক্ষা করুন, তারপর ভিন্ন ভিন্ন আকারে আসা উত্তর মিলিয়ে দেখুন। এতে কাজ হয়, কিন্তু ধীরে, এবং ঠিকভাবে তুলনা করা প্রায় অসম্ভব হয়ে যায়।',
      ),
      p(
        'ArcB2B publishes the numbers instead. Every listing carries its minimum order, the price at each quantity tier, real stock per variant, and a courier estimate for your district — so the comparison happens before the conversation, and the conversation is about the things that actually need discussing: customisation, terms, and timing.',
        'ArcB2B বদলে সংখ্যাগুলো প্রকাশ করে। প্রতিটি লিস্টিংয়ে থাকে সর্বনিম্ন অর্ডার, প্রতিটি টিয়ারের দাম, প্রতি ভ্যারিয়েন্টে প্রকৃত স্টক, এবং আপনার জেলার কুরিয়ার হিসাব — তাই তুলনা কথাবার্তার আগেই হয়, আর কথা হয় সেসব নিয়ে যা নিয়ে আসলেই আলোচনা দরকার: কাস্টমাইজেশন, শর্ত ও সময়।',
      ),
      h('What we will not do', 'আমরা যা করব না'),
      li([
        ['Sell placement. Ranking is not for sale, and there is no badge you can buy.', 'অবস্থান বিক্রি। র‍্যাঙ্কিং বিক্রির জন্য নয়, এবং কেনা যায় এমন কোনও ব্যাজ নেই।'],
        ['Publish a metric we cannot compute from transactions.', 'লেনদেন থেকে হিসাব করা যায় না এমন কোনও মেট্রিক প্রকাশ।'],
        ['Run countdown timers on staple goods that are in stock every week.', 'প্রতি সপ্তাহে স্টকে থাকা নিত্যপণ্যে কাউন্টডাউন টাইমার চালানো।'],
      ]),
    ],
    related: ['/how-it-works', '/sell', '/careers'],
  },
  {
    path: '/careers',
    title: { en: 'Careers', bn: 'কর্মসংস্থান' },
    intro: {
      en: 'We are a small team in Dhaka building infrastructure for the wholesale trade.',
      bn: 'আমরা ঢাকার একটি ছোট দল, পাইকারি বাণিজ্যের জন্য পরিকাঠামো তৈরি করছি।',
    },
    blocks: [
      p(
        'Roles open at any time are listed below. If nothing fits and you think you should be here anyway, write to careers@arcb2b.com with something you have built.',
        'বর্তমানে খোলা পদ নিচে দেওয়া আছে। কিছু না মিললেও যদি মনে করেন আপনার এখানে থাকা উচিত, তাহলে আপনার তৈরি কিছু নিয়ে careers@arcb2b.com-এ লিখুন।',
      ),
      h('Open roles', 'খোলা পদ'),
      li([
        ['Senior frontend engineer — Next.js, TypeScript, design systems. Dhaka or remote in +06.', 'সিনিয়র ফ্রন্টএন্ড ইঞ্জিনিয়ার — Next.js, TypeScript, ডিজাইন সিস্টেম। ঢাকা বা +০৬ টাইমজোনে রিমোট।'],
        ['Category manager, electronics — sourcing, supplier onboarding, catalogue quality. Dhaka.', 'ক্যাটাগরি ম্যানেজার, ইলেকট্রনিক্স — সোর্সিং, সরবরাহকারী অনবোর্ডিং, ক্যাটালগ কোয়ালিটি। ঢাকা।'],
        ['Operations associate, logistics — courier relations and dispute resolution. Dhaka.', 'অপারেশনস অ্যাসোসিয়েট, লজিস্টিকস — কুরিয়ার সম্পর্ক ও ডিসপিউট নিষ্পত্তি। ঢাকা।'],
      ]),
      note(
        'We read every application ourselves and reply either way. If you do not hear from us inside two weeks, chase us — that is our failure, not a rejection.',
        'আমরা প্রতিটি আবেদন নিজেরা পড়ি এবং যেকোনও ক্ষেত্রেই উত্তর দিই। দুই সপ্তাহের মধ্যে উত্তর না পেলে তাগাদা দিন — সেটি আমাদের ব্যর্থতা, প্রত্যাখ্যান নয়।',
      ),
    ],
    related: ['/about'],
  },
  {
    path: '/install',
    title: { en: 'Install the ArcB2B app', bn: 'ArcB2B অ্যাপ ইনস্টল করুন' },
    intro: {
      en: 'ArcB2B installs from the browser. No store, no download, and it keeps your last twenty listings readable offline.',
      bn: 'ArcB2B ব্রাউজার থেকেই ইনস্টল হয়। কোনও স্টোর নেই, ডাউনলোড নেই, এবং শেষ কুড়িটি লিস্টিং অফলাইনেও পড়া যায়।',
    },
    blocks: [
      h('Android — Chrome', 'অ্যান্ড্রয়েড — ক্রোম'),
      steps([
        ['Open the menu (three dots) in the address bar.', 'অ্যাড্রেস বারের মেনু (তিনটি ডট) খুলুন।'],
        ['Tap "Add to Home screen", then "Install".', '"হোম স্ক্রিনে যোগ করুন" চাপুন, তারপর "ইনস্টল"।'],
      ]),
      h('iPhone — Safari', 'আইফোন — সাফারি'),
      steps([
        ['Tap the Share button at the bottom of the screen.', 'স্ক্রিনের নিচে শেয়ার বাটনে চাপুন।'],
        ['Scroll to "Add to Home Screen" and confirm.', '"অ্যাড টু হোম স্ক্রিন" খুঁজে নিশ্চিত করুন।'],
      ]),
      h('What works offline', 'অফলাইনে যা কাজ করে'),
      li([
        ['The last twenty product pages you opened, with a banner noting prices may have changed.', 'আপনি খোলা শেষ কুড়িটি পণ্যের পেজ, দাম বদলাতে পারে এমন নোটিশসহ।'],
        ['Your cart, so a mix you built on the road is still there.', 'আপনার কার্ট, তাই পথে তৈরি করা মিক্স থেকে যায়।'],
        ['The category tree, for browsing without a connection.', 'ক্যাটাগরি কাঠামো, সংযোগ ছাড়াই ব্রাউজ করার জন্য।'],
      ]),
      note(
        'Checkout, quotation submission and chat deliberately do not work offline. Queueing a payment and replaying it later against changed prices and stock is a failure mode, not a feature.',
        'চেকআউট, কোটেশন জমা ও চ্যাট ইচ্ছাকৃতভাবে অফলাইনে কাজ করে না। পেমেন্ট জমিয়ে রেখে পরে বদলে যাওয়া দাম ও স্টকের বিপরীতে চালানো একটি ত্রুটি, সুবিধা নয়।',
      ),
    ],
    related: ['/how-it-works'],
  },
];

export function findContentPage(path: string): ContentPage | null {
  return CONTENT_PAGES.find((page) => page.path === path) ?? null;
}

/** Every content path, for `generateStaticParams`. */
export function contentPageSegments(): string[][] {
  return CONTENT_PAGES.map((page) => page.path.replace(/^\//, '').split('/'));
}
