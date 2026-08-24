import { highestUnitPrice, lowestUnitPrice } from '@/features/product/lib/pricing';
import { totalStock } from '@/features/product/lib/mix';
import { HREFLANG, pick } from '@/lib/i18n';
import type { Lang, Product } from '@/lib/types';

/**
 * Structured data, server-rendered and shipping no client JavaScript.
 *
 * Two rules are load-bearing here.
 *
 * `aggregateRating` is emitted only when real reviews exist. Populating it with
 * a placeholder — or worse, using the order count as the review count — puts a
 * fabricated figure into Google's index and is a rich-results policy violation,
 * not merely a modelling slip.
 *
 * `BreadcrumbList` is emitted at all. The visible breadcrumb is invisible to a
 * crawler without it, and breadcrumbs render directly in search results, so
 * omitting it forfeits free SERP real estate.
 */

const BASE = 'https://arcb2b.com';

function jsonLd(data: object) {
  // Only forward slashes are escaped; the JSON itself cannot break out of the
  // script element because `</` cannot appear in a JSON string unescaped.
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}

export function ProductJsonLd({ product, lang }: { product: Product; lang: Lang }) {
  const url = `${BASE}/${lang}/product/${product.slug}`;
  const stock = totalStock(product.variants);
  const quoteOnly = product.pricing.priceOnRequest || product.pricing.tiers.length === 0;

  const availability =
    product.status !== 'active' || (stock === 0 && product.logistics.leadTimeDays === 0)
      ? 'https://schema.org/OutOfStock'
      : stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder';

  const brand = product.specifications.find((spec) => spec.label.en === 'Brand');

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    url,
    name: pick(product.title, lang),
    description: pick(product.shortDescription, lang),
    sku: product.sku,
    image: product.media
      .filter((media) => media.kind !== 'video')
      .slice(0, 6)
      .map((media) => `${BASE}${media.src}`),
    category: pick(product.category.name, lang),
    inLanguage: HREFLANG[lang],
  };

  if (brand) {
    data.brand = { '@type': 'Brand', name: pick(brand.value, lang) };
  }

  if (quoteOnly) {
    // A demand for a quote, not an offer. Publishing a zero price here would be
    // worse than publishing nothing.
    data.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: 'BDT',
      availability,
      seller: { '@type': 'Organization', name: product.seller.name },
    };
  } else {
    data.offers = {
      '@type': 'AggregateOffer',
      url,
      priceCurrency: 'BDT',
      // Paisa back to Taka: schema.org expects the major unit.
      lowPrice: (lowestUnitPrice(product.pricing.tiers) / 100).toFixed(2),
      highPrice: (highestUnitPrice(product.pricing.tiers) / 100).toFixed(2),
      offerCount: product.pricing.tiers.length,
      availability,
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: product.pricing.moq,
        unitText: product.pricing.unit,
      },
      seller: { '@type': 'Organization', name: product.seller.name },
    };
  }

  if (product.rating && product.rating.total > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.total,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (product.reviews.length > 0) {
    data.review = product.reviews.slice(0, 5).map((review) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5 },
      author: { '@type': 'Organization', name: review.business },
      datePublished: review.createdAt,
      reviewBody: pick(review.body, lang),
    }));
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />;
}

export function BreadcrumbJsonLd({
  items,
  lang,
}: {
  items: Array<{ name: string; href?: string }>;
  lang: Lang;
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      // The final crumb is the current page and carries no `item`, per the
      // BreadcrumbList spec.
      ...(item.href ? { item: `${BASE}/${lang}${item.href}` } : {}),
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />;
}
