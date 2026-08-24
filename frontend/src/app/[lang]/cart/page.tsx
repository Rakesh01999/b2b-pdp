import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { CartView, type CartProductMeta } from '@/features/cart/cart-view';
import { PRODUCTS } from '@/data/catalog';
import { isLocale, t } from '@/lib/i18n';

/**
 * The cart.
 *
 * The page shell is a Server Component and the interactive part is one island.
 * Product weight and carton quantity are resolved here and handed down, so the
 * client bundle carries a five-entry lookup rather than the catalogue — and so
 * the courier quote in the summary is computed from real shipping weight rather
 * than guessed at.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: t(lang, 'cart.title'),
    // A cart is per-buyer state. It has no business in an index.
    robots: { index: false, follow: false },
  };
}

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const meta: CartProductMeta[] = PRODUCTS.map((product) => ({
    slug: product.slug,
    title: product.title,
    image: product.media.find((media) => media.kind !== 'video')?.src ?? '/media/card-packaging.png',
    unit: product.pricing.unit,
    weightGrams: product.logistics.weightGrams,
    cartonQty: product.logistics.cartonQty,
  }));

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'cart.title') },
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />
      <PageHeader title={t(lang, 'cart.title')} />
      <CartView lang={lang} meta={meta} />
    </Container>
  );
}
