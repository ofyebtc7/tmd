export interface CidadeRota {
  id: string
  nome: string
  uf: string
  regiao: string
  nome_local: string | null
  latitude: number
  longitude: number
}

export interface EventoRota {
  titulo: string
  descricao: string
  cidade: string
  estado: string
  data_evento: string
}

export interface MontarRotaParams {
  cidades: CidadeRota[]
  clienteCidade: string
  clienteUf: string
  pagamentoEm: Date
}

export const VELOCIDADE_RODOVIARIA_KMH = 60
export const MIN_HORAS_VIAGEM = 6
export const HORAS_PREPARO = 3
export const HORAS_DESPACHO = 2

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const raioKm = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return 2 * raioKm * Math.asin(Math.sqrt(a))
}

function somarHoras(data: Date, horas: number): Date {
  return new Date(data.getTime() + horas * 3600 * 1000)
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Monta a sequência de eventos de rastreio de um envio.
 *
 * Rota: Belo Horizonte/MG (CTCE-BH, origem fixa) → CIDADE HUB → cliente.
 * CIDADE HUB = capital do estado do cliente (proxy do ponto mais próximo,
 * pois clientes fora de cidades_rota não têm coordenadas próprias). Quando o
 * hub é a própria origem (ex.: Contagem/MG), a rota é direta, sem etapa
 * intermediária.
 *
 * Cronograma:
 *  1. Pagamento aprovado (hora do pagamento real)
 *  2. Pedido preparado (+3h, mesma cidade da origem)
 *  3. Objeto postado (+2h, saída do CTCE)
 *  4. Chegou ao centro de distribuição do hub (+viagem via Haversine/60 km/h,
 *     com piso mínimo de 6h por trecho)
 *  5. Em trânsito (+2h de despacho local após a chegada)
 *
 * O evento "Entregue" NÃO é gerado aqui — vem de confirmação de entrega
 * separada. Eventos com data_evento futura aparecem sozinhos na página,
 * pois as RPCs de rastreio filtram por `data_evento <= now()`.
 */
export function montarEventosRota({
  cidades,
  clienteCidade,
  clienteUf,
  pagamentoEm,
}: MontarRotaParams): EventoRota[] {
  const origem = cidades.find((c) => c.uf === 'MG' && c.nome === 'Belo Horizonte')
  if (!origem) return []

  const hub = cidades.find((c) => c.uf === clienteUf) ?? null
  const rotaComHub = hub !== null && normalizar(hub.nome) !== normalizar(origem.nome)

  const origemLabel = `${origem.nome}/${origem.uf}`
  const destinoLabel = `${clienteCidade}/${clienteUf}`
  const hubLabel = hub !== null ? `${hub.nome}/${hub.uf}` : null
  const clienteEhCapital =
    hub !== null && normalizar(hub.nome) === normalizar(clienteCidade)

  const tPagamento = new Date(pagamentoEm.getTime())
  const tPreparado = somarHoras(tPagamento, HORAS_PREPARO)
  const tPostado = somarHoras(tPreparado, HORAS_DESPACHO)

  let tChegadaHub: Date | null = null
  if (rotaComHub && hub !== null) {
    const km = haversineKm(
      origem.latitude,
      origem.longitude,
      hub.latitude,
      hub.longitude
    )
    const horasViagem = Math.max(km / VELOCIDADE_RODOVIARIA_KMH, MIN_HORAS_VIAGEM)
    tChegadaHub = somarHoras(tPostado, horasViagem)
  }

  const tTransito = somarHoras(tChegadaHub ?? tPostado, HORAS_DESPACHO)

  const eventos: EventoRota[] = []

  eventos.push({
    titulo: 'Pagamento aprovado',
    descricao: 'Pagamento confirmado. Pedido recebido e aguardando preparação.',
    cidade: origem.nome,
    estado: origem.uf,
    data_evento: tPagamento.toISOString(),
  })

  eventos.push({
    titulo: 'Pedido preparado',
    descricao: `Pedido separado, embalado e etiquetado no Centro de Tratamento de Cargas Especiais dos Correios em ${origemLabel}.`,
    cidade: origem.nome,
    estado: origem.uf,
    data_evento: tPreparado.toISOString(),
  })

  eventos.push({
    titulo: 'Objeto postado',
    descricao:
      rotaComHub && hubLabel
        ? `Objeto saiu do Centro de Tratamento de Cargas Especiais dos Correios em ${origemLabel} rumo ao centro de distribuição de ${hubLabel}.`
        : `Objeto saiu do Centro de Tratamento de Cargas Especiais dos Correios em ${origemLabel} rumo a ${destinoLabel}.`,
    cidade: origem.nome,
    estado: origem.uf,
    data_evento: tPostado.toISOString(),
  })

  if (rotaComHub && hub !== null && tChegadaHub !== null) {
    eventos.push({
      titulo: `Chegou ao centro de distribuição de ${hub.nome}`,
      descricao: `Objeto chegou ao centro de distribuição de ${hub.nome} em ${hubLabel}.`,
      cidade: hub.nome,
      estado: hub.uf,
      data_evento: tChegadaHub.toISOString(),
    })
  }

  eventos.push({
    titulo: 'Em trânsito',
    descricao:
      rotaComHub && hubLabel
        ? clienteEhCapital
          ? `Objeto saiu do centro de distribuição de ${hubLabel} e está em trânsito para entrega em ${destinoLabel}.`
          : `Objeto saiu do centro de distribuição de ${hubLabel} rumo a ${destinoLabel}.`
        : `Objeto em trânsito de ${origemLabel} rumo a ${destinoLabel}.`,
    cidade: rotaComHub && hub !== null ? hub.nome : clienteCidade,
    estado: rotaComHub && hub !== null ? hub.uf : clienteUf,
    data_evento: tTransito.toISOString(),
  })

  return eventos
}
