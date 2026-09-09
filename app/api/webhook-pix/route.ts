import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase-admin'
import { gerarCodigoRastreio } from '@/lib/rastreio/gerar-codigo'
import { montarEventosRota, type CidadeRota } from '@/lib/rastreio/rota-logistica'
import { enviarEventoPurchase } from '@/lib/meta/capi'

const PINPAY_WEBHOOK_SECRET = process.env.PINPAY_WEBHOOK_SECRET

const HEADERS_ASSINATURA = [
  'x-pinpay-signature',
  'x-payzu-signature',
  'x-webhook-signature',
  'x-hub-signature-256',
]

interface PagamentoRecord {
  id: string
  pedido_id: string
  gateway_payment_id: string
  status: string
}

interface PayloadNormalizado {
  gatewayPaymentId: string | null
  statusGateway: string | null
  evento: string | null
  clientReference: string | null
}

function obterAssinaturaHeader(request: NextRequest): string | null {
  for (const nome of HEADERS_ASSINATURA) {
    const valor = request.headers.get(nome)
    if (valor) return valor
  }
  return null
}

function extrairValorAssinatura(
  assinatura: string
): { valor: string; timestamp: string | null } {
  const s = assinatura.trim()

  // Formato Stripe/Payzu: t=<ts>,v1=<hex|base64>
  const comV1 = s.match(/(?:^|[,; ])v1\s*=\s*([^,;\s]+)/)
  if (comV1) {
    const t = s.match(/(?:^|[,; ])t\s*=\s*(\d+)/)
    return { valor: comV1[1].trim(), timestamp: t ? t[1] : null }
  }

  // Preferido "sha256=<hex>":
  if (s.startsWith('sha256=')) {
    return { valor: s.slice('sha256='.length).trim(), timestamp: null }
  }

  // Hex HMAC "puro"/bare:
  return { valor: s, timestamp: null }
}

function hmacLiteral(conteudo: string): Buffer {
  return createHmac('sha256', PINPAY_WEBHOOK_SECRET!)
    .update(conteudo, 'utf-8')
    .digest()
}

function validarAssinatura(rawBody: string, assinatura: string): boolean {
  if (!PINPAY_WEBHOOK_SECRET) {
    console.error('PINPAY_WEBHOOK_SECRET nao configurada')
    return false
  }

  const { valor, timestamp } = extrairValorAssinatura(assinatura)

  // Tenta decodificar hex (valido/integro). Se falhar, tenta base64.
  let recebida: Buffer | null = null
  try {
    const hex = Buffer.from(valor, 'hex')
    if (hex.length > 0 && hex.length * 2 === valor.length) recebida = hex
  } catch {
    /* ignora e tenta base64 abaixo */
  }
  if (!recebida) {
    try {
      const b64 = Buffer.from(valor, 'base64')
      if (b64.length > 0) recebida = b64
    } catch {
      /* nada */
    }
  }

  if (!recebida || recebida.length === 0) {
    console.error('assinatura_formato_desconhecido', { assinatura })
    return false
  }

  // Conteúdos possíveis do HMAC: corpo puro; e variações com timestamp.
  const candidatos: string[] = [rawBody]
  if (timestamp) {
    candidatos.push(`${timestamp}.${rawBody}`)
    candidatos.push(`${timestamp}${rawBody}`)
  }

  for (const conteudo of candidatos) {
    try {
      const esperada = hmacLiteral(conteudo)
      if (esperada.length === recebida.length && timingSafeEqual(recebida, esperada)) {
        return true
      }
    } catch (erro) {
      console.error('erro_ao_lecompor_assinatura_hmac', { erro, conteudo: conteudo.slice(0, 200) })
      return false
    }
  }

  return false
}

function normalizarPayload(payload: Record<string, unknown>): PayloadNormalizado {
  const data = payload.data as Record<string, unknown> | undefined
  const metadata =
    (payload.metadata as Record<string, unknown> | undefined) ||
    (data?.metadata as Record<string, unknown> | undefined)
  const charge =
    (payload.charge as Record<string, unknown> | undefined) ||
    (data?.charge as Record<string, unknown> | undefined)
  const transaction =
    (payload.transaction as Record<string, unknown> | undefined) ||
    (data?.transaction as Record<string, unknown> | undefined)

  const gatewayPaymentId =
    (payload.id as string) ||
    (payload.transaction_id as string) ||
    (payload.payment_id as string) ||
    (payload.externalId as string) ||
    (data?.transaction_id as string) ||
    (data?.id as string) ||
    (charge?.id as string) ||
    (transaction?.id as string) ||
    null

  const statusGateway =
    (payload.status as string) ||
    (payload.payment_status as string) ||
    (payload.situation as string) ||
    (data?.status as string) ||
    (data?.payment_status as string) ||
    (charge?.status as string) ||
    (transaction?.status as string) ||
    null

  const evento = (payload.event as string) || (payload.type as string) || null

  // Referência do pedido: aceita várias grafias + o metadata.external_reference
  // que o gerar-pix envia como identificador estável do nosso pedido.
  const clientReference =
    (payload.clientReference as string) ||
    (payload.client_reference as string) ||
    (payload.reference as string) ||
    (payload.external_reference as string) ||
    (metadata?.external_reference as string) ||
    (metadata?.pedido_id as string) ||
    null

  return { gatewayPaymentId, statusGateway, evento, clientReference }
}

