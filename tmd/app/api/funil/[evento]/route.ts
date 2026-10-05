import { NextRequest, NextResponse } from 'next/server'
import { enviarEventoFunil } from '@/lib/meta/capi-funil'

const EVENTOS = {
  'view-content': 'ViewContent',
  'initiate-checkout': 'InitiateCheckout',
  'add-to-cart': 'AddToCart',
} as const

type Slug = keyof typeof EVENTOS

export async function POST(request: NextRequest, { params }: { params: Promise<{ evento: string }> }) {
  const { evento: slugEvento } = await params
  const nomeEvento = EVENTOS[slugEvento as Slug]
  if (!nomeEvento) {
    return NextResponse.json({ erro: 'Evento inválido' }, { status: 404 })
  }

  try {
    const corpo = await request.json().catch(() => ({}))
    const ip = (request.headers.get('x-forwarded-for')?.split(',')[0] ?? request.headers.get('x-real-ip') ?? '').trim() || null
    const ua = request.headers.get('user-agent')

    await enviarEventoFunil({
      evento: nomeEvento,
      eventId: String(corpo.eventId ?? `${nomeEvento}_${Date.now()}`),
      valor: typeof corpo.valor === 'number' ? corpo.valor : undefined,
      moeda: typeof corpo.moeda === 'string' ? corpo.moeda : 'BRL',
      numItems: typeof corpo.numItems === 'number' ? corpo.numItems : undefined,
      contentIds: Array.isArray(corpo.contentIds) ? corpo.contentIds.map(String) : undefined,
      contentType: typeof corpo.contentType === 'string' ? corpo.contentType : 'product',
      contentName: typeof corpo.contentName === 'string' ? corpo.contentName : undefined,
      eventSourceUrl: typeof corpo.eventSourceUrl === 'string' ? corpo.eventSourceUrl : null,
      fbp: typeof corpo.fbp === 'string' ? corpo.fbp : null,
      fbc: typeof corpo.fbc === 'string' ? corpo.fbc : null,
      email: typeof corpo.email === 'string' ? corpo.email : null,
      telefone: typeof corpo.telefone === 'string' ? corpo.telefone : null,
      nome: typeof corpo.nome === 'string' ? corpo.nome : null,
      clientIp: ip,
      clientUserAgent: ua,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}