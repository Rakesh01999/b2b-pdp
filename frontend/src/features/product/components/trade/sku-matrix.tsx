'use client';

import { useCallback, useRef, useState } from 'react';
import { ClipboardPaste, Eraser, Grid3x3, LayoutGrid } from 'lucide-react';
import { useTrade } from '@/features/product/trade-context';
import { capacityOf, cellState, colLabel, rowTotal, type Mix, type PasteResult } from '@/features/product/lib/mix';
import { parsePastedMix } from '@/features/product/lib/mix';
import { Overlay } from '@/components/ui/overlay';
import { Button } from '@/components/ui/primitives';
import { cx } from '@/components/ui/cx';
import { num, unitLabel } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The SKU mix grid — the signature wholesale ordering interaction.
 *
 * Four things separate this from the version that ships on most B2B sites:
 *
 *  - Text inputs with `inputMode="numeric"`, not `<input type="number">`.
 *    Spinners are unusable for entering 480, and a stray scroll wheel over a
 *    number input silently changes an order quantity.
 *  - Row totals, because a reseller allocating 500 units across six SKUs should
 *    not have to do the addition themselves.
 *  - Up/Down/Enter move between cells. Filling a grid is a columnar task and
 *    reaching for the mouse between every cell is the friction that makes
 *    buyers abandon the grid and message support instead.
 *  - Paste from a spreadsheet, shown as a diff before it is applied. Resellers
 *    keep their mix in Excel; silently overwriting a mix they spent minutes on
 *    would be unforgivable.
 */
