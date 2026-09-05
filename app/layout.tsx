import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Plugmax',
  description:
    'Tomada Inteligente Plugmax — tomada, USB, USB-C e 2 cabos retráteis. Frete grátis para todo o Brasil.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}