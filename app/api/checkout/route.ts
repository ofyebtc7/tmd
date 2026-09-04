import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const PRECOS: Record<number, number> = { 1: 89.90, 2: 129.90, 3: 159.90 }

export async function POST(request: NextRequest) {
  try {
    const { cor, unidades } = await request.json()

    if (!cor || !unidades || !PRECOS[unidades]) {
      return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })
    }

    const token = randomBytes(16).toString('hex')
    const valor = PRECOS[unidades]

    const params = new URLSearchParams({
      cor,
      un: String(unidades),
      valor: String(valor),
    })

    return NextResponse.json({
      checkoutUrl: `/checkout/${token}?${params.toString()}`,
    })
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
