'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_DISTRICT_ID, DEFAULT_PAYMENT_METHOD } from '@/lib/constants';
import type { MixLine } from '@/features/product/lib/mix';

/**
 * Client state the product page needs, split into two contexts on purpose.
 *
 * Preferences (delivery district, payment method) change while a buyer is
 * working the trade panel, and the header does not care. Keeping them apart
 * from cart state means adjusting the district to re-check landed cost does not
 * re-render the chrome.
 *
 * Both persist to `localStorage`, and both tolerate it being unavailable —
 * private windows and locked-down browsers throw on access, and a product page
 * that white-screens because storage is blocked is a worse bug than a forgotten
 * district.
 */

/* ------------------------------------------------------------- persistence */

const KEYS = {
  prefs: 'arcb2b.prefs.v1',
  cart: 'arcb2b.cart.v1',
  saved: 'arcb2b.saved.v1',
  recent: 'arcb2b.recent.v1',
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...(JSON.parse(raw) as object) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function readArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage disabled or full. The session still works; the preference just
    // will not survive a reload.
  }
}

/* ------------------------------------------------------------- preferences */

interface Prefs {
  districtId: string;
  paymentMethodId: string;
}

interface PrefsValue extends Prefs {
  setDistrict: (id: string) => void;
  setPaymentMethod: (id: string) => void;
  /** False until the stored values have been read, so SSR and first paint agree. */
  hydrated: boolean;
}

const DEFAULT_PREFS: Prefs = {
  districtId: DEFAULT_DISTRICT_ID,
  paymentMethodId: DEFAULT_PAYMENT_METHOD,
};

const PrefsContext = createContext<PrefsValue | null>(null);

/* -------------------------------------------------------------------- cart */

export interface CartEntry {
  productSlug: string;
  productTitle: string;
  lines: MixLine[];
  unitPrice: number;
  addedAt: number;
}

interface CartValue {
  entries: CartEntry[];
  /** Total units across every line — what the header badge shows. */
  unitCount: number;
  lineCount: number;
  addEntry: (entry: Omit<CartEntry, 'addedAt'>) => Promise<void>;
  /** Removes one cart line by position. */
  removeEntry: (index: number) => void;
  clearCart: () => void;
  savedSlugs: string[];
  toggleSaved: (slug: string) => void;
  isSaved: (slug: string) => boolean;
  recentSlugs: string[];
  noteVisit: (slug: string) => void;
  hydrated: boolean;
}

const CartContext = createContext<CartValue | null>(null);

/* ---------------------------------------------------------------- provider */

export function AppProviders({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read once, after mount. Reading during render would make the server and
  // client markup disagree and React would discard the server HTML.
  useEffect(() => {
    // Hydrating persisted preferences is the sanctioned use of an effect —
    // reading an external system (storage) once React is on the client. It
    // cannot be lazy initial state: the server has no storage, so seeding from
    // it during render would make the server and client markup disagree.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setPrefs(readJson<Prefs>(KEYS.prefs, DEFAULT_PREFS));
    setEntries(readArray<CartEntry>(KEYS.cart));
    setSavedSlugs(readArray<string>(KEYS.saved));
    setRecentSlugs(readArray<string>(KEYS.recent));
    setHydrated(true);
  }, []);

  const setDistrict = useCallback((districtId: string) => {
    setPrefs((prev) => {
      const next = { ...prev, districtId };
      writeJson(KEYS.prefs, next);
      return next;
    });
  }, []);

  const setPaymentMethod = useCallback((paymentMethodId: string) => {
    setPrefs((prev) => {
      const next = { ...prev, paymentMethodId };
      writeJson(KEYS.prefs, next);
      return next;
    });
  }, []);

  /**
   * Stands in for the `POST /v1/cart/lines` Server Action. The artificial delay
   * is not decoration: it is what makes the optimistic pending state on the CTA
   * observable, and a button that never shows its pending state is a button
   * that gets double-clicked in production.
   */
  const addEntry = useCallback(async (entry: Omit<CartEntry, 'addedAt'>) => {
    await new Promise((resolve) => setTimeout(resolve, 420));
    setEntries((prev) => {
      const next = [{ ...entry, addedAt: Date.now() }, ...prev].slice(0, 20);
      writeJson(KEYS.cart, next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => {
      const next = prev.filter((_, i) => i !== index);
      writeJson(KEYS.cart, next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setEntries([]);
    writeJson(KEYS.cart, []);
  }, []);

  // Saving works before sign-in and merges on sign-in. Baymard finds 89% of
  // sites force registration first, and 21% of users rely on saving to compare.
  const toggleSaved = useCallback((slug: string) => {
    setSavedSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev];
      writeJson(KEYS.saved, next);
      return next;
    });
  }, []);

  const noteVisit = useCallback((slug: string) => {
    setRecentSlugs((prev) => {
      if (prev[0] === slug) return prev;
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 12);
      writeJson(KEYS.recent, next);
      return next;
    });
  }, []);

  const prefsValue = useMemo<PrefsValue>(
    () => ({ ...prefs, setDistrict, setPaymentMethod, hydrated }),
    [prefs, setDistrict, setPaymentMethod, hydrated],
  );

  const cartValue = useMemo<CartValue>(() => {
    const unitCount = entries.reduce(
      (sum, entry) => sum + entry.lines.reduce((s, line) => s + line.qty, 0),
      0,
    );
    return {
      entries,
      unitCount,
      lineCount: entries.length,
      addEntry,
      removeEntry,
      clearCart,
      savedSlugs,
      toggleSaved,
      isSaved: (slug: string) => savedSlugs.includes(slug),
      recentSlugs,
      noteVisit,
      hydrated,
    };
  }, [entries, addEntry, removeEntry, clearCart, savedSlugs, toggleSaved, recentSlugs, noteVisit, hydrated]);

  return (
    <PrefsContext.Provider value={prefsValue}>
      <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>
    </PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside <AppProviders>');
  return ctx;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <AppProviders>');
  return ctx;
}
