import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import TimelineRastreio from './TimelineRastreio'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const COR_FOOTER = '#1e6be6'

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        body { margin: 0; font-family: 'Poppins', system-ui, sans-serif; background: #F8F9FB; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <img src="/img/f871c3e2.png" alt="Plugmax" style={{ height: 30, objectFit: 'contain' }} />
            <a href="/" style={{ fontSize: 13, fontWeight: 600, color: COR_FOOTER, textDecoration: 'none' }}>Voltar à loja</a>
          </div>
        </div>

        <TimelineRastreio
          pedido={data.pedido}
          rastreamento={rastreamento}
          rastreioLiberado={rastreioLiberado}
          eventos={eventos}
          codigo={codigo.toUpperCase()}
        />

        <div style={{ background: COR_FOOTER, color: '#fff', padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 12 }}>Plugmax © {new Date().getFullYear()} — Todos os direitos reservados.</p>
        </div>
      </div>
    </>
  )
}