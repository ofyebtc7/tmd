import { META_PIXEL_ID } from './config'
import { hashSha256, normalizarTelefone } from './capi'

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN

export interface DadosEventoFunil {
  evento: 'ViewContent' | 'InitiateCheckout' | 'AddToCart'
  eventId: string
  valor?: number
  moeda?: string
  numItems?: number
  contentIds?: string[]
  contentType?: string
  contentName?: string
  eventSourceUrl?: string | null
  fbp?: string | null
  fbc?: string | null
  email?: string | null
  telefone?: string | null
  nome?: string | null
  clientIp?: string | null
  clientUserAgent?: string | null
}

export async function enviarEventoFunil(dados: DadosEventoFunil): Promise<boolean> {
  if (!ACCESS_TOKEN) return false

  const userData: Record<string, unknown> = {}

  if (dados.email) {
    const hashEmail = hashSha256(dados.email.trim().toLowerCase())
    if (hashEmail) userData.em = hashEmail
  }

  if (dados.telefone) {
    const tel = normalizarTelefone(dados.telefone)
    if (tel) {
      const hashTel = hashSha256(`+${tel}`)
      if (hashTel) userData.ph = hashTel
    }
  }

  if (dados.nome) {
    const partes = dados.nome.trim().split(/\s+/)
    const primeiro = partes[0]
    const sobrenome = partes.slice(1).join(' ')
    if (primeiro) {
      const hashFn = hashSha256(primeiro.toLowerCase())
      if (hashFn) userData.fn = hashFn
    }
    if (sobrenome) {
      const hashLn = hashSha256(sobrenome.toLowerCase())
      if (hashLn) userData.ln = hashLn
    }
  }

  if (dados.fbp) userData.fbp = dados.fbp
  if (dados.fbc) userData.fbc = dados.fbc
  if (dados.clientIp) userData.client_ip_address = dados.clientIp
  if (dados.clientUserAgent) userData.client_user_agent = dados.clientUserAgent

  const customData: Record<string, unknown> = {
    currency: dados.moeda || 'BRL',
    content_type: dados.contentType || 'product',
  }
  if (dados.valor != null) customData.value = Number(dados.valor)
  if (dados.numItems != null) customData.num_items = Number(dados.numItems)
  if (dados.contentIds?.length) customData.content_ids = dados.contentIds
  if (dados.contentName) customData.content_name = dados.contentName

  const payload = {
    data: [
      {
        event_name: dados.evento,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: dados.eventId,
        ...(dados.eventSourceUrl ? { event_source_url: dados.eventSourceUrl.slice(0, 1500) } : {}),
        custom_data: customData,
        user_data: userData,
      },
    ],
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events`
    const resposta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })

    const corpo = await resposta.json().catch(() => null)
    if (!resposta.ok) {
      console.error('meta_capi_funil_falhou', {
        status: resposta.status,
        corpo,
        evento: dados.evento,
      })
      return false
    }

    console.log('meta_capi_funil_enviado', {
      evento: dados.evento,
      event_id: dados.eventId,
      events_received: (corpo as { events_received?: number } | null)?.events_received,
    })
    return true
  } catch (erro) {
    console.error('meta_capi_funil_erro', erro)
    return false
  }
}