const COR_FOOTER = '#1e6be6'
const COR_PRINCIPAL = '#13BF8C'

export default function RastreioNaoEncontrado() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        body { margin: 0; font-family: 'Poppins', system-ui, sans-serif; background: #F8F9FB; }
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8F9FB' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <img src="/img/f871c3e2.png" alt="Plugmax" style={{ height: 30, objectFit: 'contain' }} />
            <a href="/" style={{ fontSize: 13, fontWeight: 600, color: COR_FOOTER, textDecoration: 'none' }}>Voltar à loja</a>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 32, textAlign: 'center', boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 18, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>Código não encontrado</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '10px 0 24px', lineHeight: 1.6 }}>
              O código de rastreio informado não foi encontrado. Verifique o código e tente novamente.
            </p>
            <a
              href="/rastreio"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 48, background: '#fff', color: COR_FOOTER, border: `1.5px solid ${COR_FOOTER}`, borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Voltar para busca
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: COR_FOOTER, color: '#fff', padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 12 }}>Plugmax © {new Date().getFullYear()} — Todos os direitos reservados.</p>
        </div>
      </div>
    </>
  )
}