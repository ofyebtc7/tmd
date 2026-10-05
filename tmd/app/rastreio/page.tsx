'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BRAND = '#1E6BE6'
const BRAND_DK = '#1751AF'
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

export default function BuscaRastreioPage() {
  const [input, setInput] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const codigo = input.toUpperCase().replace(/\s/g, '')
    if (!codigo) return
    router.push(`/rastreio/${codigo}`)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { margin: 0; background: ${PAGE}; color: ${INK}; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .pmx-input { transition: border-color .15s, box-shadow .15s; }
        .pmx-input:focus { border-color: ${BRAND}; box-shadow: 0 0 0 3px rgba(30,107,230,.12); outline: none; }
        .pmx-btn { transition: background-color .15s; }
        .pmx-btn:hover:not(:disabled) { background: ${BRAND_DK}; }
        .pmx-link:hover { color: ${BRAND}; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PAGE }}>
        <Cabecalho />

        <main style={{ flex: 1, maxWidth: 560, margin: '0 auto', padding: '40px 20px 32px', width: '100%', boxSizing: 'border-box' }}>
          {/* Cabeçalho da página */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 18, background: 'rgba(30,107,230,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8l-9-5-9 5v8l9 5 9-5v-8z"></path>
                <path d="M3 8l9 5 9-5"></path>
                <path d="M12 13v8"></path>
              </svg>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: INK }}>Rastrear pedido</h1>
            <p style={{ fontSize: 14, color: MUTED, margin: '8px 0 0', lineHeight: 1.6 }}>
              Acompanhe em tempo real a entrega do seu pedido. Digite o código enviado por e-mail ou WhatsApp.
            </p>
          </div>

          {/* Card de busca */}
          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 24, boxShadow: '0 1px 2px rgba(27,36,48,0.04)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label htmlFor="codigo" style={{ fontSize: 14, fontWeight: 600, color: INK }}>
                Código de rastreio
              </label>
              <input
                id="codigo"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: PLX7X9K2M4Q"
                autoComplete="off"
                spellCheck={false}
                className="pmx-input"
                style={{ width: '100%', height: 50, border: `1.5px solid ${LINE}`, borderRadius: 10, padding: '0 14px', fontSize: 15, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: INK, background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="pmx-btn"
                style={{ height: 50, background: BRAND, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: input.trim() ? 'pointer' : 'not-allowed', opacity: input.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Buscar pedido
              </button>
            </form>

            <div style={{ marginTop: 18, background: PAGE, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
              <p style={{ margin: 0, fontSize: 12, color: MUTED, lineHeight: 1.6, display: 'flex', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                Não encontrou seu código? Ele está na confirmação do pedido enviada por WhatsApp e por e-mail. Em caso de dúvidas, fale com nosso atendimento.
              </p>
            </div>
          </div>
        </main>

        <Rodape />
      </div>
    </>
  )
}