'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { BadgeCheck, ChevronLeft, ChevronRight, Repeat2, ThumbsUp, X } from 'lucide-react';
import { ProductSection } from './sections';
import { FullscreenPortal } from '@/components/ui/overlay';
import { Badge, Button, Stars } from '@/components/ui/primitives';
import { cx } from '@/components/ui/cx';
import { dateShort, num, unitLabel } from '@/lib/format';
import { pick, t } from '@/lib/i18n';
import type { Lang, Product, Review, SellUnit } from '@/lib/types';

/**
 * Reviews, read as one business assessing another.
 *
 * Three decisions make this different from a B2C review list. The reviewer is a
 * shop, not a person — that is what persuades another shop. The order quantity
 * is shown, because five stars on 500 pieces carries far more weight than five
 * stars on a sample and hiding it hides the signal. And the repeat-buyer share
 * is promoted into the summary, because in wholesale "they ordered again" is the
 * strongest quality signal there is, and no reference platform surfaces it well.
 *
 * Seller replies are given real prominence: Baymard finds 89% of sites never
 * respond to reviews, and users read a response as evidence of care. On a
 * platform where the alternative to a reply is a dispute, it matters more still.
 */

type Filter = 'all' | '5' | '4' | 'photos' | 'repeat';
type Sort = 'recent' | 'helpful' | 'largest';

