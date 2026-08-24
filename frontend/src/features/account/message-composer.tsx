'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/primitives';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The message box.
 *
 * Keyed by thread, and the draft is stored per thread — switching conversation
 * and coming back must not lose what was half-typed. The send path is a stub and
 * says so *after* the attempt rather than disabling the control: a buyer needs to
 * see that the composer works and that the draft is safe, which a greyed-out
 * button communicates to nobody.
 */
export function MessageComposer({ lang, threadId }: { lang: Lang; threadId: string }) {
  const key = `arcb2b.msg-draft.${threadId}`;
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'queued'>('idle');

  useEffect(() => {
    let stored = '';
    try {
      stored = window.localStorage.getItem(key) ?? '';
    } catch {
      // Storage blocked — the composer still works for this session.
    }
    // Reading the persisted draft is the sanctioned effect: the server has no
    // storage, so seeding during render would desynchronise the two renders.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setBody(stored);
    setStatus('idle');
  }, [key]);

  function update(value: string) {
    setBody(value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* draft not persisted */
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setStatus('sending');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setStatus('queued');
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 border-t border-line pt-4">
      <label htmlFor={`composer-${threadId}`} className="mb-1.5 block text-[12.5px] font-semibold">
        {t(lang, 'messages.write')}
      </label>
      <textarea
        id={`composer-${threadId}`}
        rows={3}
        value={body}
        onChange={(event) => update(event.target.value)}
        placeholder={t(lang, 'messages.placeholder')}
        className="w-full resize-y rounded-lg border border-line-bright bg-surface px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-accent"
      />

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="gap-1.5"
          disabled={status === 'sending' || body.trim() === ''}
        >
          {status === 'sending' ? (
            <Loader2 size={15} aria-hidden className="animate-spin" />
          ) : (
            <Send size={15} aria-hidden />
          )}
          {t(lang, 'messages.send')}
        </Button>

        {status === 'queued' && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-success">
            <Check size={14} aria-hidden />
            {t(lang, 'messages.sent')}
          </span>
        )}
      </div>

      {status === 'queued' && (
        <p className="mt-2.5 flex gap-2 text-[11.5px] leading-relaxed text-ink-faint">
          <AlertTriangle size={13} aria-hidden className="mt-0.5 shrink-0 text-warning" />
          {t(lang, 'messages.sendNote')}
        </p>
      )}
    </form>
  );
}
