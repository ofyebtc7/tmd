'use client'

import { classificarEvento, derivarFase } from '@/lib/rastreio/status'

const BRAND = '#1E6BE6'
const BRAND_DK = '#1751AF'
const ACCENT = '#2FC4EC'
const INK = '#1B2430'
const MUTED = '#5B6472'
const LINE = '#E3E7EE'
const SUCCESS = '#13BF8C'
const SUCCESS_BG = '#EAF7EF'
const SUCCESS_TXT = '#1E7A46'
const ORIGEM = 'Praia Grande'
const ORIGEM_UF = 'SP'

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
  codigo: string
}

const FASES = [
  { chave: 'confirmado', rotulo: 'Pedido confirmado' },
  { chave: 'preparado', rotulo: 'Pedido preparado' },
  { chave: 'transito', rotulo: 'Em trânsito' },
  { chave: 'entregue', rotulo: 'Entregue' },
]

const NUMERO_FASE: Record<string, number> = {
  confirmado: 1,
  preparado: 2,
  em_transito: 3,
  entregue: 4,
}

const ROTULO_BADGE: Record<number, string> = {
  1: 'Pedido confirmado',
  2: 'Pedido preparado',
  3: 'Em trânsito',
  4: 'Entregue',
}

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
  if (inicio && fim) return `${formatarData(inicio)} — ${formatarData(fim)}`
  return formatarData(inicio || fim || '')
}

const card = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: '0 1px 2px rgba(27,36,48,0.04)' } as const

const TruckIcon = ({ size = 18, color = BRAND }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h11v9H3z"></path><path d="M14 10h4l3 3v3h-7z"></path><circle cx="7.5" cy="18" r="1.5"></circle><circle cx="18.5" cy="18" r="1.5"></circle>
  </svg>
)

