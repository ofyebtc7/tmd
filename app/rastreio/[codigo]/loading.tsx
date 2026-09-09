const COR_FOOTER = '#1e6be6'

export default function RastreioCodigoLoading() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        body { margin: 0; font-family: 'Poppins', system-ui, sans-serif; background: #F8F9FB; }
        @keyframes rst-sk-float { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        .rst-sk { animation: rst-sk-float 1.4s ease-in-out infinite; background: #E8EBF0; border-radius: 6px; }
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8F9FB' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <img src="/img/f871c3e2.png" alt="Plugmax" style={{ height: 30, objectFit: 'contain' }} />
            <a href="/" style={{ fontSize: 13, fontWeight: 600, color: COR_FOOTER, textDecoration: 'none' }}>Voltar à loja</a>
          </div>
        </div>

        <div style={{ flex: 1, margin: '0 auto', padding: '40px 20px 24px', width: '100%', maxWidth: 560, boxSizing: 'border-box' }}>
          <div className="rst-sk" style={{ height: 14, width: 240, margin: '0 auto 20px', borderRadius: 999 }} />

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="rst-sk" style={{ height: 12, width: 160, borderRadius: 999 }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <div className="rst-sk" style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="rst-sk" style={{ height: 12, width: '70%', borderRadius: 999 }} />
                <div className="rst-sk" style={{ height: 10, width: '45%', borderRadius: 999 }} />
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
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
        </div>

        {/* Footer */}
        <div style={{ background: COR_FOOTER, color: '#fff', padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 12 }}>Plugmax © {new Date().getFullYear()} — Todos os direitos reservados.</p>
        </div>
      </div>
    </>
  )
}