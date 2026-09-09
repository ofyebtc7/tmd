import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pedidoId: string }> }
) {
  const supabaseAdmin = createAdminClient()
  const { pedidoId } = await params

  try {
    const { data: pedido, error: erroPedido } = await supabaseAdmin
      .from('pedidos')
      .select('id, status, token_rastreamento')
      .eq('id', pedidoId)
      .single()

    if (erroPedido || !pedido) {
      return NextResponse.json({ erro: 'Pedido não encontrado' }, { status: 404 })
    }

    const { data: rastreio } = await supabaseAdmin
      .from('rastreamentos')
      .select('codigo_rastreio, status, liberado_em')
      .eq('pedido_id', pedidoId)
      .maybeSingle()

    return NextResponse.json({
      pedidoId: pedido.id,
      status: pedido.status,
      codigoRastreamento: rastreio?.codigo_rastreio ?? null,
      rastreioLiberado: rastreio?.liberado_em
        ? new Date(rastreio.liberado_em).getTime() <= Date.now()
        : false,
    })
  } catch (erro) {
    console.error('erro_status_pedido', erro)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}