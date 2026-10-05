// Helper centralizado para disparar eventos do Meta Pixel (resp.md — PASSO 3)

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void
  }
}

// Não disparar eventos em ambiente de desenvolvimento
// (regra resp.md). Override para teste: NEXT_PUBLIC_ENABLE_PIXEL_DEV=true
function ambientePermitido(): boolean {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_PIXEL_DEV !== 'true') {
    return false
  }
  return true
}

// Verificar se o pixel está carregado
function pixelCarregado(): boolean {
  if (typeof window === 'undefined') return false
  if (!ambientePermitido()) return false
  return typeof window.fbq === 'function'
}

// ── EVENTOS PADRÃO META ──────────────────────────────────

// 1. Visualizou um produto
export function trackViewContent(produto: {
  id: string
  nome: string
  preco: number
  categoria?: string
}) {
  if (!pixelCarregado()) return
  window.fbq('track', 'ViewContent', {
    content_ids: [produto.id],
    content_name: produto.nome,
    content_type: 'product',
    content_category: produto.categoria || 'Peptídeos',
    value: produto.preco,
    currency: 'BRL',
  })
}

// 2. Iniciou o checkout (clicou em Comprar agora)
export function trackInitiateCheckout(produto: {
  id: string
  nome: string
  preco: number
  quantidade?: number
}) {
  if (!pixelCarregado()) return
  const quantidadeNumerica = Math.max(1, Math.floor(produto.quantidade ?? 1))
  window.fbq('track', 'InitiateCheckout', {
    content_ids: [produto.id],
    content_name: produto.nome,
    content_type: 'product',
    value: produto.preco,
    currency: 'BRL',
    num_items: quantidadeNumerica,
  })
}

// 3. Preencheu dados pessoais no checkout
export function trackAddPaymentInfo(produto: {
  id: string
  nome: string
  preco: number
}) {
  if (!pixelCarregado()) return
  window.fbq('track', 'AddPaymentInfo', {
    content_ids: [produto.id],
    content_name: produto.nome,
    content_type: 'product',
    value: produto.preco,
    currency: 'BRL',
  })
}

// 4. Purchase — REMOVIDO do frontend (resp.md): conversão confirmada é enviada
//    server-side via Meta Conversions API em lib/meta/capi.ts (webhook do PIX).

// 5. Clicou no WhatsApp (Lead/Contact)
export function trackContact(origem?: string) {
  if (!pixelCarregado()) return
  window.fbq('track', 'Contact', {
    content_name: origem || 'WhatsApp',
  })
}

// 6. Lead — preencheu formulário / cadastro
// O e-mail é hasheado em SHA-256 ANTES de chegar ao Meta (advanced matching
// exige hash — Termos das Ferramentas de Negócio). Normalização: trim + minúsculo.
export async function trackLead(dados?: { email?: string }) {
  if (!pixelCarregado()) return

  let em: string | null = null
  if (dados?.email) {
    em = await hashearEmailSha256(dados.email)
    if (!em) return
  }

  window.fbq('track', 'Lead', {
    content_name: 'Formulário de cadastro',
    ...(em && { em }),
  })
}

// Normaliza e hasheia um e-mail com SHA-256 (hex) usando crypto.subtle (browser).
// Sem dependência nova. Retorna null em ambientes sem Web Crypto (ex: HTTP).
async function hashearEmailSha256(email: string): Promise<string | null> {
  try {
    const normalizado = email.trim().toLowerCase()
    const dados = new TextEncoder().encode(normalizado)
    const digest = await crypto.subtle.digest('SHA-256', dados)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return null
  }
}

// 7. Pesquisou produto
export function trackSearch(termo: string) {
  if (!pixelCarregado()) return
  window.fbq('track', 'Search', {
    search_string: termo,
  })
}

// 8. Evento personalizado — PIX copiado
export function trackPixCopiado(produto: {
  id: string
  nome: string
  preco: number
}) {
  if (!pixelCarregado()) return
  window.fbq('trackCustom', 'PixCopiado', {
    content_ids: [produto.id],
    content_name: produto.nome,
    value: produto.preco,
    currency: 'BRL',
  })
}