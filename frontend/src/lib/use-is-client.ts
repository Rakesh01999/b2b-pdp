'use client';

import { useSyncExternalStore } from 'react';

/**
 * True once the component is running in the browser, false during SSR.
 *
 * The obvious version of this is `useState(false)` plus `useEffect(() => setMounted(true))`,
 * but that sets state synchronously inside an effect — an extra render pass on
 * every mount, and something React's own lint rules now flag. `useSyncExternalStore`
 * expresses the same thing declaratively: the server snapshot is `false`, the
 * client snapshot is `true`, and React reconciles the difference during hydration
 * without a mismatch warning and without a second render.
 *
 * Used by anything that needs `document` before it can render — portals, mainly.
 */
const noop = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useIsClient(): boolean {
  return useSyncExternalStore(noop, clientSnapshot, serverSnapshot);
}
