/**
 * lib/tiktok/eventos.ts
 * Nomes de evento, geração de event_id e normalização de payload do TikTok.
 *
 * Módulo PURO (sem `process.env`, sem `crypto` do Node) para poder ser
 * importado tanto por client components quanto por rotas server-side.
 *
 * DEDUPLICAÇÃO (regra crítica do TikTok):
 * quando o mesmo evento é enviado pelo Browser Pixel e pela Events API, os
 * dois canais precisam usar o MESMO `event_id`. O TikTok deduplica por
 * (evento, event_id) — IDs diferentes viram duas conversões.
 *
 *   - Eventos disparados pelo usuário (ViewContent, AddToCart, InitiateCheckout,
 *     AddPaymentInfo): o ID nasce no browser e é repassado ao backend na
 *     mesma requisição, então ambos os canais usam o valor já criado.
 *   - Eventos derivados do pedido (PlaceAnOrder, CompletePayment): o ID é
 *     derivado de forma determinística do pedidoId, porque quem dispara no
 *     browser é a tela de checkout e quem dispara no servidor é o webhook do
 *     gateway — processos diferentes, mesmo resultado.
 */

/** Eventos standard do TikTok realmente usados neste projeto. */
export const EVENTOS_TIKTOK = {
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  AddPaymentInfo: 'AddPaymentInfo',
  PlaceAnOrder: 'PlaceAnOrder',
  /**
   * Evento standard do TikTok para pagamento concluído. No Ads Manager ele é
   * mapeado para o evento reservado "Purchase" (ver Reserved Events do TikTok).
   */
  CompletePayment: 'CompletePayment',
  PageView: 'PageView',
} as const

export type EventoTikTok = (typeof EVENTOS_TIKTOK)[keyof typeof EVENTOS_TIKTOK]

export const CONTENT_TYPE = 'product'
export const CONTENT_CATEGORY = 'Tomada inteligente'

/** TikTok aceita no máximo 40 caracteres em content_id. */
const MAX_CONTENT_ID = 40
const MAX_CONTENT_NAME = 100
const MAX_URL = 256
const MAX_EVENT_ID = 128

/** Remove caracteres de controle e limita o tamanho (higiene de payload). */
function limpar(valor: string, max: number): string {
  // eslint-disable-next-line no-control-regex
  return valor.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max)
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100
}

/** Gera bytes aleatórios em ambiente browser e Node (sem `node:crypto`). */
function bytesAleatorios(): Uint8Array {
  const buffer = new Uint8Array(8)
  const webCrypto = globalThis.crypto
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(buffer)
    return buffer
  }
  for (let i = 0; i < buffer.length; i++) buffer[i] = Math.floor(Math.random() * 256)
  return buffer
}

/**
 * event_id para eventos cuyo disparo começa no browser.
 *Único, aleatório e estável durante o processamento daquela ocorrência:
 * o valor é criado uma única vez e reaproveitado pelos dois canais.
 */
export function gerarEventIdAleatorio(evento: EventoTikTok | string): string {
  const ts = Date.now().toString(36)
  const rand = Array.from(bytesAleatorios())
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${evento}_${ts}_${rand}`.slice(0, MAX_EVENT_ID)
}

/**
 * event_id para eventos derivados do pedido (PlaceAnOrder / CompletePayment).
 * Determinístico: o checkout e o webhook do gateway calculam o mesmo valor
 * a partir do mesmo pedidoId, sem precisar trocar nada entre os processos.
 */
export function gerarEventIdDoPedido(pedidoId: string, evento: EventoTikTok | string): string {
  return `${evento}_${limpar(String(pedidoId), 96)}`.slice(0, MAX_EVENT_ID)
}

export interface ConteudoEntrada {
  contentId: string
  contentName?: string | null
  category?: string | null
  /** Preço unitário (o "value" do evento é sempre o total). */
  price?: number | null
  quantity?: number | null
}

/** Conteúdo no formato aceito pela Events API (`properties.contents[]`). */
export interface ConteudoTikTok {
  content_id: string
  content_type: typeof CONTENT_TYPE
  content_name?: string
  content_category?: string
  price?: number
  quantity?: number
}

export function montarConteudos(entradas: ConteudoEntrada[]): ConteudoTikTok[] {
  return entradas
    .filter((e) => typeof e.contentId === 'string' && e.contentId.trim().length > 0)
    .slice(0, 30)
    .map((e) => {
      const conteudo: ConteudoTikTok = {
        content_id: limpar(e.contentId, MAX_CONTENT_ID),
        content_type: CONTENT_TYPE,
      }
      if (e.contentName) conteudo.content_name = limpar(e.contentName, MAX_CONTENT_NAME)
      conteudo.content_category = CONTENT_CATEGORY
      if (typeof e.price === 'number' && Number.isFinite(e.price)) {
        conteudo.price = arredondar(e.price)
      }
      if (typeof e.quantity === 'number' && Number.isFinite(e.quantity)) {
        conteudo.quantity = Math.max(1, Math.round(e.quantity))
      }
      return conteudo
    })
}

/** Validação do event_id recebido na API interna (evita lixo/forja). */
export function eventIdValido(eventId: unknown): eventId is string {
  return typeof eventId === 'string' && /^[A-Za-z0-9_.:-]{8,128}$/.test(eventId)
}

/** Normaliza a URL da página do evento (o TikTok exige http/https). */
export function urlValida(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null
  const valor = url.trim()
  if (!/^https?:\/\//i.test(valor)) return null
  return valor.slice(0, MAX_URL)
}
