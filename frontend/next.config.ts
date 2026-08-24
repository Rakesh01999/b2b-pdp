import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Product imagery is served from the local `public/media` folder in this
   * standalone build, so no remote host is required. When the real catalogue
   * lands, add the CDN here — `images.domains` is removed in Next 16, so
   * `remotePatterns` is the only supported form.
   */
  images: {
    remotePatterns: [
      // { protocol: 'https', hostname: 'cdn.arcb2b.com' },
    ],
    // 400 / 800 / 1600 are the three derivatives the gallery relies on:
    // thumb, display, and the 2x source the zoom lens reads.
    imageSizes: [64, 96, 128, 256, 384],
    deviceSizes: [400, 640, 800, 1080, 1200, 1600, 1920],
    formats: ['image/avif', 'image/webp'],
  },

  // Server-rendered price and stock must never be served stale from a
  // shared cache without a revalidation window we control.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
