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

export default function RastreioNaoEncontrado() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { margin: 0; background: ${PAGE}; color: ${INK}; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
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

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 32, textAlign: 'center', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(27,36,48,0.04)' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 18, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: INK }}>Código não encontrado</h1>
            <p style={{ fontSize: 13, color: MUTED, margin: '10px 0 24px', lineHeight: 1.6 }}>
              O código de rastreio informado não foi encontrado. Verifique o código e tente novamente.
            </p>
            <a
              href="/rastreio"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 48, background: '#fff', color: BRAND, border: `1.5px solid ${BRAND}`, borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Voltar para busca
            </a>
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