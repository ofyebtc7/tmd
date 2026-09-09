import { NextRequest, NextResponse } from 'next/server'
import { criarTokenPedido } from '@/lib/order-token'

const PRECOS: Record<number, number> = { 1: 89.9, 2: 129.9, 3: 159.9 }
const CORES = ['Preto', 'Branco']

export async function POST(request: NextRequest) {
  try {
    const { cor, unidades } = await request.json()

    if (typeof cor !== 'string' || !CORES.includes(cor) || !PRECOS[unidades]) {
      return NextResponse.json({ erro: 'Dados inválidos' }, { status: 400 })
    }

    const valor = PRECOS[unidades]
    const token = criarTokenPedido({ cor, unidades, valor })

    return NextResponse.json({
      checkoutUrl: `/checkout/${token}`,
    })
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}