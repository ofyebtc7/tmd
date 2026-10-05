'use client'

import {
  Truck,
  CheckCircle2,
  MapPin,
  Boxes,
  Clock,
} from 'lucide-react'
import Image from 'next/image'
import { urlImagemValida } from '@/lib/imagem'
import { classificarEvento, derivarFase } from '@/lib/rastreio/status'

interface Produto {
  nome: string
  imagem_url: string | null
}

interface Cliente {
  nome: string
  cidade: string
  estado: string
}

interface Pedido {
  id: string
  numero_pedido: string
  status: string
  previsao_entrega_inicio: string | null
  previsao_entrega_fim: string | null
  token_rastreamento: string
  produto: Produto
  cliente: Cliente
}

interface Rastreamento {
  id: string
  status: string
  previsao_inicio: string | null
  previsao_fim: string | null
  liberado_em: string | null
}

interface Evento {
  id: string
  titulo: string
  descricao: string | null
  cidade: string | null
  estado: string | null
  status: string
  data_evento: string
}

interface Props {
  pedido: Pedido
  rastreamento: Rastreamento | null
  rastreioLiberado: boolean
  eventos: Evento[]
}

const FASES = [
  { chave: 'confirmado', rotulo: 'Pedido confirmado', subtitulo: 'Pagamento aprovado' },
  { chave: 'preparado', rotulo: 'Pedido preparado', subtitulo: 'Embalagem e etiqueta' },
  { chave: 'transito', rotulo: 'Em trânsito', subtitulo: 'Enviado pelos Correios' },
  { chave: 'entregue', rotulo: 'Entregue', subtitulo: 'Recebido com sucesso' },
]

function formatarData(data: string): string {
  const d = new Date(data)
  return d.toLocaleDateString('pt-BR')
}

