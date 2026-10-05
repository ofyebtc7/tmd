// lib/tiktok/client.ts
// Cliente server-side da TikTok Events API (endpoint /open_api/v1.3/event/track/).
//
// SEGURANÇA: o Access Token vive apenas em variável de ambiente server-side.
// Ele NÃO é enviado ao browser, não entra em nenhum payload de resposta e
// nunca aparece em log.
//
// RESILIÊNCIA: nenhuma função deste arquivo lança exceção. Timeout, erro
// HTTP, resposta inválida, indisponibilidade, rate limit e erro de
// autenticação são tratados e registrados sem dados sensíveis. O tracking
// nunca pode derrubar o checkout (resp.tiktok §20).

import {
  TIKTOK_ACCESS_TOKEN,
  TIKTOK_API_URL,
  TIKTOK_CURRENCY,
  TIKTOK_PIXEL_ID,
  TIKTOK_TEST_EVENT_CODE,
  TIKTOK_TIMEOUT_MS,
} from './config'
import { CONTENT_TYPE, type ConteudoTikTok, type EventoTikTok } from './eventos'
import { hashEmail, hashTelefone } from './contexto'

export interface UsuarioTiktok {
  email?: string | null
  telefone?: string | null
  externalId?: string | null
  ttclid?: string | null
  ttp?: string | null
  ip?: string | null
  userAgent?: string | null
}

export interface PaginaTiktok {
  url?: string | null
  referrer?: string | null
}

export interface PropriedadesTiktok {
  currency?: string | null
  value?: number | null
  contentType?: string | null
  contents?: ConteudoTikTok[]
  description?: string | null
}

export interface EventoTiktokServidor {
  eventId: string
  eventTime?: number
  user?: UsuarioTiktok
  page?: PaginaTiktok
  properties?: PropriedadesTiktok
}

/** Monta a seção `user` com os identificadores hasheados que existirem. */
export function montarUsuario(usuario: UsuarioTiktok | undefined): Record<string, unknown> | undefined {
  if (!usuario) return undefined

  const user: Record<string, unknown> = {}

  if (usuario.email) {
    const hash = hashEmail(usuario.email)
    if (hash) user.email = hash
  }

  if (usuario.telefone) {
    const hash = hashTelefone(usuario.telefone)
    if (hash) user.phone = hash
  }

  if (usuario.externalId) {
    // Já deve vir hasheado (hashEmail/hashTelefone/hashSha256 de lib/tiktok/
    // contexto.ts) e por isso é repassado sem reprocessar — hashear de novo
    // mudaria o external_id e quebraria o perfil da pessoa no TikTok.
    user.external_id = usuario.externalId.slice(0, 128)
  }

  if (usuario.ttp) {
    user.ttp = usuario.ttp
  }

  // ttclid é o TikTok Click ID. No Events API 2.0 (/event/track/, o endpoint
  // usado aqui) o campo é `user.ttclid`; `ad.callback` pertence ao schema 1.0
  // (/pixel/track/) e é ignorado por este endpoint.
  if (usuario.ttclid) {
    user.ttclid = usuario.ttclid
  }

  if (usuario.ip) {
    user.ip = usuario.ip
  }

  if (usuario.userAgent) {
    user.user_agent = usuario.userAgent
  }

  return Object.keys(user).length > 0 ? user : undefined
}

function montarPropriedades(props: PropriedadesTiktok | undefined): Record<string, unknown> {
  const propriedades: Record<string, unknown> = {
    currency: props?.currency || TIKTOK_CURRENCY,
    content_type: props?.contentType || CONTENT_TYPE,
  }

  if (typeof props?.value === 'number' && Number.isFinite(props.value)) {
    propriedades.value = Math.round(props.value * 100) / 100
  }

  if (props?.contents?.length) {
    propriedades.contents = props.contents.slice(0, 30)
  }

  if (props?.description) {
    propriedades.description = props.description.slice(0, 500)
  }

  return propriedades
}

function montarPagina(pagina: PaginaTiktok | undefined): Record<string, unknown> | undefined {
  if (!pagina) return undefined
  const page: Record<string, unknown> = {}
  if (pagina.url) page.url = pagina.url
  if (pagina.referrer) page.referrer = pagina.referrer
  return Object.keys(page).length > 0 ? page : undefined
}

/**
 * Envia UM evento à Events API. Retorna `true` apenas quando o TikTok aceita
 * o evento. Nunca lança exceção.
 */
export async function enviarEventoTiktok(
  evento: EventoTikTok,
  dados: EventoTiktokServidor
): Promise<boolean> {
  if (!TIKTOK_ACCESS_TOKEN) {
    console.warn('tiktok_evento_ignorado', {
      evento,
      event_id: dados.eventId,
      motivo: 'sem_access_token',
    })
    return false
  }

  if (!TIKTOK_PIXEL_ID) {
    console.warn('tiktok_evento_ignorado', {
      evento,
      event_id: dados.eventId,
      motivo: 'sem_pixel_id',
    })
    return false
  }

  const item: Record<string, unknown> = {
    event: evento,
    event_time: dados.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: dados.eventId,
  }

  if (TIKTOK_TEST_EVENT_CODE) {
    item.test_event_code = TIKTOK_TEST_EVENT_CODE
  }

  const user = montarUsuario(dados.user)
  if (user) item.user = user

  const page = montarPagina(dados.page)
  if (page) item.page = page

  item.properties = montarPropriedades(dados.properties)

  const payload = {
    event_source: 'web',
    event_source_id: TIKTOK_PIXEL_ID,
    data: [item],
  }

  let resposta: Response
  try {
    resposta = await fetch(TIKTOK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': TIKTOK_ACCESS_TOKEN,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIKTOK_TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch (erro) {
    // Timeout / DNS / indisponibilidade: registra e segue o fluxo do usuário.
    console.error('tiktok_evento_falhou', {
      evento,
      event_id: dados.eventId,
      erro: erro instanceof Error ? erro.name : 'desconhecido',
    })
    return false
  }

  const corpo = (await resposta.json().catch(() => null)) as
    | { code?: number; message?: string; request_id?: string; data?: unknown }
    | null

  if (!resposta.ok) {
    // 401/403 → token inválido ou sem permissão; 429 → rate limit.
    const categoria =
      resposta.status === 401 || resposta.status === 403
        ? 'autenticacao'
        : resposta.status === 429
          ? 'rate_limit'
          : 'http'
    console.error('tiktok_evento_falhou', {
      evento,
      event_id: dados.eventId,
      status: resposta.status,
      categoria,
      codigo: corpo?.code ?? null,
    })
    return false
  }

  if (!corpo || typeof corpo !== 'object' || corpo.code !== 0) {
    console.error('tiktok_evento_resposta_invalida', {
      evento,
      event_id: dados.eventId,
      codigo: corpo?.code ?? null,
    })
    return false
  }

  console.log('tiktok_evento_enviado', {
    evento,
    event_id: dados.eventId,
    status: 'success',
  })
  return true
}