export function ReviewsSection({
  product,
  lang,
}: {
  product: Product;
  lang: Lang;
}) {
  const { rating, reviews } = product;
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // One flat list of every review photo, so the overlay can browse across
  // reviews rather than trapping the reader inside one — a Baymard finding that
  // 63% of sites fail.
  const allPhotos = useMemo(
    () =>
      reviews.flatMap((review) =>
        review.photos.map((src) => ({ src, business: review.business, rating: review.rating })),
      ),
    [reviews],
  );

  const filtered = useMemo(() => {
    const matches = reviews.filter((review) => {
      switch (filter) {
        case '5':
          return review.rating === 5;
        case '4':
          return review.rating === 4;
        case 'photos':
          return review.photos.length > 0;
        case 'repeat':
          return review.repeatBuyer;
        default:
          return true;
      }
    });

    return [...matches].sort((a, b) => {
      if (sort === 'helpful') return b.helpfulVotes - a.helpfulVotes;
      if (sort === 'largest') return b.orderQty - a.orderQty;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviews, filter, sort]);

  const visible = expanded ? filtered : filtered.slice(0, 3);

  if (!rating || reviews.length === 0) {
    return (
      <ProductSection id="reviews" title={t(lang, 'section.reviews')}>
        {/* The honest empty state. A default rating here would put an invented
            number in front of the buyer and into structured data. */}
        <div className="rounded-xl border border-dashed border-line-bright bg-surface p-8 text-center">
          <p className="text-[14px] font-semibold">{t(lang, 'reviews.empty')}</p>
          <p className="mx-auto mt-1.5 max-w-[46ch] text-[12.5px] leading-relaxed text-ink-dim">
            {lang === 'bn'
              ? 'যাচাইকৃত ক্রয়ের পরেই রিভিউ দেওয়া যায়, তাই প্রতিটি রিভিউয়ের পেছনে একটি প্রকৃত অর্ডার থাকে।'
              : 'Reviews can only be left against a verified purchase, so every review here has a real order behind it.'}
          </p>
        </div>
      </ProductSection>
    );
  }

  return (
    <ProductSection id="reviews" title={`${t(lang, 'section.reviews')} (${num(rating.total)})`}>
      <div className="rounded-xl border border-line bg-surface">
        {/* Summary */}
        <div className="grid gap-6 border-b border-line p-5 md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="text-center md:text-left">
            <div className="price text-[38px] font-bold leading-none">{rating.average.toFixed(1)}</div>
            <Stars
              rating={rating.average}
              size={15}
              label={`${rating.average} ${t(lang, 'reviews.outOf5')}`}
            />
            <p className="tnum mt-1 text-[12px] text-ink-dim">
              {num(rating.total)} {t(lang, 'product.reviews')}
            </p>
          </div>

          <ul className="flex flex-col justify-center gap-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = rating.distribution[star - 1];
              const share = rating.total > 0 ? (count / rating.total) * 100 : 0;
              return (
                <li key={star} className="flex items-center gap-2.5">
                  <span className="tnum w-3 shrink-0 text-[11.5px] text-ink-dim">{star}</span>
                  <span
                    aria-hidden
                    className="h-[7px] min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3"
                  >
                    <span
                      className="block h-full rounded-full bg-rating"
                      style={{ width: `${share}%` }}
                    />
                  </span>
                  <span className="tnum w-7 shrink-0 text-right text-[11.5px] text-ink-faint">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="zone-reference grid content-center gap-1.5 text-ink-dim">
            <Stat label={t(lang, 'reviews.verifiedPurchase')}>
              {num(rating.verifiedCount)} {t(lang, 'misc.of')} {num(rating.total)}
            </Stat>
            <Stat label={t(lang, 'reviews.withPhotos')}>{num(rating.withPhotosCount)}</Stat>
            <Stat label={t(lang, 'reviews.repeatBuyers')} emphasis>
              {num(rating.repeatBuyerCount)}
            </Stat>
          </dl>
        </div>

        {/* Photo strip across every review */}
        {allPhotos.length > 0 && (
          <div className="slim-scroll flex gap-2 overflow-x-auto border-b border-line p-4">
            {allPhotos.map((photo, index) => (
              <button
                key={`${photo.src}-${index}`}
                type="button"
                onClick={() => setLightbox(index)}
                aria-label={`${photo.business} — ${t(lang, 'reviews.withPhotos')}`}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line transition hover:border-accent"
              >
                <Image src={photo.src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
          {(
            [
              ['all', t(lang, 'reviews.all')],
              ['5', '5★'],
              ['4', '4★'],
              ['photos', t(lang, 'reviews.withPhotos')],
              ['repeat', t(lang, 'reviews.repeatBuyers')],
            ] as Array<[Filter, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilter(key);
                setExpanded(false);
              }}
              aria-pressed={filter === key}
              className={cx(
                'rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                filter === key
                  ? 'border-accent bg-accent-soft text-accent-ink'
                  : 'border-line-bright text-ink-dim hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            aria-label={t(lang, 'reviews.newest')}
            className="ml-auto cursor-pointer rounded-full border border-line-bright bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-ink-dim outline-none"
          >
            <option value="recent">{t(lang, 'reviews.newest')}</option>
            <option value="helpful">{t(lang, 'reviews.helpful')}</option>
            <option value="largest">
              {lang === 'bn' ? 'বড় অর্ডার' : 'Largest order'}
            </option>
          </select>
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-ink-dim">{t(lang, 'reviews.noneMatch')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((review) => (
              <li key={review.id}>
                <ReviewItem
                  review={review}
                  lang={lang}
                  unit={product.pricing.unit}
                  onPhoto={(src) => setLightbox(allPhotos.findIndex((p) => p.src === src))}
                />
              </li>
            ))}
          </ul>
        )}

        {filtered.length > 3 && !expanded && (
          <div className="border-t border-line p-4 text-center">
            <Button variant="secondary" size="md" onClick={() => setExpanded(true)}>
              {t(lang, 'reviews.showMore')} ({filtered.length - 3})
            </Button>
          </div>
        )}
      </div>

      <PhotoOverlay
        photos={allPhotos}
        index={lightbox}
        onIndex={setLightbox}
        onClose={() => setLightbox(null)}
        lang={lang}
      />
    </ProductSection>
  );
}

function Stat({
  label,
  children,
  emphasis,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 md:min-w-[11rem]">
      <dt>{label}</dt>
      <dd className={cx('tnum font-bold', emphasis ? 'text-success' : 'text-ink')}>{children}</dd>
    </div>
  );
}

function ReviewItem({
  review,
  lang,
  unit,
  onPhoto,
}: {
  review: Review;
  lang: Lang;
  unit: SellUnit;
  onPhoto: (src: string) => void;
}) {
  return (
    <article className="p-5">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <Stars rating={review.rating} size={13} label={`${review.rating} ${t(lang, 'reviews.outOf5')}`} />
        <span className="text-[13.5px] font-bold">{review.business}</span>
        <span className="text-[12.5px] text-ink-dim">· {pick(review.district, lang)}</span>
        {review.verified && (
          <Badge tone="success" icon={<BadgeCheck size={11} aria-hidden />}>
            {t(lang, 'reviews.verifiedPurchase')}
          </Badge>
        )}
        {review.repeatBuyer && (
          <Badge tone="info" icon={<Repeat2 size={11} aria-hidden />}>
            {t(lang, 'reviews.repeatBuyers')}
          </Badge>
        )}
      </div>

      {/* Order size is part of the review, not metadata. It is what tells another
          buyer how much weight to give this opinion. */}
      <p className="zone-reference mt-1.5 text-ink-faint">
        <span className="tnum font-semibold text-ink-dim">
          {t(lang, 'reviews.ordered')} {num(review.orderQty)} {unitLabel(unit, lang, true)}
        </span>
        {review.variantLabel && ` · ${review.variantLabel}`}
        {` · ${dateShort(review.createdAt, lang)}`}
      </p>

      <p className="measure zone-evidence mt-2.5 text-ink">{pick(review.body, lang)}</p>

      {review.photos.length > 0 && (
        <div className="mt-3 flex gap-2">
          {review.photos.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => onPhoto(src)}
              className="relative h-[72px] w-[72px] overflow-hidden rounded-lg border border-line transition hover:border-accent"
            >
              <Image src={src} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line-bright px-2.5 py-1.5 text-[12px] font-semibold text-ink-dim transition-colors hover:text-ink"
      >
        <ThumbsUp size={13} aria-hidden />
        {t(lang, 'reviews.helpful')}
        <span className="tnum">{review.helpfulVotes}</span>
      </button>

      {review.sellerReply && (
        <div className="mt-3.5 rounded-[10px] border-l-2 border-accent bg-surface-2/70 p-3.5">
          <p className="text-[12px] font-bold text-accent-ink">
            {review.sellerReply.author} {t(lang, 'reviews.replied')}
          </p>
          <p className="measure zone-reference mt-1 text-ink-dim">
            {pick(review.sellerReply.body, lang)}
          </p>
        </div>
      )}
    </article>
  );
}

function PhotoOverlay({
  photos,
  index,
  onIndex,
  onClose,
  lang,
}: {
  photos: Array<{ src: string; business: string; rating: number }>;
  index: number | null;
  onIndex: (next: number) => void;
  onClose: () => void;
  lang: Lang;
}) {
  const open = index != null && index >= 0 && index < photos.length;
  const photo = open ? photos[index] : null;

  return (
    <FullscreenPortal open={open} onClose={onClose} label={t(lang, 'reviews.withPhotos')}>
      <div className="flex items-center justify-between px-4 py-3 text-white/90">
        <span className="tnum text-[12.5px] font-semibold">
          {(index ?? 0) + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t(lang, 'misc.close')}
          className="grid h-10 w-10 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X size={20} aria-hidden />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        {photo && (
          <div className="relative h-full w-full max-w-[min(80vh,900px)]">
            <Image src={photo.src} alt="" fill sizes="80vw" className="object-contain" />
          </div>
        )}
        {photos.length > 1 && index != null && (
          <>
            <button
              type="button"
              onClick={() => onIndex((index - 1 + photos.length) % photos.length)}
              aria-label={t(lang, 'gallery.previous')}
              className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % photos.length)}
              aria-label={t(lang, 'gallery.next')}
              className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight size={22} aria-hidden />
            </button>
          </>
        )}
      </div>

      {photo && (
        <p className="pb-6 text-center text-[12.5px] text-white/70">
          {photo.business} · {photo.rating}★
        </p>
      )}
    </FullscreenPortal>
  );
}
