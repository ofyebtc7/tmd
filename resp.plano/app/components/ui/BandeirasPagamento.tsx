import Image from 'next/image'
import type { StaticImageData } from 'next/image'

import visaImg from '@/app/vendas/[produtoId]/simbolospagamentos/visa.webp'
import eloImg from '@/app/vendas/[produtoId]/simbolospagamentos/elo.webp'
import hipercardImg from '@/app/vendas/[produtoId]/simbolospagamentos/hipercard.webp'
import amexImg from '@/app/vendas/[produtoId]/simbolospagamentos/imgi_43_default.webp'
import dinersImg from '@/app/vendas/[produtoId]/simbolospagamentos/imgi_44_default.webp'
import masterImg from '@/app/vendas/[produtoId]/simbolospagamentos/master.webp'

export type Bandeira =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'elo'
  | 'hipercard'
  | 'diners'
  | 'discover'
  | 'pix'
  | 'desconhecida'

export const bandeirasAceitas: Bandeira[] = [
  'visa',
  'mastercard',
  'diners',
  'hipercard',
  'amex',
  'elo',
  'pix',
]

const imagens: Partial<Record<Bandeira, StaticImageData>> = {
  visa: visaImg,
  elo: eloImg,
  hipercard: hipercardImg,
  amex: amexImg,
  diners: dinersImg,
  mastercard: masterImg,
}

export function IconeBandeira({
  bandeira,
  className,
}: {
  bandeira: Bandeira
  className?: string
}) {
  const imagem = imagens[bandeira]

  if (bandeira === 'pix') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1080 1080"
        role="img"
        aria-label="PIX"
        preserveAspectRatio="xMidYMid meet"
        className={className}
      >
        <path
          className="[fill:#32BCAD]"
          d="M814.56,800.22a143.36,143.36,0,0,1-102-42.23L565.26,610.7c-10.34-10.37-28.36-10.33-38.7,0L378.73,758.53a143.36,143.36,0,0,1-102,42.23h-29L434.24,987.31a149.2,149.2,0,0,0,211,0L832.3,800.22Z"
        />
        <path
          className="[fill:#32BCAD]"
          d="M276.72,279.23a143.37,143.37,0,0,1,102,42.24L526.55,469.32a27.39,27.39,0,0,0,38.71,0L712.55,322a143.37,143.37,0,0,1,102-42.24H832.3L645.22,92.7a149.17,149.17,0,0,0-211.44,0L247.7,279.23Z"
        />
        <path
          className="[fill:#32BCAD]"
          d="M987.31,434.51l-113.06-113a21.46,21.46,0,0,1-8,1.62h-51.4a101.6,101.6,0,0,0-71.37,29.57L596.17,499.94a70.76,70.76,0,0,1-100,0L348.36,352.11A101.6,101.6,0,0,0,277,322.54h-63.2A21.35,21.35,0,0,1,206.2,321L92.7,434.51a149.17,149.17,0,0,0,0,211L206.19,759a21.41,21.41,0,0,1,7.6-1.54H277a101.59,101.59,0,0,0,71.37-29.56L496.19,580.06c26.72-26.7,73.29-26.71,100,0l147.3,147.28a101.56,101.56,0,0,0,71.36,29.57h51.39a21.56,21.56,0,0,1,8,1.62l113-113a149.19,149.19,0,0,0,0-211Z"
        />
      </svg>
    )
  }

  if (imagem) {
    return (
      <Image
        src={imagem}
        alt={`Cartão ${bandeira}`}
        className={className}
        style={{ objectFit: 'contain' }}
        width={48}
        height={30}
        unoptimized
      />
    )
  }

  return (
    <svg viewBox="0 0 48 30" className={className} aria-hidden="true">
      <rect width="48" height="30" rx="4" fill="#E5E7EB" />
    </svg>
  )
}