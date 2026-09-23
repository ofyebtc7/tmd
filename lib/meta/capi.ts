// Meta Conversions API (CAPI) — disparo server-side de eventos.
// Usado no webhook do PinPay para enviar Purchase SOMENTE quando o pagamento
// é confirmado como "pago". Nunca deve quebrar o fluxo principal (analytics).
//
// IMPORTANTE: o Meta descarta eventos sem user_data suficiente (erro 100/2804050).
// Por isso SEMPRE enviamos em/ph/fn/ct/st/zp/external_id hasheados quando disponíveis.

import { createHash } from 'crypto'
import { META_PIXEL_ID } from './config'
import { gerarEventId } from './pixel'

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN

interface EventoPurchase {
  pedidoId: string
  valor: number
  moeda?: string
  email?: string | null
  telefone?: string | null
  nome?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
}

export function hashSha256(valor: string): string | null {
  try {
    return createHash('sha256').update(valor).digest('hex')
  } catch {
    return null
  }
}

export function normalizarTelefone(tel: string): string {
  // Remove tudo que não é dígito e garante +55 (DDI Brasil) p/ usuário brasileiro
  const digitos = tel.replace(/\D/g, '')
  if (!digitos) return ''
  if (digitos.startsWith('55')) return digitos
  return `55${digitos}`
}

export async function enviarEventoPurchase(
  dados: EventoPurchase
): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    console.warn('meta_capi_sem_token', {
      pixel_id: META_PIXEL_ID ? 'configurado' : 'ausente',
      acao: 'ignore',
    })
    return false
  }

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

  if (dados.cidade) {
    const hashCt = hashSha256(dados.cidade.trim().toLowerCase())
    if (hashCt) userData.ct = hashCt
  }

  if (dados.estado) {
    const hashSt = hashSha256(dados.estado.trim().toLowerCase())
    if (hashSt) userData.st = hashSt
  }

  if (dados.cep) {
    const zip = dados.cep.replace(/\D/g, '').slice(0, 8)
    if (zip) {
      const hashZp = hashSha256(zip)
      if (hashZp) userData.zp = hashZp
    }
  }

  // external_id = hash do pedido — ajuda o Meta a amarrar CAPI + browser + pedido
  const externalId = hashSha256(dados.pedidoId)
  if (externalId) userData.external_id = externalId

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: gerarEventId(dados.pedidoId, 'Purchase'),
        custom_data: {
          value: Number(dados.valor),
          currency: dados.moeda || 'BRL',
          content_type: 'product',
        },
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
      console.error('meta_capi_falhou', {
        status: resposta.status,
        corpo,
        pedido_id: dados.pedidoId,
      })
      return false
    }

    console.log('meta_capi_purchase_enviado', {
      pedido_id: dados.pedidoId,
      valor: dados.valor,
      events_received: (corpo as { events_received?: number } | null)?.events_received,
    })
    return true
  } catch (erro) {
    console.error('meta_capi_erro', erro)
    return false
  }
}