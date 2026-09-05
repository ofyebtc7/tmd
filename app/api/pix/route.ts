import { NextRequest, NextResponse } from 'next/server'
import { verificarTokenPedido } from '@/lib/order-token'

const PINPAY_BASE_URL = 'https://api.usepinpay.com/functions/v1/api-v1'
const QTD_MAX = 12

const REQUISICOES: Map<string, number[]> = new Map()
const LIMITE_POR_MINUTO = 30

function ipDoRequest(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'desconhecido'
}

function permitidoPelaPolitica(ip: string): boolean {
  const agora = Date.now()
  const janela = (REQUISICOES.get(ip) || []).filter(t => agora - t < 60_000)
  if (janela.length >= LIMITE_POR_MINUTO) {
    REQUISICOES.set(ip, janela)
    return false
  }
  janela.push(agora)
  REQUISICOES.set(ip, janela)
  return true
}

export async function POST(request: NextRequest) {
  try {
    if (!permitidoPelaPolitica(ipDoRequest(request))) {
      return NextResponse.json({ erro: 'Muitas tentativas. Aguarde um instante e tente novamente.' }, { status: 429 })
    }

    const corpo = await request.json().catch(() => null)
    if (!corpo) {
      return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
    }

    const { valor, descricao, pedidoId, cliente, orderToken, qtd } = corpo

    if (typeof pedidoId !== 'string' || !pedidoId.trim()) {
      return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
    }

    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
      return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
    }

    const quantidade = Number(qtd)
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > QTD_MAX) {
      return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
    }

    const pedido = verificarTokenPedido(orderToken)
    if (!pedido) {
      return NextResponse.json(
        { erro: 'Sessão de compra inválida ou expirada. Volte ao produto e inicie o pedido novamente.' },
        { status: 400 }
      )
    }

    const precoUnitario = Math.round((pedido.valor / pedido.unidades) * 100) / 100
    const totalEsperado = Math.round(precoUnitario * quantidade * 100) / 100
    if (Math.abs(totalEsperado - valor) > 0.01) {
      return NextResponse.json(
        { erro: 'Valor do pedido inválido. Atualize a página e tente novamente.' },
        { status: 400 }
      )
    }

    const nome = typeof cliente?.nome === 'string' ? cliente.nome.trim() : ''
    const email = typeof cliente?.email === 'string' ? cliente.email.trim() : ''
    const cpfLimpo = typeof cliente?.cpf === 'string' ? cliente.cpf.replace(/\D/g, '').slice(0, 11) : ''

    if (nome.length < 3) {
      return NextResponse.json({ erro: 'Nome inválido.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ erro: 'E-mail inválido.' }, { status: 400 })
    }
    if (cpfLimpo.length !== 11) {
      return NextResponse.json({ erro: 'CPF inválido.' }, { status: 400 })
    }

    const siteUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
    const checkoutUrl = `${siteUrl}/checkout/${pedidoId}`

    const response = await fetch(`${PINPAY_BASE_URL}/pix`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PINPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(totalEsperado * 100),
        description: descricao ? String(descricao).slice(0, 120) : `Pedido ${pedidoId.slice(0, 24)}`,
        customer: cliente
          ? {
              name: nome,
              email,
              document: { number: cpfLimpo },
            }
          : undefined,
        metadata: {
          external_reference: pedidoId,
          checkout_url: checkoutUrl,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}))
      console.error('pinpay_falhou', { status: response.status, erro })
      return NextResponse.json(
        { erro: 'Não foi possível gerar a cobrança PIX.' },
        { status: 502 }
      )
    }

    const dados = await response.json()

    return NextResponse.json({
      sucesso: true,
      pixCode: dados.pix.qr_code,
      pixQrCodeUrl: dados.pix.qr_code_url,
      expiresAt: dados.pix.expires_at ?? null,
    })
  } catch (erro) {
    console.error('erro_gerar_pix', erro)
    return NextResponse.json(
      { erro: 'Erro ao gerar PIX' },
      { status: 500 }
    )
  }
}