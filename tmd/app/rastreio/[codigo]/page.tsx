import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import TimelineRastreio from './TimelineRastreio'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const BRAND = '#1E6BE6'
const ACCENT = '#2FC4EC'
const INK = '#1B2430'
const MUTED = '#5B6472'
const LINE = '#E3E7EE'
const PAGE = '#F4F6FA'

const LINKS_INSTITUCIONAIS = [
  { label: 'Política de Frete', href: '/politica-frete/index.html' },
  { label: 'Pagamento Seguro', href: '/pagamento-seguro/index.html' },
  { label: 'Termos de Uso', href: '/termos-uso/index.html' },
  { label: 'Trocas e Reembolso', href: '/trocas-reembolso/index.html' },
  { label: 'Quem Somos', href: '/quem-somos/index.html' },
  { label: 'Dúvidas Frequentes', href: '/duvidas-frequentes/index.html' },
  { label: 'Política de Privacidade', href: '/politica-privacidade/index.html' },
]

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Rastrear Pedido' }
}

function LogoPlugmax() {
  return (
    <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 22, color: BRAND, textDecoration: 'none', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }} aria-label="Plugmax">
      <svg width="26" height="26" viewBox="0 -4 96 104" fill="none" aria-hidden="true">
        <path d="M52 8 L12 56 L48 56 L44 88 L84 40 L48 40 Z" fill={BRAND}></path>
        <path d="M52 8 L12 56 L48 56 L44 88 L84 40 L48 40 Z" fill={ACCENT} transform="translate(48,48) scale(0.5) translate(-48,-48)"></path>
      </svg>
      <span>Plugmax</span>
    </a>
  )
}

function Cabecalho() {
  return (
    <header style={{ background: '#fff', borderBottom: `1px solid ${LINE}`, position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', boxSizing: 'border-box' }}>
        <LogoPlugmax />
        <a href="/" style={{ fontSize: 14, fontWeight: 600, color: MUTED, textDecoration: 'none', whiteSpace: 'nowrap' }}>← Voltar à loja</a>
      </div>
    </header>
  )
}

function Rodape() {
  return (
    <footer style={{ maxWidth: 760, margin: '0 auto', padding: '22px 20px 48px', fontSize: 13, color: MUTED, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 16, rowGap: 8, marginBottom: 14 }}>
        {LINKS_INSTITUCIONAIS.map((l) => (
          <a key={l.label} className="pmx-link" href={l.href} style={{ color: MUTED, textDecoration: 'none' }}>{l.label}</a>
        ))}
      </div>
      <div>Plugmax LTDA · R. Pestalozzi, 875, Sala 9 — Guilhermina, Praia Grande/SP — CEP 11702-020</div>
      <div style={{ marginTop: 4 }}>© {new Date().getFullYear()} Plugmax. Todos os direitos reservados.</div>
    </footer>
  )
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { margin: 0; background: ${PAGE}; color: ${INK}; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .pmx-link:hover { color: ${BRAND}; }
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PAGE }}>
        <Cabecalho />

        <main style={{ flex: 1, width: '100%', maxWidth: 640, margin: '0 auto', padding: '24px 0 0', boxSizing: 'border-box' }}>
          <TimelineRastreio
            pedido={data.pedido}
            rastreamento={rastreamento}
            rastreioLiberado={rastreioLiberado}
            eventos={eventos}
            codigo={codigo.toUpperCase()}
          />
        </main>

        <Rodape />
      </div>
    </>
  )
}