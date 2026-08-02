import type { NextConfig } from 'next';
import { env } from './src/check-env';

const allowedOrigins = [
  new URL(env.NEXT_PUBLIC_ORY_SDK_URL).origin,
  env.ORY_HYDRA_PUBLIC_URL ? new URL(env.ORY_HYDRA_PUBLIC_URL).origin : null,
].filter((value): value is string => Boolean(value));
const externalSources = [...new Set(allowedOrigins)].join(' ');
const developmentConnectSource = process.env.NODE_ENV === 'production' ? '' : ' ws:';
const developmentScriptSource = process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'";
const contentSecurityPolicy = [
  "default-src 'none'",
  "base-uri 'self'",
  `connect-src 'self' ${externalSources}${developmentConnectSource}`.trim(),
  "font-src 'self' data:",
  `form-action 'self' ${externalSources}`.trim(),
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${developmentScriptSource}`,
  "style-src 'self' 'unsafe-inline'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
        source: '/:path*',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate',
          },
        ],
        source: '/auth/:path*',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate',
          },
        ],
        source: '/api/consent/:path*',
      },
    ];
  },
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.svg': {
        as: '*.js',
        loaders: ['@svgr/webpack'],
      },
    },
  },
};

export default nextConfig;
