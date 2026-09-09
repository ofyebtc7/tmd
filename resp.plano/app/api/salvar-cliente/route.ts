import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  validarNome,
  validarEmail,
  validarCPF,
  validarTelefone,
} from '@/lib/validacao'

interface SalvarClientePayload {
  nome?: string
  email?: string
  cpf?: string
  telefone?: string
}

export async function POST(request: NextRequest) {
  let body: SalvarClientePayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
  }

  const nome = body.nome?.trim() ?? ''
  const email = (body.email ?? '').toLowerCase().trim()
  const cpf = (body.cpf ?? '').replace(/\D/g, '')
  const telefone = (body.telefone ?? '').replace(/\D/g, '')

  if (!validarNome(nome)) {
    return NextResponse.json(
      { erro: 'Informe seu nome completo (nome + sobrenome).' },
      { status: 400 }
    )
  }
  if (!validarEmail(email)) {
    return NextResponse.json({ erro: 'Informe um e-mail válido.' }, { status: 400 })
  }
  if (!validarCPF(cpf)) {
    return NextResponse.json({ erro: 'CPF inválido.' }, { status: 400 })
  }
  if (!validarTelefone(telefone)) {
    return NextResponse.json({ erro: 'Telefone inválido.' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  let clienteId: string | null = null

  const { data: clientePorEmail } = await supabaseAdmin
    .from('clientes')
    .select('id')
    .eq('email', email)
    .single()

  if (clientePorEmail) {
    clienteId = clientePorEmail.id
  } else {
    const { data: clientePorCpf } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('cpf', cpf)
      .single()
    if (clientePorCpf) {
      clienteId = clientePorCpf.id
    }
  }

  if (clienteId) {
    const { error } = await supabaseAdmin
      .from('clientes')
      .update({ nome, email, cpf, telefone })
      .eq('id', clienteId)

    if (error) {
      console.error('erro_atualizar_cliente', error)
      return NextResponse.json(
        { erro: 'Erro ao atualizar seu cadastro' },
        { status: 500 }
      )
    }
  } else {
    const { data: novoCliente, error } = await supabaseAdmin
      .from('clientes')
      .insert({ nome, email, cpf, telefone, origem: 'Checkout Online' })
      .select('id')
      .single()

    if (error || !novoCliente) {
      console.error('erro_criar_cliente_identificacao', error)
      return NextResponse.json(
        { erro: 'Erro ao criar seu cadastro' },
        { status: 500 }
      )
    }

    clienteId = novoCliente.id
  }

  return NextResponse.json({ sucesso: true, clienteId })
}