function resolverStatus(
  statusGateway: string | null,
  evento: string | null
): { pagamento: string | null; pedido: string | null } {
  const status = (statusGateway ?? '').toLowerCase()
  const ev = (evento ?? '').toLowerCase()

  const statusPago = [
    'paid', 'pago', 'approved', 'aprovado', 'confirmed', 'completed',
    'success', 'succeeded', 'settled', 'payment_confirmed',
    'pix_paid', 'approved_paid', 'authorized', 'autorizado', 'processed',
  ].includes(status)

  if (status === 'expired' || status === 'expirado' || status === 'timeout') {
    return { pagamento: 'expirado', pedido: null }
  }

  if (
    ['failed', 'cancelled', 'canceled', 'cancelado', 'recusado', 'refused'].includes(status)
  ) {
    return { pagamento: 'cancelado', pedido: null }
  }

  if (['refunded', 'estornado', 'reembolsado'].includes(status)) {
    return { pagamento: 'estornado', pedido: 'cancelado' }
  }

  if (statusPago) {
    return { pagamento: 'pago', pedido: 'pago' }
  }

  const eventoIndicaPago = [
    '.paid', '.succeeded', '.approved', '.completed', '.confirmed',
    '.success', '.processed', '_paid', '_success', '_succeeded',
    'payment_received', 'pago', 'aprovado', 'concluido', 'confirmado',
  ].some((s) => ev.includes(s))

  const eventoIndicaCancelado = [
    '.cancelled', '.canceled', '.refused', '.failed', '.rejected',
    'recusado', 'cancelado', 'falhou',
  ].some((s) => ev.includes(s))

  if (eventoIndicaPago) return { pagamento: 'pago', pedido: 'pago' }
  if (eventoIndicaCancelado) return { pagamento: 'cancelado', pedido: null }

  return { pagamento: null, pedido: null }
}

async function findPagamentoByTransactionId(
  transactionId: string
): Promise<PagamentoRecord | null> {
  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin
    .from('pagamentos')
    .select('id, pedido_id, gateway_payment_id, status')
    .eq('gateway_payment_id', transactionId)
    .single()

  if (error || !data) {
    return null
  }

  return data as PagamentoRecord
}

async function findPagamentoPorClienteReference(
  clientReference: string | null
): Promise<PagamentoRecord | null> {
  if (!clientReference) return null

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin
    .from('pagamentos')
    .select('id, pedido_id, gateway_payment_id, status')
    .eq('pedido_id', clientReference)
    .single()

  if (error || !data) {
    return null
  }

  return data as PagamentoRecord
}

async function consultarViaCEP(cep: string): Promise<{ cidade: string; uf: string } | null> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (!response.ok) return null
    const data = await response.json()
    if (data.erro) return null
    return { cidade: data.localidade, uf: data.uf }
  } catch {
    return null
  }
}

