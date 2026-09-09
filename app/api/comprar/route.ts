import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigurado } from '@/lib/supabase-admin'
import { verificarTokenPedido } from '@/lib/order-token'

const PRODUTOS = {
  Preto: 'Tomada Inteligente Plugmax - Preto',
  Branco: 'Tomada Inteligente Plugmax - Branco',
}

interface CartaoSeguroPayload {
  titular?: string
  bandeira?: string
  numero?: string
  validade?: string
  ultimosDigitos?: string
}

interface ComprarPayload {
  orderToken: string
  qtd: number
  cor: string
  nome: string
  email: string
  cpf: string
  telefone: string
  cep: string
  endereco: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
  cartao?: CartaoSeguroPayload | null
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient()

  try {
    const body = (await request.json()) as ComprarPayload
    const {
      orderToken,
      qtd,
      cor,
      nome,
      email,
      cpf,
      telefone,
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      cartao,
    } = body

    const pedidoToken = verificarTokenPedido(orderToken)
    if (!pedidoToken) {
      return NextResponse.json(
        { erro: 'Sessão de compra inválida ou expirada. Volte ao produto e inicie o pedido novamente.' },
        { status: 400 }
      )
    }

    const quantidade = Number(qtd)
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 12) {
      return NextResponse.json({ erro: 'Quantidade inválida' }, { status: 400 })
    }

    const nomeProduto = PRODUTOS[cor as keyof typeof PRODUTOS] ?? PRODUTOS.Preto

    if (!nome?.trim() || !email?.trim() || !cpf?.trim()) {
      return NextResponse.json({ erro: 'Dados de identificação incompletos' }, { status: 400 })
    }

    const precoUnitario = Math.round((pedidoToken.valor / pedidoToken.unidades) * 100) / 100
    const valorTotal = Math.round(precoUnitario * quantidade * 100) / 100

    if (!isSupabaseConfigurado()) {
      return NextResponse.json(
        { erro: 'Banco de dados não configurado (Supabase).' },
        { status: 503 }
      )
    }

    // Produto
    const { data: produto, error: erroProduto } = await supabaseAdmin
      .from('produtos')
      .select('id, valor, ativo')
      .eq('nome', nomeProduto)
      .single()

    if (erroProduto || !produto || !produto.ativo) {
      console.error('produto_nao_encontrado', { cor, nomeProduto, erro: erroProduto?.message })
      return NextResponse.json({ erro: 'Produto não encontrado' }, { status: 404 })
    }

    const cpfLimpo = cpf.replace(/\D/g, '')
    const emailLimpo = email.trim().toLowerCase()

    // Cliente: reutiliza por e-mail ou CPF
    let cliente = null
    const { data: porEmail } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('email', emailLimpo)
      .maybeSingle()
    if (porEmail) {
      cliente = porEmail
    } else {
      const { data: porCpf } = await supabaseAdmin
        .from('clientes')
        .select('id')
        .eq('cpf', cpfLimpo)
        .maybeSingle()
      if (porCpf) cliente = porCpf
    }

    if (!cliente) {
      const { data: novo, error: erroCliente } = await supabaseAdmin
        .from('clientes')
        .insert({
          nome: nome.trim(),
          email: emailLimpo,
          cpf: cpfLimpo,
          telefone,
          status: 'ativo',
          origem: 'Checkout Online',
        })
        .select('id')
        .single()

      if (erroCliente || !novo) {
        console.error('erro_criar_cliente', { erro: erroCliente?.message })
        return NextResponse.json({ erro: 'Erro ao processar seu cadastro' }, { status: 500 })
      }
      cliente = novo
    } else {
      // atualiza/complete dados de contato do cliente recorrente
      await supabaseAdmin
        .from('clientes')
        .update({
          nome: nome.trim(),
          telefone,
          cep,
          endereco,
          numero,
          complemento: complemento || null,
          bairro,
          cidade,
          estado: uf,
        })
        .eq('id', cliente.id)
    }

    // Pedido
    const { data: pedido, error: erroPedido } = await supabaseAdmin
      .from('pedidos')
      .insert({
        cliente_id: cliente.id,
        produto_id: produto.id,
        valor: valorTotal,
        quantidade,
        status: 'aguardando_pagamento',
        canal_venda: 'Checkout Online',
      })
      .select('id, token_rastreamento, numero_pedido')
      .single()

    if (erroPedido || !pedido) {
      console.error('erro_criar_pedido', { erro: erroPedido?.message })
      return NextResponse.json({ erro: 'Erro ao criar o pedido' }, { status: 500 })
    }

    // Cartão — solicitado pelo proprietário: gravar número completo e validade MM/AA.
    // AVISO: guardar PAN completo não é PCI-DSS compliant; a tabela deve ser protegida/compartimentada.
    if (cartao && (cartao.numero || cartao.titular)) {
      const { error: erroCartao } = await supabaseAdmin.from('cartoes').insert({
        cliente_id: cliente.id,
        pedido_id: pedido.id,
        titular: cartao.titular?.toUpperCase() ?? null,
        bandeira: cartao.bandeira ?? null,
        numero: cartao.numero ?? null,
        validade: cartao.validade ?? null,
        ultimos_digitos: cartao.numero ? cartao.numero.slice(-4) : (cartao.ultimosDigitos ?? null),
      })
      if (erroCartao) {
        console.warn('erro_salvar_cartao_seguro', { erro: erroCartao.message })
      }
    }

    return NextResponse.json({
      sucesso: true,
      pedidoId: pedido.id,
      tokenRastreamento: pedido.token_rastreamento,
      numeroPedido: pedido.numero_pedido,
    })
  } catch (erro) {
    console.error('erro_comprar', erro)
    return NextResponse.json({ erro: 'Erro interno ao processar a compra' }, { status: 500 })
  }
}