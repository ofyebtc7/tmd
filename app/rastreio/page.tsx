'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COR_PRINCIPAL = '#13BF8C'
const COR_FOOTER = '#1e6be6'

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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        .rst-body { margin: 0; font-family: 'Poppins', system-ui, sans-serif; background: #F8F9FB; }
      `}</style>
      <div className="rst-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <img src="/img/f871c3e2.png" alt="Plugmax" style={{ height: 30, objectFit: 'contain' }} />
            <a href="/" style={{ fontSize: 13, fontWeight: 600, color: COR_FOOTER, textDecoration: 'none' }}>Voltar à loja</a>
          </div>
        </div>

        <div style={{ flex: 1, margin: '0 auto', padding: '40px 20px 24px', width: '100%', maxWidth: 560, boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: 18, background: '#EAF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={COR_FOOTER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8l-9-5-9 5v8l9 5 9-5v-8z"></path>
                <path d="M3 8l9 5 9-5"></path>
                <path d="M12 13v8"></path>
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#111827' }}>Rastrear pedido</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '8px 0 0', lineHeight: 1.6 }}>
              Acompanhe a entrega do seu pedido. Digite o código enviado por e-mail ou WhatsApp.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label htmlFor="codigo" style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: -4 }}>
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
                style={{ width: '100%', height: 50, border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '0 14px', fontSize: 15, textTransform: 'uppercase', color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                style={{ height: 50, background: COR_PRINCIPAL, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: input.trim() ? 'pointer' : 'not-allowed', opacity: input.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Buscar pedido
              </button>
            </form>

            <div style={{ marginTop: 18, background: '#F8F9FB', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.6, display: 'flex', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COR_FOOTER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Não encontrou seu código? Ele está na confirmação do pedido enviada por WhatsApp e por e-mail. Em caso de dúvidas, fale com nosso atendimento.
              </p>
            </div>
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