import { ImageResponse } from 'next/og';
import { getProduct } from '@/lib/catalog';
import { lowestUnitPrice } from '@/features/product/lib/pricing';
import { num } from '@/lib/format';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'ArcB2B product';

/**
 * Social card.
 *
 * It carries the three figures that decide whether a shared link is worth
 * opening — ladder floor price, MOQ, and dispatch — rather than just the title
 * again. A wholesale buyer forwarding a listing to a partner is forwarding a
 * price, and putting it in the card means the conversation starts from it.
 *
 * Deliberately English-only in both locales: rendering Bengali here needs a
 * Bengali font bundled into the image response, and drawing tofu boxes over a
 * shared card would be worse than drawing the Latin title. Wiring a subsetted
 * Bengali face into this route is a real follow-up, not an oversight.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProduct(slug);

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#eff4f4',
            fontSize: 56,
            fontWeight: 700,
            color: '#122127',
          }}
        >
          ArcB2B
        </div>
      ),
      size,
    );
  }

  const { product } = data;
  const quoteOnly = product.pricing.priceOnRequest || product.pricing.tiers.length === 0;
  const floor = quoteOnly ? null : lowestUnitPrice(product.pricing.tiers);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: 64,
          background: '#ffffff',
          // A hairline of the brand teal rather than a filled band: the card
          // has to stay readable as a 300px thumbnail in a chat thread.
          borderTop: '14px solid #0f766e',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#0f766e',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#122127', letterSpacing: -1 }}>
            ArcB2B
          </div>
          <div style={{ fontSize: 20, color: '#81939a', marginLeft: 6 }}>
            wholesale · Bangladesh
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 52,
            fontWeight: 700,
            color: '#122127',
            lineHeight: 1.15,
            letterSpacing: -1.6,
            marginTop: 40,
            maxWidth: 1000,
          }}
        >
          {product.title.en.length > 96 ? `${product.title.en.slice(0, 96)}…` : product.title.en}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 56, marginTop: 'auto' }}>
          <Figure
            label={quoteOnly ? 'PRICE' : 'FROM'}
            value={quoteOnly ? 'On request' : `৳${Math.round(floor! / 100).toLocaleString('en-US')}`}
            suffix={quoteOnly ? undefined : `/${product.pricing.unit}`}
            accent
          />
          <Figure label="MOQ" value={num(product.pricing.moq)} suffix={product.pricing.unit} />
          <Figure
            label="DISPATCH"
            value={
              product.logistics.leadTimeDays === 0
                ? 'In stock'
                : `${product.logistics.leadTimeDays}+ days`
            }
          />
          <Figure label="SKU" value={product.sku} />
        </div>
      </div>
    ),
    size,
  );
}

function Figure({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#81939a' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div
          style={{
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: -1,
            color: accent ? '#be123c' : '#122127',
          }}
        >
          {value}
        </div>
        {suffix && <div style={{ fontSize: 22, color: '#4e6068' }}>{suffix}</div>}
      </div>
    </div>
  );
}
