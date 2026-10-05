import { NextRequest, NextResponse } from 'next/server'
import { enviarEventoTiktok } from '@/lib/tiktok/client'
import {
  obterIpCliente,
  obterReferer,
  obterTtp,
  obterTtclid,
  obterUserAgent,
} from '@/lib/tiktok/contexto'
import {
  CONTENT_TYPE,
  EVENTOS_TIKTOK,
  eventIdValido,
  montarConteudos,
  urlValida,
  type EventoTikTok,
} from '@/lib/tiktok/eventos'

/**
 * API interna do TikTok.
 *
 * O browser NUNCA chama a Events API do TikTok diretamente: chamaria com a
 * credencial privada. O fluxo é sempre:
 *
 *   Browser → /api/tiktok/<evento>  →  TikTok Events API
 *              (Access Token no servidor)
 *
 * `CompletePayment` (Purchase) NÃO é aceito aqui: só o webhook do gateway,
 * após confirmação real do pagamento, pode dispará-lo.
 */

const EVENTOS_PERMITIDOS: Record<string, EventoTikTok> = {
  'view-content': EVENTOS_TIKTOK.ViewContent,
  'add-to-cart': EVENTOS_TIKTOK.AddToCart,
  'initiate-checkout': EVENTOS_TIKTOK.InitiateCheckout,
  'add-payment-info': EVENTOS_TIKTOK.AddPaymentInfo,
  'place-an-order': EVENTOS_TIKTOK.PlaceAnOrder,
}

const MAX_PEDIDOS_POR_MINUTO = 30
const janelaIp = new Map<string, { quantidade: number; expiraEm: number }>()

/** Rate limit best-effort por IP (o tracking nunca pode derrubar o checkout). */
function excedeuLimite(chave: string): boolean {
  const agora = Date.now()
  const atual = janelaIp.get(chave)

  if (!atual || atual.expiraEm <= agora) {
    janelaIp.set(chave, { quantidade: 1, expiraEm: agora + 60_000 })
    if (janelaIp.size > 5000) janelaIp.clear()
    return false
  }

  atual.quantidade += 1
  return atual.quantidade > MAX_PEDIDOS_POR_MINUTO
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evento: string }> }
) {
  const { evento: slug } = await params
  const evento = EVENTOS_PERMITIDOS[slug]

  if (!evento) {
    return NextResponse.json({ erro: 'Evento inválido' }, { status: 404 })
  }

  const ip = obterIpCliente(request.headers)
  if (excedeuLimite(ip ?? request.headers.get('x-real-ip') ?? 'desconhecido')) {
    // Não é erro para o usuário: apenas não rastrea.
    return NextResponse.json({ ok: false, motivo: 'rate_limit' })
  }

  try {
    const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null

    const eventIdBruto = corpo?.eventId
    // O event_id precisa ser no formato gerado pela camada de eventos e
    // prefixado com o nome do evento — garante que browser e servidor
    // estão falando da MESMA ocorrência (deduplicação).
    if (!eventIdValido(eventIdBruto) || !eventIdBruto.startsWith(`${evento}_`)) {
      return NextResponse.json({ ok: false, motivo: 'event_id_invalido' })
    }

    const contentIds = Array.isArray(corpo?.contentIds)
      ? (corpo.contentIds as unknown[]).slice(0, 20).map((v) => String(v))
      : []

    const valor = typeof corpo?.valor === 'number' && Number.isFinite(corpo.valor) ? corpo.valor : null
    const unitPrice =
      typeof corpo?.unitPrice === 'number' && Number.isFinite(corpo.unitPrice) ? corpo.unitPrice : null
    const quantidade =
      typeof corpo?.quantity === 'number' && Number.isFinite(corpo.quantity) ? corpo.quantity : null

    const conteudos = montarConteudos(
      contentIds.length > 0
        ? [
            {
              contentId: contentIds[0],
              contentName: typeof corpo?.contentName === 'string' ? corpo.contentName : null,
              price: unitPrice ?? valor,
              quantity: quantidade ?? 1,
            },
            ...contentIds.slice(1).map((contentId) => ({
              contentId,
              price: unitPrice,
              quantity: quantidade,
            })),
          ]
        : []
    )

    // ttclid/ttp são lidos do próprio request (cookie de 1ª parte) para evitar
    // que o cliente atribua a si um clique de outra pessoa. O body é só
    // fallback para navegações em que o cookie ainda não foi gravado.
    const ttclid = obterTtclid(request) ?? (typeof corpo?.ttclid === 'string' ? corpo.ttclid : null)
    const ttp = obterTtp(request) ?? (typeof corpo?.ttp === 'string' ? corpo.ttp : null)

    const enviado = await enviarEventoTiktok(evento, {
      eventId: eventIdBruto,
      eventTime:
        typeof corpo?.eventTime === 'number' && Number.isFinite(corpo.eventTime)
          ? Math.floor(corpo.eventTime)
          : undefined,
      user: {
        email: typeof corpo?.email === 'string' ? corpo.email : null,
        telefone: typeof corpo?.telefone === 'string' ? corpo.telefone : null,
        externalId: typeof corpo?.externalId === 'string' ? corpo.externalId : null,
        ttclid,
        ttp,
        ip,
        userAgent: obterUserAgent(request.headers),
      },
      page: {
        url: urlValida(corpo?.eventSourceUrl) ?? request.nextUrl.origin,
        referrer: obterReferer(request),
      },
      properties: {
        currency: typeof corpo?.moeda === 'string' ? corpo.moeda : 'BRL',
        value: valor,
        contentType: typeof corpo?.contentType === 'string' ? corpo.contentType : CONTENT_TYPE,
        contents: conteudos,
      },
    })

    return NextResponse.json({ ok: enviado })
  } catch {
    // Falha de tracking jamais pode virar erro para o usuário.
    return NextResponse.json({ ok: false })
  }
}
