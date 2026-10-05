export type FaseRastreio = 'confirmado' | 'preparado' | 'em_transito' | 'entregue'
export type StatusEnvio = 'preparando' | 'em_transito' | 'entregue'

export interface EventoStatus {
  titulo: string
  descricao?: string | null
}

const PALAVRAS_TRANSITO = [
  'saiu',
  'transito',
  'ctce',
  'rota',
  'despacho',
  'transportadora',
  'encaminhado',
  'sda',
  'unidade',
  'centro regional',
  'centro de distribuicao',
  'centro de tratamento',
  'chegou',
]

const PALAVRAS_PREPARADO = [
  'preparado',
  'prepara',
  'separado',
  'postado',
  'embalagem',
  'etiqueta',
]

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function classificarEvento(titulo: string, descricao?: string | null): FaseRastreio {
  const t = normalizar(`${titulo} ${descricao ?? ''}`)
  if (t.includes('entregue')) return 'entregue'
  if (PALAVRAS_TRANSITO.some((palavra) => t.includes(palavra))) return 'em_transito'
  if (PALAVRAS_PREPARADO.some((palavra) => t.includes(palavra))) return 'preparado'
  return 'confirmado'
}

const ORDEM: Record<FaseRastreio, number> = {
  confirmado: 0,
  preparado: 1,
  em_transito: 2,
  entregue: 3,
}

export function derivarFase(eventos: EventoStatus[]): FaseRastreio {
  let fase: FaseRastreio = 'confirmado'
  for (const evento of eventos) {
    const f = classificarEvento(evento.titulo, evento.descricao)
    if (ORDEM[f] > ORDEM[fase]) fase = f
  }
  return fase
}

export function derivarStatus(eventos: EventoStatus[]): StatusEnvio {
  switch (derivarFase(eventos)) {
    case 'entregue':
      return 'entregue'
    case 'em_transito':
      return 'em_transito'
    default:
      return 'preparando'
  }
}