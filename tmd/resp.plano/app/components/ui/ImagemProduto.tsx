'use client'

import Image from 'next/image'
import { useState } from 'react'
import { urlImagemValida } from '@/lib/imagem'

interface Props {
  src: string | null | undefined
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}

export default function ImagemProduto({
  src,
  alt,
  sizes,
  className = '',
  priority = false,
}: Props) {
  const [falhou, setFalhou] = useState(false)

  if (!src || !urlImagemValida(src) || falhou) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-copper/15">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E3A07E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <span className="text-[12px] text-text-muted/50">Sem imagem</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setFalhou(true)}
    />
  )
}
