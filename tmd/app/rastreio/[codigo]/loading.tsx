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

export default function RastreioCodigoLoading() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { margin: 0; background: ${PAGE}; color: ${INK}; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        @keyframes rst-sk-float { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        .rst-sk { animation: rst-sk-float 1.4s ease-in-out infinite; background: #E6EAEF; border-radius: 6px; }
        .pmx-link:hover { color: ${BRAND}; }
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: PAGE }}>
        {/* Header */}
        <header style={{ background: '#fff', borderBottom: `1px solid ${LINE}`, position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', boxSizing: 'border-box' }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 22, color: BRAND, textDecoration: 'none', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }} aria-label="Plugmax">
              <svg width="26" height="26" viewBox="0 -4 96 104" fill="none" aria-hidden="true">
                <path d="M52 8 L12 56 L48 56 L44 88 L84 40 L48 40 Z" fill={BRAND}></path>
                <path d="M52 8 L12 56 L48 56 L44 88 L84 40 L48 40 Z" fill={ACCENT} transform="translate(48,48) scale(0.5) translate(-48,-48)"></path>
              </svg>
              <span>Plugmax</span>
            </a>
            <a href="/" style={{ fontSize: 14, fontWeight: 600, color: MUTED, textDecoration: 'none', whiteSpace: 'nowrap' }}>← Voltar à loja</a>
          </div>
        </header>

        <main style={{ flex: 1, margin: '0 auto', padding: '32px 16px 12px', width: '100%', maxWidth: 640, boxSizing: 'border-box' }}>
          <div className="rst-sk" style={{ height: 14, width: 240, margin: '0 auto 20px', borderRadius: 999 }} />

          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 24, boxShadow: '0 1px 2px rgba(27,36,48,0.04)' }}>
            <div className="rst-sk" style={{ height: 12, width: 160, borderRadius: 999 }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <div className="rst-sk" style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="rst-sk" style={{ height: 12, width: '70%', borderRadius: 999 }} />
                <div className="rst-sk" style={{ height: 10, width: '45%', borderRadius: 999 }} />
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 24, marginTop: 16, boxShadow: '0 1px 2px rgba(27,36,48,0.04)' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingTop: i === 0 ? 0 : 24 }}>
                <div className="rst-sk" style={{ width: 26, height: 26, borderRadius: 999, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="rst-sk" style={{ height: 12, width: '80%', borderRadius: 999 }} />
                  <div className="rst-sk" style={{ height: 10, width: '50%', borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer style={{ maxWidth: 760, margin: '0 auto', padding: '22px 20px 48px', fontSize: 13, color: MUTED, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 16, rowGap: 8, marginBottom: 14 }}>
            {LINKS_INSTITUCIONAIS.map((l) => (
              <a key={l.label} className="pmx-link" href={l.href} style={{ color: MUTED, textDecoration: 'none' }}>{l.label}</a>
            ))}
          </div>
          <div>Plugmax LTDA · R. Pestalozzi, 875, Sala 9 — Guilhermina, Praia Grande/SP — CEP 11702-020</div>
          <div style={{ marginTop: 4 }}>© {new Date().getFullYear()} Plugmax. Todos os direitos reservados.</div>
        </footer>
      </div>
    </>
  )
}