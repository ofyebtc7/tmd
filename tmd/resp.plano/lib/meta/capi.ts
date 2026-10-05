// Meta Conversions API (CAPI) — disparo server-side de eventos (resp.md — Passo 1)
// Usado no webhook do PinPay para enviar Purchase SOMENTE quando o pagamento
// é confirmado como "pago". Não deve nunca quebrar o fluxo principal (analytics).

import { createHash } from 'crypto'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '2040541236568936'
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN

interface EventoPurchase {
  pedidoId: string
  valor: number
  moeda?: string
  email?: string | null
}

function hashSha256(valor: string): string | null {
  try {
    return createHash('sha256').update(valor).digest('hex')
  } catch {
    return null
  }
}

export async function enviarEventoPurchase(
  dados: EventoPurchase
): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    console.warn('meta_capi_sem_token', {
      pixel_id: PIXEL_ID ? 'configurado' : 'ausente',
      acao: 'ignore',
    })
    return false
  }

  const userData: Record<string, unknown> = {}
  if (dados.email) {
    const hashEmail = hashSha256(dados.email.trim().toLowerCase())
    if (hashEmail) userData.em = hashEmail
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: dados.pedidoId,
        custom_data: {
          value: Number(dados.valor),
          currency: dados.moeda || 'BRL',
        },
        ...(Object.keys(userData).length > 0 && { user_data: userData }),
      },
    ],
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`
    const resposta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })

    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => null)
      console.error('meta_capi_falhou', {
        status: resposta.status,
        corpo,
        pedido_id: dados.pedidoId,
      })
      return false
    }

    const respostaJson = (await resposta.json()) as { events_received?: number }
    console.log('meta_capi_purchase_enviado', {
      pedido_id: dados.pedidoId,
      valor: dados.valor,
      events_received: respostaJson.events_received,
    })
    return true
  } catch (erro) {
    console.error('meta_capi_erro', erro)
    return false
  }
}