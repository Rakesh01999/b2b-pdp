import { Container, Skeleton } from '@/components/ui/primitives';

/**
 * Route-level loading UI.
 *
 * A skeleton that mirrors the real layout rather than a spinner. Two reasons: it
 * reserves the same boxes the content will occupy, so nothing shifts when the
 * page arrives, and it tells the reader what is coming — a spinner tells them
 * only that something is wrong with the wait.
 */
export default function ProductLoading() {
  return (
    <Container className="pb-4">
      <div className="flex gap-2 py-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <div className="md:col-start-1 md:row-start-1 lg:row-span-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px] w-[58px] rounded-lg sm:h-16 sm:w-16" />
            ))}
          </div>
        </div>

        <div className="space-y-3 md:col-start-2 md:row-start-1">
          <div className="flex gap-1.5">
            <Skeleton className="h-[22px] w-24 rounded-full" />
            <Skeleton className="h-[22px] w-20 rounded-full" />
          </div>
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="mt-4 h-[164px] w-full rounded-xl" />
        </div>

        <div className="md:col-span-2 md:row-start-2 lg:col-span-1 lg:col-start-2">
          <div className="rounded-xl border border-line bg-surface p-5">
            <Skeleton className="h-8 w-32" />
            <div className="mt-5 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[86px] flex-1 rounded-[10px]" />
              ))}
            </div>
            <Skeleton className="mt-5 h-[140px] w-full rounded-[10px]" />
            <Skeleton className="mt-5 h-[132px] w-full rounded-[10px]" />
            <Skeleton className="mt-5 h-12 w-full rounded-[10px]" />
          </div>
        </div>
      </div>

      <Skeleton className="mt-6 h-[184px] w-full rounded-xl" />
      <Skeleton className="mt-8 h-11 w-full rounded-lg" />
      <Skeleton className="mt-5 h-64 w-full rounded-xl" />
    </Container>
  );
}
