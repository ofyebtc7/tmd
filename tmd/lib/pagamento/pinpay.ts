import type { CriarPixInput, CriarPixResultado } from './tipos'

const PINPAY_BASE_URL = 'https://api.usepinpay.com/functions/v1/api-v1'

export async function criarCobrancaPix(
  input: CriarPixInput
): Promise<CriarPixResultado> {
  const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/${input.tokenCheckout}`

  const response = await fetch(`${PINPAY_BASE_URL}/pix`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PINPAY_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(input.valorEmReais * 100),
      description: input.descricao,
      customer: {
        name: input.cliente.nome,
        email: input.cliente.email,
        document: { number: input.cliente.cpf.replace(/\D/g, '') },
      },
      metadata: {
        external_reference: input.pedidoId,
        checkout_url: checkoutUrl,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    const erro = await response.json().catch(() => ({}))
    console.error('pinpay_criar_pix_falhou', {
      status: response.status,
      erro,
    })
    throw new Error('Não foi possível gerar a cobrança PIX.')
  }

  const dados = await response.json()

  return {
    idExterno: dados.id,
    qrCode: dados.pix.qr_code,
    qrCodeUrl: dados.pix.qr_code_url,
    expiraEm: dados.pix.expires_at ?? null,
  }
}

export async function consultarStatusPix(idExterno: string) {
  const response = await fetch(`${PINPAY_BASE_URL}/pix/${idExterno}`, {
    headers: {
      Authorization: `Bearer ${process.env.PINPAY_SECRET_KEY}`,
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error('Não foi possível consultar o status do PIX.')
  }

  return response.json()
}