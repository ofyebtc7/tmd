import { NextRequest, NextResponse } from 'next/server'

const PINPAY_BASE_URL = 'https://api.usepinpay.com/functions/v1/api-v1'

export async function POST(request: NextRequest) {
  try {
    const { valor, descricao, pedidoId, cliente } = await request.json()

    if (!valor || !pedidoId) {
      return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 })
    }

    const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/${pedidoId}`

    const response = await fetch(`${PINPAY_BASE_URL}/pix`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PINPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(valor) * 100),
        description: descricao || `Pedido ${pedidoId}`,
        customer: cliente ? {
          name: cliente.nome,
          email: cliente.email,
          document: { number: cliente.cpf?.replace(/\D/g, '') || '' },
        } : undefined,
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
