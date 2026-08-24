import type { CourierId, District, PaymentMethod, Paisa } from './types';

/**
 * Bangladesh delivery geography, the courier rate card, and payment fees.
 *
 * The rate card lives here as static data so landed cost is computable before
 * any courier API exists. Every consumer reads the same `ShippingQuote` shape,
 * so swapping in live Pathao / Steadfast / RedX / eCourier rates later is a
 * data change with no UI change.
 */

export const DISTRICTS: District[] = [
  { id: 'dhaka-metro', name: { en: 'Dhaka Metro', bn: 'ঢাকা মেট্রো' }, zone: 'dhaka_metro' },
  { id: 'gazipur', name: { en: 'Gazipur', bn: 'গাজীপুর' }, zone: 'dhaka_suburb' },
  { id: 'narayanganj', name: { en: 'Narayanganj', bn: 'নারায়ণগঞ্জ' }, zone: 'dhaka_suburb' },
  { id: 'savar', name: { en: 'Savar', bn: 'সাভার' }, zone: 'dhaka_suburb' },
  { id: 'chattogram', name: { en: 'Chattogram', bn: 'চট্টগ্রাম' }, zone: 'divisional' },
  { id: 'sylhet', name: { en: 'Sylhet', bn: 'সিলেট' }, zone: 'divisional' },
  { id: 'khulna', name: { en: 'Khulna', bn: 'খুলনা' }, zone: 'divisional' },
  { id: 'rajshahi', name: { en: 'Rajshahi', bn: 'রাজশাহী' }, zone: 'divisional' },
  { id: 'barishal', name: { en: 'Barishal', bn: 'বরিশাল' }, zone: 'divisional' },
  { id: 'rangpur', name: { en: 'Rangpur', bn: 'রংপুর' }, zone: 'divisional' },
  { id: 'mymensingh', name: { en: 'Mymensingh', bn: 'ময়মনসিংহ' }, zone: 'divisional' },
  { id: 'cumilla', name: { en: 'Cumilla', bn: 'কুমিল্লা' }, zone: 'district' },
  { id: 'bogura', name: { en: 'Bogura', bn: 'বগুড়া' }, zone: 'district' },
  { id: 'jashore', name: { en: 'Jashore', bn: 'যশোর' }, zone: 'district' },
  { id: 'coxs-bazar', name: { en: "Cox's Bazar", bn: 'কক্সবাজার' }, zone: 'district' },
];

export const DEFAULT_DISTRICT_ID = 'dhaka-metro';

export function districtById(id: string): District {
  return DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0];
}

/* ------------------------------------------------------------------ couriers */

interface CourierRate {
  id: CourierId;
  name: string;
  /** Cost of the first kilo, per zone, in paisa. */
  base: Record<District['zone'], Paisa>;
  /** Each additional kilo, per zone, in paisa. */
  perKg: Record<District['zone'], Paisa>;
  /** Delivery window in days, per zone. */
  days: Record<District['zone'], [number, number]>;
  cod: boolean;
  note?: { en: string; bn?: string };
}

export const COURIERS: CourierRate[] = [
  {
    id: 'pathao',
    name: 'Pathao',
    base: { dhaka_metro: 7000, dhaka_suburb: 9000, divisional: 12000, district: 14000 },
    perKg: { dhaka_metro: 3800, dhaka_suburb: 4200, divisional: 5200, district: 6000 },
    days: { dhaka_metro: [2, 3], dhaka_suburb: [2, 3], divisional: [3, 4], district: [3, 5] },
    cod: true,
    note: { en: 'COD available', bn: 'ক্যাশ অন ডেলিভারি' },
  },
  {
    id: 'steadfast',
    name: 'Steadfast',
    base: { dhaka_metro: 6000, dhaka_suburb: 7500, divisional: 10500, district: 12500 },
    perKg: { dhaka_metro: 3200, dhaka_suburb: 3600, divisional: 4600, district: 5400 },
    days: { dhaka_metro: [3, 4], dhaka_suburb: [3, 4], divisional: [4, 5], district: [4, 6] },
    cod: true,
  },
  {
    id: 'redx',
    name: 'RedX',
    base: { dhaka_metro: 6500, dhaka_suburb: 8000, divisional: 11000, district: 12800 },
    perKg: { dhaka_metro: 3500, dhaka_suburb: 3900, divisional: 4900, district: 5600 },
    days: { dhaka_metro: [2, 4], dhaka_suburb: [3, 4], divisional: [3, 5], district: [4, 6] },
    cod: true,
    note: { en: 'Nationwide coverage', bn: 'সারা দেশে' },
  },
  {
    id: 'ecourier',
    name: 'eCourier',
    base: { dhaka_metro: 8000, dhaka_suburb: 9500, divisional: 13000, district: 15500 },
    perKg: { dhaka_metro: 4200, dhaka_suburb: 4600, divisional: 5600, district: 6400 },
    days: { dhaka_metro: [1, 2], dhaka_suburb: [2, 3], divisional: [2, 4], district: [3, 5] },
    cod: false,
  },
];

/** Order value above which delivery is free, per zone. Null = never free. */
export const FREE_SHIPPING_THRESHOLD: Record<District['zone'], Paisa | null> = {
  dhaka_metro: 5_000_000, // ৳50,000
  dhaka_suburb: 6_500_000, // ৳65,000
  divisional: 9_000_000, // ৳90,000
  district: null,
};

/** Above this the shipment stops being a parcel and becomes truck freight. */
export const FREIGHT_THRESHOLD_GRAMS = 200_000; // 200 kg

/* ------------------------------------------------------------------ payments */

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'bkash', name: 'bKash', feeBps: 150 },
  { id: 'nagad', name: 'Nagad', feeBps: 140 },
  { id: 'rocket', name: 'Rocket', feeBps: 160 },
  { id: 'bank', name: 'Bank transfer', feeBps: 0 },
];

export const DEFAULT_PAYMENT_METHOD = 'bkash';

export function paymentMethodById(id: string): PaymentMethod {
  return PAYMENT_METHODS.find((m) => m.id === id) ?? PAYMENT_METHODS[0];
}

/* -------------------------------------------------------------- trust policy */

/**
 * Below these sample sizes a seller metric is not published. A percentage
 * computed from four orders is noise wearing the costume of evidence.
 */
export const METRIC_MIN_SAMPLE = { orders: 20, messages: 30 } as const;

/** Buyer-facing dispute window, in days. Surfaced in the trade assurance list. */
export const DISPUTE_WINDOW_DAYS = 7;
