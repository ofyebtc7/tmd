import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { validarCPF } from '@/lib/validacao'

// Pagamento com cartão NÃO é processado neste ambiente: o fluxo real
// obrigatório é PIX (resposta do frontend sempre orienta o cliente ao PIX).
// Por segurança (PCI-DSS) o servidor NÃO aceita nem armazena número,
// validade e CVV do cartão — esses campos são descartados.
export async function POST(request: NextRequest) {
  let body: { pedidoId?: string; nomeCartao?: string; cpf?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'Body invalido' }, { status: 400 })
  }

  const pedidoId = body.pedidoId?.trim() ?? ''
  const nomeCartao = body.nomeCartao?.trim() ?? ''
  const cpf = (body.cpf ?? '').replace(/\D/g, '')

  if (!pedidoId || !nomeCartao || !validarCPF(cpf)) {
    return NextResponse.json(
      { erro: 'Dados invalidos ou incompletos' },
      { status: 400 }
    )
  }

  // Confirma que o pedido existe (nada é gravado em cartoes).
  const supabaseAdmin = createAdminClient()

  const { data: pedido } = await supabaseAdmin
    .from('pedidos')
    .select('id')
    .eq('id', pedidoId)
    .single()

  if (!pedido) {
    return NextResponse.json({ erro: 'Pedido nao encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    sucesso: true,
    indisponivel: true,
    mensagem:
      'Pagamento com cartao temporariamente indisponivel. Finalize via PIX.',
  })
}