async function gerarRotaLogistica(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  clienteCep: string | null,
  clienteCidade: string | null,
  clienteUf: string | null,
  pedidoId: string,
  rastreamentoId: string,
  agora: Date
): Promise<void> {
  let destinoCidade = clienteCidade
  let destinoUf = clienteUf

  if (clienteCep && /^\d{8}$/.test(clienteCep)) {
    const viaCep = await consultarViaCEP(clienteCep)
    if (viaCep) {
      destinoCidade = viaCep.cidade
      destinoUf = viaCep.uf
    }
  }

  if (!destinoCidade || !destinoUf) {
    console.log('rota_abortada_sem_destino', { clienteCep, clienteCidade, clienteUf })
    return
  }

  const { data: todasCidades } = await supabaseAdmin
    .from('cidades_rota')
    .select('*')

  if (!todasCidades || todasCidades.length === 0) {
    console.log('rota_abortada_sem_cidades_rota', { destinoCidade, destinoUf })
    return
  }

  const cidades = todasCidades as CidadeRota[]

  const eventos = montarEventosRota({
    cidades,
    clienteCidade: destinoCidade,
    clienteUf: destinoUf,
    pagamentoEm: agora,
  })

  if (eventos.length === 0) {
    console.log('rota_abortada_sem_eventos', { destinoCidade, destinoUf })
    return
  }

  const eventosInsert = eventos.map((ev) => ({
    rastreamento_id: rastreamentoId,
    status: 'concluido',
    ...ev,
  }))

  // VALIDAÇÃO DEFENSIVA: evita eventos duplicados (rastreamento_id, titulo)
  // e datas fora do cronograma (anterior ao último registro / futuro anormal).
  const { data: eventosExistentes, error: erroBuscarEventos } = await supabaseAdmin
    .from('eventos_rastreamento')
    .select('titulo, data_evento')
    .eq('rastreamento_id', rastreamentoId)

  if (erroBuscarEventos) {
    console.error('erro_buscar_eventos_existentes_para_rota', {
      rastreamento_id: rastreamentoId,
      erro: erroBuscarEventos,
    })
    return
  }

  const existentes = (eventosExistentes ?? []) as { titulo: string; data_evento: string }[]
  const titulosExistentes = new Set(existentes.map((e) => e.titulo))
  const ultimaDataEventoMs = existentes.reduce<number>((maior, e) => {
    const ms = new Date(e.data_evento).getTime()
    return Number.isNaN(ms) ? maior : Math.max(maior, ms)
  }, 0)

  const MAX_HORAS_FUTURO = 12
  const maxEsperadoMs = eventosInsert.reduce<number>(
    (maior, ev) => Math.max(maior, new Date(ev.data_evento).getTime()),
    0
  )
  const limiteFuturoMs = maxEsperadoMs + MAX_HORAS_FUTURO * 60 * 60 * 1000

  const eventosPendentes = eventosInsert.filter((ev) => {
    if (titulosExistentes.has(ev.titulo)) {
      console.warn('evento_rota_duplicado_ignorado', {
        rastreamento_id: rastreamentoId,
        titulo: ev.titulo,
      })
      return false
    }

    const dataMs = new Date(ev.data_evento).getTime()

    if (ultimaDataEventoMs > 0 && dataMs < ultimaDataEventoMs) {
      return false
    }

    if (dataMs > limiteFuturoMs) {
      return false
    }

    return true
  })

  if (eventosPendentes.length === 0) {
    console.log('eventos_rota_sem_pendentes_validos', {
      rastreamento_id: rastreamentoId,
      gerados: eventosInsert.length,
      existentes: existentes.length,
    })
    return
  }

  const rota = eventosPendentes
    .map((ev) => `${ev.cidade}/${ev.estado}`)
    .join(' -> ')

  const { error: erroEventos } = await supabaseAdmin
    .from('eventos_rastreamento')
    .insert(eventosPendentes)

  if (erroEventos) {
    console.error('erro_criar_eventos_rota', erroEventos)
  } else {
    console.log('eventos_rota_criados', {
      rastreamento_id: rastreamentoId,
      total_eventos: eventosPendentes.length,
      rota,
    })
  }
}

