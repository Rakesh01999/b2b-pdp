import type { MetadataRoute } from 'next';

/**
 * Installable PWA. `start_url` points at the default locale rather than `/` so
 * the installed app opens without a redirect hop on launch.
 *
 * Shortcuts cover the three things a returning buyer actually opens the app
 * for — browse, quote, orders — and deliberately not "home".
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ArcB2B — wholesale sourcing for Bangladesh',
    short_name: 'ArcB2B',
    description:
      "Bangladesh's wholesale sourcing marketplace: laddered wholesale pricing in Taka, escrow-protected payment, nationwide courier delivery.",
    start_url: '/en',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#eff4f4',
    theme_color: '#0f766e',
    lang: 'en-BD',
    dir: 'ltr',
    categories: ['business', 'shopping'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Browse categories', short_name: 'Browse', url: '/en/categories' },
      { name: 'Request a quote', short_name: 'Get a quote', url: '/en/rfq/new' },
      { name: 'My orders', short_name: 'Orders', url: '/en/account/orders' },
    ],
  };
}
