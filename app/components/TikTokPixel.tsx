'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { capturarTtclid, getTtq, iniciarDrenagemTikTok } from '@/lib/tiktok/pixel'

/**
 * Dispara o PageView do TikTok Pixel a cada navegação real (App Router),
 * preservando o ttclid da entrada. Mesma estratégia do FacebookPixel:
 * polling leve até o `ttq` existir, sem bloquear a renderização.
 */
export const TikTokPixel = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ultimaRotaRef = useRef('')

  useEffect(() => {
    capturarTtclid()
    const pararDrenagem = iniciarDrenagemTikTok()

    const rotaAtual = pathname + (searchParams ? `?${searchParams.toString()}` : '')
    if (ultimaRotaRef.current === rotaAtual) return pararDrenagem
    ultimaRotaRef.current = rotaAtual

    let cancelado = false
    let tentativas = 0

    const disparar = () => {
      if (cancelado) return
      const ttq = getTtq()
      if (ttq) {
        try {
          ttq.page?.()
        } catch {
          // silencia falha do pixel para não quebrar a navegação
        }
        return
      }
      tentativas += 1
      if (tentativas < 30) setTimeout(disparar, 200)
    }

    disparar()
    return () => {
      cancelado = true
      pararDrenagem()
    }
  }, [pathname, searchParams])

  return null
}
