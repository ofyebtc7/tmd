import type { NextConfig } from 'next'

// Domínios do TikTok: o SDK do pixel vem de analytics.tiktok.com/libraries/
// e o beacon (fetch/beacon/img) vai para analytics.tiktok.com/api/v2/pixel.
// Sem estas diretivas o navegador bloqueia o pixel silenciosamente.
const TIKTOK = 'https://analytics.tiktok.com'

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://connect.facebook.net https://*.facebook.net https://cdn.utmify.com.br ${TIKTOK}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://assetsglobalbr.com https://*.facebook.com https://*.utmify.com.br https://i.postimg.cc https://i.imgur.com ${TIKTOK} https://*.tiktok.com`,
  `connect-src 'self' https://connect.facebook.net https://*.facebook.com https://*.facebook.net https://*.utmify.com.br https://viacep.com.br https://api.usepinpay.com https://*.supabase.co ${TIKTOK} https://*.tiktok.com`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async redirects() {
    return [{ source: '/index.html', destination: '/', permanent: true }]
  },
  async rewrites() {
    return [{ source: '/', destination: '/landing.html' }]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig