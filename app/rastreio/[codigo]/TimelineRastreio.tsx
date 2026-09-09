'use client'

import { classificarEvento, derivarFase } from '@/lib/rastreio/status'

const COR_PRINCIPAL = '#13BF8C'
const COR_FOOTER = '#1e6be6'
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
  { chave: 'confirmado', rotulo: 'Pedido confirmado', subtitulo: 'Pagamento aprovado' },
  { chave: 'preparado', rotulo: 'Pedido preparado', subtitulo: 'Embalagem e etiqueta' },
  { chave: 'transito', rotulo: 'Em trânsito', subtitulo: 'Enviado pelos Correios' },
  { chave: 'entregue', rotulo: 'Entregue', subtitulo: 'Recebido com sucesso' },
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

const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } as const

const TruckIcon = ({ size = 18, color = COR_FOOTER }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h11v9H3z"></path><path d="M14 10h4l3 3v3h-7z"></path><circle cx="7.5" cy="18" r="1.5"></circle><circle cx="18.5" cy="18" r="1.5"></circle>
  </svg>
)

const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={COR_FOOTER} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

const BoxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COR_PRINCIPAL} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5v-8z"></path><path d="M3 8l9 5 9-5"></path><path d="M12 13v8"></path>
  </svg>
)

const PinIcon = ({ color = COR_FOOTER, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  } else if (eventoTransito && hubNome === clienteCidade && eventoTransito) {
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        body { margin: 0; }
        .rst-row-header { flex-direction: column; }
        .rst-row-footer { flex-direction: column; }
        .rst-grid-rota { grid-template-columns: 1fr; }
        @media (min-width: 640px) {
          .rst-row-header { flex-direction: row; align-items: center; justify-content: space-between; }
          .rst-row-footer { flex-direction: row; align-items: center; justify-content: space-between; }
          .rst-grid-rota { grid-template-columns: 1fr auto 1fr; }
        }
      `}</style>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px 12px', width: '100%', boxSizing: 'border-box', flex: 1 }}>

      {/* Cabeçalho do pedido */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.22em', color: COR_FOOTER, margin: '0 0 16px' }}>
          Rastreamento do pedido
        </p>

        <div style={{ ...card, overflow: 'hidden' }}>
          <div className="rst-row-header" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid #F1F2F4', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 14, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                <BoxIcon />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                  {pedido.produto.nome}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>
                  Pedido <strong style={{ color: '#111827' }}>#{pedido.numero_pedido}</strong>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: COR_FOOTER, fontWeight: 600 }}>
                  {codigo}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: '#EAF7EF', padding: '4px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1E7A46' }}>
                <CheckIcon size={13} /> Pago
              </span>
            </div>
          </div>

          <div className="rst-row-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TruckIcon size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{tituloStatus}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>
                  {faseAtual === 4 ? 'Recebido com sucesso' : 'Acompanhe o progresso abaixo'}
                </p>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, background: '#F0FDF4', padding: '4px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: COR_PRINCIPAL, width: 'fit-content' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: COR_PRINCIPAL, display: 'inline-block' }} />
              {tituloStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Sem rastreamento */}
      {!rastreamento && (
        <div style={{ ...card, padding: 32, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: COR_PRINCIPAL }} />
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
            Seu pedido está sendo preparado. As informações de rastreio aparecerão aqui em breve.
          </p>
        </div>
      )}

      {/* Rastreamento existe mas ainda não liberado */}
      {rastreamento && !rastreioLiberado && (
        <div style={{ ...card, padding: 32, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: COR_PRINCIPAL }} />
          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Seu pedido foi confirmado e está sendo preparado.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
              O rastreamento detalhado ficará disponível em breve.
            </p>
            {rastreamento.liberado_em && (
              <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 600, color: COR_FOOTER }}>
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
                      <div style={{ height: 3, flex: 1, background: i === 0 ? 'transparent' : concluida || atual ? COR_FOOTER : '#E5E7EB', borderRadius: 999 }} />
                      <div style={{
                        width: 36, height: 36, flexShrink: 0, borderRadius: 999, border: '2px solid',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                        ...(concluida
                          ? { background: COR_FOOTER, borderColor: COR_FOOTER, color: '#fff' }
                          : atual
                            ? { background: '#fff', borderColor: COR_FOOTER, color: COR_FOOTER }
                            : { background: '#fff', borderColor: '#D0D5DD', color: '#6B7280' }),
                      }}>
                        {concluida ? <CheckIcon size={16} /> : numero}
                      </div>
                      <div style={{ height: 3, flex: 1, background: i === FASES.length - 1 ? 'transparent' : concluida || atual ? COR_FOOTER : '#E5E7EB', borderRadius: 999 }} />
                    </div>
                    <p style={{ margin: '10px 0 0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: concluida ? '#111827' : atual ? COR_FOOTER : '#6B7280', textAlign: 'center' }}>
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
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${COR_PRINCIPAL}, ${COR_FOOTER})` }} />
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: COR_FOOTER }}>
                  Rota do envio
                </p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{subtituloRota}</p>
              </div>

              <div className="rst-grid-rota" style={{ display: 'grid', gap: 16 }}>
                {/* ORIGEM */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 999, background: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BoxIcon />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Origem</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#111827' }}>{ORIGEM}/{ORIGEM_UF}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>CTCE-PG</p>
                  </div>
                </div>

                {/* POSIÇÃO ATUAL */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 999, border: '1px solid rgba(0,109,170,0.3)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,109,170,0.18)' }}>
                    <TruckIcon size={16} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Posição atual</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#111827' }}>{posicaoAtual}{posicaoAtualEstado && `/${posicaoAtualEstado}`}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{legendaPosicao}</p>
                  </div>
                </div>

                {/* DESTINO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 999, background: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PinIcon size={20} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF' }}>Destino</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#111827' }}>{destino}{destinoEstado && `/${destinoEstado}`}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{legendaDestino}</p>
                  </div>
                </div>
              </div>

              {ultimoEvento?.descricao && (
                <div style={{ marginTop: 16, background: '#F0FDF9', border: '1px solid rgba(19,191,140,0.25)', borderRadius: 12, padding: 14 }}>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#111827', display: 'flex', gap: 8 }}>
                    <span style={{ marginTop: 1, flexShrink: 0, color: COR_PRINCIPAL }}><TruckIcon size={14} color={COR_PRINCIPAL} /></span>
                    <span><strong>{ultimoEvento.titulo}</strong> — {ultimoEvento.descricao}</span>
                  </p>
                  <p style={{ margin: '6px 0 0 22px', fontSize: 11, fontWeight: 600, color: COR_FOOTER }}>
                    {formatarDataHora(ultimoEvento.data_evento)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Timeline de eventos */}
          <div style={{ ...card, padding: 24, marginTop: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: COR_PRINCIPAL }} />
            <p style={{ margin: '0 0 20px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#9CA3AF' }}>
              Histórico do envio
            </p>

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <span style={{ position: 'absolute', left: 19, top: 16, bottom: 16, width: 1, background: '#E5E7EB' }} />

              {eventosOrdenados.map((evento, idx) => {
                const emTransito = classificarEvento(evento.titulo, evento.descricao) === 'em_transito'
                const ultimo = idx === eventosOrdenados.length - 1
                return (
                  <div key={evento.id} style={{ position: 'relative', display: 'flex', gap: 16, paddingBottom: idx === eventosOrdenados.length - 1 ? 0 : 30 }}>
                    <div style={{ position: 'relative', zIndex: 1, marginTop: 2, flexShrink: 0 }}>
                      {emTransito ? (
                        <div style={{ width: 19, height: 19, borderRadius: 999, background: COR_FOOTER, border: '2px solid', borderColor: COR_FOOTER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TruckIcon size={10} color="#fff" />
                        </div>
                      ) : (
                        <div style={{ width: 19, height: 19, borderRadius: 999, background: COR_PRINCIPAL, border: '2px solid', borderColor: COR_PRINCIPAL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ width: 7, height: 7, borderRadius: 999, background: '#fff' }} />
                        </div>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>{evento.titulo}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 500, color: COR_FOOTER }}>
                        {formatarDataHora(evento.data_evento)}
                        {evento.cidade && ` — ${evento.cidade}`}
                        {evento.estado && `/${evento.estado}`}
                      </p>
                      {evento.descricao && (
                        <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.6, color: '#6B7280' }}>{evento.descricao}</p>
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
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #E2E8F0', background: '#fff', borderRadius: 14, padding: '12px 16px' }}>
          <PinIcon size={14} />
          <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#9CA3AF' }}>
            Entrega para {pedido.cliente.cidade}/{pedido.cliente.estado}
          </p>
        </div>
      )}

      {/* Rodapé */}
      <div style={{ marginTop: 24, textAlign: 'center', padding: '8px 0 24px' }} />
      </div>
    </>
  )
}