function formatarDataHora(data: string): string {
  const d = new Date(data)
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function formatarPeriodo(inicio: string | null, fim: string | null): string | null {
  if (!inicio && !fim) return null
  if (inicio && fim) {
    return `${formatarData(inicio)} — ${formatarData(fim)}`
  }
  return formatarData(inicio || fim || '')
}

const NUMERO_FASE: Record<string, number> = {
  confirmado: 1,
  preparado: 2,
  em_transito: 3,
  entregue: 4,
}

export default function TimelineRastreio({ pedido, rastreamento, rastreioLiberado, eventos }: Props) {
  const eventosOrdenados = [...eventos].sort(
    (a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime()
  )

  const faseAtual = NUMERO_FASE[derivarFase(eventosOrdenados)] ?? 1

  const ROTULO_BADGE: Record<number, string> = {
    1: 'Pedido confirmado',
    2: 'Pedido preparado',
    3: 'Em trânsito',
    4: 'Entregue',
  }
  const tituloStatus = ROTULO_BADGE[faseAtual] ?? 'Pedido confirmado'
  const rotuloBadge = ROTULO_BADGE[faseAtual] ?? 'Pedido confirmado'

  const ultimoEvento = eventosOrdenados[eventosOrdenados.length - 1]

  const clienteCidade = pedido.cliente?.cidade ?? 'Destino'
  const clienteEstado = pedido.cliente?.estado ?? ''

  // ROTA DO ENVIO — origem fixa Belo Horizonte/CTCE-BH; posição atual e
  // destino mudam conforme a etapa mais recente já visível (a RPC só devolve
  // eventos com data_evento <= now()).
  const origem = 'Belo Horizonte'
  const origemEstado = 'MG'

  const eventoPostado = eventosOrdenados.find((e) => e.titulo === 'Objeto postado')
  const eventoChegouHub = eventosOrdenados.find((e) => e.titulo === 'Em trânsito')
  const eventoSaiuEntrega = eventosOrdenados.find((e) => e.titulo === 'Saiu para entrega')
  const eventoEntregue = eventosOrdenados.find((e) => e.titulo === 'Entregue')

  function extrairHubDaDescricao(descricao: string | null | undefined): string | null {
    if (!descricao) return null
    const match = descricao.match(/rumo ao centro de distribuição de (.+?)\.\s*$/)
    return match ? match[1].trim() : null
  }

  const hubNome =
    eventoChegouHub?.cidade ??
    extrairHubDaDescricao(eventoPostado?.descricao) ??
    clienteCidade
  const rotaComHub = hubNome !== clienteCidade
  const hubEstado = eventoChegouHub?.estado ?? ''

  let posicaoAtual: string
  let posicaoAtualEstado: string
  let destino: string
  let destinoEstado: string
  let legendaPosicao: string
  let legendaDestino: string
  let subtituloRota: string

  if (eventoEntregue) {
    posicaoAtual = clienteCidade
    posicaoAtualEstado = clienteEstado
    destino = clienteCidade
    destinoEstado = clienteEstado
    legendaPosicao = 'Entregue'
    legendaDestino = 'Entrega realizada'
    subtituloRota = 'Pedido entregue'
  } else if (eventoSaiuEntrega) {
    posicaoAtual = `A caminho de ${clienteCidade}`
    posicaoAtualEstado = ''
    destino = clienteCidade
    destinoEstado = clienteEstado
    legendaPosicao = 'Em movimento'
    legendaDestino = 'Entrega prevista'
    subtituloRota = 'Saiu para entrega final'
  } else if (eventoChegouHub) {
    posicaoAtual = hubNome
    posicaoAtualEstado = hubEstado
    destino = clienteCidade
    destinoEstado = clienteEstado
    legendaPosicao = 'Em movimento'
    legendaDestino = 'Entrega prevista'
    subtituloRota = `Chegou ao centro de distribuição de ${hubNome}`
  } else {
    posicaoAtual = `A caminho de ${hubNome}`
    posicaoAtualEstado = ''
    destino = hubNome
    destinoEstado = rotaComHub ? '' : clienteEstado
    legendaPosicao = 'Em movimento'
    legendaDestino = rotaComHub ? 'Destino' : 'Entrega prevista'
    subtituloRota = 'Saindo do Centro de Tratamento de Cargas Especiais'
  }

  const imagemProduto = urlImagemValida(pedido.produto.imagem_url)

  return (
    <>
      {/* Cabeçalho do pedido */}
      <div className="mb-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-blue">
          Rastreamento do pedido
        </p>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-card">
          <div className="flex flex-col gap-4 border-b border-[#F1F2F4] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-3">
              {imagemProduto ? (
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[14px] border border-black/[0.06] bg-[#F8F9FB]">
                  <Image
                    src={pedido.produto.imagem_url as string}
                    alt={pedido.produto.nome}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[14px] bg-primary/5">
                  <Boxes size={24} strokeWidth={1.75} className="text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold leading-snug text-text-strong">
                  {pedido.produto.nome}
                </p>
                <p className="mt-0.5 text-[12px] text-text-muted">
                  Pedido <span className="font-semibold text-text-strong">#{pedido.numero_pedido}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-start gap-2 sm:flex-col sm:items-end sm:gap-1.5">
              <span className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-[#EAF7EF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1E7A46]">
                <CheckCircle2 size={13} strokeWidth={2.25} />
                Pago
              </span>
              {formatarPeriodo(pedido.previsao_entrega_inicio, pedido.previsao_entrega_fim) && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-medium text-text-muted">
                  <Clock size={12} strokeWidth={1.75} className="text-accent-blue" />
                  Previsão: {formatarPeriodo(pedido.previsao_entrega_inicio, pedido.previsao_entrega_fim)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-accent-blue/10">
                <Truck size={20} strokeWidth={1.75} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-text-strong">{tituloStatus}</p>
                <p className="text-[12px] text-text-muted">
                  {faseAtual === 4 ? 'Recebido com sucesso' : 'Acompanhe o progresso abaixo'}
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-copper/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-copper" />
              {rotuloBadge}
            </span>
          </div>
        </div>
      </div>

      {/* Sem rastreamento (pedido ainda não pago) */}
      {!rastreamento && (
        <div className="relative overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-8 shadow-card">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-copper" />
          <p className="text-center text-[13px] text-text-muted">
            Seu pedido está sendo preparado. As informações de rastreio aparecerão aqui em breve.
          </p>
        </div>
      )}

      {/* Rastreamento existe mas ainda não liberado */}
      {rastreamento && !rastreioLiberado && (
        <div className="relative overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-8 shadow-card">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-copper" />
          <div className="mx-auto max-w-sm space-y-5">
            <div className="flex justify-center">
              <div className="flex h-10 items-end gap-[5px]">
                <span className="w-[5px] rounded-full bg-copper animate-pulse-scale" style={{ height: '32px', animationDelay: '0s' }} />
                <span className="w-[5px] rounded-full bg-copper animate-pulse-scale" style={{ height: '24px', animationDelay: '0.15s' }} />
                <span className="w-[5px] rounded-full bg-copper animate-pulse-scale" style={{ height: '40px', animationDelay: '0.3s' }} />
                <span className="w-[5px] rounded-full bg-copper animate-pulse-scale" style={{ height: '20px', animationDelay: '0.45s' }} />
                <span className="w-[5px] rounded-full bg-copper animate-pulse-scale" style={{ height: '36px', animationDelay: '0.6s' }} />
              </div>
            </div>
            <p className="text-center text-[14px] font-medium text-text-strong">
              Seu pedido foi confirmado e está sendo preparado.
            </p>
            <p className="text-center text-[13px] text-text-muted">
              O rastreamento detalhado ficará disponível em breve.
            </p>
            {rastreamento.liberado_em && (
              <p className="text-center text-[12px] font-medium text-accent-blue">
                Disponível a partir de {formatarDataHora(rastreamento.liberado_em)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Rastreio liberado */}
      {rastreamento && rastreioLiberado && (
        <div className="space-y-6">
          {/* Stepper de fases */}
          <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-card md:p-6">
            <div className="flex">
              {FASES.map((fase, i) => {
                const numero = i + 1
                const concluida = numero < faseAtual
                const atual = numero === faseAtual
                return (
                  <div key={fase.chave} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      <div
                        className={`h-[3px] flex-1 rounded-full ${
                          i === 0 ? 'bg-transparent' : concluida || atual ? 'bg-accent-blue' : 'bg-[#E5E7EB]'
                        }`}
                      />
                      <div
                        className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-colors ${
                          concluida
                            ? 'border-accent-blue bg-accent-blue text-white'
                            : atual
                              ? 'marker-ping border-accent-blue bg-white text-accent-blue'
                              : 'border-[#D0D5DD] bg-white text-text-muted'
                        }`}
                      >
                        {concluida ? <CheckCircle2 size={16} strokeWidth={2.25} /> : numero}
                      </div>
                      <div
                        className={`h-[3px] flex-1 rounded-full ${
                          i === FASES.length - 1 ? 'bg-transparent' : concluida || atual ? 'bg-accent-blue' : 'bg-[#E5E7EB]'
                        }`}
                      />
                    </div>
                    <p
                      className={`mt-2 hidden text-[11px] font-semibold uppercase tracking-[0.06em] sm:block ${
                        concluida ? 'text-text-strong' : atual ? 'text-accent-blue' : 'text-text-muted'
                      }`}
                    >
                      {fase.rotulo}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex justify-center sm:hidden">
              <p className="text-[12px] font-semibold text-accent-blue">
                {FASES[faseAtual - 1].rotulo}
              </p>
            </div>
          </div>

          {/* Rota do envio */}
          {eventoPostado && (
            <div className="relative overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-card md:p-7">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-accent-blue to-copper" />
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-blue">
                    Rota do envio
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-text-strong">
                    {subtituloRota}
                  </p>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full bg-accent-blue/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent-blue sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-blue" />
                  {legendaPosicao}
                </span>
              </div>

              <div className="relative">
                <div className="relative mx-3 mb-5 h-px md:mx-6">
                  <div className="absolute inset-0 rounded-full bg-[#E5E7EB]" />
                  <div className="route-dash absolute inset-y-0 left-0 right-0" />
                  <div className="route-dot-move absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-accent-blue shadow-[0_0_0_4px_rgba(0,109,170,0.15)]" />
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start sm:gap-2">
                  {/* ORIGEM */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-0">
                    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent-blue/10 ring-1 ring-accent-blue/20">
                      <Boxes size={20} strokeWidth={1.75} className="text-accent-blue" />
                    </div>
                    <div className="min-w-0 text-left sm:mt-2 sm:text-center">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">Origem</p>
                      <p className="break-words text-[13px] font-semibold leading-tight text-text-strong">
                        {origem}
                        {origemEstado && `/${origemEstado}`}
                      </p>
                      <p className="text-[11px] text-text-muted">CTCE-BH</p>
                    </div>
                  </div>

                  {/* POSIÇÃO ATUAL */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-0">
                    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-accent-blue/15 animate-pulse" />
                      <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-accent-blue/30 bg-white shadow-[0_2px_10px_rgba(0,109,170,0.18)]">
                        <Truck size={18} strokeWidth={1.75} className="animate-pulse text-accent-blue" />
                      </div>
                    </div>
                    <div className="min-w-0 text-left sm:mt-2 sm:text-center">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">Posição atual</p>
                      <p className="break-words text-[13px] font-semibold leading-tight text-text-strong">
                        {posicaoAtual}
                        {posicaoAtualEstado && `/${posicaoAtualEstado}`}
                      </p>
                      <p className="text-[11px] text-text-muted">{legendaPosicao}</p>
                    </div>
                  </div>

                  {/* DESTINO */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-0">
                    <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent-blue/10 ring-1 ring-accent-blue/20">
                      <MapPin size={20} strokeWidth={1.75} className="text-accent-blue" />
                    </div>
                    <div className="min-w-0 text-left sm:mt-2 sm:text-center">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">Destino</p>
                      <p className="break-words text-[13px] font-semibold leading-tight text-text-strong">
                        {destino}
                        {destinoEstado && `/${destinoEstado}`}
                      </p>
                      <p className="text-[11px] text-text-muted">{legendaDestino}</p>
                    </div>
                  </div>
                </div>
              </div>

              {ultimoEvento?.descricao && (
                <div className="mt-5 rounded-[12px] border border-accent-blue/15 bg-accent-blue/5 px-4 py-3">
                  <p className="flex items-start gap-2 text-[12px] leading-relaxed text-text-strong">
                    <Truck size={15} strokeWidth={1.75} className="mt-0.5 flex-shrink-0 text-accent-blue" />
                    <span>
                      <strong>{ultimoEvento.titulo}</strong> — {ultimoEvento.descricao}
                    </span>
                  </p>
                  <p className="mt-1 pl-[22px] text-[11px] font-medium text-accent-blue">
                    {formatarDataHora(ultimoEvento.data_evento)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Timeline de eventos */}
          <div className="relative overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-card md:p-8">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-copper" />
            <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Histórico do envio
            </p>

            <div className="relative flex flex-col">
              <span className="absolute bottom-4 left-[19px] top-4 w-px bg-[#E5E7EB]" aria-hidden />

              {eventosOrdenados.map((evento, idx) => {
                const emTransito = classificarEvento(evento.titulo) === 'em_transito'
                const ultimo = idx === eventosOrdenados.length - 1
                return (
                  <div key={evento.id} className="relative flex items-start gap-4 pb-8 last:pb-0">
                    <div className="relative z-10 mt-[3px] flex flex-shrink-0">
                      {emTransito ? (
                        ultimo ? (
                          <span className="marker-ping flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-accent-blue bg-white">
                            <span className="h-[7px] w-[7px] rounded-full bg-accent-blue" />
                          </span>
                        ) : (
                          <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-accent-blue bg-accent-blue">
                            <Truck size={10} strokeWidth={2.5} className="text-white" />
                          </span>
                        )
                      ) : (
                        <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-copper bg-copper">
                          <span className="h-[7px] w-[7px] rounded-full bg-white" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-text-strong">{evento.titulo}</p>
                      <p className="mt-0.5 text-[12px] font-medium text-accent-blue">
                        {formatarDataHora(evento.data_evento)}
                        {evento.cidade && ` — ${evento.cidade}`}
                        {evento.estado && `/${evento.estado}`}
                      </p>
                      {evento.descricao && (
                        <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
                          {evento.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rodapé */}
      {pedido.cliente?.cidade && pedido.cliente?.estado && (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-[14px] border border-black/[0.06] bg-white px-4 py-3">
          <MapPin size={14} strokeWidth={1.75} className="text-accent-blue" />
          <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
            Entrega para {pedido.cliente.cidade}/{pedido.cliente.estado}
          </p>
        </div>
      )}
    </>
  )
}
