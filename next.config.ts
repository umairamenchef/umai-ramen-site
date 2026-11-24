import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Dev-only bundle inspection: `ANALYZE=true npm run build` opens the report.
// No effect on normal/production builds (enabled only when ANALYZE=true).
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
    qualities: [75, 85],
  },
  // Phase 15 (QR-04): the QR files are tools for the restaurant, not search results.
  async headers() {
    return [{ source: '/qr/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
