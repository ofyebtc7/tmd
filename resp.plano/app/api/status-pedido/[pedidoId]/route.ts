import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pedidoId: string }> }
) {
  const { pedidoId } = await context.params

  if (!pedidoId) {
    return NextResponse.json({ erro: 'pedidoId é obrigatório' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin
    .from('pedidos')
    .select('status')
    .eq('id', pedidoId)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { erro: 'Pedido não encontrado' },
      { status: 404 }
    )
  }

  return NextResponse.json({ status: data.status })
}
