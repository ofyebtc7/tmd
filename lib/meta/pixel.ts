/**
 * lib/meta/pixel.ts
 * Utilitários para o Meta Pixel (browser-side).
 * – Captura fbclid da URL e persiste como cookie _fbc (padrão Meta)
 * – Lê o cookie _fbp (gerado automaticamente pelo pixel)
 * – Gera event_id estável para deduplicação browser ↔ CAPI
 */

/** Lê um cookie pelo nome */
function lerCookie(nome: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${nome}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/** Escreve um cookie sem httpOnly (browser) */
function escreverCookie(nome: string, valor: string, diasExpiracao = 90) {
  if (typeof document === 'undefined') return
  const expira = new Date(Date.now() + diasExpiracao * 864e5).toUTCString()
  // SameSite=Lax é suficiente e compatível com mais navegadores
  document.cookie = `${nome}=${encodeURIComponent(valor)}; expires=${expira}; path=/; SameSite=Lax`
}

/**
 * Captura o fbclid da URL atual e salva como cookie _fbc.
 * Formato oficial do Meta: fb.{version}.{timestamp}.{fbclid}
 * Deve ser chamado uma vez na montagem do componente de checkout.
 */
export function capturarFbc(): string | null {
  if (typeof window === 'undefined') return null

  // Tenta ler um _fbc já existente primeiro
  const fbcExistente = lerCookie('_fbc')
  if (fbcExistente) return fbcExistente

  // Lê fbclid da URL
  const params = new URLSearchParams(window.location.search)
  const fbclid = params.get('fbclid')
  if (!fbclid) return null

  // Cria o _fbc seguindo o formato exato do Meta
  const ts = Math.floor(Date.now() / 1000)
  const fbc = `fb.1.${ts}.${fbclid}`
  escreverCookie('_fbc', fbc, 90)
  return fbc
}

/** Lê o cookie _fbp gerado automaticamente pelo pixel base */
export function lerFbp(): string | null {
  return lerCookie('_fbp')
}

/**
 * Gera um event_id estável e único para o pedido.
 * Usa o pedidoId + nome do evento para garantir que browser e CAPI
 * usem o mesmo ID → Meta deduplica automaticamente.
 */
export function gerarEventId(pedidoId: string, evento: string): string {
  return `${evento}_${pedidoId}`
}
