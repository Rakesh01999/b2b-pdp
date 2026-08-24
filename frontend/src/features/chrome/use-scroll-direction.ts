'use client';

import { useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'up' | 'down';

/**
 * Scroll direction, debounced by distance rather than by time.
 *
 * The `threshold` is what makes this usable: without it, the sub-pixel jitter of
 * a trackpad or a rubber-band scroll flips the direction constantly and anything
 * driven by it strobes. Reading inside a single rAF also keeps this off the
 * scroll handler's critical path, so it cannot become the reason INP regresses.
 */
export function useScrollDirection({
  threshold = 12,
  topOffset = 120,
}: { threshold?: number; topOffset?: number } = {}): {
  direction: ScrollDirection;
  nearTop: boolean;
} {
  const [direction, setDirection] = useState<ScrollDirection>('up');
  const [nearTop, setNearTop] = useState(true);
  const lastY = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    // One synchronous read to seed from the live scroll position, then the
    // listener below takes over. Without the seed, a page restored mid-scroll
    // reports itself as being at the top until the reader happens to scroll.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setNearTop(window.scrollY < topOffset);

    const read = () => {
      frame.current = 0;
      const y = window.scrollY;
      setNearTop(y < topOffset);

      if (Math.abs(y - lastY.current) < threshold) return;
      setDirection(y > lastY.current ? 'down' : 'up');
      lastY.current = y;
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(read);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [threshold, topOffset]);

  return { direction, nearTop };
}
