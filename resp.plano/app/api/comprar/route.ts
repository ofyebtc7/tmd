import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

interface ComprarPayload {
  produtoId: string
  nome: string
  email: string
  telefone: string
  cpf: string
  quantidade?: number
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient()

  try {
    const body = (await request.json()) as ComprarPayload
    const { produtoId, nome, email, telefone, cpf } = body
    const quantidadeRaw = body.quantidade
    const quantidade = Number.isInteger(quantidadeRaw) && quantidadeRaw! >= 1
      ? quantidadeRaw!
      : 1

    // Validações básicas
    if (!produtoId || !nome || !email || !telefone || !cpf) {
      return NextResponse.json(
        { erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    console.log('comprar_requisicao', { produtoId, email, cpf: cpf.slice(-4), quantidade })

    // Passo 1: Validar que o produto existe e está ativo
    const { data: produto, error: erroProduto } = await supabaseAdmin
      .from('produtos')
      .select('id, valor, ativo')
      .eq('id', produtoId)
      .single()

    if (erroProduto || !produto || !produto.ativo) {
      console.error('produto_nao_encontrado_ou_inativo', {
        produtoId,
        erro: erroProduto?.message,
      })
      return NextResponse.json(
        { erro: 'Produto não encontrado ou não está disponível' },
        { status: 404 }
      )
    }

    console.log('produto_validado', {
      produtoId,
      valor: produto.valor,
      quantidade,
      total: produto.valor * quantidade,
    })

    // Passo 2: Verificar se cliente existe (email OU CPF)
    let cliente = null

    // Buscar por email
    const { data: clientePorEmail } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, email, cpf')
      .eq('email', email.toLowerCase())
      .single()

    if (clientePorEmail) {
      cliente = clientePorEmail
      console.log('cliente_encontrado_por_email', { clienteId: cliente.id })
    } else {
      // Buscar por CPF se não encontrou por email
      const { data: clientePorCPF } = await supabaseAdmin
        .from('clientes')
        .select('id, nome, email, cpf')
        .eq('cpf', cpf)
        .single()

      if (clientePorCPF) {
        cliente = clientePorCPF
        console.log('cliente_encontrado_por_cpf', { clienteId: cliente.id })
      }
    }

    // Passo 3: Se não existe, criar novo cliente
    if (!cliente) {
      const { data: novoCliente, error: erroCliente } = await supabaseAdmin
        .from('clientes')
        .insert({
          nome: nome.trim(),
          email: email.toLowerCase(),
          cpf: cpf,
          telefone: telefone,
          origem: 'Checkout Online',
        })
        .select('id, email, cpf')
        .single()

      if (erroCliente || !novoCliente) {
        console.error('erro_criar_cliente', {
          email,
          erro: erroCliente?.message,
        })
        return NextResponse.json(
          { erro: 'Erro ao processar seu cadastro' },
          { status: 500 }
        )
      }

      cliente = novoCliente
      console.log('cliente_criado', { clienteId: cliente.id })
    }

    // Passo 4: Criar o pedido
    // A coluna pedidos.quantidade pode ainda não existir no banco (migration pendente).
    // Nesse caso o insert falha — então tentamos novamente sem a coluna. O valor total
    // já está multiplicado pela quantidade, então nada se perde.
    const dadosPedidoBase = {
      cliente_id: cliente.id,
      produto_id: produtoId,
      valor: Number(produto.valor) * quantidade,
      status: 'aguardando_pagamento',
      canal_venda: 'Checkout Online',
    }
    const { data: pedido, error: erroPedido } = await supabaseAdmin
      .from('pedidos')
      .insert({
        ...dadosPedidoBase,
        quantidade,
      })
      .select('id, token_rastreamento')
      .single()

    const pedidoSemQuantidade =
      erroPedido && !pedido && erroPedido.message.toLowerCase().includes('quantidade')
        ? await supabaseAdmin
            .from('pedidos')
            .insert(dadosPedidoBase)
            .select('id, token_rastreamento')
            .single()
        : null

    const pedidoFinal =
      pedido ?? pedidoSemQuantidade?.data ?? null
    const erroPedidoFinal = pedidoSemQuantidade?.error ?? erroPedido

    if (erroPedidoFinal || !pedidoFinal) {
      console.error('erro_criar_pedido', {
        clienteId: cliente.id,
        produtoId,
        erro: erroPedidoFinal?.message,
      })
      return NextResponse.json(
        { erro: 'Erro ao criar o pedido' },
        { status: 500 }
      )
    }

    console.log('pedido_criado', {
      pedidoId: pedidoFinal.id,
      clienteId: cliente.id,
      tokenRastreamento: pedidoFinal.token_rastreamento,
      quantidade,
      valorTotal: Number(produto.valor) * quantidade,
    })

    // Sucesso!
    return NextResponse.json({
      sucesso: true,
      tokenRastreamento: pedidoFinal.token_rastreamento,
      pedidoId: pedidoFinal.id,
    })
  } catch (erro) {
    console.error('erro_comprar', erro)
    return NextResponse.json(
      { erro: 'Erro interno ao processar a compra' },
      { status: 500 }
    )
  }
}
