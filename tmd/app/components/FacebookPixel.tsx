'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

type Fbq = (...args: unknown[]) => void

function getFbq(): Fbq | null {
  if (typeof window === 'undefined') return null
  const fbq = (window as unknown as { fbq?: Fbq }).fbq
  return typeof fbq === 'function' ? fbq : null
}

export const FacebookPixel = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ultimaRotaRef = useRef('')
  const inicializadoRef = useRef(false)

  useEffect(() => {
    const rotaAtual = pathname + (searchParams ? `?${searchParams.toString()}` : '')

    // Só dispara de novo se a rota realmente mudou (evita duplicar no mesmo pathname)
    const jaDisparada = ultimaRotaRef.current === rotaAtual && inicializadoRef.current
    if (jaDisparada) return
    ultimaRotaRef.current = rotaAtual
    inicializadoRef.current = true

    // Poll até o fbq existir (script é afterInteractive), sem bloquear a página
    let tentativas = 0
    const disparar = () => {
      const fbq = getFbq()
      if (fbq) {
        try {
          fbq('track', 'PageView')
        } catch {
          // silencia falha do pixel para não quebrar a navegação
        }
        return
      }
      tentativas += 1
      if (tentativas < 30) setTimeout(disparar, 200)
    }

    disparar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  return null
}