const CheckIcon = ({ size = 16, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const BoxIcon = ({ color = BRAND }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5v-8z"></path><path d="M3 8l9 5 9-5"></path><path d="M12 13v8"></path>
  </svg>
)

const PinIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
  </svg>
)

export default function TimelineRastreio({ pedido, rastreamento, rastreioLiberado, eventos, codigo }: Props) {
  const eventosOrdenados = [...eventos].sort(
    (a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime()
  )

  const faseAtual = NUMERO_FASE[derivarFase(eventosOrdenados)] ?? 1
  const tituloStatus = ROTULO_BADGE[faseAtual] ?? 'Pedido confirmado'
  const ultimoEvento = eventosOrdenados[eventosOrdenados.length - 1]

  const clienteCidade = pedido.cliente?.cidade ?? 'Destino'
  const clienteEstado = pedido.cliente?.estado ?? ''

  const eventoPostado = eventosOrdenados.find((e) => e.titulo === 'Objeto postado')
  const eventoChegouHub = eventosOrdenados.find((e) => e.titulo?.startsWith('Chegou ao centro'))
  const eventoTransito = eventosOrdenados.find((e) => e.titulo === 'Em trânsito')
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
  } else if (eventoTransito && hubNome === clienteCidade) {
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

  const periodoPrevisao = formatarPeriodo(pedido.previsao_entrega_inicio, pedido.previsao_entrega_fim)

  return (
    <>
      <style>{`
        .rst-row-header { flex-direction: column; }
        .rst-row-footer { flex-direction: column; }
        .rst-grid-rota { grid-template-columns: 1fr; }
        @media (min-width: 640px) {
          .rst-row-header { flex-direction: row; align-items: center; justify-content: space-between; }
          .rst-row-footer { flex-direction: row; align-items: center; justify-content: space-between; }
          .rst-grid-rota { grid-template-columns: 1fr auto 1fr; }
        }
        @keyframes pmx-ping { 0% { box-shadow: 0 0 0 0 rgba(30,107,230,.35); } 100% { box-shadow: 0 0 0 9px rgba(30,107,230,0); } }
        .pmx-ping { animation: pmx-ping 1.6s cubic-bezier(0,0,.2,1) infinite; }
      `}</style>

      <div style={{ margin: '0 auto', padding: '8px 16px 12px', width: '100%', boxSizing: 'border-box' }}>

      {/* Cabeçalho do pedido */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: BRAND, margin: '0 0 16px' }}>
          Rastreamento do pedido
        </p>

        <div style={{ ...card, overflow: 'hidden' }}>
          <div className="rst-row-header" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderBottom: `1px solid #F1F2F4`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 14, background: 'rgba(30,107,230,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${LINE}` }}>
                <BoxIcon />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240, letterSpacing: '-0.01em' }}>
                  {pedido.produto.nome}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: MUTED }}>
                  Pedido <strong style={{ color: INK }}>#{pedido.numero_pedido}</strong>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: BRAND, fontWeight: 700, letterSpacing: '0.06em' }}>
                  {codigo}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: SUCCESS_BG, padding: '4px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: SUCCESS_TXT }}>
                <CheckIcon size={12} color={SUCCESS_TXT} /> Pago
              </span>
              {periodoPrevisao && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: MUTED, padding: '4px 10px', border: `1px solid ${LINE}`, borderRadius: 999, background: '#fff' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Previsão: {periodoPrevisao}
                </span>
              )}
            </div>
          </div>

          <div className="rst-row-footer" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(30,107,230,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TruckIcon size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: INK }}>{tituloStatus}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: MUTED }}>
                  {faseAtual === 4 ? 'Recebido com sucesso' : 'Acompanhe o progresso abaixo'}
                </p>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: 'rgba(30,107,230,0.08)', padding: '4px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: BRAND, width: 'fit-content' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: BRAND, display: 'inline-block' }} />
              {tituloStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Sem rastreamento */}
      {!rastreamento && (
        <div style={{ ...card, padding: 28, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: BRAND }} />
          <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
            Seu pedido está sendo preparado. As informações de rastreio aparecerão aqui em breve.
          </p>
        </div>
      )}

      {/* Rastreamento existe mas ainda não liberado */}
      {rastreamento && !rastreioLiberado && (
        <div style={{ ...card, padding: 28, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: BRAND }} />
          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: INK }}>
              Seu pedido foi confirmado e está sendo preparado.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
              O rastreamento detalhado ficará disponível em breve.
            </p>
            {rastreamento.liberado_em && (
              <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 700, color: BRAND }}>
                Disponível a partir de {formatarDataHora(rastreamento.liberado_em)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Rastreio liberado */}
      {rastreamento && rastreioLiberado && (
        <>
          {/* Stepper de fases */}
          <div style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex' }}>
              {FASES.map((fase, i) => {
                const numero = i + 1
                const concluida = numero < faseAtual
                const atual = numero === faseAtual
                return (
                  <div key={fase.chave} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <div style={{ height: 3, flex: 1, background: i === 0 ? 'transparent' : concluida || atual ? BRAND : LINE, borderRadius: 999 }} />
                      <div style={{
                        width: 36, height: 36, flexShrink: 0, borderRadius: 999, border: '2px solid',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                        ...(concluida
                          ? { background: BRAND, borderColor: BRAND, color: '#fff' }
                          : atual
                            ? { background: '#fff', borderColor: BRAND, color: BRAND }
                            : { background: '#fff', borderColor: LINE, color: MUTED }),
                      }}>
                        {concluida ? <CheckIcon size={15} /> : numero}
                      </div>
                      <div style={{ height: 3, flex: 1, background: i === FASES.length - 1 ? 'transparent' : concluida || atual ? BRAND : LINE, borderRadius: 999 }} />
                    </div>
                    <p style={{ margin: '10px 0 0', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: concluida ? INK : atual ? BRAND : MUTED, textAlign: 'center' }}>
                      {fase.rotulo}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rota do envio */}
          {eventoPostado && (
            <div style={{ ...card, padding: 24, marginTop: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${BRAND}, ${ACCENT})` }} />
              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: BRAND }}>
                    Rota do envio
                  </p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>{subtituloRota}</p>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: 'rgba(30,107,230,0.08)', padding: '5px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: BRAND, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <span className="pmx-ping" style={{ width: 7, height: 7, borderRadius: 999, background: BRAND, display: 'inline-block' }} />
                  {legendaPosicao}
                </span>
              </div>

              <div className="rst-grid-rota" style={{ display: 'grid', gap: 14 }}>
                {/* ORIGEM */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 999, background: 'rgba(30,107,230,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BoxIcon />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED }}>Origem</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ORIGEM}/{ORIGEM_UF}</p>
                    <p style={{ margin: 0, fontSize: 11, color: MUTED }}>CTCE-PG</p>
                  </div>
                </div>

                {/* POSIÇÃO ATUAL */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 999, border: `1.5px solid ${BRAND}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(30,107,230,0.18)' }}>
                    <TruckIcon size={15} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED }}>Posição atual</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{posicaoAtual}{posicaoAtualEstado && `/${posicaoAtualEstado}`}</p>
                    <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{legendaPosicao}</p>
                  </div>
                </div>

                {/* DESTINO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 999, background: 'rgba(30,107,230,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PinIcon size={19} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: MUTED }}>Destino</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{destino}{destinoEstado && `/${destinoEstado}`}</p>
                    <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{legendaDestino}</p>
                  </div>
                </div>
              </div>

              {ultimoEvento?.descricao && (
                <div style={{ marginTop: 16, background: 'rgba(30,107,230,0.05)', border: `1px solid rgba(30,107,230,0.15)`, borderRadius: 12, padding: 14 }}>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: INK, display: 'flex', gap: 8 }}>
                    <span style={{ marginTop: 1, flexShrink: 0, color: BRAND }}><TruckIcon size={14} /></span>
                    <span><strong>{ultimoEvento.titulo}</strong> — {ultimoEvento.descricao}</span>
                  </p>
                  <p style={{ margin: '6px 0 0 22px', fontSize: 11, fontWeight: 700, color: BRAND }}>
                    {formatarDataHora(ultimoEvento.data_evento)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Timeline de eventos */}
          <div style={{ ...card, padding: 24, marginTop: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: BRAND }} />
            <p style={{ margin: '0 0 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: MUTED }}>
              Histórico do envio
            </p>

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <span style={{ position: 'absolute', left: 19, top: 16, bottom: 16, width: 1, background: LINE }} />

              {eventosOrdenados.map((evento, idx) => {
                const emTransito = classificarEvento(evento.titulo, evento.descricao) === 'em_transito'
                const ultimo = idx === eventosOrdenados.length - 1
                return (
                  <div key={evento.id} style={{ position: 'relative', display: 'flex', gap: 16, paddingBottom: idx === eventosOrdenados.length - 1 ? 0 : 30 }}>
                    <div style={{ position: 'relative', zIndex: 1, marginTop: 2, flexShrink: 0 }}>
                      {emTransito ? (
                        ultimo ? (
                          <span className="pmx-ping" style={{ width: 19, height: 19, borderRadius: 999, border: `2px solid ${BRAND}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ width: 7, height: 7, borderRadius: 999, background: BRAND }} />
                          </span>
                        ) : (
                          <span style={{ width: 19, height: 19, borderRadius: 999, background: BRAND, border: `2px solid ${BRAND}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TruckIcon size={10} color="#fff" />
                          </span>
                        )
                      ) : (
                        <span style={{ width: 19, height: 19, borderRadius: 999, background: SUCCESS, border: `2px solid ${SUCCESS}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ width: 7, height: 7, borderRadius: 999, background: '#fff' }} />
                        </span>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: INK, letterSpacing: '-0.01em' }}>{evento.titulo}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: BRAND }}>
                        {formatarDataHora(evento.data_evento)}
                        {evento.cidade && ` — ${evento.cidade}`}
                        {evento.estado && `/${evento.estado}`}
                      </p>
                      {evento.descricao && (
                        <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.6, color: MUTED }}>{evento.descricao}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Entrega */}
      {pedido.cliente?.cidade && pedido.cliente?.estado && (
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `1px solid ${LINE}`, background: '#fff', borderRadius: 12, padding: '12px 16px' }}>
          <PinIcon size={14} />
          <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: MUTED }}>
            Entrega para {pedido.cliente.cidade}/{pedido.cliente.estado}
          </p>
        </div>
      )}
      </div>
    </>
  )
}