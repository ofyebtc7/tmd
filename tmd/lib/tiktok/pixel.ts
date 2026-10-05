/**
 * lib/tiktok/pixel.ts
 * Utilitários do TikTok Pixel (browser-side).
 *  – expõe/acessa o `ttq` com fila própria (o script é afterInteractive)
 *  – captura o `ttclid` da URL e preserva durante o fluxo
 *  – lê o cookie `_ttp` gravado pelo próprio pixel (ttq.enableCookie)
 *  – envia o mesmo `event_id` nos três canais: pixel + API interna (Events API)
 *
 * Nada aqui conhece credencial da Events API: o browser só fala com a API
 * interna (/api/tiktok/*) e com o TikTok via pixel.
 */

type TtqTrack = (
  evento: string,
  props?: Record<string, unknown>,
  opcoes?: Record<string, unknown>
) => void

interface Ttq {
  track: TtqTrack
  page?: () => void
  enableCookie?: () => void
}

export interface EventoTiktokBrowser {
  evento: string
  props?: Record<string, unknown>
  eventId?: string
}

const COOKIE_TTCLID = '_ttclid'
const COOKIE_TTP = '_ttp'
const DIAS_ATRIBUICAO = 90
const INTERVALO_DRENAGEM_MS = 200
const MAX_TENTATIVAS_DRENAGEM = 30

/** Fila compartilhada: eventos disparados antes do script carregar. */
const fila: EventoTiktokBrowser[] = []

function lerCookie(nome: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${nome}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function escreverCookie(nome: string, valor: string, diasExpiracao = DIAS_ATRIBUICAO) {
  if (typeof document === 'undefined') return
  const expira = new Date(Date.now() + diasExpiracao * 864e5).toUTCString()
  document.cookie = `${nome}=${encodeURIComponent(valor)}; expires=${expira}; path=/; SameSite=Lax`
}

/** Acesso seguro ao objeto global `ttq` criado pelo snippet do TikTok. */
export function getTtq(): Ttq | null {
  if (typeof window === 'undefined') return null
  const ttq = (window as unknown as { ttq?: Ttq }).ttq
  return ttq && typeof ttq.track === 'function' ? ttq : null
}

/**
 * Captura o ttclid da URL de entrada e preserva em cookie de 1ª parte para
 * sobreviver à navegação landing → checkout. O valor NÃO é alterado: o TikTok
 * valida o formato (E.C.P...) e qualquer modificação quebra a atribuição.
 */
export function capturarTtclid(): string | null {
  if (typeof window === 'undefined') return null

  const existente = lerCookie(COOKIE_TTCLID)
  if (existente) return existente

  const params = new URLSearchParams(window.location.search)
  const ttclid = params.get('ttclid')
  if (!ttclid) return null

  escreverCookie(COOKIE_TTCLID, ttclid)
  return ttclid
}

export function lerTtclid(): string | null {
  return lerCookie(COOKIE_TTCLID)
}

/** Cookie `_ttp` gravado pelo TikTok quando `ttq.enableCookie()` é chamado. */
export function lerTtp(): string | null {
  return lerCookie(COOKIE_TTP)
}

/**
 * Envia um evento ao TikTok Pixel. Se o `ttq` ainda não existir, o evento
 * fica na fila e é drenado assim que o script carregar — o tracking nunca
 * bloqueia nem quebra a página.
 */
export function rastrearEvento(
  evento: string,
  props?: Record<string, unknown>,
  eventId?: string
): void {
  if (typeof window === 'undefined') return

  if (!getTtq()) {
    fila.push({ evento, props, eventId })
    return
  }

  disparar({ evento, props, eventId })
}

function disparar(item: EventoTiktokBrowser): void {
  const ttq = getTtq()
  if (!ttq) return
  try {
    if (item.eventId) {
      // O TikTok usa `event_id` (o Meta usa `eventID`) para deduplicação.
      ttq.track(item.evento, item.props ?? {}, { event_id: item.eventId })
    } else {
      ttq.track(item.evento, item.props ?? {})
    }
  } catch {
    // silencia falha do pixel para não quebrar a navegação
  }
}

function drenarFila(): boolean {
  if (fila.length === 0) return true
  const ttq = getTtq()
  if (!ttq) return false
  while (fila.length > 0) {
    const item = fila.shift()
    if (item) disparar(item)
  }
  return true
}

/**
 * Inicia o polling que drena a fila assim que o snippet do TikTok estiver
 * disponível. Devolve a função de limpeza (usar no return do useEffect).
 */
export function iniciarDrenagemTikTok(): () => void {
  if (typeof window === 'undefined') return () => {}
  if (drenarFila()) return () => {}

  let tentativas = 0
  const timer = setInterval(() => {
    tentativas += 1
    if (drenarFila() || tentativas >= MAX_TENTATIVAS_DRENAGEM) clearInterval(timer)
  }, INTERVALO_DRENAGEM_MS)

  return () => clearInterval(timer)
}
