/**
 * lib/tiktok/contexto.ts
 * Contexto de requisição e normalização de dados do usuário para a Events API.
 * Server-side only (usa `node:crypto`).
 *
 * IP / User-Agent:
 * a captura depende da infraestrutura. Hoje a aplicação roda na Vercel
 * (ver vercel.json), que gerencia o cabeçalho `x-vercel-forwarded-for` e não
 * aceita valor enviado pelo cliente. Por isso ele tem prioridade; os demais
 * headers só são usados como fallback e sempre validados.
 * Se a infraestrutura mudar (Cloudflare/Nginx/CDN), ajustar `obterIpCliente`.
 */

import { createHash } from 'crypto'

const COOKIE_TTCLID = '_ttclid'
const COOKIE_TTP = '_ttp'

/** SHA-256 em hexadecimal — formato exigido pelo TikTok para e-mail/telefone. */
export function hashSha256(valor: string): string | null {
  try {
    return createHash('sha256').update(valor, 'utf-8').digest('hex')
  } catch {
    return null
  }
}

/** TikTok exige e-mail em minúsculas e sem espaços. */
export function hashEmail(email: string): string | null {
  const limpo = email.trim().toLowerCase()
  if (!limpo.includes('@')) return null
  return hashSha256(limpo)
}

/**
 * Telefone no formato E.164 SEM o "+" (ex.: 5511999999999), como o TikTok exige.
 * Números brasileiros ganham o DDI 55 quando ausente.
 */
export function hashTelefone(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, '')
  if (digitos.length < 10) return null
  const e164 = digitos.startsWith('55') ? digitos : `55${digitos}`
  return hashSha256(e164)
}

function ipValido(candidato: string): boolean {
  return /^[0-9a-fA-F:.]{3,45}$/.test(candidato) && /\d/.test(candidato)
}

/** Extrai o IP real do visitante conforme a infraestrutura (Vercel). */
export function obterIpCliente(headers: Headers): string | null {
  // 1) Vercel: gravado pela borda, não aceito do cliente (confiável).
  const vercel = headers.get('x-vercel-forwarded-for')
  if (vercel) {
    const primeiro = vercel.split(',')[0]?.trim()
    if (primeiro && ipValido(primeiro)) return primeiro
  }

  // 2) Cloudflare, caso seja usado antes da Vercel.
  const cloudflare = headers.get('cf-connecting-ip')?.trim()
  if (cloudflare && ipValido(cloudflare)) return cloudflare

  // 3) Nginx / Vercel: IP do cliente direto.
  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp && ipValido(realIp)) return realIp

  // 4) Último fallback: em cadeia de proxies o mais recente é o mais
  //    confiável, então pegamos o ÚLTIMO valor, não o primeiro.
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const candidatos = forwarded
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .reverse()
    for (const candidato of candidatos) {
      if (ipValido(candidato)) return candidato
    }
  }

  return null
}

export function obterUserAgent(headers: Headers): string | null {
  const ua = headers.get('user-agent')?.trim()
  if (!ua) return null
  return ua.slice(0, 512)
}

/** Lê um cookie do cabeçalho `cookie` sem depender de runtime-specific APIs. */
export function lerCookieRequest(request: Request, nome: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  const match = header.match(new RegExp(`(?:^|;\\s*)${nome}=([^;]*)`))
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

/**
 * ttclid disponível para o evento server-side: prioriza o query param da URL
 * de entrada e usa o cookie de 1ª parte (gravado pelo browser) como reserva.
 * O valor é repassado sem alteração.
 */
export function obterTtclid(request: Request): string | null {
  try {
    const daUrl = new URL(request.url).searchParams.get('ttclid')
    if (daUrl && daUrl.trim()) return daUrl.trim().slice(0, 200)
  } catch {
    // URL inválida: segue para o cookie
  }
  const doCookie = lerCookieRequest(request, COOKIE_TTCLID)
  return doCookie ? doCookie.slice(0, 200) : null
}

/** Cookie `_ttp` gravado pelo TikTok (ttq.enableCookie). */
export function obterTtp(request: Request): string | null {
  const ttp = lerCookieRequest(request, COOKIE_TTP)
  return ttp ? ttp.slice(0, 200) : null
}

/** Referrer da navegação, para a seção `page` do payload. */
export function obterReferer(request: Request): string | null {
  const referer = request.headers.get('referer')?.trim()
  if (!referer || !/^https?:\/\//i.test(referer)) return null
  return referer.slice(0, 256)
}