async function processarEvento(
  normalizado: PayloadNormalizado,
  payloadBruto: unknown
): Promise<boolean> {
  const { gatewayPaymentId, statusGateway } = normalizado

  console.log('webhook_evento_recebido', {
    gateway_payment_id: gatewayPaymentId,
    status: statusGateway,
    evento: normalizado.evento,
  })

  if (!gatewayPaymentId) {
    return true
  }

  let pagamento = await findPagamentoByTransactionId(gatewayPaymentId)
  if (!pagamento) {
    pagamento = await findPagamentoPorClienteReference(normalizado.clientReference)
  }

  if (!pagamento) {
    console.error('pagamento_nao_correlacionado', {
      gateway_payment_id: gatewayPaymentId,
      client_reference: normalizado.clientReference,
    })
    return true
  }

  if (pagamento.status === 'pago') {
    console.log('pagamento_ja_processado', { pagamento_id: pagamento.id })
    return true
  }

  const { pagamento: novoStatusPagamento, pedido: novoStatusPedido } =
    resolverStatus(statusGateway, normalizado.evento)

  if (!novoStatusPagamento) {
    console.error('webhook_evento_ignorado', {
      status: statusGateway,
      evento: normalizado.evento,
    })
    return true
  }

  const supabaseAdmin = createAdminClient()

  try {
    const { error: erroPagamento } = await supabaseAdmin
      .from('pagamentos')
      .update({
        status: novoStatusPagamento,
        data_pagamento:
          novoStatusPagamento === 'pago' ? new Date().toISOString() : undefined,
        resposta_gateway: payloadBruto,
      })
      .eq('id', pagamento.id)

    if (erroPagamento) {
      console.error('erro_atualizar_pagamento', erroPagamento)
      return false
    }

    if (novoStatusPedido) {
      const { error: erroPedido } = await supabaseAdmin
        .from('pedidos')
        .update({ status: novoStatusPedido, updated_at: new Date().toISOString() })
        .eq('id', pagamento.pedido_id)

      if (erroPedido) {
        console.error('erro_atualizar_pedido', erroPedido)
        return false
      }
    }

    if (novoStatusPagamento === 'pago') {
      // Analytics opcional — falha não quebra o fluxo.
      try {
        const { data: pedidoPago } = await supabaseAdmin
          .from('pedidos')
          .select('valor, clientes ( email )')
          .eq('id', pagamento.pedido_id)
          .single()

        const clientePago = Array.isArray(pedidoPago?.clientes)
          ? pedidoPago?.clientes[0]
          : pedidoPago?.clientes

        await enviarEventoPurchase({
          pedidoId: pagamento.pedido_id,
          valor: Number(pedidoPago?.valor ?? 0),
          email: (clientePago as { email?: string } | undefined)?.email ?? null,
        })
      } catch (erroCapi) {
        console.error('erro_enviar_purchase_capi', erroCapi)
      }

      const { data: rastreamentoExistente } = await supabaseAdmin
        .from('rastreamentos')
        .select('id')
        .eq('pedido_id', pagamento.pedido_id)
        .maybeSingle()

      if (!rastreamentoExistente) {
        const agora = new Date()
        const liberadoEm = new Date(agora.getTime() + 24 * 60 * 60 * 1000)

        const codigoRastreio = await gerarCodigoRastreio()

        const { data: novoRastreamento, error: erroRastreamento } = await supabaseAdmin
          .from('rastreamentos')
          .insert({
            pedido_id: pagamento.pedido_id,
            codigo_rastreio: codigoRastreio,
            status: 'preparando',
            liberado_em: liberadoEm.toISOString(),
          })
          .select('id')
          .single()

        if (erroRastreamento || !novoRastreamento) {
          console.error('erro_criar_rastreamento', erroRastreamento)
          return false
        }

        console.log('rastreamento_criado', {
          pedido_id: pagamento.pedido_id,
          codigo_rastreio: codigoRastreio,
        })

        try {
          const { data: pedidoComCliente } = await supabaseAdmin
            .from('pedidos')
            .select('clientes ( cep, cidade, estado )')
            .eq('id', pagamento.pedido_id)
            .single()

          if (pedidoComCliente) {
            const clienteData = Array.isArray(pedidoComCliente.clientes)
              ? pedidoComCliente.clientes[0]
              : pedidoComCliente.clientes

            await gerarRotaLogistica(
              supabaseAdmin,
              clienteData?.cep ?? null,
              clienteData?.cidade ?? null,
              clienteData?.estado ?? null,
              pagamento.pedido_id,
              novoRastreamento.id,
              agora
            )
          }
        } catch (erroRota) {
          console.error('erro_gerar_rota_logistica', erroRota)
        }
      } else {
        console.log('rastreamento_ja_existente', { pedido_id: pagamento.pedido_id })
      }
    }

    return true
  } catch (erro) {
    console.error('erro_processando_evento', erro)
    return false
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const headersRelevantes = Object.fromEntries(
    Object.entries(Object.fromEntries(request.headers.entries())).filter(([k]) =>
      ['content-type', 'user-agent', ...HEADERS_ASSINATURA].includes(k)
    )
  )

  const assinatura = obterAssinaturaHeader(request)

  if (assinatura) {
    if (!validarAssinatura(rawBody, assinatura)) {
      console.error('webhook_assinatura_invalida', { headers: headersRelevantes })
      return NextResponse.json({ erro: 'Assinatura invalida' }, { status: 401 })
    }
    console.log('webhook_assinatura_validada')
  } else {
    console.error('webhook_sem_assinatura_rejeitado', { headers: headersRelevantes })
    return NextResponse.json({ erro: 'Assinatura obrigatoria' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch (erro) {
    console.error('webhook_json_invalido', { erro, body: rawBody })
    return NextResponse.json({ erro: 'Payload invalido' }, { status: 400 })
  }

  const normalizado = normalizarPayload(payload)

  if (!normalizado.gatewayPaymentId) {
    console.error('webhook_sem_gateway_payment_id', payload)
    return NextResponse.json({ erro: 'Missing payment id' }, { status: 400 })
  }

  try {
    const sucesso = await processarEvento(normalizado, payload)
    if (!sucesso) {
      console.error('webhook_processamento_falhou', payload)
      return NextResponse.json(
        { erro: 'Falha ao processar' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sucesso: true, gateway_payment_id: normalizado.gatewayPaymentId })
  } catch (erro) {
    console.error('webhook_erro_nao_esperado', erro)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}