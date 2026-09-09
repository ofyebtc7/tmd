import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { validarNome, validarCEP } from '@/lib/validacao'

interface SalvarEntregaPayload {
  clienteId?: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  destinatario?: string
}

export async function POST(request: NextRequest) {
  let body: SalvarEntregaPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Body inválido' }, { status: 400 })
  }

  const clienteId = body.clienteId?.trim() ?? ''
  const cep = (body.cep ?? '').replace(/\D/g, '')
  const endereco = body.endereco?.trim() ?? ''
  const numero = body.numero?.trim() ?? ''
  const complemento = body.complemento?.trim() ?? ''
  const bairro = body.bairro?.trim() ?? ''
  const cidade = body.cidade?.trim() ?? ''
  const uf = body.uf?.trim() ?? ''
  const destinatario = body.destinatario?.trim() ?? ''

  if (!clienteId) {
    return NextResponse.json(
      { erro: 'clienteId é obrigatório' },
      { status: 400 }
    )
  }
  if (!validarCEP(cep)) {
    return NextResponse.json(
      { erro: 'CEP deve ter 8 dígitos' },
      { status: 400 }
    )
  }
  if (!endereco || !numero || !bairro || !cidade || !uf) {
    return NextResponse.json(
      { erro: 'Preencha todos os campos de endereço' },
      { status: 400 }
    )
  }
  if (!validarNome(destinatario)) {
    return NextResponse.json(
      { erro: 'Informe o destinatário (nome + sobrenome).' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('clientes')
    .update({
      nome: destinatario,
      cep,
      endereco,
      numero,
      complemento: complemento || null,
      bairro,
      cidade,
      estado: uf,
    })
    .eq('id', clienteId)

  if (error) {
    console.error('erro_salvar_entrega', error)
    return NextResponse.json(
      { erro: 'Erro ao salvar endereço de entrega' },
      { status: 500 }
    )
  }

  return NextResponse.json({ sucesso: true })
}
