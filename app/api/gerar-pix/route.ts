import { NextRequest, NextResponse } from 'next/server'
import { criarCobrancaPix } from '@/lib/pagamento/pinpay'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient()

  try {
    const { pedidoId } = await request.json()

    if (!pedidoId) {
      return NextResponse.json({ erro: 'pedidoId é obrigatório' }, { status: 400 })
    }

    const { data: pedido, error: erroPedido } = await supabaseAdmin
      .from('pedidos')
      .select('id, valor, token_rastreamento, clientes(nome, email, cpf)')
      .eq('id', pedidoId)
      .single()

    if (erroPedido || !pedido) {
      return NextResponse.json({ erro: 'Pedido não encontrado' }, { status: 404 })
    }

    const cliente = pedido.clientes as unknown as { nome: string; email: string; cpf: string }

    const resultado = await criarCobrancaPix({
      valorEmReais: Number(pedido.valor),
      descricao: `Pedido Plugmax ${pedido.token_rastreamento?.slice(0, 8)}`,
      pedidoId: pedido.id,
      tokenCheckout: pedido.token_rastreamento,
      cliente: {
        nome: cliente.nome,
        email: cliente.email,
        cpf: cliente.cpf,
      },
    })

    const { data: pagamento, error: erroPagamento } = await supabaseAdmin
      .from('pagamentos')
      .insert({
        pedido_id: pedido.id,
        gateway: 'pinpay',
        gateway_payment_id: resultado.idExterno,
        pix_code: resultado.qrCode,
        pix_qrcode: resultado.qrCodeUrl,
        status: 'pendente',
        valor: pedido.valor,
      })
      .select()
      .single()

    if (erroPagamento) {
      console.error('erro_salvar_pagamento', erroPagamento)
      return NextResponse.json({ erro: 'Cobrança gerada mas falhou ao salvar' }, { status: 500 })
    }

    return NextResponse.json({
      sucesso: true,
      pagamentoId: pagamento.id,
      pixCode: pagamento.pix_code,
      pixQrCodeUrl: pagamento.pix_qrcode,
      expiresAt: null,
      pedidoId: pedido.id,
    })
  } catch (erro) {
    console.error('erro_gerar_pix', erro)
    return NextResponse.json({ erro: 'Erro ao gerar PIX' }, { status: 500 })
  }
}