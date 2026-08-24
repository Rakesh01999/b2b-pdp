import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Search results, the cart and account pages are per-buyer or infinite
        // permutations of the catalogue — indexing them competes with the
        // product and category pages that should rank.
        disallow: ['/*/search', '/*/cart', '/*/account', '/*/checkout', '/api/'],
      },
    ],
    sitemap: 'https://arcb2b.com/sitemap.xml',
  };
}
