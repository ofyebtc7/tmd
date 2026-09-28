// lib/tiktok/compra.ts
// CompletePayment (= Purchase no Ads Manager do TikTok) via Events API.
//
// REGRA: só o webhook do gateway chama isto, e SOMENTE quando o pagamento
// foi confirmado de fato (status "pago"). Nunca no clique de "Finalizar
// compra" e nunca a partir do browser — assim o Purchase só existe para
// compras reais.
//
// O event_id é derivado do pedidoId, então o browser (que observa o status
// "pago" por polling) e o servidor enviam exatamente o mesmo valor e o
// TikTok deduplica a ocorrência.

import { enviarEventoTiktok } from './client'
import { hashEmail, hashSha256, hashTelefone } from './contexto'
import { TIKTOK_CURRENCY } from './config'
import { CONTENT_CATEGORY, EVENTOS_TIKTOK, gerarEventIdDoPedido, type ConteudoTikTok } from './eventos'

export interface DadosCompletePayment {
  pedidoId: string
  valor: number
  quantidade?: number | null
  nomeProduto?: string | null
  email?: string | null
  telefone?: string | null
  ttclid?: string | null
  ttp?: string | null
  /** Horário real do pagamento (epoch segundos). Vem do gateway. */
  eventTime?: number | null
  url?: string | null
}

/**
 * external_id estável entre pedidos do mesmo cliente.
 * O pedidoId muda a cada compra; o e-mail/telefone identifica a pessoa.
 */
function externalId(email?: string | null, telefone?: string | null, pedidoId?: string): string {
  const doEmail = email ? hashEmail(email) : null
  if (doEmail) return doEmail
  const doTelefone = telefone ? hashTelefone(telefone) : null
  if (doTelefone) return doTelefone
  return hashSha256(pedidoId ?? '') ?? ''
}

/** "Tomada Inteligente Plugmax - Preto" → "Preto" (mesmo content_id do browser) */
function extrairVariante(nomeProduto: string | null | undefined): string {
  if (!nomeProduto) return 'plugmax'
  const partes = nomeProduto.split('-')
  const ultima = partes[partes.length - 1]?.trim()
  return ultima && ultima.length > 0 ? ultima : nomeProduto.trim()
}

export async function enviarEventoCompletePayment(dados: DadosCompletePayment): Promise<boolean> {
  const valor = Number(dados.valor)
  if (!Number.isFinite(valor) || valor <= 0) {
    console.warn('tiktok_purchase_valor_invalido', { pedido_id: dados.pedidoId })
    return false
  }

  const quantidade = Math.max(1, Math.round(dados.quantidade ?? 1))
  const conteudo: ConteudoTikTok = {
    content_id: extrairVariante(dados.nomeProduto).slice(0, 40),
    content_type: 'product',
    content_category: CONTENT_CATEGORY,
    price: Math.round((valor / quantidade) * 100) / 100,
    quantity: quantidade,
  }
  if (dados.nomeProduto) conteudo.content_name = dados.nomeProduto.slice(0, 100)

  return enviarEventoTiktok(EVENTOS_TIKTOK.CompletePayment, {
    eventId: gerarEventIdDoPedido(dados.pedidoId, EVENTOS_TIKTOK.CompletePayment),
    eventTime: dados.eventTime ?? undefined,
    user: {
      email: dados.email ?? null,
      telefone: dados.telefone ?? null,
      externalId: externalId(dados.email, dados.telefone, dados.pedidoId),
      ttclid: dados.ttclid ?? null,
      ttp: dados.ttp ?? null,
      // IP/user_agent NÃO são enviados aqui: esta requisição parte do gateway
      // de pagamento, não do visitante. Enviar o IP do gateway corromperia a
      // atribuição. O par é opcional na Events API.
    },
    page: {
      url: dados.url ?? undefined,
    },
    properties: {
      currency: TIKTOK_CURRENCY,
      value: valor,
      contents: [conteudo],
    },
  })
}
