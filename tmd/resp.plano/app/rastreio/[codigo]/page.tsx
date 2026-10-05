import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import HeaderPublico from '@/app/components/HeaderPublico'
import FooterLoja from '@/app/components/FooterLoja'
import TimelineRastreio from './TimelineRastreio'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Rastrear Pedido' }
}

interface RastreioResult {
  pedido: {
    id: string
    numero_pedido: string
    status: string
    token_rastreamento: string
    previsao_entrega_inicio: string | null
    previsao_entrega_fim: string | null
    produto: { nome: string; imagem_url: string | null }
    cliente: { nome: string; cidade: string; estado: string }
  }
  rastreamentos: {
    id: string
    status: string
    previsao_inicio: string | null
    previsao_fim: string | null
    liberado_em: string | null
    rastreio_liberado: boolean
    eventos: {
      id: string
      titulo: string
      descricao: string | null
      cidade: string | null
      estado: string | null
      status: string
      data_evento: string
    }[]
  }[]
}

export default async function RastreioPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  const supabase = await createClient()

  const { data: result, error } = await supabase.rpc(
    'buscar_rastreio_por_codigo',
    { p_codigo: codigo }
  )

  if (error || !result) {
    notFound()
  }

  const data = result as unknown as RastreioResult
  const rastreamento = data.rastreamentos[0] ?? null
  const rastreioLiberado = rastreamento?.rastreio_liberado ?? false
  const eventos = rastreamento?.eventos ?? []

  return (
    <div className="min-h-screen bg-bg-page">
      <HeaderPublico />
      <div className="max-w-xl mx-auto py-8 px-4">

        <TimelineRastreio
          pedido={data.pedido}
          rastreamento={rastreamento}
          rastreioLiberado={rastreioLiberado}
          eventos={eventos}
        />
      </div>
      <FooterLoja />
    </div>
  )
}