export function SkuMatrix({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const { matrix, mix, qty, product, setQty, distribute, reset, applyMix } = useTrade();
  const [paste, setPaste] = useState<PasteResult | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const inputs = useRef(new Map<string, HTMLInputElement>());

  const single = matrix.colAxis === null;
  const unitPlural = unitLabel(product.pricing.unit, lang, true);

  const focusCell = useCallback((row: number, col: number) => {
    const el = inputs.current.get(`${row}-${col}`);
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
      focusCell(Math.min(row + 1, matrix.rows.length - 1), col);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusCell(Math.max(row - 1, 0), col);
    }
  };

  const openPaste = () => {
    setPasteText('');
    setPaste(null);
    setPasteOpen(true);
  };

  const previewPaste = (text: string) => {
    setPasteText(text);
    setPaste(text.trim() ? parsePastedMix(text, matrix, mix) : null);
  };

  const commitPaste = () => {
    if (paste) applyMix(paste.mix);
    setPasteOpen(false);
  };

  return (
    <section aria-labelledby="mix-heading">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="mix-heading" className="inline-flex items-center gap-2 text-[14px] font-bold tracking-[-0.01em]">
          <Grid3x3 size={16} className="text-accent-ink" aria-hidden />
          {t(lang, 'matrix.title')}
        </h3>
        <span className="tnum text-[12.5px] font-semibold text-ink">
          {num(qty)} {unitPlural}
        </span>
      </div>

      <div className="slim-scroll overflow-x-auto rounded-[10px] border border-line">
        <table className="zone-decision w-full border-collapse text-left">
          <caption className="sr-only">{t(lang, 'matrix.subtitle')}</caption>
          <thead>
            <tr className="bg-surface-2">
              {/* Sticky in both axes so a wide grid stays readable while the
                  buyer scrolls sideways through sizes. */}
              <th
                scope="col"
                className="sticky left-0 z-20 bg-surface-2 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-faint"
              >
                {single ? t(lang, 'matrix.variant') : `${matrix.rowAxis} / ${matrix.colAxis}`}
              </th>
              {matrix.cols.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="whitespace-nowrap px-2 py-2 text-center text-[11px] font-bold uppercase tracking-[0.05em] text-ink-faint"
                >
                  {single ? t(lang, 'matrix.qty') : colLabel(col)}
                </th>
              ))}
              {!single && (
                <th
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-ink-faint"
                >
                  {t(lang, 'matrix.rowTotal')}
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {matrix.rows.map((row, rowIndex) => (
              <tr key={row}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-surface px-3 py-2 text-left text-[12.5px] font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Swatch label={row} />
                    <span className="whitespace-nowrap">{row}</span>
                  </span>
                </th>

                {matrix.cells[rowIndex].map((cell, colIndex) => {
                  const variant = cell.variant;
                  const state = cellState(variant);
                  const capacity = capacityOf(variant);
                  const value = variant ? mix[variant.id] || 0 : 0;
                  const disabled = state === 'unavailable';

                  return (
                    <td
                      key={`${row}-${cell.col}`}
                      className={cx(
                        'relative border-l border-line p-0 transition-colors',
                        disabled
                          ? 'bg-surface-2'
                          : value > 0
                            ? 'bg-accent-soft'
                            : 'bg-surface focus-within:bg-accent-soft/60',
                      )}
                    >
                      <input
                        ref={(el) => {
                          if (el) inputs.current.set(`${rowIndex}-${colIndex}`, el);
                          else inputs.current.delete(`${rowIndex}-${colIndex}`);
                        }}
                        // Text, not number: `inputMode` already gets the numeric
                        // keypad on mobile, without the spinners or the
                        // scroll-wheel hazard of a number input.
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={value === 0 ? '' : String(value)}
                        placeholder={disabled ? '—' : '0'}
                        disabled={disabled}
                        aria-disabled={disabled}
                        onKeyDown={(event) => onKeyDown(event, rowIndex, colIndex)}
                        onChange={(event) => {
                          if (!variant) return;
                          const digits = event.target.value.replace(/[^\d]/g, '');
                          setQty(variant.id, digits === '' ? 0 : Number(digits));
                        }}
                        aria-label={[
                          row,
                          single ? '' : colLabel(cell.col),
                          t(lang, 'matrix.qty'),
                          `${capacity} ${t(lang, 'matrix.available')}`,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        className={cx(
                          'tnum w-full min-w-[68px] bg-transparent px-1 pb-4 pt-2.5 text-center text-[14px] font-semibold outline-none',
                          disabled ? 'cursor-not-allowed text-ink-faint' : 'text-ink',
                        )}
                      />
                      <span
                        aria-hidden
                        className={cx(
                          'tnum pointer-events-none absolute bottom-[3px] left-0 right-0 text-center text-[9.5px] font-semibold',
                          state === 'low' && 'text-warning',
                          state === 'sourced' && 'text-info',
                          state === 'available' && 'text-ink-faint',
                          state === 'unavailable' && 'text-ink-faint/60',
                        )}
                      >
                        {/* Dispatchable stock and inbound units are shown apart.
                            Printing the combined capacity made a cell holding 12
                            in Dhaka and 240 on the water read as "252 available",
                            which is true of the order and false of the warehouse
                            — and the buyer planning a delivery date needs the
                            distinction more than the total. */}
                        {state === 'unavailable'
                          ? t(lang, 'matrix.unavailable')
                          : state === 'sourced'
                            ? `${num(variant!.incoming?.qty ?? 0)} ${t(lang, 'matrix.sourced')}`
                            : variant!.incoming
                              ? `${num(variant!.stock)} +${num(variant!.incoming.qty)}`
                              : num(variant!.stock)}
                      </span>
                    </td>
                  );
                })}

                {!single && (
                  <td className="tnum border-l border-line px-3 py-2 text-right text-[13px] font-bold">
                    {rowTotal(mix, matrix, rowIndex) || <span className="text-ink-faint">0</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => distribute()}
          className="gap-1.5"
        >
          <LayoutGrid size={14} aria-hidden />
          {t(lang, 'matrix.distribute')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={openPaste} className="gap-1.5">
          <ClipboardPaste size={14} aria-hidden />
          {t(lang, 'matrix.paste')}
        </Button>
        {qty > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={reset} className="gap-1.5">
            <Eraser size={14} aria-hidden />
            {t(lang, 'matrix.clear')}
          </Button>
        )}
      </div>

      {!compact && (
        <p className="mt-2 text-[12px] leading-relaxed text-ink-dim">{t(lang, 'matrix.subtitle')}</p>
      )}

      <PasteDialog
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        lang={lang}
        text={pasteText}
        onText={previewPaste}
        result={paste}
        onApply={commitPaste}
      />
    </section>
  );
}

/**
 * Colour chip for the row label. Only drawn when the row name actually names a
 * colour — a "Model" or "Colour temperature" axis gets no swatch, because an
 * arbitrary square beside "Galaxy A15" is noise pretending to be information.
 */
const SWATCHES: Record<string, string> = {
  'midnight black': '#1b1f26',
  'cloud white': '#f1efeb',
  'sky blue': '#4b93e0',
  'deep teal': '#1d5c68',
  indigo: '#39408c',
  black: '#1b1f26',
  white: '#f1efeb',
  red: '#d9483c',
};

function Swatch({ label }: { label: string }) {
  const colour = SWATCHES[label.toLowerCase()];
  if (!colour) return null;
  return (
    <span
      aria-hidden
      className="h-[14px] w-[14px] shrink-0 rounded-[4px] border border-black/15"
      style={{ background: colour }}
    />
  );
}

function PasteDialog({
  open,
  onClose,
  lang,
  text,
  onText,
  result,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  text: string;
  onText: (value: string) => void;
  result: PasteResult | null;
  onApply: () => void;
}) {
  const changes = result?.changes ?? [];

  return (
    <Overlay
      open={open}
      onClose={onClose}
      title={t(lang, 'matrix.pasteTitle')}
      closeLabel={t(lang, 'misc.close')}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            {t(lang, 'matrix.pasteCancel')}
          </Button>
          <Button variant="primary" size="md" disabled={changes.length === 0} onClick={onApply}>
            {t(lang, 'matrix.pasteApply')}
            {changes.length > 0 && ` (${changes.length})`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-5">
        <p className="text-[13px] leading-relaxed text-ink-dim">{t(lang, 'matrix.pasteHint')}</p>

        <textarea
          value={text}
          onChange={(event) => onText(event.target.value)}
          rows={6}
          aria-label={t(lang, 'matrix.paste')}
          placeholder={'Black\t40\t32\t0\nWhite\t20\t20\t0'}
          className="tnum w-full rounded-[10px] border border-line-bright bg-surface-2 p-3 font-mono text-[12.5px] leading-relaxed outline-none focus-visible:border-accent"
        />

        {changes.length > 0 && (
          <div>
            <h3 className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-faint">
              {changes.length} {t(lang, 'matrix.willChange')}
            </h3>
            <ul className="divide-y divide-line rounded-[10px] border border-line">
              {changes.map((change) => (
                <li
                  key={change.label}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-[12.5px]"
                >
                  <span className="min-w-0 truncate font-medium">{change.label}</span>
                  <span className="tnum shrink-0 text-ink-dim">
                    {change.from} <span aria-hidden>→</span>{' '}
                    <b className="text-accent-ink">{change.to}</b>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result?.warnings.length ? (
          <ul className="space-y-1.5 rounded-[10px] border border-warning/30 bg-warning-soft p-3 text-[12px] leading-relaxed text-warning">
            {result.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </Overlay>
  );
}

export type { Mix };
