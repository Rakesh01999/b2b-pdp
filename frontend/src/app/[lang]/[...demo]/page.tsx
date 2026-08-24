import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';
import { localeHref, type Locale } from '@/lib/i18n';

export default async function DemoPage({
  params,
}: {
  params: Promise<{ lang: Locale; demo: string[] }>;
}) {
  const { lang, demo } = await params;
  const path = '/' + demo.join('/');

  return (
    <div className="shell flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-surface-2 text-ink-faint">
        <Construction size={40} aria-hidden />
      </div>
      
      <h1 className="mb-3 text-[22px] font-bold tracking-tight text-ink">
        {lang === 'bn' ? 'ফিচারটি এই ডেমোতে নেই' : 'Feature not implemented'}
      </h1>
      
      <p className="measure mb-8 text-[15px] leading-relaxed text-ink-dim">
        {lang === 'bn'
          ? `আপনি ${path} পেজে যেতে চেয়েছিলেন। এটি একটি প্রোটোটাইপ, তাই এই ফিচারটি এখানে তৈরি করা হয়নি।`
          : `You attempted to navigate to ${path}. This is a standalone prototype, so this feature has not been built in this repository.`}
      </p>

      <Link
        href={localeHref(lang, '/')}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-[14.5px] font-bold text-on-fill transition-colors hover:bg-accent-hi"
      >
        <ArrowLeft size={16} aria-hidden />
        {lang === 'bn' ? 'হোমে ফিরে যান' : 'Back to Home'}
      </Link>
    </div>
  );
}
